"""
Hybrid Resume Parser Module

A hybrid resume parsing system that combines:
- Rule-based extraction (regex)
- NLP-based entity extraction (spaCy)
- Section detection
- Skill extraction (DB matching)
- Experience extraction heuristics

This module is designed to avoid heavy LLM dependence while providing
structured candidate data extraction with support for future AI matching.
"""

import re
import logging
from typing import Dict, Any, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ============================================================================
# TEXT CLEANING
# ============================================================================

def clean_text(text: str) -> str:
    """
    Clean and normalize resume text.
    
    - Remove extra spaces
    - Remove special characters
    - Convert to lowercase (for matching)
    """
    if not text:
        return ""
    
    # Normalize multiple spaces to single space (but keep newlines)
    text = re.sub(r'[ \t]+', ' ', text)  # Only collapse horizontal whitespace
    # Remove extra blank lines
    text = re.sub(r'\n\n+', '\n', text)
    text = text.strip()
    
    # Remove special characters but keep basic punctuation
    # This helps with better parsing while maintaining readability
    text = re.sub(r'[^\w\s@+.\-#,()]', '', text)
    
    return text


def normalize_text_for_matching(text: str) -> str:
    """Convert text to lowercase for matching purposes."""
    return text.lower() if text else ""


# ============================================================================
# SECTION DETECTION
# ============================================================================

# Section keywords for detection
SECTION_KEYWORDS = {
    'experience': [
        'experience', 'work experience', 'employment', 'professional experience',
        'work history', 'career history', 'employment history', 'job history',
        'professional background', 'work experience:'
    ],
    'education': [
        'education', 'academic background', 'educational background',
        'education:', 'qualification', 'qualifications', 'degree', 'degrees'
    ],
    'skills': [
        'skills', 'technical skills', 'tech skills', 'skills:',
        'technical expertise', 'technologies', 'tech stack', 'competencies',
        'core competencies', 'key skills', 'skill set'
    ],
    'projects': [
        'projects', 'project experience', 'project details', 'projects:',
        'key projects', 'notable projects'
    ],
    'summary': [
        'summary', 'profile', 'objective', 'about me', 'professional summary',
        'career objective', 'summary:'
    ],
    'contact': [
        'contact', 'contact info', 'contact information', 'personal information'
    ]
}


def split_sections(text: str) -> Dict[str, str]:
    """
    Detect and split resume text into sections.
    
    Returns a dictionary mapping section names to their content.
    """
    sections = {
        'general': '',
        'experience': '',
        'education': '',
        'skills': '',
        'projects': '',
        'summary': ''
    }
    
    if not text:
        return sections
    
    lines = text.split('\n')
    current_section = 'general'
    
    for line in lines:
        line_lower = line.lower().strip()
        
        # Check if this line is a section header
        section_found = False
        for section_name, keywords in SECTION_KEYWORDS.items():
            for keyword in keywords:
                # Match exact section headers (often followed by colon or on their own line)
                if line_lower == keyword or line_lower.startswith(keyword + ':'):
                    current_section = section_name
                    section_found = True
                    break
            if section_found:
                break
        
        # Add line to current section
        if line.strip():
            sections[current_section] += line + '\n'
    
    # Clean up each section
    for section in sections:
        sections[section] = sections[section].strip()
    
    return sections


def get_section_content(sections: Dict[str, str], section_name: str) -> str:
    """Get content for a specific section."""
    return sections.get(section_name, '')


# ============================================================================
# BASIC FIELD EXTRACTION (REGEX)
# ============================================================================

def extract_email(text: str) -> Optional[str]:
    """Extract email address using regex."""
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    match = re.search(email_pattern, text)
    return match.group(0) if match else None


