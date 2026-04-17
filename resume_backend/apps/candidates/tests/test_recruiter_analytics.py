"""
Unit tests for Recruiter Analytics Service and API.
"""

from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

from apps.candidates.models import Candidate, Resume, Skill
from apps.jd_app.models import JobDescription
from apps.pipeline.models import CandidatePipeline, PipelineStage
from apps.candidates.services.recruiter_analytics import recruiter_analytics_service


class RecruiterAnalyticsServiceTests(TestCase):
    """Test cases for RecruiterAnalyticsService"""

    def setUp(self):
        """Set up test data"""
        self.now = timezone.now()
        
        # Create skills
        self.python_skill = Skill.objects.create(name="Python")
        self.django_skill = Skill.objects.create(name="Django")
        self.js_skill = Skill.objects.create(name="JavaScript")
        self.react_skill = Skill.objects.create(name="React")
        
        # Create candidates
        self.candidate1 = Candidate.objects.create(
            name="John Doe",
            email="john@example.com",
            summary="Python developer"
        )
        self.candidate1.skills_m2m.add(self.python_skill, self.django_skill)
        
        self.candidate2 = Candidate.objects.create(
            name="Jane Smith",
            email="jane@example.com",
            summary="Full stack developer"
        )
        self.candidate2.skills_m2m.add(self.python_skill, self.js_skill, self.react_skill)
        
        self.candidate3 = Candidate.objects.create(
            name="Bob Johnson",
            email="bob@example.com",
            summary="Frontend developer"
        )
        self.candidate3.skills_m2m.add(self.js_skill, self.react_skill)
        
        # Create resumes
        self.resume1 = Resume.objects.create(
            candidate=self.candidate1,
            file_name="john_resume.pdf",
            text="Python developer resume",
            source="upload",
            uploaded_at=self.now - timedelta(days=5)
        )
        
        self.resume2 = Resume.objects.create(
            candidate=self.candidate2,
            file_name="jane_resume.pdf",
            text="Full stack developer resume",
            source="email",
            uploaded_at=self.now - timedelta(days=10)
        )
        
        self.resume3 = Resume.objects.create(
            candidate=self.candidate3,
            file_name="bob_resume.pdf",
            text="Frontend developer resume",
            source="api",
            uploaded_at=self.now - timedelta(days=15)
        )
        
        # Create job descriptions
        self.job1 = JobDescription.objects.create(
            title="Senior Python Developer",
            description="Python developer position",
            skills="Python, Django",
            location="Remote",
            employment_type="Full-time"
        )
        
        self.job2 = JobDescription.objects.create(
            title="Full Stack Developer",
            description="Full stack developer position",
            skills="JavaScript, React, Python",
            location="New York",
            employment_type="Full-time"
        )
        
        # Create pipeline entries
        self.pipeline1 = CandidatePipeline.objects.create(
            candidate=self.candidate1,
            job=self.job1,
            current_stage=PipelineStage.APPLIED
        )
        
        self.pipeline2 = CandidatePipeline.objects.create(
            candidate=self.candidate2,
            job=self.job1,
            current_stage=PipelineStage.SCREENING
        )
        
        self.pipeline3 = CandidatePipeline.objects.create(
            candidate=self.candidate3,
            job=self.job2,
            current_stage=PipelineStage.TECHNICAL_INTERVIEW
        )
        
        self.pipeline4 = CandidatePipeline.objects.create(
            candidate=self.candidate1,
            job=self.job2,
            current_stage=PipelineStage.REJECTED
        )

    def test_get_overview_statistics(self):
        """Test overview statistics generation"""
        stats = recruiter_analytics_service.get_overview_statistics()
        
        # Verify core counts
        self.assertEqual(stats['total_candidates'], 3)
        self.assertEqual(stats['total_resumes'], 3)
        self.assertEqual(stats['total_jobs'], 2)
        self.assertEqual(stats['total_pipelines'], 4)
        self.assertEqual(stats['total_skills'], 4)
        
        # Verify pipeline metrics
        self.assertEqual(stats['active_pipelines'], 3)
        self.assertEqual(stats['rejected_candidates'], 1)
        self.assertEqual(stats['offered_candidates'], 0)
        
        # Verify structure
        self.assertIn('new_candidates_30d', stats)
        self.assertIn('new_resumes_30d', stats)
        self.assertIn('new_jobs_30d', stats)

    def test_get_pipeline_stage_distribution(self):
        """Test pipeline stage distribution"""
        distribution = recruiter_analytics_service.get_pipeline_stage_distribution()
        
        # Verify structure
        self.assertIn('total_pipelines', distribution)
        self.assertIn('distribution', distribution)
        self.assertIn('summary', distribution)
        
        # Verify total
        self.assertEqual(distribution['total_pipelines'], 4)
        
        # Verify distribution contains expected stages
        stage_codes = [d['stage'] for d in distribution['distribution']]
        self.assertIn(PipelineStage.APPLIED, stage_codes)
        self.assertIn(PipelineStage.SCREENING, stage_codes)
        self.assertIn(PipelineStage.REJECTED, stage_codes)
        
        # Verify summary
        self.assertEqual(distribution['summary']['active'], 3)
        self.assertEqual(distribution['summary']['rejected'], 1)

    def test_get_candidates_per_job(self):
        """Test candidates per job statistics"""
        data = recruiter_analytics_service.get_candidates_per_job()

        self._extracted_from_test_get_candidates_per_job_16(
            'total_jobs', data, 'jobs_with_candidates', 'jobs'
        )
        # Verify totals
        self.assertEqual(data['total_jobs'], 2)
        self.assertEqual(len(data['jobs']), 2)

        # Verify job data structure

