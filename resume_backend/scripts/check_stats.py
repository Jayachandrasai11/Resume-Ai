import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()
from candidates.models import Candidate, Resume, ResumeChunk
print(f"Candidates: {Candidate.objects.count()}")
print(f"Resumes: {Resume.objects.count()}")
print(f"Chunks: {ResumeChunk.objects.count()}")
print(f"Chunks with embeddings: {ResumeChunk.objects.filter(embedding__isnull=False).count()}")
