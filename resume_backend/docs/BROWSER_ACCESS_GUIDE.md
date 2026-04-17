# How to View Results in Browser

## Quick Start - Start the Django Server

### Step 1: Open Terminal

Open a terminal/command prompt and navigate to the project:

```bash
cd d:\PFS\project\Project1\resume_backend
```

### Step 2: Activate Virtual Environment

```bash
..\..\.venv\Scripts\activate
```

You should see `(venv)` or similar prefix in your terminal.

### Step 3: Start the Server

```bash
python manage.py runserver
```

You should see output like:
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
March 14, 2026 - 12:XX:XX
Django version 6.0.3, using settings 'resume_backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

### Step 4: Open Browser

Open your web browser and go to: **http://127.0.0.1:8000/**

---

## What You Can View

### 1. Django Admin Panel

**URL:** http://127.0.0.1:8000/admin/

**What you'll see:**
- Login screen (need to create superuser first)

**How to create superuser:**
```bash
# In a new terminal (keep server running in first terminal)
cd d:\PFS\project\Project1\resume_backend
..\..\.venv\Scripts\activate
python manage.py createsuperuser
```

Follow prompts to create username, email, and password.

**After login, you can view:**
- **Candidates** - All processed candidates with their data
- **Resumes** - Uploaded resume files
- **Resume Chunks** - Text chunks with embeddings
- **Candidate Pipelines** - Pipeline entries with stages
- **Job Descriptions** - Available job positions
- **Skills** - Extracted skills

**Navigation:**
```
Admin Panel
├── CANDIDATES
│   ├── Candidates (view all candidates)
│   ├── Resumes (view uploaded resumes)
│   └── Resume chunks (view text chunks)
├── PIPELINE
│   └── Candidate pipelines (view pipeline stages)
├── JD_APP
│   └── Job descriptions (view jobs)
└── CANDIDATES
    └── Skills (view extracted skills)
```

### 2. API Endpoints

#### Pipeline API

**View all pipeline entries:**
```
http://127.0.0.1:8000/api/pipeline/
```

**View candidates grouped by stage:**
```
http://127.0.0.1:8000/api/pipeline/by_stage/
```

**Filter by specific stage:**
```
http://127.0.0.1:8000/api/pipeline/by_stage/?stage=screening
```

**Get all available stages:**
```
http://127.0.0.1:8000/api/pipeline/stages/
```

**View pipelines for a specific job:**
```
http://127.0.0.1:8000/api/pipeline/by_job/?job_id=1
```

**View pipelines for a specific candidate:**
```
http://127.0.0.1:8000/api/pipeline/by_candidate/?candidate_id=1
```

#### Candidates API

**View all candidates:**
```
http://127.0.0.1:8000/api/candidates/
```

**View specific candidate:**
```
http://127.0.0.1:8000/api/candidates/1/
```

#### Jobs API

**View all jobs:**
```
http://127.0.0.1:8000/api/jd_app/jobdescriptions/
```

**View specific job:**
```
http://127.0.0.1:8000/api/jd_app/jobdescriptions/1/
```

#### Analytics API

**Get dashboard statistics:**
```
http://127.0.0.1:8000/api/analytics/
```

### 3. Analytics Dashboard

**URL:** http://127.0.0.1:8000/analytics/

**What you'll see:**
- Total candidates count
- Total resumes count
- Pipeline stage distribution
- Job analytics
- Charts and statistics

### 4. Candidate List View

**URL:** http://127.0.0.1:8000/candidates/

**What you'll see:**
- List of all candidates
- Their skills
- Summary information
- Links to detailed views

### 5. Candidate Detail View

**URL:** http://127.0.0.1:8000/candidates/{candidate_id}/

**Example:** http://127.0.0.1:8000/candidates/1/

**What you'll see:**
- Complete candidate profile
- All resumes
- Extracted skills
- Experience and education
- Projects

---

## Testing the Pipeline API

### Using Browser

1. Open: http://127.0.0.1:8000/api/pipeline/by_stage/

You'll see JSON response like:
```json
{
  "applied": {
    "label": "Applied",
    "candidates": [
      {
        "id": 1,
        "candidate": 1,
        "candidate_name": "John Doe",
        "candidate_email": "john@example.com",
        "job": 1,
        "job_title": "Software Engineer",
        "current_stage": "applied",
        "stage_display": "Applied",
        "created_at": "2024-03-14T10:30:00Z",
        "updated_at": "2024-03-14T10:30:00Z",
        "notes": "Initial application"
      }
    ],
    "count": 1
  },
  "screening": {
    "label": "Screening",
    "candidates": [],
    "count": 0
  },
  ...
}
```

