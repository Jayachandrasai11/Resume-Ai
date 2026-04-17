"""
Management command to delete all resume-related data from the database.
This deletes: Candidates, Resumes, ResumeChunks (embeddings), and related ranking data.
"""
from django.core.management.base import BaseCommand
from django.db import connection

from apps.candidates.models import Candidate, Resume, ResumeChunk
from apps.ranking.models import JobCandidate


class Command(BaseCommand):
    help = 'Delete all resume-related data (Candidates, Resumes, Chunks, Embeddings, and ranking data)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Skip confirmation prompt',
        )

    def handle(self, *args, **options):
        # First, let's show current counts
        self.stdout.write("\n" + "="*60)
        self.stdout.write("CURRENT DATABASE STATS")
        self.stdout.write("="*60)
        
        chunk_count = ResumeChunk.objects.count()
        resume_count = Resume.objects.count()
        candidate_count = Candidate.objects.count()
        job_candidate_count = JobCandidate.objects.count()
        
        self.stdout.write(f"ResumeChunks (embeddings): {chunk_count}")
        self.stdout.write(f"Resumes: {resume_count}")
        self.stdout.write(f"Candidates: {candidate_count}")
        self.stdout.write(f"JobCandidates (ranking): {job_candidate_count}")
        self.stdout.write("="*60 + "\n")
        
        if not options['force']:
            confirm = input("Are you sure you want to DELETE ALL this data? [y/N]: ")
            if confirm.lower() != 'y':
                self.stdout.write(self.style.WARNING("Aborted."))
                return
        
        self.stdout.write(self.style.WARNING("\nDeleting data in reverse dependency order..."))
        
        # Delete in correct order to handle foreign keys properly
        self.stdout.write("\n1. Deleting JobCandidates (ranking data)...")
        job_cand_deleted, _ = JobCandidate.objects.all().delete()
        self.stdout.write(f"   Deleted: {job_cand_deleted} JobCandidates")
        
        self.stdout.write("\n2. Deleting ResumeChunks (embeddings)...")
        chunk_deleted, _ = ResumeChunk.objects.all().delete()
        self.stdout.write(f"   Deleted: {chunk_deleted} ResumeChunks")
        
        self.stdout.write("\n3. Deleting Resumes...")
        resume_deleted, _ = Resume.objects.all().delete()
        self.stdout.write(f"   Deleted: {resume_deleted} Resumes")
        
        self.stdout.write("\n4. Deleting Candidates...")
        cand_deleted, _ = Candidate.objects.all().delete()
        self.stdout.write(f"   Deleted: {cand_deleted} Candidates")
        
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("DELETION COMPLETE"))
        self.stdout.write("="*60)
        self.stdout.write(f"\nTotal deleted:")
        self.stdout.write(f"  - JobCandidates: {job_cand_deleted}")
        self.stdout.write(f"  - ResumeChunks: {chunk_deleted}")
        self.stdout.write(f"  - Resumes: {resume_deleted}")
        self.stdout.write(f"  - Candidates: {cand_deleted}")
        
        # Verify cleanup
        self.stdout.write("\n" + "="*60)
        self.stdout.write("VERIFICATION - Remaining counts:")
        self.stdout.write("="*60)
        self.stdout.write(f"ResumeChunks: {ResumeChunk.objects.count()}")
        self.stdout.write(f"Resumes: {Resume.objects.count()}")
        self.stdout.write(f"Candidates: {Candidate.objects.count()}")
        self.stdout.write(f"JobCandidates: {JobCandidate.objects.count()}")
        
        self.stdout.write(self.style.SUCCESS("\nAll resume-related data has been deleted successfully!"))