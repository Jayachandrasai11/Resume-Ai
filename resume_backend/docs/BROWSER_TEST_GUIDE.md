# 🌐 Test Email System in Browser - Step-by-Step Guide

## Quick Overview

Test the email notification system using your browser - no terminal commands needed!

---

## Step 1: Start Django Server

### Open Terminal & Run:

```bash
cd d:\PFS\project\Project1\resume_backend
..\..\.venv\Scripts\activate
python manage.py runserver
```

**Expected Output:**
```
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced)
March 14, 2026 - 12:XX:XX
Django version 6.0.3, using settings 'resume_backend.settings'
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-C.
```

**Keep this terminal open!** The server must stay running.

---

## Step 2: Check Email Settings

Open your `.env` file and verify:

```bash
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@yourcompany.com
EMAIL_SUBJECT_PREFIX=[Recruitment]
```

**Note:** In development mode, emails will be printed to the terminal (not sent to real email).

---

## Step 3: Open Browser & Check Available Pipelines

Open your browser and go to:
```
http://127.0.0.1:8000/api/pipeline/
```

**What you'll see:**
- JSON response with all pipeline entries
- Each entry has: `id`, `candidate_name`, `job_title`, `current_stage`

**Example response:**
```json
{
  "count": 1,
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
      "current_stage": "applied",
      "stage_display": "Applied",
      "notes": "",
      "created_at": "2024-03-14T10:30:00Z",
      "updated_at": "2024-03-14T10:30:00Z"
    }
  ]
}
```

**Note the pipeline ID** (e.g., `1`) - you'll need it for the next step.

---

## Step 4: Update Stage & Trigger Email (Method A - Direct API)

### Option A: Using Browser URL (Simplest)

**Note:** This won't work directly in browser because it requires PATCH method. Use Method B instead.

---

### Option B: Using Browser DevTools (Recommended)

#### Step 4.1: Open Browser DevTools

1. Open your browser (Chrome, Firefox, Edge)
2. Press `F12` or right-click and select "Inspect"
3. Go to **Console** tab

#### Step 4.2: Run This JavaScript Code

Paste this in the console and press Enter:

```javascript
// Update pipeline stage and trigger email
async function updatePipelineStage() {
  const pipelineId = 1; // Change this to your pipeline ID
  const newStage = 'screening'; // Options: screening, technical_interview, hr_interview, offer, rejected
  const notes = 'Test email notification from browser';

  try {
    const response = await fetch(`http://127.0.0.1:8000/api/pipeline/${pipelineId}/update_stage/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        current_stage: newStage,
        notes: notes
      })
    });

    const data = await response.json();

    console.log('✅ Success! Email triggered.');
    console.log('Response:', data);
    console.log('\n📧 Check your terminal to see the email!');
    console.log('\n📊 Updated Pipeline:');
    console.log(`  - Candidate: ${data.candidate_name}`);
    console.log(`  - Job: ${data.job_title}`);
    console.log(`  - Stage: ${data.stage_display}`);
    console.log(`  - Notes: ${data.notes}`);

    return data;
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the function
updatePipelineStage();
```

**What happens:**
- Stage is updated in database
- Email is triggered
- Response shown in console
- Email printed to terminal

---

## Step 5: Test All Email Stages

### Use This JavaScript Code to Test Each Stage

Copy and paste this in browser console:

```javascript
// Test all email stages
async function testAllStages() {
  const pipelineId = 1; // Change to your pipeline ID
  
  const stages = [
    { stage: 'screening', notes: 'Initial screening round' },
    { stage: 'technical_interview', notes: 'Strong technical skills' },
    { stage: 'hr_interview', notes: 'Final interview round' },
    { stage: 'offer', notes: 'Congratulations! We want to hire you' },
    { stage: 'rejected', notes: 'Position filled with another candidate' }
  ];

  console.log('🚀 Testing all email stages...\n');

  for (let i = 0; i < stages.length; i++) {
    const { stage, notes } = stages[i];
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test ${i + 1}: ${stage.toUpperCase()}`);
    console.log('='.repeat(60));

    try {
      const response = await fetch(`http://127.0.0.1:8000/api/pipeline/${pipelineId}/update_stage/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_stage: stage,
          notes: notes
        })
      });

      const data = await response.json();
      
      console.log(`✅ ${stage} email triggered!`);
      console.log(`   Candidate: ${data.candidate_name}`);
      console.log(`   Job: ${data.job_title}`);
      console.log(`   Check terminal for email content`);
      
      // Wait 2 seconds between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Error testing ${stage}:`, error);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed!');
  console.log('='.repeat(60));
  console.log('\n📧 Check your terminal to see all 5 emails!');
}

// Run the tests
testAllStages();
```

**What happens:**
- Tests all 5 email types
- Shows progress in console
- Each email printed to terminal
- 2-second delay between tests

---

## Step 6: View Candidates by Stage

Open this URL in browser:
```
http://127.0.0.1:8000/api/pipeline/by_stage/
```

**What you'll see:**
```json
{
  "applied": {
    "label": "Applied",
    "candidates": [],
    "count": 0
  },
  "screening": {
    "label": "Screening",
    "candidates": [
      {
        "id": 1,
        "candidate_name": "John Doe",
        "candidate_email": "john@example.com",
        "job_title": "Software Engineer",
        "current_stage": "screening",
        "stage_display": "Screening",
        "notes": "Test email notification",
        ...
      }
    ],
    "count": 1
  },
  ...
}
```

---

## Step 7: Check Terminal for Emails

Go to the terminal where Django server is running.

**You'll see the full HTML email printed:**

```
Content-Type: text/html; charset="utf-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 8bit
Subject: [Recruitment] Screening Interview Invitation - Software Engineer
From: noreply@yourcompany.com
To: john@example.com
Date: Thu, 14 Mar 2026 12:30:00 -0000

