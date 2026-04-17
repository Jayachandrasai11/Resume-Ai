import csv
from django.http import HttpResponse
from ..models import Candidate

class ExportService:
    @staticmethod
    def export_candidates_to_csv(queryset):
        """
        Exports a given queryset of candidates to a CSV file response.
        """
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="candidates_export.csv"'

        writer = csv.writer(response)
        # Header Row
        writer.writerow(['Candidate Name', 'Email', 'Phone', 'Skills', 'Professional Summary'])

        # Data Rows
        # Prefetch skills_m2m for performance
        candidates = queryset.prefetch_related('skills_m2m')

        for candidate in candidates:
            # Join M2M skills into a comma-separated string
            m2m_skills = [skill.name for skill in candidate.skills_m2m.all()]
            
            # Fallback to JSON skills if M2M is empty
            if not m2m_skills and candidate.skills:
                m2m_skills = candidate.skills if isinstance(candidate.skills, list) else []
            
            skills_list = ", ".join(m2m_skills)
            
            writer.writerow([
                candidate.name or "Unnamed Candidate",
                candidate.email or "N/A",
                candidate.phone or "N/A",
                skills_list or "N/A",
                candidate.summary or "No summary available"
            ])

        return response

export_service = ExportService()
