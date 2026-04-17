# Resume Similarity Detection - Quick Start Guide

## Overview

Quick guide to using the resume similarity detection system to identify duplicate or similar resumes.

## Prerequisites

- Django server running
- PostgreSQL with pgvector extension
- Resume embeddings generated (384-dimensional vectors)
- Existing resumes in database

---

## Quick Test (2 Minutes)

### Step 1: Check Similarity Statistics

```bash
curl http://localhost:8000/api/candidates/similarity-statistics/
```

**Expected Response:**
```json
{
  "total_candidates": 100,
  "candidates_with_embeddings": 95,
  "total_resume_chunks": 1500,
  "chunks_with_embeddings": 1425,
  "embedding_coverage": "95.00%"
}
```

### Step 2: Check Resume Similarity

```bash
curl -X POST http://localhost:8000/api/candidates/similarity-check/ \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "John Doe - Python Developer with 5 years experience in Django, Flask, and PostgreSQL. Skilled in REST API development, database design, and cloud deployment.",
    "threshold": 0.90,
    "limit": 5
  }'
```

**Expected Response:**
```json
{
  "is_duplicate": false,
  "similar_candidates": [
    {
      "candidate_id": 1,
      "candidate_name": "John Smith",
      "candidate_email": "john@example.com",
      "similarity_score": 0.82,
      "chunks_compared": 12,
      "is_duplicate": false,
      "is_similar": true
    }
  ],
  "max_similarity": 0.82,
  "total_candidates_checked": 95
}
```

### Step 3: Find Similar Candidates

```bash
curl http://localhost:8000/api/candidates/1/similar/?threshold=0.80&limit=10
```

**Expected Response:**
```json
{
  "candidate_id": 1,
  "similar_candidates": [...],
  "count": 5
}
```

---

## API Endpoints Summary

### 1. Check Similarity
```
POST /api/candidates/similarity-check/
```

### 2. Find Similar Candidates
```
GET /api/candidates/{candidate_id}/similar/
```

### 3. Get Statistics
```
GET /api/candidates/similarity-statistics/
```

### 4. Mark Duplicates
```
POST /api/candidates/mark-duplicates/
```

---

## Python Usage

### Check Resume Similarity

```python
from candidates.services.similarity_detection import similarity_detection_service

# Check by resume text
result = similarity_detection_service.check_resume_similarity(
    resume_text="Your resume text here...",
    threshold=0.90,
    limit=5
)

if result['is_duplicate']:
    print("Duplicate detected!")
    for candidate in result['similar_candidates']:
        print(f"  - {candidate['candidate_name']}: {candidate['similarity_score']:.2%}")
else:
    print("No duplicate found")
```

### Find Similar Candidates

```python
# Find candidates similar to candidate ID 1
similar = similarity_detection_service.find_all_similar_candidates(
    candidate_id=1,
    threshold=0.75,
    limit=10
)

print(f"Found {len(similar)} similar candidates")
for candidate in similar:
    print(f"  - {candidate['candidate_name']}: {candidate['similarity_score']:.2%}")
```

### Get Statistics

```python
stats = similarity_detection_service.get_similarity_statistics()

print(f"Total candidates: {stats['total_candidates']}")
print(f"With embeddings: {stats['candidates_with_embeddings']}")
print(f"Coverage: {stats['embedding_coverage']}")
```

---

## Integration Examples

### Example 1: Resume Upload with Duplicate Check

```python
from candidates.services.similarity_detection import similarity_detection_service

def upload_resume_with_check(resume_text):
    # Check for duplicates
    result = similarity_detection_service.check_resume_similarity(
        resume_text=resume_text,
        threshold=0.90
    )
    
    if result['is_duplicate']:
        return {
            'status': 'duplicate',
            'similar_candidates': result['similar_candidates'],
            'max_similarity': result['max_similarity']
        }
    
    # Process normally
    # ... create candidate, generate embeddings, etc.
    return {'status': 'processed'}
```

### Example 2: Find Similar Candidates for Job Match

```python
def find_alternative_candidates(candidate_id, job_requirements):
    # Find candidates similar to the matched candidate
    similar = similarity_detection_service.find_all_similar_candidates(
        candidate_id=candidate_id,
        threshold=0.75,
        limit=5
    )
    
    # Filter by job requirements
    qualified = []
    for candidate in similar:
        # Check if they meet requirements
        if meets_requirements(candidate, job_requirements):
            qualified.append(candidate)
    
    return qualified
```

### Example 3: Audit for Duplicates

```python
def audit_duplicate_candidates():
    from candidates.models import Candidate
    
    duplicates = []
    
    for candidate in Candidate.objects.all():
        similar = similarity_detection_service.find_all_similar_candidates(
            candidate.id,
            threshold=0.90
        )
        
        if similar:
            duplicates.append({
                'candidate': candidate,
                'duplicates': similar
            })
    
    return duplicates
```

---

## Thresholds

### Similarity Thresholds

| Threshold | Meaning | Action |
|-----------|---------|--------|
| > 0.90 | Duplicate | Mark as duplicate, stop processing |
| 0.75 - 0.90 | Similar | Flag for review, process normally |
| < 0.75 | Different | Process normally |

### Choosing the Right Threshold

