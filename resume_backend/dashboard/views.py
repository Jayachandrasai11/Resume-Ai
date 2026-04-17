from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from django.db.models import Count, Q, Avg
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth  # For date truncation
import logging
from datetime import timedelta
from django.utils import timezone

logger = logging.getLogger(__name__)

from apps.candidates.models import Candidate, Resume
from apps.jd_app.models import JobDescription, JobSession
from apps.ranking.models import JobCandidate, RecruitmentFunnel
# from apps.ranking.models import CandidateRank


class DashboardSummaryAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        session_id = request.query_params.get('session_id')
        if session_id in ['null', 'undefined', 'None', '']:
            session_id = None
        
        # Filter by user for multi-tenant data isolation
        if session_id:
            user_job_sessions = JobSession.objects.filter(id=session_id, created_by=user).values_list('id', flat=True)
            user_uploaded_resumes = Resume.objects.filter(job_session_id=session_id, uploaded_by=user).values_list('candidate_id', flat=True).distinct()
        else:
            user_job_sessions = JobSession.objects.filter(created_by=user).values_list('id', flat=True)
            user_uploaded_resumes = Resume.objects.filter(uploaded_by=user).values_list('candidate_id', flat=True).distinct()
        
        if session_id:
            total_candidates = Candidate.objects.filter(
                Q(resumes__job_session__in=user_job_sessions) |
                Q(id__in=user_uploaded_resumes)
            ).distinct().count()
        else:
            total_candidates = Candidate.objects.filter(
                Q(resumes__job_session__in=user_job_sessions) |
                Q(created_by=user) |
                Q(id__in=user_uploaded_resumes)
            ).distinct().count()
        
        # Always show global open roles for the user, regardless of session selected
        total_jobs = JobDescription.objects.filter(created_by=user).count()

        # Shortlisted candidates - count from RecruitmentFunnel for consistency with funnel chart
        # Use the user's funnel entries to count shortlisted candidates
        shortlisted_candidates = RecruitmentFunnel.objects.filter(
            created_by=user,
            stage='shortlisted'
        ).values('candidate').distinct().count()
        
        hired_candidates = RecruitmentFunnel.objects.filter(
            created_by=user,
            stage='hired'
        ).values('candidate').distinct().count()
        
        # Calculate average match score from JobCandidate model
        # Filter by user to get their matches (candidates they uploaded or jobs they created)
        user_job_sessions = JobSession.objects.filter(created_by=user).values_list('id', flat=True)
        user_uploaded_resumes = Resume.objects.filter(uploaded_by=user).values_list('candidate_id', flat=True).distinct()
        
        # Get candidates that belong to this user (via session or upload)
        if session_id:
            user_candidate_ids = list(Candidate.objects.filter(
                Q(resumes__job_session__in=user_job_sessions) |
                Q(id__in=user_uploaded_resumes)
            ).values_list('id', flat=True).distinct())
        else:
            user_candidate_ids = list(Candidate.objects.filter(
                Q(resumes__job_session__in=user_job_sessions) |
                Q(created_by=user) |
                Q(id__in=user_uploaded_resumes)
            ).values_list('id', flat=True).distinct())
        
        if user_candidate_ids:
            # Get JobCandidate records for these candidates
            job_candidates = JobCandidate.objects.filter(candidate_id__in=user_candidate_ids)
                
            if job_candidates.exists():
                avg_score = job_candidates.aggregate(avg=Avg('match_score'))['avg']
                average_match_score = float(avg_score) if avg_score else 0.0
            else:
                average_match_score = 0.0
        else:
            average_match_score = 0.0

        # Compute trend data
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        two_weeks_ago = now - timedelta(days=14)
        month_ago = now - timedelta(days=30)
        two_months_ago = now - timedelta(days=60)

        # --- Candidates trend: this week vs last week (percentage change) ---
        if session_id:
            trend_q = Q(resumes__job_session__in=user_job_sessions) | Q(id__in=user_uploaded_resumes)
        else:
            trend_q = Q(resumes__job_session__in=user_job_sessions) | Q(created_by=user) | Q(id__in=user_uploaded_resumes)
            
        candidates_this_week = Candidate.objects.filter(
            trend_q,
            created_at__gte=week_ago
        ).distinct().count()
        
        candidates_last_week = Candidate.objects.filter(
            trend_q,
            created_at__gte=two_weeks_ago,
            created_at__lt=week_ago
        ).distinct().count()
        if candidates_last_week > 0:
            candidates_pct = ((candidates_this_week - candidates_last_week) / candidates_last_week) * 100
            candidates_dir = 'up' if candidates_pct >= 0 else 'down'
            candidates_trend = f"{'+' if candidates_pct >= 0 else ''}{candidates_pct:.0f}% this week"
        else:
            # No previous week activity
            if candidates_this_week > 0:
                candidates_trend = "+New"
                candidates_dir = 'up'
            else:
                candidates_trend = "No change"
                candidates_dir = 'neutral'

        # --- Jobs trend: new jobs this week (absolute count) ---
        jobs_this_week = JobDescription.objects.filter(
            created_by=user,
            created_at__gte=week_ago
        ).count()
        jobs_last_week = JobDescription.objects.filter(
            created_by=user,
            created_at__gte=two_weeks_ago,
            created_at__lt=week_ago
        ).count()
        jobs_change = jobs_this_week - jobs_last_week
        jobs_dir = 'up' if jobs_change > 0 else 'down' if jobs_change < 0 else 'neutral'
        if jobs_change > 0:
            jobs_trend = f"+{jobs_change} active postings"
        elif jobs_change < 0:
            jobs_trend = f"{jobs_change} postings"
        else:
            jobs_trend = "No change this week"

        # --- Shortlisted trend: new shortlisted this week (absolute count) ---
        shortlisted_this_week = RecruitmentFunnel.objects.filter(
            created_by=user,
            stage='shortlisted',
            updated_at__gte=week_ago
        ).count()
        shortlisted_last_week = RecruitmentFunnel.objects.filter(
            created_by=user,
            stage='shortlisted',
            updated_at__gte=two_weeks_ago,
            updated_at__lt=week_ago
        ).count()
        shortlisted_change = shortlisted_this_week - shortlisted_last_week
        shortlisted_dir = 'up' if shortlisted_change > 0 else 'down' if shortlisted_change < 0 else 'neutral'
        if shortlisted_change > 0:
            shortlisted_trend = f"+{shortlisted_change} this week"
        elif shortlisted_change < 0:
            shortlisted_trend = f"{shortlisted_change} this week"
        else:
            shortlisted_trend = "No change"

        # --- Avg Match Score trend: this month vs last month (percentage change) ---
        # Get average match score for this month (last 30 days)
        match_this_month_qs = JobCandidate.objects.filter(
            candidate_id__in=user_candidate_ids,
            created_at__gte=month_ago
        ).aggregate(avg=Avg('match_score'))
        match_this_month_avg = match_this_month_qs['avg'] or 0.0

        # Get average match score for last month (previous 30 days)
        match_last_month_qs = JobCandidate.objects.filter(
            candidate_id__in=user_candidate_ids,
            created_at__gte=two_months_ago,
            created_at__lt=month_ago
        ).aggregate(avg=Avg('match_score'))
        match_last_month_avg = match_last_month_qs['avg'] or 0.0

        if match_last_month_avg and match_last_month_avg > 0:
            match_pct_change = ((match_this_month_avg - match_last_month_avg) / match_last_month_avg) * 100
            match_dir = 'up' if match_pct_change >= 0 else 'down'
            match_trend = f"{'+' if match_pct_change >= 0 else ''}{match_pct_change:.1f}% vs last month"
        else:
            if match_this_month_avg > 0:
                match_trend = "New data this month"
                match_dir = 'up'
            else:
                match_trend = "No data this month"
                match_dir = 'neutral'

        trends = {
            "candidates": {"trend": candidates_trend, "direction": candidates_dir},
            "jobs": {"trend": jobs_trend, "direction": jobs_dir},
            "shortlisted": {"trend": shortlisted_trend, "direction": shortlisted_dir},
            "match_score": {"trend": match_trend, "direction": match_dir},
        }

        summary_data = {
            "total_candidates": total_candidates,
            "total_jobs": total_jobs,
            "shortlisted_candidates": shortlisted_candidates,
            "hired_candidates": hired_candidates,
            "average_match_score": average_match_score,
            "trends": trends,
        }

        return Response(summary_data, status=status.HTTP_200_OK)


class RecruitmentFunnelAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from apps.ranking.models import RecruitmentFunnel
        
        user = request.user
        
        # Stage names in RecruitmentFunnel model: ['applied', 'shortlisted', 'interview', 'offer', 'hired', 'rejected']
        # Frontend expects: ['applied', 'shortlisted', 'interview', 'offered', 'hired', 'rejected']
        # So we need to map 'offer' -> 'offered' for frontend compatibility
        stages = [
            "applied",
            "shortlisted",
            "interview",
            "offer",
            "hired",
            "rejected",
        ]

        funnel_data = {}
        session_id = request.query_params.get('session_id')
        if session_id in ['null', 'undefined', 'None', '']:
            session_id = None
            
        if session_id:
            from apps.candidates.models import Resume
            session_candidates = Resume.objects.filter(job_session_id=session_id).values_list('candidate_id', flat=True).distinct()

        for stage in stages:
            if session_id:
                query = RecruitmentFunnel.objects.filter(candidate_id__in=session_candidates, stage=stage)
            else:
                query = RecruitmentFunnel.objects.filter(created_by=user, stage=stage)
                
            count = query.count()
            # Map 'offer' to 'offered' for frontend compatibility
            frontend_stage = "offered" if stage == "offer" else stage
            funnel_data[frontend_stage] = count

        return Response(funnel_data, status=status.HTTP_200_OK)


