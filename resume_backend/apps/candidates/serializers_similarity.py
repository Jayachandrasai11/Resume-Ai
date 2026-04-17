"""
Serializers for resume similarity detection API.
"""

from rest_framework import serializers
from .models import Candidate, Resume


class SimilarCandidateSerializer(serializers.Serializer):
    """Serializer for similar candidate results."""
    candidate_id = serializers.IntegerField()
    candidate_name = serializers.CharField()
    candidate_email = serializers.EmailField(allow_null=True)
    similarity_score = serializers.FloatField()
    chunks_compared = serializers.IntegerField()
    is_duplicate = serializers.BooleanField()
    is_similar = serializers.BooleanField()


class SimilarityCheckRequestSerializer(serializers.Serializer):
    """Serializer for similarity check request."""
    resume_text = serializers.CharField(required=False, allow_blank=True)
    resume_id = serializers.IntegerField(required=False)
    threshold = serializers.FloatField(
        default=0.90,
        min_value=0.0,
        max_value=1.0,
        help_text="Similarity threshold (0.0 to 1.0)"
    )
    limit = serializers.IntegerField(
        default=5,
        min_value=1,
        max_value=20,
        help_text="Maximum number of similar candidates to return"
    )
    distance_metric = serializers.ChoiceField(
        choices=['cosine', 'l2'],
        default='cosine',
        help_text="Distance metric to use for similarity calculation"
    )

    def validate(self, data):
        """Validate that either resume_text or resume_id is provided."""
        if not data.get('resume_text') and not data.get('resume_id'):
            raise serializers.ValidationError(
                "Either 'resume_text' or 'resume_id' must be provided"
            )
        return data


class SimilarityCheckResponseSerializer(serializers.Serializer):
    """Serializer for similarity check response."""
    is_duplicate = serializers.BooleanField()
    similar_candidates = SimilarCandidateSerializer(many=True)
    max_similarity = serializers.FloatField()
    total_candidates_checked = serializers.IntegerField()


class FindSimilarCandidatesRequestSerializer(serializers.Serializer):
    """Serializer for finding similar candidates request."""
    candidate_id = serializers.IntegerField()
    threshold = serializers.FloatField(
        default=0.75,
        min_value=0.0,
        max_value=1.0,
        help_text="Minimum similarity threshold"
    )
    limit = serializers.IntegerField(
        default=5,
        min_value=1,
        max_value=20,
        help_text="Maximum number of similar candidates to return"
    )


class SimilarityStatisticsSerializer(serializers.Serializer):
    """Serializer for similarity statistics."""
    total_candidates = serializers.IntegerField()
    candidates_with_embeddings = serializers.IntegerField()
    total_resume_chunks = serializers.IntegerField()
    chunks_with_embeddings = serializers.IntegerField()
    embedding_coverage = serializers.CharField()


class MarkDuplicateRequestSerializer(serializers.Serializer):
    """Serializer for marking duplicate resumes."""
    resume_id = serializers.IntegerField()
    similar_candidate_ids = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of candidate IDs to mark as duplicates"
    )


class MarkDuplicateResponseSerializer(serializers.Serializer):
    """Serializer for marking duplicates response."""
    marked_count = serializers.IntegerField()
    results = serializers.ListField(
        child=serializers.DictField()
    )