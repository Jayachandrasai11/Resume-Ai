import os
import django
import sys
from pathlib import Path

# Set up Django environment
BASE_DIR = Path(__file__).resolve().parent
sys.path.append(str(BASE_DIR))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "resume_backend.settings")
django.setup()

from candidates.models import Candidate, Resume, Skill
from candidates.services.skills import skill_service
from candidates.services.summary import summary_service

def test_extraction():
    # 1. Create a dummy candidate
    candidate = Candidate.objects.create(
        name="Test Candidate",
        email="test@example.com",
        phone="1234567890"
    )
    print(f"Created candidate: {candidate.id}")

    # 2. Sample resume text
    sample_text = """
    JAYA CHANDRA SAI
    Software Engineer
    
    EXPERIENCE:
    Senior Developer at Tech Corp (2020 - Present)
    - Developed scalable microservices using Python and Django.
    - Implemented frontend features with React and Redux.
    - Managed deployments on AWS using Docker and Kubernetes.
    - Used PostgreSQL for data storage and Redis for caching.
    
    SKILLS:
    Python, Django, FastAPI, JavaScript, React, PostgreSQL, AWS, Docker, Kubernetes, Git, CI/CD, Agile.
    """

    # 3. Create a dummy resume record
    resume = Resume.objects.create(
        candidate=candidate,
        file_name="test_resume.pdf",
        text=sample_text
    )
    print(f"Created resume: {resume.id}")

    # 4. Test Skill Extraction
    print("\n--- Testing Skill Extraction ---")
    extracted_skills = skill_service.extract_skills(candidate, sample_text)
    print(f"Extracted Skills: {extracted_skills}")
    
    # Verify M2M relationship
    m2m_skills = list(candidate.skills_m2m.values_list('name', flat=True))
    print(f"Skills in M2M table: {m2m_skills}")

    # 5. Test Summary Generation
    print("\n--- Testing Summary Generation ---")
    summary = summary_service.generate_candidate_summary(candidate, sample_text)
    print(f"Generated Summary: {summary}")

    # 6. Cleanup (Optional - keep for verification)
    # candidate.delete()
    print("\nTest completed successfully!")

if __name__ == "__main__":
    test_extraction()
