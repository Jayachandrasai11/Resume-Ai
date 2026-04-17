from django.contrib.auth.models import AbstractUser
from django.db import models
from django.conf import settings

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ("admin", "Admin"),
        ("recruiter", "Recruiter"),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="recruiter")
    must_reset_password = models.BooleanField(default=False)
    onboarding_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.username} ({self.role})"


class UserPreference(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="preferences",
    )

    recruitment_prefs = models.JSONField(default=dict, blank=True)
    ai_settings = models.JSONField(default=dict, blank=True)
    notifications = models.JSONField(default=dict, blank=True)
    ui_prefs = models.JSONField(default=dict, blank=True)

    # Default session for auto-loading on login
    default_session = models.ForeignKey(
        'jd_app.JobSession',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_for_users",
        help_text="Default session to load automatically on login"
    )

    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Preferences for {self.user_id}"


class UserPagePreference(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="page_preferences",
    )
    view_path = models.CharField(max_length=255)  # e.g., '/api/candidates/'
    page_number = models.PositiveIntegerField(default=1)

    class Meta:
        unique_together = ('user', 'view_path')

    def __str__(self):
        return f"{self.user.username} - {self.view_path}: page {self.page_number}"
