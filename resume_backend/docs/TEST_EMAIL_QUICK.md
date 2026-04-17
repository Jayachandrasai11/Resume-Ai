# 🚀 QUICK TEST - Email Notification System

## Choose Your Test Method:

### ⚡ Method 1: Automated Test Script (Recommended - 1 Minute)

```bash
# Open terminal and run:
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe test_email_system.py
```

**What happens:** Tests all 6 email types automatically and shows results

**Expected output:**
```
======================================================================
  EMAIL NOTIFICATION SYSTEM - AUTOMATED TEST
======================================================================

This script will test all email types.
In development mode, emails will be printed to this terminal.
In production mode, emails will be sent to the specified address.

Starting tests...

======================================================================
  TEST 1: Screening Interview Invitation
======================================================================

✓ Screening Email Sent: True
  Candidate: John Doe
  Job: Software Engineer
  Stage: screening

[Email content printed here]

======================================================================
  TEST SUMMARY
======================================================================

Total Tests: 6
Passed: 6
Failed: 0

  ✓ PASS: Screening
  ✓ PASS: Technical Interview
  ✓ PASS: HR Interview
  ✓ PASS: Offer
  ✓ PASS: Rejection
  ✓ PASS: Custom

======================================================================
  ALL TESTS PASSED! ✓
  Email notification system is working correctly.
======================================================================
```

---

### 🔧 Method 2: Manual Test via Python Shell (2 Minutes)

```bash
# Step 1: Open terminal
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe manage.py shell
```

```python
# Step 2: Paste this code:
from pipeline.services.email_service import EmailNotificationService

# Test one email
success = EmailNotificationService.send_stage_update_email(
    candidate_name="Test User",
    candidate_email="test@example.com",
    job_title="Software Engineer",
    new_stage="screening",
    notes="This is a test"
)

print(f"Email sent: {success}")
```

**What happens:** Sends one test email (printed to terminal in dev mode)

---

### 🌐 Method 3: Test via API (3 Minutes)

**Step 1: Start Django Server** (in one terminal)
```bash
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe activate
python manage.py runserver
```

**Step 2: Update a pipeline stage** (in another terminal)
```bash
curl -X PATCH http://127.0.0.1:8000/api/pipeline/1/update_stage/ \
  -H "Content-Type: application/json" \
  -d "{\"current_stage\": \"screening\", \"notes\": \"Test email\"}"
```

**What happens:** Updates pipeline stage and triggers email automatically

**Check the first terminal** - you'll see the email printed there!

---

## 📋 What You Should See

### In Development Mode (Console Output)

When email is sent, you'll see the full HTML email printed in your terminal:

```
Content-Type: text/html; charset="utf-8"
Subject: [Recruitment] Screening Interview Invitation - Software Engineer
From: noreply@yourcompany.com
To: test@example.com

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Screening Interview Invitation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
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
        <p>Dear Test User,</p>
        <p>We are pleased to inform you...</p>
        ...
    </div>
</body>
</html>
```

### In Production Mode (Real Email)

Email will be sent to the recipient's inbox:
- Professional HTML formatting
- Company branding
- All candidate and job details
- Stage-specific content

---

## ✅ Verification Checklist

After running any test method, verify:

- [ ] Email was generated (printed to console or sent)
- [ ] Email has proper subject line
- [ ] Candidate name is included
- [ ] Job title is included
- [ ] HTML formatting is correct
- [ ] Company branding appears
- [ ] Notes from recruiter are included
- [ ] No errors in terminal

---

## 🎯 Quick Test Commands

```bash
# Automated test (all emails)
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe test_email_system.py

# Manual test (one email)
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe manage.py shell
# Then paste the test code

# API test (requires server running)
curl -X PATCH http://127.0.0.1:8000/api/pipeline/1/update_stage/ \
  -H "Content-Type: application/json" \
  -d "{\"current_stage\": \"screening\", \"notes\": \"Test\"}"
```

---

## 🧪 Test All Email Types

### 1. Screening Invitation
```python
EmailNotificationService.send_stage_update_email(
    candidate_name="John Doe",
    candidate_email="test@example.com",
    job_title="Software Engineer",
    new_stage="screening"
)
```

### 2. Technical Interview
```python
EmailNotificationService.send_stage_update_email(
    candidate_name="John Doe",
    candidate_email="test@example.com",
    job_title="Software Engineer",
    new_stage="technical_interview"
)
```

### 3. HR Interview
```python
EmailNotificationService.send_stage_update_email(
    candidate_name="John Doe",
    candidate_email="test@example.com",
    job_title="Software Engineer",
    new_stage="hr_interview"
)
```

### 4. Job Offer
```python
EmailNotificationService.send_offer_email(
    candidate_name="John Doe",
    candidate_email="test@example.com",
    job_title="Software Engineer",
    offer_details={'salary': '$120,000', 'start_date': '2024-04-01'}
)
```

### 5. Rejection
```python
EmailNotificationService.send_rejection_email(
    candidate_name="John Doe",
    candidate_email="test@example.com",
    job_title="Software Engineer",
    rejection_reason="Position filled"
)
```

---

## 🐛 Troubleshooting

### Issue: "No module named 'pipeline'"

**Solution:**
```bash
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe test_email_system.py
```

### Issue: Email not printed to console

**Check `.env` file:**
```bash
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Issue: Server not running

**Start server:**
```bash
cd Project1/resume_backend
..\..\.venv\Scripts\activate
python manage.py runserver
```

---

## 📊 Expected Test Results

### Success:
```
✓ ALL TESTS PASSED!
Email notification system is working correctly.
```

### Email Content:
- Professional HTML formatting
- Blue header with stage title
- Candidate name and job title
- Stage-specific content
- Company branding
- Notes from recruiter

---

## 🎉 You're Ready to Test!

**Pick one method and run it now:**

1. **Fastest:** Run `test_email_system.py`
2. **Most Control:** Use Python shell
3. **Real Scenario:** Test via API with server running

**All three methods will work!** Choose whichever you prefer.

---

**Need help?** Check the full documentation in `TEST_EMAIL_SYSTEM.md`