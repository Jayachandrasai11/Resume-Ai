from django.shortcuts import redirect, get_object_or_404
from django.http import JsonResponse
from django.db.utils import ProgrammingError
from django.core.cache import cache
from django.db import models
import hashlib
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import (
    CreateAPIView,
    RetrieveAPIView,
    ListAPIView,
    UpdateAPIView,
    RetrieveDestroyAPIView,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.core.exceptions import PermissionDenied

from .models import JobDescription, JobSession
from .serializer import JobDescriptionSerializer, JobSessionSerializer
from apps.ranking.services.semantic_search import semantic_search_service


class JobSessionViewSet(viewsets.ModelViewSet):
    queryset = JobSession.objects.all()
    serializer_class = JobSessionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Always filter by authenticated user for data isolation."""
        return self.queryset.filter(created_by=self.request.user).order_by("-last_selected", "-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    def get_object(self):
        """Ensure user can only access their own sessions."""
        obj = super().get_object()
        if obj.created_by != self.request.user:
            raise PermissionDenied("You do not have permission to access this session.")
        return obj

    @action(detail=True, methods=['patch'])
    def select(self, request, pk=None):
        """Mark session as selected and update last_selected timestamp."""
        session = self.get_object()
        session.last_selected = timezone.now()
        session.save()
        serializer = self.get_serializer(session)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get the user's active session based on priority (industry standard implementation)."""
        user_sessions = self.get_queryset()

        if not user_sessions.exists():
            return Response({
                "active_session": None,
                "has_active_session": False,
                "sessions_available": 0
            })

        # Priority 1: Last selected session (most recent last_selected)
        active_session = user_sessions.filter(last_selected__isnull=False).order_by('-last_selected').first()
        
        # Priority 2: Explicit default session from user preferences
        if not active_session:
            try:
                from apps.accounts.models import UserPreference
                preference = request.user.preferences
                if preference.default_session and preference.default_session in user_sessions:
                    active_session = preference.default_session
            except UserPreference.DoesNotExist:
                pass
        
        # Priority 3: Fallback to latest created session
        if not active_session:
            active_session = user_sessions.order_by('-created_at').first()

        serializer = self.get_serializer(active_session)
        return Response({
            "active_session": serializer.data,
            "has_active_session": True,
            "auto_selected": active_session.last_selected is None
        })

    def list(self, request, *args, **kwargs):
        """
        Return an empty list instead of a 500 error
        if the JobSession table does not exist yet (e.g. migrations not applied).
        """
        try:
            return super().list(request, *args, **kwargs)
        except ProgrammingError:
            return Response([], status=status.HTTP_200_OK)

@method_decorator(csrf_exempt, name='dispatch')
class JobDescriptionCreateView(CreateAPIView):
    serializer_class = JobDescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_serializer_context(self):
        """Pass request to serializer for session validation."""
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def perform_create(self, serializer):
        # Always create jobs for the authenticated user
        serializer.save(created_by=self.request.user)
        
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

@method_decorator(csrf_exempt, name='dispatch')
class JobDescriptionDetailView(RetrieveDestroyAPIView):
    queryset = JobDescription.objects.all()
    serializer_class = JobDescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter jobs by authenticated user and optionally by session."""
        qs = self.queryset.filter(created_by=self.request.user)
        
        # If session_id is provided in query params, filter by it
        session_id = self.request.query_params.get('session_id')
        if session_id:
            try:
                job_session = JobSession.objects.get(id=session_id, created_by=self.request.user)
                # ✅ BACKWARDS COMPATIBILITY: Return:
                # 1. Jobs explicitly assigned to this session
                # 2. Jobs with NO session assigned (old jobs created before session feature)
                from django.db.models import Q
                qs = qs.filter(
                    Q(job_session=job_session) | 
                    Q(job_session__isnull=True)
                )
            except JobSession.DoesNotExist:
                return qs.none()
            
        return qs

@method_decorator(csrf_exempt, name='dispatch')
class JobDescriptionListView(ListAPIView):
    queryset = JobDescription.objects.all()
    serializer_class = JobDescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter jobs by user and optionally by session."""
        qs = self.queryset.filter(created_by=self.request.user)

        # Optional: filter by session_id if provided
        session_id = self.request.query_params.get('session_id')
        if session_id:
            try:
                # Verify the session belongs to the user FIRST - critical security check
                job_session = JobSession.objects.get(id=session_id, created_by=self.request.user)
                # ✅ BACKWARDS COMPATIBILITY: Return:
                # 1. Jobs explicitly assigned to this session
                # 2. Jobs with NO session assigned AND created_by this user
                from django.db.models import Q
                qs = qs.filter(
                    Q(job_session=job_session) | 
                    Q(job_session__isnull=True)
                )
            except JobSession.DoesNotExist:
                # ✅ Security: Return 403 Forbidden instead of silent failure
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("Invalid or unauthorized session")
        
        # When no session_id is provided, return ALL user's jobs (both sessioned and non-sessioned)
        return qs.order_by("-created_at")

@method_decorator(csrf_exempt, name='dispatch')
class JobDescriptionUpdateView(UpdateAPIView):
    queryset = JobDescription.objects.all()
    serializer_class = JobDescriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter jobs by authenticated user."""
        return self.queryset.filter(created_by=self.request.user)

def jd_match_view(request):
    """Legacy endpoint; returns JSON (no server-rendered templates)."""
    if request.method != "POST":
        return JsonResponse(
            {
                "detail": "HTML UI removed; POST a JD to get matches.",
                "required_fields": ["title", "description"],
                "optional_fields": ["count"],
            },
            status=405,
        )

    # Require authentication for this endpoint
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
        
    title = request.POST.get("title")
    description = request.POST.get("description")
    count = request.POST.get("count", 5)

    try:
        count = int(count)
    except (ValueError, TypeError):
        count = 5

    # 1. Save the JD to database with ownership
    jd = JobDescription.objects.create(title=title, description=description, created_by=request.user)

    # 2. Run semantic search for matches
    # Note: Semantic search returns similarity from 0 to 1, we multiply by 100 for display
    raw_matches = semantic_search_service.search_candidates(description, limit=count)

    # 3. Format matches for template
    matches = []
    for m in raw_matches:
        # Add a small scaling for display
        m['similarity_score'] = (m.get('similarity_score') or 0) * 100
        matches.append(m)

    return JsonResponse(
        {
            "title": title,
            "description": description,
            "count": count,
            "matches": matches,
        }
    )

class JDMatchAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        title = request.data.get("title")
        description = request.data.get("description")
        if not title or not description:
            return Response({"error": "Title and description are required"}, status=400)

        # Create cache key from title and description
        key_data = f"{title}:{description}".encode('utf-8')
        cache_key = hashlib.md5(key_data).hexdigest()

        # Check cache
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        # Create JD with ownership
        jd = JobDescription.objects.create(title=title, description=description, created_by=request.user)
        matches = list(semantic_search_service.search_candidates(description, limit=10))
        data = {
            "jd_id": jd.id,
            "matches": matches
        }
        # Cache for 1 hour
        cache.set(cache_key, data, 3600)
        return Response(data)
