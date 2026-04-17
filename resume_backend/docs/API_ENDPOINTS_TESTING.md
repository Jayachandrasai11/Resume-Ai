# Resume Similarity Detection - API Endpoints Testing Guide

## Overview

Complete guide to testing all API endpoints of the resume similarity detection system.

---

## 📋 All API Endpoints

| # | Endpoint | Method | Description |
|---|----------|--------|-------------|
| 1 | `/api/candidates/similarity-check/` | POST | Check if resume is similar to existing ones |
| 2 | `/api/candidates/{candidate_id}/similar/` | GET | Find candidates similar to specific candidate |
| 3 | `/api/candidates/similarity-statistics/` | GET | Get similarity statistics |
| 4 | `/api/candidates/mark-duplicates/` | POST | Mark candidates as duplicates |

---

## 🔧 Prerequisites

### Start Django Server

```bash
cd d:\PFS\project\Project1\resume_backend
..\..\.venv\Scripts\activate
python manage.py runserver
```

**Expected Output:**
```
Starting development server at http://127.0.0.1:8000/
```

### Verify Server is Running

Open browser: `http://127.0.0.1:8000/api/candidates/similarity-statistics/`

Should return JSON with statistics.

---

## 🧪 Testing Methods

### Method 1: Using cURL (Terminal)

### Method 2: Using Browser DevTools

### Method 3: Using Python requests

---

## 📡 Endpoint 1: Similarity Check

### URL
```
POST /api/candidates/similarity-check/
```

### Purpose
Check if a resume is similar to existing resumes in the database.

### Request Body (Option A: Using Resume Text)

```json
{
  "resume_text": "John Doe - Senior Python Developer with 8 years of experience in Django, Flask, PostgreSQL, and AWS. Expert in building scalable web applications, REST APIs, and microservices architecture.",
  "threshold": 0.90,
  "limit": 5,
  "distance_metric": "cosine"
}
```

### Request Body (Option B: Using Resume ID)

```json
{
  "resume_id": 1,
  "threshold": 0.90,
  "limit": 5,
  "distance_metric": "cosine"
}
```

### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `resume_text` | string | No* | - | Full text of the resume (required if resume_id not provided) |
| `resume_id` | integer | No* | - | ID of existing resume (required if resume_text not provided) |
| `threshold` | float | No | 0.90 | Similarity threshold (0.0 to 1.0) |
| `limit` | integer | No | 5 | Max number of similar candidates (1-20) |
| `distance_metric` | string | No | 'cosine' | Distance metric: 'cosine' or 'l2' |

*Either resume_text or resume_id must be provided

### Test with cURL

```bash
curl -X POST http://127.0.0.1:8000/api/candidates/similarity-check/ \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "John Doe - Python Developer with 5 years experience in Django, Flask, and PostgreSQL. Skilled in REST API development and cloud deployment.",
    "threshold": 0.90,
    "limit": 5
  }'
```

### Test with Python

```python
import requests
import json

url = "http://127.0.0.1:8000/api/candidates/similarity-check/"
data = {
    "resume_text": "John Doe - Python Developer with 5 years experience...",
    "threshold": 0.90,
    "limit": 5
}

response = requests.post(url, json=data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
```

### Test in Browser Console

