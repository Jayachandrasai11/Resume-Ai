"""Helper utilities for email processing."""
import io
import re

def sanitize_filename(filename: str) -> str:
    """Sanitize filename for storage."""
    # Remove path traversal attempts
    filename = re.sub(r'[^\w\-. ]', '', filename)
    return filename[:255] or 'resume'

def extract_text_from_pdf_from_bytes(content: bytes) -> str:
    """Extract text from PDF bytes using PyMuPDF."""
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=content, filetype="pdf")
        text = ''
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except ImportError:
        # Fallback to pypdf if PyMuPDF not available
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(content))
        text = ''
        for page in reader.pages:
            text += page.extract_text() + '\n'
        return text
    except Exception:
        return ''

def extract_text_from_docx_from_bytes(content: bytes) -> str:
    """Extract text from DOCX bytes."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(content))
        text = ''
        for para in doc.paragraphs:
            text += para.text + '\n'
        return text
    except ImportError:
        return ''
    except Exception:
        return ''


def extract_text_from_doc_from_bytes(content: bytes) -> str:
    """Extract text from legacy DOC bytes using optional backends.
    Attempts textract if available; returns empty string on failure.
    """
    try:
        # Try textract which can handle .doc via antiword/catdoc if installed
        import textract  # type: ignore
        text_bytes = textract.process(io.BytesIO(content), extension='doc')
        if isinstance(text_bytes, bytes):
            return text_bytes.decode('utf-8', errors='ignore')
        return str(text_bytes) if text_bytes else ''
    except Exception:
        # As a fallback, no robust pure-python DOC parser is available without system deps
        return ''


def ocr_pdf_from_bytes(content: bytes) -> str:
    """OCR fallback for image-based PDFs. Requires pytesseract and pdf2image.
    Returns empty string if OCR dependencies are missing or errors occur.
    """
    try:
        from pdf2image import convert_from_bytes  # type: ignore
        import pytesseract  # type: ignore
        from PIL import Image  # noqa: F401
    except Exception:
        return ''

    try:
        images = convert_from_bytes(content)
        text_parts = []
        for img in images:
            try:
                text_parts.append(pytesseract.image_to_string(img) or '')
            except Exception:
                continue
        return '\n'.join(text_parts).strip()
    except Exception:
        return ''
