# Resume Similarity Detection System - Complete Documentation

## Overview

The Resume Similarity Detection System identifies duplicate or highly similar resumes using vector similarity with pgvector embeddings stored in PostgreSQL. This system helps prevent duplicate resume submissions and identifies candidates with similar profiles.

## Architecture

```
Resume Upload / Email Sync
        │
        ▼
Text Extraction
        │
        ▼
Resume Similarity Check
        │
        ├─ Similar (>0.90) → Mark as Duplicate → Stop Processing
        │
        └─ New → Process Normally
        │
        ▼
Chunking & Embedding Generation
        │
        ▼
Store in PostgreSQL (pgvector)
```

## Features

✅ **Vector Similarity Search**: Uses pgvector for efficient similarity calculations
✅ **Multiple Distance Metrics**: Supports cosine and L2 distance
✅ **Configurable Thresholds**: Adjustable similarity thresholds
✅ **Duplicate Detection**: Automatically marks resumes with >90% similarity
✅ **Similar Candidates**: Finds candidates with 75%+ similarity
✅ **Batch Processing**: Can compare against all existing resumes
✅ **Statistics**: Provides coverage and embedding statistics
✅ **API Integration**: RESTful API endpoints for all operations

## Technical Details

### Embedding Storage

- **Model**: `ResumeChunk` with `VectorField(dimensions=384)`
- **Embedding Model**: SentenceTransformers (384-dimensional vectors)
- **Database**: PostgreSQL with pgvector extension
- **Indexing**: pgvector automatically creates efficient indexes

### Similarity Metrics

#### Cosine Distance (Default)
- Range: 0.0 to 1.0 (where 1.0 = identical)
- Formula: `similarity = 1 - cosine_distance`
- Use case: Text similarity, semantic matching

#### L2 Distance (Euclidean)
- Range: 0.0 to infinity
- Formula: `similarity = 1 / (1 + euclidean_distance)`
- Use case: Geometric similarity, exact matches

### Thresholds

| Threshold | Use Case | Action |
|-----------|----------|--------|
| > 0.90 | Duplicate | Mark as duplicate, stop processing |
| 0.75 - 0.90 | Similar | Flag for review, process normally |
| < 0.75 | Different | Process normally |

## API Endpoints

### 1. Check Resume Similarity

**Endpoint:** `POST /api/candidates/similarity-check/`

**Request Body:**
```json
{
  "resume_text": "Full text of the resume...",
  "threshold": 0.90,
  "limit": 5,
  "distance_metric": "cosine"
}
```

**Or using resume ID:**
```json
{
  "resume_id": 123,
  "threshold": 0.90,
  "limit": 5,
  "distance_metric": "cosine"
}
```

**Response:**
```json
{
  "is_duplicate": true,
  "similar_candidates": [
    {
      "candidate_id": 1,
      "candidate_name": "John Doe",
      "candidate_email": "john@example.com",
      "similarity_score": 0.95,
      "chunks_compared": 15,
      "is_duplicate": true,
      "is_similar": true
    }
  ],
  "max_similarity": 0.95,
  "total_candidates_checked": 50
}
```

### 2. Find Similar Candidates

**Endpoint:** `GET /api/candidates/{candidate_id}/similar/`

**Query Parameters:**
- `threshold`: Minimum similarity threshold (default 0.75)
- `limit`: Maximum results (default 5)

**Example:**
```bash
GET /api/candidates/1/similar/?threshold=0.80&limit=10
```

**Response:**
```json
{
  "candidate_id": 1,
  "similar_candidates": [
    {
      "candidate_id": 2,
      "candidate_name": "Jane Smith",
      "candidate_email": "jane@example.com",
      "similarity_score": 0.85,
      "chunks_compared": 12,
      "is_duplicate": false,
      "is_similar": true
    }
  ],
  "count": 1
}
```

### 3. Get Similarity Statistics

**Endpoint:** `GET /api/candidates/similarity-statistics/`

**Response:**
```json
{
  "total_candidates": 100,
  "candidates_with_embeddings": 95,
  "total_resume_chunks": 1500,
  "chunks_with_embeddings": 1425,
  "embedding_coverage": "95.00%"
}
```

### 4. Mark Duplicates

**Endpoint:** `POST /api/candidates/mark-duplicates/`

**Request Body:**
```json
{
  "resume_id": 123,
  "similar_candidate_ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "marked_count": 3,
  "results": [
    {
      "resume_id": 456,
      "file_name": "similar_resume.pdf",
      "candidate_id": 1,
      "marked_as_duplicate": true
    }
  ]
}
```

## Service Usage

### Check Resume Similarity

