"""
Resume Similarity Detection Service

This service detects duplicate or highly similar resumes using vector similarity
with pgvector embeddings stored in PostgreSQL.
"""

import logging
from typing import List, Dict, Optional, Tuple
from django.db.models import Max, FloatField, ExpressionWrapper, Q, F
from pgvector.django import CosineDistance
from pgvector.django import L2Distance

from ..models import Candidate, Resume, ResumeChunk
from .embeddings import service as embedding_service

logger = logging.getLogger(__name__)


class SimilarityDetectionService:
    """
    Service for detecting duplicate or similar resumes using vector similarity.
    
    Uses pgvector's efficient vector similarity search to compare resume embeddings
    and identify potential duplicates or highly similar candidates.
    """
    
    # Similarity threshold for marking duplicates
    DUPLICATE_THRESHOLD = 0.90
    
    # Similarity threshold for marking similar (but not duplicate)
    SIMILAR_THRESHOLD = 0.75
    
    # Default number of similar candidates to return
    DEFAULT_LIMIT = 5
    
    def __init__(self):
        """Initialize the similarity detection service."""
        self.embedding_service = embedding_service
    
    def check_resume_similarity(
        self,
        resume_text: str,
        candidate_id: Optional[int] = None,
        threshold: float = DUPLICATE_THRESHOLD,
        limit: int = DEFAULT_LIMIT,
        distance_metric: str = 'cosine'
    ) -> Dict:
        """
        Check if a resume text is similar to existing resumes.
        
        Args:
            resume_text: Text content of the resume
            candidate_id: Optional candidate ID to exclude from comparison
            threshold: Similarity threshold (0.0 to 1.0)
            limit: Maximum number of similar candidates to return
            distance_metric: Distance metric to use ('cosine' or 'l2')
        
        Returns:
            Dictionary containing:
            - is_duplicate: Boolean indicating if duplicate found
            - similar_candidates: List of similar candidates with scores
            - max_similarity: Maximum similarity score found
            - total_candidates_checked: Number of candidates compared
        """
        try:
            # Generate embedding for the new resume
            logger.info(f"Generating embedding for resume similarity check...")
            new_embedding = self.embedding_service.get_embedding(resume_text)
            
            if not new_embedding:
                logger.warning("Failed to generate embedding for resume")
                return {
                    'is_duplicate': False,
                    'similar_candidates': [],
                    'max_similarity': 0.0,
                    'total_candidates_checked': 0
                }
            
            # Search for similar resumes using pgvector
            similar_candidates = self._search_similar_resumes(
                embedding=new_embedding,
                candidate_id=candidate_id,
                threshold=threshold,
                limit=limit,
                distance_metric=distance_metric
            )
            
            # Determine if duplicate exists
            is_duplicate = False
            max_similarity = 0.0
            
            if similar_candidates:
                max_similarity = similar_candidates[0]['similarity_score']
                is_duplicate = max_similarity >= self.DUPLICATE_THRESHOLD
            
            # Get total count of candidates with embeddings
            total_candidates = ResumeChunk.objects.filter(
                embedding__isnull=False
            ).values('resume__candidate').distinct().count()
            
            logger.info(
                f"Similarity check complete. Found {len(similar_candidates)} "
                f"similar candidates. Max similarity: {max_similarity:.4f}. "
                f"Is duplicate: {is_duplicate}"
            )
            
            return {
                'is_duplicate': is_duplicate,
                'similar_candidates': similar_candidates,
                'max_similarity': max_similarity,
                'total_candidates_checked': total_candidates
            }
            
        except Exception as e:
            logger.error(f"Error checking resume similarity: {e}")
            raise
    
    def check_resume_similarity_by_resume_id(
        self,
        resume_id: int,
        threshold: float = DUPLICATE_THRESHOLD,
        limit: int = DEFAULT_LIMIT,
        distance_metric: str = 'cosine'
    ) -> Dict:
        """
        Check similarity for a specific resume by its ID.
        
        Args:
            resume_id: ID of the resume to check
            threshold: Similarity threshold (0.0 to 1.0)
            limit: Maximum number of similar candidates to return
            distance_metric: Distance metric to use ('cosine' or 'l2')
        
        Returns:
            Dictionary containing similarity results
        """
        try:
            # Get the resume
            resume = Resume.objects.get(id=resume_id)
            
            # Get candidate ID to exclude
            candidate_id = resume.candidate_id if resume.candidate else None
            
            # Use resume text for comparison
            return self.check_resume_similarity(
                resume_text=resume.text,
                candidate_id=candidate_id,
                threshold=threshold,
                limit=limit,
                distance_metric=distance_metric
            )
            
        except Resume.DoesNotExist:
            logger.error(f"Resume with ID {resume_id} not found")
            raise
        except Exception as e:
            logger.error(f"Error checking resume similarity by ID: {e}")
            raise
    
    def _search_similar_resumes(
        self,
        embedding: List[float],
        candidate_id: Optional[int] = None,
        threshold: float = DUPLICATE_THRESHOLD,
        limit: int = DEFAULT_LIMIT,
        distance_metric: str = 'cosine'
    ) -> List[Dict]:
        """
        Search for similar resumes using pgvector.
        
        Args:
            embedding: Embedding vector to search with
            candidate_id: Optional candidate ID to exclude
            threshold: Minimum similarity threshold
            limit: Maximum results to return
            distance_metric: Distance metric ('cosine' or 'l2')
        
        Returns:
            List of similar candidates with similarity scores
        """
        # Choose distance metric
        if distance_metric == 'l2':
            distance_field = L2Distance('embedding', embedding)
            # For L2, similarity is 1 / (1 + distance)
            similarity_expression = ExpressionWrapper(
                1.0 / (1.0 + distance_field),
                output_field=FloatField()
            )
        else:  # cosine (default)
            distance_field = CosineDistance('embedding', embedding)
            # For cosine, similarity is 1 - distance
            similarity_expression = ExpressionWrapper(
                1.0 - distance_field,
                output_field=FloatField()
            )
        
        # Build query
        query = ResumeChunk.objects.annotate(
            similarity=similarity_expression
        ).filter(
            embedding__isnull=False
        )
        
        # Exclude current candidate if provided
        if candidate_id:
            query = query.exclude(resume__candidate_id=candidate_id)
        
        # Get candidates with highest similarity scores
        candidates = (
            query.values('resume__candidate', 'resume__candidate__name', 'resume__candidate__email')
            .annotate(
                max_similarity=Max('similarity'),
                chunk_count=Max('chunk_index') + 1
            )
            .filter(max_similarity__gte=threshold)
            .order_by('-max_similarity')[:limit]
        )
        
        # Format results
        similar_candidates = []
        for candidate in candidates:
            similar_candidates.append({
                'candidate_id': candidate['resume__candidate'],
                'candidate_name': candidate['resume__candidate__name'] or 'Unknown',
                'candidate_email': candidate['resume__candidate__email'],
                'similarity_score': float(candidate['max_similarity']),
                'chunks_compared': candidate['chunk_count'],
                'is_duplicate': float(candidate['max_similarity']) >= self.DUPLICATE_THRESHOLD,
                'is_similar': float(candidate['max_similarity']) >= self.SIMILAR_THRESHOLD
            })
        
        return similar_candidates
    
    def find_all_similar_candidates(
        self,
        candidate_id: int,
        threshold: float = SIMILAR_THRESHOLD,
        limit: int = DEFAULT_LIMIT
    ) -> List[Dict]:
        """
        Find all candidates similar to a given candidate.
        
        Args:
            candidate_id: ID of the candidate to find similar ones for
            threshold: Minimum similarity threshold
            limit: Maximum results to return
        
        Returns:
            List of similar candidates with similarity scores
        """
        try:
            # Get the candidate
            candidate = Candidate.objects.get(id=candidate_id)
            
            # Get the candidate's resume
            resume = candidate.resumes.first()
            
            if not resume:
                logger.warning(f"No resume found for candidate {candidate_id}")
                return []
            
            # Check similarity using resume text
            result = self.check_resume_similarity(
                resume_text=resume.text,
                candidate_id=candidate_id,  # Exclude self
                threshold=threshold,
                limit=limit
            )
            
            return result['similar_candidates']
            
        except Candidate.DoesNotExist:
            logger.error(f"Candidate with ID {candidate_id} not found")
            raise
        except Exception as e:
            logger.error(f"Error finding similar candidates: {e}")
            raise
    
    def mark_duplicate_resumes(
        self,
        resume_id: int,
        similar_candidate_ids: List[int]
    ) -> Dict:
        """
        Mark resumes as duplicates.
        
        Args:
            resume_id: ID of the resume to mark
            similar_candidate_ids: List of candidate IDs to mark as duplicates
        
        Returns:
            Dictionary with marking results
        """
        try:
            # Get the resume
            resume = Resume.objects.get(id=resume_id)
            
            marked_count = 0
            results = []
            
            for candidate_id in similar_candidate_ids:
                # Get similar candidate's resumes
                similar_resumes = Resume.objects.filter(candidate_id=candidate_id)
                
                for similar_resume in similar_resumes:
                    # Mark as duplicate (you could add a field to Resume model)
                    # For now, we'll just log it
                    logger.info(
                        f"Marking resume {similar_resume.id} as duplicate of resume {resume_id}"
                    )
                    marked_count += 1
                    results.append({
                        'resume_id': similar_resume.id,
                        'file_name': similar_resume.file_name,
                        'candidate_id': candidate_id,
                        'marked_as_duplicate': True
                    })
            
            return {
                'marked_count': marked_count,
                'results': results
            }
            
        except Resume.DoesNotExist:
            logger.error(f"Resume with ID {resume_id} not found")
            raise
        except Exception as e:
            logger.error(f"Error marking duplicate resumes: {e}")
            raise
    
    def get_similarity_statistics(self) -> Dict:
        """
        Get statistics about resume similarities in the database.
        
        Returns:
            Dictionary with similarity statistics
        """
        try:
            # Get total candidates
            total_candidates = Candidate.objects.count()
            
            # Get candidates with embeddings
            candidates_with_embeddings = ResumeChunk.objects.filter(
                embedding__isnull=False
            ).values('resume__candidate').distinct().count()
            
            # Get total resume chunks
            total_chunks = ResumeChunk.objects.count()
            
            # Get chunks with embeddings
            chunks_with_embeddings = ResumeChunk.objects.filter(
                embedding__isnull=False
            ).count()
            
            return {
                'total_candidates': total_candidates,
                'candidates_with_embeddings': candidates_with_embeddings,
                'total_resume_chunks': total_chunks,
                'chunks_with_embeddings': chunks_with_embeddings,
                'embedding_coverage': f"{(chunks_with_embeddings / total_chunks * 100):.2f}%" if total_chunks > 0 else "0%"
            }
            
        except Exception as e:
            logger.error(f"Error getting similarity statistics: {e}")
            raise


# Singleton instance
similarity_detection_service = SimilarityDetectionService()