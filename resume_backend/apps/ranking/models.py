from django.db import models
from django.conf import settings


class JobCandidate(models.Model):
    """Model to store match results between jobs and candidates."""
    
    MATCH_TYPE_CHOICES = [
        ('smart', 'Smart Match'),
        ('deep', 'Deep Search'),
        ('exact', 'Exact Match'),
    ]
    
    job = models.ForeignKey(
        'jd_app.JobDescription',
        on_delete=models.CASCADE,
        related_name="job_candidates",
        db_index=True
    )
    candidate = models.ForeignKey(
        'candidates.Candidate',
        on_delete=models.CASCADE,
        related_name="job_candidates",
        db_index=True
    )
    match_score = models.FloatField(help_text="Match score from 0.0 to 1.0")
    match_type = models.CharField(
        max_length=20,
        choices=MATCH_TYPE_CHOICES,
        help_text="Type of matching algorithm used"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['job', 'candidate', 'match_type']
        ordering = ['-match_score', '-created_at']
        indexes = [
            models.Index(fields=['job', 'match_score']),
            models.Index(fields=['candidate', 'match_score']),
            models.Index(fields=['match_type']),
        ]

    def __str__(self):
        return f"{self.job.title} - {self.candidate.name} ({self.match_score:.2f})"


class RecruitmentFunnel(models.Model):
    """
    Recruitment funnel to track candidates through hiring stages.
    """
    STAGES = [
        ('applied', 'Applied'),
        ('shortlisted', 'Shortlisted'),
        ('interview', 'Interview'),
        ('offer', 'Offer'),
        ('hired', 'Hired'),
        ('rejected', 'Rejected'),
    ]

    INTERVIEW_STAGES = [
        ('hr_round', 'HR Round'),
        ('technical_round', 'Technical Round'),
        ('manager_round', 'Manager Round'),
        ('final_round', 'Final Round'),
    ]

    STATUSES = [
        ('pending', 'Pending'),
        ('scheduled', 'Scheduled'),
        ('completed', 'Completed'),
        ('passed', 'Passed'),
        ('failed', 'Failed'),
    ]

    job = models.ForeignKey(
        'jd_app.JobDescription',
        on_delete=models.CASCADE,
        related_name='funnel_candidates'
    )
    candidate = models.ForeignKey(
        'candidates.Candidate',
        on_delete=models.CASCADE,
        related_name='recruitment_funnels'
    )
    stage = models.CharField(
        max_length=20,
        choices=STAGES,
        default='shortlisted'
    )
    match_score = models.FloatField(
        help_text="Match score from 0.0 to 1.0"
    )
    match_type = models.CharField(
        max_length=20,
        choices=JobCandidate.MATCH_TYPE_CHOICES,
        blank=True,
        null=True,
        help_text="Type of matching algorithm used (smart, deep, exact)"
    )

    # Interview tracking
    interview_stage = models.CharField(
        max_length=20,
        choices=INTERVIEW_STAGES,
        blank=True,
        null=True
    )
    interview_status = models.CharField(
        max_length=20,
        choices=STATUSES,
        default='pending'
    )
    feedback = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Ownership
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="funnel_entries",
        db_index=True
    )

    class Meta:
        ordering = ['-updated_at']
        unique_together = ['job', 'candidate']
        indexes = [
            models.Index(fields=['job', 'stage']),
            models.Index(fields=['candidate', 'stage']),
            models.Index(fields=['stage']),
            models.Index(fields=['created_by']),
        ]

    def __str__(self):
        return f"{self.candidate.name} - {self.job.title} ({self.stage})"
