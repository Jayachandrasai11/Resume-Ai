#!/usr/bin/env python
"""
Test script for the Hybrid Resume Parser

This script demonstrates the hybrid parser's capabilities:
1. Section detection
2. NLP entity extraction
3. Skill extraction
4. Experience extraction
"""

import os
import sys
import django
import logging

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Project1', 'resume_backend'))
django.setup()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test resume text
TEST_RESUME = """
John Doe
john.doe@example.com
+1 555-123-4567
San Francisco, CA

PROFESSIONAL SUMMARY
Senior Software Engineer with 5+ years of experience in Python, Django, and React.
Experienced in building scalable web applications and cloud deployment.

SKILLS
Python, Django, Flask, React, JavaScript, TypeScript, PostgreSQL, MongoDB
AWS, Docker, Kubernetes, Git, CI/CD, REST API, GraphQL

EXPERIENCE
Senior Software Engineer at TechCorp Inc. | Jan 2020 - Present
- Led development of microservices architecture
- Implemented CI/CD pipelines using Jenkins
- Mentored junior developers

Software Engineer at StartupXYZ | Jun 2017 - Dec 2019
- Built RESTful APIs using Python and Flask
- Worked with PostgreSQL and MongoDB databases

EDUCATION
Bachelor of Technology in Computer Science
University of California, Berkeley | 2017

PROJECTS
E-commerce Platform - Built a full-stack e-commerce solution using Django and React
"""


def test_hybrid_parser():
    """Test the hybrid parser with sample resume."""
    from apps.candidates.services.hybrid_parser import (
        parse_resume_hybrid,
        split_sections,
        extract_entities_nlp,
        extract_skills,
        extract_experience_years
    )
    from apps.candidates.services.skills import COMMON_SKILLS
    
    print("=" * 60)
    print("TESTING HYBRID RESUME PARSER")
    print("=" * 60)
    
    # Test 1: Section Detection
    print("\n1. SECTION DETECTION TEST")
    print("-" * 40)
    sections = split_sections(TEST_RESUME)
    for section, content in sections.items():
        if content:
            print(f"  {section.upper()}: {content[:50]}...")
    
    # Test 2: NLP Entity Extraction
    print("\n2. NLP ENTITY EXTRACTION TEST")
    print("-" * 40)
    entities = extract_entities_nlp(TEST_RESUME)
    print(f"  Name: {entities.get('name')}")
    print(f"  Organizations: {entities.get('organizations')}")
    print(f"  Locations: {entities.get('locations')}")
    print(f"  Dates: {entities.get('dates')}")
    
    # Test 3: Skill Extraction
    print("\n3. SKILL EXTRACTION TEST")
    print("-" * 40)
    skills = extract_skills(TEST_RESUME, COMMON_SKILLS)
    print(f"  Found {len(skills)} skills: {skills}")
    
    # Test 4: Experience Years Extraction
    print("\n4. EXPERIENCE YEARS EXTRACTION TEST")
    print("-" * 40)
    exp_years = extract_experience_years(TEST_RESUME)
    print(f"  Experience: {exp_years} years")
    
    # Test 5: Full Hybrid Parser
    print("\n5. FULL HYBRID PARSER TEST")
    print("-" * 40)
    result = parse_resume_hybrid(TEST_RESUME, COMMON_SKILLS)
    print(f"  Name: {result.get('Name')}")
    print(f"  Email: {result.get('Email')}")
    print(f"  Phone: {result.get('Phone')}")
    print(f"  Location: {result.get('Location')}")
    print(f"  Skills ({len(result.get('Skills', []))}): {result.get('Skills')}")
    print(f"  Experience Years: {result.get('ExperienceYears')}")
    print(f"  Experience: {result.get('Experience')}")
    print(f"  Education: {result.get('Education')}")
    print(f"  Summary: {result.get('Summary')[:100]}...")
    
    print("\n" + "=" * 60)
    print("TEST COMPLETE")
    print("=" * 60)


def test_with_real_resume():
    """Test with actual resume file."""
    from apps.candidates.utils import extract_text_from_pdf
    
    # Try to find a resume file
    resumes_dir = os.path.join(os.path.dirname(__file__), 'media', 'resumes')
    if os.path.exists(resumes_dir):
        pdf_files = [f for f in os.listdir(resumes_dir) if f.endswith('.pdf')]
        if pdf_files:
            pdf_path = os.path.join(resumes_dir, pdf_files[0])
            print(f"\nTesting with real resume: {pdf_files[0]}")
            
            text = extract_text_from_pdf(pdf_path)
            if text:
                from apps.candidates.services.hybrid_parser import parse_resume_hybrid
                from apps.candidates.services.skills import COMMON_SKILLS
                
                result = parse_resume_hybrid(text, COMMON_SKILLS)
                print(f"  Name: {result.get('Name')}")
                print(f"  Email: {result.get('Email')}")
                print(f"  Skills: {len(result.get('Skills', []))} found")
                print(f"  Experience: {result.get('ExperienceYears')} years")


if __name__ == '__main__':
    try:
        test_hybrid_parser()
        test_with_real_resume()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()