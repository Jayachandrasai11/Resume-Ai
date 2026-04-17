from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
import logging

from .models import CandidatePipeline, PipelineStage
from .serializers import (
    CandidatePipelineSerializer,
    CandidatePipelineDetailSerializer,
    UpdatePipelineStageSerializer,
)
from .services.pipeline_service import update_candidate_stage, set_candidate_stage

logger = logging.getLogger(__name__)


class CandidatePipelineViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing candidate pipeline entries.
    Provides CRUD operations for candidate-job pipeline tracking.
    """
    queryset = CandidatePipeline.objects.select_related('candidate', 'job').all()
    serializer_class = CandidatePipelineSerializer
    
    def get_serializer_class(self):
        """Use detailed serializer for retrieve action."""
        if self.action == 'retrieve':
            return CandidatePipelineDetailSerializer
        return CandidatePipelineSerializer
    
    def create(self, request, *args, **kwargs):
        """Create a new pipeline entry for a candidate-job pair."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if pipeline already exists for this candidate-job pair
        candidate_id = request.data.get('candidate')
        job_id = request.data.get('job')
        
        if CandidatePipeline.objects.filter(candidate_id=candidate_id, job_id=job_id).exists():
            return Response(
                {'error': 'Pipeline entry already exists for this candidate-job pair.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['patch', 'put'])
    def update_stage(self, request, pk=None):
        """
        Update the pipeline stage for a specific candidate.
        
        PUT/PATCH /api/pipeline/{id}/update_stage/
        Body: {"current_stage": "technical_interview", "notes": "Optional notes"}
        """
        pipeline = self.get_object()
        serializer = UpdatePipelineStageSerializer(data=request.data)
        
        if serializer.is_valid():
            new_stage = serializer.validated_data['current_stage']
            notes = serializer.validated_data.get('notes', '')
            
            # Update stage and send notification via service
            pipeline = update_candidate_stage(pipeline, new_stage, notes)
            
            return Response(
                CandidatePipelineSerializer(pipeline).data,
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def by_stage(self, request):
        """
        List all candidates grouped by their current pipeline stage.
        
        GET /api/pipeline/by_stage/?stage=technical_interview
        GET /api/pipeline/by_stage/ (returns all stages)
        """
        stage_filter = request.query_params.get('stage', None)
        
        if stage_filter:
            # Filter by specific stage
            if stage_filter not in dict(PipelineStage.choices):
                return Response(
                    {'error': f'Invalid stage. Valid stages are: {list(dict(PipelineStage.choices).keys())}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            pipelines = self.queryset.filter(current_stage=stage_filter)
            serializer = self.get_serializer(pipelines, many=True)
            return Response({
                'stage': stage_filter,
                'stage_display': dict(PipelineStage.choices).get(stage_filter),
                'candidates': serializer.data,
                'count': pipelines.count()
            })
        
        # Return all candidates grouped by stage
        result = {}
        for stage_value, stage_label in PipelineStage.choices:
            pipelines = self.queryset.filter(current_stage=stage_value)
            serializer = self.get_serializer(pipelines, many=True)
            result[stage_value] = {
                'label': stage_label,
                'candidates': serializer.data,
                'count': pipelines.count()
            }
        
        return Response(result)
    
    @action(detail=False, methods=['get'])
    def stages(self, request):
        """
        Get all available pipeline stages.
        
        GET /api/pipeline/stages/
        """
        stages = [
            {'value': value, 'label': label}
            for value, label in PipelineStage.choices
        ]
        return Response(stages)
    
    @action(detail=False, methods=['get'])
    def by_job(self, request):
        """
        List all pipeline entries for a specific job.
        
        GET /api/pipeline/by_job/?job_id=1
        """
        job_id = request.query_params.get('job_id')
        
        if not job_id:
            return Response(
                {'error': 'job_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pipelines = self.queryset.filter(job_id=job_id)
        serializer = self.get_serializer(pipelines, many=True)
        
        return Response({
            'job_id': job_id,
            'pipelines': serializer.data,
            'count': pipelines.count()
        })
    
    @action(detail=False, methods=['get'])
    def by_candidate(self, request):
        """
        List all pipeline entries for a specific candidate across all jobs.
        
        GET /api/pipeline/by_candidate/?candidate_id=1
        """
        candidate_id = request.query_params.get('candidate_id')
        
        if not candidate_id:
            return Response(
                {'error': 'candidate_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        pipelines = self.queryset.filter(candidate_id=candidate_id)
        serializer = self.get_serializer(pipelines, many=True)
        
        return Response({
            'candidate_id': candidate_id,
            'pipelines': serializer.data,
            'count': pipelines.count()
        })


class UpdateCandidateStageAPIView(APIView):
    """
    API endpoint to update candidate stage by candidate and job IDs.
    
    POST /api/pipeline/update-stage/
    Body: {
        "candidate_id": 1,
        "job_id": 1,
        "current_stage": "technical_interview",
        "notes": "Optional notes"
    }
    """
    
    def post(self, request):
        candidate_id = request.data.get('candidate_id')
        job_id = request.data.get('job_id')
        current_stage = request.data.get('current_stage')
        notes = request.data.get('notes', '')
        
        if not all([candidate_id, job_id, current_stage]):
            return Response(
                {'error': 'candidate_id, job_id, and current_stage are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if current_stage not in dict(PipelineStage.choices):
            return Response(
                {'error': f'Invalid stage. Valid stages are: {list(dict(PipelineStage.choices).keys())}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update or create stage safely via service
        pipeline, created = set_candidate_stage(candidate_id, job_id, current_stage, notes)
        
        serializer = CandidatePipelineSerializer(pipeline)
# sourcery skip: swap-if-expression
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)