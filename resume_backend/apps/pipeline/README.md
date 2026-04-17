# Candidate Interview Pipeline System

## Overview

The Candidate Interview Pipeline System tracks the hiring stage for each candidate across different job descriptions. This system provides a complete API for managing candidate progression through the interview process.

## Features

- **Pipeline Tracking**: Track candidates through multiple interview stages
- **Stage Management**: Update candidate stages with optional notes
- **Grouped Views**: List candidates grouped by their current stage
- **Job-based Filtering**: View pipeline entries for specific jobs
- **Candidate-based Filtering**: View all pipeline entries for a specific candidate
- **Unique Constraints**: Ensures one pipeline entry per candidate-job pair

## Pipeline Stages

The system supports the following stages (in order of progression):

1. **applied** - Initial application received
2. **screening** - HR/Recruiter screening
3. **technical_interview** - Technical assessment
4. **hr_interview** - HR interview round
5. **offer** - Offer extended
6. **rejected** - Candidate rejected at any stage

## Database Models

### CandidatePipeline

| Field | Type | Description |
|-------|------|-------------|
| `id` | BigAutoField | Primary key |
| `candidate` | ForeignKey | Reference to Candidate model |
| `job` | ForeignKey | Reference to JobDescription model |
| `current_stage` | CharField | Current pipeline stage (enum) |
| `created_at` | DateTimeField | Timestamp when pipeline entry was created |
| `updated_at` | DateTimeField | Timestamp of last update |
| `notes` | TextField | Optional notes about candidate progress |

**Constraints:**
- Unique combination of `candidate` and `job`
- Indexed on `candidate`, `job`, `current_stage`, and timestamps

## API Endpoints

### Base URL
```
/api/pipeline/
```

### 1. List All Pipeline Entries

**Endpoint:** `GET /api/pipeline/`

**Response:**
```json
{
  "count": 10,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "candidate": 1,
      "candidate_name": "John Doe",
      "candidate_email": "john@example.com",
      "job": 1,
      "job_title": "Software Engineer",
      "current_stage": "screening",
      "stage_display": "Screening",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-16T14:20:00Z",
      "notes": "Initial screening completed"
    }
  ]
}
```

### 2. Create Pipeline Entry

**Endpoint:** `POST /api/pipeline/`

**Request Body:**
```json
{
  "candidate": 1,
  "job": 2,
  "current_stage": "applied",
  "notes": "Initial application"
}
```

**Response:** `201 Created`

**Error Response:** `400 Bad Request` (if candidate-job pair already exists)

### 3. Get Pipeline Entry Details

**Endpoint:** `GET /api/pipeline/{id}/`

**Response:** `200 OK`

Includes nested candidate and job information.

### 4. Update Pipeline Entry

**Endpoint:** `PUT /api/pipeline/{id}/` or `PATCH /api/pipeline/{id}/`

**Request Body:**
```json
{
  "current_stage": "technical_interview",
  "notes": "Passed screening round"
}
```

**Response:** `200 OK`

### 5. Delete Pipeline Entry

**Endpoint:** `DELETE /api/pipeline/{id}/`

**Response:** `204 No Content`

### 6. Update Candidate Stage (Action)

**Endpoint:** `PATCH /api/pipeline/{id}/update_stage/` or `PUT /api/pipeline/{id}/update_stage/`

**Request Body:**
```json
{
  "current_stage": "technical_interview",
  "notes": "Excellent technical skills"
}
```

**Response:** `200 OK`

### 7. List Candidates by Stage

**Endpoint:** `GET /api/pipeline/by_stage/`

**Query Parameters:**
- `stage` (optional): Filter by specific stage

**Examples:**

Get all stages grouped:
```bash
GET /api/pipeline/by_stage/
```

**Response:**
```json
{
  "applied": {
    "label": "Applied",
    "candidates": [...],
    "count": 5
  },
  "screening": {
    "label": "Screening",
    "candidates": [...],
    "count": 3
  },
  ...
}
```

Filter by specific stage:
```bash
GET /api/pipeline/by_stage/?stage=technical_interview
```

**Response:**
```json
{
  "stage": "technical_interview",
  "stage_display": "Technical Interview",
  "candidates": [...],
  "count": 2
}
```

### 8. Get Available Stages

**Endpoint:** `GET /api/pipeline/stages/`

**Response:**
```json
[
  {"value": "applied", "label": "Applied"},
  {"value": "screening", "label": "Screening"},
  {"value": "technical_interview", "label": "Technical Interview"},
  {"value": "hr_interview", "label": "HR Interview"},
  {"value": "offer", "label": "Offer"},
  {"value": "rejected", "label": "Rejected"}
]
```

### 9. List Pipeline by Job

