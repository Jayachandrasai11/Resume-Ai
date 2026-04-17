from django.urls import path
from .views import (
    DashboardSummaryAPIView,
    RecruitmentFunnelAPIView,
    SkillIntelligenceAPIView,
    HiringTrendsAPIView,
    MatchingAnalyticsAPIView,
    HiringTrendsNewAPIView,
    MatchDistributionAPIView,
    SkillGapAnalysisAPIView,
    TopMissingSkillsAPIView,
    SkillRecommendationsAPIView,
)

urlpatterns = [
    path("summary/", DashboardSummaryAPIView.as_view(), name="dashboard_summary"),
    path("funnel/", RecruitmentFunnelAPIView.as_view(), name="recruitment_funnel"),
    path("skills/", SkillIntelligenceAPIView.as_view(), name="skill_intelligence"),
    path("trends/", HiringTrendsAPIView.as_view(), name="hiring_trends"),
    path("matching/", MatchingAnalyticsAPIView.as_view(), name="matching_analytics"),
    # New Analytics APIs for dashboard charts
    path("hiring-trends/", HiringTrendsNewAPIView.as_view(), name="hiring_trends_new"),
    path("match-distribution/", MatchDistributionAPIView.as_view(), name="match_distribution"),
    # Skill Gap Analysis APIs
    path("skill-gap/<int:job_id>/", SkillGapAnalysisAPIView.as_view(), name="skill_gap_analysis"),
    path("missing-skills/", TopMissingSkillsAPIView.as_view(), name="top_missing_skills"),
    path("skill-recommendations/", SkillRecommendationsAPIView.as_view(), name="skill_recommendations"),
]
