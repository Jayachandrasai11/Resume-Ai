"""
Script to re-parse existing resumes and update experience_years
"""
import os, sys, django
sys.path.insert(0, 'Project1/resume_backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from apps.candidates.models import Candidate, Resume
from apps.candidates.services import parse_resume_with_experience

print("Updating experience_years for existing candidates...")

updated = 0
for candidate in Candidate.objects.all():
    # Get resume text
    resume = candidate.resumes.first()
    if not resume or not resume.text:
        print(f"Candidate {candidate.id}: No resume text found")
        continue
    
    # Parse resume text
    try:
        parsed = parse_resume_with_experience(resume.text)
    except Exception as e:
        print(f"Candidate {candidate.id}: Parse error: {e}")
        continue
    
    # Get experience years from parsed data
    exp_years = parsed.get("ExperienceYears") or parsed.get("experience_years") or 0.0
    
    # Update if needed
    if candidate.experience_years != exp_years:
        old = candidate.experience_years
        candidate.experience_years = exp_years
        candidate.save(update_fields=['experience_years'])
        print(f"Candidate {candidate.id} ({candidate.name}): Updated experience_years from {old} to {exp_years}")
        updated += 1
    else:
        print(f"Candidate {candidate.id} ({candidate.name}): Already has {exp_years} years")

print(f"\nTotal updated: {updated}")
