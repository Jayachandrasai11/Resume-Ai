# Recruiter Analytics API Documentation

## Overview

The Recruiter Analytics API provides comprehensive statistics and insights for recruitment dashboards. It offers endpoints for tracking candidate flow, job performance, skill trends, and pipeline metrics.

## Base URL

```
http://localhost:8000/api/recruiter/
```

## Authentication

Currently, the API does not require authentication. In production, implement authentication using JWT or API keys.

## Endpoints

### 1. Overview Statistics

Get high-level overview statistics for the dashboard.

**Endpoint**: `GET /api/recruiter/analytics/overview/`

**Response**:
```json
{
  "total_candidates": 150,
  "total_resumes": 200,
  "total_jobs": 25,
  "total_pipelines": 180,
  "total_skills": 45,
  "new_candidates_30d": 35,
  "new_resumes_30d": 45,
  "new_jobs_30d": 5,
  "new_candidates_7d": 8,
  "new_resumes_7d": 10,
  "active_pipelines": 120,
  "rejected_candidates": 45,
  "offered_candidates": 15
}
```

### 2. Pipeline Stage Distribution

Get distribution of candidates across pipeline stages.

**Endpoint**: `GET /api/recruiter/analytics/pipeline-distribution/`

**Response**:
```json
{
  "total_pipelines": 180,
  "distribution": [
    {
      "stage": "applied",
      "stage_display": "Applied",
      "count": 50,
      "percentage": 27.78
    },
    {
      "stage": "screening",
      "stage_display": "Screening",
      "count": 30,
      "percentage": 16.67
    },
    {
      "stage": "technical_interview",
      "stage_display": "Technical Interview",
      "count": 25,
      "percentage": 13.89
    },
    {
      "stage": "hr_interview",
      "stage_display": "HR Interview",
      "count": 20,
      "percentage": 11.11
    },
    {
      "stage": "offer",
      "stage_display": "Offer",
      "count": 15,
      "percentage": 8.33
    },
    {
      "stage": "rejected",
      "stage_display": "Rejected",
      "count": 40,
      "percentage": 22.22
    }
  ],
  "summary": {
    "active": 140,
    "rejected": 40,
    "conversion_rate": 8.33
  }
}
```

### 3. Candidates Per Job

Get number of candidates associated with each job description.

**Endpoint**: `GET /api/recruiter/analytics/candidates-per-job/`

**Query Parameters**:
- `limit` (optional): Maximum number of jobs to return

**Example**:
```
GET /api/recruiter/analytics/candidates-per-job/?limit=10
```

**Response**:
```json
{
  "total_jobs": 25,
  "jobs_with_candidates": 20,
  "jobs": [
    {
      "job_id": 1,
      "title": "Senior Python Developer",
      "location": "Remote",
      "employment_type": "Full-time",
      "total_candidates": 25,
      "active_candidates": 20,
      "offered": 3,
      "rejected": 2,
      "created_at": "2025-01-15T10:30:00Z",
      "is_analyzed": true
    },
    {
      "job_id": 2,
      "title": "Frontend Developer",
      "location": "New York",
      "employment_type": "Full-time",
      "total_candidates": 18,
      "active_candidates": 15,
      "offered": 2,
      "rejected": 1,
      "created_at": "2025-01-10T14:00:00Z",
      "is_analyzed": true
    }
  ]
}
```

### 4. Top Skills

Get most common skills across all candidates.

**Endpoint**: `GET /api/recruiter/analytics/top-skills/`

**Query Parameters**:
- `limit` (optional): Maximum number of skills to return (default: 20)

**Example**:
```
GET /api/recruiter/analytics/top-skills/?limit=15
```

**Response**:
```json
{
  "total_candidates": 150,
  "total_unique_skills": 45,
  "top_skills": [
    {
      "skill_id": 1,
      "name": "Python",
      "candidate_count": 80,
      "percentage": 53.33
    },
    {
      "skill_id": 2,
      "name": "JavaScript",
      "candidate_count": 65,
      "percentage": 43.33
    },
    {
      "skill_id": 3,
      "name": "Django",
      "candidate_count": 45,
      "percentage": 30.00
    },
    {
      "skill_id": 4,
      "name": "React",
      "candidate_count": 40,
      "percentage": 26.67
    },
    {
      "skill_id": 5,
      "name": "PostgreSQL",
      "candidate_count": 35,
      "percentage": 23.33
    }
  ]
}
```

### 5. Resume Source Statistics

Get distribution of resume sources (upload, email, API).

**Endpoint**: `GET /api/recruiter/analytics/resume-sources/`

**Response**:
```json
{
  "total_resumes": 200,
  "sources": [
    {
      "source": "upload",
      "source_display": "Manual Upload",
      "count": 120,
      "percentage": 60.00
    },
    {
      "source": "email",
      "source_display": "Email Ingestion",
      "count": 60,
      "percentage": 30.00
    },
    {
      "source": "api",
      "source_display": "API Integration",
      "count": 20,
      "percentage": 10.00
    }
  ]
}
```

### 6. Time Series Data

Get historical data for candidates and resumes over time.

