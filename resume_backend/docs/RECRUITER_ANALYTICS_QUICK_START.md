# Recruiter Analytics API - Quick Start Guide

## Overview

The Recruiter Analytics API provides comprehensive statistics and insights for recruitment dashboards. Get started in minutes!

## Prerequisites

- ✅ Django server running
- ✅ Database with candidates, resumes, and job descriptions
- ✅ Pipeline data available

## Setup (2 minutes)

### 1. Start the Server

```bash
cd Project1/resume_backend
python manage.py runserver
```

### 2. Test the API

```bash
# Get overview statistics
curl -X GET http://localhost:8000/api/recruiter/analytics/overview/
```

## Quick Examples

### Example 1: Get Overview Statistics

```bash
curl -X GET http://localhost:8000/api/recruiter/analytics/overview/
```

**Response**:
```json
{
  "total_candidates": 150,
  "total_resumes": 200,
  "total_jobs": 25,
  "active_pipelines": 120,
  "new_candidates_30d": 35
}
```

### Example 2: Get Pipeline Distribution

```bash
curl -X GET http://localhost:8000/api/recruiter/analytics/pipeline-distribution/
```

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
      "stage": "offer",
      "stage_display": "Offer",
      "count": 15,
      "percentage": 8.33
    }
  ],
  "summary": {
    "active": 140,
    "rejected": 40,
    "conversion_rate": 8.33
  }
}
```

### Example 3: Get Top Skills

```bash
curl -X GET "http://localhost:8000/api/recruiter/analytics/top-skills/?limit=10"
```

**Response**:
```json
{
  "total_candidates": 150,
  "total_unique_skills": 45,
  "top_skills": [
    {
      "name": "Python",
      "candidate_count": 80,
      "percentage": 53.33
    },
    {
      "name": "JavaScript",
      "candidate_count": 65,
      "percentage": 43.33
    }
  ]
}
```

### Example 4: Get Candidates Per Job

```bash
curl -X GET "http://localhost:8000/api/recruiter/analytics/candidates-per-job/?limit=5"
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
      "total_candidates": 25,
      "active_candidates": 20,
      "offered": 3,
      "rejected": 2
    }
  ]
}
```

### Example 5: Get Comprehensive Analytics

```bash
curl -X GET http://localhost:8000/api/recruiter/analytics/comprehensive/
```

**Response**: All analytics data in one response!

## Python Examples

### Basic Usage

```python
import requests

BASE_URL = "http://localhost:8000/api/recruiter"

# Get overview statistics
response = requests.get(f"{BASE_URL}/analytics/overview/")
overview = response.json()

print(f"Total Candidates: {overview['total_candidates']}")
print(f"Total Resumes: {overview['total_resumes']}")
print(f"Active Pipelines: {overview['active_pipelines']}")
```

### Get All Analytics

```python
import requests

# Get comprehensive analytics
response = requests.get("http://localhost:8000/api/recruiter/analytics/comprehensive/")
analytics = response.json()

# Access different sections
print(f"Overview: {analytics['overview']}")
print(f"Pipeline Distribution: {analytics['pipeline_distribution']}")
print(f"Top Skills: {analytics['top_skills']}")
```

### Dashboard Data Fetcher

```python
import requests
import json

class RecruiterDashboard:
    def __init__(self, base_url="http://localhost:8000/api/recruiter"):
        self.base_url = base_url
    
    def get_overview(self):
        response = requests.get(f"{self.base_url}/analytics/overview/")
        return response.json()
    
    def get_pipeline_distribution(self):
        response = requests.get(f"{self.base_url}/analytics/pipeline-distribution/")
        return response.json()
    
    def get_top_skills(self, limit=20):
        response = requests.get(f"{self.base_url}/analytics/top-skills/?limit={limit}")
        return response.json()
    
    def get_candidates_per_job(self, limit=None):
        url = f"{self.base_url}/analytics/candidates-per-job/"
        if limit:
            url += f"?limit={limit}"
        response = requests.get(url)
        return response.json()
    
    def get_comprehensive(self):
        response = requests.get(f"{self.base_url}/analytics/comprehensive/")
        return response.json()

# Usage
dashboard = RecruiterDashboard()

# Get overview
overview = dashboard.get_overview()
print(f"Total Candidates: {overview['total_candidates']}")

# Get top 10 skills
skills = dashboard.get_top_skills(limit=10)
print(f"Top Skills: {skills['top_skills']}")

