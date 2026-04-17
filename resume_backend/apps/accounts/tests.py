from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.db import IntegrityError
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
import os


User = get_user_model()


TEST_PASSWORD = os.environ.get("TEST_PASSWORD", "TestPass123!")


class CustomUserModelTests(TestCase):
    def test_str_includes_username_and_default_role(self):
        user = User.objects.create_user(username="alice", password=TEST_PASSWORD)
        # Default role should be 'recruiter'
        self.assertEqual(user.role, "recruiter")
        self.assertEqual(str(user), "alice (recruiter)")

    def test_default_role_is_recruiter_on_create(self):
        user = User.objects.create_user(username="bob", password=TEST_PASSWORD)
        self.assertEqual(user.role, "recruiter")

    def test_role_can_be_set_to_admin_and_persisted(self):
        user = User.objects.create_user(username="carol", password=TEST_PASSWORD, role="admin")
        self.assertEqual(user.role, "admin")
        self.assertEqual(str(user), "carol (admin)")
        # Update role to recruiter and ensure __str__ updates
        user.role = "recruiter"
        user.save()
        self.assertEqual(user.role, "recruiter")
        self.assertEqual(str(user), "carol (recruiter)")

    def test_invalid_role_choice_raises_validation_error(self):
        user = User(username="dave")
        user.set_password(TEST_PASSWORD)
        user.role = "invalid-role"
        with self.assertRaises(ValidationError):
            user.full_clean()  # Triggers model field validation including choices

    def test_username_uniqueness_enforced(self):
        User.objects.create_user(username="erin", password=TEST_PASSWORD)
        with self.assertRaises(IntegrityError):
            # Attempt to create another user with the same username should violate unique constraint
            User.objects.create_user(username="erin", password=TEST_PASSWORD)


class RegistrationViewTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse("register")

    def test_register_user_success(self):
        data = {
            "username": "test@example.com",
            "email": "test@example.com",
            "password": "TestPassword123!",
            "role": "recruiter",
            "full_name": "Test User",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        u = User.objects.get()
        # Login identifier is email
        self.assertEqual(u.username, "test@example.com")
        # Display name is stored separately
        self.assertEqual(u.first_name, "Test")
        self.assertEqual(u.last_name, "User")

    def test_register_user_missing_fields(self):
        data = {
            "username": "testuser"
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_register_rejects_weak_password(self):
        data = {
            "username": "weak@example.com",
            "email": "weak@example.com",
            "password": "weakpass",
            "role": "recruiter",
            "full_name": "Weak User",
        }
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)
