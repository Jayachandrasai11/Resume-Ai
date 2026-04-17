"""
Views for the candidate-job matching and ranking API.
"""

import time
import logging
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

logger = logging.getLogger(__name__)

from .models import JobCandidate, RecruitmentFunnel
from apps.jd_app.models import JobDescription
from apps.candidates.models import Candidate, Resume

from .services.ranker import CandidateRanker
from .services.semantic_search import semantic_search_service
from .services.matching_engine import matching_engine

from .serializers import (
    MatchRequestSerializer,
    MatchByJobIdRequestSerializer,
    MatchResponseSerializer,
    MatchStatisticsSerializer,
    BatchMatchRequestSerializer,
    BatchMatchResponseSerializer
)


def search_view(request):
    """Legacy endpoint; returns JSON (no server-rendered templates)."""
    query = request.GET.get('q', '')
    method = request.GET.get('method', 'semantic')
    limit = int(request.GET.get('limit', 10))
    threshold = float(request.GET.get('threshold', 0.3))
    
    results = []
    if query:
        if method == 'semantic':
            results = semantic_search_service.search_candidates(query, limit, threshold)
        else:
            ranker = CandidateRanker()
            res = ranker.rank_candidates(query, 1, limit)
            results = res.get('results', [])
            
    return JsonResponse(
        {
            "query": query,
            "method": method,
            "limit": limit,
            "threshold": threshold,
            "results": results,
            "count": len(results),
        }
    )


