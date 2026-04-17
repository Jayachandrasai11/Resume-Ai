from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient

from candidates.models import Candidate, Resume
from candidates.services.duplicate_checker import find_existing_candidate
from candidates.views import create_or_get_candidate


class DuplicateCheckerTests(TestCase):
    def test_find_existing_candidate_by_email(self):
        c = Candidate.objects.create(name="Alice", email="alice@example.com", phone="1234567890")
        found = find_existing_candidate("alice@example.com", None)
        self.assertEqual(found.id, c.id)

    def test_find_existing_candidate_by_phone_normalized(self):
        c = Candidate.objects.create(name="Bob", email="bob@example.com", phone="+91 98765-43210")
        found = find_existing_candidate(None, "98765 43210")
        self.assertEqual(found.id, c.id)

    def test_create_or_get_candidate_creates_new(self):
        parsed = {
            "Name": "Charlie",
            "Email": "charlie@example.com",
            "Phone": "555-111-2222",
            "Skills": ["Python"],
            "Education": [],
            "Experience Summary": [],
            "Projects": [],
        }
        candidate, created = create_or_get_candidate(parsed)
        self.assertTrue(created)
        self.assertEqual(candidate.email, "charlie@example.com")

    def test_create_or_get_candidate_reuses_existing(self):
        existing = Candidate.objects.create(
            name="Dana",
            email="dana@example.com",
            phone="9999999999",
        )
        parsed = {
            "Name": "Dana X",
            "Email": "dana@example.com",
            "Phone": "9999999999",
            "Skills": [],
            "Education": [],
            "Experience Summary": [],
            "Projects": [],
        }
        candidate, created = create_or_get_candidate(parsed)
        self.assertFalse(created)
        self.assertEqual(candidate.id, existing.id)


class ResumeUploadAPITests(TestCase):
    def setUp(self):
        from django.contrib.auth import get_user_model

        self.User = get_user_model()
        self.user = self.User.objects.create_user(
            username="tester",
            password="pass1234",
            role="admin",
        )
        self.client = APIClient()
        # authenticate without needing JWT setup in tests
        self.client.force_authenticate(user=self.user)

    def test_upload_creates_new_candidate_when_none_provided(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from unittest.mock import patch

        content = b"dummy pdf bytes"
        file = SimpleUploadedFile("eve.pdf", content, content_type="application/pdf")

        url = reverse("upload-resume")  # name defined in urls.py for /api/upload-resume/

        with patch("candidates.views.extract_text_from_pdf", return_value="Name: Eve\nEmail: eve@example.com\nPhone: 1234567890"), patch(
            "candidates.views.parse_resume",
            return_value={
                "Name": "Eve",
                "Email": "eve@example.com",
                "Phone": "1234567890",
                "Skills": [],
                "Education": [],
                "Experience Summary": [],
                "Projects": [],
            },
        ):
            response = self.client.post(url, {"resume": file}, format="multipart")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["status"], "new_candidate_created")
        candidate_id = response.data["candidate_id"]
        self.assertIsNotNone(candidate_id)
        self.assertEqual(Candidate.objects.count(), 1)
        self.assertEqual(Resume.objects.count(), 1)

    def test_upload_reuses_existing_candidate_on_duplicate(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from unittest.mock import patch

        content = b"dummy pdf bytes"
        file1 = SimpleUploadedFile("frank1.pdf", content, content_type="application/pdf")

        url = reverse("upload-resume")

        with patch("candidates.views.extract_text_from_pdf", return_value="Name: Frank\nEmail: frank@example.com\nPhone: 5551234567"), patch(
            "candidates.views.parse_resume",
            return_value={
                "Name": "Frank",
                "Email": "frank@example.com",
                "Phone": "5551234567",
                "Skills": [],
                "Education": [],
                "Experience Summary": [],
                "Projects": [],
            },
        ):
            # First upload
            r1 = self.client.post(url, {"resume": file1}, format="multipart")

        self.assertEqual(r1.status_code, 201)
        self.assertEqual(r1.data["status"], "new_candidate_created")
        candidate_id_1 = r1.data["candidate_id"]

        file2 = SimpleUploadedFile("frank2.pdf", content, content_type="application/pdf")

        with patch("candidates.views.extract_text_from_pdf", return_value="Name: Frank\nEmail: frank@example.com\nPhone: 5551234567"), patch(
            "candidates.views.parse_resume",
            return_value={
                "Name": "Frank",
                "Email": "frank@example.com",
                "Phone": "5551234567",
                "Skills": [],
                "Education": [],
                "Experience Summary": [],
                "Projects": [],
            },
        ):
            # Second upload with same email/phone
            r2 = self.client.post(url, {"resume": file2}, format="multipart")

        self.assertEqual(r2.status_code, 201)
        self.assertEqual(r2.data["status"], "existing_candidate")
        candidate_id_2 = r2.data["candidate_id"]

        self.assertEqual(candidate_id_1, candidate_id_2)
        self.assertEqual(Candidate.objects.count(), 1)
        self.assertEqual(Resume.objects.count(), 2)