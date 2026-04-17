import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()
from candidates.models import Resume
from candidates.services.chunking import chunk_and_store_resume
resume = Resume.objects.filter(chunked=False).first()
if resume:
    print(f"Processing resume {resume.id}...")
    res = chunk_and_store_resume(resume.id)
    print(f"Result: {res}")
else:
    print("No unchunked resumes found")
