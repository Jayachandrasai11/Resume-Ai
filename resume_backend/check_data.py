import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from apps.candidates.models import Candidate, ResumeChunk
try:
    total_candidates = Candidate.objects.count()
    print(f'Total candidates: {total_candidates}')
except Exception as e:
    print(f'Error getting candidates: {e}')

try:
    total_chunks = ResumeChunk.objects.count()
    print(f'Total chunks: {total_chunks}')
except Exception as e:
    print(f'Error getting chunks: {e}')

try:
    chunks_with_embedding = ResumeChunk.objects.filter(embedding__isnull=False).count()
    print(f'Chunks with embedding: {chunks_with_embedding}')
except Exception as e:
    print(f'Error getting embeddings: {e}')

# Check candidate skills
try:
    candidates_with_skills = Candidate.objects.exclude(skills__isnull=True).exclude(skills='').count()
    print(f'Candidates with skills: {candidates_with_skills}')
    sample = Candidate.objects.exclude(skills__isnull=True).exclude(skills='').first()
    if sample:
        print(f'Sample skills: {sample.skills[:100] if sample.skills else "None"}')
except Exception as e:
    print(f'Error getting skills: {e}')