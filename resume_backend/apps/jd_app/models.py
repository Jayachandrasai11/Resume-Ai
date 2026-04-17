from django.conf import settings
from django.db import models


class JobDescription(models.Model):
    """Job description model with AI-extracted structured data."""
    
    # Basic job information
    title = models.CharField(max_length=255)
    description = models.TextField()
    skills = models.TextField(help_text="Comma-separated list of skills", blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    # Ownership (multi-tenant)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="job_descriptions",
    )
    
    # Session association
    job_session = models.ForeignKey(
        'JobSession',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="job_descriptions",
        help_text="Recruitment session this job belongs to"
    )
    
    # AI-extracted fields
    extracted_role = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="AI-extracted job role/title"
    )
    required_skills = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="AI-extracted list of required skills"
    )
    preferred_skills = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="AI-extracted list of preferred skills"
    )
    min_experience = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="AI-extracted minimum experience required"
    )
    experience_years = models.FloatField(
        blank=True,
        null=True,
        help_text="AI-extracted minimum experience in years"
    )
    salary_range = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="AI-extracted salary range"
    )
    location = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="AI-extracted job location"
    )
    employment_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="AI-extracted employment type (Full-time, Part-time, Contract, etc.)"
    )
    responsibilities = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="AI-extracted list of responsibilities"
    )
    qualifications = models.JSONField(
        default=list,
        blank=True,
        null=True,
        help_text="AI-extracted list of qualifications"
    )
    analyzed_at = models.DateTimeField(
        blank=True,
        null=True,
        help_text="Timestamp when job description was analyzed by AI"
    )
    analysis_status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('analyzing', 'Analyzing'),
            ('completed', 'Completed'),
            ('failed', 'Failed')
        ],
        default='pending',
        help_text="Status of AI analysis"
    )
    analysis_error = models.TextField(
        blank=True,
        null=True,
        help_text="Error message if analysis failed"
    )
    status = models.CharField(
        max_length=20,
        choices=[
            ('open', 'Open'),
            ('closed', 'Closed'),
        ],
        default='open',
        help_text="Job status"
    )
    # Store matched candidate IDs and scores
    matched_candidates = models.JSONField(
        default=list,
        blank=True,
        help_text="List of matched candidates with scores"
    )

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['analysis_status']),
            models.Index(fields=['analyzed_at']),
        ]

    def get_skills_list(self):
        """Get skills as a list from the comma-separated string."""
        return [s.strip() for s in self.skills.split(",") if s.strip()]

    def get_required_skills_list(self):
        """Get AI-extracted required skills as a list."""
        return self.required_skills if self.required_skills else []

    def get_preferred_skills_list(self):
        """Get AI-extracted preferred skills as a list."""
        return self.preferred_skills if self.preferred_skills else []

    def get_responsibilities_list(self):
        """Get AI-extracted responsibilities as a list."""
        return self.responsibilities if self.responsibilities else []

    def get_qualifications_list(self):
        """Get AI-extracted qualifications as a list."""
        return self.qualifications if self.qualifications else []

    def is_analyzed(self):
        """Check if job description has been analyzed by AI."""
        return self.analysis_status == 'completed' and self.analyzed_at is not None

    def __str__(self):
        return self.title


class JobSession(models.Model):
    """Model to track recruitment sessions."""
    company_name = models.CharField(max_length=255)
    hr_name = models.CharField(max_length=255)
    job_role = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    # Ownership (multi-tenant)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="job_sessions",
    )

    # Track when session was last selected by user
    last_selected = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.job_role} at {self.company_name} ({self.hr_name})"
