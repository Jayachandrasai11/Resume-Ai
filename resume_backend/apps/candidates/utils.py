import fitz  # PyMuPDF
import docx
import docx2txt
import logging
import io
import os

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path):
    """Extract text from PDF with multiple fallback strategies."""
    text = ""
    try:
        # Strategy 1: PyMuPDF (Fastest/Best)
        with fitz.open(file_path) as pdf:
            for page in pdf:
                page_text = page.get_text()
                if page_text:
                    text += page_text + "\n"
        
        # Strategy 2: Check if extraction was successful
        if not text.strip():
            logger.warning(f"PyMuPDF extracted no text from {file_path}, file might be scanned/image-only.")
            # In a future update, we could add OCR here (e.g. pytesseract)
            
    except Exception as e:
        logger.error(f"Error extracting text from PDF {file_path}: {e}")
        raise ValueError(f"Could not read PDF content: {str(e)}")
        
    return text.strip()


def extract_text_from_docx(file_path):
    """Extract text from DOCX with docx2txt fallback."""
    text = ""
    try:
        # Strategy 1: python-docx
        try:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
        except Exception as e:
            logger.debug(f"python-docx failed on {file_path}, trying docx2txt: {e}")
            # Strategy 2: docx2txt (Handles some complex XML better)
            text = docx2txt.process(file_path)
            
    except Exception as e:
        logger.error(f"Error extracting text from DOCX {file_path}: {e}")
        raise ValueError(f"Could not read Word content: {str(e)}")
        
    return text.strip()

