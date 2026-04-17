from django.test import TestCase
from rest_framework.test import APIClient
from apps.candidates.models import Candidate, Resume, ResumeChunk
from unittest.mock import patch

class SemanticSearchTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        # Create a test user
        from apps.accounts.models import CustomUser
        self.user = CustomUser.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword"
        )
        self.client.force_authenticate(user=self.user)
        
        self.candidate = Candidate.objects.create(
            name="Test Candidate",
            email="test@example.com",
            skills=["Python", "Django"]
        )
        self.resume = Resume.objects.create(
            candidate=self.candidate,
            file_name="test.pdf",
            text="Experienced Python developer.",
            uploaded_by=self.user  # Set uploaded_by to test user
        )
        # Create a chunk with a dummy embedding (384 dims for all-MiniLM-L6-v2)
        self.chunk = ResumeChunk.objects.create(
            resume=self.resume,
            chunk_text="Experienced Python developer.",
            chunk_index=0,
            embedding=[0.1] * 384
        )

    @patch('apps.candidates.services.embeddings.EmbeddingService.get_embedding')
    def test_semantic_search_api(self, mock_get_embedding):
        # Mock the embedding for the query
        mock_get_embedding.return_value = [0.1] * 384
        
        response = self.client.post('/api/semantic-search/', {
            "job_description": "Python developer",
            "limit": 5,
            "threshold": 0.1
        }, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.data['results']) > 0)
        self.assertEqual(response.data['results'][0]['id'], self.candidate.id)
        self.assertGreater(response.data['results'][0]['similarity_score'], 0.9)

    def test_ranking_api(self):
        response = self.client.post('/api/ranking/', {
            "job_description": "Python developer",
            "page": 1,
            "page_size": 10
        }, format='json')
        
        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)
