from django.http import JsonResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from ..services.analytics import analytics_service
from ..services.recruiter_analytics import recruiter_analytics_service


class AnalyticsAPIView(APIView):
    """API endpoint for dashboard statistics and Power BI integration."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        stats = analytics_service.get_dashboard_stats()
        job_stats = analytics_service.get_job_analytics()
        stats["job_analytics"] = job_stats
        stats["job_count"] = job_stats.get("job_count", 0)
        return Response(stats)


def analytics_dashboard_view(request):
    """
    Legacy non-SSR endpoint.

    The backend no longer renders templates; React owns the UI.
    We keep this path for backward compatibility and return JSON.
    """

    stats = analytics_service.get_dashboard_stats()
    stats["job_analytics"] = analytics_service.get_job_analytics()
    stats["job_count"] = stats["job_analytics"].get("job_count", 0)
    return JsonResponse(stats)


class RecruiterOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(recruiter_analytics_service.get_overview_statistics())


class PipelineDistributionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(recruiter_analytics_service.get_pipeline_stage_distribution())


class CandidatesPerJobAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = request.GET.get("limit")
        if limit:
            try:
                limit = int(limit)
            except ValueError:
                limit = None
        return Response(recruiter_analytics_service.get_candidates_per_job(limit=limit))


class TopSkillsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        limit = request.GET.get("limit", 20)
        try:
            limit = int(limit)
        except ValueError:
            limit = 20
        return Response(recruiter_analytics_service.get_top_skills(limit=limit))


class ResumeSourceStatisticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(recruiter_analytics_service.get_resume_source_statistics())


class TimeSeriesAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        period = request.GET.get("period", "monthly")
        months = request.GET.get("months", 6)
        try:
            months = int(months)
        except ValueError:
            months = 6
        if period not in ["daily", "weekly", "monthly"]:
            period = "monthly"
        return Response(recruiter_analytics_service.get_time_series_data(period=period, months=months))


class RecruitmentFunnelAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(recruiter_analytics_service.get_recruitment_funnel())


class ComprehensiveAnalyticsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(recruiter_analytics_service.get_comprehensive_analytics())

