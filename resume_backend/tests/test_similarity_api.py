"""
Quick test script for all similarity detection API endpoints.
Run this to verify all endpoints are working correctly.
"""

import requests
import json
from datetime import datetime

BASE_URL = "http://127.0.0.1:8000"

def print_header(text):
    """Print formatted header."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70)

def print_success(message):
    """Print success message."""
    print(f"✅ {message}")

def print_error(message):
    """Print error message."""
    print(f"❌ {message}")

def print_info(message):
    """Print info message."""
    print(f"ℹ️  {message}")

def test_endpoint(name, url, method='GET', data=None, params=None):
    """Test an API endpoint."""
    print(f"\nTesting: {name}")
    print(f"URL: {url}")
    print(f"Method: {method}")
    
    try:
        if method == 'GET':
            response = requests.get(url, params=params, timeout=10)
        elif method == 'POST':
            response = requests.post(url, json=data, timeout=10)
        else:
            raise ValueError(f"Unsupported method: {method}")
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            print_success("Request successful!")
            
            try:
                result = response.json()
                print(f"\nResponse:")
                print(json.dumps(result, indent=2))
                return True, result
            except ValueError:
                print(f"Response: {response.text}")
                return True, response.text
                
        else:
            print_error(f"Request failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data}")
            except:
                print(f"Response: {response.text}")
            return False, None
            
    except requests.exceptions.ConnectionError:
        print_error("Connection refused - is Django server running?")
        return False, None
    except requests.exceptions.Timeout:
        print_error("Request timed out")
        return False, None
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        return False, None

def test_statistics():
    """Test 1: Similarity Statistics"""
    print_header("TEST 1: Similarity Statistics")
    
    success, result = test_endpoint(
        "Similarity Statistics",
        f"{BASE_URL}/api/candidates/similarity-statistics/",
        method='GET'
    )
    
    if success:
        print_info(f"Total candidates: {result.get('total_candidates', 0)}")
        print_info(f"Coverage: {result.get('embedding_coverage', '0%')}")
    
    return success

def test_similarity_check():
    """Test 2: Similarity Check"""
    print_header("TEST 2: Similarity Check")
    
    # Test with sample resume text
    data = {
        "resume_text": "John Doe - Senior Python Developer with 8 years of experience. Expert in Django, Flask, PostgreSQL, and AWS. Skilled in building scalable web applications and REST APIs.",
        "threshold": 0.90,
        "limit": 5
    }
    
    success, result = test_endpoint(
        "Similarity Check",
        f"{BASE_URL}/api/candidates/similarity-check/",
        method='POST',
        data=data
    )
    
    if success:
        is_duplicate = result.get('is_duplicate', False)
        max_sim = result.get('max_similarity', 0)
        similar_count = len(result.get('similar_candidates', []))
        
        print_info(f"Is duplicate: {is_duplicate}")
        print_info(f"Max similarity: {max_sim:.4f}")
        print_info(f"Similar candidates found: {similar_count}")
    
    return success

def test_find_similar():
    """Test 3: Find Similar Candidates"""
    print_header("TEST 3: Find Similar Candidates")
    
    # Try to find similar candidates for candidate ID 1
    candidate_id = 1
    params = {
        'threshold': 0.75,
        'limit': 10
    }
    
    success, result = test_endpoint(
        f"Find Similar Candidates (ID: {candidate_id})",
        f"{BASE_URL}/api/candidates/{candidate_id}/similar/",
        method='GET',
        params=params
    )
    
    if success:
        similar_count = result.get('count', 0)
        print_info(f"Candidate ID: {candidate_id}")
        print_info(f"Similar candidates found: {similar_count}")
        
        if similar_count > 0:
            print_info(f"Top similarity: {result['similar_candidates'][0]['similarity_score']:.4f}")
    
    return success

def test_mark_duplicates():
    """Test 4: Mark Duplicates"""
    print_header("TEST 4: Mark Duplicates")
    
    # Test marking candidate IDs 2 and 3 as duplicates of resume 1
    data = {
        "resume_id": 1,
        "similar_candidate_ids": [2, 3]
    }
    
    success, result = test_endpoint(
        "Mark Duplicates",
        f"{BASE_URL}/api/candidates/mark-duplicates/",
        method='POST',
        data=data
    )
    
    if success:
        marked_count = result.get('marked_count', 0)
        print_info(f"Resumes marked: {marked_count}")
    
    return success

def run_all_tests():
    """Run all API tests."""
    print_header("RESUME SIMILARITY DETECTION - API ENDPOINT TESTS")
    print(f"Base URL: {BASE_URL}")
    print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    results = {
        'statistics': test_statistics(),
        'similarity_check': test_similarity_check(),
        'find_similar': test_find_similar(),
        'mark_duplicates': test_mark_duplicates()
    }
    
    # Print summary
    print_header("TEST SUMMARY")
    
    total_tests = len(results)
    passed_tests = sum(1 for success in results.values() if success)
    failed_tests = total_tests - passed_tests
    
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {passed_tests}")
    print(f"Failed: {failed_tests}")
    print()
    
    for test_name, success in results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"  {status}: {test_name}")
    
    print()
    
    if failed_tests == 0:
        print_success("ALL TESTS PASSED! ✅")
        print_info("All API endpoints are working correctly!")
    else:
        print_error(f"{failed_tests} TEST(S) FAILED! ❌")
        print_info("Please check the errors above and fix them.")
    
    print("=" * 70)
    
    return failed_tests == 0

if __name__ == "__main__":
    try:
        success = run_all_tests()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nTest cancelled by user.")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        exit(1)