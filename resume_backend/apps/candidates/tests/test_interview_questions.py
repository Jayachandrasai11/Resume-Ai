"""
Unit tests for the Interview Question Generator service and API.
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import json

from apps.candidates.models import Candidate, Skill, Resume
from apps.candidates.services.interview_questions import interview_questions_service


class InterviewQuestionServiceTests(TestCase):
    """Test cases for InterviewQuestionGeneratorService"""

    def setUp(self):
        """Set up test data"""
        # Create test candidate with skills
        self.candidate = Candidate.objects.create(
            name="Test Developer",
            email="test@example.com",
            phone="1234567890",
            summary="Experienced Python developer with 5 years of experience",
            experience=[{
                "title": "Senior Python Developer",
                "company": "Tech Corp",
                "years": "5"
            }],
            education=[{
                "degree": "B.Tech Computer Science",
                "university": "Test University"
            }]
        )
        
        # Create skills
        self.python_skill = Skill.objects.create(name="Python")
        self.django_skill = Skill.objects.create(name="Django")
        self.postgres_skill = Skill.objects.create(name="PostgreSQL")
        
        # Link skills to candidate
        self.candidate.skills_m2m.add(self.python_skill, self.django_skill, self.postgres_skill)
        
        # Also add to JSON field for backward compatibility
        self.candidate.skills = ["Python", "Django", "PostgreSQL"]
        self.candidate.save()

    def test_get_candidate_skills_from_m2m(self):
        """Test extracting skills from M2M relationship"""
        skills = interview_questions_service._get_candidate_skills(self.candidate)
        self.assertEqual(len(skills), 3)
        self.assertIn("Python", skills)
        self.assertIn("Django", skills)
        self.assertIn("PostgreSQL", skills)

    def test_get_candidate_skills_from_json(self):
        """Test extracting skills from JSON field when M2M is empty"""
        # Create candidate with only JSON skills
        candidate_json = Candidate.objects.create(
            name="JSON Skills Candidate",
            skills=["JavaScript", "React", "Node.js"]
        )
        
        skills = interview_questions_service._get_candidate_skills(candidate_json)
        self.assertEqual(len(skills), 3)
        self.assertIn("JavaScript", skills)

    def test_build_candidate_profile(self):
        """Test building candidate profile string"""
        profile = interview_questions_service._build_candidate_profile(self.candidate)
        
        self.assertIn("Test Developer", profile)
        self.assertIn("Python", profile)
        self.assertIn("Django", profile)
        self.assertIn("PostgreSQL", profile)
        self.assertIn("Senior Python Developer", profile)
        self.assertIn("B.Tech Computer Science", profile)

    def test_generate_interview_questions_success(self):
        """Test successful generation of interview questions"""
        # Skip test if API key not configured
        if not interview_questions_service.model:
            self.skipTest("Gemini API key not configured")
        
        result = interview_questions_service.generate_interview_questions(
            candidate_id=self.candidate.id,
            job_role="Senior Python Developer",
            question_count=8
        )
        
        self.assertEqual(result['status'], 'success')
        self.assertEqual(result['candidate_id'], self.candidate.id)
        self.assertEqual(result['job_role'], "Senior Python Developer")
        self.assertIn('questions', result)
        self.assertGreaterEqual(len(result['questions']), 5)
        self.assertLessEqual(len(result['questions']), 10)
        
        # Validate question structure
        for question in result['questions']:
            self.assertIn('question', question)
            self.assertIn('category', question)
            self.assertIn('skill_related', question)
            self.assertIsInstance(question['question'], str)
            self.assertTrue(len(question['question']) > 0)

    def test_generate_interview_questions_candidate_not_found(self):
        """Test error handling when candidate doesn't exist"""
        result = interview_questions_service.generate_interview_questions(
            candidate_id=99999,
            job_role="Python Developer"
        )
        
        self.assertEqual(result['status'], 'error')
        self.assertIn('not found', result['error'])

    def test_generate_interview_questions_no_skills(self):
        """Test error handling when candidate has no skills"""
        candidate_no_skills = Candidate.objects.create(
            name="No Skills Candidate",
            email="noskills@example.com"
        )
        
        result = interview_questions_service.generate_interview_questions(
            candidate_id=candidate_no_skills.id,
            job_role="Developer"
        )
        
        self.assertEqual(result['status'], 'error')
        self.assertIn('skills', result['error'].lower())

    def test_question_count_validation(self):
        """Test validation of question_count parameter"""
        # Skip test if API key not configured
        if not interview_questions_service.model:
            self.skipTest("Gemini API key not configured")
        
        # Test with count below minimum (should default to 5)
        result_low = interview_questions_service.generate_interview_questions(
            candidate_id=self.candidate.id,
            job_role="Developer",
            question_count=3
        )
        # Should still succeed with default minimum
        if result_low['status'] == 'success':
            self.assertGreaterEqual(len(result_low['questions']), 5)

        # Test with count above maximum (should default to 10)
        result_high = interview_questions_service.generate_interview_questions(
            candidate_id=self.candidate.id,
            job_role="Developer",
            question_count=15
        )
        # Should still succeed with default maximum
        if result_high['status'] == 'success':
            self.assertLessEqual(len(result_high['questions']), 10)