# sourcery skip: no-loop-in-tests
        for job in data['jobs']:
            self._extracted_from_test_get_candidates_per_job_16(
                'job_id', job, 'title', 'total_candidates'
            )
            self.assertIn('active_candidates', job)

    # TODO Rename this here and in `test_get_candidates_per_job`
    def _extracted_from_test_get_candidates_per_job_16(self, arg0, arg1, arg2, arg3):
        self.assertIn(arg0, arg1)
        self.assertIn(arg2, arg1)
        self.assertIn(arg3, arg1)

    def test_get_candidates_per_job_with_limit(self):
        """Test candidates per job with limit parameter"""
        data = recruiter_analytics_service.get_candidates_per_job(limit=1)
        
        # Verify limit is applied
        self.assertEqual(len(data['jobs']), 1)

    def test_get_top_skills(self):
        """Test top skills generation"""
        data = recruiter_analytics_service.get_top_skills()

        self._extracted_from_test_get_top_skills_23(
            'total_candidates', data, 'total_unique_skills', 'top_skills'
        )
        # Verify totals
        self.assertEqual(data['total_candidates'], 3)
        self.assertEqual(data['total_unique_skills'], 4)

        # Verify skills are ordered by count
        if len(data['top_skills']) > 1:
            self.assertGreaterEqual(
                data['top_skills'][0]['candidate_count'],
                data['top_skills'][1]['candidate_count']
            )

        # Verify skill data structure
        for skill in data['top_skills']:
            self._extracted_from_test_get_top_skills_23(
                'skill_id', skill, 'name', 'candidate_count'
            )
            self.assertIn('percentage', skill)

    # TODO Rename this here and in `test_get_top_skills`
    def _extracted_from_test_get_top_skills_23(self, arg0, arg1, arg2, arg3):
        self.assertIn(arg0, arg1)
        self.assertIn(arg2, arg1)
        self.assertIn(arg3, arg1)

    def test_get_top_skills_with_limit(self):
        """Test top skills with limit parameter"""
        data = recruiter_analytics_service.get_top_skills(limit=2)
        
        # Verify limit is applied
        self.assertEqual(len(data['top_skills']), 2)

    def test_get_resume_source_statistics(self):
        """Test resume source statistics"""
        stats = recruiter_analytics_service.get_resume_source_statistics()
        
        # Verify structure
        self.assertIn('total_resumes', stats)
        self.assertIn('sources', stats)
        
        # Verify totals
        self.assertEqual(stats['total_resumes'], 3)
        self.assertEqual(len(stats['sources']), 3)
        
        # Verify source data structure
        for source in stats['sources']:
            self.assertIn('source', source)
            self.assertIn('source_display', source)
            self.assertIn('count', source)
            self.assertIn('percentage', source)

    def test_get_time_series_data(self):
        """Test time series data generation"""
        data = recruiter_analytics_service.get_time_series_data()
        
        # Verify structure
        self.assertIn('period', data)
        self.assertIn('start_date', data)
        self.assertIn('end_date', data)
        self.assertIn('data', data)
        
        # Verify data points
        self.assertGreater(len(data['data']), 0)
        
        # Verify data point structure
        for point in data['data']:
            self.assertIn('period', point)
            self.assertIn('candidates', point)
            self.assertIn('resumes', point)

    def test_get_time_series_data_with_parameters(self):
        """Test time series data with custom parameters"""
        data = recruiter_analytics_service.get_time_series_data(period='weekly', months=3)
        
        # Verify parameters are applied
        self.assertEqual(data['period'], 'weekly')

    def test_get_recruitment_funnel(self):
        """Test recruitment funnel metrics"""
        funnel = recruiter_analytics_service.get_recruitment_funnel()
        
        # Verify structure
        self.assertIn('funnel', funnel)
        self.assertIn('total_applications', funnel)
        self.assertIn('overall_conversion_rate', funnel)
        
        # Verify totals
        self.assertEqual(funnel['total_applications'], 4)
        
        # Verify funnel stages
        self.assertEqual(len(funnel['funnel']), 6)  # 6 stages total
        
        # Verify stage data structure
        for stage in funnel['funnel']:
            self.assertIn('stage', stage)
            self.assertIn('stage_display', stage)
            self.assertIn('count', stage)
            self.assertIn('conversion_rate', stage)

    def test_get_comprehensive_analytics(self):
        """Test comprehensive analytics generation"""
        analytics = recruiter_analytics_service.get_comprehensive_analytics()
        
        # Verify structure
        self.assertIn('overview', analytics)
        self.assertIn('pipeline_distribution', analytics)
        self.assertIn('candidates_per_job', analytics)
        self.assertIn('top_skills', analytics)
        self.assertIn('resume_sources', analytics)
        self.assertIn('time_series', analytics)
        self.assertIn('recruitment_funnel', analytics)
        self.assertIn('generated_at', analytics)
        
        # Verify data is present
        self.assertIsNotNone(analytics['overview'])
        self.assertIsNotNone(analytics['pipeline_distribution'])


