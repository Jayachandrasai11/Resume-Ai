import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from candidates.models import Candidate, Resume, ResumeChunk
from ranking.services.semantic_search import semantic_search_service

def debug_search():
    print(f"Total Candidates: {Candidate.objects.count()}")
    print(f"Total Resumes: {Resume.objects.count()}")
    print(f"Total Chunks: {ResumeChunk.objects.count()}")
    print(f"Chunks with embeddings: {ResumeChunk.objects.filter(embedding__isnull=False).count()}")
    
    query = "Python developer"
    print(f"\nTesting semantic search for: '{query}'")
    try:
        results = semantic_search_service.search_candidates(query, limit=5, threshold=0.1)
        print(f"Results found: {len(results)}")
        for res in results:
            print(f"- {res['name']} (Score: {res['similarity_score']})")
    except Exception as e:
        print(f"Search Error: {e}")

if __name__ == "__main__":
    debug_search()