# Get comprehensive data
all_data = dashboard.get_comprehensive()
print(f"Generated at: {all_data['generated_at']}")
```

## JavaScript Examples

### Basic Usage

```javascript
const BASE_URL = 'http://localhost:8000/api/recruiter';

// Get overview statistics
async function getOverview() {
  const response = await fetch(`${BASE_URL}/analytics/overview/`);
  const overview = await response.json();
  console.log('Total Candidates:', overview.total_candidates);
  console.log('Total Resumes:', overview.total_resumes);
  return overview;
}

// Get pipeline distribution
async function getPipelineDistribution() {
  const response = await fetch(`${BASE_URL}/analytics/pipeline-distribution/`);
  const distribution = await response.json();
  console.log('Active Pipelines:', distribution.summary.active);
  return distribution;
}

// Usage
getOverview();
getPipelineDistribution();
```

### Dashboard Component

```javascript
class RecruiterDashboard {
  constructor(baseUrl = 'http://localhost:8000/api/recruiter') {
    this.baseUrl = baseUrl;
  }

  async getOverview() {
    const response = await fetch(`${this.baseUrl}/analytics/overview/`);
    return await response.json();
  }

  async getPipelineDistribution() {
    const response = await fetch(`${this.baseUrl}/analytics/pipeline-distribution/`);
    return await response.json();
  }

  async getTopSkills(limit = 20) {
    const response = await fetch(`${this.baseUrl}/analytics/top-skills/?limit=${limit}`);
    return await response.json();
  }

  async getCandidatesPerJob(limit = null) {
    let url = `${this.baseUrl}/analytics/candidates-per-job/`;
    if (limit) {
      url += `?limit=${limit}`;
    }
    const response = await fetch(url);
    return await response.json();
  }

  async getComprehensive() {
    const response = await fetch(`${this.baseUrl}/analytics/comprehensive/`);
    return await response.json();
  }
}

// Usage
const dashboard = new RecruiterDashboard();

// Get overview
dashboard.getOverview().then(overview => {
  console.log('Total Candidates:', overview.total_candidates);
});

// Get comprehensive data
dashboard.getComprehensive().then(data => {
  console.log('Generated at:', data.generated_at);
});
```

## React Integration

### Dashboard Component

```javascript
import { useState, useEffect } from 'react';

function RecruiterDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8000/api/recruiter/analytics/comprehensive/');
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  if (loading) return <div>Loading analytics...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!analytics) return <div>No data available</div>;

  return (
    <div className="dashboard">
      <h1>Recruiter Dashboard</h1>
      
      {/* Overview Cards */}
      <div className="overview-cards">
        <div className="card">
          <h2>Total Candidates</h2>
          <p className="value">{analytics.overview.total_candidates}</p>
        </div>
        <div className="card">
          <h2>Total Resumes</h2>
          <p className="value">{analytics.overview.total_resumes}</p>
        </div>
        <div className="card">
          <h2>Active Pipelines</h2>
          <p className="value">{analytics.overview.active_pipelines}</p>
        </div>
        <div className="card">
          <h2>Conversion Rate</h2>
          <p className="value">{analytics.pipeline_distribution.summary.conversion_rate}%</p>
        </div>
      </div>

      {/* Pipeline Distribution */}
      <div className="section">
        <h2>Pipeline Distribution</h2>
        <ul>
          {analytics.pipeline_distribution.distribution.map(stage => (
            <li key={stage.stage}>
              {stage.stage_display}: {stage.count} ({stage.percentage}%)
            </li>
          ))}
        </ul>
      </div>

      {/* Top Skills */}
      <div className="section">
        <h2>Top Skills</h2>
        <ul>
          {analytics.top_skills.top_skills.map(skill => (
            <li key={skill.skill_id}>
              {skill.name}: {skill.candidate_count} candidates ({skill.percentage}%)
            </li>
          ))}
        </ul>
      </div>

      {/* Last Updated */}
      <p className="updated">
        Last updated: {new Date(analytics.generated_at).toLocaleString()}
      </p>
    </div>
  );
}

