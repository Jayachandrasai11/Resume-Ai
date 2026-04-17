# Email Notification System Documentation

## Overview

The Email Notification System automatically sends emails to candidates when their interview stage changes in the recruitment pipeline. This system ensures timely communication with candidates throughout the hiring process.

## Features

✅ **Automatic Email Triggers**: Emails are sent automatically when a candidate's stage is updated
✅ **Multiple Email Types**: Supports different email types for each stage
✅ **HTML Templates**: Professional, branded email templates
✅ **Personalized Content**: Includes candidate name, job title, and custom notes
✅ **Error Handling**: Graceful error handling with logging
✅ **Configurable**: Easy to customize templates and settings
✅ **Fallback Messages**: Plain text fallback if template rendering fails

## Email Types

### 1. Screening Interview Invitation
**Stage:** `screening`

**Trigger:** When candidate is moved to screening stage

**Includes:**
- Interview details (date, time, location)
- Additional notes from recruiter
- Company branding

### 2. Technical Interview Invitation
**Stage:** `technical_interview`

**Trigger:** When candidate passes screening and moves to technical interview

**Includes:**
- Interview details
- What to expect during technical interview
- Preparation tips

### 3. HR Interview Invitation
**Stage:** `hr_interview`

**Trigger:** When candidate passes technical interview

**Includes:**
- Interview details
- Overview of culture and values discussion
- Benefits and compensation preview

### 4. Job Offer
**Stage:** `offer`

**Trigger:** When candidate is selected for the position

**Includes:**
- Offer details (salary, start date, location)
- Benefits overview
- Acceptance link

### 5. Rejection Email
**Stage:** `rejected`

**Trigger:** When candidate is not selected for the position

**Includes:**
- Reason for rejection (optional)
- Feedback (optional)
- Professional closing message

## Configuration

### Email Settings in `.env`

Add these settings to your `.env` file:

```bash
# Email Configuration
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourcompany.com
EMAIL_SUBJECT_PREFIX=[Recruitment]

# Company Information (optional)
COMPANY_NAME=Your Company
COMPANY_WEBSITE=https://yourcompany.com
```

### Development Mode

For development, emails will be printed to console instead of being sent:

```bash
DEBUG=True
```

This is automatically configured in `settings.py` when `DEBUG=True`.

## How It Works

### 1. Stage Update Flow

```
User updates candidate stage
    ↓
Pipeline view receives request
    ↓
Stage is updated in database
    ↓
Email service is triggered
    ↓
Email template is rendered
    ↓
Email is sent to candidate
    ↓
Success/Error is logged
    ↓
Response returned to user
```

### 2. Email Service

The `EmailNotificationService` class handles all email operations:

```python
from pipeline.services.email_service import EmailNotificationService

# Send stage update email
EmailNotificationService.send_stage_update_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    new_stage="technical_interview",
    notes="Strong technical skills demonstrated"
)
```

### 3. Automatic Triggers

Emails are automatically sent when:

1. **Via API:**
   ```bash
   PATCH /api/pipeline/{id}/update_stage/
   ```

2. **Via Alternative API:**
   ```bash
   POST /api/pipeline/update-stage/
   ```

3. **Via Admin Panel:**
   - When you update the stage in Django admin
   - Note: You may need to override the `save()` method in the model for admin triggers

## Email Templates

### Template Location

```
Project1/resume_backend/pipeline/templates/pipeline/emails/
├── screening_invitation.html
├── technical_interview_invitation.html
├── hr_interview_invitation.html
├── offer_letter.html
└── rejection_email.html
```

### Template Context Variables

All templates have access to these variables:

```html
{{ candidate_name }}      # Candidate's full name
{{ job_title }}           # Job position title
{{ stage }}               # Current stage (e.g., 'technical_interview')
{{ stage_display }}       # Human-readable stage (e.g., 'Technical Interview')
{{ notes }}               # Notes from recruiter
{{ company_name }}        # Company name
{{ company_website }}     # Company website
{% now "Y" %}             # Current year
```

