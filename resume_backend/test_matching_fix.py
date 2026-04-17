#!/usr/bin/env python
"""
Test script to verify the matching fix works correctly.
Tests that Java job descriptions filter out Python-only candidates.
"""
import os
import sys
import django
import io

# Fix Windows console encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'Project1', 'resume_backend'))
django.setup()

from apps.ranking.services.matching_engine import MatchingEngine
from apps.candidates.models import Candidate
from apps.jd_app.models import JobDescription


def test_skill_extraction():
    """Test skill extraction from job description"""
    engine = MatchingEngine()
    
    # Test Java job description
    java_jd = """
    We are looking for a Senior Java Developer.
    Requirements:
    - 5+ years of experience with Java
    - Strong knowledge of Spring Boot
    - Experience with microservices
    - J2EE, Hibernate, REST APIs
    """
    
    skills = engine._extract_skills_from_text(java_jd)
    print(f"\n=== Test 1: Skill Extraction ===")
    print(f"Java JD Skills: {skills}")
    
    # Check that Java-related skills are extracted
    java_found = 'java' in skills
    spring_found = 'spring' in skills or 'spring boot' in skills
    print(f"Java extracted: {java_found}")
    print(f"Spring extracted: {spring_found}")
    
    # Test Python job description
    python_jd = """
    Python Developer needed.
    Requirements:
    - 3+ years Python experience
    - Django or Flask
    - REST APIs
    - SQL databases
    """
    
    py_skills = engine._extract_skills_from_text(python_jd)
    print(f"\nPython JD Skills: {py_skills}")
    
    python_found = 'python' in py_skills
    django_found = 'django' in py_skills or 'flask' in py_skills
    print(f"Python extracted: {python_found}")
    print(f"Django/Flask extracted: {django_found}")
    
    return java_found and spring_found and python_found


def test_matching():
    """Test actual matching with Java job"""
    engine = MatchingEngine()
    
    # Test with a Java job description
    java_jd = """
    Senior Java Developer
    Requirements:
    - Java programming (5+ years)
    - Spring Boot
    - Microservices
    - J2EE
    - Hibernate
    - REST API development
    """
    
    print(f"\n=== Test 2: Java Job Matching ===")
    print(f"Job Description: {java_jd[:100]}...")
    
    # Get matching candidates
    results = engine.match_candidates(
        job_description=java_jd,
        limit=10,
        threshold=0.3,
        strategy='cosine',
        include_details=True,
        mode='semantic'
    )
    
    print(f"\nFound {len(results)} candidates")
    
    if results:
        print(f"\nTop 5 matches:")
        for i, result in enumerate(results[:5]):
            skills = result.get('skills', '')
            candidate_name = result.get('candidate_name', 'Unknown')
            score = result.get('similarity_score', 0)
            # Handle both string and list skills
            skills_str = str(skills) if isinstance(skills, list) else skills
            print(f"  {i+1}. {candidate_name} (score: {score:.3f})")
            print(f"      Skills: {skills_str[:100]}...")
        
        # Verify that Python-only candidates are NOT in Java job results
        # Use assertions instead of conditionals for proper testing
        def check_python_only(r):
            """Check if a candidate is Python-only (no Java skills)"""
            s = r.get('skills', '')
            s_str = str(s) if isinstance(s, list) else s
            return 'python' in s_str.lower() and 'java' not in s_str.lower()
        
        python_only_candidates = [
            result for result in results[:5]
            if check_python_only(result)
        ]
        
        # Assert that no Python-only candidates are in Java job results
        # This replaces the conditional check with an actual assertion
        assert len(python_only_candidates) == 0, (
            f"Found {len(python_only_candidates)} Python-only candidates in Java job results. "
            f"These should be filtered out. Candidates: {[r.get('candidate_name') for r in python_only_candidates]}"
        )
        print(f"      ✓ Verified: No Python-only candidates in Java job matches")
    else:
        print("No candidates found - this might indicate the filter is too strict")
    
    return results


def main():
    print("=" * 60)
    print("Testing Matching Engine Fix")
    print("=" * 60)
    
    # Run skill extraction test
    skill_test_passed = test_skill_extraction()
    
    # Run matching test
    matching_results = test_matching()
    
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    print(f"Skill Extraction Test: {'PASSED' if skill_test_passed else 'FAILED'}")
    print(f"Matching Test: {'PASSED' if matching_results else 'FAILED'}")
    
    if skill_test_passed and matching_results:
        print("\n✓ All tests passed! The matching fix is working correctly.")
        return 0
    else:
        print("\n✗ Some tests failed. Please check the matching engine.")
        return 1


if __name__ == '__main__':
    sys.exit(main())