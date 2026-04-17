from imaplib import IMAP4_SSL
from email.header import decode_header
import email as email_pkg
import logging
from typing import List, Dict, Tuple

from django.core.files.base import ContentFile

from .parser import parse_resume
from .duplicate_checker import find_existing_candidate
from .email_utils import (
    extract_text_from_pdf_from_bytes,
    extract_text_from_docx_from_bytes,
    extract_text_from_doc_from_bytes,
    ocr_pdf_from_bytes,
    sanitize_filename,
)
from ..models import Resume

logger = logging.getLogger(__name__)

def _decode_mime_words(s: str) -> str:
    """Decode MIME encoded headers."""
    decoded_parts = decode_header(s)
    decoded_str = ''
    for part, encoding in decoded_parts:
        if isinstance(part, bytes):
            part = part.decode(encoding or 'utf-8', errors='replace')
        decoded_str += part
    return decoded_str

def _download_attachments(msg, allowed_extensions: Tuple[str, ...] = ('.pdf', '.docx', '.doc')) -> List[Dict]:
    """Download and return attachment info."""
    attachments = []

    for part in msg.walk():
        content_type = part.get_content_type()
        if content_type == 'application/pdf' or 'word' in content_type.lower():
            if filename := part.get_filename():
                decoded_filename = _decode_mime_words(filename)
                if any(decoded_filename.lower().endswith(ext) for ext in allowed_extensions):
                    payload = part.get_payload(decode=True)
                    attachments.append({
                        'filename': decoded_filename,
                        'content': payload,
                        'content_type': content_type
                    })
    return attachments

def process_email_resume(email_host: str, email_user: str, email_pass: str, folder: str = 'INBOX') -> List[Dict]:
    # sourcery skip: low-code-quality
    """Process unread emails with resume attachments."""
    processed_emails = []
    MIN_TEXT_THRESHOLD = 50

    try:
        mail = IMAP4_SSL(email_host)
        mail.login(email_user, email_pass)
        mail.select(folder)

        # Search for unread emails
        status, messages = mail.search(None, 'UNSEEN')
        email_ids = messages[0].split()

        for email_id in email_ids:
            status, msg_data = mail.fetch(email_id, '(RFC822)')
            email_body = msg_data[0][1]

            msg = email_pkg.message_from_bytes(email_body)

            attachments = _download_attachments(msg)

            for attachment in attachments:
                filename = attachment['filename']
                content = attachment['content']

                # Extract text
                lower_name = filename.lower()
                text = ''
                if lower_name.endswith('.pdf'):
                    text = extract_text_from_pdf_from_bytes(content) or ''
                    if len(text.strip()) < MIN_TEXT_THRESHOLD:
                        # OCR fallback for image-based PDFs
                        ocr_text = ocr_pdf_from_bytes(content)
                        if ocr_text and len(ocr_text.strip()) > len(text.strip()):
                            text = ocr_text
                elif lower_name.endswith('.docx'):
                    text = extract_text_from_docx_from_bytes(content) or ''
                elif lower_name.endswith('.doc'):
                    text = extract_text_from_doc_from_bytes(content) or ''
                else:
                    processed_emails.append({
                        'filename': filename,
                        'status': 'skipped_unsupported_type'
                    })
                    continue

                if len(text.strip()) < MIN_TEXT_THRESHOLD:
                    processed_emails.append({
                        'filename': filename,
                        'status': 'extraction_failed',
                        'reason': 'too_little_text_after_extraction'
                    })
                    continue

                # Parse resume to get candidate info
                parsed_data = parse_resume(text)

                # Find or create candidate - SAFE INITIALIZATION
                candidate_email = parsed_data.get('Email') or parsed_data.get('email') or None
                phone = parsed_data.get('Phone') or parsed_data.get('phone') or None

                candidate = None
                if candidate_email or phone:
                    candidate = find_existing_candidate(candidate_email, phone)

                if not candidate:
                    from candidates.views import create_or_get_candidate
                    candidate, _ = create_or_get_candidate(parsed_data)
                else:
                    # Update existing candidate fields similarly to parse endpoint behavior
                    try:
                        _extracted_from_process_email_resume_73(parsed_data, candidate)
                    except Exception:
                        logger.exception("Failed updating candidate %s from parsed data", getattr(candidate, 'id', None))

                # Save resume
                safe_filename = sanitize_filename(filename)
                file_name = f"resumes/email_{safe_filename}"

                resume = Resume.objects.create(
                    candidate=candidate,
                    file=file_name,
                    file_name=filename,
                    text=text,
                    source='email'
                )

                # Save file content
                resume.file.save(safe_filename, ContentFile(content), save=True)

                # Trigger skill extraction
                from candidates.services.skills import skill_service
                skill_service.extract_skills(candidate, text)

                processed_emails.append({
                    'resume_id': resume.id,
                    'candidate_id': candidate.id,
                    'filename': filename,
                    'status': 'processed',
                    'parsed': {
                        'Name': parsed_data.get('Name') or parsed_data.get('name'),
                        'Email': parsed_data.get('Email') or parsed_data.get('email'),
                        'Phone': parsed_data.get('Phone') or parsed_data.get('phone'),
                        'Skills': parsed_data.get('Skills') or parsed_data.get('skills'),
                    }
                })

            # Mark as read
            mail.store(email_id, '+FLAGS', '\\Seen')

        mail.close()
        mail.logout()

    except Exception as e:
        logger.exception("Failed to process email resumes")
        processed_emails.append({'error': str(e)})

    return processed_emails


# TODO Rename this here and in `process_email_resume`
def _extracted_from_process_email_resume_73(parsed_data, candidate):
    candidate.name = parsed_data.get("Name") or parsed_data.get("name") or candidate.name
    candidate.email = parsed_data.get("Email") or parsed_data.get("email") or candidate.email
    candidate.phone = parsed_data.get("Phone") or parsed_data.get("phone") or candidate.phone
    candidate.skills = parsed_data.get("Skills") or parsed_data.get("skills") or candidate.skills or []
    candidate.education = parsed_data.get("Education") or parsed_data.get("education") or candidate.education or []
    candidate.experience = parsed_data.get("Experience Summary") or parsed_data.get("experience") or candidate.experience or []
    candidate.projects = parsed_data.get("Projects") or parsed_data.get("projects") or candidate.projects or []
    candidate.save()
    
    # Generate summary if it doesn't exist
    if not candidate.summary:
        from candidates.services.summary import summary_service
        summary_service.generate_candidate_summary(candidate, candidate.resumes.order_by('-uploaded_at').first().text if candidate.resumes.exists() else "")