**Endpoint**: `GET /api/recruiter/analytics/time-series/`

**Query Parameters**:
- `period` (optional): 'daily', 'weekly', or 'monthly' (default: 'monthly')
- `months` (optional): Number of months to include (default: 6)

**Example**:
```
GET /api/recruiter/analytics/time-series/?period=monthly&months=6
```

**Response**:
```json
{
  "period": "monthly",
  "start_date": "2024-10-01",
  "end_date": "2025-03-15",
  "data": [
    {
      "period": "2024-10-01",
      "candidates": 25,
      "resumes": 30
    },
    {
      "period": "2024-11-01",
      "candidates": 30,
      "resumes": 35
    },
    {
      "period": "2024-12-01",
      "candidates": 40,
      "resumes": 45
    },
    {
      "period": "2025-01-01",
      "candidates": 35,
      "resumes": 40
    },
    {
      "period": "2025-02-01",
      "candidates": 20,
      "resumes": 25
    },
    {
      "period": "2025-03-01",
      "candidates": 10,
      "resumes": 15
    }
  ]
}
```

### 7. Recruitment Funnel

Get recruitment funnel metrics with conversion rates between stages.

**Endpoint**: `GET /api/recruiter/analytics/recruitment-funnel/`

**Response**:
```json
{
  "funnel": [
    {
      "stage": "applied",
      "stage_display": "Applied",
      "count": 50,
      "conversion_rate": null
    },
    {
      "stage": "screening",
      "stage_display": "Screening",
      "count": 40,
      "conversion_rate": 80.00
    },
    {
      "stage": "technical_interview",
      "stage_display": "Technical Interview",
      "count": 30,
      "conversion_rate": 75.00
    },
    {
      "stage": "hr_interview",
      "stage_display": "HR Interview",
      "count": 20,
      "conversion_rate": 66.67
    },
    {
      "stage": "offer",
      "stage_display": "Offer",
      "count": 15,
      "conversion_rate": 75.00
    },
    {
      "stage": "rejected",
      "stage_display": "Rejected",
      "count": 40,
      "conversion_rate": null
    }
  ],
  "total_applications": 180,
  "overall_conversion_rate": 8.33
}
```

### 8. Comprehensive Analytics

Get all analytics data in a single response. Suitable for dashboard initialization.

**Endpoint**: `GET /api/recruiter/analytics/comprehensive/`

**Response**:
```json
{
  "overview": {
    "total_candidates": 150,
    "total_resumes": 200,
    "total_jobs": 25,
    "total_pipelines": 180,
    "total_skills": 45,
    "new_candidates_30d": 35,
    "new_resumes_30d": 45,
    "new_jobs_30d": 5,
    "new_candidates_7d": 8,
    "new_resumes_7d": 10,
    "active_pipelines": 120,
    "rejected_candidates": 45,
    "offered_candidates": 15
  },
  "pipeline_distribution": {
    "total_pipelines": 180,
    "distribution": [...],
    "summary": {
      "active": 140,
      "rejected": 40,
      "conversion_rate": 8.33
    }
  },
  "candidates_per_job": {
    "total_jobs": 25,
    "jobs_with_candidates": 20,
    "jobs": [...]
  },
  "top_skills": {
    "total_candidates": 150,
    "total_unique_skills": 45,
    "top_skills": [...]
  },
  "resume_sources": {
    "total_resumes": 200,
    "sources": [...]
  },
  "time_series": {
    "period": "monthly",
    "start_date": "2024-10-01",
    "end_date": "2025-03-15",
    "data": [...]
  },
  "recruitment_funnel": {
    "funnel": [...],
    "total_applications": 180,
    "overall_conversion_rate": 8.33
  },
  "generated_at": "2025-03-15T12:30:45Z"
}
```

## Usage Examples

### cURL

```bash
# Get overview statistics
curl -X GET http://localhost:8000/api/recruiter/analytics/overview/

# Get pipeline distribution
curl -X GET http://localhost:8000/api/recruiter/analytics/pipeline-distribution/

# Get candidates per job with limit
curl -X GET "http://localhost:8000/api/recruiter/analytics/candidates-per-job/?limit=10"

# Get top skills
curl -X GET "http://localhost:8000/api/recruiter/analytics/top-skills/?limit=15"

# Get comprehensive analytics
curl -X GET http://localhost:8000/api/recruiter/analytics/comprehensive/
```

### Python

```python
import requests

BASE_URL = "http://localhost:8000/api/recruiter"

# Get overview statistics
response = requests.get(f"{BASE_URL}/analytics/overview/")
overview = response.json()
print(f"Total Candidates: {overview['total_candidates']}")

# Get pipeline distribution
response = requests.get(f"{BASE_URL}/analytics/pipeline-distribution/")
pipeline = response.json()
print(f"Active Pipelines: {pipeline['summary']['active']}")

# Get comprehensive analytics
response = requests.get(f"{BASE_URL}/analytics/comprehensive/")
analytics = response.json()
print(f"Generated at: {analytics['generated_at']}")
```

### JavaScript

