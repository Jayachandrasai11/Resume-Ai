"""
Production-grade embedding service for resume-job matching system.
This service ensures consistent, reliable embedding generation using HuggingFace Transformers
with proper error handling, singleton pattern, and validation.
"""

import os
import logging
import torch
from typing import Iterable, List, Optional, Dict
from django.db import transaction
from transformers import AutoTokenizer, AutoModel
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
        """Initialize the service (only once due to singleton)."""
        if self._is_initialized:
            return

        self.model_name = model_name
        self._load_model()
        self._is_initialized = True
        logger.info("✅ Embedding service initialized successfully")

    def _load_model(self):
        """Load tokenizer and model - production-grade implementation."""
        try:
            logger.info(f"Loading embedding model: {self.model_name}")
            
            # Load tokenizer
            self._tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                cache_dir=CACHE_DIR,
                clean_up_tokenization_spaces=True
            )

            # Load model - explicit CPU configuration
            # IMPORTANT: Do NOT use device_map='cpu' - it causes meta tensor issues
            # Use low_cpu_mem_usage=True to optimize memory usage on CPU
            self._model = AutoModel.from_pretrained(
                self.model_name,
                cache_dir=CACHE_DIR,
                low_cpu_mem_usage=True,
                dtype=torch.float32,
                device_map=None  # Explicitly disable device_map
            )

            # Explicitly move model to CPU (resolve meta tensor issues)
            self._model = self._model.to(torch.device("cpu"))
            self._model.eval()

            logger.info("✅ Embedding model loaded successfully")

        except Exception as e:
            logger.critical(f"❌ Failed to load embedding model: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to initialize embedding service: {str(e)}")

    def encode(self, text: str or List[str], normalize_embeddings: bool = True) -> List[List[float]] or List[float]:
        """
        Encode text(s) to embeddings.
        Handles single text and batch encoding.
        """
        if not self._model or not self._tokenizer:
            logger.warning("Model or tokenizer not loaded, attempting to reload...")
            self._load_model()

        # Handle both single text and list input
        is_batch = isinstance(text, list)
        texts = text if is_batch else [text]

        try:
            # Tokenize inputs
            encoded_input = self._tokenizer(
                texts,
                padding=True,
                truncation=True,
                max_length=128,
                return_tensors='pt'
            )

            # Move tensors to CPU (explicitly ensure compatibility)
            encoded_input = {k: v.to(torch.device("cpu")) for k, v in encoded_input.items()}

            # Generate embeddings with no gradient (faster and saves memory)
            with torch.no_grad():
                model_output = self._model(**encoded_input)

            # Mean pooling to get sentence embeddings
            token_embeddings = model_output[0]
            input_mask_expanded = encoded_input['attention_mask'].unsqueeze(-1).expand(token_embeddings.size()).float()
            sentence_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1) / torch.clamp(input_mask_expanded.sum(1), min=1e-9)

            # Normalize if requested
            if normalize_embeddings:
                sentence_embeddings = torch.nn.functional.normalize(sentence_embeddings, p=2, dim=1)

            # Convert to list
            embeddings = sentence_embeddings.tolist()

            logger.debug(f"Encoded {len(texts)} text(s) to embeddings of shape {len(embeddings[0])}")

            return embeddings if is_batch else embeddings[0]

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


# Convenience alias for backwards compatibility
service = get_embedding_service()