- **Duplicate Detection**: 0.90 (high confidence)
- **Similar Candidates**: 0.75 (inclusive)
- **Broad Search**: 0.60 (very inclusive)
- **Exact Match**: 0.95 (very strict)

---

## Distance Metrics

### Cosine Distance (Default)

**Use Case:** Text similarity, semantic matching

**Formula:** `similarity = 1 - cosine_distance`

**Range:** 0.0 to 1.0

**Performance:** Fast

```python
result = similarity_detection_service.check_resume_similarity(
    resume_text="...",
    distance_metric='cosine'
)
```

### L2 Distance (Euclidean)

**Use Case:** Geometric similarity, exact matches

**Formula:** `similarity = 1 / (1 + euclidean_distance)`

**Range:** 0.0 to 1.0

**Performance:** Slower than cosine

```python
result = similarity_detection_service.check_resume_similarity(
    resume_text="...",
    distance_metric='l2'
)
```

---

## Common Use Cases

### Use Case 1: Prevent Duplicate Submissions

```python
# Before processing new resume
result = similarity_detection_service.check_resume_similarity(resume_text)

if result['is_duplicate']:
    return Response({
        'error': 'Duplicate resume detected',
        'similar_to': result['similar_candidates'][0]['candidate_name']
    }, status=400)

# Process normally
```

### Use Case 2: Find Alternative Candidates

```python
# When a candidate declines offer, find similar ones
similar = similarity_detection_service.find_all_similar_candidates(
    candidate_id=declined_candidate_id,
    threshold=0.80,
    limit=10
)

# Contact similar candidates
for candidate in similar:
    contact_candidate(candidate['candidate_id'])
```

### Use Case 3: Resume Database Audit

```python
# Find all potential duplicates
for candidate in Candidate.objects.all():
    similar = similarity_detection_service.find_all_similar_candidates(
        candidate.id,
        threshold=0.90
    )
    
    if similar:
        # Flag for review
        flag_for_review(candidate.id, similar)
```

---

## Testing

### Test 1: Check Similarity

```bash
curl -X POST http://localhost:8000/api/candidates/similarity-check/ \
  -H "Content-Type: application/json" \
  -d '{"resume_text": "Python developer with Django experience", "threshold": 0.90}'
```

### Test 2: Find Similar

```bash
curl http://localhost:8000/api/candidates/1/similar/?threshold=0.75
```

### Test 3: Get Statistics

```bash
curl http://localhost:8000/api/candidates/similarity-statistics/
```

---

## Troubleshooting

### Issue: No Similar Candidates Found

**Check:**
1. Embeddings are generated
2. Threshold is not too high
3. Resume text is not empty
4. Database has candidates

**Solution:**
```python
from candidates.models import ResumeChunk
print(ResumeChunk.objects.filter(embedding__isnull=False).count())
```

### Issue: All Resumes Marked as Duplicate

**Check:**
1. Threshold is not too low
2. Resume text is not generic
3. Embeddings are working correctly

**Solution:**
- Increase threshold to 0.95
- Check for embedding quality
- Review similarity calculation

### Issue: Slow Performance

**Check:**
1. pgvector indexes exist
2. Database is properly optimized
3. Number of candidates is reasonable

**Solution:**
- Use cosine distance (faster)
- Limit results to 5-10
- Check database performance

---

## Best Practices

### 1. Always Check Before Processing

```python
result = similarity_detection_service.check_resume_similarity(resume_text)
if result['is_duplicate']:
    # Handle duplicate
    return
```

### 2. Use Appropriate Thresholds

```python
# For duplicate detection
threshold = 0.90

# For finding similar candidates
threshold = 0.75

# For broad search
threshold = 0.60
```

### 3. Log Similarity Checks

```python
import logging
logger = logging.getLogger(__name__)

result = similarity_detection_service.check_resume_similarity(resume_text)
logger.info(f"Similarity check: duplicate={result['is_duplicate']}, max={result['max_similarity']:.4f}")
```

### 4. Handle Edge Cases

```python
if not result['similar_candidates']:
    logger.warning("No similar candidates found")
    # Handle gracefully
```

---

## Configuration

### Adjust Thresholds

Edit `candidates/services/similarity_detection.py`:

```python
class SimilarityDetectionService:
    DUPLICATE_THRESHOLD = 0.90  # Adjust this
    SIMILAR_THRESHOLD = 0.75    # Adjust this
    DEFAULT_LIMIT = 5           # Adjust this
```

### Change Default Distance Metric

```python
result = similarity_detection_service.check_resume_similarity(
    resume_text="...",
    distance_metric='l2'  # Change to 'l2'
)
```

---

## Performance Tips

1. **Use Cosine Distance**: Faster than L2
2. **Limit Results**: Keep limit under 10
3. **Batch Operations**: Process multiple at once
4. **Index Optimization**: Ensure pgvector indexes exist

---

## Next Steps

1. ✅ Test similarity check API
2. ✅ Test find similar candidates
3. ✅ Review similarity statistics
4. ✅ Integrate with upload flow
5. ✅ Monitor duplicate detection rate
6. ✅ Optimize thresholds as needed

---

**Need More Info?** Check the complete documentation in `RESUME_SIMILARITY_DETECTION.md`