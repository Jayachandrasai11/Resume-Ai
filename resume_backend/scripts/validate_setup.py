"""
Script to validate the Resume Chunking System setup.
Run with: python manage.py shell < validate_setup.py
"""
import sys
import os
import django

# Add the project directory to Python path
project_dir = os.path.join(os.path.dirname(__file__), 'resume_backend')
sys.path.insert(0, project_dir)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from django.core.checks import run_checks
from candidates.models import Resume, ResumeChunk
from django.db import connection

def check_setup():
    """Validate the chunking system setup."""
    
    print("=" * 60)
    print("RESUME CHUNKING SYSTEM VALIDATION")
    print("=" * 60)
    
    # 1. Check if models can be imported
    print("\n✓ Models imported successfully")
    print(f"  - Resume model: {Resume}")
    print(f"  - ResumeChunk model: {ResumeChunk}")
    
    # 2. Check if ResumeChunk model is registered
    from django.apps import apps
    try:
        apps.get_model('candidates', 'ResumeChunk')
        print("\n✓ ResumeChunk model is registered")
    except LookupError:
        print("\n✗ ERROR: ResumeChunk model is not registered!")
        print("  Run: python manage.py migrate candidates")
        return False
    
    # 3. Check if tables exist
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('candidates_resume', 'candidates_resumechunk')
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        if 'candidates_resume' in tables:
            print("✓ Resume table exists")
        else:
            print("✗ ERROR: Resume table does not exist!")
            
        if 'candidates_resumechunk' in tables:
            print("✓ ResumeChunk table exists")
        else:
            print("✗ ERROR: ResumeChunk table does not exist!")
            print("  Run: python manage.py migrate candidates")
            return False
    
    # 4. Check if chunked field exists
    try:
        field_names = [f.name for f in Resume._meta.fields]
        if 'chunked' in field_names:
            print("✓ 'chunked' field exists in Resume model")
        else:
            print("✗ ERROR: 'chunked' field missing from Resume model!")
            return False
    except Exception as e:
        print(f"✗ ERROR checking fields: {e}")
        return False
    
    # 5. Test chunking service import
    try:
        from candidates.services.chunking import (
            chunk_resume_text,
            chunk_and_store_resume,
            get_resume_chunks
        )
        print("✓ Chunking service imports successfully")
    except ImportError as e:
        print(f"✗ ERROR importing chunking service: {e}")
        return False
    
    # 6. Test Django REST framework setup
    try:
        from rest_framework.views import APIView
        from candidates.views import ResumeChunkAPIView
        print("✓ API views are properly set up")
    except ImportError as e:
        print(f"✗ ERROR with DRF setup: {e}")
        return False
    
    # 7. Test URL configuration
    try:
        from django.urls import resolve
        from candidates.urls import urlpatterns as candidate_urls
        chunk_urls = [url for url in candidate_urls if 'chunk' in str(url.pattern)]
        if chunk_urls:
            print("✓ Chunking URLs are configured")
        else:
            print("✗ WARNING: No chunking URLs found in candidates/urls.py")
    except Exception as e:
        print(f"✗ ERROR checking URLs: {e}")
    
    print("\n" + "=" * 60)
    print("VALIDATION COMPLETE!")
    print("=" * 60)
    return True

if __name__ == '__main__':
    check_setup()