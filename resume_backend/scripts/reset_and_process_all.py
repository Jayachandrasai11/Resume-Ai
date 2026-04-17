"""
Script to clear all data, delete media resume files, and process all resumes
from the resumes/ folder through the complete pipeline.
"""
from candidates.models import Candidate, Resume, ResumeChunk, Skill
from pipeline.models import CandidatePipeline
from jd_app.models import JobDescription
from candidates.services.parser import parse_resume
from candidates.services.chunking import chunk_and_store_resume  # noqa: E402
from candidates.services.embeddings import service as embedding_service
from candidates.services.skills import skill_service
from candidates.services.summary import summary_service
from candidates.utils import extract_text_from_pdf, extract_text_from_docx

import os
import sys
import django
from pathlib import Path
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from django.conf import settings

# Setup Django
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

def clear_all_data():
    """Clear all data from the database."""
    print("=" * 60)
    print("CLEARING ALL DATA FROM DATABASE")
    print("=" * 60)

    # Clear pipeline entries (if table exists)
    try:
        _extracted_from_clear_all_data_9(CandidatePipeline, ' pipeline entries...')
    except Exception as e:
        print(f"Pipeline table does not exist yet or error: {e}")

    _extracted_from_clear_all_data_9(ResumeChunk, ' resume chunks...')
    _extracted_from_clear_all_data_9(Resume, ' resumes...')
    _extracted_from_clear_all_data_9(Candidate, ' candidates...')
    # Clear skills (optional - you may want to keep these)
    # skill_count = Skill.objects.count()
    # print(f"Deleting {skill_count} skills...")
    # Skill.objects.all().delete()

    print("All data cleared successfully!")
    print()


# TODO Rename this here and in `clear_all_data`
def _extracted_from_clear_all_data_9(arg0, arg1):
    pipeline_count = arg0.objects.count()
    print(f"Deleting {pipeline_count}{arg1}")
    arg0.objects.all().delete()


def clear_media_resumes():
    """Delete all resume files from media/resumes folder."""
    print("=" * 60)
    print("DELETING MEDIA RESUME FILES")
    print("=" * 60)
    
    media_resumes_path = Path(settings.MEDIA_ROOT) / 'resumes'
    
    if media_resumes_path.exists():
        deleted_count = 0
        for file_path in media_resumes_path.iterdir():
            if file_path.is_file():
                file_path.unlink()
                deleted_count += 1
        print(f"[+] Deleted {deleted_count} files from media/resumes/")
    else:
        print("[+] media/resumes/ folder does not exist or is empty")
    
    print()


def get_resume_files():
    """Get all resume files from the resumes/ folder."""
    print("=" * 60)
    print("SCANNING RESUME FILES")
    print("=" * 60)

    resumes_path = Path(__file__).parent.parent.parent / 'resumes'

    if not resumes_path.exists():
        print(f"[-] Resumes folder not found: {resumes_path}")
        return []

    resume_files = []
    supported_extensions = {'.pdf', '.docx', '.doc', '.txt'}

    resume_files.extend(
        file_path
        for file_path in resumes_path.iterdir()
        if file_path.is_file()
        and file_path.suffix.lower() in supported_extensions
    )
    print(f"[+] Found {len(resume_files)} resume files")
    for i, file_path in enumerate(resume_files, 1):
        print(f"  {i}. {file_path.name}")

    print()
    return resume_files


def extract_text_from_file(file_path):
    """Extract text from resume file based on extension."""
    ext = file_path.suffix.lower()
    
    if ext == '.pdf':
        return extract_text_from_pdf(str(file_path))
    elif ext in ['.docx', '.doc']:
        return extract_text_from_docx(str(file_path))
    elif ext == '.txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported file type: {ext}")