def extract_phone(text: str) -> Optional[str]:
    """Extract phone number using regex."""
    # Multiple patterns to catch different formats
    phone_patterns = [
        r'\+?\d{1,3}[-\s.]?\(?\d{1,4}\)?[-\s.]?\d{1,4}[-\s.]?\d{1,9}',
        r'\b\d{10,12}\b',  # Simple 10-12 digit number
        r'\(\d{3}\)\s*\d{3}[-.\s]?\d{4}',  # (123) 456-7890
        r'\d{3}[-.\s]\d{3}[-.\s]\d{4}',  # 123-456-7890
    ]
    
    for pattern in phone_patterns:
        match = re.search(pattern, text)
        if match:
            # Clean up the phone number
            phone = re.sub(r'[^\d+]', '', match.group(0))
            if 10 <= len(phone) <= 15:
                return phone
    return None


# ============================================================================
# NLP ENTITY EXTRACTION (spaCy)
# ============================================================================

# Lazy-load spaCy model to avoid startup overhead
_spacy_model = None


def _get_spacy_model():
    """Lazy-load spaCy model."""
    global _spacy_model
    if _spacy_model is None:
        try:
            import spacy
            _spacy_model = spacy.load("en_core_web_sm")
            logger.info("Loaded spaCy en_core_web_sm model")
        except Exception as e:
            logger.warning(f"Could not load spaCy model: {e}")
            _spacy_model = False  # Mark as failed
    return _spacy_model


def extract_entities_nlp(text: str) -> Dict[str, Any]:
    """
    Extract named entities using spaCy NLP.
    
    Extracts:
    - Name (PERSON)
    - Organizations (ORG)
    - Locations (GPE, LOC)
    - Dates (DATE)
    """
    entities = {
        "name": "",
        "organizations": [],
        "locations": [],
        "dates": []
    }
    
    if not text:
        return entities
    
    nlp = _get_spacy_model()
    if not nlp:
        logger.warning("spaCy model not available, skipping NLP extraction")
        return entities
    
    try:
        # Process in chunks to avoid memory issues with large documents
        max_length = 100000
        if len(text) > max_length:
            text = text[:max_length]
        
        doc = nlp(text)
        
        for ent in doc.ents:
            if ent.label_ == "PERSON":
                # Take the first person entity as the name
                if not entities["name"]:
                    entities["name"] = ent.text
            elif ent.label_ == "ORG":
                if ent.text not in entities["organizations"]:
                    entities["organizations"].append(ent.text)
            elif ent.label_ in ["GPE", "LOC"]:
                if ent.text not in entities["locations"]:
                    entities["locations"].append(ent.text)
            elif ent.label_ == "DATE":
                if ent.text not in entities["dates"]:
                    entities["dates"].append(ent.text)
        
        logger.debug(f"NLP extraction found: name={entities['name']}, orgs={len(entities['organizations'])}, locs={len(entities['locations'])}")
        
    except Exception as e:
        logger.error(f"Error in NLP entity extraction: {e}")
    
    return entities


# ============================================================================
# SKILL EXTRACTION (DB MATCHING)
# ============================================================================

def extract_skills(text: str, skills_db: List[str]) -> List[str]:
    """
    Extract skills from text using DB matching.
    
    Args:
        text: Resume text
        skills_db: List of skills from database
    
    Returns:
        List of matched skills
    """
    if not text or not skills_db:
        return []
    
    text_lower = text.lower()
    found_skills = set()
    
    for skill in skills_db:
        # Use word boundaries to avoid partial matches
        escaped_skill = re.escape(skill.lower())
        pattern = rf'\b{escaped_skill}\b'
        if re.search(pattern, text_lower):
            found_skills.add(skill)
    
    return list(found_skills)


# ============================================================================
# EXPERIENCE EXTRACTION (HEURISTICS)
# ============================================================================