export default RecruiterDashboard;
```

## API Endpoints Summary

| Endpoint | Description | Query Parameters |
|----------|-------------|------------------|
| `/api/recruiter/analytics/overview/` | Overview statistics | None |
| `/api/recruiter/analytics/pipeline-distribution/` | Pipeline stage distribution | None |
| `/api/recruiter/analytics/candidates-per-job/` | Candidates per job | `limit` (optional) |
| `/api/recruiter/analytics/top-skills/` | Top skills | `limit` (optional, default: 20) |
| `/api/recruiter/analytics/resume-sources/` | Resume source statistics | None |
| `/api/recruiter/analytics/time-series/` | Time series data | `period`, `months` |
| `/api/recruiter/analytics/recruitment-funnel/` | Recruitment funnel | None |
| `/api/recruiter/analytics/comprehensive/` | All analytics | None |

## Common Use Cases

### 1. Dashboard Overview

```bash
# Get all analytics data for dashboard
curl -X GET http://localhost:8000/api/recruiter/analytics/comprehensive/
```

### 2. Monitor Pipeline Health

```bash
# Get pipeline distribution
curl -X GET http://localhost:8000/api/recruiter/analytics/pipeline-distribution/

# Get recruitment funnel
curl -X GET http://localhost:8000/api/recruiter/analytics/recruitment-funnel/
```

### 3. Track Skill Trends

```bash
# Get top skills
curl -X GET "http://localhost:8000/api/recruiter/analytics/top-skills/?limit=15"
```

### 4. Analyze Job Performance

```bash
# Get candidates per job
curl -X GET "http://localhost:8000/api/recruiter/analytics/candidates-per-job/?limit=10"
```

### 5. Monitor Resume Sources

```bash
# Get resume source statistics
curl -X GET http://localhost:8000/api/recruiter/analytics/resume-sources/
```

## Testing

### Test All Endpoints

```bash
#!/bin/bash

BASE_URL="http://localhost:8000/api/recruiter"

echo "Testing Recruiter Analytics API..."
echo ""

echo "1. Overview Statistics"
curl -X GET "$BASE_URL/analytics/overview/"
echo -e "\n"

echo "2. Pipeline Distribution"
curl -X GET "$BASE_URL/analytics/pipeline-distribution/"
echo -e "\n"

echo "3. Candidates Per Job"
curl -X GET "$BASE_URL/analytics/candidates-per-job/"
echo -e "\n"

echo "4. Top Skills"
curl -X GET "$BASE_URL/analytics/top-skills/"
echo -e "\n"

echo "5. Resume Sources"
curl -X GET "$BASE_URL/analytics/resume-sources/"
echo -e "\n"

echo "6. Time Series"
curl -X GET "$BASE_URL/analytics/time-series/"
echo -e "\n"

echo "7. Recruitment Funnel"
curl -X GET "$BASE_URL/analytics/recruitment-funnel/"
echo -e "\n"

echo "8. Comprehensive Analytics"
curl -X GET "$BASE_URL/analytics/comprehensive/"
echo -e "\n"

echo "All tests completed!"
```

## Troubleshooting

### Issue: "No data available"

**Solution**: Ensure you have candidates, resumes, and job descriptions in your database.

```bash
# Check database
python manage.py dbshell

# Verify data
SELECT COUNT(*) FROM candidates_candidate;
SELECT COUNT(*) FROM candidates_resume;
SELECT COUNT(*) FROM jd_app_jobdescription;
```

### Issue: "Pipeline data is empty"

**Solution**: Create pipeline entries for candidates.

```python
from pipeline.models import CandidatePipeline
from candidates.models import Candidate
from jd_app.models import JobDescription

# Create pipeline entry
candidate = Candidate.objects.first()
job = JobDescription.objects.first()
pipeline = CandidatePipeline.objects.create(
    candidate=candidate,
    job=job,
    current_stage='applied'
)
```

### Issue: "Slow response times"

**Solution**: Consider implementing caching.

```python
from django.core.cache import cache

# Cache analytics for 5 minutes
cache.set('recruiter_analytics_overview', stats, 300)
```

## Next Steps

- 📖 Read the full documentation: `RECRUITER_ANALYTICS_API.md`
- 🧪 Run comprehensive tests
- 🚀 Integrate with your frontend
- 📊 Create visualizations
- 🔒 Add authentication

## Support

For issues or questions:
- Check the API documentation
- Review service code: `candidates/services/recruiter_analytics.py`
- Test endpoints directly
- Verify database connectivity

## Features Summary

✅ **Overview Statistics** - Total counts and recent activity  
✅ **Pipeline Distribution** - Stage-wise candidate distribution  
✅ **Candidates Per Job** - Job performance metrics  
✅ **Top Skills** - Most common skills in candidate pool  
✅ **Resume Sources** - Source distribution statistics  
✅ **Time Series Data** - Historical trends  
✅ **Recruitment Funnel** - Conversion rates  
✅ **Comprehensive Analytics** - All data in one call  

Ready to build your recruitment dashboard! 🚀