```python
from candidates.services.similarity_detection import similarity_detection_service

# Check by resume text
result = similarity_detection_service.check_resume_similarity(
    resume_text="Full resume text here...",
    threshold=0.90,
    limit=5
)

if result['is_duplicate']:
    print(f"Duplicate found! Max similarity: {result['max_similarity']:.2%}")
    for candidate in result['similar_candidates']:
        print(f"  - {candidate['candidate_name']}: {candidate['similarity_score']:.2%}")
```

### Find Similar Candidates

```python
# Find candidates similar to a specific candidate
similar_candidates = similarity_detection_service.find_all_similar_candidates(
    candidate_id=1,
    threshold=0.75,
    limit=10
)

print(f"Found {len(similar_candidates)} similar candidates")
for candidate in similar_candidates:
    print(f"  - {candidate['candidate_name']}: {candidate['similarity_score']:.2%}")
```

### Get Statistics

```python
stats = similarity_detection_service.get_similarity_statistics()

print(f"Total candidates: {stats['total_candidates']}")
print(f"With embeddings: {stats['candidates_with_embeddings']}")
print(f"Embedding coverage: {stats['embedding_coverage']}")
```

## Integration with Resume Upload

### Modified Upload Flow

```python
from candidates.views_similarity_integration import ResumeUploadWithSimilarityAPIView

# This view automatically checks for duplicates before processing
# If similarity > 0.90, it returns early with duplicate status
# Otherwise, processes normally
```

### Upload with Similarity Check

```bash
curl -X POST http://localhost:8000/api/upload-resume-with-similarity/ \
  -F "resume=@resume.pdf" \
  -F "check_similarity=true" \
  -F "similarity_threshold=0.90"
```

**Response (New Resume):**
```json
{
  "status": "new_candidate_created",
  "candidate_id": 1,
  "resume": {...},
  "similarity_check": {
    "is_duplicate": false,
    "similar_candidates": [],
    "max_similarity": 0.45,
    "total_candidates_checked": 50
  }
}
```

**Response (Duplicate):**
```json
{
  "status": "duplicate_detected",
  "similarity_check": {
    "is_duplicate": true,
    "similar_candidates": [...],
    "max_similarity": 0.95,
    "total_candidates_checked": 50
  },
  "message": "Duplicate resume detected with 95.00% similarity"
}
```

## Performance Considerations

### pgvector Performance

- **Indexing**: Automatic vector indexing for fast similarity search
- **Batch Processing**: Can process multiple resumes efficiently
- **Scalability**: Handles thousands of resumes with minimal performance impact

### Optimization Tips

1. **Use Cosine Distance**: Faster than L2 for text similarity
2. **Set Appropriate Thresholds**: Higher thresholds = faster but less inclusive
3. **Limit Results**: Use reasonable limits (5-10 candidates)
4. **Batch Embedding**: Generate embeddings in batches for better performance

## Database Schema

### ResumeChunk Model

```python
class ResumeChunk(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE)
    chunk_text = models.TextField()
    chunk_index = models.PositiveIntegerField()
    embedding = VectorField(dimensions=384, null=True, blank=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['resume', 'chunk_index']
        unique_together = ['resume', 'chunk_index']
```

### Indexes

```sql
-- pgvector automatically creates:
CREATE INDEX ON resumechunk USING ivfflat (embedding vector_cosine_ops);
```

## Configuration

### Settings

No additional settings required. The system uses:
- Existing pgvector configuration
- Existing embedding service
- Existing database connection

### Thresholds

Adjust in `similarity_detection.py`:

```python
class SimilarityDetectionService:
    DUPLICATE_THRESHOLD = 0.90  # Mark as duplicate
    SIMILAR_THRESHOLD = 0.75    # Mark as similar
    DEFAULT_LIMIT = 5           # Max results to return
```

## Testing

### Unit Tests

```python
from candidates.services.similarity_detection import similarity_detection_service

def test_similarity_check():
    result = similarity_detection_service.check_resume_similarity(
        resume_text="Test resume text...",
        threshold=0.90
    )
    
    assert 'is_duplicate' in result
    assert 'similar_candidates' in result
    assert 'max_similarity' in result
```

### API Testing

```bash
# Test similarity check
curl -X POST http://localhost:8000/api/candidates/similarity-check/ \
  -H "Content-Type: application/json" \
  -d '{
    "resume_text": "Test resume text...",
    "threshold": 0.90,
    "limit": 5
  }'

# Test find similar candidates
curl http://localhost:8000/api/candidates/1/similar/

# Get statistics
curl http://localhost:8000/api/candidates/similarity-statistics/
```

## Troubleshooting

### Issue: No embeddings found

