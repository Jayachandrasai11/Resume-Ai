from django.db import models
from django.conf import settings  # noqa: F401
from pgvector.django import VectorField


class Skill(models.Model):
    name = models.CharField(max_length=100, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'candidates'

    def __str__(self):
        return self.name

class Candidate(models.Model):
    STATUS_CHOICES = [
        ('applied', 'Applied'),
        ('screening', 'Screening'),
        ('interview', 'Interview'),
        ('offered', 'Offered'),
        ('rejected', 'Rejected'),
        ('hired', 'Hired'),
    ]
    name = models.CharField(max_length=255, blank=True, default='', db_index=True)
    email = models.EmailField(blank=True, null=True, db_index=True)
    phone = models.CharField(max_length=20, blank=True, default='', db_index=True)
    location = models.CharField(max_length=255, blank=True, default='', db_index=True)
    experience_years = models.FloatField(default=0.0, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='applied', db_index=True)
    # Keeping JSONField for historical/legacy data, adding M2M for structured data
    skills = models.JSONField(default=list, blank=True, null=True)
    skills_m2m = models.ManyToManyField(Skill, related_name="candidates", blank=True)
    education = models.JSONField(default=list, blank=True, null=True)
    experience = models.JSONField(default=list, blank=True, null=True)
    projects = models.JSONField(default=list, blank=True, null=True)
    summary = models.TextField(blank=True, default='')

    # Ownership (multi-tenant) - track which recruiter created this candidate
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="candidates",
        db_index=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'candidates'
        ordering = ['id']
        indexes = [
            models.Index(fields=['email']),
            models.Index(fields=['phone']),
            models.Index(fields=['name']),
        ]

    def __str__(self):
        return self.name or "Unnamed Candidate"


class Resume(models.Model):
    SOURCE_CHOICES = [
        ('upload', 'Manual Upload'),
        ('email', 'Email Ingestion'),
        ('api', 'API Integration'),
    ]
    candidate = models.ForeignKey(
        Candidate,
        on_delete=models.CASCADE,
        related_name="resumes",
        null=True,
        blank=True,
        db_index=True
    )
    # NEW: Link resume to a job session for filtering
    job_session = models.ForeignKey(
        'jd_app.JobSession',
        on_delete=models.SET_NULL,
        related_name="resumes",
        null=True,
        blank=True,
        db_index=True,
        help_text="Job session under which this resume was uploaded"
    )
    # Track who uploaded the resume
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="uploaded_resumes",
        null=True,
        blank=True,
        db_index=True
    )
    file = models.FileField(upload_to="resumes/")
    file_name = models.CharField(max_length=255, blank=True)
    text = models.TextField(blank=True)
    source = models.CharField(max_length=20, choices=SOURCE_CHOICES, default='upload', db_index=True)
    uploaded_at = models.DateTimeField(auto_now_add=True, db_index=True)
    chunked = models.BooleanField(default=False, db_index=True)

    class Meta:
        app_label = 'candidates'
        indexes = [
            models.Index(fields=['uploaded_at']),
            models.Index(fields=['chunked']),
            models.Index(fields=['source']),
            models.Index(fields=['candidate', 'uploaded_at']),
        ]

    def __str__(self):
        return self.file_name or self.file.name


class ResumeChunk(models.Model):
    """Model to store chunks of resume text for embedding generation."""
    resume = models.ForeignKey(
        Resume,
        on_delete=models.CASCADE,
        related_name="chunks",
        db_index=True
    )
    chunk_text = models.TextField()
    chunk_index = models.PositiveIntegerField()
    # pgvector field to store sentence-transformer embeddings
    embedding = VectorField(dimensions=384, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['resume', 'chunk_index']
        unique_together = ['resume', 'chunk_index']
        indexes = [
            models.Index(fields=['resume', 'chunk_index']),
        ]

    def __str__(self):
        return f"Chunk {self.chunk_index} of {self.resume.file_name}"