### Customizing Templates

You can customize any email template by editing the HTML files. Each template includes:

- Professional styling
- Company branding
- Responsive design
- Personalized content

## API Usage

### Update Stage with Email Notification

**Endpoint:** `PATCH /api/pipeline/{id}/update_stage/`

**Request:**
```json
{
  "current_stage": "technical_interview",
  "notes": "Excellent performance in screening"
}
```

**Response:**
```json
{
  "id": 1,
  "candidate": 1,
  "candidate_name": "John Doe",
  "candidate_email": "john@example.com",
  "job": 1,
  "job_title": "Software Engineer",
  "current_stage": "technical_interview",
  "stage_display": "Technical Interview",
  "notes": "Excellent performance in screening",
  "created_at": "2024-03-14T10:30:00Z",
  "updated_at": "2024-03-14T14:20:00Z"
}
```

**Result:** Email is automatically sent to `john@example.com`

### Alternative Endpoint

**Endpoint:** `POST /api/pipeline/update-stage/`

**Request:**
```json
{
  "candidate_id": 1,
  "job_id": 1,
  "current_stage": "offer",
  "notes": "Congratulations! We'd like to make you an offer."
}
```

## Testing Email System

### Development Mode

In development mode, emails are printed to console:

```bash
# Terminal output when email is sent
Content-Type: text/html; charset="utf-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 8bit
Subject: [Recruitment] Technical Interview Invitation - Software Engineer
From: noreply@yourcompany.com
To: john@example.com
Date: Thu, 14 Mar 2024 10:30:00 -0000

<!DOCTYPE html>
<html>
...
</html>
```

### Test with Python Shell

```python
cd Project1/resume_backend
..\..\.venv\Scripts\python.exe manage.py shell
```

```python
from pipeline.services.email_service import EmailNotificationService

# Test email
success = EmailNotificationService.send_stage_update_email(
    candidate_name="Test User",
    candidate_email="test@example.com",
    job_title="Software Engineer",
    new_stage="screening",
    notes="Test email"
)

print(f"Email sent: {success}")
```

### Test via API

```bash
# First, get a pipeline ID
curl http://127.0.0.1:8000/api/pipeline/

# Then update the stage
curl -X PATCH http://127.0.0.1:8000/api/pipeline/1/update_stage/ \
  -H "Content-Type: application/json" \
  -d '{"current_stage": "screening", "notes": "Test email"}'
```

## Error Handling

### Logging

All email operations are logged:

```python
import logging

logger = logging.getLogger(__name__)

# Success
logger.info(f"Email sent successfully to {candidate_email}")

# Warning
logger.warning(f"Failed to send email to {candidate_email}")

# Error
logger.error(f"Error sending email: {error}")
```

### Common Issues

#### 1. Email Not Sent

**Possible Causes:**
- SMTP credentials incorrect
- Network connectivity issues
- Email backend misconfigured

**Solution:**
- Check `.env` settings
- Verify SMTP credentials
- Check firewall settings
- Review logs for error messages

#### 2. Template Not Found

**Possible Causes:**
- Template file missing
- Incorrect template path

**Solution:**
- Verify template exists in correct location
- Check template name in `EMAIL_TEMPLATES` dictionary

#### 3. Candidate Has No Email

**Behavior:**
- Email is skipped
- Warning is logged
- Stage update proceeds normally

**Solution:**
- Ensure candidate email is populated
- Update candidate record with email address

## Advanced Usage

### Custom Email Content

You can send custom emails using the service:

```python
from pipeline.services.email_service import EmailNotificationService

# Send custom email
EmailNotificationService.send_custom_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    subject="Additional Information Required",
    message="Please provide your portfolio link."
)
```

### Interview Details

Add interview details to context:

```python
context = {
    'interview_date': '2024-03-20',
    'interview_time': '10:00 AM',
    'interview_location': 'Zoom Meeting',
    'additional_notes': 'Please bring your laptop'
}

EmailNotificationService.send_stage_update_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    new_stage="screening",
    context=context
)
```

