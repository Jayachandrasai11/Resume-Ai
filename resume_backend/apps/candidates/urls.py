from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create a router for ViewSets
router = DefaultRouter()
router.register(r'candidates', views.CandidateViewSet)
router.register(r'resumes', views.ResumeViewSet)
router.register(r'chunks', views.ResumeChunkViewSet, basename='resumechunk')

urlpatterns = [
    # Candidate specific endpoints (Place these before router to avoid being captured)
    path("api/candidates/search/", views.CandidateSearchAPIView.as_view(), name="candidate-search-api"),
    path("api/candidates/chat/", views.ResumeChatRAGAPIView.as_view(), name="resume-chat-rag"),
    path("api/candidates/interview-questions/", views.InterviewQuestionsAPIView.as_view(), name="interview-questions"),
    path("api/candidates/similarity-check/", views.SimilarityCheckAPIView.as_view(), name="similarity-check"),
    path("api/candidates/similarity-statistics/", views.SimilarityStatisticsAPIView.as_view(), name="similarity-statistics"),
    path("api/candidates/mark-duplicates/", views.MarkDuplicateAPIView.as_view(), name="mark-duplicates"),
    path("api/candidates/<int:candidate_id>/summary/", views.CandidateSummaryAPIView.as_view(), name="candidate-summary"),
    path("api/candidates/<int:candidate_id>/skills/", views.CandidateSkillAPIView.as_view(), name="candidate-skills"),
    path("api/candidates/<int:candidate_id>/similar/", views.FindSimilarCandidatesAPIView.as_view(), name="find-similar"),

    # API endpoints
    path("api/parse-resume/", views.parse_resume_view, name="parse_resume"),
    path("api/upload-resume/", views.ResumeUploadAPIView.as_view(), name="upload-resume"),
    
    # Chunking endpoints
    path("api/chunk-resume/", views.ResumeChunkAPIView.as_view(), name="chunk-resume"),
    
    # Scanning/Ingestion
    path("api/scan-emails/", views.EmailIngestionAPIView.as_view(), name="scan-emails"),
    
    # Export endpoints
    path("candidates/export-csv/", views.ExportCandidatesCSVAPIView.as_view(), name="export-candidates-csv"),
    path("candidates/export/", views.ExportCandidatesCSVAPIView.as_view(), name="export-candidates"),
    
    # Analytics endpoints
    path("api/analytics/", views.AnalyticsAPIView.as_view(), name="analytics-api"),
    
    # Recruiter Analytics endpoints
    path("api/recruiter/analytics/overview/", views.RecruiterOverviewAPIView.as_view(), name="recruiter-analytics-overview"),
    path(
        "api/recruiter/analytics/pipeline-distribution/",
        views.PipelineDistributionAPIView.as_view(),
        name="recruiter-analytics-pipeline-distribution",
    ),
    path(
        "api/recruiter/analytics/candidates-per-job/",
        views.CandidatesPerJobAPIView.as_view(),
        name="recruiter-analytics-candidates-per-job",
    ),
    path("api/recruiter/analytics/top-skills/", views.TopSkillsAPIView.as_view(), name="recruiter-analytics-top-skills"),
    path(
        "api/recruiter/analytics/resume-sources/",
        views.ResumeSourceStatisticsAPIView.as_view(),
        name="recruiter-analytics-resume-sources",
    ),
    path("api/recruiter/analytics/time-series/", views.TimeSeriesAPIView.as_view(), name="recruiter-analytics-time-series"),
    path(
        "api/recruiter/analytics/recruitment-funnel/",
        views.RecruitmentFunnelAPIView.as_view(),
        name="recruiter-analytics-recruitment-funnel",
    ),
    path(
        "api/recruiter/analytics/comprehensive/",
        views.ComprehensiveAnalyticsAPIView.as_view(),
        name="recruiter-analytics-comprehensive",
    ),
    
    # Interview questions endpoint (Generic)
    path("api/interview-questions/", views.GenericInterviewQuestionsAPIView.as_view(), name="generic-interview-questions"),
    
    # Router endpoints (Keep LAST to allow explicit routes above to match first)
    path("api/", include(router.urls)),
    
    # Resume bulk delete endpoint
    path("api/resumes/bulk-delete/", views.ResumeBulkDeleteAPIView.as_view(), name="resume-bulk-delete"),
    
    # HTML forms
    path("candidates/", views.candidate_list_view, name="candidate_list"),
    path("candidates/<int:candidate_id>/", views.candidate_detail_view, name="candidate_detail"),
    path("upload/", views.upload_form, name="upload_form"),
    path("upload/submit/", views.upload_resume_submit, name="upload_resume_submit"),
    path("parse/", views.parse_resume_form, name="parse_resume_form"),
    path("candidate-form/", views.candidate_form, name="candidate_form"),
]
