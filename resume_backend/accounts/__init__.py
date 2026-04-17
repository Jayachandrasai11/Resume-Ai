# Re-export from apps.accounts for backwards compatibility
from apps.accounts.models import CustomUser, UserPreference
from apps.accounts import views
from apps.accounts import serializers
from apps.accounts import urls
from apps.accounts import admin
from apps.accounts import permissions