### Offer Details

Send offer with details:

```python
offer_details = {
    'salary': '$120,000 per year',
    'start_date': '2024-04-01',
    'location': 'San Francisco, CA',
    'benefits': ['Health Insurance', '401k', 'Remote Work']
}

EmailNotificationService.send_offer_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    offer_details=offer_details
)
```

## Security Best Practices

### 1. Never Commit Credentials

**❌ DON'T:**
```bash
# .env file
EMAIL_PASSWORD=MySecretPassword123
```

**✅ DO:**
```bash
# .env file
EMAIL_HOST_PASSWORD=your-app-specific-password

# .gitignore
.env
```

### 2. Use App-Specific Passwords

For Gmail, use an App-Specific Password instead of your regular password:

1. Go to Google Account Settings
2. Enable 2-Step Verification
3. Generate App-Specific Password
4. Use it in `.env` file

### 3. Environment-Specific Settings

```bash
# Development (.env.development)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# Production (.env.production)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.your-provider.com
```

## Monitoring and Maintenance

### Check Email Logs

```python
# View recent logs
tail -f /path/to/django.log

# Search for email-related logs
grep "Email" /path/to/django.log
```

### Monitor Email Delivery

- Track email open rates
- Monitor bounce rates
- Review delivery failures
- Check spam folder placement

### Update Templates Regularly

- Keep branding current
- Update company information
- Refresh content periodically
- Test with different email clients

## Troubleshooting

### Issue: Emails Not Sending in Production

**Checklist:**
1. Verify SMTP settings in `.env`
2. Test SMTP connection
3. Check firewall rules
4. Review email provider limits
5. Verify domain SPF/DKIM records

### Issue: Emails Going to Spam

**Solutions:**
1. Set up SPF, DKIM, and DMARC records
2. Use a reputable email service
3. Avoid spam trigger words
4. Keep email lists clean
5. Monitor sender reputation

### Issue: Template Not Rendering

**Debug Steps:**
1. Check template syntax
2. Verify context variables
3. Test template manually
4. Check for missing closing tags
5. Review Django template loader settings

## Performance Considerations

### Asynchronous Email Sending

For high-volume systems, consider using Celery for async email sending:

```python
from celery import shared_task

@shared_task
def send_stage_update_email_async(candidate_id, job_id, new_stage, notes):
    # Send email asynchronously
    pass
```

### Email Queuing

Implement email queuing for better performance:

```python
from django.core.mail import get_connection

connection = get_connection()
emails = []
# Add emails to queue
connection.send_messages(emails)
```

### Rate Limiting

Implement rate limiting to avoid email provider limits:

```python
from django.core.cache import cache

def send_email_with_rate_limit(candidate_email):
    key = f"email_sent_{candidate_email}"
    if cache.get(key):
        return False
    # Send email
    cache.set(key, True, timeout=3600)  # 1 hour
    return True
```

## Compliance and Privacy

### GDPR Considerations

1. Obtain consent for email communications
2. Provide unsubscribe option
3. Store email data securely
4. Allow data export/deletion requests

### CAN-SPAM Compliance

1. Include physical address
2. Provide opt-out mechanism
3. Use accurate header information
4. Honor opt-out requests promptly

## Support and Maintenance

### Regular Tasks

- [ ] Review and update email templates quarterly
- [ ] Monitor email deliverability metrics
- [ ] Update SMTP credentials periodically
- [ ] Review and update email content
- [ ] Test email system after updates

### Emergency Contacts

- Email Service Provider Support
- IT Security Team
- Legal Department (for compliance issues)

## Additional Resources

- [Django Email Documentation](https://docs.djangoproject.com/en/stable/topics/email/)
- [Email Template Best Practices](https://www.campaignmonitor.com/resources/guides/email-design-guide/)
- [SMTP Configuration Guides](https://support.google.com/mail/answer/7126229)

---

**Last Updated:** March 14, 2026

**Version:** 1.0.0