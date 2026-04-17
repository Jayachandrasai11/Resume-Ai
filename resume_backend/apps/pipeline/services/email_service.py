"""
Email notification service for candidate pipeline updates.
Sends automated emails to candidates when their interview stage changes.
"""

import logging
from django.core.mail import send_mail
from django.conf import settings
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)


class EmailNotificationService:
    """Service for sending email notifications to candidates."""
    
    # Email subjects for different stages
    EMAIL_SUBJECTS = {
        'screening': 'Screening Interview Invitation - {job_title}',
        'technical_interview': 'Technical Interview Invitation - {job_title}',
        'hr_interview': 'HR Interview Invitation - {job_title}',
        'offer': 'Job Offer - {job_title}',
        'rejected': 'Application Status Update - {job_title}',
    }
    
    @staticmethod
    def send_stage_update_email(
        candidate_name: str,
        candidate_email: str,
        job_title: str,
        new_stage: str,
        notes: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send email notification when candidate's stage changes.
        
        Args:
            candidate_name: Name of the candidate
            candidate_email: Email address of the candidate
            job_title: Title of the job position
            new_stage: New pipeline stage
            notes: Optional notes about the stage change
            context: Additional context for email template
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Skip email for 'applied' stage (initial application)
            if new_stage == 'applied':
                logger.info(f"Skipping email for initial application stage: {candidate_email}")
                return True
            
            # Prepare email subject
            subject_template = EmailNotificationService.EMAIL_SUBJECTS.get(new_stage, 'Application Update')
            subject = settings.EMAIL_SUBJECT_PREFIX + subject_template.format(job_title=job_title)
            
            # Prepare context for template
            email_context = {
                'candidate_name': candidate_name,
                'job_title': job_title,
                'stage': new_stage,
                'stage_display': new_stage.replace('_', ' ').title(),
                'notes': notes or '',
                'company_name': getattr(settings, 'COMPANY_NAME', 'Your Company'),
                'company_website': getattr(settings, 'COMPANY_WEBSITE', ''),
            }
            
            # Add any additional context
            if context:
                email_context.update(context)
            
            # Render email body (templates removed; generate HTML in-code)
            message = EmailNotificationService._render_html_message(email_context)
            
            # Send email
            send_mail(
                subject=subject,
                message='',  # Plain text version (empty if using HTML)
                html_message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[candidate_email],
                fail_silently=False
            )
            
            logger.info(f"Email sent successfully to {candidate_email} for stage: {new_stage}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {candidate_email}: {e}")
            return False
    
    @staticmethod
    def _render_html_message(context: Dict[str, Any]) -> str:
        """
        Generate a simple HTML email body without Django templates.
        Keeping this in-code avoids runtime dependency on `templates/` directories
        while still allowing HTML emails in production.
        """

        candidate_name = context.get("candidate_name", "Candidate")
        job_title = context.get("job_title", "the position")
        stage_display = context.get("stage_display", context.get("stage", "Update"))
        notes = (context.get("notes") or "").strip()
        company_name = context.get("company_name", "Your Company")
        company_website = context.get("company_website", "")

        extra_lines = ""
        if notes:
            extra_lines = f"<p><strong>Notes:</strong> {notes}</p>"

        website_line = ""
        if company_website:
            website_line = f'<p>Website: <a href="{company_website}">{company_website}</a></p>'

        return f"""
<!doctype html>
<html>
  <body style="font-family: Arial, sans-serif; color: #222;">
    <p>Dear {candidate_name},</p>
    <p>
      We are writing to inform you about an update regarding your application for
      <strong>{job_title}</strong> at <strong>{company_name}</strong>.
    </p>
    <p>Your application status has been updated to: <strong>{stage_display}</strong></p>
    {extra_lines}
    <p>If you have any questions, please don't hesitate to contact us.</p>
    <p>Best regards,<br/>Recruitment Team</p>
    {website_line}
  </body>
</html>
""".strip()

    @staticmethod
    def _get_fallback_message(context: Dict[str, Any]) -> str:
        """
        Generate fallback plain text message if template rendering fails.
        
        Args:
            context: Email context dictionary
            
        Returns:
            str: Plain text email message
        """
        stage_display = context.get('stage_display', context.get('stage', 'Unknown'))
        
        message = f"""
Dear {context.get('candidate_name', 'Candidate')},

We are writing to inform you about an update regarding your application for the {context.get('job_title', 'position')} at {context.get('company_name', 'our company')}.

Your application status has been updated to: {stage_display}

"""
        
        if context.get('notes'):
            message += f"Additional Notes:\n{context.get('notes')}\n\n"
        
        message += """
If you have any questions, please don't hesitate to contact us.

Best regards,
Recruitment Team
"""
        
        return message.strip()
    
    @staticmethod
    def send_interview_invitation(
        candidate_name: str,
        candidate_email: str,
        job_title: str,
        interview_type: str,
        interview_date: Optional[str] = None,
        interview_time: Optional[str] = None,
        interview_location: Optional[str] = None,
        additional_notes: Optional[str] = None
    ) -> bool:
        """
        Send interview invitation email.
        
        Args:
            candidate_name: Name of the candidate
            candidate_email: Email address of the candidate
            job_title: Title of the job position
            interview_type: Type of interview (screening, technical, hr)
            interview_date: Date of the interview
            interview_time: Time of the interview
            interview_location: Location of the interview
            additional_notes: Additional notes for the candidate
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        context = {
            'interview_type': interview_type,
            'interview_date': interview_date,
            'interview_time': interview_time,
            'interview_location': interview_location,
            'additional_notes': additional_notes,
        }
        
        return EmailNotificationService.send_stage_update_email(
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            job_title=job_title,
            new_stage=interview_type,
            context=context
        )
    
    @staticmethod
    def send_offer_email(
        candidate_name: str,
        candidate_email: str,
        job_title: str,
        offer_details: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send job offer email.
        
        Args:
            candidate_name: Name of the candidate
            candidate_email: Email address of the candidate
            job_title: Title of the job position
            offer_details: Dictionary containing offer details
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        context = {
            'offer_details': offer_details or {},
        }
        
        return EmailNotificationService.send_stage_update_email(
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            job_title=job_title,
            new_stage='offer',
            context=context
        )
    
    @staticmethod
    def send_rejection_email(
        candidate_name: str,
        candidate_email: str,
        job_title: str,
        rejection_reason: Optional[str] = None,
        feedback: Optional[str] = None
    ) -> bool:
        """
        Send rejection email.
        
        Args:
            candidate_name: Name of the candidate
            candidate_email: Email address of the candidate
            job_title: Title of the job position
            rejection_reason: Reason for rejection
            feedback: Optional feedback for the candidate
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        context = {
            'rejection_reason': rejection_reason,
            'feedback': feedback,
        }
        
        return EmailNotificationService.send_stage_update_email(
            candidate_name=candidate_name,
            candidate_email=candidate_email,
            job_title=job_title,
            new_stage='rejected',
            context=context
        )
    
    @staticmethod
    def send_custom_email(
        candidate_name: str,
        candidate_email: str,
        job_title: str,
        subject: str,
        message: str
    ) -> bool:
        """
        Send custom email to candidate.
        
        Args:
            candidate_name: Name of the candidate
            candidate_email: Email address of the candidate
            job_title: Title of the job position
            subject: Custom email subject
            message: Custom email message
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            full_subject = settings.EMAIL_SUBJECT_PREFIX + subject
            
            send_mail(
                subject=full_subject,
                message=message,
                html_message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[candidate_email],
                fail_silently=False
            )
            
            logger.info(f"Custom email sent successfully to {candidate_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send custom email to {candidate_email}: {e}")
            return False


# Singleton instance
email_service = EmailNotificationService()