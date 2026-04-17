"""
Serializers for the matching and ranking API.
"""

from rest_framework import serializers


class CandidateMatchSerializer(serializers.Serializer):
    """Serializer for individual candidate match result."""
    candidate_id = serializers.IntegerField()
    name = serializers.CharField()
    email = serializers.EmailField(allow_null=True)
    similarity_score = serializers.FloatField()
    match_percentage = serializers.FloatField()
    
    # Optional detailed fields
    phone = serializers.CharField(allow_null=True, required=False)
    summary = serializers.CharField(allow_null=True, required=False)
    skills = serializers.ListField(child=serializers.CharField(), required=False)
    experience = serializers.ListField(child=serializers.CharField(), required=False)
    education = serializers.ListField(child=serializers.CharField(), required=False)
    projects = serializers.ListField(child=serializers.CharField(), required=False)
    
    # Job information (when matching by job)
    job_id = serializers.IntegerField(required=False)
    job_title = serializers.CharField(required=False)
    
    # Enhanced matching fields
    keyword_score = serializers.FloatField(required=False)
    semantic_score = serializers.FloatField(required=False)
    skill_score = serializers.FloatField(required=False)
    experience_score = serializers.FloatField(required=False)
    matching_keywords = serializers.ListField(child=serializers.CharField(), required=False)


class MatchRequestSerializer(serializers.Serializer):
    """Serializer for match request."""
    job_description = serializers.CharField(
        required=True,
        help_text="Job description text to match against"
    )
    limit = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=100,
        help_text="Maximum number of candidates to return"
    )
    threshold = serializers.FloatField(
        default=0.3,
        min_value=0.0,
        max_value=1.0,
        help_text="Minimum similarity score threshold (0-1)"
    )
    strategy = serializers.ChoiceField(
        choices=['cosine', 'hybrid', 'weighted'],
        default='cosine',
        help_text="Matching strategy to use"
    )
    mode = serializers.ChoiceField(
        choices=['smart', 'semantic', 'keyword'],
        default='smart',
        required=False,
        help_text="Matching mode to use"
    )
    include_details = serializers.BooleanField(
        default=False,
        help_text="Include detailed candidate information"
    )


class MatchByJobIdRequestSerializer(serializers.Serializer):
    """Serializer for matching by job ID."""
    job_id = serializers.IntegerField(
        required=True,
        help_text="ID of the job description to match against"
    )
    limit = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=100,
        help_text="Maximum number of candidates to return"
    )
    threshold = serializers.FloatField(
        default=0.3,
        min_value=0.0,
        max_value=1.0,
    )
    recruiter_id = serializers.IntegerField(
        required=False,
        default=None,
        help_text="Filter by resumes uploaded by this recruiter (user) ID"
    )
    strategy = serializers.ChoiceField(
        choices=['cosine', 'hybrid', 'weighted'],
        default='cosine',
        help_text="Matching strategy to use"
    )
    mode = serializers.ChoiceField(
        choices=['smart', 'semantic', 'keyword'],
        default='smart',
        required=False,
        help_text="Matching mode to use (smart=semantic+skills+experience, semantic=deep search, keyword=exact match)"
    )


class MatchResponseSerializer(serializers.Serializer):
    """Serializer for match response."""
    results = CandidateMatchSerializer(many=True)
    total_candidates = serializers.IntegerField()
    average_score = serializers.FloatField()
    match_time_ms = serializers.FloatField(allow_null=True)
    strategy_used = serializers.CharField()


class MatchStatisticsSerializer(serializers.Serializer):
    """Serializer for match statistics."""
    total_candidates = serializers.IntegerField()
    average_score = serializers.FloatField()
    average_percentage = serializers.FloatField()
    high_matches = serializers.IntegerField()
    medium_matches = serializers.IntegerField()
    low_matches = serializers.IntegerField()
    score_distribution = serializers.DictField()
    recommendation = serializers.CharField()


class BatchMatchRequestSerializer(serializers.Serializer):
    """Serializer for batch matching multiple jobs."""
    job_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        help_text="List of job IDs to match"
    )
    limit = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=100,
        help_text="Maximum candidates per job"
    )


class BatchMatchResponseSerializer(serializers.Serializer):
    """Serializer for batch match response."""
    results = serializers.DictField(
        child=serializers.ListField(
            child=CandidateMatchSerializer()
        )
    )
    total_jobs = serializers.IntegerField()
    total_candidates = serializers.IntegerField()