def extract_experience_years(text: str) -> Optional[float]:
    """
    Extract years of experience from resume text.
    
    Uses heuristics:
    - Pattern: "X years", "X+ years"
    - Pattern: date ranges (e.g., "2020 - Present")
    """
    if not text:
        return None
    
    # Pattern 1: "X years" or "X+ years"
    years_pattern = r'(\d+)\+?\s*(?:years?|yrs?)'
    years_matches = re.findall(years_pattern, text.lower())
    
    if years_matches:
        # Return the maximum years found
        return max(int(y) for y in years_matches)
    
    # Pattern 2: Date ranges
    date_pattern = r'(20\d{2}|19\d{2})\s*[-–to]+\s*(20\d{2}|present|current)'
    date_matches = re.findall(date_pattern, text.lower())
    
    if date_matches:
        years = []
        for start, end in date_matches:
            if end in ['present', 'current']:
                end_year = 2025  # Current year
            else:
                end_year = int(end)
            start_year = int(start)
            exp_years = end_year - start_year
            if 0 < exp_years < 50:  # Sanity check
                years.append(exp_years)
        
        if years:
            return max(years)
    
    return None


def parse_experience_section(text: str) -> List[Dict[str, str]]:
    """
    Parse experience section into structured entries.
    
    Returns list of experience entries with:
    - role
    - company
    - duration
    - description
    """
    if not text:
        return []
    
    entries = []
    lines = text.split('\n')
    
    # Common job titles/keywords
    job_keywords = [
        'software engineer', 'developer', 'programmer', 'analyst', 'manager',
        'consultant', 'designer', 'architect', 'engineer', 'administrator',
        'intern', 'associate', 'specialist', 'lead', 'head', 'director'
    ]
    
    for line in lines:
        line = line.strip()
        if not line or len(line) < 10:
            continue
        
        line_lower = line.lower()
        
        # Skip section headers
        if any(kw == line_lower for kw in ['experience', 'employment', 'work experience']):
            continue
        
        # Check if line contains a job keyword
        if any(kw in line_lower for kw in job_keywords):
            entry = {
                "role": "",
                "company": "",
                "duration": "",
                "description": line
            }
            
            # Extract duration
            duration_patterns = [
                r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–to]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[a-z]*\.?\s+\d{4}',
                r'(20\d{2})\s*[-–to]+\s*(20\d{2}|present|current)',
                r'(\d+\s*(?:years?|months?))',
            ]
            for pattern in duration_patterns:
                match = re.search(pattern, line, re.IGNORECASE)
                if match:
                    entry["duration"] = match.group(0)
                    break
            
            # Extract company
            company_pattern = r'(?:at|@|in|with)\s+([A-Z][A-Za-z\s]+(?:Inc|LLC|Ltd|Corp|Company|Technologies|Solutions|Pvt|Private)?)'
            match = re.search(company_pattern, line)
            if match:
                entry["company"] = match.group(1).strip()
            
            # Use line as role if no company found
            entry["role"] = line[:150]
            
            entries.append(entry)
    
    return entries[:10]  # Limit to 10 entries


# ============================================================================
# MAIN HYBRID PARSER
# ============================================================================

