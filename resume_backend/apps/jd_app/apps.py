from django.apps import AppConfig
from django.db.models.signals import post_save
from django.dispatch import receiver


class JdAppConfig(AppConfig):
    name = 'apps.jd_app'
    
    def ready(self):
        """Register signals when the app is ready."""
        from .models import JobDescription
        from .services.job_analyzer import job_analyzer
        
        @receiver(post_save, sender=JobDescription)
        def analyze_job_on_creation(sender, instance, created, **kwargs):
            """Automatically analyze job description when it's created."""
            if created:
                # Run analysis in background (synchronous for now, could be async in production)
                try:
                    job_analyzer.analyze_and_update_job(instance)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Failed to trigger analysis for job {instance.id}: {e}")
