from rest_framework import serializers
from .models import JobDescription, JobSession

class JobDescriptionSerializer(serializers.ModelSerializer):
    session_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    skills = serializers.CharField(required=False, allow_blank=True, default="")
    
    class Meta:
        model = JobDescription
        fields = ["id", "title", "description", "skills", "min_experience", "created_at", "status", "job_session", "session_id"]
        
    def validate_session_id(self, value):
        if value is None:
            return value
        # Verify session exists and belongs to current user
        from .models import JobSession
        try:
            JobSession.objects.get(id=value, created_by=self.context['request'].user)
        except JobSession.DoesNotExist:
            raise serializers.ValidationError("Invalid session or session does not belong to you.")
        return value
        
    def create(self, validated_data):
        session_id = validated_data.pop('session_id', None)
        if session_id:
            from .models import JobSession
            validated_data['job_session'] = JobSession.objects.get(id=session_id)
        return super().create(validated_data)

class JobSessionSerializer(serializers.ModelSerializer):
    resume_count = serializers.SerializerMethodField()
    
    class Meta:
        model = JobSession
        fields = ["id", "company_name", "hr_name", "job_role", "created_at", "last_selected", "resume_count"]
        
    def get_resume_count(self, obj):
        from apps.candidates.models import Resume
        return Resume.objects.filter(job_session_id=obj.id).count()
