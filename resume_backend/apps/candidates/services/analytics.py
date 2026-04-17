from django.contrib.auth import get_user_model
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta
from ..models import Candidate, Resume, Skill
from apps.jd_app.models import JobDescription, JobSession

User = get_user_model()

class AnalyticsService:
    @staticmethod
    def get_dashboard_stats():
        """Returns aggregated stats for the recruiter dashboard."""
        now = timezone.now()
        last_30_days = now - timedelta(days=30)

        # 1. Total Counts
        stats = {
            "total_users": User.objects.count(),
            "total_candidates": Candidate.objects.count(),
            "candidate_count": Candidate.objects.count(), # Frontend compatibility
            "total_resumes": Resume.objects.count(),
            "total_skills": Skill.objects.count(),
            "total_sessions": JobSession.objects.count(),
            "new_candidates_30d": Candidate.objects.filter(resumes__uploaded_at__gte=last_30_days).distinct().count(),
        }

        # 2. Top Skills (Top 10)
        top_skills_list = list(
            Skill.objects.annotate(candidate_count=Count('candidates'))
            .order_by('-candidate_count')[:10]
            .values('name', 'candidate_count')
        )
        stats["top_skills"] = top_skills_list
        # Frontend compatibility: convert list of dicts to a dict
        stats["skill_stats"] = {item['name']: item['candidate_count'] for item in top_skills_list}

        # 3. Resume Source Statistics
        stats["resume_sources"] = list(
            Resume.objects.values('source')
            .annotate(count=Count('id'))
            .order_by('-count')
        )

        # 4. Monthly Trend (Last 6 months)
        # Simplified trend logic for dashboard
        stats["monthly_growth"] = []
        for i in range(6):
            month_start = (now - timedelta(days=30*i)).replace(day=1, hour=0, minute=0, second=0)
            month_end = (month_start + timedelta(days=32)).replace(day=1)
            count = Candidate.objects.filter(resumes__uploaded_at__gte=month_start, resumes__uploaded_at__lt=month_end).distinct().count()
            stats["monthly_growth"].append({
                "month": month_start.strftime("%b %Y"),
                "count": count
            })
        stats["monthly_growth"].reverse()

        return stats

    @staticmethod
    def get_job_analytics():
        """Returns candidates per job description stats."""
        total_jobs = JobDescription.objects.count()
        # This assumes we want to see how many candidates have been 'matched' or 'viewed' for a JD
        # For now, we'll return the total JDs and a placeholder for match activity
        return {
            "total_jobs": total_jobs,
            "job_count": total_jobs, # Frontend compatibility
            "jobs_with_matches": JobDescription.objects.annotate(match_count=Count('id')).count(), # Placeholder
        }

analytics_service = AnalyticsService()