```javascript
fetch('http://127.0.0.1:8000/api/candidates/similarity-check/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    resume_text: 'John Doe - Python Developer with 5 years experience...',
    threshold: 0.90,
    limit: 5
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Expected Response

```json
{
  "is_duplicate": false,
  "similar_candidates": [
    {
      "candidate_id": 1,
      "candidate_name": "John Smith",
      "candidate_email": "john.smith@example.com",
      "similarity_score": 0.85,
      "chunks_compared": 12,
      "is_duplicate": false,
      "is_similar": true
    },
    {
      "candidate_id": 2,
      "candidate_name": "Jane Doe",
      "candidate_email": "jane.doe@example.com",
      "similarity_score": 0.78,
      "chunks_compared": 10,
      "is_duplicate": false,
      "is_similar": true
    }
  ],
  "max_similarity": 0.85,
  "total_candidates_checked": 95
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `is_duplicate` | boolean | Whether a duplicate was detected (similarity > 0.90) |
| `similar_candidates` | array | List of similar candidates |
| `max_similarity` | float | Highest similarity score found |
| `total_candidates_checked` | integer | Number of candidates compared against |

### Similar Candidate Fields

| Field | Type | Description |
|-------|------|-------------|
| `candidate_id` | integer | ID of the similar candidate |
| `candidate_name` | string | Name of the similar candidate |
| `candidate_email` | string | Email of the similar candidate |
| `similarity_score` | float | Similarity score (0.0 to 1.0) |
| `chunks_compared` | integer | Number of resume chunks compared |
| `is_duplicate` | boolean | Whether this is a duplicate (>0.90) |
| `is_similar` | boolean | Whether this is similar (>0.75) |

---

## 📡 Endpoint 2: Find Similar Candidates

### URL
```
GET /api/candidates/{candidate_id}/similar/
```

### Purpose
Find candidates similar to a specific candidate.

### URL Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `candidate_id` | integer | Yes | - | ID of the candidate to find similar ones for |
| `threshold` | float | No | 0.75 | Minimum similarity threshold (0.0 to 1.0) |
| `limit` | integer | No | 5 | Maximum number of results (1-20) |

### Test with cURL

```bash
curl "http://127.0.0.1:8000/api/candidates/1/similar/?threshold=0.80&limit=10"
```

### Test with Python

```python
import requests
import json

candidate_id = 1
threshold = 0.80
limit = 10

url = f"http://127.0.0.1:8000/api/candidates/{candidate_id}/similar/"
params = {
    'threshold': threshold,
    'limit': limit
}

response = requests.get(url, params=params)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
```

### Test in Browser

Open this URL in browser:
```
http://127.0.0.1:8000/api/candidates/1/similar/?threshold=0.80&limit=10
```

### Expected Response

```json
{
  "candidate_id": 1,
  "similar_candidates": [
    {
      "candidate_id": 2,
      "candidate_name": "John Smith",
      "candidate_email": "john.smith@example.com",
      "similarity_score": 0.85,
      "chunks_compared": 12,
      "is_duplicate": false,
      "is_similar": true
    },
    {
      "candidate_id": 3,
      "candidate_name": "Jane Doe",
      "candidate_email": "jane.doe@example.com",
      "similarity_score": 0.82,
      "chunks_compared": 15,
      "is_duplicate": false,
      "is_similar": true
    }
  ],
  "count": 2
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `candidate_id` | integer | Original candidate ID |
| `similar_candidates` | array | List of similar candidates |
| `count` | integer | Number of similar candidates found |

---

## 📡 Endpoint 3: Similarity Statistics

### URL
```
GET /api/candidates/similarity-statistics/
```

### Purpose
Get statistics about resume embeddings and similarity coverage in the database.

### Request Parameters

None

### Test with cURL

```bash
curl http://127.0.0.1:8000/api/candidates/similarity-statistics/
```

### Test with Python

```python
import requests
import json

url = "http://127.0.0.1:8000/api/candidates/similarity-statistics/"

response = requests.get(url)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
```

### Test in Browser

Open this URL:
```
http://127.0.0.1:8000/api/candidates/similarity-statistics/
```

### Expected Response

```json
{
  "total_candidates": 100,
  "candidates_with_embeddings": 95,
  "total_resume_chunks": 1500,
  "chunks_with_embeddings": 1425,
  "embedding_coverage": "95.00%"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `total_candidates` | integer | Total number of candidates in database |
| `candidates_with_embeddings` | integer | Candidates with at least one embedding |
| `total_resume_chunks` | integer | Total resume chunks in database |
| `chunks_with_embeddings` | integer | Chunks with embeddings generated |
| `embedding_coverage` | string | Percentage of chunks with embeddings |

---

## 📡 Endpoint 4: Mark Duplicates

### URL
```
POST /api/candidates/mark-duplicates/
```

### Purpose
Mark specified candidates as duplicates of a given resume.

### Request Body

```json
{
  "resume_id": 123,
  "similar_candidate_ids": [1, 2, 3]
}
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `resume_id` | integer | Yes | ID of the resume to mark as original |
| `similar_candidate_ids` | array | Yes | List of candidate IDs to mark as duplicates |

### Test with cURL

```bash
curl -X POST http://127.0.0.1:8000/api/candidates/mark-duplicates/ \
  -H "Content-Type: application/json" \
  -d '{
    "resume_id": 1,
    "similar_candidate_ids": [2, 3, 4]
  }'
```

### Test with Python

```python
import requests
import json

url = "http://127.0.0.1:8000/api/candidates/mark-duplicates/"
data = {
    "resume_id": 1,
    "similar_candidate_ids": [2, 3, 4]
}

response = requests.post(url, json=data)
print(f"Status: {response.status_code}")
print(f"Response: {json.dumps(response.json(), indent=2)}")
```

### Test in Browser Console

```javascript
fetch('http://127.0.0.1:8000/api/candidates/mark-duplicates/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    resume_id: 1,
    similar_candidate_ids: [2, 3, 4]
  })
})
.then(response => response.json())
.then(data => console.log(data))
.catch(error => console.error('Error:', error));
```

### Expected Response

```json
{
  "marked_count": 3,
  "results": [
    {
      "resume_id": 456,
      "file_name": "similar_resume_1.pdf",
      "candidate_id": 2,
      "marked_as_duplicate": true
    },
    {
      "resume_id": 789,
      "file_name": "similar_resume_2.pdf",
      "candidate_id": 3,
      "marked_as_duplicate": true
    },
    {
      "resume_id": 1011,
      "file_name": "similar_resume_3.pdf",
      "candidate_id": 4,
      "marked_as_duplicate": true
    }
  ]
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `marked_count` | integer | Number of resumes marked as duplicates |
| `results` | array | Details of marked resumes |

---

## 🧪 Complete Testing Script

### Python Test Script

```python
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

def test_similarity_statistics():
    """Test 1: Get similarity statistics"""
    print("\n" + "="*60)
    print("TEST 1: Similarity Statistics")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/api/candidates/similarity-statistics/")
    print(f"Status: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")

def test_similarity_check():
    """Test 2: Check resume similarity"""
    print("\n" + "="*60)
    print("TEST 2: Similarity Check")
    print("="*60)
    
    data = {
        "resume_text": "John Doe - Python Developer with 5 years experience in Django, Flask, and PostgreSQL. Expert in building scalable web applications and REST APIs.",
        "threshold": 0.90,
        "limit": 5
    }
    
    response = requests.post(f"{BASE_URL}/api/candidates/similarity-check/", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")

def test_find_similar():
    """Test 3: Find similar candidates"""
    print("\n" + "="*60)
    print("TEST 3: Find Similar Candidates")
    print("="*60)
    
    candidate_id = 1
    params = {
        'threshold': 0.75,
        'limit': 5
    }
    
    response = requests.get(f"{BASE_URL}/api/candidates/{candidate_id}/similar/", params=params)
    print(f"Status: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")

def test_mark_duplicates():
    """Test 4: Mark duplicates"""
    print("\n" + "="*60)
    print("TEST 4: Mark Duplicates")
    print("="*60)
    
    data = {
        "resume_id": 1,
        "similar_candidate_ids": [2, 3]
    }
    
    response = requests.post(f"{BASE_URL}/api/candidates/mark-duplicates/", json=data)
    print(f"Status: {response.status_code}")
    print(f"Response:\n{json.dumps(response.json(), indent=2)}")

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("TESTING ALL SIMILARITY DETECTION API ENDPOINTS")
    print("="*60)
    
    try:
        test_similarity_statistics()
        test_similarity_check()
        test_find_similar()
        test_mark_duplicates()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("="*60)
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()
```

### Run the Test Script

```bash
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe test_similarity_api.py
```

---

## 🌐 Browser Testing Interface

### Create Test HTML Page

```html
<!DOCTYPE html>
<html>
<head>
    <title>Similarity Detection API Test</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        .test-section {
            border: 1px solid #ddd;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        button {
            padding: 10px 20px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin: 5px;
        }
        .output {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 4px;
            margin-top: 10px;
            font-family: monospace;
            white-space: pre-wrap;
            max-height: 400px;
            overflow-y: auto;
        }
    </style>
</head>
<body>
    <h1>📡 Resume Similarity Detection API Test</h1>
    
    <div class="test-section">
        <h2>1. Similarity Statistics</h2>
        <button onclick="testStatistics()">Test Statistics</button>
        <div id="stats-output" class="output"></div>
    </div>
    
    <div class="test-section">
        <h2>2. Similarity Check</h2>
        <button onclick="testSimilarityCheck()">Test Similarity Check</button>
        <div id="similarity-output" class="output"></div>
    </div>
    
    <div class="test-section">
        <h2>3. Find Similar Candidates</h2>
        <input type="number" id="candidateId" value="1" placeholder="Candidate ID">
        <button onclick="testFindSimilar()">Test Find Similar</button>
        <div id="find-similar-output" class="output"></div>
    </div>
    
    <div class="test-section">
        <h2>4. Mark Duplicates</h2>
        <input type="number" id="resumeId" value="1" placeholder="Resume ID">
        <input type="text" id="candidateIds" value="2,3" placeholder="Candidate IDs (comma-separated)">
        <button onclick="testMarkDuplicates()">Test Mark Duplicates</button>
        <div id="mark-duplicates-output" class="output"></div>
    </div>

    <script>
        const BASE_URL = 'http://127.0.0.1:8000';

        async function testStatistics() {
            const output = document.getElementById('stats-output');
            output.textContent = 'Loading...';
            
            try {
                const response = await fetch(`${BASE_URL}/api/candidates/similarity-statistics/`);
                const data = await response.json();
                output.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
            }
        }

        async function testSimilarityCheck() {
            const output = document.getElementById('similarity-output');
            output.textContent = 'Loading...';
            
            try {
                const response = await fetch(`${BASE_URL}/api/candidates/similarity-check/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resume_text: 'John Doe - Python Developer with 5 years experience in Django and Flask.',
                        threshold: 0.90,
                        limit: 5
                    })
                });
                const data = await response.json();
                output.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
            }
        }

        async function testFindSimilar() {
            const candidateId = document.getElementById('candidateId').value;
            const output = document.getElementById('find-similar-output');
            output.textContent = 'Loading...';
            
            try {
                const response = await fetch(`${BASE_URL}/api/candidates/${candidateId}/similar/?threshold=0.75&limit=10`);
                const data = await response.json();
                output.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
            }
        }

        async function testMarkDuplicates() {
            const resumeId = document.getElementById('resumeId').value;
            const candidateIds = document.getElementById('candidateIds').value.split(',').map(id => parseInt(id.trim()));
            const output = document.getElementById('mark-duplicates-output');
            output.textContent = 'Loading...';
            
            try {
                const response = await fetch(`${BASE_URL}/api/candidates/mark-duplicates/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        resume_id: parseInt(resumeId),
                        similar_candidate_ids: candidateIds
                    })
                });
                const data = await response.json();
                output.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                output.textContent = `Error: ${error.message}`;
            }
        }
    </script>
</body>
</html>
```

---

## 📊 Quick Reference Card

### All Endpoints

```
POST   /api/candidates/similarity-check/
GET    /api/candidates/{id}/similar/
GET    /api/candidates/similarity-statistics/
POST   /api/candidates/mark-duplicates/
```

### Quick Commands

```bash
# Statistics
curl http://localhost:8000/api/candidates/similarity-statistics/

# Similarity check
curl -X POST http://localhost:8000/api/candidates/similarity-check/ \
  -H "Content-Type: application/json" \
  -d '{"resume_text": "test", "threshold": 0.90}'

# Find similar
curl http://localhost:8000/api/candidates/1/similar/

# Mark duplicates
curl -X POST http://localhost:8000/api/candidates/mark-duplicates/ \
  -H "Content-Type: application/json" \
  -d '{"resume_id": 1, "similar_candidate_ids": [2,3]}'
```

---

## ✅ Testing Checklist

### Endpoint 1: Similarity Check
- [ ] Server is running
- [ ] Endpoint responds to POST request
- [ ] Accepts resume_text parameter
- [ ] Accepts resume_id parameter
- [ ] Returns is_duplicate boolean
- [ ] Returns similar_candidates array
- [ ] Returns max_similarity score
- [ ] Returns total_candidates_checked

### Endpoint 2: Find Similar Candidates
- [ ] Endpoint responds to GET request
- [ ] Accepts candidate_id in URL
- [ ] Accepts threshold parameter
- [ ] Accepts limit parameter
- [ ] Returns similar candidates array
- [ ] Returns count of similar candidates

### Endpoint 3: Similarity Statistics
- [ ] Endpoint responds to GET request
- [ ] Returns total_candidates count
- [ ] Returns candidates_with_embeddings count
- [ ] Returns total_resume_chunks count
- [ ] Returns chunks_with_embeddings count
- [ ] Returns embedding_coverage percentage

### Endpoint 4: Mark Duplicates
- [ ] Endpoint responds to POST request
- [ ] Accepts resume_id parameter
- [ ] Accepts similar_candidate_ids array
- [ ] Returns marked_count
- [ ] Returns results array with details

---

## 🐛 Troubleshooting

### Issue: 404 Not Found

**Solution:**
- Check URL is correct
- Verify endpoints are registered in urls.py
- Restart Django server

### Issue: 500 Internal Server Error

**Solution:**
- Check Django logs for error details
- Verify database is accessible
- Check embeddings are generated

### Issue: No similar candidates found

**Solution:**
- Check if embeddings exist in database
- Lower threshold for testing
- Verify resume text is not empty

### Issue: CORS errors

**Solution:**
- Add CORS middleware if testing from different origin
- Use same-origin requests for testing

---

## 📝 Example Usage Scenarios

### Scenario 1: Check Before Upload

```python
# Before uploading new resume
result = check_similarity(resume_text)

if result['is_duplicate']:
    print("Duplicate detected!")
    print(f"Similar to: {result['similar_candidates'][0]['candidate_name']}")
    print(f"Similarity: {result['max_similarity']:.2%}")
else:
    print("No duplicate found. Proceeding with upload...")
```

### Scenario 2: Find Alternatives

```python
# When candidate declines, find similar ones
similar = find_similar_candidates(candidate_id=1, threshold=0.80)

print(f"Found {len(similar)} similar candidates:")
for candidate in similar:
    print(f"  - {candidate['candidate_name']}: {candidate['similarity_score']:.2%}")
```

### Scenario 3: Audit Database

```python
# Check database statistics
stats = get_similarity_statistics()

print(f"Total candidates: {stats['total_candidates']}")
print(f"Coverage: {stats['embedding_coverage']}")

if float(stats['embedding_coverage'].rstrip('%')) < 80:
    print("Warning: Low embedding coverage!")
```

---

## 🎉 Ready to Test!

**Start testing now:**

1. **Start server:**
   ```bash
   python manage.py runserver
   ```

2. **Test statistics:**
   ```bash
   curl http://localhost:8000/api/candidates/similarity-statistics/
   ```

3. **Test similarity check:**
   ```bash
   curl -X POST http://localhost:8000/api/candidates/similarity-check/ \
     -H "Content-Type: application/json" \
     -d '{"resume_text": "test", "threshold": 0.90}'
   ```

**All endpoints are ready to use!** 🚀