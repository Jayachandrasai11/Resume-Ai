from django.contrib import admin
from .models import Candidate, Resume, Skill, ResumeChunk


@admin.register(Skill)
class SkillAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "created_at")
    search_fields = ("name",)


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "email", "phone", "status", "created_by", "created_at")
    search_fields = ("name", "email", "phone")
    list_filter = ("status", "created_at")
    list_per_page = 50
    raw_id_fields = ("created_by",)


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    list_display = ("id", "candidate", "file_name", "source", "uploaded_at", "chunked", "uploaded_by")
    search_fields = ("file_name", "candidate__name", "candidate__email")
    list_filter = ("uploaded_at", "source", "chunked")
    list_per_page = 50
    raw_id_fields = ("candidate", "uploaded_by", "job_session")


@admin.register(ResumeChunk)
class ResumeChunkAdmin(admin.ModelAdmin):
    list_display = ("id", "resume", "chunk_index", "created_at")
    list_filter = ("created_at",)
    search_fields = ("resume__file_name",)
    list_per_page = 50
    raw_id_fields = ("resume",)
