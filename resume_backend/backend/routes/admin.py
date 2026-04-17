from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.accounts.permissions import IsAdmin
from apps.candidates.services.analytics import analytics_service

class AdminMetricsAPIView(APIView):
    """
    API endpoint to return system-wide metrics for the Admin Dashboard.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def get(self, request):
        stats = analytics_service.get_dashboard_stats()
        
        metrics = {
            "users": stats.get("total_users", 0),
            "resumes": stats.get("total_resumes", 0),
            "candidates": stats.get("total_candidates", 0),
            "sessions": stats.get("total_sessions", 0),
            "top_skills": stats.get("top_skills", []),
            "new_candidates_30d": stats.get("new_candidates_30d", 0),
            "monthly_growth": stats.get("monthly_growth", []),
            "resume_sources": stats.get("resume_sources", []),
        }
        
        return Response(metrics)
