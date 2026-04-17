from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import UserPreference
from apps.jd_app.models import JobSession
from apps.jd_app.serializer import JobSessionSerializer
from .models import UserPreference
from django.utils import timezone
from backend.utils.validators import validate_password_strength
from rest_framework.exceptions import PermissionDenied
from backend.routes.auth import RESET_PASSWORD_PATH

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "full_name",
            "role",
            "is_active",
            "date_joined",
        )
        read_only_fields = ("id", "date_joined")

    def get_full_name(self, obj):
        try:
            name = obj.get_full_name()
        except Exception:
            name = ""
        return (name or "").strip()


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("username", "email", "first_name", "last_name")

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    # Backwards-compatible alias (older frontend may send `name`)
    name = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        # NOTE: `username` is treated as the login identifier by SimpleJWT.
        # In this app we use email for login, and store the human name separately.
        fields = ("username", "password", "email", "role", "full_name", "name")

    def validate_password(self, value):
        try:
            validate_password_strength(value)
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        return value

    def create(self, validated_data):
        full_name = (validated_data.get("full_name") or validated_data.get("name") or "").strip()
        first_name = ""
        last_name = ""
        if full_name:
            parts = [p for p in full_name.split(" ") if p.strip()]
            first_name = parts[0] if parts else ""
            last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

        user = User.objects.create_user(
            # Always use email as the login username so users can log in with email
            username=validated_data.get("email", validated_data["username"]),
            email=validated_data.get("email", ""),
            password=validated_data["password"],
            role=validated_data.get("role", "recruiter"),
            first_name=first_name,
            last_name=last_name,
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token["role"] = user.role
        token["username"] = user.username
        return token

    def get_session_info(self, user):
        """Get user's session information with priority-based default selection."""
        # Get all user's sessions
        user_sessions = JobSession.objects.filter(created_by=user).order_by("-last_selected", "-created_at")
        sessions_data = JobSessionSerializer(user_sessions, many=True).data

        # Determine default session based on priority
        default_session = None
        auto_selected = False

        if user_sessions.exists():
            # Priority 1: Last selected session (most recent last_selected)
            last_selected = user_sessions.filter(last_selected__isnull=False).order_by('-last_selected').first()
            if last_selected:
                default_session = last_selected
            else:
                # Priority 2: User's explicitly marked default session
                try:
                    preference = user.preferences
                    if preference.default_session and preference.default_session in user_sessions:
                        default_session = preference.default_session
                    else:
                        # Priority 3: Latest created session
                        default_session = user_sessions.order_by('-created_at').first()
                        auto_selected = True  # Mark as auto-selected since no explicit choice
                except UserPreference.DoesNotExist:
                    # Priority 3: Latest created session
                    default_session = user_sessions.order_by('-created_at').first()
                    auto_selected = True

        # Prepare response
        result = {
            "sessions": sessions_data,
            "total_sessions": len(sessions_data),
            "auto_selected": auto_selected
        }

        if default_session:
            result.update({
                "default_session": JobSessionSerializer(default_session).data,
                "has_default_session": True
            })
        else:
            result.update({
                "default_session": None,
                "has_default_session": False
            })

        return result

    def validate(self, attrs):
        # Allow login by email as well as username.
        # SimpleJWT expects "username" by default; if an email is provided in that field,
        # map it to the actual username for authentication.
        raw_username = attrs.get("username") or ""
        if isinstance(raw_username, str) and "@" in raw_username:
            user = User.objects.filter(email__iexact=raw_username.strip()).first()
            if user:
                attrs["username"] = user.get_username()

        data = super().validate(attrs)

        # Enforce password reset before issuing tokens (cannot infer "weak" from hash,
        # so we use an explicit flag set on the user).
        if getattr(self.user, "must_reset_password", False):
            raise PermissionDenied(
                detail={
                    "code": "password_reset_required",
                    "detail": "Password reset required before login.",
                    "reset_path": RESET_PASSWORD_PATH,
                }
            )
        data["user"] = UserSerializer(self.user).data
        # Add session information for frontend logic
        data["session_info"] = self.get_session_info(self.user)
        return data


class UserPreferenceSerializer(serializers.ModelSerializer):
    default_session_id = serializers.IntegerField(source='default_session.id', read_only=True, allow_null=True)
    default_session_name = serializers.CharField(source='default_session.job_role', read_only=True, allow_null=True)

    class Meta:
        model = UserPreference
        fields = ("recruitment_prefs", "ai_settings", "notifications", "ui_prefs", "default_session", "default_session_id", "default_session_name", "updated_at")
        read_only_fields = ("default_session_id", "default_session_name")
