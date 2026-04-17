from django.contrib import admin
from .models import CandidatePipeline


@admin.register(CandidatePipeline)
class CandidatePipelineAdmin(admin.ModelAdmin):
    """Admin interface for CandidatePipeline model."""
    list_display = [
        'candidate',
        'job',
        'current_stage',
        'updated_at',
        'created_at'
    ]
    list_filter = ['current_stage', 'created_at', 'updated_at']
    search_fields = ['candidate__name', 'candidate__email', 'job__title']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-updated_at']
    
    fieldsets = (
        ('Candidate & Job', {
            'fields': ('candidate', 'job')
        }),
        ('Pipeline Status', {
            'fields': ('current_stage', 'notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('candidate', 'job')