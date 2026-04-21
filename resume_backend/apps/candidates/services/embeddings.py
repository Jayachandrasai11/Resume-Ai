"""
Production-grade embedding service for resume-job matching system.
This service ensures consistent, reliable embedding generation using HuggingFace Transformers
with proper error handling, singleton pattern, and validation.
"""

import os
import logging
import gc
import torch
from typing import Iterable, List, Optional, Dict
from django.db import transaction
from ..models import ResumeChunk

# Configure logger
logger = logging.getLogger(__name__)

# Model configuration
MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
MODEL_DIMENSIONS = 384
CACHE_DIR = os.path.join(os.path.dirname(__file__), '.cache')

# Singleton instance
_service_instance = None


class EmbeddingService:
    """
    Production-grade embedding service with singleton pattern.
    Ensures model is loaded only once and reused across requests.
    """
    _instance = None
    _model = None
    _tokenizer = None
    _is_initialized = False

    def __new__(cls, *args, **kwargs):
        """Implement singleton pattern to ensure only one instance exists."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self, model_name: str = MODEL_NAME):
        """Initialize the service lazily (model loads on first use)."""
        if self._is_initialized:
            return

        self.model_name = model_name
        self._is_initialized = True
        logger.info("Embedding service setup (models will load lazily)")

    def _ensure_initialized(self):
        if not getattr(self, '_model_loaded', False):
            self._load_model()
            self._model_loaded = True

    def _load_model(self):
        """Load SentenceTransformer model with memory optimizations."""
        try:
            from sentence_transformers import SentenceTransformer
            import torch
            
            logger.info(f"Loading SentenceTransformer model: {self.model_name}")
            
            # Load model directly via sentence-transformers (more efficient)
            # Use 'cpu' device explicitly and float32 for maximum compatibility
            self._model = SentenceTransformer(
                self.model_name,
                device='cpu',
                cache_folder=CACHE_DIR
            )
            
            # Explicitly clear any torch cache
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            
            logger.info("✅ SentenceTransformer model loaded successfully")

        except Exception as e:
            logger.critical(f"❌ Failed to load embedding model: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to initialize embedding service: {str(e)}")

    def encode(self, text: str or List[str], normalize_embeddings: bool = True) -> List[List[float]] or List[float]:
        """
        Encode text(s) to embeddings using SentenceTransformer.
        """
        self._ensure_initialized()

        if not self._model:
            logger.warning("Model not loaded, attempting to reload...")
            self._load_model()

        try:
            # Handle both single text and list input
            is_batch = isinstance(text, list)
            texts = text if is_batch else [text]

            # 🛡️ PRODUCTION RAM GUARD: Force single thread to prevent memory spikes
            import torch
            torch.set_num_threads(1)
            
            # Use SentenceTransformer's encode directly
            embeddings = self._model.encode(
                texts,
                batch_size=32,
                show_progress_bar=False,
                convert_to_numpy=True,
                normalize_embeddings=normalize_embeddings
            )

            # Convert to list for JSON serialization
            result = embeddings.tolist()

            # 🧹 AGGRESSIVE CLEANUP: Flush memory immediately
            gc.collect()

            return result if is_batch else result[0]

        except Exception as e:
            logger.error(f"❌ Error generating embeddings: {str(e)}", exc_info=True)
            raise RuntimeError(f"Embedding generation failed: {str(e)}")

    def get_embedding(self, text: str) -> List[float]:
        """Alias for encode() to maintain API compatibility."""
        return self.encode(text)

    def generate_for_queryset(self, qs, batch_size: int = 128) -> Dict[str, int]:
        """Generate embeddings for a queryset of resume chunks."""
        ids = list(qs.values_list("id", flat=True))
        processed_count = 0

        # Note: Unblocking async processing (e.g., Celery) is recommended for high volume.
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i:i + batch_size]
            # Convert to list to ensure ordered mapping with embeddings
            batch = list(ResumeChunk.objects.filter(id__in=batch_ids))
            
            # Get chunk texts and generate embeddings
            texts = [c.chunk_text for c in batch]
            embeddings = self.encode(texts)

            # Update database via bulk operations using bulk_create as requested
            chunks_to_update = []
            for chunk, embedding in zip(batch, embeddings):
                if not chunk.embedding:
                    chunk.embedding = embedding
                    chunks_to_update.append(chunk)

            if chunks_to_update:
                ResumeChunk.objects.bulk_create(
                    chunks_to_update,
                    update_conflicts=True,
                    unique_fields=['id'],
                    update_fields=['embedding']
                )
                processed_count += len(chunks_to_update)

        logger.info(f"Generated embeddings for {processed_count}/{len(ids)} resume chunks")
        return {"total": len(ids), "processed": processed_count}

    def generate_for_resumes(self, resume_ids: Optional[Iterable[int]] = None) -> Dict[str, int]:
        """Generate embeddings for all chunks of specific resumes."""
        qs = ResumeChunk.objects.filter(embedding__isnull=True)
        if resume_ids:
            qs = qs.filter(resume_id__in=resume_ids)
        
        logger.info(f"Found {qs.count()} chunks without embeddings to process")
        return self.generate_for_queryset(qs.order_by("resume_id", "chunk_index"))

    def validate_embedding_dimensions(self) -> bool:
        """Validate that the model produces embeddings of expected dimensions."""
        test_text = "This is a test"
        embedding = self.encode(test_text)
        
        if len(embedding) != MODEL_DIMENSIONS:
            logger.error(
                f"❌ Embedding dimension mismatch! "
                f"Expected: {MODEL_DIMENSIONS}, Got: {len(embedding)}"
            )
            return False
        
        logger.debug("✅ Embedding dimensions validation passed")
        return True

    def validate_model_consistency(self) -> bool:
        """
        Validate the model is consistent by checking embeddings for known texts.
        This helps detect model mismatch issues.
        """
        # Known test cases with expected properties
        test_cases = [
            "Software Engineer with Python and Django experience",
            "Data Scientist specializing in machine learning",
            "Product Manager with 5+ years of experience"
        ]
        
        try:
            embeddings = self.encode(test_cases)
            
            # Check all embeddings have correct dimensions
            for i, embedding in enumerate(embeddings):
                if len(embedding) != MODEL_DIMENSIONS:
                    logger.error(f"❌ Embedding {i} has invalid dimensions: {len(embedding)}")
                    return False
            
            # Check embeddings are not identical (basic sanity check)
            embedding_sets = [set(emb) for emb in embeddings]
            if all(len(emb_set) < 10 for emb_set in embedding_sets):
                logger.error("❌ Generated embeddings appear to be identical or invalid")
                return False
            
            logger.debug("✅ Model consistency validation passed")
            return True
            
        except Exception as e:
            logger.error(f"❌ Model consistency validation failed: {str(e)}", exc_info=True)
            return False


# Singleton service instance
def get_embedding_service() -> EmbeddingService:
    """Get the singleton instance of the embedding service."""
    global _service_instance
    if _service_instance is None:
        logger.info("Creating new EmbeddingService instance")
        _service_instance = EmbeddingService()
    return _service_instance


# Convenience alias for backwards compatibility removed to prevent OOM
# Use get_embedding_service() instead.

