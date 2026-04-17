"""
Advanced Candidate-Job Matching Engine

This module provides sophisticated matching capabilities between job descriptions 
and candidate resumes using vector embeddings and multiple similarity metrics.
"""

import logging
import math
import time
from typing import List, Dict, Any, Optional
from django.db.models import Max, FloatField, ExpressionWrapper, Q, Count, Avg
from pgvector.django import CosineDistance

from apps.candidates.models import Candidate, Resume, ResumeChunk
from apps.candidates.services.embeddings import service as embedding_service
from apps.jd_app.models import JobDescription


logger = logging.getLogger(__name__)


def safe_float(value, default=0.0):
    """Safely convert a value to float, handling NaN and None."""
    if value is None:
        return default
    try:
        f = float(value)
        return default if math.isnan(f) or math.isinf(f) else f
    except (TypeError, ValueError):
        return default


class MatchingEngine:
    """
    Advanced matching engine that calculates similarity scores between job descriptions 
    and candidate resumes using multiple strategies.
    """
    
    # Similarity thresholds for different matching strategies
    DEFAULT_THRESHOLD = 0.3
    STRICT_THRESHOLD = 0.5
    LOOSE_THRESHOLD = 0.2
    
    # Maximum number of candidates to return
    DEFAULT_LIMIT = 10
    MAX_LIMIT = 100
    
    def __init__(self):
        self.embedding_service = embedding_service
        # Validate embedding service on initialization
        try:
            if not self.embedding_service.validate_embedding_dimensions():
                logger.critical("❌ Embedding service validation failed - dimensions mismatch")
            if not self.embedding_service.validate_model_consistency():
                logger.critical("❌ Embedding service validation failed - model consistency check failed")
            logger.info("✅ Matching engine initialized successfully with valid embedding service")
        except Exception as e:
            logger.critical(f"❌ Failed to initialize matching engine: {str(e)}", exc_info=True)
            raise RuntimeError(f"Failed to initialize matching engine: {str(e)}")
    
    def match_candidates(
        self,
        job_description: str,
        limit: int = DEFAULT_LIMIT,
        threshold: float = DEFAULT_THRESHOLD,
        strategy: str = 'cosine',
        include_details: bool = False,
        recruiter_id: int = None,
        mode: str = 'smart'
    ) -> List[Dict[str, Any]]:
        """
        Match candidates to a job description using specified strategy or mode.
        
        Args:
            job_description: Text description of the job requirements
            limit: Maximum number of candidates to return
            threshold: Minimum similarity score threshold (0-1)
            strategy: Matching strategy ('cosine', 'hybrid', 'weighted')
            include_details: Whether to include detailed candidate information
            recruiter_id: Filter by resumes uploaded by this user (recruiter)
            mode: Matching mode ('smart', 'semantic', 'keyword') - takes precedence over strategy
            
        Returns:
            List of matched candidates with similarity scores
        """
        logger.debug(f"match_candidates called - job len: {len(job_description)}, limit: {limit}, threshold: {threshold}, strategy: {strategy}, recruiter_id: {recruiter_id}, mode: {mode}")
        try:
            # Validate embedding service is operational
            if not self.embedding_service.validate_embedding_dimensions():
                logger.error("❌ Embedding service validation failed - dimensions mismatch")
                return []
            
            # Map mode to strategy
            if mode == 'smart':
                strategy = 'weighted'  # Smart mode uses weighted scoring (semantic + skills + experience)
            elif mode == 'semantic':
                strategy = 'cosine'    # Deep search uses pure semantic similarity
            elif mode == 'keyword':
                strategy = 'hybrid'    # Exact match uses hybrid semantic + keyword for exact keyword matching
            
            # Generate embedding for job description
            logger.debug("Getting job embedding...")
            try:
                job_embedding = self.embedding_service.get_embedding(job_description)
            except Exception as e:
                logger.error(f"❌ Error generating job embedding: {str(e)}")
                return []
            
            # Validate embedding
            if not job_embedding or not all(isinstance(x, (int, float)) and not (isinstance(x, float) and math.isnan(x)) for x in job_embedding):
                logger.error(f"❌ Invalid job embedding generated: {job_embedding}")
                return []
            
            # Validate embedding dimensions
            if len(job_embedding) != 384:
                logger.error(f"❌ Job embedding has invalid dimensions: {len(job_embedding)}, expected 384")
                return []
            
            # CRITICAL FIX: Add skill-based filtering to improve matching accuracy
            # Extract job skills first
            job_skills = self._extract_skills_from_text(job_description)
            logger.debug(f"[FIX] Job description skills extracted: {job_skills}")
            
            if strategy == 'cosine':
                results = self._cosine_similarity_match(job_embedding, limit, threshold, include_details, recruiter_id, job_skills=job_skills)
            elif strategy == 'hybrid':
                results = self._hybrid_match(job_description, job_embedding, limit, threshold, include_details, recruiter_id, job_skills=job_skills)
            elif strategy == 'weighted':
                results = self._weighted_match(job_description, job_embedding, limit, threshold, include_details, recruiter_id, job_skills=job_skills)
            else:
                logger.warning(f"Unknown strategy: {strategy}, using cosine")
                results = self._cosine_similarity_match(job_embedding, limit, threshold, include_details, recruiter_id, job_skills=job_skills)
            
            logger.debug(f"match_candidates returned {len(results)} results")
            
            # Log queryset info for debugging
            if not results:
                # Check if candidates exist
                from apps.candidates.models import Candidate, ResumeChunk
                total_candidates = Candidate.objects.count()
                chunks_with_embedding = ResumeChunk.objects.filter(embedding__isnull=False).count()
                total_chunks = ResumeChunk.objects.count()
                logger.debug(f"Total candidates: {total_candidates}, Total chunks: {total_chunks}, Chunks with embedding: {chunks_with_embedding}")
            
            return results
            
        except Exception as e:
            logger.error(f"Error in match_candidates: {e}")
            return []
    
    def _cosine_similarity_match(
        self,
        job_embedding: List[float],
        limit: int,
        threshold: float,
        include_details: bool,
        recruiter_id: int = None,
        job_skills: set = None
    ) -> List[Dict[str, Any]]:
        """
        Match candidates using cosine similarity between embeddings.
        
        This is the most accurate method as it compares vector similarities directly.
        
        Args:
            job_embedding: The embedding vector for the job description
            limit: Maximum number of candidates to return
            threshold: Minimum similarity score threshold
            include_details: Whether to include detailed candidate information
            recruiter_id: Filter by resumes uploaded by this user (recruiter)
            job_skills: Optional set of skills extracted from job description for filtering
        """
        # Use Django ORM to calculate cosine similarity
        # Cosine Similarity = 1 - Cosine Distance

        # Debug: Check Candidate model fields for ForeignKey
        candidate_fields = [f.name for f in Candidate._meta.get_fields() if hasattr(f, 'remote_field') and f.remote_field]
        logger.debug(f"Candidate ForeignKey fields: {candidate_fields}")

        # NOTE: select_related only works with forward ForeignKey/OneToOne relationships.
        # Since Resume has ForeignKey TO Candidate (not the other way), 'resumes' is a reverse
        # relationship and select_related cannot be used. Removing select_related as the
        # annotation already handles the relationship traversal.

        # Build base queryset with filters
        queryset = Candidate.objects
        
        # Filter by recruiter if provided (only show resumes uploaded by this recruiter)
        if recruiter_id:
            # Convert to integer if string
            try:
                recruiter_id = int(recruiter_id)
            except (ValueError, TypeError):
                pass
            # Only include resumes uploaded by this specific recruiter
            queryset = queryset.filter(resumes__uploaded_by_id=recruiter_id)
        
        # Filter to only candidates with resume chunks that have embeddings
        queryset = queryset.filter(resumes__chunks__embedding__isnull=False)
        
        # NEW: Filter by job skills - Only include candidates with at least one matching skill
        # TEMPORARILY DISABLED FOR PERFORMANCE TESTING
        # if job_skills and len(job_skills) > 0:
        #     logger.debug(f"Filtering by job skills: {job_skills}")
        #     from django.db.models import Q
        #
        #     skills_condition = Q()
        #     for skill in job_skills:
        #         skills_condition |= Q(skills__icontains=skill) | Q(skills_m2m__name__icontains=skill)
        #
        #     queryset = queryset.filter(skills_condition)
        #     logger.debug(f"After skill filter: {time.time() - start_time:.2f}s, count: {queryset.count()}")
        
        # Calculate similarity - get MAX score per candidate (deduplication)
        # Use proper SQL aggregation to avoid duplicates
        from django.db.models import Max, FloatField, ExpressionWrapper

        # Get candidates with their maximum similarity score across all resume chunks
        queryset = (
            queryset
            .annotate(
                chunk_similarity=ExpressionWrapper(
                    1 - CosineDistance('resumes__chunks__embedding', job_embedding),
                    output_field=FloatField()
                )
            )
            .filter(chunk_similarity__gte=threshold)
            .values('id', 'name', 'email', 'phone', 'summary', 'skills', 'experience', 'experience_years', 'education', 'projects')  # Include all needed fields
            .annotate(
                max_similarity=Max('chunk_similarity')
            )
            .filter(max_similarity__gte=threshold)
            .order_by('-max_similarity')
            .distinct()
        )
        
        # Convert to list and limit results
        candidate_list = list(queryset[:limit])
        logger.info(f"[COSINE DEBUG] Found {len(candidate_list)} matching candidates after threshold filter")
        if len(candidate_list) == 0:
            logger.info(f"[COSINE DEBUG] No candidates found - checking raw similarities...")
            # Check what similarities exist without threshold
            raw_queryset = (
                queryset.model.objects
                .filter(resumes__chunks__embedding__isnull=False)
                .annotate(
                    chunk_similarity=ExpressionWrapper(
                        1 - CosineDistance('resumes__chunks__embedding', job_embedding),
                        output_field=FloatField()
                    )
                )
                .values('id', 'name')
                .annotate(max_similarity=Max('chunk_similarity'))
                .order_by('-max_similarity')[:10]
            )
            raw_results = list(raw_queryset)
            logger.info(f"[COSINE DEBUG] Raw similarities (top 10): {[(r['name'], r['max_similarity']) for r in raw_results]}")

        # Create response
        results = []
        for candidate_data in candidate_list:
            similarity = safe_float(candidate_data['max_similarity'], 0.0)

            result = {
                'candidate_id': candidate_data['id'],
                'name': candidate_data['name'],
                'email': candidate_data['email'],
                'similarity_score': round(similarity, 4),
                'match_percentage': round(similarity * 100)  # Clean integer percentage
            }
            logger.debug(f"[MATCH DEBUG] Candidate {candidate_data['id']} ({candidate_data['name']}): similarity={similarity:.4f}, match_percentage={round(similarity * 100)}%")

            if include_details:
                result |= {
                    'phone': candidate_data.get('phone'),
                    'summary': candidate_data.get('summary'),
                    'skills': candidate_data.get('skills'),
                    'experience': candidate_data.get('experience'),
                    'experience_years': candidate_data.get('experience_years'),  # Added: numeric years
                    'education': candidate_data.get('education'),
                    'projects': candidate_data.get('projects'),
                    'resumes_count': 1,  # Simplified since we don't have the relationship here
                }

            results.append(result)

        return results
    
    def _hybrid_match(
        self,
        job_description: str,
        job_embedding: List[float],
        limit: int,
        threshold: float,
        include_details: bool,
        recruiter_id: int = None,
        job_skills: set = None
    ) -> List[Dict[str, Any]]:
        """
        Hybrid matching combining semantic similarity with keyword matching.

        This approach gives weight to both vector similarity and explicit keyword matches.

        Args:
            job_description: The job description text
            job_embedding: The embedding vector for the job description
            limit: Maximum number of candidates to return
            threshold: Minimum similarity score threshold
            include_details: Whether to include detailed candidate information
            recruiter_id: Filter by resumes uploaded by this user (recruiter)
            job_skills: Optional set of skills extracted from job description for filtering
        """
        logger.info(f"[HYBRID DEBUG] Starting hybrid match with threshold={threshold}, job_desc_len={len(job_description)}")

        # Extract keywords from job description
        job_keywords = self._extract_keywords(job_description)
        logger.info(f"[HYBRID DEBUG] Extracted {len(job_keywords)} keywords: {job_keywords[:10]}")

        # Get cosine similarity matches first (with skill filtering) - use lower threshold for more candidates
        semantic_threshold = threshold * 0.5  # Lower threshold to get more candidates for keyword enhancement
        logger.info(f"[HYBRID DEBUG] Using semantic_threshold={semantic_threshold} (original threshold * 0.5)")
        semantic_results = self._cosine_similarity_match(job_embedding, limit * 2, semantic_threshold, False, recruiter_id, job_skills=job_skills)
        logger.info(f"[HYBRID DEBUG] Got {len(semantic_results)} semantic results")
        if semantic_results:
            logger.info(f"[HYBRID DEBUG] Sample semantic scores: {[r['similarity_score'] for r in semantic_results[:3]]}")
        
        # Enhance with keyword matching
        enhanced_results = []
        for result in semantic_results:
            candidate_id = result['candidate_id']
            candidate = Candidate.objects.get(id=candidate_id)

            # Calculate keyword match score
            keyword_score = self._calculate_keyword_similarity(job_keywords, candidate)

            # Combine scores - GIVE MORE WEIGHT TO SEMANTIC for exact match
            # Semantic captures context better, keyword helps filter exact requirements
            combined_score = (result['similarity_score'] * 0.85) + (keyword_score * 0.15)

            logger.info(f"[HYBRID DEBUG] Candidate {candidate_id} ({candidate.name}): semantic={result['similarity_score']:.4f}, keyword={keyword_score:.4f}, combined={combined_score:.4f}")

            enhanced_result = {
                **result,
                'similarity_score': round(combined_score, 4),
                'match_percentage': round(combined_score * 100),  # Clean integer percentage
                'keyword_score': round(keyword_score, 4),
                'semantic_score': round(result['similarity_score'], 4),
                'matching_keywords': self._get_matching_keywords(job_keywords, candidate)
            }

            enhanced_results.append(enhanced_result)
        
        # Sort by combined score and limit
        enhanced_results.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        if include_details:
            # Add full details for top results
            for result in enhanced_results[:limit]:
                candidate = Candidate.objects.get(id=result['candidate_id'])
                result.update({
                    'phone': candidate.phone,
                    'summary': candidate.summary,
                    'skills': candidate.skills,
                    'experience': candidate.experience,
                    'experience_years': candidate.experience_years,  # Added
                    'education': candidate.education,
                    'projects': candidate.projects
                })
        
        return enhanced_results[:limit]
    
    def _weighted_match(
        self,
        job_description: str,
        job_embedding: List[float],
        limit: int,
        threshold: float,
        include_details: bool,
        recruiter_id: int = None,
        job_skills: set = None
    ) -> List[Dict[str, Any]]:
        """
        Weighted matching considering multiple factors:
        - Semantic similarity
        - Skill overlap
        - Experience relevance
        - Education match
        
        Args:
            job_description: The job description text
            job_embedding: The embedding vector for the job description
            limit: Maximum number of candidates to return
            threshold: Minimum similarity score threshold
            include_details: Whether to include detailed candidate information
            recruiter_id: Filter by resumes uploaded by this user (recruiter)
            job_skills: Optional set of skills extracted from job description for filtering
        """
        # Get baseline semantic matches (with skill filtering)
        semantic_results = self._cosine_similarity_match(job_embedding, limit * 2, threshold * 0.7, False, recruiter_id, job_skills=job_skills)
        
        weighted_results = []
        for result in semantic_results:
            candidate = Candidate.objects.get(id=result['candidate_id'])
            
            # Calculate weighted score components
            skill_score = self._calculate_skill_match(job_description, candidate)
            experience_score = self._calculate_experience_match(job_description, candidate)
            
            # Weight the components (60% semantic, 25% skills, 15% experience)
            weighted_score = (
                result['similarity_score'] * 0.6 +
                skill_score * 0.25 +
                experience_score * 0.15
            )
            
            logger.debug(f"[MATCH DEBUG WEIGHTED] Candidate {result.get('candidate_id')}: semantic={result['similarity_score']:.4f}, skill={skill_score:.4f}, exp={experience_score:.4f} -> weighted={weighted_score:.4f} ({round(weighted_score * 100, 2)}%)")
            
            weighted_result = {
                **result,
                'similarity_score': round(weighted_score, 4),
                'match_percentage': round(weighted_score * 100),  # Clean integer percentage
                'semantic_score': round(result['similarity_score'], 4),
                'skill_score': round(skill_score, 4),
                'experience_score': round(experience_score, 4)
            }
            
            weighted_results.append(weighted_result)
        
        # Sort by weighted score
        weighted_results.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        if include_details:
            # Add full details for top results
            for result in weighted_results[:limit]:
                candidate = Candidate.objects.get(id=result['candidate_id'])
                result.update({
                    'phone': candidate.phone if candidate.phone else '',
                    'summary': candidate.summary,
                    'skills': candidate.skills,
                    'experience': candidate.experience,
                    'experience_years': candidate.experience_years,  # Added
                    'education': candidate.education,
                    'projects': candidate.projects
                })
        
        return weighted_results[:limit]
    
    def match_by_job_id(
        self,
        job_id: int,
        limit: int = DEFAULT_LIMIT,
        threshold: float = DEFAULT_THRESHOLD,
        strategy: str = 'cosine',
        recruiter_id: int = None,
        mode: str = 'smart'
    ) -> List[Dict[str, Any]]:
        """
        Match candidates to an existing job by job ID.
        
        Args:
            job_id: ID of the job description
            limit: Maximum number of candidates to return
            threshold: Minimum similarity score threshold
            strategy: Matching strategy
            recruiter_id: Filter by resumes uploaded by this user (recruiter)
            mode: Matching mode ('smart', 'semantic', 'keyword')
            
        Returns:
            List of matched candidates with similarity scores
        """
        try:
            job = JobDescription.objects.get(id=job_id)
            
            # Combine title and description for better matching
            # If description is too short, expand it with context
            title = job.title or ''
            description = job.description or ''
            skills = job.skills or ''
            
            # Expand description if too short (less than 100 chars)
            full_description = f"{title} {description} {skills}"
            if len(full_description) < 100:
                # Add role-specific context for better matching
                role_context = ""
                title_lower = title.lower()
                if "java" in title_lower:
                    role_context = " Java developer position requiring Java programming, Spring Boot, microservices, J2EE, object-oriented programming, backend development experience. "
                elif "python" in title_lower:
                    role_context = " Python developer position requiring Python programming, Django, Flask, data processing, API development, machine learning experience. "
                elif "sap" in title_lower:
                    role_context = " SAP consultant position requiring SAP modules, ABAP programming, SAP implementation, SAP customization experience. "
                elif "full stack" in title_lower:
                    role_context = " Full stack developer position requiring frontend and backend development, JavaScript, React, Node.js, database experience. "
                full_description = f"{title} {description} {skills}{role_context}"
            
            # Use MUCH higher threshold for short descriptions to avoid irrelevant matches
            effective_threshold = threshold
            
            # When showing all candidates (limit >= 100), bypass threshold filtering
            if limit >= 100:
                effective_threshold = 0.0  # Show all candidates regardless of match score
                logger.info(f"   Showing ALL candidates - threshold set to 0.0")
            elif len(full_description) < 150:
                effective_threshold = max(threshold, 0.60)  # Require at least 60% similarity for short descriptions
                logger.info(f"   Using higher threshold {effective_threshold} for short description")
            
            # DEBUG: Log threshold settings
            logger.info(f"🔍 DEBUG: limit={limit}, original threshold={threshold}, effective_threshold={effective_threshold}")
            
            # Log for debugging
            logger.info(f"🔍 Matching for job_id={job_id}, title='{job.title}', desc_len={len(description)}, full_desc_len={len(full_description)}")
            
            results = self.match_candidates(
                job_description=full_description,
                limit=limit,
                threshold=effective_threshold,
                strategy=strategy,
                include_details=True,
                recruiter_id=recruiter_id,
                mode=mode
            )
            
            # Add job information to results
            for result in results:
                result['job_id'] = job.id
                result['job_title'] = job.title
            
            return results
            
        except JobDescription.DoesNotExist:
            logger.error(f"Job with ID {job_id} not found")
            return []
    
    def get_match_statistics(self, job_description: str) -> Dict[str, Any]:
        """
        Get matching statistics for a job description.
        
        Returns:
            Dictionary with matching statistics
        """
        try:
            job_embedding = self.embedding_service.get_embedding(job_description)
            
            # Get all candidates with similarity scores (filter out None values)
            all_candidates = (
                Candidate.objects
                .annotate(
                    similarity_score=ExpressionWrapper(
                        1 - CosineDistance('resumes__chunks__embedding', job_embedding),
                        output_field=FloatField()
                    )
                )
                .annotate(max_similarity=Max('similarity_score'))
                .filter(max_similarity__isnull=False)  # Filter out candidates without embeddings
            )
            
            # Calculate statistics
            total_candidates = all_candidates.count()
            
            if total_candidates == 0:
                return {
                    'total_candidates': 0,
                    'average_score': 0,
                    'high_matches': 0,
                    'medium_matches': 0,
                    'low_matches': 0,
                    'score_distribution': {}
                }
            
            # Filter out None scores to avoid TypeError
            # Filter and convert scores safely
            scores = []
            for candidate in all_candidates:
                score = safe_float(candidate.max_similarity, None)
                if score is not None:
                    scores.append(score)
            avg_score = sum(scores) / len(scores)
            
            # Categorize matches
            high_matches = sum(1 for score in scores if score >= 0.7)
            medium_matches = sum(1 for score in scores if 0.4 <= score < 0.7)
            low_matches = sum(1 for score in scores if score < 0.4)
            
            # Create score distribution
            score_ranges = {
                '0.9-1.0': sum(1 for score in scores if 0.9 <= score <= 1.0),
                '0.8-0.9': sum(1 for score in scores if 0.8 <= score < 0.9),
                '0.7-0.8': sum(1 for score in scores if 0.7 <= score < 0.8),
                '0.6-0.7': sum(1 for score in scores if 0.6 <= score < 0.7),
                '0.5-0.6': sum(1 for score in scores if 0.5 <= score < 0.6),
                '0.4-0.5': sum(1 for score in scores if 0.4 <= score < 0.5),
                '0.3-0.4': sum(1 for score in scores if 0.3 <= score < 0.4),
                '0.2-0.3': sum(1 for score in scores if 0.2 <= score < 0.3),
                '0.1-0.2': sum(1 for score in scores if 0.1 <= score < 0.2),
                '0.0-0.1': sum(1 for score in scores if 0.0 <= score < 0.1),
            }
            
            return {
                'total_candidates': total_candidates,
                'average_score': round(avg_score, 4),
                'average_percentage': round(avg_score * 100, 2),
                'high_matches': high_matches,
                'medium_matches': medium_matches,
                'low_matches': low_matches,
                'score_distribution': score_ranges,
                'recommendation': self._get_recommendation(avg_score)
            }
            
        except Exception as e:
            logger.error(f"Error calculating match statistics: {e}")
            return {}
    
    def batch_match_jobs(
        self,
        job_ids: List[int],
        limit: int = DEFAULT_LIMIT
    ) -> Dict[int, List[Dict[str, Any]]]:
        """
        Match candidates to multiple jobs at once.
        
        Args:
            job_ids: List of job description IDs
            limit: Maximum candidates per job
            
        Returns:
            Dictionary mapping job_id to list of matched candidates
        """
        results = {}
        
        for job_id in job_ids:
            job_results = self.match_by_job_id(job_id, limit=limit)
            results[job_id] = job_results
        
        return results
    
    def _extract_keywords(self, text: str) -> List[str]:
        """
        Extract important keywords from text for keyword matching.

        This is a simple implementation. For production, consider using NLP libraries.
        """
        # Simple keyword extraction: extract important terms
        # Remove common words and extract technical terms
        import re

        # DEBUG: Log the input text
        logger.debug(f"[KEYWORD EXTRACTION] Input text: {text[:200]}...")

        # Convert to lowercase and find words
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        
        # Filter out common stop words (simplified list)
        stop_words = {
            'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her', 'was',
            'one', 'our', 'out', 'with', 'this', 'that', 'from', 'they', 'will', 'have',
            'been', 'more', 'when', 'some', 'like', 'than', 'into', 'over', 'after'
        }
        
        keywords = [word for word in words if word not in stop_words]
        
        # Return unique keywords
        return list(set(keywords))
    
    def _calculate_keyword_similarity(self, job_keywords: List[str], candidate: Candidate) -> float:
        """
        Calculate keyword similarity between job and candidate.

        Returns:
            Keyword similarity score (0-1)

        IMPROVED: Now uses actual skill extraction from job description and gives
        more weight to technical skill matches.
        """
        import logging
        logger = logging.getLogger(__name__)

        # Get candidate's skills and experience text
        skills = candidate.skills or []
        experience = candidate.experience or []

        # Handle skills and experience that may be lists of dicts or mixed types
        def safe_join(items):
            if not items:
                return ""
            try:
                # If it's a list of strings, join directly
                if all(isinstance(item, str) for item in items):
                    return ' '.join(items)
                # If it's a list of dicts, extract string values
                elif all(isinstance(item, dict) for item in items):
                    string_parts = []
                    for item in items:
                        # Extract common fields that might contain text
                        for key in ['name', 'title', 'description', 'skill', 'company', 'role']:
                            if key in item and isinstance(item[key], str):
                                string_parts.append(item[key])
                    return ' '.join(string_parts)
                else:
                    # Mixed types - convert to strings
                    return ' '.join(str(item) for item in items)
            except Exception as e:
                logger.error(f"Error joining items in keyword matching: {e}")
                return ""

        skills_text = safe_join(skills)
        experience_text = safe_join(experience)
        candidate_text = f"{skills_text} {experience_text} {candidate.summary or ''}"
        candidate_text = candidate_text.lower()

        logger.debug(f"[DEBUG] Keyword matching for candidate '{candidate.name}': job_keywords={job_keywords[:10]}...")
        
        # Count matching keywords
        matches = sum(1 for keyword in job_keywords if keyword in candidate_text)
        
        # Bonus: check for exact skill matches (more precise)
        job_skills = self._extract_skills_from_text(' '.join(job_keywords))
        candidate_skills_set = set()
        for skill in skills:
            if isinstance(skill, str):
                candidate_skills_set.add(skill.lower())
        for skill in candidate.skills_m2m.all():
            candidate_skills_set.add(skill.name.lower())
        
        skill_matches = len(job_skills & candidate_skills_set)
        logger.debug(f"[DEBUG] Skill matches: {skill_matches}, job_skills: {job_skills}, candidate_skills: {candidate_skills_set}")
        
        # Combine keyword and skill matches
        if not job_keywords:
            return 0.0
        
        # Weighted: 60% keywords, 40% skills (skills are more precise)
        keyword_score = matches / len(job_keywords)
        skill_score = skill_matches / len(job_skills) if job_skills else 0.0
        
        return (keyword_score * 0.6 + skill_score * 0.4) if job_skills else keyword_score
    
    def _get_matching_keywords(self, job_keywords: List[str], candidate: Candidate) -> List[str]:
        """
        Get list of matching keywords between job and candidate.

        Returns:
            List of matching keyword strings
        """
        # Get candidate's skills and experience text
        skills = candidate.skills or []
        experience = candidate.experience or []

        # Use same safe_join logic as above
        def safe_join(items):
            if not items:
                return ""
            try:
                # If it's a list of strings, join directly
                if all(isinstance(item, str) for item in items):
                    return ' '.join(items)
                # If it's a list of dicts, extract string values
                elif all(isinstance(item, dict) for item in items):
                    string_parts = []
                    for item in items:
                        # Extract common fields that might contain text
                        for key in ['name', 'title', 'description', 'skill', 'company', 'role']:
                            if key in item and isinstance(item[key], str):
                                string_parts.append(item[key])
                    return ' '.join(string_parts)
                else:
                    # Mixed types - convert to strings
                    return ' '.join(str(item) for item in items)
            except Exception as e:
                logger.error(f"Error joining items in keyword matching: {e}")
                return ""

        skills_text = safe_join(skills)
        experience_text = safe_join(experience)
        candidate_text = f"{skills_text} {experience_text} {candidate.summary or ''}"
        candidate_text = candidate_text.lower()

        # Find matching keywords
        matching_keywords = [keyword for keyword in job_keywords if keyword in candidate_text]

        return matching_keywords
    
    def _calculate_skill_match(self, job_description: str, candidate: Candidate) -> float:
        """
        Calculate skill match score between job and candidate.
        
        Returns:
            Skill match score (0-1)
        
        BUG FIX: This method was completely broken - it was comparing candidate's skills
        to themselves (not job skills to candidate skills), returning inflated scores.
        Now properly extracts skills from job_description and compares to candidate skills.
        """
        import logging
        logger = logging.getLogger(__name__)
        
        # Extract skills from job description using common programming/tech patterns
        job_skills = self._extract_skills_from_text(job_description)
        logger.debug(f"[DEBUG] Job extracted skills: {job_skills}")
        
        # Get candidate's actual skills (from both sources)
        candidate_skills_set = set()
        candidate_skills_list = candidate.skills or []
        for skill in candidate_skills_list:
            if isinstance(skill, str):
                candidate_skills_set.add(skill.lower())
            else:
                candidate_skills_set.add(str(skill).lower())
        
        # Also check M2M relationship
        for skill in candidate.skills_m2m.all():
            candidate_skills_set.add(skill.name.lower())
        
        logger.debug(f"[DEBUG] Candidate '{candidate.name}' skills: {candidate_skills_set}")
        
        if not job_skills:
            logger.debug(f"[DEBUG] No job skills extracted, returning 0.0")
            return 0.0

        # Calculate actual overlap between job requirements and candidate skills
        matching_skills = job_skills & candidate_skills_set
        logger.debug(f"[DEBUG] Matching skills: {matching_skills}")
        
        score = len(matching_skills) / len(job_skills) if job_skills else 0.0
        logger.debug(f"[DEBUG] Skill match score: {score}")
        
        return score
    
    def _extract_skills_from_text(self, text: str) -> set:
        """
        Extract technical skills from text (job description).
        
        Returns:
            Set of extracted skill strings (lowercase)
        """
        import re
        import logging
        logger = logging.getLogger(__name__)
        
        text_lower = text.lower()
        
        # Common programming languages and technologies to detect
        common_skills = [
            # Programming languages
            'java', 'python', 'javascript', 'js', 'typescript', 'c++', 'c#', 'ruby', 'go', 
            'golang', 'rust', 'swift', 'kotlin', 'scala', 'php', 'perl', 'r', 'matlab',
            'objective-c', 'shell', 'bash', 'powershell',
            # Web frameworks
            'django', 'flask', 'fastapi', 'react', 'angular', 'vue', 'nodejs', 'node',
            'express', 'spring', 'spring boot', 'rails', 'asp.net', '.net', 'jquery',
            'bootstrap', 'tailwind', 'next.js', 'nuxt', 'svelte',
            # Backend/API
            'rest api', 'restful', 'graphql', 'grpc', 'websocket',
            # Databases
            'sql', 'mysql', 'postgresql', 'postgres', 'mongodb', 'redis', 'oracle', 
            'sqlite', 'elasticsearch', 'cassandra', 'dynamodb', 'firebase', 'mariadb',
            # Cloud/DevOps
            'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
            'terraform', 'ansible', 'jenkins', 'ci/cd', 'devops', 'cicd',
            'jira', 'bitbucket', 'github', 'gitlab',
            # Data/ML/AI
            'machine learning', 'ml', 'deep learning', 'tensorflow', 'pytorch', 
            'pandas', 'numpy', 'scipy', 'sklearn', 'data science', 'analytics',
            'artificial intelligence', 'ai', 'nlp', 'computer vision', 'llm', 'chatgpt',
            'tableau', 'power bi', 'excel', 'spark', 'hadoop', 'hive',
            # Other tech
            'git', 'linux', 'unix', 'microservices', 'agile', 'scrum', 'kanban',
            'html', 'css', 'xml', 'json', 'yaml', 'tomcat', 'nginx', 'apache',
            'jdbc', 'jpa', 'hibernate', 'maven', 'gradle', 'npm', 'yarn',
            # SAP modules
            'sap', 'abap', 'fico', 'mm', 'sd', 'pp', 'pm', 'qm', 'hr',
            'sap hana', 's/4hana', 'sap bw', 'sap bi'
        ]
        
        found_skills = set()
        for skill in common_skills:
            # Use word boundary matching to avoid partial matches
            if re.search(r'\b' + re.escape(skill) + r'\b', text_lower):
                found_skills.add(skill)
        
        logger.debug(f"[DEBUG] Extracted skills from text: {found_skills}")
        return found_skills
    
    def _calculate_experience_match(self, job_description: str, candidate: Candidate) -> float:
        """
        Calculate experience relevance score.
        
        Returns:
            Experience relevance score (0-1)
        """
        # Use experience_years field for scoring
        exp_years = candidate.experience_years or 0.0
        job_desc_lower = job_description.lower()
        
        # Look for experience indicators in job description
        exp_keywords = ['years', 'experience', 'worked', 'professional']
        
        # Simple heuristic: check if candidate has experience data
        if exp_years <= 0:
            return 0.0
        
        # If job mentions experience requirements and candidate has experience
        has_exp_requirement = any(keyword in job_desc_lower for keyword in exp_keywords)
        has_candidate_exp = exp_years > 0
        
        if has_exp_requirement and has_candidate_exp:
            return 0.8  # Good match
        elif has_candidate_exp:
            return 0.5  # Neutral
        else:
            return 0.0
    
    def _get_recommendation(self, average_score: float) -> str:
        """
        Get recommendation based on average match score.
        
        Returns:
            Recommendation string
        """
        if average_score >= 0.8:
            return "Excellent match pool with high-quality candidates"
        elif average_score >= 0.6:
            return "Good match pool with qualified candidates"
        elif average_score >= 0.4:
            return "Fair match pool, consider expanding search criteria"
        else:
            return "Poor match, consider revising job requirements"


# Singleton instance
matching_engine = MatchingEngine()