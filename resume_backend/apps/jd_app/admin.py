from django.contrib import admin
from .models import JobDescription


@admin.register(JobDescription)
class JobDescriptionAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "analysis_status", "analyzed_at")
    search_fields = ("title", "description", "skills")
    list_filter = ("analysis_status", "created_at")