class RecruiterAnalyticsAPITests(TestCase):
    """Test cases for Recruiter Analytics API endpoints"""

    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="testuser", password="TestPassword123!")
        self.client.force_authenticate(user=self.user)
        
        # Create minimal test data
        self.skill = Skill.objects.create(name="Python")
        self.candidate = Candidate.objects.create(
            name="Test Candidate",
            email="test@example.com"
        )
        self.candidate.skills_m2m.add(self.skill)
        
        self.resume = Resume.objects.create(
            candidate=self.candidate,
            file_name="test_resume.pdf",
            text="Test resume",
            source="upload"
        )
        
        self.job = JobDescription.objects.create(
            title="Test Job",
            description="Test job description",
            skills="Python"
        )
        
        self.pipeline = CandidatePipeline.objects.create(
            candidate=self.candidate,
            job=self.job,
            current_stage=PipelineStage.APPLIED
        )

    def test_overview_endpoint(self):
        """Test overview statistics endpoint"""
        response = self.client.get('/api/recruiter/analytics/overview/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('total_candidates', data)
        self.assertIn('total_resumes', data)
        self.assertIn('total_jobs', data)

    def test_pipeline_distribution_endpoint(self):
        """Test pipeline distribution endpoint"""
        response = self.client.get('/api/recruiter/analytics/pipeline-distribution/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('total_pipelines', data)
        self.assertIn('distribution', data)
        self.assertIn('summary', data)

    def test_candidates_per_job_endpoint(self):
        """Test candidates per job endpoint"""
        response = self.client.get('/api/recruiter/analytics/candidates-per-job/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('total_jobs', data)
        self.assertIn('jobs', data)

    def test_candidates_per_job_with_limit(self):
        """Test candidates per job endpoint with limit parameter"""
        response = self.client.get('/api/recruiter/analytics/candidates-per-job/?limit=5')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertLessEqual(len(data['jobs']), 5)

    def test_top_skills_endpoint(self):
        """Test top skills endpoint"""
        response = self.client.get('/api/recruiter/analytics/top-skills/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('total_candidates', data)
        self.assertIn('top_skills', data)

    def test_top_skills_with_limit(self):
        """Test top skills endpoint with limit parameter"""
        response = self.client.get('/api/recruiter/analytics/top-skills/?limit=5')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertLessEqual(len(data['top_skills']), 5)

    def test_resume_sources_endpoint(self):
        """Test resume sources endpoint"""
        response = self.client.get('/api/recruiter/analytics/resume-sources/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('total_resumes', data)
        self.assertIn('sources', data)

    def test_time_series_endpoint(self):
        """Test time series endpoint"""
        response = self.client.get('/api/recruiter/analytics/time-series/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('period', data)
        self.assertIn('data', data)

    def test_time_series_with_parameters(self):
        """Test time series endpoint with parameters"""
        response = self.client.get(
            '/api/recruiter/analytics/time-series/?period=weekly&months=3'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['period'], 'weekly')

    def test_recruitment_funnel_endpoint(self):
        """Test recruitment funnel endpoint"""
        response = self.client.get('/api/recruiter/analytics/recruitment-funnel/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('funnel', data)
        self.assertIn('total_applications', data)

    def test_comprehensive_analytics_endpoint(self):
        """Test comprehensive analytics endpoint"""
        response = self.client.get('/api/recruiter/analytics/comprehensive/')
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('overview', data)
        self.assertIn('pipeline_distribution', data)
        self.assertIn('top_skills', data)
        self.assertIn('generated_at', data)

    def test_invalid_limit_parameter(self):
        """Test endpoint with invalid limit parameter"""
        response = self.client.get('/api/recruiter/analytics/candidates-per-job/?limit=invalid')
        
        # Should still succeed with default behavior
        self.assertEqual(response.status_code, 200)

    def test_invalid_period_parameter(self):
        """Test time series endpoint with invalid period parameter"""
        response = self.client.get('/api/recruiter/analytics/time-series/?period=invalid')
        
        # Should default to 'monthly'
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['period'], 'monthly')