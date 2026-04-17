"""
Management command to rebuild all resume chunk embeddings.
Useful when embedding model is updated or dimensions change.
"""

import logging
from django.core.management.base import BaseCommand
from apps.candidates.services.embeddings import get_embedding_service
from apps.candidates.models import ResumeChunk

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    """Rebuild all resume chunk embeddings."""
    
    help = 'Rebuild all resume chunk embeddings'

    def add_arguments(self, parser):
        """Add command line arguments."""
        parser.add_argument(
            '--batch-size',
            type=int,
            default=128,
            help='Batch size for processing embeddings'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force rebuild all embeddings including existing ones'
        )

    def handle(self, *args, **options):
        """Handle the command."""
        logger.info("Starting embedding rebuild process")
        
        # Get service instance
        service = get_embedding_service()
        
        # Validate model
        self.stdout.write(self.style.SUCCESS("Validating embedding service..."))
        if not service.validate_embedding_dimensions():
            self.stdout.write(self.style.ERROR("ERROR: Embedding dimensions validation failed"))
            return
        
        if not service.validate_model_consistency():
             self.stdout.write(self.style.ERROR("ERROR: Model consistency validation failed"))
            return
        
        self.stdout.write(self.style.SUCCESS("OK: Embedding service validation passed"))
        
        # Get chunks to process
        self.stdout.write("Collecting resume chunks to process...")
        
        if options['force']:
            qs = ResumeChunk.objects.all()
            self.stdout.write(f"Forcing rebuild of all {qs.count()} chunks")
        else:
            qs = ResumeChunk.objects.filter(embedding__isnull=True)
            self.stdout.write(f"Found {qs.count()} chunks without embeddings")
        
        # Process chunks
        batch_size = options['batch_size']
        self.stdout.write(f"Processing with batch size: {batch_size}")
        
        result = service.generate_for_queryset(qs, batch_size)
        
        self.stdout.write(
            self.style.SUCCESS(
                f"OK: Embedding rebuild complete: {result['processed']}/{result['total']} chunks processed"
            )
        )
        
        if result['processed'] > 0:
            self.stdout.write(
                self.style.WARNING(
                    "\n⚠️  Note: If you updated the embedding model, you should run this with --force to rebuild all embeddings"
                )
            )