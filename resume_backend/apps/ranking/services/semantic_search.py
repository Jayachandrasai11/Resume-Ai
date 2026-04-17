from django.db.models import Max, FloatField, ExpressionWrapper
from pgvector.django import CosineDistance
from apps.candidates.models import Candidate
from apps.candidates.services.embeddings import service as emb_service
import logging

logger = logging.getLogger(__name__)

class SemanticSearchService:
    def search_candidates(self, job_description: str, limit: int = 10, threshold: float = 0.3):
        # Validate embedding service
        if not emb_service.validate_embedding_dimensions():
            logger.error("❌ Embedding service validation failed - dimensions mismatch")
            return []
            
        vector = emb_service.get_embedding(job_description)
        
        # Validate embedding dimensions
        if len(vector) != 384:
            logger.error(f"❌ Generated embedding has invalid dimensions: {len(vector)}, expected 384")
            return []
        
        # Calculate similarity (1 - Cosine Distance) via ORM annotations
        return (Candidate.objects
            .annotate(similarity=ExpressionWrapper(
                1 - CosineDistance('resumes__chunks__embedding', vector),
                output_field=FloatField()
            ))
            .filter(similarity__gte=threshold)
            .values('id', 'name', 'email', 'summary', 'skills')
            .annotate(similarity_score=Max('similarity'))
            .order_by('-similarity_score')[:limit])

semantic_search_service = SemanticSearchService()
