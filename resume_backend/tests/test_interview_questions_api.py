"""
Example script to test the Interview Questions API.
This demonstrates how to use the API endpoint to generate interview questions.
"""

import os
import sys
import django

# Setup Django environment
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

import requests
import json

# API Configuration
BASE_URL = "http://localhost:8000"
ENDPOINT = f"{BASE_URL}/api/candidates/interview-questions/"

def test_interview_questions_api():
    """
    Test the interview questions API with various scenarios.
    """
    
    print("=" * 60)
    print("Interview Questions API Test")
    print("=" * 60)
    print()
    
    # Test Case 1: Generate questions for a Python Developer
    print("Test 1: Generate questions for Python Developer")
    print("-" * 60)
    
    payload1 = {
        "candidate_id": 1,
        "job_role": "Senior Python Developer",
        "question_count": 8
    }
    
    try:
        response = requests.post(ENDPOINT, json=payload1)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data['status']}")
            print(f"Candidate: {data.get('candidate_name', 'N/A')}")
            print(f"Job Role: {data['job_role']}")
            print(f"Skills: {', '.join(data.get('skills', []))}")
            print(f"Questions Generated: {data['question_count']}")
            print()
            print("Questions:")
            for i, q in enumerate(data['questions'], 1):
                print(f"{i}. [{q['category']}] {q['question']}")
                print(f"   Skill: {q['skill_related']}")
                print()
        else:
            print(f"Error: {response.json()}")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server.")
        print("Make sure the Django server is running: python manage.py runserver")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    print()
    
    # Test Case 2: Generate questions for a DevOps Engineer
    print("Test 2: Generate questions for DevOps Engineer")
    print("-" * 60)
    
    payload2 = {
        "candidate_id": 2,
        "job_role": "DevOps Engineer",
        "question_count": 10
    }
    
    try:
        response = requests.post(ENDPOINT, json=payload2)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data['status']}")
            print(f"Candidate: {data.get('candidate_name', 'N/A')}")
            print(f"Job Role: {data['job_role']}")
            print(f"Questions Generated: {data['question_count']}")
            print()
            print("Sample Questions (first 3):")
            for i, q in enumerate(data['questions'][:3], 1):
                print(f"{i}. [{q['category']}] {q['question']}")
        else:
            print(f"Error: {response.json()}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    print()
    
    # Test Case 3: Test error handling - missing candidate_id
    print("Test 3: Error handling - missing candidate_id")
    print("-" * 60)
    
    payload3 = {
        "job_role": "Developer"
    }
    
    try:
        response = requests.post(ENDPOINT, json=payload3)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    print()
    
    # Test Case 4: Test error handling - missing job_role
    print("Test 4: Error handling - missing job_role")
    print("-" * 60)
    
    payload4 = {
        "candidate_id": 1
    }
    
    try:
        response = requests.post(ENDPOINT, json=payload4)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    print()
    
    # Test Case 5: Test with minimal questions (5)
    print("Test 5: Generate minimal questions (5)")
    print("-" * 60)
    
    payload5 = {
        "candidate_id": 1,
        "job_role": "Full Stack Developer",
        "question_count": 5
    }
    
    try:
        response = requests.post(ENDPOINT, json=payload5)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Status: {data['status']}")
            print(f"Questions Generated: {data['question_count']}")
            print()
            print("All Questions:")
            for i, q in enumerate(data['questions'], 1):
                print(f"{i}. {q['question']}")
        else:
            print(f"Error: {response.json()}")
    except Exception as e:
        print(f"Error: {str(e)}")
    
    print()
    print("=" * 60)
    print("Tests completed!")
    print("=" * 60)


def test_with_service_directly():
    """
    Test the interview questions service directly without HTTP.
    """
    from candidates.services.interview_questions import interview_questions_service
    from candidates.models import Candidate
    
    print()
    print("=" * 60)
    print("Direct Service Test")
    print("=" * 60)
    print()
    
    # Get a candidate
    candidates = Candidate.objects.all()
    if not candidates.exists():
        print("No candidates found in database.")
        print("Please upload some resumes first.")
        return
    
    candidate = candidates.first()
    print(f"Testing with candidate: {candidate.name}")
    print(f"Candidate ID: {candidate.id}")
    print()
    
    # Generate questions
    print("Generating interview questions...")
    result = interview_questions_service.generate_interview_questions(
        candidate_id=candidate.id,
        job_role="Software Developer",
        question_count=8
    )
    
    print()
    print("Result:")
    print(json.dumps(result, indent=2))
    
    print()
    print("=" * 60)


if __name__ == "__main__":
    print("Choose test mode:")
    print("1. HTTP API Test (requires running server)")
    print("2. Direct Service Test (no server needed)")
    print()
    
    choice = input("Enter choice (1 or 2): ").strip()
    
    if choice == "1":
        test_interview_questions_api()
    elif choice == "2":
        test_with_service_directly()
    else:
        print("Invalid choice. Running both tests...")
        print()
        test_with_service_directly()
        print()
        test_interview_questions_api()