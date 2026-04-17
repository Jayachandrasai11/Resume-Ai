# Email Notification System - Complete Guide

## Overview

The Email Notification System automatically sends emails to candidates when their interview stage changes in the pipeline. This keeps candidates informed throughout the hiring process and improves their experience.

## Features

✅ **Automated Email Triggers**: Emails are sent automatically when candidate stages are updated
✅ **Multiple Email Templates**: Professional HTML templates for each stage
✅ **Customizable Content**: Dynamic content based on candidate and job information
✅ **Error Handling**: Graceful handling of email sending failures
✅ **Logging**: Comprehensive logging for debugging and monitoring
✅ **Fallback Messages**: Plain text fallback if template rendering fails

## Email Types

### 1. Screening Interview Invitation
- **Trigger**: When candidate stage changes to `screening`
- **Content**: Invitation for initial screening call
- **Includes**: Candidate name, job title, interview details, company information

### 2. Technical Interview Invitation
- **Trigger**: When candidate stage changes to `technical_interview`
- **Content**: Invitation for technical assessment
- **Includes**: Interview expectations, preparation tips, technical details

### 3. HR Interview Invitation
- **Trigger**: When candidate stage changes to `hr_interview`
- **Content**: Final interview invitation
- **Includes**: Culture fit discussion, compensation overview, company information

### 4. Job Offer
- **Trigger**: When candidate stage changes to `offer`
- **Content**: Formal job offer letter
- **Includes**: Salary details, start date, employment terms, congratulations

### 5. Rejection Email
- **Trigger**: When candidate stage changes to `rejected`
- **Content**: Polite rejection notification
- **Includes**: Rejection reason (optional), feedback, future opportunities

## Configuration

### 1. Email Settings in `.env`

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

# Company Information
COMPANY_NAME=Your Company Name
COMPANY_WEBSITE=https://yourcompany.com
COMPANY_ADDRESS=123 Business St, City, State
COMPANY_PHONE=+1-234-567-8900
```

### 2. Gmail Configuration (Recommended)

For Gmail, you need to:
1. Enable 2-Factor Authentication
2. Generate an App Password
3. Use the App Password in `EMAIL_HOST_PASSWORD`

**Steps:**
1. Go to Google Account settings
2. Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Use the 16-character password in your `.env` file

### 3. Development Mode

For development/testing without sending actual emails:

```bash
DEBUG=True
```

This will use the console backend, printing emails to the terminal instead of sending them.

### 4. Other Email Providers

**SendGrid:**
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=apikey
EMAIL_HOST_PASSWORD=SG.your-api-key
```

**Amazon SES:**
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-aws-access-key
EMAIL_HOST_PASSWORD=your-aws-secret-key
```

**Outlook/Office 365:**
```bash
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@outlook.com
EMAIL_HOST_PASSWORD=your-password
```

## Email Templates

### Template Location

All email templates are located in:
```
pipeline/templates/pipeline/emails/
├── screening_invitation.html
├── technical_interview_invitation.html
├── hr_interview_invitation.html
├── offer_letter.html
└── rejection_email.html
```

### Template Variables

Each template has access to these variables:

```python
{
    'candidate_name': 'John Doe',
    'job_title': 'Software Engineer',
    'stage': 'screening',
    'stage_display': 'Screening',
    'notes': 'Additional notes',
    'company_name': 'Your Company',
    'company_website': 'https://yourcompany.com',
    # Additional context based on stage
}
```

### Customizing Templates

To customize email templates:

1. Edit the HTML files in `pipeline/templates/pipeline/emails/`
2. Modify the content, styling, or layout
3. Add custom variables in the email service
4. Test changes by updating a candidate stage

## API Usage

### Automatic Email Sending

Emails are sent automatically when you update a candidate's stage:

```bash
# Update candidate stage - email sent automatically
curl -X PATCH http://localhost:8000/api/pipeline/1/update_stage/ \
  -H "Content-Type: application/json" \
  -d '{
    "current_stage": "screening",
    "notes": "Schedule screening call for next week"
  }'
```

### Manual Email Sending

You can also send emails programmatically:

```python
from pipeline.services.email_service import EmailNotificationService

# Send stage update email
EmailNotificationService.send_stage_update_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    new_stage="screening",
    notes="Initial screening invitation"
)

# Send interview invitation
EmailNotificationService.send_interview_invitation(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    interview_type="screening",
    interview_date="2024-03-20",
    interview_time="10:00 AM",
    interview_location="Zoom",
    additional_notes="Bring your resume"
)

# Send offer email
EmailNotificationService.send_offer_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    offer_details={
        'salary': '$100,000',
        'start_date': '2024-04-01',
        'location': 'Remote',
        'employment_type': 'Full-time'
    }
)

# Send rejection email
EmailNotificationService.send_rejection_email(
    candidate_name="John Doe",
    candidate_email="john@example.com",
    job_title="Software Engineer",
    rejection_reason="Position filled",
    feedback="Strong technical skills but not the right fit"
)
```

## Email Service API

### Main Service Class

```python
from pipeline.services.email_service import EmailNotificationService

