from django.db import models
from django.utils import timezone
from apps.candidates.models import Candidate
from apps.jd_app.models import JobDescription


class PipelineStage(models.TextChoices):
    """Interview pipeline stages."""
    APPLIED = 'applied', 'Applied'
    SCREENING = 'screening', 'Screening'
    TECHNICAL_INTERVIEW = 'technical_interview', 'Technical Interview'
    HR_INTERVIEW = 'hr_interview', 'HR Interview'
    OFFER = 'offer', 'Offer'
    REJECTED = 'rejected', 'Rejected'


class CandidatePipeline(models.Model):
    """
    Model to track the interview pipeline stage for each candidate-job combination.
    """
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name='pipelines',
        db_index=True
    )
    job = models.ForeignKey(
        JobDescription,
        on_delete=models.CASCADE,
        related_name='pipelines',
        db_index=True
    )
    current_stage = models.CharField(
        max_length=50,
        choices=PipelineStage.choices,
        default=PipelineStage.APPLIED,
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)
    notes = models.TextField(blank=True, help_text="Additional notes about the candidate's progress")

    class Meta:
        verbose_name = 'Candidate Pipeline'
        verbose_name_plural = 'Candidate Pipelines'
        ordering = ['-updated_at']
        unique_together = ['candidate', 'job']  # One pipeline entry per candidate-job pair
        indexes = [
            models.Index(fields=['candidate', 'job']),
            models.Index(fields=['current_stage', 'updated_at']),
            models.Index(fields=['job', 'current_stage']),
        ]

    def __str__(self):
        return f"{self.candidate.name} - {self.job.title} ({self.get_current_stage_display()})"

    def advance_stage(self, new_stage):
        """Advance the pipeline to a new stage."""
        if new_stage in dict(PipelineStage.choices):
            self.current_stage = new_stage
            self.updated_at = timezone.now()
            self.save()
            return True
        return False

    @property
    def stage_history(self):
        """Return a list of stage changes (can be extended with a separate model for full history)."""
        # This is a simplified version. For full history, create a PipelineStageHistory model.
        return {
            'current_stage': self.get_current_stage_display(),
            'created_at': self.created_at,
            'updated_at': self.updated_at
        }