def parse_resume_hybrid(resume_text: str, skills_db: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Main hybrid parser that combines multiple extraction methods.
    
    Flow:
    1. Clean text
    2. Split into sections
    3. Extract basic fields (regex)
    4. Extract entities (spaCy NLP)
    5. Extract skills (DB matching)
    6. Extract experience (heuristics)
    7. Combine and return structured data
    """
    # Default skills DB if not provided
    if skills_db is None:
        from .skills import COMMON_SKILLS
        skills_db = COMMON_SKILLS
    
    # Step 1: Clean text
    cleaned_text = clean_text(resume_text)
    if not cleaned_text:
        logger.warning("Empty resume text provided")
        return _empty_parsed_data()
    
    # Step 2: Split into sections
    sections = split_sections(cleaned_text)
    
    # Step 3: Extract basic fields using regex
    data = {
        "Name": "",
        "Email": "",
        "Phone": "",
        "Location": "",
        "Skills": [],
        "Education": [],
        "Experience": [],
        "Projects": [],
        "Summary": ""
    }
    
    # Extract email and phone from full text
    data["Email"] = extract_email(cleaned_text)
    data["Phone"] = extract_phone(cleaned_text)
    
    # Step 4: Extract entities using spaCy NLP
    nlp_entities = extract_entities_nlp(cleaned_text)
    
    # Use NLP name if available, otherwise try heuristic
    if nlp_entities.get("name"):
        data["Name"] = nlp_entities["name"]
    else:
        # Fallback to heuristic name extraction
        data["Name"] = extract_name_from_text(cleaned_text)
    
    # Use NLP location if available
    if nlp_entities.get("locations"):
        data["Location"] = nlp_entities["locations"][0]
    
    # Step 5: Extract skills from skills section
    skills_section = get_section_content(sections, 'skills')
    if skills_section:
        data["Skills"] = extract_skills(skills_section, skills_db)
    
    # Also check general text for skills if none found in skills section
    if not data["Skills"]:
        data["Skills"] = extract_skills(cleaned_text, skills_db)
    
    # Step 6: Extract experience
    experience_section = get_section_content(sections, 'experience')
    if experience_section:
        data["Experience"] = parse_experience_section(experience_section)
    
    # Extract years of experience
    experience_years = extract_experience_years(cleaned_text)
    
    # Step 7: Extract education
    education_section = get_section_content(sections, 'education')
    if education_section:
        from .parser import parse_resume_regex
        edu_data = parse_resume_regex(education_section)
        data["Education"] = edu_data.get("Education", [])
    
    # Step 8: Extract projects
    projects_section = get_section_content(sections, 'projects')
    if projects_section:
        from .parser import parse_resume_regex
        proj_data = parse_resume_regex(projects_section)
        data["Projects"] = proj_data.get("Projects", [])
    
    # Step 9: Extract summary
    summary_section = get_section_content(sections, 'summary')
    if summary_section:
        data["Summary"] = summary_section[:300]
    
    # Fallback: If no summary, create from skills and experience
    if not data["Summary"]:
        if data["Skills"] or data["Experience"]:
            parts = []
            if experience_years:
                parts.append(f"{experience_years} years of experience")
            if data["Skills"]:
                skills_str = ", ".join(data["Skills"][:5])
                parts.append(f"Skills: {skills_str}")
            data["Summary"] = ". ".join(parts)
    
    # Add experience years to data
    data["ExperienceYears"] = experience_years
    
    # Apply schema enforcement from existing parser
    from .parser import enforce_schema
    data = enforce_schema(data)
    
    logger.info(f"Hybrid parse complete: Name={data.get('Name')}, Skills={len(data.get('Skills', []))}, Experience={experience_years} years")
    
    return data


def _empty_parsed_data() -> Dict[str, Any]:
    """Return empty parsed data structure."""
    from .parser import enforce_schema
    return enforce_schema({})


# ============================================================================
# CONVENIENCE FUNCTIONS
# ============================================================================

def extract_name_from_text(text: str) -> str:
    """
    Extract candidate name using heuristic approach.
    
    Returns the first line that looks like a name (2-4 capitalized words,
    no special characters, no email or numbers).
    """
    if not text:
        return ""
    
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    # Skip the first 5 lines max to find name
    for line in lines[:5]:
        # Skip lines containing email or many numbers
        if '@' in line or re.search(r'\d{5,}', line):
            continue
        
        # Skip common non-name lines
        skip_words = ['resume', 'cv', 'curriculum', 'vitae', 'summary', 'profile', 
                     'objective', 'experience', 'education', 'skills', 'contact',
                     'address', 'phone', 'mobile', 'linkedin', 'github']
        if any(word in line.lower() for word in skip_words):
            continue
        
        words = line.split()
        # Name is typically 1-4 words, all starting with capital
        if 1 <= len(words) <= 4:
            if all(word[0].isupper() for word in words if word):
                # Check no special characters (except basic punctuation)
                if not re.search(r'[@#$%^&*!]', line):
                    return line.title()
    
    return ""


def get_resume_sections(text: str) -> Dict[str, str]:
    """Get all sections from resume text."""
    cleaned = clean_text(text)
    return split_sections(cleaned)