import logging
logger = logging.getLogger(__name__)

class SkillIntelligenceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        logger.info(f"[SKILLS DEBUG] User: {user.username} (ID: {user.id})")
        
        # Filter by user for multi-tenant data isolation
        user_job_sessions = JobSession.objects.filter(created_by=user).values_list('id', flat=True)
        user_uploaded_resumes = Resume.objects.filter(uploaded_by=user).values_list('candidate_id', flat=True).distinct()
        
        logger.info(f"[SKILLS DEBUG] User job sessions: {list(user_job_sessions)}")
        logger.info(f"[SKILLS DEBUG] User uploaded resume candidates: {list(user_uploaded_resumes)}")
        
        # Get base candidates for this user
        base_candidates = Candidate.objects.filter(
            Q(resumes__job_session__in=user_job_sessions) |
            Q(created_by=user) |
            Q(id__in=user_uploaded_resumes)
        ).distinct()
        
        logger.info(f"[SKILLS DEBUG] Total base candidates for user: {base_candidates.count()}")
        
        # Count skills from both M2M and JSONField
        skills_count = {}
        
        # 1. Count M2M skills
        m2m_skills = (
            base_candidates
            .values("skills_m2m__name")
            .annotate(c=Count("id", distinct=True))
            .order_by("-c")
        )
        
        for item in m2m_skills:
            skill_name = item.get("skills_m2m__name")
            if skill_name:
                skills_count[skill_name] = skills_count.get(skill_name, 0) + item["c"]
        
        logger.info(f"[SKILLS DEBUG] M2M skills count: {len(skills_count)}")
        
        # 2. Count JSONField skills (skills stored as JSON list in the Candidate.skills field)
        all_candidates = base_candidates.only("id", "skills")
        for candidate in all_candidates:
            if candidate.skills and isinstance(candidate.skills, list):
                for skill in candidate.skills:
                    skill_normalized = str(skill).strip().title()
                    if skill_normalized:
                        skills_count[skill_normalized] = skills_count.get(skill_normalized, 0) + 1
        
        logger.info(f"[SKILLS DEBUG] Total unique skills after combining: {len(skills_count)}")
        logger.info(f"[SKILLS DEBUG] Top 5 skills: {sorted(skills_count.items(), key=lambda x: -x[1])[:5]}")
        
        # Sort by count and take top 10
        sorted_skills = sorted(skills_count.items(), key=lambda x: -x[1])[:10]
        
        skills_distribution = [
            {"skill": skill, "count": count}
            for skill, count in sorted_skills
        ]
        
        logger.info(f"[SKILLS DEBUG] Final skills distribution: {skills_distribution}")
        
        return Response(skills_distribution, status=status.HTTP_200_OK)


class HiringTrendsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        # Filter by user for multi-tenant data isolation
        resumes_per_day = (
            Resume.objects.filter(uploaded_by=user)
            .annotate(day=TruncDay("uploaded_at"))
            .values("day")
            .annotate(count=Count("id"))
            .order_by("day")
        )

        resumes_per_week = (
            Resume.objects.filter(uploaded_by=user)
            .annotate(week=TruncWeek("uploaded_at"))
            .values("week")
            .annotate(count=Count("id"))
            .order_by("week")
        )

        # Note: Candidate model doesn't have status_updated_at field
        # Using empty querysets for now until CandidateRank model is implemented
        hired_trends_daily = []
        hired_trends_weekly = []

        def format_date(date_obj):
            if date_obj:
                return date_obj.isoformat()
            return None

        formatted_resumes_per_day = [
            {"date": format_date(item["day"]), "count": item["count"]}
            for item in resumes_per_day
        ]
        formatted_resumes_per_week = [
            {"date": format_date(item["week"]), "count": item["count"]}
            for item in resumes_per_week
        ]
        formatted_hired_trends_daily = [
            {"date": format_date(item["day"]), "count": item["count"]}
            for item in hired_trends_daily
        ]
        formatted_hired_trends_weekly = [
            {"date": format_date(item["week"]), "count": item["count"]}
            for item in hired_trends_weekly
        ]

        trends_data = {
            "resumes_per_day": formatted_resumes_per_day,
            "resumes_per_week": formatted_resumes_per_week,
            "hired_trends_daily": formatted_hired_trends_daily,
            "hired_trends_weekly": formatted_hired_trends_weekly,
        }

        return Response(trends_data, status=status.HTTP_200_OK)


