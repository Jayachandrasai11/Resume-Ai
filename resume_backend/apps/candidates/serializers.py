from rest_framework import serializers
from .models import Candidate, Resume, ResumeChunk
import json
import logging

logger = logging.getLogger(__name__)


class ResumeChunkSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResumeChunk
        fields = ['id', 'chunk_text', 'chunk_index', 'created_at']


class ResumeSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = Resume
        fields = ["id", "file", "file_name", "text"]

    def get_file(self, obj):
        request = self.context.get("request")
        logger.info(f"[DEBUG ResumeSerializer] get_file called for object: {obj.id}, file: {obj.file}")
        if obj.file and obj.file.storage.exists(obj.file.name):
            url = request.build_absolute_uri(obj.file.url) if request else obj.file.url
            logger.info(f"[DEBUG ResumeSerializer] File URL: {url}")
            return url
        logger.warning(f"[DEBUG ResumeSerializer] File does not exist or is None for object: {obj.id}")
        return None


class CandidateSerializer(serializers.ModelSerializer):
    resumes = ResumeSerializer(many=True, read_only=True)
    skills = serializers.SerializerMethodField()
    extracted_skills = serializers.SerializerMethodField()  # Alias for frontend compatibility
    education = serializers.SerializerMethodField()
    experience = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()

    class Meta:
        model = Candidate
        fields = [
            "id",
            "name",
            "email",
            "phone",
            "location",
            "experience_years",
            "summary",
            "status",
            "skills",
            "extracted_skills",
            "education",
            "experience",
            "projects",
            "resumes"
        ]

    def to_representation(self, instance):
        """Override to add debug logging."""
        data = super().to_representation(instance)
        # Log experience_years field value for debugging
        logger.info(f"[Serializer Debug] Candidate {instance.id} ({instance.name}): experience_years={data.get('experience_years')}")
        return data

    def get_skills(self, obj):
        # Return M2M skills if available, otherwise JSON skills
        m2m_skills = list(obj.skills_m2m.values_list('name', flat=True))
        if m2m_skills:
            return m2m_skills
        
        # Handle JSON skills - check for N.A values and null
        if obj.skills is None:
            json_skills = []
        elif isinstance(obj.skills, list):
            json_skills = obj.skills
        elif isinstance(obj.skills, str):
            # Handle string stored in skills field - check for N.A
            if obj.skills.strip() in ["N.A", "N/A", "n.a", "na", "", "[]", "null"]:
                json_skills = []
            elif obj.skills.startswith("["):
                try:
                    json_skills = json.loads(obj.skills)
                except:
                    json_skills = []
            else:
                # It's a comma-separated string
                json_skills = [s.strip() for s in obj.skills.split(",") if s.strip()]
        else:
            json_skills = []
        return json_skills

    def get_extracted_skills(self, obj):
        # Alias for get_skills - returns same data for frontend compatibility
        return self.get_skills(obj)

    def get_education(self, obj):
        # Handle N.A values and null/None
        if obj.education is None:
            return []
        if isinstance(obj.education, str):
            if obj.education.strip() in ["N.A", "N/A", "n.a", "na", "", "[]", "{}", "null"]:
                return []
        return obj.education if isinstance(obj.education, list) else []

    def get_experience(self, obj):
        # Handle N.A values and null/None
        if obj.experience is None:
            return []
        if isinstance(obj.experience, str):
            if obj.experience.strip() in ["N.A", "N/A", "n.a", "na", "", "[]", "{}", "null"]:
                return []
        
        if isinstance(obj.experience, list) and obj.experience:
            return obj.experience
        elif isinstance(obj.experience, str) and obj.experience.strip() and obj.experience.strip() not in ["N.A", "N/A", "n.a", "na"]:
            return [{"role": obj.experience.strip(), "company": "", "duration": ""}]
        return []

    def get_projects(self, obj):
        # Handle N.A values and null/None
        if obj.projects is None:
            return []
        if isinstance(obj.projects, str):
            if obj.projects.strip() in ["N.A", "N/A", "n.a", "na", "", "[]", "{}", "null"]:
                return []
        return obj.projects if isinstance(obj.projects, list) else []
