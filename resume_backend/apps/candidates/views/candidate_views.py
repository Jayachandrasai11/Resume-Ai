import logging
import os
import json
import puremagic
from contextlib import suppress
from django.conf import settings

from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect

from rest_framework import status, viewsets
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Candidate, Resume, ResumeChunk
from ..serializers import CandidateSerializer, ResumeChunkSerializer, ResumeSerializer
from apps.pipeline.models import CandidatePipeline
from apps.jd_app.models import JobDescription, JobSession
from ..services.chunking import chunk_and_store_resume
from ..services.duplicate_checker import find_existing_candidate
from ..services.email_ingestion import process_email_resume
from ..services.embeddings import service as embedding_service
from ..services.export import export_service
from ..services.interview_questions import interview_questions_service
from ..services.parser import parse_resume
from ..services import parse_resume_with_experience
from ..services.rag_service import rag_service
from ..services.skills import skill_service
from ..services.summary import summary_service
from ..utils import extract_text_from_docx, extract_text_from_pdf

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB limits

NA_PATTERNS = ["N.A", "N/A", "n.a", "n/A", "NA", "na", "N.A.", "N/a", "", [], {}]

def _sanitize_parsed_data(data: dict) -> dict:
    """Clean up N.A values from parsed resume data."""
    if not data:
        return {}
    
    # List fields that should be lists
    list_fields = ["Skills", "skills", "Education", "education", "Experience", "experience", "Projects", "projects"]
    # String fields
    string_fields = ["Name", "name", "Email", "email", "Phone", "phone", "Location", "location"]
    
    for key, value in data.items():
        if key in list_fields:
            # Check if value is N.A or similar
            if isinstance(value, str):
                if value.strip() in ["N.A", "N/A", "n.a", "na", "N.A."]:
                    data[key] = []
                elif value.startswith("[") and value.endswith("]"):
                    # Try to parse as JSON
                    try:
                        parsed = json.loads(value)
                        data[key] = parsed if isinstance(parsed, list) else []
                    except:
                        data[key] = []
        elif key in string_fields:
            if isinstance(value, str) and value.strip() in ["N.A", "N/A", "n.a", "na", "N.A."]:
                data[key] = ""
    
    return data

EXT_MAP = {".pdf": extract_text_from_pdf, ".docx": extract_text_from_docx}
ATTRS = ["name", "email", "phone", "skills", "education", "experience", "projects"]
MAP_KEYS = {
    "experience": "Experience Summary",
    "skills": "Skills",
    "education": "Education",
    "projects": "Projects",
    "name": "Name",
    "email": "Email",
    "phone": "Phone",
}


def sanitize_filename(fn: str) -> str:
    return "".join(c for c in os.path.basename(fn) if c.isalnum() or c in "-_.") or "resume"


def create_or_get_candidate(data):
    ident = {k: data.get(v) or data.get(k) for k, v in MAP_KEYS.items() if k in ["name", "email", "phone"]}
    if not any(ident.values()):
        raise ValueError("No identification found")

    # Truncate phone to max 20 characters (database constraint)
    if ident.get("phone") and len(ident["phone"]) > 20:
        ident["phone"] = ident["phone"][:20]

    existing = (
        find_existing_candidate(ident["email"], ident["phone"]) if ident["email"] or ident["phone"] else None
    )
    if existing:
        return existing, False

    fields = {k: data.get(v) or data.get(k) or [] for k, v in MAP_KEYS.items() if k in ATTRS[3:]}
    
    # Add experience_years if present
    experience_years = data.get("ExperienceYears") or data.get("experience_years") or 0.0
    fields["experience_years"] = experience_years
    
    return Candidate.objects.create(**ident, **fields), True


class ExportCandidatesCSVAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = request.GET.get("count")
        queryset = Candidate.objects.filter(created_by=request.user).order_by("name")

        if count:
            with suppress(ValueError):
                count_int = int(count)
                queryset = queryset[:count_int]

        return export_service.export_candidates_to_csv(queryset)


class CandidateSearchAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        query = request.GET.get("q", "")
        experience = request.GET.get("experience", "")
        education = request.GET.get("education", "")

        queryset = Candidate.objects.filter(created_by=request.user).prefetch_related("skills_m2m", "resumes")

        if query:
            queryset = queryset.filter(
                Q(name__icontains=query)
                | Q(email__icontains=query)
                | Q(summary__icontains=query)
                | Q(skills__icontains=query)
                | Q(skills_m2m__name__icontains=query)
            )

        if experience:
            queryset = queryset.filter(experience__icontains=experience)

        if education:
            queryset = queryset.filter(education__icontains=education)

        queryset = queryset.distinct()
        serializer = CandidateSerializer(queryset, many=True, context={"request": request})
        return Response(serializer.data)


class CandidateViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Candidate.objects.all().prefetch_related("skills_m2m", "resumes").order_by("-id")
    serializer_class = CandidateSerializer

    def get_queryset(self):
        # Base queryset - filter by user's job sessions (recruiter sessions) or session_id param
        user = getattr(self.request, 'user', None)
        
        # Safely check authentication
        is_auth = False
        try:
            is_auth = user and hasattr(user, 'is_authenticated') and user.is_authenticated
        except Exception as e:
            logger.error(f"[DEBUG] Error checking auth: {e}")
        
        logger.info(f"[DEBUG CandidateViewSet] user: {user}, type: {type(user)}, authenticated: {is_auth}")
        
        # Check if session_id is provided in query params
        session_id = self.request.query_params.get('session_id')
        
        # DEBUG: Print request info
        logger.info(f"[DEBUG] Request path: {self.request.path}")
        logger.info(f"[DEBUG] Query params: {dict(self.request.query_params)}")
        
        # If session_id is provided, filter by that session
        if session_id:
            # Filter by specific session_id - ONLY if it belongs to the user
            if user and user.is_authenticated:
                queryset = Candidate.objects.filter(
                    resumes__job_session_id=session_id,
                    resumes__job_session__created_by=user
                ).distinct().prefetch_related("skills_m2m", "resumes").order_by("-id")
                logger.info(f"[DEBUG] session_id filter: {queryset.count()} candidates")
            else:
                queryset = Candidate.objects.none()
        elif user and user.is_authenticated:
            # Get job sessions created by this user
            user_job_sessions = list(JobSession.objects.filter(created_by=user).values_list('id', flat=True))
            logger.info(f"[DEBUG] User job sessions: {user_job_sessions}")
            
            # Get candidates directly created by this user
            direct_candidates = Candidate.objects.filter(created_by=user)
            logger.info(f"[DEBUG] Candidates with created_by={user.id}: {direct_candidates.count()}")
            
            # Get candidates through job sessions
            session_candidates = Candidate.objects.filter(resumes__job_session__in=user_job_sessions).distinct()
            logger.info(f"[DEBUG] Candidates through job sessions: {session_candidates.count()}")
            
            # Get candidates with resumes uploaded directly by the user (no job_session)
            direct_uploads = Candidate.objects.filter(resumes__uploaded_by=user).distinct()
            logger.info(f"[DEBUG] Candidates with resumes uploaded by user: {direct_uploads.count()}")
            
            # Filter candidates that either:
            # 1. Have resumes uploaded under user's job sessions
            # 2. Were directly created by this user
            # 3. Have resumes directly uploaded by this user
            queryset = Candidate.objects.filter(
                Q(resumes__job_session__in=user_job_sessions) |
                Q(created_by=user) |
                Q(resumes__uploaded_by=user)
            ).distinct().prefetch_related("skills_m2m", "resumes").order_by("-id")
            logger.info(f"[DEBUG] Combined queryset: {queryset.count()} candidates")
        else:
            queryset = Candidate.objects.none()
            logger.warning(f"[DEBUG] No authenticated user - returning empty queryset")

        name = self.request.query_params.get("name")
        status_value = self.request.query_params.get("status")
        skills = self.request.query_params.get("skills")
        experience = self.request.query_params.get("experience")

        # Apply name filter
        if name:
            queryset = queryset.filter(Q(name__icontains=name) | Q(email__icontains=name))
        
        # Apply skills filter
        if skills:
            queryset = queryset.filter(Q(skills__icontains=skills) | Q(skills_m2m__name__icontains=skills))
        
        # Apply experience filter
        if experience:
            queryset = queryset.filter(experience__icontains=experience)
        
        # Apply status filter - check BOTH Candidate.status AND RecruitmentFunnel.stage
        # This allows filtering by hired/shortlisted/interview candidates from funnel
        if status_value:
            # Get candidate IDs from RecruitmentFunnel with matching stage
            from apps.ranking.models import RecruitmentFunnel
            funnel_candidate_ids = RecruitmentFunnel.objects.filter(
                stage=status_value,
                created_by=user
            ).values_list('candidate_id', flat=True)
            
            # Filter: either matching Candidate.status OR in RecruitmentFunnel with matching stage
            queryset = queryset.filter(
                Q(status=status_value) | Q(id__in=funnel_candidate_ids)
            )

        # Debug logging
        logger.info(f"[DEBUG] CandidateViewSet.get_queryset - total candidates: {queryset.count()}")
        if queryset.exists():
            first = queryset.first()
            logger.info(f"[DEBUG] First candidate data - name: {first.name}, skills: {first.skills}, experience: {first.experience}")

        return queryset.distinct()

    def perform_create(self, serializer):
        """Auto-assign created_by to the current user."""
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated:
            serializer.save(created_by=user)
        else:
            serializer.save()


class ResumeViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ResumeSerializer
    queryset = Resume.objects.all()

    def get_queryset(self):
        user = getattr(self.request, 'user', None)
        logger.info(f"[DEBUG ResumeViewSet] get_queryset called - user: {user}, auth: {user.is_authenticated if user else 'None'}")
        if user and user.is_authenticated:
            queryset = Resume.objects.filter(uploaded_by=user).order_by('-uploaded_at')
            logger.info(f"[DEBUG ResumeViewSet] Found {queryset.count()} resumes for user {user.id}")
            return queryset
        logger.warning(f"[DEBUG ResumeViewSet] User not authenticated or None")
        return Resume.objects.none()

    def perform_create(self, serializer):
        """Auto-assign uploaded_by to the current user."""
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated:
            serializer.save(uploaded_by=user)
        else:
            serializer.save()

    def destroy(self, request, *args, **kwargs):
        """Delete a single resume."""
        instance = self.get_object()
        # Delete the file from storage
        if instance.file:
            try:
                default_storage.delete(instance.file.name)
            except Exception as e:
                logger.warning(f"Failed to delete file {instance.file.name}: {e}")
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class ResumeBulkDeleteAPIView(APIView):
    """API endpoint to delete multiple resumes at once."""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        """Delete multiple resumes by their IDs."""
        resume_ids = request.data.get('resume_ids', [])
        
        if not resume_ids:
            return Response(
                {"error": "resume_ids list is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not isinstance(resume_ids, list):
            return Response(
                {"error": "resume_ids must be a list"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get resumes uploaded by the current user
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return Response(
                {"error": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Filter resumes by user to ensure ownership
        resumes_to_delete = Resume.objects.filter(
            id__in=resume_ids,
            uploaded_by=user
        )
        
        deleted_count = 0
        deleted_ids = []
        failed_ids = []
        
        for resume in resumes_to_delete:
            try:
                # Delete the file from storage
                if resume.file:
                    try:
                        default_storage.delete(resume.file.name)
                    except Exception as e:
                        logger.warning(f"Failed to delete file {resume.file.name}: {e}")
                
                resume_id = resume.id
                resume.delete()
                deleted_count += 1
                deleted_ids.append(resume_id)
            except Exception as e:
                logger.error(f"Failed to delete resume {resume.id}: {e}")
                failed_ids.append(resume.id)
        
        return Response({
            "status": "completed",
            "deleted_count": deleted_count,
            "deleted_ids": deleted_ids,
            "failed_ids": failed_ids,
            "message": f"Successfully deleted {deleted_count} resume(s)"
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """Alternative POST method for bulk delete (for cases where DELETE body is not supported)."""
        return self.delete(request)


class ResumeUploadAPIView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        file = request.FILES.get("resume")
        if not file:
            return Response({"error": "resume file is required"}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file.name)[1].lower()
        if ext not in EXT_MAP:
            return Response({"error": "Unsupported file extension"}, status=status.HTTP_400_BAD_REQUEST)

        # 1. Size Validation
        if file.size > MAX_FILE_SIZE:
            return Response({"error": f"File too large. Max size is {MAX_FILE_SIZE / (1024*1024)}MB"}, status=status.HTTP_400_BAD_REQUEST)

        # 2. MIME Type Validation (Signature Check)
        try:
            # Read first 2KB for signature analysis
            header = file.read(2048)
            file.seek(0) # Reset pointer
            
            # puremagic returns a list of possibilities
            matches = puremagic.from_binary(header)
            mime_type = matches[0].mime if matches else "application/octet-stream"
            
            if mime_type not in ALLOWED_MIME_TYPES:
                logger.warning(f"Rejected spoofed file: {file.name} (detected as {mime_type})")
                return Response({"error": "Invalid file content. Only PDF and DOCX are allowed."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"MIME validation failed: {e}")
            return Response({"error": "Security validation failed"}, status=status.HTTP_400_BAD_REQUEST)

        fn = default_storage.save(f"resumes/{sanitize_filename(file.name)}", ContentFile(file.read()))
        fp = default_storage.path(fn)
        if not os.path.realpath(fp).startswith(os.path.realpath(default_storage.path("resumes")) + os.sep):
            default_storage.delete(fn)
            return Response({"error": "Invalid path"}, status=status.HTTP_400_BAD_REQUEST)

        # Extract text with fallback
        text = ""
        try:
            text = EXT_MAP[ext](fp)
        except Exception as e:
            logger.error(f"Failed to extract text from {file.name}: {e}")
            # Fallback: use filename as minimal text
            text = f"Resume: {file.name}"

        logger.info(f"Extracted text length for {file.name}: {len(text)}")

        # Parse resume with error handling
        parsed_data = {}
        try:
            parsed_data = parse_resume_with_experience(text)
            logger.info(f"Parsed data for {file.name}: {parsed_data}")
        except Exception as e:
            logger.error(f"Failed to parse resume {file.name}: {e}")
            # Continue with empty parsed_data

        # Clean up N.A values from parsed data
        parsed_data = _sanitize_parsed_data(parsed_data)

        # Extract candidate details
        name = parsed_data.get("name") or parsed_data.get("Name") or file.name
        email = parsed_data.get("email") or parsed_data.get("Email") or ""
        phone = parsed_data.get("phone") or parsed_data.get("Phone") or ""
        # Truncate phone to max 20 characters (database constraint)
        if phone and len(phone) > 20:
            phone = phone[:20]
        experience = parsed_data.get("Experience") or parsed_data.get("experience") or []
        skills = parsed_data.get("Skills") or parsed_data.get("skills") or []
        education = parsed_data.get("Education") or parsed_data.get("education") or []
        projects = parsed_data.get("Projects") or parsed_data.get("projects") or []
        summary = parsed_data.get("Summary") or parsed_data.get("summary") or ""

        logger.info(f"[DEBUG] Creating candidate - name: {name}, email: {email}, phone: {phone}")
        logger.info(f"[DEBUG] Skills: {skills}, Experience: {experience}, Summary: {summary[:50] if summary else ''}...")

        # Extract experience_years from parsed data
        experience_years = parsed_data.get("ExperienceYears") or parsed_data.get("experience_years") or 0.0
        
        # Check for existing candidate (duplicate prevention)
        existing_candidate = find_existing_candidate(email, phone) if email or phone else None
        
        if existing_candidate:
            # Use existing candidate instead of creating duplicate
            candidate = existing_candidate
            status_label = "duplicate_found"
            logger.info(f"[DEBUG] Duplicate detected - using existing candidate ID: {candidate.id}")
        else:
            # Create new candidate
            candidate = Candidate.objects.create(
                name=name,
                email=email,
                phone=phone,
                experience=experience,
                skills=skills,
                education=education,
                projects=projects,
                summary=summary,
                experience_years=experience_years,
                created_by=request.user  # Track ownership
            )
            logger.info(f"[DEBUG] New candidate created with ID: {candidate.id}, exp_years: {experience_years}")
            status_label = "new_candidate_created"

        # Always save resume - track who uploaded it
        # Link to job_session if provided
        job_session = None
        job_session_id = request.data.get("job_session_id")
        if job_session_id:
            try:
                job_session = JobSession.objects.get(id=job_session_id)
            except JobSession.DoesNotExist:
                logger.warning(f"[DEBUG] JobSession not found: {job_session_id}")
        
        resume = Resume.objects.create(
            candidate=candidate,
            job_session=job_session,  # Link resume to job session
            file=fn,
            file_name=file.name,
            text=text,
            uploaded_by=request.user  # Track the recruiter who uploaded this resume
        )

        # Note: Pipeline creation is optional - the key linking is through Resume.job_session
        # which is already set above. Candidates will show in the session through their resumes.

        # Optional processing
        try:
            chunk_and_store_resume(resume.id)
            embedding_service.generate_for_resumes(resume_ids=[resume.id])

            if candidate:
                # Use regex-based skill extraction (no LLM calls)
                skill_service.extract_skills(candidate, text)
                # Summary is already generated by parser.py using regex - skip LLM summary generation
        except Exception as e:
            logger.error(f"Failed optional processing for {file.name}: {e}")
            # Continue anyway

        return Response(
            {"status": status_label, "candidate_id": candidate.id, "resume": ResumeSerializer(resume, context={"request": request}).data},
            status=status.HTTP_201_CREATED,
        )


class ResumeParseAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        resume = get_object_or_404(Resume.objects.filter(uploaded_by=request.user), id=request.data.get("resume_id"))
        parsed = parse_resume(resume.text)
        candidate, _ = create_or_get_candidate(parsed)
        for a, v in MAP_KEYS.items():
            val = parsed.get(v) or parsed.get(a)
            if val:
                setattr(candidate, a, val)
        candidate.save()

        if not candidate.summary:
            summary_service.generate_candidate_summary(candidate, resume.text)

        if not candidate.skills_m2m.exists():
            skill_service.extract_skills(candidate, resume.text)

        resume.candidate = candidate
        resume.save(update_fields=["candidate"])
        return Response({**parsed, "candidate_id": candidate.id, "summary": candidate.summary})


class CandidateSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, candidate_id):
        candidate = get_object_or_404(Candidate.objects.filter(created_by=request.user), id=candidate_id)
        latest_resume = candidate.resumes.order_by("-uploaded_at").first()
        if not latest_resume:
            return Response({"error": "No resume found for this candidate"}, status=status.HTTP_400_BAD_REQUEST)

        summary = summary_service.generate_candidate_summary(candidate, latest_resume.text)
        return Response({"candidate_id": candidate.id, "summary": summary})

    def get(self, request, candidate_id):
        candidate = get_object_or_404(Candidate.objects.filter(created_by=request.user), id=candidate_id)
        return Response({"candidate_id": candidate.id, "summary": candidate.summary})


class CandidateSkillAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, candidate_id):
        candidate = get_object_or_404(Candidate.objects.filter(created_by=request.user), id=candidate_id)
        latest_resume = candidate.resumes.order_by("-uploaded_at").first()
        if not latest_resume:
            return Response({"error": "No resume found"}, status=status.HTTP_400_BAD_REQUEST)

        skills = skill_service.extract_skills(candidate, latest_resume.text)
        return Response({"candidate_id": candidate.id, "extracted_skills": skills})

    def get(self, request, candidate_id):
        candidate = get_object_or_404(Candidate.objects.filter(created_by=request.user), id=candidate_id)
        skills = list(candidate.skills_m2m.values_list("name", flat=True))
        return Response({"candidate_id": candidate.id, "skills": skills})


class ResumeChatRAGAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        candidate_id = request.data.get("candidate_id")
        question = request.data.get("question")

        if not candidate_id or not question:
            return Response({"error": "candidate_id and question are required"}, status=status.HTTP_400_BAD_REQUEST)

        # Security Check: Ensure candidate belongs to requesting user before RAG chat
        if not Candidate.objects.filter(id=candidate_id, created_by=request.user).exists():
            return Response({"error": "Candidate not found"}, status=status.HTTP_404_NOT_FOUND)

        result = rag_service.chat(candidate_id, question)
        if result.get("status") == "error":
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


class GenericInterviewQuestionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role_or_skill = request.data.get("role_or_skill")
        question_count = request.data.get("question_count", 8)

        if not role_or_skill:
            return Response({"error": "role_or_skill is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            question_count_int = int(question_count)
        except (ValueError, TypeError):
            question_count_int = 8

        result = interview_questions_service.generate_generic_questions(
            role_or_skill=role_or_skill,
            question_count=question_count_int,
        )

        if result.get("status") == "error":
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


class InterviewQuestionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        candidate_id = request.data.get("candidate_id")
        job_role = request.data.get("job_role")
        question_count = request.data.get("question_count", 8)

        if not candidate_id:
            return Response({"error": "candidate_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        if not job_role:
            return Response({"error": "job_role is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            candidate_id_int = int(candidate_id)
        except (ValueError, TypeError):
            return Response({"error": "candidate_id must be a valid integer"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            question_count_int = int(question_count)
            question_count_int = max(5, min(10, question_count_int))
        except (ValueError, TypeError):
            question_count_int = 8

        # Security Check: Ensure candidate belongs to requesting user before generating questions
        if not Candidate.objects.filter(id=candidate_id_int, created_by=request.user).exists():
            return Response({"error": "Candidate not found"}, status=status.HTTP_404_NOT_FOUND)

        result = interview_questions_service.generate_interview_questions(
            candidate_id=candidate_id_int,
            job_role=job_role,
            question_count=question_count_int,
        )

        if result.get("status") == "error":
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


class EmailIngestionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(
            {
                "detail": "HTML UI removed; use POST with credentials to ingest resumes from email.",
                "required_fields": ["email_host", "email_user", "email_pass"],
                "optional_fields": ["folder"],
            }
        )

    def post(self, request):
        if not settings.DEBUG:
            return Response(
                {"error": "Email ingestion is disabled in production for security reasons. Please use manual upload or contact support for dedicated integration."}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        d = request.data or request.POST
        creds = [d.get(k) for k in ["email_host", "email_user", "email_pass"]]
        if not all(creds):
            return Response({"error": "Credentials required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            results = process_email_resume(*creds, d.get("folder", "INBOX"))
            return Response({"status": "completed", "results": results})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def upload_form(request):
    return JsonResponse({"detail": "This backend no longer serves HTML. Use the React frontend."}, status=410)


def upload_resume_submit(request):
    return redirect("/upload/")


def parse_resume_form(request):
    return JsonResponse({"detail": "This backend no longer serves HTML. Use the React frontend."}, status=410)


def candidate_form(request):
    return JsonResponse({"detail": "This backend no longer serves HTML. Use the React frontend."}, status=410)


def candidate_list_view(request):
    count = request.GET.get("count")
    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        candidates_qs = Candidate.objects.filter(created_by=user).prefetch_related("skills_m2m")
    else:
        candidates_qs = Candidate.objects.none()

    if count:
        with suppress(ValueError):
            count_int = int(count)
            candidates_qs = candidates_qs[:count_int]

    data = CandidateSerializer(candidates_qs, many=True, context={"request": request}).data
    return JsonResponse({"results": data, "count": len(data)})


def candidate_detail_view(request, candidate_id):
    user = getattr(request, 'user', None)
    if user and user.is_authenticated:
        candidate = get_object_or_404(Candidate.objects.filter(created_by=user).prefetch_related("skills_m2m", "resumes"), id=candidate_id)
    else:
        return JsonResponse({"error": "Unauthorized"}, status=401)
    data = CandidateSerializer(candidate, context={"request": request}).data
    return JsonResponse(data)


def parse_resume_view(request):
    if request.method == "POST":
        return JsonResponse(parse_resume(request.POST.get("resume_text", "")))
    return JsonResponse({"error": "Invalid request"}, status=400)


class ResumeChunkViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ResumeChunkSerializer

    def get_queryset(self):
        user = getattr(self.request, 'user', None)
        if user and user.is_authenticated:
            return ResumeChunk.objects.filter(resume__uploaded_by=user).order_by('resume', 'chunk_index')
        return ResumeChunk.objects.none()


class ResumeChunkAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"status": "chunking endpoint ready"})