### Using cURL (in terminal)

```bash
# View all stages
curl http://127.0.0.1:8000/api/pipeline/by_stage/

# View specific stage
curl http://127.0.0.1:8000/api/pipeline/by_stage/?stage=technical_interview

# Update a candidate's stage
curl -X PATCH http://127.0.0.1:8000/api/pipeline/1/update_stage/ \
  -H "Content-Type: application/json" \
  -d '{"current_stage": "screening", "notes": "Good candidate"}'
```

---

## API Response Examples

### Pipeline Entry Response

```json
{
  "id": 1,
  "candidate": 1,
  "candidate_name": "Aisha Khan",
  "candidate_email": "aisha@example.com",
  "job": 1,
  "job_title": "Software Engineer",
  "current_stage": "applied",
  "stage_display": "Applied",
  "created_at": "2024-03-14T10:30:00Z",
  "updated_at": "2024-03-14T10:30:00Z",
  "notes": "Initial application"
}
```

### Candidate Response

```json
{
  "id": 1,
  "name": "Aisha Khan",
  "email": "aisha@example.com",
  "phone": "1234567890",
  "summary": "Experienced software engineer with expertise in Python and Django...",
  "education": [
    {
      "degree": "B.Tech Computer Science",
      "institution": "IIT Delhi",
      "year": "2020"
    }
  ],
  "skills": ["Python", "Django", "JavaScript", "SQL"],
  "extracted_skills": ["Python", "Django", "JavaScript", "SQL", "Git"],
  "experience": [
    {
      "company": "Tech Corp",
      "role": "Software Engineer",
      "duration": "2 years"
    }
  ],
  "projects": [
    {
      "title": "E-commerce Platform",
      "description": "Built a full-stack e-commerce platform"
    }
  ],
  "resumes": []
}
```

---

## Common Browser Views

### 1. Admin Dashboard
```
http://127.0.0.1:8000/admin/
```
- View and manage all data
- Create/edit candidates, jobs, pipelines

### 2. Pipeline Overview
```
http://127.0.0.1:8000/api/pipeline/by_stage/
```
- See candidates at each stage
- Track hiring progress

### 3. Analytics Dashboard
```
http://127.0.0.1:8000/analytics/
```
- Visual statistics
- Charts and graphs

### 4. Candidate Directory
```
http://127.0.0.1:8000/candidates/
```
- Browse all candidates
- Search and filter

---

## Troubleshooting

### Issue: "Server not responding"

**Solution:**
1. Check if server is running (look for "Starting development server" message)
2. Make sure you're using correct URL: http://127.0.0.1:8000/
3. Check if port 8000 is available
4. Try stopping server and restarting it

### Issue: "404 Not Found"

**Solution:**
1. Check URL spelling
2. Make sure you included `/api/` prefix for API endpoints
3. Verify the endpoint exists in urls.py

### Issue: "Permission Denied" in Admin

**Solution:**
1. Make sure you're logged in as superuser
2. Create superuser if needed: `python manage.py createsuperuser`

### Issue: "No data showing"

**Solution:**
1. Make sure you've run the reset_and_process_all.py script
2. Check database has data: `python manage.py shell`
3. Verify resumes were processed successfully

---

## Tips for Better Browser Experience

1. **Use JSON Formatter:** Install a browser extension (like JSON Formatter) to pretty-print API responses

2. **Keep Server Running:** Keep one terminal with the server running while you browse

3. **Use Incognito/Private Mode:** If you have login issues, try incognito mode

4. **Bookmark Important URLs:** Save frequently used URLs for quick access

5. **Refresh After Changes:** Refresh the page after updating data via API

---

## Recommended Workflow

1. **Start Server:** Run `python manage.py runserver`

2. **Open Admin Panel:** http://127.0.0.1:8000/admin/
   - Login with superuser credentials
   - Browse candidates and pipelines

3. **Check API:** http://127.0.0.1:8000/api/pipeline/by_stage/
   - View pipeline distribution
   - Check candidate stages

4. **View Analytics:** http://127.0.0.1:8000/analytics/
   - See statistics and charts

5. **Test Updates:** Use API to update candidate stages
   - Move candidates through pipeline
   - Add notes and feedback

6. **Monitor Progress:** Regularly check pipeline endpoints to track hiring progress

---

## Next Steps

After viewing your data in the browser:

1. **Update Candidate Stages:** Move candidates through the hiring pipeline
2. **Add Notes:** Record feedback and interview notes
3. **Create Jobs:** Add more job descriptions as needed
4. **Analyze Data:** Use analytics to identify trends
5. **Export Data:** Use export endpoints to get CSV reports