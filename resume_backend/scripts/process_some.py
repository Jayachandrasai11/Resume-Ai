import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from candidates.models import Resume, ResumeChunk
from candidates.services.chunking import chunk_and_store_resume
from candidates.services.embeddings import service as embedding_service

def process_some_resumes():
    resumes = Resume.objects.filter(chunked=False)[:5]
    print(f"Total resumes to process: {resumes.count()}")
    
    for resume in resumes:
        print(f"Processing resume {resume.id} ({resume.file_name})...")
        chunk_res = chunk_and_store_resume(resume.id)
        if chunk_res['success']:
            print(f"  - Chunked into {chunk_res['total_chunks']} chunks.")
        else:
            print(f"  - Chunking failed: {chunk_res.get('error')}")
            
    print("\nGenerating embeddings for all chunks...")
    emb_res = embedding_service.generate_for_resumes()
    print(f"Embeddings result: {emb_res}")

if __name__ == "__main__":
    process_some_resumes()
