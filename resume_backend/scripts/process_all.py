import os
import django
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from candidates.models import Resume, ResumeChunk
from candidates.services.chunking import chunk_and_store_resume
from candidates.services.embeddings import service as embedding_service

def process_all_resumes():
    resumes = Resume.objects.filter(chunked=False)
    total = resumes.count()
    print(f"Total resumes to process: {total}")
    
    for i, resume in enumerate(resumes, 1):
        try:
            print(f"[{i}/{total}] Processing resume {resume.id} ({resume.file_name})...")
            chunk_res = chunk_and_store_resume(resume.id)
            if chunk_res['success']:
                print(f"  - Chunked into {chunk_res['total_chunks']} chunks.")
                # Generate embeddings for these chunks immediately to avoid large batch failure
                embedding_service.generate_for_resumes(resume_ids=[resume.id])
            else:
                print(f"  - Chunking failed: {chunk_res.get('error')}")
        except Exception as e:
            print(f"  - Error: {e}")
            
    print("\nFinal embedding check...")
    embedding_service.generate_for_resumes()
    print("All done!")

if __name__ == "__main__":
    process_all_resumes()