**Solution:** Generate embeddings first:
```bash
python manage.py shell
```

```python
from candidates.services.embeddings import service as embedding_service

# Generate embeddings for all resumes
from candidates.models import Resume
resumes = Resume.objects.all()
resume_ids = [r.id for r in resumes]
embedding_service.generate_for_resumes(resume_ids=resume_ids)
```

### Issue: Low similarity scores

**Possible Causes:**
- Different resume formats
- Different content structure
- Incomplete embeddings
- Threshold too high

**Solution:** Lower threshold or check embedding quality

### Issue: Slow similarity search

**Solution:**
- Ensure pgvector indexes are created
- Use cosine distance (faster than L2)
- Limit number of results
- Check database performance

## Best Practices

### 1. Generate Embeddings After Upload

Always generate embeddings immediately after resume upload:
```python
chunk_and_store_resume(resume.id)
embedding_service.generate_for_resumes(resume_ids=[resume.id])
```

### 2. Check Similarity Before Processing

Always check for duplicates before processing new resumes:
```python
result = similarity_detection_service.check_resume_similarity(resume_text)
if result['is_duplicate']:
    # Handle duplicate
    return
```

### 3. Use Appropriate Thresholds

- **Duplicate detection**: 0.90 (high confidence)
- **Similar candidates**: 0.75 (inclusive)
- **Broad search**: 0.60 (very inclusive)

### 4. Log Similarity Checks

Always log similarity check results:
```python
logger.info(f"Similarity check: {result['is_duplicate']}, max: {result['max_similarity']:.4f}")
```

## Use Cases

### 1. Duplicate Resume Prevention

```python
# On resume upload
result = similarity_detection_service.check_resume_similarity(resume_text)
if result['is_duplicate']:
    return Response({
        "error": "Duplicate resume detected",
        "similar_candidates": result['similar_candidates']
    }, status=400)
```

### 2. Candidate Recommendation

```python
# Find candidates similar to a job description
similar_candidates = similarity_detection_service.find_all_similar_candidates(
    candidate_id=candidate_id,
    threshold=0.75
)
```

### 3. Resume Auditing

```python
# Find all similar resumes
for candidate in Candidate.objects.all():
    similar = similarity_detection_service.find_all_similar_candidates(
        candidate.id,
        threshold=0.90
    )
    if similar:
        # Flag for review
        pass
```

### 4. Database Cleanup

```python
# Find and merge duplicate candidates
similar_candidates = similarity_detection_service.find_all_similar_candidates(
    candidate_id=candidate_id,
    threshold=0.95
)
if similar_candidates:
    # Merge duplicates
    pass
```

## Monitoring and Analytics

### Key Metrics

- **Total candidates with embeddings**
- **Embedding coverage percentage**
- **Average similarity score**
- **Duplicate detection rate**
- **Similar candidates found per search

### Dashboard Integration

```python
# Add to analytics dashboard
from candidates.services.similarity_detection import similarity_detection_service

stats = similarity_detection_service.get_similarity_statistics()
```

## Security Considerations

### 1. Access Control

Implement authentication for similarity check endpoints:
```python
from rest_framework.permissions import IsAuthenticated

class SimilarityCheckAPIView(APIView):
    permission_classes = [IsAuthenticated]
```

### 2. Rate Limiting

Implement rate limiting to prevent abuse:
```python
from rest_framework.throttling import UserRateThrottle

class SimilarityCheckRateThrottle(UserRateThrottle):
    rate = '10/minute'
```

### 3. Data Privacy

Ensure similarity checks don't expose sensitive candidate information.

## Future Enhancements

### Potential Improvements

1. **Real-time Similarity Detection**: WebSocket-based real-time updates
2. **Machine Learning Models**: Train custom similarity models
3. **Advanced Similarity Metrics**: Add more distance metrics
4. **Clustering**: Group similar candidates automatically
5. **Visualization**: Visual similarity graphs and clusters
6. **Batch Processing**: Process multiple resumes simultaneously
7. **Duplicate Merging**: Automatic merge of duplicate candidates
8. **Similarity Alerts**: Notify when highly similar resumes are detected

## API Reference

### SimilarityCheckAPIView

**Methods:** POST

**Request:**
- `resume_text` (string, optional): Resume text to check
- `resume_id` (integer, optional): Resume ID to check
- `threshold` (float, optional): Similarity threshold (0.0-1.0, default 0.90)
- `limit` (integer, optional): Max results (1-20, default 5)
- `distance_metric` (string, optional): 'cosine' or 'l2' (default 'cosine')

