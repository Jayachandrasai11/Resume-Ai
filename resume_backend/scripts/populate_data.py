import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from candidates.models import Candidate, Resume
from candidates.services.summary import summary_service
from candidates.services.skills import skill_service

def populate_missing_data():
    candidates = Candidate.objects.all()
    print(f"Total candidates: {candidates.count()}")
    
    for i, candidate in enumerate(candidates, 1):
        print(f"[{i}/{candidates.count()}] Processing candidate {candidate.id} ({candidate.name})...")
        
        resume = candidate.resumes.order_by('-uploaded_at').first()
        if not resume or not resume.text:
            print(f"  - No resume or text found.")
            continue
            
        if not candidate.summary:
            print(f"  - Generating summary...")
            summary_service.generate_candidate_summary(candidate, resume.text)
            
        if not candidate.skills_m2m.exists():
            print(f"  - Extracting skills...")
            skill_service.extract_skills(candidate, resume.text)

if __name__ == "__main__":
    populate_missing_data()
