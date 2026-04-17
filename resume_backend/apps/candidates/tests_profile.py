from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.candidates.models import Candidate, Skill

class CandidateProfileTests(TestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model
        self.User = get_user_model()
        self.user = self.User.objects.create_user(
            username="tester",
            password="pass1234",
            role="admin",
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # Create a candidate with all requested fields
        self.candidate = Candidate.objects.create(
            name="John Doe",
            email="john@example.com",
            phone="1234567890",
            location="New York",
            experience_years=5.5,
            summary="Experienced developer",
            status="interview",
            skills=["Python", "Django"],
            education=[{"degree": "BS CS", "school": "NYU"}],
            experience=[{"role": "Dev", "company": "Tech Corp", "duration": "3 years"}]
        )
        
    def test_candidate_profile_fields(self):
        url = reverse("candidate-detail", kwargs={"pk": self.candidate.id})
        # Note: the router might prefix with api/ depending on settings, 
        # but reverse handles it if name is correct.
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.data
        self.assertEqual(data["name"], "John Doe")
        self.assertEqual(data["email"], "john@example.com")
        self.assertEqual(data["phone"], "1234567890")
        self.assertEqual(data["location"], "New York")
        self.assertEqual(data["experience_years"], 5.5)
        self.assertEqual(data["summary"], "Experienced developer")
        self.assertEqual(data["status"], "interview")
        self.assertEqual(data["skills"], ["Python", "Django"])
        self.assertEqual(data["education"], [{"degree": "BS CS", "school": "NYU"}])
        self.assertEqual(data["experience"], [{"role": "Dev", "company": "Tech Corp", "duration": "3 years"}])
        self.assertIn("resumes", data)