class MatchingAnalyticsAPIView(APIView):
    """
    Provides AI matching insights for dashboard:
    - Average similarity score
    - Score distribution (for histogram)
    - Top matches (for table)
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        logger = logging.getLogger(__name__)
        logger.info(f"[MatchingAnalytics] User {user.id} ({user.email}) requesting matching analytics")

        try:
            # Get actual matching data from JobCandidate model
            from apps.ranking.models import JobCandidate
            from apps.candidates.models import Resume, Candidate
            from apps.jd_app.models import JobDescription, JobSession

            # Get current job_session from query params (for session-specific filtering)
            job_session_id = request.query_params.get('session_id')
            
            # Get match_type filter (default: smart)
            # Options: 'smart', 'deep', 'exact'
            match_type = request.query_params.get('match_type', 'smart').lower()
            valid_match_types = ['smart', 'deep', 'exact']
            if match_type not in valid_match_types:
                match_type = 'smart'
            
            logger.info(f"[MatchingAnalytics] match_type filter: {match_type}")
            
            # If session_id provided, get candidates from that session
            if job_session_id:
                session_candidate_ids = list(Resume.objects.filter(
                    job_session_id=job_session_id,
                    candidate__isnull=False
                ).values_list('candidate_id', flat=True).distinct())
                
                if session_candidate_ids:
                    base_queryset = JobCandidate.objects.filter(
                        candidate__in=session_candidate_ids,
                        match_type=match_type  # Filter by match_type
                    ).select_related('candidate', 'job')
                else:
                    base_queryset = JobCandidate.objects.none()
            else:
                # No session - filter by user's uploaded candidates only
                user_uploaded_candidate_ids = list(Resume.objects.filter(
                    uploaded_by=user,
                    candidate__isnull=False
                ).values_list('candidate_id', flat=True).distinct())
                
                if user_uploaded_candidate_ids:
                    base_queryset = JobCandidate.objects.filter(
                        candidate__in=user_uploaded_candidate_ids,
                        match_type=match_type  # Filter by match_type
                    ).select_related('candidate', 'job')
                else:
                    base_queryset = JobCandidate.objects.none()
            
            logger.info(f"[MatchingAnalytics] Found {base_queryset.count()} JobCandidate matches for match_type={match_type}")

            # Get top 50 matches for display
            user_job_matches = base_queryset.order_by('-match_score')[:50]

            total_matches = base_queryset.count()

            # Calculate average score
            if total_matches > 0:
                # Get all scores for average calculation
                all_scores = list(base_queryset.values_list('match_score', flat=True))
                average_similarity_score = sum(all_scores) / len(all_scores) if all_scores else 0.0
            else:
                average_similarity_score = 0.0

            # Create score distribution (simple histogram) - use base_queryset for filtering
            score_distribution = []
            num_bins = 10
            min_score = 0.0
            max_score = 1.0
            bin_width = (max_score - min_score) / num_bins

            for i in range(num_bins):
                bin_start = min_score + i * bin_width
                bin_end = bin_start + bin_width
                count = base_queryset.filter(
                    match_score__gte=bin_start,
                    match_score__lt=bin_end
                ).count()
                # Convert to percentage labels for frontend display
                score_distribution.append(
                    {
                        "bin_start": round(bin_start, 2),
                        "bin_end": round(bin_end, 2),
                        "bin_label": f"{int(bin_start * 100)}-{int(bin_end * 100)}%",
                        "count": count,
                    }
                )

            # Top matches - use the sliced queryset for display
            # Map match_type values to display labels
            match_type_labels = {
                'smart': 'Smart',
                'deep': 'AI Deep Search',
                'exact': 'Exact Match'
            }
            
            top_matches = []
            for match in user_job_matches:
                # Get candidate skills and experience
                candidate_skills = match.candidate.skills if match.candidate else None
                candidate_experience = match.candidate.experience_years if match.candidate else 0
                
                # Format skills as comma-separated string (first 5)
                skills_str = ""
                if candidate_skills:
                    if isinstance(candidate_skills, list):
                        skills_list = candidate_skills[:5]  # Limit to 5 skills
                        skills_str = ", ".join(str(s) for s in skills_list)
                    else:
                        # If it's a string, just use first 100 chars
                        skills_str = str(candidate_skills)[:100]
                
                top_matches.append({
                    "id": match.id,
                    "candidate_id": match.candidate.id if match.candidate else None,
                    "candidate_name": match.candidate.name if match.candidate else f"Candidate #{match.id}",
                    "skills": skills_str,
                    "experience_years": candidate_experience if candidate_experience else 0,
                    "job_id": match.job.id if match.job else None,
                    "job_title": match.job.title if match.job else f"Job #{match.id}",
                    "match_score": round(float(match.match_score) * 100) if match.match_score else 0,  # Convert to clean percentage
                    "match_type": match_type_labels.get(match.match_type, match.match_type),
                    "match_type_key": match.match_type,  # Raw value for internal use
                    "created_at": match.created_at.isoformat() if match.created_at else None,
                })

            data = {
                "match_type": match_type,
                "match_type_label": match_type_labels.get(match_type, match_type),
                "average_similarity_score": average_similarity_score,
                "total_matches": total_matches,
                "score_distribution": score_distribution,
                "top_matches": top_matches,
            }

            return Response(data, status=status.HTTP_200_OK)
            
        except Exception as e:
            import traceback
            logger.error(f"[MatchingAnalytics] Error: {str(e)}\n{traceback.format_exc()}")
            return Response({
                "match_type": "smart",
                "match_type_label": "Smart Match",
                "average_similarity_score": 0,
                "total_matches": 0,
                "score_distribution": [],
                "top_matches": [],
                "error": str(e),
                "trace": traceback.format_exc()
            }, status=status.HTTP_200_OK)


class HiringTrendsNewAPIView(APIView):
    """
    Hiring Trends API - Shows hired candidates by time period.
    - When year selected: shows monthly data for that year
    - When no year (All Years): shows yearly data for last 5 years
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        from apps.ranking.models import RecruitmentFunnel
        from apps.candidates.models import Resume
        from django.db.models import Count, Q
        from django.db.models.functions import TruncMonth
        from datetime import datetime
        
        user = request.user
        year = request.query_params.get('year')
        session_id = request.query_params.get('session_id')
        if session_id in ['null', 'undefined', 'None', '']:
            session_id = None

        # Build base query for hired candidates
        # Include candidates from user's jobs OR candidates user uploaded
        user_job_ids = JobDescription.objects.filter(created_by=user).values_list('id', flat=True)
        
        if session_id:
            # Strictly filter by session if provided
            session_candidates = Resume.objects.filter(job_session_id=session_id).values_list('candidate_id', flat=True).distinct()
            base_query = RecruitmentFunnel.objects.filter(
                Q(job__in=user_job_ids) | Q(candidate_id__in=session_candidates),
                stage='hired'
            )
            # If session_id is provided, we might want to filter candidates ONLY in that session
            base_query = base_query.filter(candidate_id__in=session_candidates)
        else:
            base_query = RecruitmentFunnel.objects.filter(
                Q(job__in=user_job_ids) | Q(created_by=user),
                stage='hired'
            )

        # Total hired count for the filtered scope
        total_hired = base_query.count()
        
        result = []
        
        if year and year != 'null' and year != 'undefined':
            # Specific year selected - show monthly data for that year
            selected_year = int(year)
            monthly_data = (
                base_query
                .filter(created_at__year=selected_year)
                .annotate(month=TruncMonth("created_at"))
                .values("month")
                .annotate(count=Count("id"))
                .order_by("month")
            )
            
            existing_months = {}
            for item in monthly_data:
                if item["month"]:
                    month_str = item["month"].strftime("%b")
                    existing_months[month_str] = item["count"]
            
            all_months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            for m in all_months:
                result.append({
                    "period": m,
                    "period_type": "month",
                    "count": existing_months.get(m, 0)
                })
        else:
            # No year selected - show yearly data for last 5 years
            current_yr = datetime.now().year
            years_list = list(range(current_yr - 4, current_yr + 1))
            
            for y in years_list:
                year_count = base_query.filter(created_at__year=y).count()
                result.append({
                    "period": str(y),
                    "period_type": "year",
                    "count": year_count
                })
        
        return Response({
            "total_hired": total_hired,
            "selected_year": year if year and year not in ['null', 'undefined'] else None,
            "hiring_data": result
        }, status=status.HTTP_200_OK)


