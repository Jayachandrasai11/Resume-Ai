# Email Notification System - Quick Start Guide

## Setup in 5 Minutes

### Step 1: Configure Email Settings (2 minutes)

Edit your `.env` file:

```bash
# For Development (recommended for testing)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@yourcompany.com
EMAIL_SUBJECT_PREFIX=[Recruitment]

# Optional: Company info
COMPANY_NAME=Your Company
COMPANY_WEBSITE=https://yourcompany.com
```

### Step 2: Restart Django Server (30 seconds)

```bash
# Stop the server (Ctrl+C)
# Start again
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe manage.py runserver
```

### Step 3: Test Email System (2 minutes)

#### Option A: Via API

```bash
# Update a candidate's stage
curl -X PATCH http://127.0.0.1:8000/api/pipeline/1/update_stage/ \
  -H "Content-Type: application/json" \
  -d '{"current_stage": "screening", "notes": "Test email notification"}'
```

Check your terminal - you'll see the email printed there!

#### Option B: Via Python Shell

```bash
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe manage.py shell
```

```python
from pipeline.services.email_service import EmailNotificationService

# Send test email
success = EmailNotificationService.send_stage_update_email(
    candidate_name="John Doe",
    candidate_email="test@example.com",
    job_title="Software Engineer",
    new_stage="screening",
    notes="This is a test email"
)

print(f"Email sent: {success}")
```

## Production Setup (Gmail Example)

### Step 1: Enable 2-Step Verification

1. Go to [Google Account Settings](https://myaccount.google.com/security)
2. Enable 2-Step Verification

### Step 2: Generate App Password

1. Go to [App Passwords](https://myaccount.google.com/apppasswords)
2. Click "Select app" → "Mail"
3. Click "Select device" → "Other (Custom name)"
4. Enter "Django Resume System"
5. Click "Generate"
6. Copy the 16-character password

### Step 3: Update `.env` File

```bash
# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-16-char-app-password
DEFAULT_FROM_EMAIL=your-email@gmail.com
EMAIL_SUBJECT_PREFIX=[Recruitment]

# Company Information
COMPANY_NAME=Your Company Name
COMPANY_WEBSITE=https://yourcompany.com
```

### Step 4: Test Production Email

```bash
# Update .env to enable production mode
DEBUG=False

# Restart server
python manage.py runserver

# Test via API
curl -X PATCH http://127.0.0.1:8000/api/pipeline/1/update_stage/ \
  -H "Content-Type: application/json" \
  -d '{"current_stage": "offer", "notes": "Test production email"}'
```

Check your Gmail inbox - the email should arrive!

## Common Email Providers

### Gmail

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Outlook/Office 365

```bash
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Yahoo Mail

```bash
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### SendGrid

```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.your-sendgrid-api-key
```

### AWS SES

```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-aws-ses-username
EMAIL_HOST_PASSWORD=your-aws-ses-password
```

## Testing Checklist

- [ ] Email settings configured in `.env`
- [ ] Django server restarted
- [ ] Test email sent via API
- [ ] Email received (or printed to console)
- [ ] Email content is correct
- [ ] Candidate name and job title are included
- [ ] Stage-specific template is used
- [ ] Notes from recruiter are included

## Troubleshooting

### Issue: Email Not Sending

**Check:**
1. `.env` file is configured
2. Django server is restarted
3. SMTP credentials are correct
4. Network connectivity is working

**Test:**
```bash
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe manage.py shell
```

```python
from django.core.mail import send_mail

send_mail(
    'Test Subject',
    'Test message',
    'noreply@yourcompany.com',
    ['test@example.com'],
    fail_silently=False,
)
```

### Issue: Template Not Found

**Check:**
1. Template files exist in `pipeline/templates/pipeline/emails/`
2. Template names match `EMAIL_TEMPLATES` dictionary
3. Django can find templates

**Test:**
```python
from django.template.loader import render_to_string

render_to_string('pipeline/emails/screening_invitation.html', {
    'candidate_name': 'Test',
    'job_title': 'Test Job'
})
```

### Issue: Candidate Has No Email

**Behavior:**
- Email is skipped
- Warning logged
- Stage update proceeds normally

**Fix:**
```python
# Update candidate with email
from candidates.models import Candidate

candidate = Candidate.objects.get(id=1)
candidate.email = 'correct@email.com'
candidate.save()
```

## What Emails Look Like

### Screening Invitation

```
Subject: [Recruitment] Screening Interview Invitation - Software Engineer

Dear John Doe,

We are pleased to inform you that your application for the Software Engineer 
position at Your Company has been selected for the next round of interviews.

We would like to invite you for a Screening Interview...

[Professional HTML email with company branding]
```

### Technical Interview

```
Subject: [Recruitment] Technical Interview Invitation - Software Engineer

Dear John Doe,

Congratulations! You have successfully passed the initial screening round...

[Professional HTML email with interview details]
```

### Job Offer

```
Subject: [Recruitment] Job Offer - Software Engineer

🎉 Congratulations! Job Offer

Dear John Doe,

We are thrilled to offer you the position of Software Engineer at Your Company!

Offer Details:
- Annual Salary: $120,000
- Start Date: 2024-04-01
- Work Location: San Francisco, CA

[Professional HTML email with offer details]
```

### Rejection

```
Subject: [Recruitment] Application Status Update - Software Engineer

Dear John Doe,

Thank you for your interest in the Software Engineer position...

[Professional HTML email with constructive feedback]
```

## Next Steps

1. ✅ Configure email settings
2. ✅ Test email system
3. ✅ Customize templates (optional)
4. ✅ Set up production email (optional)
5. ✅ Monitor email delivery
6. ✅ Update branding (optional)

## Additional Resources

- [Full Documentation](./EMAIL_NOTIFICATION_SYSTEM.md)
- [Email Templates](./pipeline/templates/pipeline/emails/)
- [Email Service](./pipeline/services/email_service.py)

---

**Need Help?** Check the full documentation or review the code comments!