import re
import json
import logging
from django.conf import settings
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

REQUIRED_FIELDS = ["Name", "Email", "Phone", "Skills", "Education", "Experience", "Projects", "Summary"]

# Pre-compiled regex patterns for performance
_EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")
_PHONE_PATTERN = re.compile(r"\+?\d[\d\s\-]{7,15}")


def clean_string(value: Any) -> str:
    """Clean a string value, removing null/empty values."""
    if value is None:
        return ""
    if isinstance(value, str):
        value = value.strip()
        # Remove null patterns
        null_patterns = ["null", "None", "NULL", "undefined", "N.A", "N/A", "n.a", "n/A", "NA", "na"]
        if value.lower() in null_patterns:
            return ""
        if any(na.lower() in value.lower() for na in null_patterns):
            for na in null_patterns:
                value = value.replace(na, "").strip()
            return value.strip(", ")
        return value
    return str(value)


def clean_list(value: Any) -> List:
    """Clean a list value, removing null/empty items."""
    if value is None:
        return []
    if not isinstance(value, list):
        return []
    cleaned = []
    for item in value:
        if item is None:
            continue
        if isinstance(item, str):
            item = clean_string(item)
            if item:
                cleaned.append(item)
        elif isinstance(item, dict):
            cleaned_dict = {}
            for k, v in item.items():
                cleaned_v = clean_string(v)
                if cleaned_v:
                    cleaned_dict[k] = cleaned_v
            if cleaned_dict:
                cleaned.append(cleaned_dict)
        elif item:
            cleaned.append(item)
    return cleaned


