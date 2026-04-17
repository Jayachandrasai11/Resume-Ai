from .parser import parse_resume, regex_fallback
from .hybrid_parser import parse_resume_hybrid, split_sections, extract_entities_nlp, extract_skills, extract_experience_years
from .duplicate_checker import find_existing_candidate
from .chunking import chunk_and_store_resume, chunk_resumes_batch, get_chunk_text_for_embedding
from .embeddings import service as embedding_service
from .email_ingestion import process_email_resume

# Re-export parse_resume with experience_years extraction integrated
# This wraps the original parser to also extract experience_years
def parse_resume_with_experience(resume_text: str):
    """Wrapper around parse_resume that adds experience_years extraction."""
    from .parser import parse_resume as original_parse_resume
    from .hybrid_parser import extract_experience_years
    
    # Get base parsed data
    result = original_parse_resume(resume_text)
    
    # Extract experience years
    exp_years = extract_experience_years(resume_text)
    if exp_years:
        result["ExperienceYears"] = exp_years
    
    return result