class MatchDistributionAPIView(APIView):
    """
    Match Score Distribution API - Group by match_type (smart, deep, exact) + JD count.
    Shows distribution by matching strategy and job count.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        # Get user's jobs count
        user_job_count = JobDescription.objects.filter(created_by=user).count()
        
        # Get JobCandidates for jobs created by this user, grouped by match_type
        user_job_ids = JobDescription.objects.filter(created_by=user).values_list('id', flat=True)
        qs = JobCandidate.objects.filter(job__in=user_job_ids)

        # Group by match_type
        type_buckets = {"smart": 0, "deep": 0, "exact": 0}
        
        for obj in qs:
            match_type = obj.match_type
            if match_type in type_buckets:
                type_buckets[match_type] += 1

        # Add job count to response
        result = [
            {"range": "Jobs", "count": user_job_count},
            {"range": "smart", "count": type_buckets["smart"]},
            {"range": "deep", "count": type_buckets["deep"]},
            {"range": "exact", "count": type_buckets["exact"]},
        ]
        return Response(result, status=status.HTTP_200_OK)


def normalize_skill(skill):
    """
    Normalize skill name for comparison.
    - Keep more original form
    - Basic cleaning only
    """
    if not skill:
        return ""
    
    # Convert to string and lowercase
    s = str(skill).strip().lower()
    
    # Only remove obvious junk patterns
    import re
    
    # Remove parenthetical content that's clearly not a skill (like "or sd modules")
    # But keep short parens like "(2 years)"
    s = re.sub(r'\([^)]{20,}\)', '', s)  # Remove long parenthetical phrases
    
    # Clean up multiple spaces
    s = ' '.join(s.split())
    
    return s.strip()


def get_candidate_skills(candidate):
    """Extract skills from a candidate (both JSONField and M2M)."""
    skills = set()
    
    # JSONField skills
    if candidate.skills and isinstance(candidate.skills, list):
        for s in candidate.skills:
            normalized = normalize_skill(s)
            if normalized:
                skills.add(normalized)
    
    # M2M skills
    for skill in candidate.skills_m2m.all():
        normalized = normalize_skill(skill.name)
        if normalized:
            skills.add(normalized)
    
    return skills


def get_job_skills(job):
    """Extract required skills from a job description."""
    skills = set()
    
    # From required_skills JSONField
    if job.required_skills and isinstance(job.required_skills, list):
        for s in job.required_skills:
            normalized = normalize_skill(s)
            if normalized:
                skills.add(normalized)
    
    # From skills text field (comma-separated)
    if job.skills:
        for s in job.skills.split(','):
            normalized = normalize_skill(s)
            if normalized:
                skills.add(normalized)
    
    return skills


class SkillGapAnalysisAPIView(APIView):
    """
    Skill Gap Analysis for a specific job.
    Compares job required skills vs ALL candidate skills (not just matched ones).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        user = request.user
        
        try:
            job = JobDescription.objects.get(id=job_id, created_by=user)
        except JobDescription.DoesNotExist:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # Get job required skills
        job_skills = get_job_skills(job)
        logger.info(f"[SkillGap] Job ID {job_id}, Title: {job.title}")
        logger.info(f"[SkillGap] Job required_skills field: {job.required_skills}")
        logger.info(f"[SkillGap] Job skills text field: {job.skills}")
        logger.info(f"[SkillGap] Normalized job skills: {job_skills}")
        
        if not job_skills:
            return Response({
                "job_id": job_id,
                "job_title": job.title,
                "matched_skills": [],
                "missing_skills": [],
                "match_percentage": 0,
                "total_candidates": 0,
                "message": "Add skills to job description"
            }, status=status.HTTP_200_OK)
        
        # Get ALL candidates for this user (not just matched ones)
        user_job_sessions = JobSession.objects.filter(created_by=user).values_list('id', flat=True)
        user_uploaded_resumes = Resume.objects.filter(uploaded_by=user).values_list('candidate_id', flat=True).distinct()
        
        all_candidates = Candidate.objects.filter(
            Q(resumes__job_session__in=user_job_sessions) |
            Q(created_by=user) |
            Q(id__in=user_uploaded_resumes)
        ).distinct()
        
        logger.info(f"[SkillGap] Total candidates for this user: {all_candidates.count()}")
        
        if all_candidates.count() == 0:
            return Response({
                "job_id": job_id,
                "job_title": job.title,
                "matched_skills": [],
                "missing_skills": list(job_skills),
                "match_percentage": 0,
                "total_candidates": 0,
                "message": "No candidates available for analysis"
            }, status=status.HTTP_200_OK)
        
        # Aggregate skills from ALL candidates
        all_candidate_skills = set()
        for candidate in all_candidates:
            candidate_skills = get_candidate_skills(candidate)
            logger.info(f"[SkillGap] Candidate {candidate.id} skills: {candidate_skills}")
            all_candidate_skills.update(candidate_skills)
        
        logger.info(f"[SkillGap] All candidate skills combined: {all_candidate_skills}")
        
        # Find matched and missing skills
        matched_skills = job_skills.intersection(all_candidate_skills)
        missing_skills = job_skills - all_candidate_skills
        
        logger.info(f"[SkillGap] Matched: {matched_skills}, Missing: {missing_skills}")
        
        # Calculate match percentage
        match_percentage = round((len(matched_skills) / len(job_skills)) * 100) if job_skills else 0
        
        return Response({
            "job_id": job_id,
            "job_title": job.title,
            "matched_skills": sorted(list(matched_skills)),
            "missing_skills": sorted(list(missing_skills)),
            "match_percentage": match_percentage,
            "total_candidates": all_candidates.count(),
        }, status=status.HTTP_200_OK)