def enforce_schema(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensure all required fields are present with no null values."""
    if not isinstance(data, dict):
        data = {}
    
    # Clean all values recursively
    data = _clean_recursive(data)
    
    # Ensure all required fields exist
    for field in REQUIRED_FIELDS:
        if field not in data or data[field] is None:
            data[field] = "" if field not in ["Skills", "Education", "Experience", "Projects"] else []
    
    return data


def _clean_recursive(data: Any) -> Any:
    """Recursively clean all values in data structure."""
    if data is None:
        return None
        
    if isinstance(data, dict):
        cleaned = {}
        for key, value in data.items():
            if value is None:
                continue  # Skip None values
            cleaned[key] = _clean_recursive(value)
        return cleaned
        
    elif isinstance(data, list):
        cleaned = []
        for item in data:
            if item is None:
                continue
            cleaned.append(_clean_recursive(item))
        return cleaned
        
    elif isinstance(data, str):
        return clean_string(data)
        
    return data


def parse_resume(resume_text: str) -> Dict[str, Any]:
    """
    Main function to parse resume text into structured data using regex.
    Uses only regex-based extraction (no LLM/API calls).
    """
    if not resume_text or not resume_text.strip():
        logger.warning("Empty resume text provided to parse_resume")
        return enforce_schema({})
    
    # Use regex-based extraction (primary method)
    parsed = parse_resume_regex(resume_text)
    parsed = enforce_schema(parsed)
    
    # Final cleanup with regex fallback for missing fields
    parsed = regex_fallback(resume_text, parsed)
    
    logger.info(f"[DEBUG] Final parsed: Name={parsed.get('Name')}, Skills={len(parsed.get('Skills', []))}, Experience={len(parsed.get('Experience', []))}, Summary={parsed.get('Summary', '')[:50]}...")
    return parsed


def parse_resume_regex(resume_text: str) -> Dict[str, Any]:
    """
    Comprehensive regex-based parser for resume text.
    Extracts Name, Email, Phone, Location, Skills, Education, Experience, Projects.
    """
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
    
    lines = [line.strip() for line in resume_text.split('\n') if line.strip()]
    text_lower = resume_text.lower()
    
    # ============================================
    # 1. Extract Email
    # ============================================
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_matches = re.findall(email_pattern, resume_text)
    if email_matches:
        data["Email"] = email_matches[0]
    
    # ============================================
    # 2. Extract Phone
    # ============================================
    phone_patterns = [
        r'\+?\d{1,3}[-\s.]?\(?\d{1,4}\)?[-\s.]?\d{1,4}[-\s.]?\d{1,9}',
        r'\b\d{10,12}\b',
    ]
    for pattern in phone_patterns:
        phone_matches = re.findall(pattern, resume_text)
        if phone_matches:
            phone = re.sub(r'[^\d+]', '', phone_matches[0])
            if 10 <= len(phone) <= 15:
                data["Phone"] = phone
                break
    
    # ============================================
    # 3. Extract Name
    # ============================================
    for i, line in enumerate(lines[:8]):
        if '@' in line or re.search(r'\d{5,}', line):
            continue
        skip_words = ['resume', 'cv', 'curriculum', 'vitae', 'summary', 'profile', 
                     'objective', 'experience', 'education', 'skills', 'contact',
                     'address', 'phone', 'mobile', 'email', 'linkedin', 'github']
        if any(word in line.lower() for word in skip_words):
            continue
        words = line.split()
        if 1 <= len(words) <= 5:
            if all(word[0].isupper() for word in words if word):
                if not re.search(r'\d|[@#$%^&*!]', line):
                    data["Name"] = line.title()
                    break
    
    # ============================================
    # 4. Extract Location
    # ============================================
    locations = [
        'new york', 'san francisco', 'los angeles', 'chicago', 'boston', 'seattle', 
        'austin', 'denver', 'atlanta', 'miami', 'portland', 'phoenix', 'dallas', 
        'houston', 'philadelphia', 'washington', 'san diego',
        'bangalore', 'hyderabad', 'chennai', 'mumbai', 'delhi', 'pune', 'kolkata',
        'london', 'paris', 'berlin', 'amsterdam', 'dublin', 'singapore', 
        'sydney', 'melbourne', 'toronto', 'vancouver', 'montreal',
    ]
    for loc in locations:
        pattern = r'\b' + re.escape(loc) + r'\b'
        if re.search(pattern, text_lower):
            data["Location"] = loc.title()
            break
    
    # ============================================
    # 5. Extract Skills
    # ============================================
    technical_skills = [
        'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'c programming',
        'ruby', 'go', 'rust', 'php', 'perl', 'scala', 'kotlin', 'swift', 'r', 'matlab',
        'react', 'reactjs', 'angular', 'angularjs', 'vue', 'vuejs', 'nextjs', 'nuxtjs',
        'node', 'nodejs', 'express', 'django', 'flask', 'fastapi', 'spring', 'rails',
        'laravel', 'asp.net', '.net',
        'html', 'html5', 'css', 'css3', 'sass', 'less', 'bootstrap', 'tailwind', 
        'material ui', 'mui',
        'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 
        'oracle', 'sqlite', 'dynamodb', 'cassandra', 'firebase',
        'aws', 'azure', 'gcp', 'google cloud', 'heroku', 'docker', 'kubernetes', 
        'k8s', 'terraform', 'ansible', 'jenkins', 'circleci', 'github actions',
        'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence',
        'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras',
        'scikit-learn', 'nlp', 'computer vision', 'opencv', 'pandas', 'numpy',
        'data science', 'data analysis', 'data engineering', 'etl', 'tableau',
        'power bi', 'bigquery', 'snowflake',
        'rest api', 'restful api', 'graphql', 'grpc', 'websocket',
        'microservices', 'architecture', 'design patterns',
        'agile', 'scrum', 'kanban', 'devops', 'sre',
        'linux', 'unix', 'bash', 'shell', 'powershell', 'windows',
        'testing', 'unit testing', 'integration testing', 'e2e testing',
        'selenium', 'pytest', 'jest', 'cypress', 'junit',
        'ci/cd', 'cicd', 'cloud computing', 'security', 'oauth', 'jwt',
        'sap', 'excel', 'word', 'powerpoint', 'outlook',
    ]
    
    found_skills = set()
    for skill in technical_skills:
        pattern = r'\b' + re.escape(skill) + r'\b'
        if re.search(pattern, text_lower):
            found_skills.add(skill.title())
    
    if found_skills:
        data["Skills"] = list(found_skills)
    
    # ============================================
    # 6. Extract Education
    # ============================================
    education_entries = []
    edu_keywords = ['university', 'college', 'institute', 'school', 'academy',
                   'b.tech', 'b.e', 'm.tech', 'm.e', 'b.sc', 'm.sc', 'bca', 'mca',
                   'phd', 'doctorate', 'diploma', 'degree']
    
    # Find education lines
    for line in lines:
        line_lower = line.lower()
        if any(keyword in line_lower for keyword in edu_keywords):
            year_match = re.search(r'(20\d{2}|19\d{2})', line)
            year = year_match.group(1) if year_match else ""
            
            # Extract degree
            degree = ""
            degree_patterns = [
                r'(B\.?T\.?E\.?C\.?|B\.?E\.?|B\.?S\.?C\.?|M\.?T\.?E\.?C\.?|M\.?E\.?|M\.?S\.?C\.?|Phd|Diploma)',
            ]
            for dp in degree_patterns:
                dm = re.search(dp, line, re.IGNORECASE)
                if dm:
                    degree = dm.group(1)
                    break
            
            if not degree:
                degree = line[:80]
            
            education_entries.append({
                "degree": clean_string(degree),
                "institution": "",
                "year": clean_string(year)
            })
    
    if education_entries:
        data["Education"] = education_entries[:5]
    
    # ============================================
    # 7. Extract Experience
    # ============================================
    experience_entries = []
    job_keywords = [
        'software engineer', 'software developer', 'developer', 'programmer',
        'senior developer', 'junior developer', 'lead developer', 'staff developer',
        'manager', 'senior manager', 'assistant manager', 'project manager',
        'analyst', 'business analyst', 'data analyst',
        'consultant', 'technical consultant',
        'designer', 'ux designer', 'ui designer',
        'architect', 'solution architect',
        'engineer', 'test engineer', 'qa engineer', 'devops engineer',
        'administrator', 'dba',
        'intern', 'trainee', 'associate', 'specialist', 'coordinator',
        'director', 'vp', 'head', 'lead'
    ]
    
    # Process each line for experience
    for line in lines:
        line_lower = line.lower()
        if any(kw in line_lower for kw in job_keywords):
            # Skip if it looks like a section header
            if line_lower.strip() in ['experience', 'work experience', 'employment', 'professional experience']:
                continue
            
            # Extract duration
            duration = ""
            duration_patterns = [
                r'(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}\s*[-–to]+\s*(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[a-z]*\.?\s+\d{4}',
                r'(20\d{2})\s*[-–to]+\s*(20\d{2}|present|current)',
                r'(\d+\s*(?:years?|months?))\s*[-–to]+\s*(\d+\s*(?:years?|months?)|present|current)',
            ]
            for dp in duration_patterns:
                dm = re.search(dp, line, re.IGNORECASE)
                if dm:
                    duration = dm.group(0)
                    break
            
            # Extract company
            company = ""
            company_pattern = r'(?:at|@|in|with)\s+([A-Z][A-Za-z\s]+(?:Inc|LLC|Ltd|Corp|Company|Technologies|Solutions|Pvt|Private)?)'
            cm = re.search(company_pattern, line)
            if cm:
                company = cm.group(1).strip()
            
            # Only add if line has substantial content
            if len(line) > 15:
                experience_entries.append({
                    "role": clean_string(line[:150]),
                    "company": clean_string(company),
                    "duration": clean_string(duration),
                    "description": clean_string(line)
                })
    
    if experience_entries:
        data["Experience"] = experience_entries[:10]
    
    # ============================================
    # 8. Extract Projects
    # ============================================
    project_entries = []
    project_keywords = ['project']
    
    for line in lines:
        line_lower = line.lower()
        if any(kw in line_lower for kw in project_keywords):
            if line_lower.strip() in ['projects', 'project experience', 'project details', 'projects:']:
                continue
            if any(kw in line_lower for kw in job_keywords):
                continue  # Skip if it's a job
            if len(line) > 15:
                project_entries.append({
                    "title": clean_string(line[:150]),
                    "description": clean_string(line)
                })
    
    if project_entries:
        data["Projects"] = project_entries[:5]
    
    # ============================================
    # 9. Extract Summary/Profile
    # ============================================
    summary_patterns = [
        r'(?:summary|profile|objective|about me)[:\s]*([\s\S]{50,300}?)(?=(?:experience|education|skills|projects|$))',
        r'(?:summary|profile)[:\s]*([\s\S]{20,200})',
    ]
    
    for pattern in summary_patterns:
        match = re.search(pattern, text_lower)
        if match:
            summary_text = match.group(1).strip()
            # Clean up the summary
            summary_text = re.sub(r'\s+', ' ', summary_text).strip()
            if len(summary_text) > 10:
                data["Summary"] = summary_text
                break
    
    # If no formal summary found, create one from Skills and Experience
    if not data.get("Summary"):
        skills_str = ", ".join(data.get("Skills", [])) if data.get("Skills") else ""
        exp_count = len(data.get("Experience", []))
        if skills_str or exp_count:
            summary_parts = []
            if exp_count:
                summary_parts.append(f"{exp_count} year(s) of professional experience")
            if skills_str:
                summary_parts.append(f"Skills: {skills_str}")
            data["Summary"] = ". ".join(summary_parts)
    
    return data


def regex_fallback(resume_text: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Fallback regex extraction for missing fields."""
    # Email
    if not data.get("Email"):
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        match = re.search(email_pattern, resume_text)
        if match:
            data["Email"] = match.group(0)
    
    # Phone
    if not data.get("Phone"):
        phone_pattern = r'\b\d{10,12}\b'
        match = re.search(phone_pattern, resume_text)
        if match:
            data["Phone"] = match.group(0)
    
    # Name (first non-empty line)
    if not data.get("Name"):
        lines = [l.strip() for l in resume_text.split('\n') if l.strip()]
        for line in lines[:5]:
            if '@' not in line and not re.search(r'\d{5,}', line):
                if len(line.split()) <= 4:
                    data["Name"] = line.title()
                    break
    
    return data


def safe_json_parse(raw_output: Optional[str]) -> Optional[Dict[str, Any]]:
    """Safely parse JSON from API response."""
    if not raw_output:
        return None
    
    cleaned = raw_output.strip().replace("```json", "").replace("```", "")
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start, end = cleaned.find("{"), cleaned.rfind("}") + 1
        if start != -1 and end != -1:
            try:
                return json.loads(cleaned[start:end])
            except json.JSONDecodeError:
                return None
    return None
