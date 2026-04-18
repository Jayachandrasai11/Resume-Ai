from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from django.views.static import serve
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from apps.candidates.views import (
    CandidateViewSet,
    ResumeViewSet,
    ResumeUploadAPIView,
    ResumeParseAPIView,
    CandidateSummaryAPIView,
    CandidateSkillAPIView,
    EmailIngestionAPIView,
    upload_form,
    upload_resume_submit,
    parse_resume_form,
    candidate_form,
    analytics_dashboard_view,
)
from apps.ranking.views import (
    RankingView,
    SemanticSearchView,
    search_view,
    MatchCandidatesView,
    MatchByJobIdView,
    JobMatchesView,
    MatchStatisticsView,
    BatchMatchView,
    CompareCandidatesView,
    GetStrategiesView,
    AddToFunnelView,
    FunnelView,
)
from backend.routes.admin import AdminMetricsAPIView
from backend.routes.users import UserListAPIView, UserDetailAPIView
from backend.jobs.views import JobCandidateStatusUpdateAPIView
from backend.chat.views import ChatAPIView
from backend.export.views import ExportCandidatesCSVAPIView
from dashboard.views import HiringTrendsNewAPIView, MatchDistributionAPIView
from django.conf import settings
from django.conf.urls.static import static

# Root API info view
def api_root(request):
    """
    API root endpoint providing information about available endpoints
    """
    return JsonResponse({
        "message": "Resume Recruiter API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "candidates": "/api/candidates/",
            "resumes": "/api/resumes/",
            "jobs": "/api/jd/",
            "ranking": "/api/ranking/",
            "semantic_search": "/api/semantic-search/",
            "authentication": "/api/auth/",
            "admin": "/admin/",
            "docs": "/api/docs/" if settings.DEBUG else None
        },
        "frontend": "http://localhost:5173" if settings.DEBUG else None
    })

# Favicon handler
def favicon(request):
    """
    Handle favicon requests
    """
    return JsonResponse({"favicon": "not_found"}, status=404)

urlpatterns = [
    # 🏛️ SYSTEM ADMIN & INFRASTRUCTURE
    path("admin/", admin.site.urls),
    path("favicon.ico", favicon, name="favicon"),
    path("api/root", api_root, name="api-root"),

    # 🦾 CORE SERVICES (Already prefixed with api/ in their respective urls.py)
    path("", include("apps.jd_app.urls")),
    path("", include("apps.candidates.urls")),
    path("", include("apps.pipeline.urls")),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/dashboard/", include("dashboard.urls")),

    # 🧪 INDEPENDENT ENDPOINTS
    path("api/ranking/", RankingView.as_view()),
    path("api/ranking/match/", MatchCandidatesView.as_view(), name="ranking-match"),
    path("api/ranking/match-by-job/", MatchByJobIdView.as_view(), name="match-by-job"),
    path("api/ranking/match-statistics/", MatchStatisticsView.as_view(), name="match-statistics"),
    path("api/ranking/batch-match/", BatchMatchView.as_view(), name="batch-match"),
    path("api/ranking/compare-candidates/", CompareCandidatesView.as_view(), name="compare-candidates"),
    path("api/ranking/strategies/", GetStrategiesView.as_view(), name="ranking-strategies"),
    
    path("api/jobs/<int:job_id>/match/", MatchByJobIdView.as_view(), name="job-match"),
    path("api/jobs/<int:job_id>/matches/", JobMatchesView.as_view(), name="job-matches"),
    path("api/jobs/<int:job_id>/funnel/add/", AddToFunnelView.as_view(), name="add-to-funnel"),
    path("api/jobs/<int:job_id>/funnel/", FunnelView.as_view(), name="funnel-data"),
    
    path("api/semantic-search/", SemanticSearchView.as_view(), name="semantic-search"),
    path("api/chat", ChatAPIView.as_view(), name="chat"),
    path("api/export/candidates", ExportCandidatesCSVAPIView.as_view(), name="export-candidates"),

    # 🎨 FRONTEND HANDLERS (Must be last)
    re_path(r'^(?P<path>(assets|favicon\.svg|icons\.svg).*)$', serve, {"document_root": settings.BASE_DIR.parent / "resume_frontend" / "dist"}),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static("/", document_root=settings.BASE_DIR.parent / "resume_frontend" / "dist")

# Catch-all to serve React frontend for any other routes (Must NOT match /api/)
urlpatterns += [
    re_path(r'^$', TemplateView.as_view(template_name="index.html")),
    re_path(r'^(?!api/).*$', TemplateView.as_view(template_name="index.html")),
]
