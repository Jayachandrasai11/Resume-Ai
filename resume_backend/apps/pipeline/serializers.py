from rest_framework import serializers
from .models import CandidatePipeline, PipelineStage
from apps.candidates.serializers import CandidateSerializer
from apps.jd_app.serializer import JobDescriptionSerializer


class CandidatePipelineSerializer(serializers.ModelSerializer):
    """Serializer for CandidatePipeline model."""
    candidate_name = serializers.CharField(source='candidate.name', read_only=True)
    candidate_email = serializers.EmailField(source='candidate.email', read_only=True)
    job_title = serializers.CharField(source='job.title', read_only=True)
    stage_display = serializers.CharField(source='get_current_stage_display', read_only=True)
    
    class Meta:
        model = CandidatePipeline
        fields = [
            'id',
            'candidate',
            'candidate_name',
            'candidate_email',
            'job',
            'job_title',
            'current_stage',
            'stage_display',
            'created_at',
            'updated_at',
            'notes',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CandidatePipelineDetailSerializer(CandidatePipelineSerializer):
    """Detailed serializer including nested candidate and job information."""
    candidate = CandidateSerializer(read_only=True)
    job = JobDescriptionSerializer(read_only=True)
    
    class Meta(CandidatePipelineSerializer.Meta):
        fields = CandidatePipelineSerializer.Meta.fields


class UpdatePipelineStageSerializer(serializers.Serializer):
    """Serializer for updating pipeline stage."""
    current_stage = serializers.ChoiceField(
        choices=PipelineStage.choices,
        help_text="New stage for the candidate"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Optional notes about the stage change"
    )


class PipelineStageSerializer(serializers.Serializer):
    """Serializer for pipeline stage choices."""
    value = serializers.CharField()
    label = serializers.CharField()