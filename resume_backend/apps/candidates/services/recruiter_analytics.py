"""
Comprehensive Recruiter Analytics Service
Provides high-level recruitment statistics and insights for dashboards.
"""

from django.db.models import Count, Q, Sum, Avg, Max, Min
from django.utils import timezone
from datetime import timedelta, datetime
from django.db.models.functions import TruncMonth, TruncDay, TruncWeek
from django.db.utils import ProgrammingError, OperationalError

from ..models import Candidate, Resume, Skill
from apps.jd_app.models import JobDescription
from apps.pipeline.models import CandidatePipeline, PipelineStage


class RecruiterAnalyticsService:
    """
    Service class for generating comprehensive recruiter analytics.
    Provides statistics for dashboard visualization and recruitment insights.
    """

    def __init__(self):
        self.now = timezone.now()

    def get_overview_statistics(self) -> dict:
        """
        Get high-level overview statistics for the dashboard.
        
        Returns:
            dict: Overview statistics including total candidates, resumes, jobs, etc.
        """
        last_30_days = self.now - timedelta(days=30)
        last_7_days = self.now - timedelta(days=7)
        
        stats = {
            # Core Counts
            "total_candidates": Candidate.objects.count(),
            "total_resumes": Resume.objects.count(),
            "total_jobs": JobDescription.objects.count(),
            "total_pipelines": CandidatePipeline.objects.count(),
            "total_skills": Skill.objects.count(),
            
            # Recent Activity (Last 30 days)
            "new_candidates_30d": Candidate.objects.filter(
                resumes__uploaded_at__gte=last_30_days
            ).distinct().count(),
            "new_resumes_30d": Resume.objects.filter(
                uploaded_at__gte=last_30_days
            ).count(),
            "new_jobs_30d": JobDescription.objects.filter(
                created_at__gte=last_30_days
            ).count(),
            
            # Recent Activity (Last 7 days)
            "new_candidates_7d": Candidate.objects.filter(
                resumes__uploaded_at__gte=last_7_days
            ).distinct().count(),
            "new_resumes_7d": Resume.objects.filter(
                uploaded_at__gte=last_7_days
            ).count(),
            
            # Pipeline Metrics
            "active_pipelines": CandidatePipeline.objects.exclude(
                current_stage=PipelineStage.REJECTED
            ).count(),
            "rejected_candidates": CandidatePipeline.objects.filter(
                current_stage=PipelineStage.REJECTED
            ).count(),
            "offered_candidates": CandidatePipeline.objects.filter(
                current_stage=PipelineStage.OFFER
            ).count(),
        }
        
        return stats

    def get_pipeline_stage_distribution(self) -> dict:
        """
        Get distribution of candidates across pipeline stages.
        
        Returns:
            dict: Pipeline stage distribution with counts and percentages
        """
        # Get counts for each stage
        stage_counts = list(
            CandidatePipeline.objects.values('current_stage')
            .annotate(count=Count('id'))
            .order_by('current_stage')
        )
        
        total_pipelines = sum(item['count'] for item in stage_counts)
        
        # Build distribution with percentages
        distribution = []
        for stage_info in stage_counts:
            stage_code = stage_info['current_stage']
            count = stage_info['count']
            percentage = (count / total_pipelines * 100) if total_pipelines > 0 else 0
            
            distribution.append({
                'stage': stage_code,
                'stage_display': dict(PipelineStage.choices).get(stage_code, stage_code),
                'count': count,
                'percentage': round(percentage, 2)
            })
        
        return {
            'total_pipelines': total_pipelines,
            'distribution': distribution,
            'summary': {
                'active': sum(d['count'] for d in distribution 
                             if d['stage'] != PipelineStage.REJECTED),
                'rejected': next((d['count'] for d in distribution 
                                if d['stage'] == PipelineStage.REJECTED), 0),
                'conversion_rate': round(
                    (next((d['count'] for d in distribution 
                          if d['stage'] == PipelineStage.OFFER), 0) / total_pipelines * 100),
                    2
                ) if total_pipelines > 0 else 0
            }
        }

    def get_candidates_per_job(self, limit: int = None) -> dict:
        """
        Get number of candidates associated with each job description.
        
        Args:
            limit: Maximum number of jobs to return (default: all)
        
        Returns:
            dict: Candidates per job with job details and pipeline counts
        """
        jobs_data = JobDescription.objects.annotate(
            pipeline_count=Count('pipelines'),
            active_candidates=Count(
                'pipelines',
                filter=Q(pipelines__current_stage=PipelineStage.APPLIED) |
                       Q(pipelines__current_stage=PipelineStage.SCREENING) |
                       Q(pipelines__current_stage=PipelineStage.TECHNICAL_INTERVIEW) |
                       Q(pipelines__current_stage=PipelineStage.HR_INTERVIEW)
            ),
            offered_count=Count(
                'pipelines',
                filter=Q(pipelines__current_stage=PipelineStage.OFFER)
            ),
            rejected_count=Count(
                'pipelines',
                filter=Q(pipelines__current_stage=PipelineStage.REJECTED)
            )
        ).order_by('-pipeline_count')
        
        if limit:
            jobs_data = jobs_data[:limit]
        
        job_list = []
        for job in jobs_data:
            job_list.append({
                'job_id': job.id,
                'title': job.title,
                'location': job.location,
                'employment_type': job.employment_type,
                'total_candidates': job.pipeline_count,
                'active_candidates': job.active_candidates,
                'offered': job.offered_count,
                'rejected': job.rejected_count,
                'created_at': job.created_at.isoformat() if job.created_at else None,
                'is_analyzed': job.is_analyzed()
            })
        
        return {
            'total_jobs': JobDescription.objects.count(),
            'jobs_with_candidates': len([j for j in job_list if j['total_candidates'] > 0]),
            'jobs': job_list
        }

    def get_top_skills(self, limit: int = 20) -> dict:
        """
        Get top skills across all candidates.
        
        Args:
            limit: Maximum number of skills to return (default: 20)
        
        Returns:
            dict: Top skills with candidate counts and percentages
        """
        total_candidates = Candidate.objects.count()
        
        # Get top skills from M2M relationship
        top_skills = list(
            Skill.objects.annotate(candidate_count=Count('candidates'))
            .filter(candidate_count__gt=0)
            .order_by('-candidate_count')[:limit]
        )
        
        skills_list = []
        for skill in top_skills:
            percentage = (skill.candidate_count / total_candidates * 100) if total_candidates > 0 else 0
            skills_list.append({
                'skill_id': skill.id,
                'name': skill.name,
                'candidate_count': skill.candidate_count,
                'percentage': round(percentage, 2)
            })
        
        return {
            'total_candidates': total_candidates,
            'total_unique_skills': Skill.objects.filter(candidates__isnull=False).distinct().count(),
            'top_skills': skills_list
        }

    def get_resume_source_statistics(self) -> dict:
        """
        Get statistics about resume sources (upload, email, API).
        
        Returns:
            dict: Resume source distribution with counts and percentages
        """
        total_resumes = Resume.objects.count()
        
        source_stats = list(
            Resume.objects.values('source')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        
        sources = []
        for stat in source_stats:
            percentage = (stat['count'] / total_resumes * 100) if total_resumes > 0 else 0
            sources.append({
                'source': stat['source'],
                'source_display': dict(Resume.SOURCE_CHOICES).get(
                    stat['source'], stat['source']
                ),
                'count': stat['count'],
                'percentage': round(percentage, 2)
            })
        
        return {
            'total_resumes': total_resumes,
            'sources': sources
        }

    def get_time_series_data(self, period: str = 'monthly', months: int = 6) -> dict:
        """
        Get time series data for candidates and resumes.
        
        Args:
            period: 'daily', 'weekly', or 'monthly'
            months: Number of months to include (for weekly/monthly)
        
        Returns:
            dict: Time series data with dates and counts
        """
        start_date = self.now - timedelta(days=30 * months)
        
        # Choose truncation function based on period
        trunc_func = {
            'daily': TruncDay,
            'weekly': TruncWeek,
            'monthly': TruncMonth
        }.get(period, TruncMonth)
        
        # Get candidate time series
        candidates_data = list(
            Resume.objects.annotate(
                period=trunc_func('uploaded_at')
            ).filter(
                uploaded_at__gte=start_date
            ).values('period')
            .annotate(
                candidate_count=Count('candidate', distinct=True),
                resume_count=Count('id')
            )
            .order_by('period')
        )
        
        # Format the data
        time_series = []
        for item in candidates_data:
            time_series.append({
                'period': item['period'].strftime('%Y-%m-%d'),
                'candidates': item['candidate_count'],
                'resumes': item['resume_count']
            })
        
        return {
            'period': period,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': self.now.strftime('%Y-%m-%d'),
            'data': time_series
        }

    def get_recruitment_funnel(self) -> dict:
        """
        Get recruitment funnel metrics showing conversion between stages.
        
        Returns:
            dict: Funnel metrics with stage-wise counts and conversion rates
        """
        # Get counts for each stage in order
        stage_order = [
            PipelineStage.APPLIED,
            PipelineStage.SCREENING,
            PipelineStage.TECHNICAL_INTERVIEW,
            PipelineStage.HR_INTERVIEW,
            PipelineStage.OFFER,
            PipelineStage.REJECTED
        ]
        
        funnel_data = []
        previous_count = None
        
        for stage in stage_order:
            count = CandidatePipeline.objects.filter(current_stage=stage).count()
            
            # Calculate conversion rate from previous stage
            conversion_rate = None
            if previous_count is not None and previous_count > 0:
                conversion_rate = round((count / previous_count) * 100, 2)
            
            funnel_data.append({
                'stage': stage,
                'stage_display': dict(PipelineStage.choices).get(stage, stage),
                'count': count,
                'conversion_rate': conversion_rate
            })
            
            previous_count = count
        
        return {
            'funnel': funnel_data,
            'total_applications': CandidatePipeline.objects.count(),
            'overall_conversion_rate': round(
                (CandidatePipeline.objects.filter(current_stage=PipelineStage.OFFER).count() /
                 CandidatePipeline.objects.count() * 100),
                2
            ) if CandidatePipeline.objects.count() > 0 else 0
        }

    def get_comprehensive_analytics(self) -> dict:
        """
        Get all analytics data in a single comprehensive response.
        Suitable for dashboard initialization.
        
        Returns:
            dict: All analytics data combined
        """
        def safe(section_name: str, fn, fallback):
            try:
                return fn()
            except (ProgrammingError, OperationalError) as exc:
                # DB schema drift is common in this project; don't take down the whole dashboard.
                return {
                    "error": f"{section_name} unavailable",
                    "detail": str(exc),
                    "data": fallback,
                }

        return {
            'overview': safe("overview", self.get_overview_statistics, {}),
            'pipeline_distribution': safe("pipeline_distribution", self.get_pipeline_stage_distribution, {"total_pipelines": 0, "distribution": [], "summary": {}}),
            'candidates_per_job': safe("candidates_per_job", self.get_candidates_per_job, {"total_jobs": 0, "jobs_with_candidates": 0, "jobs": []}),
            'top_skills': safe("top_skills", self.get_top_skills, {"total_candidates": 0, "total_unique_skills": 0, "top_skills": []}),
            'resume_sources': safe("resume_sources", self.get_resume_source_statistics, {"total_resumes": 0, "sources": []}),
            'time_series': safe("time_series", self.get_time_series_data, {"period": "monthly", "start_date": None, "end_date": None, "data": []}),
            'recruitment_funnel': safe("recruitment_funnel", self.get_recruitment_funnel, {"funnel": [], "total_applications": 0, "overall_conversion_rate": 0}),
            'generated_at': self.now.isoformat()
        }


# Singleton instance
recruiter_analytics_service = RecruiterAnalyticsService()