```javascript
const BASE_URL = 'http://localhost:8000/api/recruiter';

// Get overview statistics
async function getOverview() {
  const response = await fetch(`${BASE_URL}/analytics/overview/`);
  const overview = await response.json();
  console.log('Total Candidates:', overview.total_candidates);
}

// Get comprehensive analytics
async function getComprehensiveAnalytics() {
  const response = await fetch(`${BASE_URL}/analytics/comprehensive/`);
  const analytics = await response.json();
  console.log('Generated at:', analytics.generated_at);
  return analytics;
}
```

## Dashboard Integration

### React Example

```javascript
import { useState, useEffect } from 'react';

function RecruiterDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const response = await fetch('http://localhost:8000/api/recruiter/analytics/comprehensive/');
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!analytics) return <div>Error loading analytics</div>;

  return (
    <div>
      <h1>Recruiter Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <h2>Total Candidates</h2>
          <p>{analytics.overview.total_candidates}</p>
        </div>
        <div className="stat-card">
          <h2>Total Resumes</h2>
          <p>{analytics.overview.total_resumes}</p>
        </div>
        <div className="stat-card">
          <h2>Active Pipelines</h2>
          <p>{analytics.overview.active_pipelines}</p>
        </div>
        <div className="stat-card">
          <h2>Conversion Rate</h2>
          <p>{analytics.pipeline_distribution.summary.conversion_rate}%</p>
        </div>
      </div>

      {/* Pipeline Distribution Chart */}
      <div className="chart-section">
        <h2>Pipeline Distribution</h2>
        {/* Render chart using analytics.pipeline_distribution */}
      </div>

      {/* Top Skills */}
      <div className="skills-section">
        <h2>Top Skills</h2>
        <ul>
          {analytics.top_skills.top_skills.map(skill => (
            <li key={skill.skill_id}>
              {skill.name}: {skill.candidate_count} candidates
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200 OK`: Successful request
- `400 Bad Request`: Invalid query parameters
- `500 Internal Server Error`: Server error

Error response format:
```json
{
  "error": "Error message description"
}
```

## Performance Considerations

### Caching

Consider implementing caching for analytics endpoints to improve performance:

```python
from django.core.cache import cache

def get_overview_statistics(self):
    cache_key = 'recruiter_analytics_overview'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    stats = {...}  # Compute analytics
    cache.set(cache_key, stats, timeout=300)  # Cache for 5 minutes
    return stats
```

### Database Optimization

The analytics queries use Django ORM optimizations:
- `select_related()` and `prefetch_related()` for related objects
- Database indexes on frequently queried fields
- Aggregation functions for efficient counting

### Response Size

For large datasets, use query parameters to limit results:
- `limit` parameter for candidates per job
- `limit` parameter for top skills
- `months` parameter for time series data

## Security Considerations

### Authentication

Implement authentication before deploying to production:

```python
from rest_framework.permissions import IsAuthenticated

class RecruiterOverviewAPIView(APIView):
    permission_classes = [IsAuthenticated]
    # ...
```

### Rate Limiting

Implement rate limiting to prevent abuse:

```python
from rest_framework.throttling import UserRateThrottle

class RecruiterAnalyticsRateThrottle(UserRateThrottle):
    rate = '100/min'

class RecruiterOverviewAPIView(APIView):
    throttle_classes = [RecruiterAnalyticsRateThrottle]
    # ...
```

## Testing

### Unit Tests

```python
from django.test import TestCase
from .services.recruiter_analytics import recruiter_analytics_service

class RecruiterAnalyticsTests(TestCase):
    def test_overview_statistics(self):
        stats = recruiter_analytics_service.get_overview_statistics()
        self.assertIn('total_candidates', stats)
        self.assertIn('total_resumes', stats)
        self.assertIsInstance(stats['total_candidates'], int)
    
    def test_pipeline_distribution(self):
        distribution = recruiter_analytics_service.get_pipeline_stage_distribution()
        self.assertIn('distribution', distribution)
        self.assertIn('total_pipelines', distribution)
```

### Integration Tests

```python
from django.test import TestCase
from rest_framework.test import APIClient

class RecruiterAnalyticsAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
    
    def test_overview_endpoint(self):
        response = self.client.get('/api/recruiter/analytics/overview/')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('total_candidates', data)
```

## Future Enhancements

### Planned Features

1. **Custom Date Ranges**
   - Allow users to specify custom date ranges for analytics
   - Add `start_date` and `end_date` query parameters

2. **Advanced Filtering**
   - Filter by job type, location, department
   - Filter by skill categories

3. **Export Functionality**
   - Export analytics to CSV, Excel
   - Generate PDF reports

4. **Real-time Updates**
   - WebSocket support for real-time dashboard updates
   - Push notifications for significant changes

5. **Predictive Analytics**
   - Predict hiring needs based on trends
   - Forecast pipeline completion times

6. **Comparative Analytics**
   - Compare periods (month-over-month, year-over-year)
   - Benchmark against industry standards

## Support

For issues or questions:
- Review the documentation
- Check the service code: `candidates/services/recruiter_analytics.py`
- Test the API endpoints directly
- Verify database connectivity

## License

This feature is part of the Resume Intelligence System.