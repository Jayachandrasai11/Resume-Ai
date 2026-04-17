from django.test import TestCase
from rest_framework.test import APIClient
from django.utils import timezone
from candidates.models import Candidate
from jd_app.models import JobDescription
from .models import CandidatePipeline, PipelineStage


class CandidatePipelineTests(TestCase):
    """Test cases for CandidatePipeline model and API."""
    
    def setUp(self):
        """Set up test data."""
        self.client = APIClient()
        
        # Create test candidate
        self.candidate = Candidate.objects.create(
            name='Test Candidate',
            email='test@example.com',
            phone='1234567890'
        )
        
        # Create test job
        self.job = JobDescription.objects.create(
            title='Software Engineer',
            description='Test job description',
            skills='Python, Django'
        )
        
        # Create test pipeline entry
        self.pipeline = CandidatePipeline.objects.create(
            candidate=self.candidate,
            job=self.job,
            current_stage=PipelineStage.APPLIED,
            notes='Initial application'
        )
    
    def test_pipeline_creation(self):
        """Test pipeline entry creation."""
        self.assertEqual(self.pipeline.candidate, self.candidate)
        self.assertEqual(self.pipeline.job, self.job)
        self.assertEqual(self.pipeline.current_stage, PipelineStage.APPLIED)
        self.assertIsNotNone(self.pipeline.created_at)
    
    def test_pipeline_stage_update(self):
        """Test pipeline stage update."""
        self.pipeline.advance_stage(PipelineStage.SCREENING)
        self.pipeline.refresh_from_db()
        self.assertEqual(self.pipeline.current_stage, PipelineStage.SCREENING)
    
    def test_unique_candidate_job_pair(self):
        """Test that candidate-job pair is unique."""
        with self.assertRaises(Exception):
            CandidatePipeline.objects.create(
                candidate=self.candidate,
                job=self.job,
                current_stage=PipelineStage.APPLIED
            )
    
    def test_pipeline_str_representation(self):
        """Test string representation of pipeline."""
        expected = f"{self.candidate.name} - {self.job.title} (Applied)"
        self.assertEqual(str(self.pipeline), expected)
    
    def test_api_get_pipeline_list(self):
        """Test API endpoint to get pipeline list."""
        response = self.client.get('/api/pipeline/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
    
    def test_api_get_pipeline_detail(self):
        """Test API endpoint to get pipeline detail."""
        response = self.client.get(f'/api/pipeline/{self.pipeline.id}/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['id'], self.pipeline.id)
    
    def test_api_create_pipeline(self):
        """Test API endpoint to create pipeline entry."""
        new_candidate = Candidate.objects.create(
            name='New Candidate',
            email='new@example.com'
        )
        
        data = {
            'candidate': new_candidate.id,
            'job': self.job.id,
            'current_stage': PipelineStage.APPLIED
        }
        response = self.client.post('/api/pipeline/', data)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(CandidatePipeline.objects.count(), 2)
    
    def test_api_update_stage(self):
        """Test API endpoint to update pipeline stage."""
        data = {
            'current_stage': PipelineStage.TECHNICAL_INTERVIEW,
            'notes': 'Passed screening'
        }
        response = self.client.patch(f'/api/pipeline/{self.pipeline.id}/update_stage/', data)
        self.assertEqual(response.status_code, 200)
        
        self.pipeline.refresh_from_db()
        self.assertEqual(self.pipeline.current_stage, PipelineStage.TECHNICAL_INTERVIEW)
        self.assertEqual(self.pipeline.notes, 'Passed screening')
    
    def test_api_list_by_stage(self):
        """Test API endpoint to list pipelines by stage."""
        response = self.client.get('/api/pipeline/by_stage/')
        self.assertEqual(response.status_code, 200)
        self.assertIn('applied', response.data)
        
        # Test filtering by specific stage
        response = self.client.get(f'/api/pipeline/by_stage/?stage={PipelineStage.APPLIED}')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['stage'], PipelineStage.APPLIED)
        self.assertEqual(response.data['count'], 1)
    
    def test_api_get_stages(self):
        """Test API endpoint to get all available stages."""
        response = self.client.get('/api/pipeline/stages/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), len(PipelineStage.choices))
    
    def test_api_update_candidate_stage(self):
        """Test API endpoint to update candidate stage by IDs."""
        data = {
            'candidate_id': self.candidate.id,
            'job_id': self.job.id,
            'current_stage': PipelineStage.HR_INTERVIEW,
            'notes': 'Final round'
        }
        response = self.client.post('/api/pipeline/update-stage/', data)
        self.assertEqual(response.status_code, 200)
        
        self.pipeline.refresh_from_db()
        self.assertEqual(self.pipeline.current_stage, PipelineStage.HR_INTERVIEW)