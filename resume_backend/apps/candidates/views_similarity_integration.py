"""
Resume upload view with similarity detection integration.
"""

import os
from contextlib import suppress
from django.shortcuts import render
from django.utils import timezone
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.http import JsonResponse, HttpResponse
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response

from .models import Candidate, Resume
from .serializers import ResumeSerializer
from .utils import extract_text_from_pdf, extract_text_from_docx
from .services.parser import parse_resume
from .services.duplicate_checker import find_existing_candidate
from .services.email_ingestion import process_email_resume
from .services.summary import summary_service
from .services.skills import skill_service
from .services.chunking import chunk_and_store_resume
from .services.embeddings import service as embedding_service
from .services.similarity_detection import similarity_detection_service


# Constants & Helpers
EXT_MAP = {".pdf": extract_text_from_pdf, ".docx": extract_text_from_docx}
ATTRS = ['name', 'email', 'phone', 'skills', 'education', 'experience', 'projects']


def sanitize_filename(fn):
    return "".join(c for c in os.path.basename(fn) if c.isalnum() or c in "_.") or "resume"


def create_or_get_candidate(data, created_by=None):
    ident = {k.lower(): data.get(k) or data.get(k.lower()) for k in ["Email", "Phone", "Name"]}
    if not any(ident.values()): raise ValueError("No identification found")  # noqa: E701
    
    # Truncate phone to max 20 characters (database constraint)
    if ident.get("phone") and len(ident["phone"]) > 20:
        ident["phone"] = ident["phone"][:20]
    
    c = find_existing_candidate(ident["email"], ident["phone"]) if ident["email"] or ident["phone"] else None
    if c: return c, False  # noqa: E701

    fields = {f: data.get(f.capitalize()) or data.get(f) or [] for f in ATTRS[3:]}
    return Candidate.objects.create(**ident, **fields, created_by=created_by), True


class ResumeUploadWithSimilarityAPIView(APIView):
    """
    Resume upload API view with integrated similarity detection.
    
    This view checks for duplicate or similar resumes before processing.
    """
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request):
        """
        Upload resume with similarity check.
        
        Request:
        - resume: File (required)
        - check_similarity: Boolean (optional, default True)
        - similarity_threshold: Float (optional, default 0.90)
        - candidate_id: Integer (optional)
        
        Response:
        {
            "status": "new_candidate_created" | "existing_candidate" | "duplicate_detected",
            "candidate_id": 1,
            "resume": {...},
            "similarity_check": {
                "is_duplicate": false,
                "similar_candidates": [...],
                "max_similarity": 0.85
            } | null
        }
        """
        file = request.FILES.get("resume")
        if not file:
            return Response({"error": "resume file is required"}, 400)
        
        ext = os.path.splitext(file.name)[1].lower()
        if ext not in EXT_MAP:
            return Response({"error": "Unsupported file type"}, 400)

        # Save file
        fn = default_storage.save(f"resumes/{sanitize_filename(file.name)}", ContentFile(file.read()))
        fp = default_storage.path(fn)
        if not os.path.realpath(fp).startswith(os.path.realpath(default_storage.path("resumes")) + os.sep):
            default_storage.delete(fn)
            return Response({"error": "Invalid path"}, 400)

        # Extract text
        text = EXT_MAP[ext](fp)
        
        # Check if similarity check is requested
        check_similarity = request.data.get('check_similarity', True) == 'true' or request.data.get('check_similarity', True) is True
        similarity_threshold = float(request.data.get('similarity_threshold', 0.90))
        similarity_result = None
        
        if check_similarity:
            # Perform similarity check
            similarity_result = similarity_detection_service.check_resume_similarity(
                resume_text=text,
                threshold=similarity_threshold,
                limit=5
            )
            
            # If duplicate detected, return early
            if similarity_result['is_duplicate']:
                # Delete the uploaded file since we're not processing it
                default_storage.delete(fn)
                
                return Response({
                    "status": "duplicate_detected",
                    "similarity_check": similarity_result,
                    "message": f"Duplicate resume detected with {similarity_result['max_similarity']:.2%} similarity"
                }, status=status.HTTP_200_OK)
        
        # Create or get candidate
        candidate = Candidate.objects.filter(id=request.data.get("candidate_id")).first()
        status_label = "existing_candidate"
        if not candidate:
            candidate, created = create_or_get_candidate(parse_resume(text), created_by=request.user)
            status_label = "new_candidate_created" if created else "existing_candidate"

        # Create resume record
        resume = Resume.objects.create(
            candidate=candidate,
            file=fn,
            file_name=file.name,
            text=text,
            source='upload',
            uploaded_by=request.user  # Track ownership
        )
        
        # Trigger chunking and embedding immediately
        chunk_and_store_resume(resume.id)
        embedding_service.generate_for_resumes(resume_ids=[resume.id])
        
        # Automatic skill extraction for the candidate
        if candidate:
            skill_service.extract_skills(candidate, text)
            # Generate summary if it doesn't exist
            if not candidate.summary:
                summary_service.generate_candidate_summary(candidate, text)
        
        # Prepare response
        response_data = {
            "status": status_label,
            "candidate_id": candidate.id,
            "resume": ResumeSerializer(resume, context={"request": request}).data
        }
        
        # Include similarity check results if performed
        if similarity_result:
            response_data["similarity_check"] = similarity_result
        
        return Response(response_data, status=status.HTTP_201_CREATED)