**Response:**
- `is_duplicate` (boolean): Whether duplicate detected
- `similar_candidates` (array): List of similar candidates
- `max_similarity` (float): Maximum similarity score
- `total_candidates_checked` (integer): Number of candidates compared

### FindSimilarCandidatesAPIView

**Methods:** GET

**Parameters:**
- `candidate_id` (path): Candidate ID to find similar ones for
- `threshold` (query, optional): Minimum similarity (default 0.75)
- `limit` (query, optional): Max results (default 5)

**Response:**
- `candidate_id` (integer): Original candidate ID
- `similar_candidates` (array): List of similar candidates
- `count` (integer): Number of similar candidates found

### SimilarityStatisticsAPIView

**Methods:** GET

**Response:**
- `total_candidates` (integer): Total candidates in database
- `candidates_with_embeddings` (integer): Candidates with embeddings
- `total_resume_chunks` (integer): Total resume chunks
- `chunks_with_embeddings` (integer): Chunks with embeddings
- `embedding_coverage` (string): Percentage of chunks with embeddings

### MarkDuplicateAPIView

**Methods:** POST

**Request:**
- `resume_id` (integer): Resume ID to mark as original
- `similar_candidate_ids` (array): List of candidate IDs to mark as duplicates

**Response:**
- `marked_count` (integer): Number of resumes marked
- `results` (array): Details of marked resumes

## Example Workflows

### Workflow 1: Resume Upload with Duplicate Check

```python
# 1. User uploads resume
# 2. Extract text from PDF
# 3. Check similarity
result = similarity_detection_service.check_resume_similarity(resume_text)

# 4. If duplicate, return early
if result['is_duplicate']:
    return {"status": "duplicate", "similar": result['similar_candidates']}

# 5. Otherwise, process normally
# - Create candidate
# - Generate embeddings
# - Store in database
```

### Workflow 2: Find Similar Candidates for Job

```python
# 1. Get job description
job_description = "Python developer with Django experience..."

# 2. Find candidate with similar skills
# (This uses the existing semantic search service)

# 3. For top candidates, find similar ones
for candidate in top_candidates:
    similar = similarity_detection_service.find_all_similar_candidates(
        candidate.id,
        threshold=0.80
    )
    # Suggest similar candidates as alternatives
```

### Workflow 3: Audit Resume Database

```python
# 1. Get all candidates
candidates = Candidate.objects.all()

# 2. For each candidate, find similar ones
duplicates = []
for candidate in candidates:
    similar = similarity_detection_service.find_all_similar_candidates(
        candidate.id,
        threshold=0.90
    )
    if similar:
        duplicates.append({
            'candidate': candidate,
            'similar': similar
        })

# 3. Review and merge as needed
```

## Performance Benchmarks

### Expected Performance

| Operation | Time (1000 resumes) | Time (10000 resumes) |
|-----------|---------------------|----------------------|
| Similarity check | < 100ms | < 500ms |
| Find similar candidates | < 50ms | < 200ms |
| Statistics | < 10ms | < 20ms |

### Optimization Tips

1. Use cosine distance (faster than L2)
2. Limit results (5-10 candidates)
3. Ensure indexes are created
4. Use batch operations for bulk operations

## Troubleshooting Guide

### Common Issues

#### 1. "No embeddings found"

**Symptom:** Similarity check returns 0 candidates

**Solution:**
```bash
# Check if embeddings exist
python manage.py shell
```

```python
from candidates.models import ResumeChunk
print(ResumeChunk.objects.filter(embedding__isnull=False).count())
```

#### 2. "Low similarity scores"

**Symptom:** Max similarity is very low (< 0.5)

**Solution:**
- Check embedding quality
- Verify text extraction is working
- Lower threshold for testing
- Check for resume format differences

#### 3. "Slow similarity search"

**Symptom:** Similarity check takes > 1 second

**Solution:**
- Verify pgvector indexes exist
- Use cosine distance
- Limit number of results
- Check database performance

#### 4. "Duplicate not detected"

**Symptom:** Identical resumes not marked as duplicate

**Solution:**
- Check threshold (should be <= 0.95)
- Verify embeddings are identical
- Check for text extraction differences
- Review similarity calculation logic

## Support and Maintenance

### Regular Tasks

- [ ] Monitor embedding coverage
- [ ] Review similarity statistics
- [ ] Check for duplicate candidates
- [ ] Optimize database indexes
- [ ] Update similarity thresholds if needed

### Emergency Procedures

1. **Database Migration**: Backup before schema changes
2. **Embedding Regeneration**: Regenerate if model changes
3. **Index Rebuild**: Rebuild indexes if performance degrades

---

**Last Updated:** March 14, 2026

**Version:** 1.0.0