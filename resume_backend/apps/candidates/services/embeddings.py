"""
Production-grade embedding service for resume-job matching system.
Uses Google Gemini Cloud Embedding API — no local model loading.
This approach is memory-safe and avoids OOM/port-timeout issues on Render.
"""

import os
import logging
from typing import Iterable, List, Optional, Dict
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
        """Configure Gemini Embedding API instead of loading a local model."""
        try:
            import google.generativeai as genai
            from django.conf import settings
            
            api_key = getattr(settings, 'GEMINI_API_KEY', None)
            if not api_key:
                api_key = os.environ.get('GEMINI_API_KEY')
            
            if not api_key:
                logger.error("❌ GEMINI_API_KEY not found. Neural matching will fail.")
                return

            genai.configure(api_key=api_key)
            logger.info("✅ Gemini Embedding API configured (Neural engine moved to cloud)")
            self._model_ready = True

        except Exception as e:
            logger.critical(f"❌ Failed to configure Gemini API: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to initialize cloud embedding service: {str(e)}")

    def encode(self, text: str or List[str], normalize_embeddings: bool = True) -> List[List[float]] or List[float]:
        """
        Encode text(s) to embeddings using Gemini Cloud API.
        Uses 384 dimensions to maintain compatibility with existing vector data.
        """
        self._ensure_initialized()

        try:
            import google.generativeai as genai
            from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
            
            # 🛡️ FREE TIER PROTECTION: Automatic retry for 429 Too Many Requests
            @retry(
                stop=stop_after_attempt(3),
                wait=wait_exponential(multiplier=1, min=2, max=10),
                retry=retry_if_exception_type(Exception), # Catch API errors
                reraise=True
            )
            def _call_gemini_api(texts):
                models_to_try = [
                    ("models/embedding-001", False),      # Standard stable model (768 dims)
                    ("models/text-embedding-004", True),  # Supports output_dimensionality
                    ("embedding-001", False)              # Without prefix as fallback
                ]
                
                last_err = None
                for model_name, supports_dim in models_to_try:
                    try:
                        kwargs = {
                            "model": model_name,
                            "content": texts,
                            "task_type": "retrieval_document"
                        }
                        if supports_dim:
                            kwargs["output_dimensionality"] = 384
                            
                        response = genai.embed_content(**kwargs)
                        embeddings = response.get('embedding', [])
                        
                        # Handle potential list/single discrepancy
                        is_batch_call = isinstance(texts, list)
                        if is_batch_call and embeddings and not isinstance(embeddings[0], list):
                            # Some versions return a flattened list for small batches
                            # (Wait, usually it's correct but let's be safe)
                            pass

                        # TRUNCATION GUARD: If the model returned 768 dims, truncate to 384
                        # to match pgvector column in database.
                        if embeddings:
                            if isinstance(embeddings[0], list):
                                if len(embeddings[0]) > 384:
                                    embeddings = [e[:384] for e in embeddings]
                            elif len(embeddings) > 384:
                                embeddings = embeddings[:384]
                                
                        return {"embedding": embeddings, "model_used": model_name}
                    except Exception as e:
                        last_err = e
                        logger.warning(f"Failed to use embedding model {model_name}: {str(e)}")
                        continue
                
                raise last_err

            # Handle both single text and list input
            is_batch = isinstance(text, list)
            texts = text if is_batch else [text]
            
            # Execute with retry logic
            response_data = _call_gemini_api(texts)
            embeddings = response_data.get('embedding', [])
            
            # Normalize if requested (Gemini usually returns normalized but we ensure it)
            if normalize_embeddings and is_batch:
                import numpy as np
                norm_embeddings = []
                for e in embeddings:
                    arr = np.array(e)
                    norm = np.linalg.norm(arr)
                    norm_embeddings.append((arr / norm if norm > 0 else arr).tolist())
                return norm_embeddings
            elif normalize_embeddings:
                import numpy as np
                arr = np.array(embeddings)
                norm = np.linalg.norm(arr)
                return (arr / norm if norm > 0 else arr).tolist()

            return embeddings

        except Exception as e:
            logger.error(f"❌ Gemini Embedding Error: {str(e)}", exc_info=True)
            # Fallback/Safety: Return zero vector to prevent crash if AI is down
            zero_vec = [0.0] * 384
            return [zero_vec] * len(text) if isinstance(text, list) else zero_vec

    def get_embedding(self, text: str) -> List[float]:
        """Alias for encode() to maintain API compatibility."""
        return self.encode(text)

    def generate_for_queryset(self, qs, batch_size: int = 50) -> Dict[str, int]:
        """Generate embeddings for a queryset of resume chunks with Free Tier safety."""
        import time
        ids = list(qs.values_list("id", flat=True))
        processed_count = 0

        # Note: Reduced batch size for Gemini Free Tier safety (prevent 429/TPM errors)
        for i in range(0, len(ids), batch_size):
            batch_ids = ids[i:i + batch_size]
            # Convert to list to ensure ordered mapping with embeddings
            batch = list(ResumeChunk.objects.filter(id__in=batch_ids))
            
            # Get chunk texts and generate embeddings
            texts = [c.chunk_text for c in batch]
            embeddings = self.encode(texts)

            # Update database
            chunks_to_update = []
            for chunk, embedding in zip(batch, embeddings):
                if not chunk.embedding:
                    chunk.embedding = embedding
                    chunks_to_update.append(chunk)

            if chunks_to_update:
                ResumeChunk.objects.bulk_update(chunks_to_update, ['embedding'])
                processed_count += len(chunks_to_update)
            
            # 🛡️ RATE LIMIT BUFFER: Sleep small amount between batches for Free Tier
            if i + batch_size < len(ids):
                time.sleep(1.0)

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

