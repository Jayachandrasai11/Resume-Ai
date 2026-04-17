# Re-export from apps.candidates for backwards compatibility
from apps.candidates.models import Candidate, Resume, ResumeChunk, Skill
from apps.candidates import views
from apps.candidates import services
from apps.candidates import serializers
from apps.candidates import urls