**Endpoint:** `GET /api/pipeline/by_job/`

**Query Parameters:**
- `job_id` (required): Job ID to filter by

**Example:**
```bash
GET /api/pipeline/by_job/?job_id=1
```

**Response:**
```json
{
  "job_id": 1,
  "pipelines": [...],
  "count": 10
}
```

### 10. List Pipeline by Candidate

**Endpoint:** `GET /api/pipeline/by_candidate/`

**Query Parameters:**
- `candidate_id` (required): Candidate ID to filter by

**Example:**
```bash
GET /api/pipeline/by_candidate/?candidate_id=1
```

**Response:**
```json
{
  "candidate_id": 1,
  "pipelines": [...],
  "count": 3
}
```

### 11. Update Candidate Stage by IDs (Alternative Endpoint)

**Endpoint:** `POST /api/pipeline/update-stage/`

**Request Body:**
```json
{
  "candidate_id": 1,
  "job_id": 2,
  "current_stage": "hr_interview",
  "notes": "Final round interview scheduled"
}
```

**Response:** `200 OK` (updated existing) or `201 Created` (created new)

## Usage Examples

### Python (requests)

```python
import requests

# Base URL
BASE_URL = "http://localhost:8000/api/pipeline"

# Create a new pipeline entry
response = requests.post(f"{BASE_URL}/", json={
    "candidate": 1,
    "job": 2,
    "current_stage": "applied",
    "notes": "Applied via LinkedIn"
})

# Update candidate stage
pipeline_id = response.json()['id']
response = requests.patch(f"{BASE_URL}/{pipeline_id}/update_stage/", json={
    "current_stage": "technical_interview",
    "notes": "Passed screening"
})

# Get all candidates by stage
response = requests.get(f"{BASE_URL}/by_stage/?stage=screening")
candidates = response.json()['candidates']

# Get all stages with counts
response = requests.get(f"{BASE_URL}/by_stage/")
all_stages = response.json()
```

### cURL

```bash
# Create pipeline entry
curl -X POST http://localhost:8000/api/pipeline/ \
  -H "Content-Type: application/json" \
  -d '{"candidate": 1, "job": 2, "current_stage": "applied"}'

# Update stage
curl -X PATCH http://localhost:8000/api/pipeline/1/update_stage/ \
  -H "Content-Type: application/json" \
  -d '{"current_stage": "technical_interview", "notes": "Strong technical skills"}'

# List by stage
curl http://localhost:8000/api/pipeline/by_stage/?stage=screening

# Get all stages
curl http://localhost:8000/api/pipeline/by_stage/
```

## Database Migrations

To apply the database migrations:

```bash
cd Project1/resume_backend
python manage.py migrate pipeline
```

## Testing

Run the pipeline tests:

```bash
cd Project1/resume_backend
python manage.py test pipeline
```

## Admin Interface

The pipeline model is registered in Django admin and can be accessed at:
```
http://localhost:8000/admin/pipeline/candidatepipeline/
```

Features:
- List view with filtering by stage
- Search by candidate name, email, or job title
- Inline editing of pipeline entries
- Timestamp tracking

## Model Methods

### advance_stage(new_stage)

Advances the pipeline to a new stage.

```python
pipeline = CandidatePipeline.objects.get(id=1)
pipeline.advance_stage('technical_interview')
```

### stage_history

Returns stage history information (current stage, timestamps).

```python
pipeline = CandidatePipeline.objects.get(id=1)
history = pipeline.stage_history
# Returns: {'current_stage': 'Screening', 'created_at': ..., 'updated_at': ...}
```

## Best Practices

1. **Always validate stage transitions**: Ensure stages progress logically
2. **Use notes for context**: Add meaningful notes when updating stages
3. **Handle unique constraint errors**: The system prevents duplicate candidate-job pairs
4. **Use appropriate HTTP methods**: GET for retrieval, POST for creation, PATCH/PUT for updates
5. **Filter and paginate**: Use query parameters for large datasets

## Future Enhancements

- Full stage history tracking (separate PipelineStageHistory model)
- Automated stage transition notifications
- Stage duration analytics
- Bulk stage updates
- Pipeline templates for common workflows
- Integration with email/calendar systems for interview scheduling

## Troubleshooting

### Common Issues

1. **400 Bad Request on pipeline creation**
   - Ensure candidate and job IDs exist
   - Check if candidate-job pair already exists

2. **400 Bad Request on stage update**
   - Verify stage value is valid (use `/api/pipeline/stages/` endpoint)
   - Ensure required fields are provided

3. **404 Not Found**
   - Verify pipeline ID exists
   - Check URL path is correct

## Support

For issues or questions, refer to the main project documentation or contact the development team.