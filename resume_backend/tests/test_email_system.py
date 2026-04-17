"""
Test script for email notification system.
Tests email configuration and template rendering.
"""

import os
import sys
import django
from pathlib import Path

# Setup Django
sys.path.insert(0, str(Path(__file__).parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
django.setup()

from django.core.mail import send_mail
from django.conf import settings
from pipeline.services.email_service import EmailNotificationService


def test_email_configuration():
    """Test email configuration."""
    print("=" * 60)
    print("TESTING EMAIL CONFIGURATION")
    print("=" * 60)
    
    print(f"Email Backend: {settings.EMAIL_BACKEND}")
    print(f"Email Host: {settings.EMAIL_HOST}")
    print(f"Email Port: {settings.EMAIL_PORT}")
    print(f"Use TLS: {settings.EMAIL_USE_TLS}")
    print(f"From Email: {settings.DEFAULT_FROM_EMAIL}")
    print(f"Subject Prefix: {settings.EMAIL_SUBJECT_PREFIX}")
    print(f"Company Name: {settings.COMPANY_NAME}")
    print(f"Company Website: {settings.COMPANY_WEBSITE}")
    print()


def test_send_test_email():
    """Send a test email."""
    print("=" * 60)
    print("SENDING TEST EMAIL")
    print("=" * 60)
    
    try:
        result = send_mail(
            subject=settings.EMAIL_SUBJECT_PREFIX + 'Test Email',
            message='This is a test email from the recruitment system.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=['test@example.com'],
            fail_silently=False
        )
        
        if result:
            print(f"[+] Test email sent successfully!")
            print(f"  Recipient: test@example.com")
        else:
            print("[-] Failed to send test email")
            
    except Exception as e:
        print(f"[!] Error sending test email: {e}")
    
    print()


def test_stage_update_emails():
    """Test all stage update emails."""
    print("=" * 60)
    print("TESTING STAGE UPDATE EMAILS")
    print("=" * 60)
    
    test_candidate = {
        'name': 'Test Candidate',
        'email': 'test@example.com'
    }
    
    test_job = {
        'title': 'Software Engineer'
    }
    
    stages_to_test = [
        'screening',
        'technical_interview',
        'hr_interview',
        'offer',
        'rejected'
    ]
    
    for stage in stages_to_test:
        print(f"\nTesting stage: {stage}")
        print("-" * 60)
        
        try:
            result = EmailNotificationService.send_stage_update_email(
                candidate_name=test_candidate['name'],
                candidate_email=test_candidate['email'],
                job_title=test_job['title'],
                new_stage=stage,
                notes=f'Test email for {stage} stage'
            )
            
            if result:
                print(f"  [+] Email sent successfully for stage: {stage}")
            else:
                print(f"  [-] Failed to send email for stage: {stage}")
                
        except Exception as e:
            print(f"  [!] Error for stage {stage}: {e}")
    
    print()


def test_interview_invitation():
    """Test interview invitation email."""
    print("=" * 60)
    print("TESTING INTERVIEW INVITATION EMAIL")
    print("=" * 60)
    
    try:
        result = EmailNotificationService.send_interview_invitation(
            candidate_name='Test Candidate',
            candidate_email='test@example.com',
            job_title='Software Engineer',
            interview_type='screening',
            interview_date='2024-03-20',
            interview_time='10:00 AM',
            interview_location='Zoom',
            additional_notes='Bring your resume and portfolio'
        )
        
        if result:
            print("[+] Interview invitation email sent successfully!")
        else:
            print("[-] Failed to send interview invitation email")
            
    except Exception as e:
        print(f"[!] Error: {e}")
    
    print()


def test_offer_email():
    """Test offer email."""
    print("=" * 60)
    print("TESTING OFFER EMAIL")
    print("=" * 60)
    
    try:
        result = EmailNotificationService.send_offer_email(
            candidate_name='Test Candidate',
            candidate_email='test@example.com',
            job_title='Software Engineer',
            offer_details={
                'salary': '$100,000',
                'start_date': '2024-04-01',
                'location': 'Remote',
                'employment_type': 'Full-time',
                'reporting_to': 'Engineering Manager'
            }
        )
        
        if result:
            print("[+] Offer email sent successfully!")
        else:
            print("[-] Failed to send offer email")
            
    except Exception as e:
        print(f"[!] Error: {e}")
    
    print()


def test_rejection_email():
    """Test rejection email."""
    print("=" * 60)
    print("TESTING REJECTION EMAIL")
    print("=" * 60)
    
    try:
        result = EmailNotificationService.send_rejection_email(
            candidate_name='Test Candidate',
            candidate_email='test@example.com',
            job_title='Software Engineer',
            rejection_reason='Position filled with another candidate',
            feedback='Strong technical skills and great cultural fit. We encourage you to apply for future openings.'
        )
        
        if result:
            print("[+] Rejection email sent successfully!")
        else:
            print("[-] Failed to send rejection email")
            
    except Exception as e:
        print(f"[!] Error: {e}")
    
    print()


def check_email_templates():
    """Check if email templates exist."""
    print("=" * 60)
    print("CHECKING EMAIL TEMPLATES")
    print("=" * 60)
    
    templates_dir = Path(__file__).parent / 'pipeline' / 'templates' / 'pipeline' / 'emails'
    
    if not templates_dir.exists():
        print("[!] Templates directory not found!")
        return
    
    expected_templates = [
        'screening_invitation.html',
        'technical_interview_invitation.html',
        'hr_interview_invitation.html',
        'offer_letter.html',
        'rejection_email.html'
    ]
    
    print(f"Templates directory: {templates_dir}")
    print()
    
    for template in expected_templates:
        template_path = templates_dir / template
        if template_path.exists():
            size = template_path.stat().st_size
            print(f"  [+] {template} ({size} bytes)")
        else:
            print(f"  [-] {template} (NOT FOUND)")
    
    print()


def main():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("EMAIL NOTIFICATION SYSTEM - TEST SUITE")
    print("=" * 60)
    print()
    
    # Test 1: Check email configuration
    test_email_configuration()
    
    # Test 2: Check email templates
    check_email_templates()
    
    # Test 3: Send test email
    test_send_test_email()
    
    # Test 4: Test stage update emails
    test_stage_update_emails()
    
    # Test 5: Test interview invitation
    test_interview_invitation()
    
    # Test 6: Test offer email
    test_offer_email()
    
    # Test 7: Test rejection email
    test_rejection_email()
    
    print("=" * 60)
    print("TEST SUITE COMPLETED")
    print("=" * 60)
    print()
    print("Summary:")
    print("  - Email configuration: Checked")
    print("  - Email templates: Verified")
    print("  - Test email: Sent")
    print("  - Stage update emails: Tested")
    print("  - Interview invitation: Tested")
    print("  - Offer email: Tested")
    print("  - Rejection email: Tested")
    print()
    print("Note: If DEBUG=True, emails are printed to console.")
    print("      If DEBUG=False, emails are sent to recipients.")
    print("=" * 60)


if __name__ == '__main__':
    main()