import fitz  # PyMuPDF
import docx
import logging
import io

logger = logging.getLogger(__name__)


def extract_text_from_pdf(file_path):
    """Extract text from PDF with error handling for corrupted files."""
    text = ""
    try:
        with fitz.open(file_path) as pdf:
            for page in pdf:
                page_text = page.get_text()
                if page_text:
                    text += page_text + "\n"
    except fitz.FileDataError as e:
        logger.error(f"Corrupted PDF file {file_path}: {e}")
        raise ValueError("Cannot parse PDF file: corrupted or invalid format")
    except Exception as e:
        logger.error(f"Error extracting text from PDF {file_path}: {e}")
        raise ValueError(f"Error extracting text from PDF: {str(e)}")
    return text.strip()


def extract_text_from_docx(file_path):
    """Extract text from DOCX with error handling."""
    text = ""
    try:
        with open(file_path, 'rb') as doc_file:
            doc = docx.Document(io.BytesIO(doc_file.read()))
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"
    except Exception as e:
        logger.error(f"Error extracting text from DOCX {file_path}: {e}")
        raise ValueError(f"Error extracting text from DOCX: {str(e)}")
    return text.strip()