def process_resume_file(file_path):
    """Process a single resume file through the complete pipeline."""
    print(f"\n{'=' * 60}")
    print(f"PROCESSING: {file_path.name}")
    print(f"{'=' * 60}")

    try:
        return _extracted_from_process_resume_file_9(file_path)
    except Exception as e:
        print(f"\n[-] ERROR: Failed to process {file_path.name}")
        print(f"  Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


# TODO Rename this here and in `process_resume_file`
def _extracted_from_process_resume_file_9(file_path):
    # Step 1: Extract text from resume
    print("  [1/8] Extracting text from resume...")
    text = extract_text_from_file(file_path)
    print(f"  [+] Extracted {len(text)} characters")

    # Step 2: Parse resume to extract structured data
    print("  [2/8] Parsing resume to extract candidate data...")
    parsed_data = parse_resume(text)
    print(f"  [+] Extracted: {parsed_data.get('Name', 'N/A')}")
    print(f"  [+] Email: {parsed_data.get('Email', 'N/A')}")
    print(f"  [+] Phone: {parsed_data.get('Phone', 'N/A')}")

    # Step 3: Create or get candidate
    print("  [3/8] Creating/updating candidate record...")
    ident = {
        'email': parsed_data.get('Email') or parsed_data.get('email'),
        'phone': parsed_data.get('Phone') or parsed_data.get('phone'),
        'name': parsed_data.get('Name') or parsed_data.get('name')
    }

    # Check if candidate already exists
    candidate = None
    if ident['email']:
        candidate = Candidate.objects.filter(email=ident['email']).first()
    elif ident['phone']:
        candidate = Candidate.objects.filter(phone=ident['phone']).first()

    if candidate:
        print(f"  [+] Found existing candidate: {candidate.name}")
        # Update candidate data
        for field in ['name', 'email', 'phone', 'skills', 'education', 'experience', 'projects']:
            value = parsed_data.get(field.capitalize()) or parsed_data.get(field)
            if value and value != []:
                setattr(candidate, field, value)
        candidate.save()
    else:
        print("  [+] Creating new candidate...")
        candidate = Candidate.objects.create(
            name=ident['name'] or '',
            email=ident['email'] or None,
            phone=ident['phone'] or '',
            skills=parsed_data.get('Skills') or parsed_data.get('skills') or [],
            education=parsed_data.get('Education') or parsed_data.get('education') or [],
            experience=parsed_data.get('Experience') or parsed_data.get('experience') or [],
            projects=parsed_data.get('Projects') or parsed_data.get('projects') or []
        )

    # Step 4: Create resume record
    print("  [4/8] Creating resume record...")
    # Save file to media
    with open(file_path, 'rb') as f:
        file_content = f.read()

    safe_filename = "".join(c for c in file_path.name if c.isalnum() or c in "_.-") or "resume"
    media_path = default_storage.save(f"resumes/{safe_filename}", ContentFile(file_content))

     # Get or create a default recruiter user to set as uploaded_by
     from accounts.models import CustomUser
     default_recruiter = CustomUser.objects.filter(role='recruiter').first()
     if not default_recruiter:
         default_recruiter = CustomUser.objects.create_user(
             username='default_recruiter',
             email='recruiter@example.com',
             password='defaultpassword123',
             role='recruiter'
         )
     
     resume = Resume.objects.create(
         candidate=candidate,
         file=media_path,
         file_name=file_path.name,
         text=text,
         source='upload',
         uploaded_by=default_recruiter
     )
    print(f"  [+] Resume created with ID: {resume.id}")

    # Step 5: Chunk resume text
    print("  [5/8] Chunking resume text...")
    chunk_and_store_resume(resume.id)
    chunks_count = resume.chunks.count()
    print(f"  [+] Created {chunks_count} chunks")

    # Step 6: Generate embeddings
    print("  [6/8] Generating embeddings...")
    embedding_service.generate_for_resumes(resume_ids=[resume.id])
    print("  [+] Embeddings generated")

    # Step 7: Extract skills
    print("  [7/8] Extracting skills...")
    skills = skill_service.extract_skills(candidate, text)
    print(f"  [+] Extracted {len(skills)} skills")

    # Step 8: Generate summary
    print("  [8/8] Generating candidate summary...")
    if not candidate.summary:
        summary = summary_service.generate_candidate_summary(candidate, text)  # noqa: F841
        print("  [+] Summary generated")
    else:
        print("  [+] Summary already exists")

    print(f"\n[+] SUCCESS: {file_path.name} processed completely!")
    return True


def process_all_resumes():
    """Process all resume files from the resumes/ folder."""
    print("=" * 60)
    print("PROCESSING ALL RESUMES")
    print("=" * 60)
    print()
    
    resume_files = get_resume_files()
    
    if not resume_files:
        print("[-] No resume files found to process!")
        return
    
    success_count = 0
    failure_count = 0
    
    for file_path in resume_files:
        success = process_resume_file(file_path)
        if success:
            success_count += 1
        else:
            failure_count += 1
    
    print("\n" + "=" * 60)
    print("PROCESSING COMPLETE")
    print("=" * 60)
    print(f"[+] Successfully processed: {success_count}")
    print(f"[-] Failed: {failure_count}")
    print(f"Total: {len(resume_files)}")
    print()


def create_pipeline_entries():
    """Create pipeline entries for all candidates against available jobs."""
    print("=" * 60)
    print("CREATING PIPELINE ENTRIES")
    print("=" * 60)
    
    # Get all candidates
    candidates = Candidate.objects.all()
    candidate_count = candidates.count()
    
    # Get all jobs
    jobs = JobDescription.objects.all()
    job_count = jobs.count()
    
    print(f"Found {candidate_count} candidates")
    print(f"Found {job_count} jobs")
    
    if candidate_count == 0:
        print("[-] No candidates found!")
        return
    
    if job_count == 0:
        print("[-] No jobs found! Creating sample jobs...")
        # Create sample jobs if none exist
        sample_jobs = [
            {
                'title': 'Software Engineer',
                'description': 'We are looking for a skilled software engineer with experience in Python, Django, and web development.',
                'skills': 'Python, Django, JavaScript, SQL, Git'
            },
            {
                'title': 'SAP ABAP Developer',
                'description': 'Looking for an experienced SAP ABAP developer with strong technical skills in SAP modules.',
                'skills': 'SAP ABAP, SAP HANA, SQL, OOABAP, Functional Modules'
            },
            {
                'title': 'SAP FICO Consultant',
                'description': 'Seeking a SAP FICO consultant with expertise in financial accounting and controlling modules.',
                'skills': 'SAP FICO, FI, CO, General Ledger, Asset Accounting'
            }
        ]
        
        for job_data in sample_jobs:
            JobDescription.objects.create(**job_data)
            print(f"  [+] Created job: {job_data['title']}")
        
        jobs = JobDescription.objects.all()
        job_count = jobs.count()
    
    print(f"\nCreating pipeline entries for {candidate_count} candidates against {job_count} jobs...")
    
    pipeline_count = 0
    for candidate in candidates:
        for job in jobs:
            # Check if pipeline already exists
            if not CandidatePipeline.objects.filter(candidate=candidate, job=job).exists():
                CandidatePipeline.objects.create(
                    candidate=candidate,
                    job=job,
                    current_stage='applied',
                    notes='Initial application'
                )
                pipeline_count += 1
                print(f"  [+] Created pipeline: {candidate.name} -> {job.title}")
    
    print(f"\n[+] Created {pipeline_count} new pipeline entries")
    print()


def main():
    """Main execution function."""
    print("\n" + "=" * 60)
    print("RESET AND PROCESS ALL RESUMES")
    print("=" * 60)
    print()

    try:
        _extracted_from_main_10()
    except Exception as e:
        print(f"\n[-] ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


# TODO Rename this here and in `main`
def _extracted_from_main_10():
    # Step 1: Clear all data
    clear_all_data()

    # Step 2: Clear media resume files
    clear_media_resumes()

    # Step 3: Process all resumes from resumes/ folder
    process_all_resumes()

    # Step 4: Create pipeline entries
    create_pipeline_entries()

    # Final summary
    print("=" * 60)
    print("FINAL SUMMARY")
    print("=" * 60)
    print(f"Candidates: {Candidate.objects.count()}")
    print(f"Resumes: {Resume.objects.count()}")
    print(f"Resume Chunks: {ResumeChunk.objects.count()}")
    print(f"Pipeline Entries: {CandidatePipeline.objects.count()}")
    print(f"Jobs: {JobDescription.objects.count()}")
    print(f"Skills: {Skill.objects.count()}")
    print()
    print("[+] ALL TASKS COMPLETED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == '__main__':
    main()