"""
Export views for CSV exports.
"""
import csv
import io
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from apps.candidates.models import Candidate


class ExportCandidatesCSVAPIView(APIView):
    """
    Export all candidates to CSV format.
    
    Route: /api/export/candidates
    Method: GET
    
    Query Parameters:
    - count (optional): Limit the number of candidates to export
    
    Returns:
    - CSV file with candidate data
    """
    
    def get(self, request):
        # Get count parameter if provided
        count = request.query_params.get("count")
        
        # Get all candidates ordered by name
        queryset = Candidate.objects.all().order_by("name")
        
        # Apply count limit if specified
        if count:
            try:
                count_int = int(count)
                queryset = queryset[:count_int]
            except ValueError:
                pass
        
        # Create CSV response
        response = HttpResponse(
            content_type='text/csv',
            headers={'Content-Disposition': 'attachment; filename="candidates_export.csv"'},
        )
        
        writer = csv.writer(response)
        
        # Write header row with all fields
        writer.writerow([
            'Name',
            'Email',
            'Phone',
            'Status',
            'Skills',
            'Summary',
            'Education',
            'Experience',
            'Projects',
        ])
        
        # Prefetch skills for performance
        candidates = queryset.prefetch_related('skills_m2m')
        
        # Write data rows
        for candidate in candidates:
            # Get skills from M2M relationship
            m2m_skills = [skill.name for skill in candidate.skills_m2m.all()]
            
            # Fallback to JSON skills if M2M is empty
            if not m2m_skills and candidate.skills:
                m2m_skills = candidate.skills if isinstance(candidate.skills, list) else []
            
            skills_str = ", ".join(m2m_skills)
            
            # Format education JSON to string
            education_str = ""
            if candidate.education:
                if isinstance(candidate.education, list):
                    edu_items = []
                    for edu in candidate.education:
                        if isinstance(edu, dict):
                            degree = edu.get('degree', '')
                            institution = edu.get('institution', '')
                            year = edu.get('year', '')
                            edu_items.append(f"{degree} at {institution} ({year})")
                        else:
                            edu_items.append(str(edu))
                    education_str = " | ".join(edu_items)
                else:
                    education_str = str(candidate.education)
            
            # Format experience JSON to string
            experience_str = ""
            if candidate.experience:
                if isinstance(candidate.experience, list):
                    exp_items = []
                    for exp in candidate.experience:
                        if isinstance(exp, dict):
                            title = exp.get('title', '')
                            company = exp.get('company', '')
                            duration = exp.get('duration', '')
                            exp_items.append(f"{title} at {company} ({duration})")
                        else:
                            exp_items.append(str(exp))
                    experience_str = " | ".join(exp_items)
                else:
                    experience_str = str(candidate.experience)
            
            # Format projects JSON to string
            projects_str = ""
            if candidate.projects:
                if isinstance(candidate.projects, list):
                    proj_items = []
                    for proj in candidate.projects:
                        if isinstance(proj, dict):
                            name = proj.get('name', '')
                            desc = proj.get('description', '')
                            proj_items.append(f"{name}: {desc}" if desc else name)
                        else:
                            proj_items.append(str(proj))
                    projects_str = " | ".join(proj_items)
                else:
                    projects_str = str(candidate.projects)
            
            writer.writerow([
                candidate.name or "Unnamed Candidate",
                candidate.email or "N/A",
                candidate.phone or "N/A",
                candidate.get_status_display() if candidate.status else "N/A",
                skills_str or "N/A",
                candidate.summary or "No summary available",
                education_str or "N/A",
                experience_str or "N/A",
                projects_str or "N/A",
            ])
        
        return response