class JobMatchesView(APIView):
    """
    View stored match results for a job.

    GET /api/jobs/<job_id>/matches/
    Returns JobCandidate objects for the job owned by the user
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id=None):
        if job_id is None:
            return Response(
                {"error": "job_id is required in URL"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get and validate job ownership
        job = get_object_or_404(JobDescription, id=job_id)
        if job.created_by != request.user:
            return Response(
                {"error": "You do not have permission to access this job"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get match results with select_related for performance
        matches = JobCandidate.objects.filter(
            job=job
        ).select_related(
            'candidate',
            'job'
        ).order_by('-match_score')

        # Format response
        match_results = []
        for match in matches:
            # Get clean match score as integer percentage
            match_score_pct = round(match.match_score * 100) if match.match_score else 0
            match_results.append({
                "candidate_id": match.candidate.id,
                "name": match.candidate.name,
                "skills": match.candidate.skills or [],
                "experience_years": match.candidate.experience_years,
                "match_score": match_score_pct,  # Return as clean percentage
                "match_type": match.match_type,
                "created_at": match.created_at
            })

        return Response(match_results, status=status.HTTP_200_OK)


class RankingView(APIView):
    """Legacy ranking view for backward compatibility."""
    def post(self, request):
        data = request.data
        ranker = CandidateRanker()
        ranked = ranker.rank_candidates(
            data.get("job_description", ""),
            int(data.get("page", 1)),
            int(data.get("page_size", 20))
        )
        return Response(ranked)


class SemanticSearchView(APIView):
    """
    API endpoint to retrieve top candidates for a job using semantic search.
    This is maintained for backward compatibility.
    """
    
    def post(self, request):
        job_description = request.data.get("job_description", "")
        limit = request.data.get("limit", 10)
        threshold = request.data.get("threshold", 0.3)

        if not job_description:
            return Response(
                {"error": "job_description is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            results = semantic_search_service.search_candidates(
                job_description=job_description,
                limit=limit,
                threshold=threshold
            )
            return Response({"results": results}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MatchCandidatesView(APIView):
    """
    Advanced candidate-job matching API.
    
    POST /api/ranking/match/
    Body: {
        "job_description": "Python developer with Django experience...",
        "limit": 10,
        "threshold": 0.3,
        "strategy": "cosine",
        "include_details": false
    }
    """
    
    def post(self, request):
        serializer = MatchRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors, "message": "Invalid request parameters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        job_description = validated_data['job_description']
        limit = validated_data['limit']
        threshold = validated_data['threshold']
        strategy = validated_data['strategy']
        mode = validated_data.get('mode', 'smart')
        include_details = validated_data['include_details']
        
        # Start timer
        start_time = time.time()
        
        try:
            # Get matching candidates
            results = matching_engine.match_candidates(
                job_description=job_description,
                limit=limit,
                threshold=threshold,
                strategy=strategy,
                include_details=include_details,
                recruiter_id=request.user.id,
                mode=mode
            )
            
            # Calculate match time
            match_time = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            # Get statistics
            stats = matching_engine.get_match_statistics(job_description)
            
            # Prepare response
            response_data = {
                'results': results,
                'total_candidates': len(results),
                'average_score': stats.get('average_score', 0),
                'strategy_used': strategy,
                'mode_used': mode,
                'match_time_ms': round(match_time, 2),
                'statistics': {
                    'total_candidates': stats.get('total_candidates', 0),
                    'average_score': stats.get('average_score', 0),
                    'high_matches': stats.get('high_matches', 0),
                    'medium_matches': stats.get('medium_matches', 0),
                    'low_matches': stats.get('low_matches', 0),
                    'recommendation': stats.get('recommendation', '')
                }
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "message": "Failed to match candidates"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MatchByJobIdView(APIView):
    """
    Match candidates to an existing job by job ID.

    POST /api/ranking/match-by-job/
    Body: {
        "job_id": 1,
        "limit": 10,
        "threshold": 0.3,
        "strategy": "cosine"
    }

    GET /api/jobs/{job_id}/match/
    Query params: limit=10, threshold=0.3, strategy=cosine, type=smart
    """
    # permission_classes = [IsAuthenticated]  # TEMPORARILY DISABLED FOR DEBUG
    permission_classes = [IsAuthenticated]
    def get(self, request, job_id=None):
        # For GET /api/jobs/{job_id}/match/ OR /api/ranking/match-by-job/?job_id=...
        # job_id comes from URL path for /api/jobs/<job_id>/match/
        # job_id comes from query param for /api/ranking/match-by-job/
        if job_id is None:
            job_id = request.GET.get('job_id')

        if job_id is None:
            return Response(
                {"error": "job_id is required (either in URL or as query parameter)"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Ensure job_id is integer
        try:
            job_id = int(job_id)
        except (ValueError, TypeError):
            return Response(
                {"error": "job_id must be a valid integer"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get and validate job ownership
        job = get_object_or_404(JobDescription, id=job_id)
        # Allow access if user owns the job OR job has no owner (for backward compatibility)
        if job.created_by and job.created_by != request.user:
            return Response(
                {"error": "You do not have permission to access this job"},
                status=status.HTTP_403_FORBIDDEN
            )

        limit = int(request.GET.get('limit', 20))  # Default to 20 as per task
        threshold = float(request.GET.get('threshold', 0.0))  # Lower threshold for better results
        strategy = request.GET.get('strategy', 'cosine')
        # Read mode/type parameter and map to internal mode
        # Frontend sends 'mode', some callers may use 'type' - accept both
        mode_param = request.GET.get('mode', request.GET.get('type', 'smart'))
        if mode_param == 'smart':
            match_type = 'smart'
            mode = 'smart'
        elif mode_param == 'deep':
            match_type = 'deep'
            mode = 'semantic'
        elif mode_param == 'exact':
            match_type = 'exact'
            mode = 'keyword'
        else:
            match_type = 'smart'
            mode = 'smart'  # default

        # Use recruiter_id from request user
        recruiter_id = request.user.id

        start_time = time.time()

        try:
            results = matching_engine.match_by_job_id(
                job_id=job_id,
                limit=limit,
                threshold=threshold,
                strategy=strategy,
                recruiter_id=recruiter_id,
                mode=mode
            )

            # Store match results in JobCandidate model
            match_results = []
            for result in results:
                candidate_id = result.get('candidate_id')
                if candidate_id:
                    candidate = get_object_or_404(Candidate, id=candidate_id)
                    score = result.get('similarity_score', 0.0)

                    # Create or update JobCandidate entry
                    JobCandidate.objects.update_or_create(
                        job=job,
                        candidate=candidate,
                        match_type=match_type,
                        defaults={'match_score': score}
                    )

                    # Format response as per task requirements
                    match_results.append({
                        "candidate_id": candidate.id,
                        "name": candidate.name,
                        "skills": candidate.skills or [],
                        "experience_years": candidate.experience_years,
                        "match_score": round(score * 100)  # Return as clean percentage
                    })

            match_time = (time.time() - start_time) * 1000

            return Response(match_results, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "message": "Matching error"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request):
        serializer = MatchByJobIdRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors, "message": "Invalid request parameters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        job_id = validated_data['job_id']
        limit = validated_data['limit']
        threshold = validated_data['threshold']
        strategy = validated_data['strategy']
        mode = validated_data.get('mode', 'smart')
        
        # Map mode to match_type for storing in JobCandidate
        if mode == 'smart':
            match_type = 'smart'
        elif mode == 'semantic':
            match_type = 'deep'
        elif mode == 'keyword':
            match_type = 'exact'
        else:
            match_type = 'smart'
        
        logger.debug(f"[POST match-by-job] mode={mode} -> match_type={match_type}")
        
        # Use recruiter_id from request body, or fall back to current user ID
        recruiter_id = validated_data.get('recruiter_id')
        if recruiter_id is None and request.user.is_authenticated:
            recruiter_id = request.user.id
        
        # Start timer
        start_time = time.time()
        
        logger.debug(f"match_by_job_id called with job_id={job_id}, limit={limit}, threshold={threshold}, recruiter_id={recruiter_id}, mode={mode}")
        
        try:
            # Get matching candidates
            results = matching_engine.match_by_job_id(
                job_id=job_id,
                limit=limit,
                threshold=threshold,
                strategy=strategy,
                recruiter_id=recruiter_id,
                mode=mode
            )
            
            logger.debug(f"match_by_job_id returned {len(results)} results")
            
            # DEBUG: Log first result to see what fields are being returned
            if results:
                logger.debug(f"DEBUG: First result fields: {list(results[0].keys())}")
                logger.debug(f"DEBUG: First result match_percentage: {results[0].get('match_percentage')}")
                logger.debug(f"DEBUG: First result similarity_score: {results[0].get('similarity_score')}")
            else:
                logger.debug("DEBUG: No results returned!")
            
            # Store match results in JobCandidate model with the CORRECT match_type
            logger.debug(f"[Store JobCandidate] Storing {len(results)} results with match_type={match_type}")
            
            # Get the job object for creating JobCandidate
            job = get_object_or_404(JobDescription, id=job_id)
            
            for result in results:
                candidate_id = result.get('candidate_id')
                if candidate_id:
                    candidate = get_object_or_404(Candidate, id=candidate_id)
                    score = result.get('similarity_score', 0.0)
                    logger.debug(f"[Store JobCandidate] candidate_id={candidate_id}, score={score}, match_type={match_type}")

                    # Create or update JobCandidate entry with correct match_type
                    JobCandidate.objects.update_or_create(
                        job=job,
                        candidate=candidate,
                        match_type=match_type,
                        defaults={'match_score': score}
                    )
            
            # Calculate match time
            match_time = (time.time() - start_time) * 1000
            
            # Prepare response
            response_data = {
                'results': results,
                'total_candidates': len(results),
                'match_time_ms': round(match_time, 2),
                'strategy_used': strategy,
                'mode_used': mode
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {
                    "error": str(e),
                    "message": "Failed to match candidates to job"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class MatchStatisticsView(APIView):
    """
    Get matching statistics for a job description.
    
    POST /api/ranking/match-statistics/
    Body: {
        "job_description": "Python developer with Django experience..."
    }
    """
    
    def post(self, request):
        job_description = request.data.get('job_description', '')
        
        if not job_description:
            return Response(
                {"error": "job_description is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            statistics = matching_engine.get_match_statistics(job_description)
            return Response(statistics, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class BatchMatchView(APIView):
    """
    Match candidates to multiple jobs at once.
    
    POST /api/ranking/batch-match/
    Body: {
        "job_ids": [1, 2, 3],
        "limit": 10
    }
    """
    
    def post(self, request):
        serializer = BatchMatchRequestSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(
                {"error": serializer.errors, "message": "Invalid request parameters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        validated_data = serializer.validated_data
        job_ids = validated_data['job_ids']
        limit = validated_data['limit']
        
        try:
            # Batch match all jobs
            results = matching_engine.batch_match_jobs(job_ids, limit)
            
            # Calculate totals
            total_candidates = sum(len(candidates) for candidates in results.values())
            total_jobs = len(results)
            
            response_data = {
                'results': results,
                'total_jobs': total_jobs,
                'total_candidates': total_candidates
            }
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CompareCandidatesView(APIView):
    """
    Compare candidates against each other for a specific job.
    
    POST /api/ranking/compare-candidates/
    Body: {
        "job_description": "Python developer...",
        "candidate_ids": [1, 2, 3, 4, 5]
    }
    """
    
    def post(self, request):
        job_description = request.data.get('job_description', '')
        candidate_ids = request.data.get('candidate_ids', [])
        
        if not job_description:
            return Response(
                {"error": "job_description is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not candidate_ids:
            return Response(
                {"error": "candidate_ids is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get matching results for all candidates
            all_results = matching_engine.match_candidates(
                job_description=job_description,
                limit=100,  # Get all matches
                threshold=0.0,  # No threshold for comparison
                include_details=True
            )
            
            # Filter to only specified candidate IDs
            filtered_results = [
                result for result in all_results 
                if result['candidate_id'] in candidate_ids
            ]
            
            # Sort by similarity score
            filtered_results.sort(key=lambda x: x['similarity_score'], reverse=True)
            
            # Calculate ranking
            for i, result in enumerate(filtered_results):
                result['rank'] = i + 1
            
            return Response({
                'results': filtered_results,
                'total_candidates': len(filtered_results)
            })
            
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class GetStrategiesView(APIView):
    """
    Get available matching strategies.
    
    GET /api/ranking/strategies/
    """
    
    def get(self, request):
        strategies = [
            {
                'name': 'cosine',
                'description': 'Pure cosine similarity between embeddings. Best for semantic matching.',
                'recommended': True
            },
            {
                'name': 'hybrid',
                'description': 'Combines semantic similarity with keyword matching. Good for skill-specific roles.',
                'recommended': False
            },
            {
                'name': 'weighted',
                'description': 'Weighted scoring considering skills, experience, and semantic similarity. Most comprehensive.',
                'recommended': False
            }
        ]
        
        return Response({'strategies': strategies})


from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

class AddToFunnelView(APIView):
    """
    Add selected candidates to the recruitment funnel.

    POST /api/jobs/{job_id}/funnel/add/
    Body: {
        "candidate_ids": [1, 2, 3],
        "stage": "shortlisted"
    }
    """
    permission_classes = [IsAuthenticated]

    @csrf_exempt
    def post(self, request, job_id=None):
        if not job_id:
            return Response(
                {"error": "job_id is required in URL"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get and validate job ownership
        job = get_object_or_404(JobDescription, id=job_id)
        if job.created_by != request.user:
            return Response(
                {"error": "You do not have permission to access this job"},
                status=status.HTTP_403_FORBIDDEN
            )

        candidate_ids = request.data.get('candidate_ids', [])
        stage = request.data.get('stage', 'shortlisted')
        # Get match_type from request - can be 'smart', 'deep', or 'exact'
        # DEBUG: Log incoming match_type for debugging
        raw_match_type = request.data.get('match_type')
        logger.debug(f"[AddToFunnel] INCOMING match_type from request: {raw_match_type} (type: {type(raw_match_type)})")
        
        # FIX: If match_type is not provided or invalid, try to determine from existing JobCandidate
        if raw_match_type not in ['smart', 'deep', 'exact']:
            # Try to get match_type from existing JobCandidate records for this job
            logger.debug(f"[AddToFunnel] No valid match_type provided - checking for existing JobCandidate...")
            
            # Get any existing job-candidate pair to infer match_type
            if candidate_ids:
                first_candidate_id = candidate_ids[0]
                existing_jc = JobCandidate.objects.filter(
                    job=job,
                    candidate_id=first_candidate_id
                ).order_by('-match_score').first()
                
                if existing_jc:
                    raw_match_type = existing_jc.match_type
                    logger.debug(f"[AddToFunnel] Found existing JobCandidate, inferring match_type: {raw_match_type}")
        
        match_type = raw_match_type if raw_match_type in ['smart', 'deep', 'exact'] else 'smart'
        
        # DEBUG: Log normalized match_type
        logger.debug(f"[AddToFunnel] FINAL match_type: {match_type}")
        
        # Log full request data for debugging
        logger.debug(f"[AddToFunnel] Full request.data keys: {list(request.data.keys())}")

        if not candidate_ids:
            return Response(
                {"error": "candidate_ids is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if stage not in [choice[0] for choice in RecruitmentFunnel.STAGES]:
            return Response(
                {"error": "Invalid stage"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            added_candidates = []
            for candidate_id in candidate_ids:
                candidate = get_object_or_404(Candidate, id=candidate_id)

                                                # Get match score from JobCandidate filtered by match_type
                logger.debug(f"[AddToFunnel] Looking for JobCandidate: job_id={job.id}, candidate_id={candidate.id}, match_type={match_type}")
                
                # First, try to find with the EXACT match_type that was used when saving
                job_candidate = JobCandidate.objects.filter(
                    job=job,
                    candidate=candidate,
                    match_type=match_type
                ).first()
                
                # Log what we found for debugging
                logger.debug(f"[AddToFunnel] Query JobCandidate with: job_id={job.id}, candidate_id={candidate.id}, match_type={match_type}")
                if job_candidate:
                    logger.debug(f"[AddToFunnel] Found JobCandidate with match_type={job_candidate.match_type}, match_score={job_candidate.match_score}")
                else:
                    logger.warning(f"[AddToFunnel] No JobCandidate found with match_type={match_type} - trying fallback")
                
                # If not found with specific match_type, try to get any existing match
                if not job_candidate:
                    logger.debug(f"[AddToFunnel] No JobCandidate with match_type={match_type}, looking for any...")
                    # Get the highest match score across all match types
                    job_candidate = JobCandidate.objects.filter(
                        job=job,
                        candidate=candidate
                    ).order_by('-match_score').first()
                    if job_candidate:
                        logger.debug(f"[AddToFunnel] Found JobCandidate with match_type={job_candidate.match_type}, score={job_candidate.match_score}")
                        # Update the match_type to the current one since we're adding to funnel
                        job_candidate.match_type = match_type
                        job_candidate.save()
                else:
                    logger.debug(f"[AddToFunnel] Found JobCandidate with correct match_type, score={job_candidate.match_score}")
                
                match_score = job_candidate.match_score if job_candidate else 0.0
                # DEBUG: Log match_score retrieval
                logger.debug(f"[AddToFunnel] Final match_score for candidate {candidate.id}: {match_score} (source: {job_candidate.match_type if job_candidate else 'none'})")

                # Create or update funnel entry with match_type
                funnel_entry, created = RecruitmentFunnel.objects.update_or_create(
                    job=job,
                    candidate=candidate,
                    defaults={
                        'stage': stage,
                        'match_score': match_score,
                        'match_type': match_type,
                        'created_by': request.user
                    }
                )
                
                # DEBUG: Log funnel creation
                logger.debug(f"[AddToFunnel] Funnel entry {'CREATED' if created else 'UPDATED'}: funnel_id={funnel_entry.id}, match_type={funnel_entry.match_type}, match_score={funnel_entry.match_score}")

                added_candidates.append({
                    'candidate_id': candidate.id,
                    'name': candidate.name,
                    'stage': stage,
                    'match_score': match_score,
                    'match_type': match_type
                })

            return Response({
                'message': f'Added {len(added_candidates)} candidates to {stage} stage',
                'candidates': added_candidates
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class FunnelView(APIView):
    """
    Get and manage recruitment funnel data.

    GET /api/jobs/{job_id}/funnel/
    Returns grouped candidates by stage

    PATCH /api/funnel/{funnel_id}/update-stage/
    Body: {"stage": "interview"}
    """
    permission_classes = [IsAuthenticated]

    @csrf_exempt
    def get(self, request, job_id=None):
        if not job_id:
            return Response(
                {"error": "job_id is required in URL"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get and validate job ownership
        job = get_object_or_404(JobDescription, id=job_id)
        if job.created_by != request.user:
            return Response(
                {"error": "You do not have permission to access this job"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get funnel data grouped by stage
        funnel_data = {}
        for stage_choice in RecruitmentFunnel.STAGES:
            stage_key = stage_choice[0]
            candidates = RecruitmentFunnel.objects.filter(
                job=job,
                created_by=request.user
            ).filter(stage=stage_key).select_related('candidate')

            funnel_data[stage_key] = []
            for entry in candidates:
                if not entry.candidate:
                    continue  # Skip entries with deleted candidates
                
                # Log for debugging match_type and match_score
                logger.debug(f"[FunnelView] entry.id={entry.id}, match_score={entry.match_score}, match_type={entry.match_type}, created_by={entry.created_by}")
                
                # Format match_score as percentage - ensure it's in 0-100 range with clean formatting
                display_match_score = entry.match_score * 100 if entry.match_score else 0.0
                # If match_score is already > 100, it's likely stored as percentage - don't double-convert
                if entry.match_score and entry.match_score > 1.0:
                    display_match_score = entry.match_score  # Already a percentage
                # Round to clean integer (e.g., 35 instead of 35.730000000000004)
                display_match_score = round(display_match_score)
                
                funnel_data[stage_key].append({
                    'funnel_id': entry.id,
                    'candidate_id': entry.candidate.id,
                    'name': entry.candidate.name,
                    'email': entry.candidate.email,
                    'skills': entry.candidate.skills or [],
                    'experience_years': entry.candidate.experience_years,
                    'match_score': display_match_score,
                    'match_type': entry.match_type or 'smart',  # Default to 'smart' if null
                    'stage': entry.stage,
                    'interview_stage': entry.interview_stage,
                    'interview_status': entry.interview_status,
                    'feedback': entry.feedback,
                    'updated_at': entry.updated_at
                })

        return Response({
            'job': {
                'id': job.id,
                'title': job.title
            },
            'funnel': funnel_data
        }, status=status.HTTP_200_OK)

    @csrf_exempt
    def patch(self, request, funnel_id=None):
        if not funnel_id:
            return Response(
                {"error": "funnel_id is required in URL"},
                status=status.HTTP_400_BAD_REQUEST
            )

        funnel_entry = get_object_or_404(RecruitmentFunnel, id=funnel_id)

        # Check ownership
        if funnel_entry.created_by != request.user:
            return Response(
                {"error": "You do not have permission to modify this entry"},
                status=status.HTTP_403_FORBIDDEN
            )

        stage = request.data.get('stage')
        interview_stage = request.data.get('interview_stage')
        interview_status = request.data.get('interview_status')
        feedback = request.data.get('feedback')

        if stage and stage not in [choice[0] for choice in RecruitmentFunnel.STAGES]:
            return Response(
                {"error": "Invalid stage"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if interview_stage and interview_stage not in [choice[0] for choice in RecruitmentFunnel.INTERVIEW_STAGES]:
            return Response(
                {"error": "Invalid interview stage"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if interview_status and interview_status not in [choice[0] for choice in RecruitmentFunnel.STATUSES]:
            return Response(
                {"error": "Invalid interview status"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            if stage:
                funnel_entry.stage = stage
            if interview_stage is not None:
                funnel_entry.interview_stage = interview_stage
            if interview_status:
                funnel_entry.interview_status = interview_status
            if feedback is not None:
                funnel_entry.feedback = feedback

            funnel_entry.save()

            return Response({
                'message': 'Funnel entry updated successfully',
                'funnel_entry': {
                    'id': funnel_entry.id,
                    'stage': funnel_entry.stage,
                    'interview_stage': funnel_entry.interview_stage,
                    'interview_status': funnel_entry.interview_status,
                    'feedback': funnel_entry.feedback,
                    'updated_at': funnel_entry.updated_at
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
