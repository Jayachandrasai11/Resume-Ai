import os

from rest_framework import permissions


def _parse_email_list(raw: str):
    if not raw:
        return set()
    return {s.strip().lower() for s in str(raw).split(",") if s.strip()}

class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        # Treat Django superusers/staff as admins for API access.
        # This avoids role mismatches (e.g., superuser created in Django admin but role field not updated).
        if getattr(user, "is_superuser", False) or getattr(user, "is_staff", False):
            return True

        if getattr(user, "role", None) == "admin":
            return True

        # Optional: allow admin access by email list (comma-separated) from env.
        # Example: ADMIN_EMAILS=admin@gmail.com,other@company.com
        admin_emails = _parse_email_list(os.getenv("ADMIN_EMAILS", ""))
        email = (getattr(user, "email", "") or "").strip().lower()
        return bool(email and email in admin_emails)

class IsRecruiter(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "recruiter")

class IsAdminOrRecruiter(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ["admin", "recruiter"])
