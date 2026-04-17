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

router = DefaultRouter()
router.register(r"candidates", CandidateViewSet)
router.register(r"resumes", ResumeViewSet)

urlpatterns = [
    path("", TemplateView.as_view(template_name="index.html"), name="landing"),
    path("api/root", api_root, name="api-root"),
    path("favicon.ico", favicon, name="favicon"),
    path("admin/", admin.site.urls),
    path('api/dashboard/', include('dashboard.urls')),
    # Analytics API endpoints
    path('api/analytics/hiring-trends', HiringTrendsNewAPIView.as_view(), name='analytics_hiring_trends'),
    path('api/analytics/match-distribution', MatchDistributionAPIView.as_view(), name='analytics_match_distribution'),
    path("api/admin/metrics", AdminMetricsAPIView.as_view(), name="admin-metrics"),
    path("api/users", UserListAPIView.as_view(), name="user-list"),
    path("api/users/<int:pk>", UserDetailAPIView.as_view(), name="user-detail"),
    path("api/upload-resume/", ResumeUploadAPIView.as_view(), name="upload-resume"),
    path("api/parse-resume/", ResumeParseAPIView.as_view(), name="parse-resume"),
    path("api/candidate-summary/<int:candidate_id>/", CandidateSummaryAPIView.as_view(), name="candidate-summary"),
    path("api/candidate-skills/<int:candidate_id>/", CandidateSkillAPIView.as_view(), name="candidate-skills"),
    path("api/auth/", include("apps.accounts.urls")),
    path("api/ranking/", RankingView.as_view()),
    path("api/ranking/match/", MatchCandidatesView.as_view(), name="ranking-match"),
    path("api/ranking/match-by-job/", MatchByJobIdView.as_view(), name="match-by-job"),
    # Jobs API (as per task requirements)
    path("api/jobs/", include("apps.jd_app.urls")),
    path("api/jobs/<int:job_id>/match/", MatchByJobIdView.as_view(), name="job-match"),
    path("api/jobs/<int:job_id>/matches/", JobMatchesView.as_view(), name="job-matches"),
    path("api/match-candidates", MatchByJobIdView.as_view(), name="match-candidates"),
    path("api/ranking/match-statistics/", MatchStatisticsView.as_view(), name="match-statistics"),
    path("api/ranking/batch-match/", BatchMatchView.as_view(), name="batch-match"),
    path("api/ranking/compare-candidates/", CompareCandidatesView.as_view(), name="compare-candidates"),
    path("api/ranking/strategies/", GetStrategiesView.as_view(), name="ranking-strategies"),
    path("api/jobs/<int:job_id>/funnel/add/", AddToFunnelView.as_view(), name="add-to-funnel"),
    path("api/jobs/<int:job_id>/funnel/", FunnelView.as_view(), name="funnel-data"),
    path("api/funnel/<int:funnel_id>/update-stage/", FunnelView.as_view(), name="update-funnel-stage"),
    path("api/funnel/<int:funnel_id>/delete/", FunnelView.as_view(), name="delete-funnel-entry"),
    path("api/semantic-search/", SemanticSearchView.as_view(), name="semantic-search"),
    path("api/rag/search/", SemanticSearchView.as_view(), name="rag-search"),
    path(
        "api/job-candidate/update-status",
        JobCandidateStatusUpdateAPIView.as_view(),
        name="job-candidate-update-status",
    ),
    path("api/chat", ChatAPIView.as_view(), name="chat"),
    path("api/export/candidates", ExportCandidatesCSVAPIView.as_view(), name="export-candidates"),

    path("api/pipeline/", include("apps.pipeline.urls")),
    path("api/scan-emails/", EmailIngestionAPIView.as_view(), name="scan-emails-api"),
    path("analytics/", analytics_dashboard_view, name="analytics_dashboard"),

    # HTML forms
    path("search/", search_view, name="search_view"),
    path("upload/", upload_form, name="upload_form"),
    path("upload-resume/", upload_resume_submit, name="upload_resume_submit"),
    path("parse-form/", parse_resume_form, name="parse_resume_form"),
    path("candidate-form/", candidate_form, name="candidate_form"),

    # Keep catch-all includes LAST so they don't shadow explicit routes above.
    path("", include("apps.candidates.urls")),

    # Serve React static assets
    re_path(r'^(?P<path>(assets|favicon\.svg|icons\.svg).*)$', serve, {"document_root": settings.BASE_DIR.parent / "resume_frontend" / "dist"}),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
urlpatterns += static("/", document_root=settings.BASE_DIR.parent / "resume_frontend" / "dist")

# Catch-all to serve React frontend for any other routes (must be last)
urlpatterns += [
    re_path(r'^.*$', TemplateView.as_view(template_name="index.html")),
]
