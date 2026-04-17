import logging
from apps.pipeline.services.email_service import EmailNotificationService

logger = logging.getLogger(__name__)

def send_stage_notification(candidate, job, new_stage, notes=''):
    """
    Send email notification for stage change.
    
    Args:
        candidate: Candidate instance
        job: JobDescription instance
        new_stage: str, New stage value
        notes: str, Optional notes
    """
    try:
        if not candidate.email:
            logger.warning(f"Candidate {candidate.name} (ID: {candidate.id}) has no email address. Skipping email notification.")
            return
        
        email_sent = EmailNotificationService.send_stage_update_email(
            candidate_name=candidate.name,
            candidate_email=candidate.email,
            job_title=job.title,
            new_stage=new_stage,
            notes=notes
        )
        
        if email_sent:
            logger.info(f"Email notification sent to {candidate.email} for stage change to: {new_stage}")
        else:
            logger.warning(f"Failed to send email notification to {candidate.email}")
            
    except Exception as e:
        logger.error(f"Error sending email notification: {e}")