class TopMissingSkillsAPIView(APIView):
    """
    Top Missing Skills across all jobs.
    Shows which skills are most commonly missing across candidates.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        # Get user's jobs
        user_jobs = JobDescription.objects.filter(created_by=user)
        user_job_ids = list(user_jobs.values_list('id', flat=True))
        
        if not user_job_ids:
            return Response([], status=status.HTTP_200_OK)
        
        # Aggregate missing skills count
        missing_skills_count = {}
        
        for job in user_jobs:
            job_skills = get_job_skills(job)
            if not job_skills:
                continue
            
            # Get candidates in funnel for this job
            funnel_candidates = RecruitmentFunnel.objects.filter(
                job=job
            ).select_related('candidate')
            
            if not funnel_candidates.exists():
                continue
            
            # Aggregate candidate skills
            candidate_skills = set()
            for funnel in funnel_candidates:
                if funnel.candidate:
                    candidate_skills.update(get_candidate_skills(funnel.candidate))
            
            # Find missing skills for this job
            missing = job_skills - candidate_skills
            
            # Count each missing skill
            for skill in missing:
                missing_skills_count[skill] = missing_skills_count.get(skill, 0) + 1
        
        # Sort by count and take top 10
        sorted_missing = sorted(missing_skills_count.items(), key=lambda x: -x[1])[:10]
        
        result = [
            {"skill": skill, "missing_count": count}
            for skill, count in sorted_missing
        ]
        
        return Response(result, status=status.HTTP_200_OK)


class SkillRecommendationsAPIView(APIView):
    """
    AI-powered skill gap recommendations.
    Provides actionable insights based on skill gaps.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        recommendations = []
        
        # Get user's jobs with candidates
        user_jobs = JobDescription.objects.filter(created_by=user)
        
        for job in user_jobs:
            job_skills = get_job_skills(job)
            if not job_skills:
                continue
            
            funnel_candidates = RecruitmentFunnel.objects.filter(
                job=job
            ).select_related('candidate')
            
            if not funnel_candidates.exists():
                continue
            
            # Get candidate skills
            candidate_skills = set()
            total_candidates = 0
            for funnel in funnel_candidates:
                total_candidates += 1
                if funnel.candidate:
                    candidate_skills.update(get_candidate_skills(funnel.candidate))
            
            missing_skills = job_skills - candidate_skills
            
            if missing_skills:
                match_pct = (len(job_skills - missing_skills) / len(job_skills)) * 100 if job_skills else 0
                
                # Generate recommendation
                if match_pct < 50:
                    rec_type = "critical"
                    rec_msg = f"Only {int(match_pct)}% of job skills matched. Consider sourcing candidates with: {', '.join(list(missing_skills)[:3])}"
                elif match_pct < 80:
                    rec_type = "moderate"
                    rec_msg = f"Consider adding candidates skilled in: {', '.join(list(missing_skills)[:3])}"
                else:
                    rec_type = "minor"
                    rec_msg = f"Great match! Consider training for: {', '.join(list(missing_skills)[:2])}"
                
                recommendations.append({
                    "job_id": job.id,
                    "job_title": job.title,
                    "recommendation": rec_msg,
                    "type": rec_type,
                    "missing_skills_count": len(missing_skills),
                    "match_percentage": round(match_pct),
                    "total_candidates": total_candidates,
                })
        
        # Sort by criticality
        type_priority = {"critical": 0, "moderate": 1, "minor": 2}
        recommendations.sort(key=lambda x: (type_priority.get(x["type"], 3), -x["missing_skills_count"]))
        
        return Response(recommendations[:10], status=status.HTTP_200_OK)