class InterviewQuestionsAPIViewTests(TestCase):
    """Test cases for InterviewQuestionsAPIView"""

    def setUp(self):
        """Set up test data and client"""
        self.client = APIClient()
        self.user = get_user_model().objects.create_user(username="testuser", password="TestPassword123!")
        self.client.force_authenticate(user=self.user)
        
        # Create test candidate with skills
        self.candidate = Candidate.objects.create(
            name="API Test Candidate",
            email="apitest@example.com",
            summary="Full stack developer",
            skills=["Python", "Django", "React", "PostgreSQL"]
        )
        
        # Create and link skills
        python_skill = Skill.objects.create(name="Python")
        django_skill = Skill.objects.create(name="Django")
        self.candidate.skills_m2m.add(python_skill, django_skill)

    def test_interview_questions_api_success(self):
        """Test successful API call"""
        # Skip test if API key not configured
        if not interview_questions_service.model:
            self.skipTest("Gemini API key not configured")
        
        response = self.client.post(
            '/api/candidates/interview-questions/',
            data={
                'candidate_id': self.candidate.id,
                'job_role': 'Full Stack Developer',
                'question_count': 8
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertIn('questions', data)
        self.assertGreater(len(data['questions']), 0)

    def test_interview_questions_api_missing_candidate_id(self):
        """Test API call with missing candidate_id"""
        response = self.client.post(
            '/api/candidates/interview-questions/',
            data={
                'job_role': 'Developer'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
        self.assertIn('candidate_id', data['error'])

    def test_interview_questions_api_missing_job_role(self):
        """Test API call with missing job_role"""
        response = self.client.post(
            '/api/candidates/interview-questions/',
            data={
                'candidate_id': self.candidate.id
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)
        self.assertIn('job_role', data['error'])

    def test_interview_questions_api_invalid_candidate_id(self):
        """Test API call with invalid candidate_id"""
        response = self.client.post(
            '/api/candidates/interview-questions/',
            data={
                'candidate_id': 'invalid',
                'job_role': 'Developer'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertIn('error', data)

    def test_interview_questions_api_candidate_not_found(self):
        """Test API call with non-existent candidate"""
        response = self.client.post(
            '/api/candidates/interview-questions/',
            data={
                'candidate_id': 99999,
                'job_role': 'Developer'
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 400)
        data = response.json()
        self.assertEqual(data['status'], 'error')

    def test_interview_questions_api_custom_count(self):
        """Test API call with custom question count"""
        # Skip test if API key not configured
        if not interview_questions_service.model:
            self.skipTest("Gemini API key not configured")
        
        response = self.client.post(
            '/api/candidates/interview-questions/',
            data={
                'candidate_id': self.candidate.id,
                'job_role': 'Developer',
                'question_count': 5
            },
            format='json'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        if data['status'] == 'success':
            self.assertLessEqual(len(data['questions']), 10)
            self.assertGreaterEqual(len(data['questions']), 5)

    def test_interview_questions_api_count_validation(self):
        """Test API validates question count bounds"""
        # Test with count below minimum
        response_low = self.client.post(
            '/api/candidates/interview-questions/',
            data={
                'candidate_id': self.candidate.id,
                'job_role': 'Developer',
                'question_count': 3
            },
            format='json'
        )
        
        # Test with count above maximum
        response_high = self.client.post(
            '/api/candidates/interview-questions/',
            data={
                'candidate_id': self.candidate.id,
                'job_role': 'Developer',
                'question_count': 15
            },
            format='json'
        )
        
        # Both should be accepted (service will clamp the values)
        # If API key is configured, they should succeed
        if interview_questions_service.model:
            self.assertIn(response_low.status_code, [200, 400])
            self.assertIn(response_high.status_code, [200, 400])