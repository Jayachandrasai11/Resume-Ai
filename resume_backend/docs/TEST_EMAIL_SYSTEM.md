# Test Email Notification System - Step-by-Step Guide

## Quick Test (Development Mode) - 5 Minutes

### Step 1: Verify Email Settings

Open your `.env` file and ensure these settings exist:

```bash
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@yourcompany.com
EMAIL_SUBJECT_PREFIX=[Recruitment]
```

**Note:** In development mode, emails will be printed to your terminal instead of being sent.

---

### Step 2: Start Django Server

Open a terminal and run:

```bash
cd d:\PFS\project\Project1\resume_backend
..\..\.venv\Scripts\activate
python manage.py runserver
```

**Expected Output:**
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
March 14, 2026 - 12:XX:XX
Django version 6.0.3, using settings 'resume_backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-C.
```

**Keep this terminal open!** The server must be running.

---

### Step 3: Check if You Have Pipeline Data

Open your browser and go to:
```
http://127.0.0.1:8000/api/pipeline/
```

**Expected Output:** JSON with pipeline entries

If you see empty array `[]`, you need to create test data first.

---

### Step 4A: Test via API (Easiest Method)

Open a **new terminal** (keep server running in first terminal) and run:

```bash
curl -X PATCH http://127.0.0.1:8000/api/pipeline/1/update_stage/ \
  -H "Content-Type: application/json" \
  -d "{\"current_stage\": \"screening\", \"notes\": \"Test email notification\"}"
```

**Expected Response:**
```json
{
  "id": 1,
  "candidate": 1,
  "candidate_name": "Candidate Name",
  "candidate_email": "candidate@email.com",
  "job": 1,
  "job_title": "Software Engineer",
  "current_stage": "screening",
  "stage_display": "Screening",
  "notes": "Test email notification",
  "created_at": "2024-03-14T...",
  "updated_at": "2024-03-14T..."
}
```

**Check the first terminal (where server is running)** - you should see the email printed there!

---

### Step 4B: Alternative - Test via Browser

If you don't have curl, use the browser:

1. Open browser and go to: `http://127.0.0.1:8000/api/pipeline/`
2. Note a pipeline ID (e.g., `1`)
3. Use this URL in browser:
   ```
   http://127.0.0.1:8000/api/pipeline/1/update_stage/
   ```
4. This won't work in browser (needs PATCH), so use Python instead:

---

### Step 4C: Test via Python (Recommended)

Open a **new terminal** and run:

```bash
cd d:\PFS\project\Project1\resume_backend
..\..\.venv\Scripts\python.exe manage.py shell
```

Then paste this code:

```python
from pipeline.services.email_service import EmailNotificationService

# Send test email
success = EmailNotificationService.send_stage_update_email(
    candidate_name="Test Candidate",
    candidate_email="test@example.com",
    job_title="Software Engineer",
    new_stage="screening",
    notes="This is a test email notification"
)

print(f"\n{'='*60}")
print(f"Email Test Result:")
print(f"{'='*60}")
print(f"Success: {success}")
print(f"{'='*60}\n")
```

**Expected Output:**
```
============================================================
Email Test Result:
============================================================
Success: True
============================================================
```

**Check the server terminal** - you should see the full email printed there!

---

## What You Should See in Server Terminal

When the email is triggered, you'll see something like this:

```
Content-Type: text/html; charset="utf-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 8bit
Subject: [Recruitment] Screening Interview Invitation - Software Engineer
From: noreply@yourcompany.com
To: test@example.com
Date: Thu, 14 Mar 2026 12:30:00 -0000
Message-ID: <unique-id@yourcompany.com>

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Screening Interview Invitation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #0066cc;
            color: white;
            padding: 20px;
            text-align: center;
        }
        ...
    </style>
</head>
<body>
    <div class="header">
        <h1>Screening Interview Invitation</h1>
    </div>
    
    <div class="content">
        <p>Dear Test Candidate,</p>
        
        <p>We are pleased to inform you that your application for the <strong>Software Engineer</strong> position at Your Company has been selected for the next round of interviews.</p>
        
        <p>We would like to invite you for a <strong>Screening Interview</strong> to discuss your qualifications and interest in this role.</p>
        
        <p><strong>Notes from Recruiter:</strong></p>
        <p>This is a test email notification</p>
        
        <p>Please confirm your availability by replying to this email or contacting our recruitment team.</p>
        
        <p>We look forward to speaking with you!</p>
        
        <p>Best regards,<br>
        Recruitment Team<br>
        Your Company</p>
    </div>
    
    <div class="footer">
        <p>This is an automated email. Please do not reply to this address.</p>
        <p>&copy; 2026 Your Company. All rights reserved.</p>
    </div>
</body>
</html>
-------------------------------------------------------------------------------
```

---

## Test All Email Types

### Test Screening Invitation

```python
EmailNotificationService.send_stage_update_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    new_stage="screening",
    notes="Initial screening round"
)
```

### Test Technical Interview

```python
EmailNotificationService.send_stage_update_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    new_stage="technical_interview",
    notes="Passed screening, ready for technical assessment"
)
```

### Test HR Interview

```python
EmailNotificationService.send_stage_update_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    new_stage="hr_interview",
    notes="Final interview round"
)
```

### Test Job Offer