# Singleton instance
email_service = EmailNotificationService()
```

### Methods

#### `send_stage_update_email()`
Send email when stage changes.

**Parameters:**
- `candidate_name`: str - Candidate's name
- `candidate_email`: str - Candidate's email
- `job_title`: str - Job title
- `new_stage`: str - New pipeline stage
- `notes`: Optional[str] - Additional notes
- `context`: Optional[Dict] - Additional template context

**Returns:** `bool` - Success status

#### `send_interview_invitation()`
Send interview invitation.

**Additional Parameters:**
- `interview_type`: str - Type of interview
- `interview_date`: Optional[str] - Interview date
- `interview_time`: Optional[str] - Interview time
- `interview_location`: Optional[str] - Interview location
- `additional_notes`: Optional[str] - Additional notes

#### `send_offer_email()`
Send job offer.

**Additional Parameters:**
- `offer_details`: Optional[Dict] - Offer details dictionary

#### `send_rejection_email()`
Send rejection email.

**Additional Parameters:**
- `rejection_reason`: Optional[str] - Reason for rejection
- `feedback`: Optional[str] - Feedback for candidate

#### `send_custom_email()`
Send custom email.

**Additional Parameters:**
- `subject`: str - Custom subject
- `message`: str - Custom message

## Testing

### 1. Test Email Configuration

```python
from django.core.mail import send_mail

send_mail(
    'Test Subject',
    'Test message body',
    'from@example.com',
    ['to@example.com'],
    fail_silently=False,
)
```

### 2. Test Email Templates

```python
from pipeline.services.email_service import EmailNotificationService

# Test with console backend (no actual email sent)
EmailNotificationService.send_stage_update_email(
    candidate_name="Test User",
    candidate_email="test@example.com",
    job_title="Test Job",
    new_stage="screening",
    notes="Test email"
)
```

### 3. View Email Logs

Email sending is logged. Check logs for:
```
INFO: Email sent successfully to test@example.com for stage: screening
WARNING: Failed to send email notification to test@example.com
ERROR: Error sending email notification: ...
```

## Troubleshooting

### Issue: Emails not being sent

**Solutions:**
1. Check email configuration in `.env`
2. Verify email credentials are correct
3. Check firewall/network settings
4. Review error logs
5. Test with console backend first

### Issue: Template not found

**Solutions:**
1. Verify template files exist in correct location
2. Check template names in `EMAIL_TEMPLATES` dictionary
3. Ensure Django can find templates (check `TEMPLATES` setting)

### Issue: Candidate has no email

**Solution:**
- The system logs a warning and skips email sending
- Update candidate profile with email address

### Issue: Gmail authentication failed

**Solutions:**
1. Use App Password instead of regular password
2. Enable 2-Factor Authentication
3. Check Gmail security settings
4. Verify "Less secure app access" is enabled (for older accounts)

### Issue: Emails going to spam

**Solutions:**
1. Use professional email domain
2. Set up SPF, DKIM, DMARC records
3. Use reputable email service (SendGrid, Mailgun, etc.)
4. Avoid spammy content in emails

## Monitoring

### Email Logs

The system logs all email attempts:

```python
import logging

logger = logging.getLogger(__name__)

# View logs
logger.info("Email sent successfully...")
logger.warning("Failed to send email...")
logger.error("Error sending email...")
```

### Email Statistics

You can track email sending by monitoring logs:

```python
# Count successful emails
# Count failed emails
# Identify candidates without emails
# Track email sending patterns
```

## Best Practices

### 1. Email Content
- Keep emails concise and professional
- Personalize when possible
- Include clear next steps
- Provide contact information

### 2. Timing
- Send emails promptly after stage changes
- Consider time zones when scheduling interviews
- Allow time for candidates to respond

### 3. Follow-up
- Send reminders if no response
- Keep records of all communications
- Document interview details

### 4. Privacy
- Protect candidate information
- Use BCC for mass emails
- Comply with email regulations (GDPR, CAN-SPAM)

## Security

### Email Credentials

1. Never commit `.env` file to version control
2. Use environment variables for sensitive data
3. Rotate passwords regularly
4. Use app-specific passwords when possible
5. Monitor email account for unauthorized access

### Template Security

1. Validate user input before using in templates
2. Escape HTML content to prevent XSS
3. Don't include sensitive information in emails
4. Use HTTPS for any links in emails

## Advanced Features

### Conditional Email Sending

Add custom logic in the email service:

```python
# Only send email during business hours
from datetime import datetime
now = datetime.now()
if 9 <= now.hour < 18 and now.weekday() < 5:
    # Send email
    pass
```

### Email Queuing

For high-volume systems, use Celery for async email sending:

```python
from celery import shared_task

@shared_task
def send_email_async(candidate_id, job_id, new_stage):
    # Send email asynchronously
    pass
```

### Email Analytics

Track email opens and clicks:

```python
# Add tracking pixel to emails
# Use unique tracking URLs
# Monitor engagement metrics
```

## Support

For issues or questions:
1. Check logs for error messages
2. Verify email configuration
3. Test with console backend first
4. Review Django email documentation
5. Check email provider status

## Next Steps

1. Configure email settings in `.env`
2. Test email sending with console backend
3. Customize email templates if needed
4. Update candidate stages to trigger emails
5. Monitor email logs for issues
6. Set up production email backend

## Example Workflow

```python
# 1. Update candidate stage
pipeline = CandidatePipeline.objects.get(id=1)
pipeline.current_stage = 'screening'
pipeline.notes = 'Schedule for next week'
pipeline.save()

# 2. Email is automatically sent to candidate
# 3. Candidate receives professional HTML email
# 4. System logs the email sending
# 5. Continue with next stages as needed
```

---

**Congratulations! Your email notification system is now fully configured and ready to use!** 🎉