<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
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
        <p>Dear John Doe,</p>
        
        <p>We are pleased to inform you that your application for 
        the <strong>Software Engineer</strong> position at Your Company 
        has been selected for the next round of interviews.</p>
        
        <p>We would like to invite you for a <strong>Screening Interview</strong> 
        to discuss your qualifications and interest in this role.</p>
        
        <p><strong>Notes from Recruiter:</strong></p>
        <p>Test email notification</p>
        
        <p>Please confirm your availability by replying to this email 
        or contacting our recruitment team.</p>
        
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
```

---

## Step 8: Test with Different Stages

### Use This Quick JavaScript Function

```javascript
// Quick test function - change stage as needed
async function quickTest(stage) {
  const pipelineId = 1;
  
  const response = await fetch(`http://127.0.0.1:8000/api/pipeline/${pipelineId}/update_stage/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      current_stage: stage,
      notes: `Testing ${stage} email`
    })
  });

  const data = await response.json();
  console.log(`✅ ${stage} email sent!`);
  console.log(`   Check terminal for email content`);
  return data;
}

// Test different stages:
// quickTest('screening');
// quickTest('technical_interview');
// quickTest('hr_interview');
// quickTest('offer');
// quickTest('rejected');
```

**Usage:** Uncomment the stage you want to test and run.

---

## Step 9: View Available Stages

Open this URL:
```
http://127.0.0.1:8000/api/pipeline/stages/
```

**Response:**
```json
[
  { "value": "applied", "label": "Applied" },
  { "value": "screening", "label": "Screening" },
  { "value": "technical_interview", "label": "Technical Interview" },
  { "value": "hr_interview", "label": "HR Interview" },
  { "value": "offer", "label": "Offer" },
  { "value": "rejected", "label": "Rejected" }
]
```

---

## Step 10: Verify Email Content

### Check Terminal Output

Look for these elements in the printed email:

✅ **Subject Line:** `[Recruitment] [Stage Type] - [Job Title]`
✅ **Recipient:** `to: candidate@email.com`
✅ **Candidate Name:** `Dear [Candidate Name],`
✅ **Job Title:** `[Job Title] position`
✅ **Stage Content:** Stage-specific message
✅ **Notes:** Notes from recruiter
✅ **Branding:** Company name and styling
✅ **Footer:** Copyright and disclaimer

---

## Browser Quick Reference

### Useful URLs

```
# View all pipelines
http://127.0.0.1:8000/api/pipeline/

# View by stage
http://127.0.0.1:8000/api/pipeline/by_stage/

# View available stages
http://127.0.0.1:8000/api/pipeline/stages/

# View by job
http://127.0.0.1:8000/api/pipeline/by_job/?job_id=1

# View by candidate
http://127.0.0.1:8000/api/pipeline/by_candidate/?candidate_id=1
```

### JavaScript Console Commands

```javascript
// Update single stage
await (async function() {
  const response = await fetch('http://127.0.0.1:8000/api/pipeline/1/update_stage/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_stage: 'screening', notes: 'Test' })
  });
  console.log(await response.json());
})();

// View pipeline details
fetch('http://127.0.0.1:8000/api/pipeline/1/')
  .then(r => r.json())
  .then(console.log);

// View all pipelines by stage
fetch('http://127.0.0.1:8000/api/pipeline/by_stage/')
  .then(r => r.json())
  .then(console.log);
```

---

## Troubleshooting

### Issue: "Network Error" in Browser

**Solution:**
- Make sure Django server is running
- Check server is on port 8000
- Try refreshing the page

### Issue: No Pipeline Data

**Solution:**
```javascript
// Create test pipeline
fetch('http://127.0.0.1:8000/api/pipeline/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    candidate: 1,
    job: 1,
    current_stage: 'applied'
  })
})
.then(r => r.json())
.then(console.log);
```

### Issue: Email Not Printed to Terminal

**Check:**
1. `.env` file has `EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend`
2. Server is running
3. No errors in terminal

---

## ✅ Testing Checklist

- [ ] Django server running on port 8000
- [ ] Browser can access `http://127.0.0.1:8000/api/pipeline/`
- [ ] Pipeline data exists
- [ ] JavaScript code runs in console
- [ ] Stage updates successfully
- [ ] Email printed to terminal
- [ ] Email content is correct
- [ ] All 5 email types tested

---

## 🎯 Quick Test Sequence

### 1-Minute Quick Test

```javascript
// Paste in browser console and run:
(async function() {
  const response = await fetch('http://127.0.0.1:8000/api/pipeline/1/update_stage/', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_stage: 'screening', notes: 'Browser test' })
  });
  const data = await response.json();
  console.log('✅ Email triggered! Check terminal.');
  console.log('Candidate:', data.candidate_name);
  console.log('Job:', data.job_title);
  console.log('Stage:', data.stage_display);
})();
```

**That's it!** Check your terminal for the email.

---

## 📊 What You'll See

### Browser Console:
```
✅ Email triggered! Check terminal.
Candidate: John Doe
Job: Software Engineer
Stage: Screening
```

### Terminal:
```
Content-Type: text/html; charset="utf-8"
Subject: [Recruitment] Screening Interview Invitation - Software Engineer
From: noreply@yourcompany.com
To: john@example.com

<!DOCTYPE html>
<html>
... [Full HTML email] ...
</html>
```

---

## 🎉 You're Ready!

**Start testing now:**

1. Open browser console (F12)
2. Paste the quick test code
3. Press Enter
4. Check terminal for email

**That's all you need!** 🚀