```python
offer_details = {
    'salary': '$120,000 per year',
    'start_date': '2024-04-01',
    'location': 'San Francisco, CA'
}

EmailNotificationService.send_offer_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    offer_details=offer_details
)
```

### Test Rejection Email

```python
EmailNotificationService.send_rejection_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    rejection_reason="Position filled with another candidate",
    feedback="Strong technical skills, but we found someone with more experience in our specific stack"
)
```

---

## Test with API Endpoints

### Method 1: Update Pipeline Stage

```bash
# Get pipeline ID first
curl http://127.0.0.1:8000/api/pipeline/

# Update stage (replace 1 with actual pipeline ID)
curl -X PATCH http://127.0.0.1:8000/api/pipeline/1/update_stage/ \
  -H "Content-Type: application/json" \
  -d "{\"current_stage\": \"technical_interview\", \"notes\": \"Test email\"}"
```

### Method 2: Update by Candidate and Job IDs

```bash
curl -X POST http://127.0.0.1:8000/api/pipeline/update-stage/ \
  -H "Content-Type: application/json" \
  -d "{\"candidate_id\": 1, \"job_id\": 1, \"current_stage\": \"offer\", \"notes\": \"Test\"}"
```

---

## Test Checklist

- [ ] Email settings configured in `.env`
- [ ] Django server running on port 8000
- [ ] Pipeline data exists in database
- [ ] Email triggered via API or Python shell
- [ ] Email printed to server terminal
- [ ] Email content is correct
- [ ] Candidate name appears in email
- [ ] Job title appears in email
- [ ] Stage-specific template used
- [ ] Notes from recruiter included

---

## Troubleshooting

### Issue: "No module named 'pipeline'"

**Solution:**
```bash
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe manage.py shell
```

### Issue: "relation does not exist"

**Solution:** Run migrations first:
```bash
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe manage.py migrate pipeline
```

### Issue: No pipeline data

**Solution:** Create test data:
```python
from candidates.models import Candidate
from jd_app.models import JobDescription
from pipeline.models import CandidatePipeline

# Create test candidate
candidate = Candidate.objects.create(
    name="Test User",
    email="test@example.com",
    phone="1234567890"
)

# Create test job
job = JobDescription.objects.create(
    title="Software Engineer",
    description="Test job",
    skills="Python, Django"
)

# Create pipeline
pipeline = CandidatePipeline.objects.create(
    candidate=candidate,
    job=job,
    current_stage="applied"
)

print(f"Created pipeline with ID: {pipeline.id}")
```

### Issue: Email not printed to console

**Check:**
1. `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend` in `.env`
2. Server is running (check terminal)
3. Email was actually triggered (check logs)

### Issue: Template not found

**Solution:** Verify template exists:
```bash
dir Project1\resume_backend\pipeline\templates\pipeline\emails\
```

Should see:
```
screening_invitation.html
technical_interview_invitation.html
hr_interview_invitation.html
offer_letter.html
rejection_email.html
```

---

## Production Email Test (Gmail)

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable 2-Step Verification

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Select "Mail" → "Other (Custom name)"
3. Name it "Django Resume System"
4. Click "Generate"
5. Copy the 16-character password

### Step 3: Update `.env`

```bash
# Change from console to SMTP
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-password  # Paste the app password here
DEFAULT_FROM_EMAIL=your-email@gmail.com
EMAIL_SUBJECT_PREFIX=[Recruitment]
```

### Step 4: Restart Server

Stop server (Ctrl+C) and start again:
```bash
python manage.py runserver
```

### Step 5: Test Real Email

```python
from pipeline.services.email_service import EmailNotificationService

success = EmailNotificationService.send_stage_update_email(
    candidate_name="Your Name",
    candidate_email="your-email@gmail.com",  # Use your own email for testing
    job_title="Software Engineer",
    new_stage="screening",
    notes="Testing production email"
)

print(f"Email sent: {success}")
```

**Check your Gmail inbox** - the email should arrive!

---

## Verify Email Contents

### Check Email Includes:

✅ Candidate name
✅ Job title
✅ Stage information
✅ Professional formatting
✅ Company branding
✅ Notes from recruiter
✅ Proper subject line

### Expected Email Structure:

```
Subject: [Recruitment] [Stage Type] - [Job Title]

Dear [Candidate Name],

[Stage-specific content]

[Notes from Recruiter]

Best regards,
[Company Name]
```

---

## Next Steps After Testing

1. ✅ Test all email types
2. ✅ Verify email content
3. ✅ Check production email sending
4. ✅ Customize templates (optional)
5. ✅ Update company branding (optional)
6. ✅ Deploy to production

---

## Quick Reference Commands

```bash
# Start server
cd Project1/resume_backend
..\..\.venv\Scripts\activate
python manage.py runserver

# Open Python shell
python manage.py shell

# Test email (in shell)
from pipeline.services.email_service import EmailNotificationService
EmailNotificationService.send_stage_update_email(
    candidate_name="Test",
    candidate_email="test@example.com",
    job_title="Software Engineer",
    new_stage="screening"
)

# Check migrations
python manage.py showmigrations pipeline

# Run migrations
python manage.py migrate pipeline
```

---

**Happy Testing!** 🚀

If you encounter any issues, check the troubleshooting section or review the full documentation.