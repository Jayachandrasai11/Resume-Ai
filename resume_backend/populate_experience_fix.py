"""
Script to populate missing experience, education, and projects from resume text.
Run from Project1/resume_backend directory:
python manage.py shell < ../populate_experience_fix.py
"""
import os
import sys
import django
import re

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'resume_backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from apps.candidates.models import Candidate

def extract_experience(text):
    """Extract experience from resume text."""
    if not text:
        return []
    
    experiences = []
    
    # Look for work experience patterns
    patterns = [
        r'(?:Work Experience|Professional Experience|Employment|Experience)[:\s]*',
    ]
    
    # Common job titles to look for
    job_patterns = [
        r'(Software Engineer|Developer|Analyst|Manager|Consultant|Designer|Lead|Senior|Junior|Intern)',
    ]
    
    # Look for company patterns
    company_patterns = [
        r'(?:at|@|in)\s+([A-Z][a-zA-Z\s&]+(?:Ltd|Inc|Pvt|Private|Technologies|Software|Services|Consulting)?)',
    ]
    
    # Look for duration patterns
    duration_patterns = [
        r'(\d+\s*(?:-|to)\s*\d+\s*(?:years?|yrs)?)',
        r'(\d+\s*years?\s*(?:-|to)?\s*\d*)',
        r'(\w+\s*\d{4}\s*(?:-|to)?\s*(?:\w+\s*\d{4}|Present|current))',
    ]
    
    # Simple approach: Look for bullet points with job info
    lines = text.split('\n')
    current_role = None
    current_company = None
    current_duration = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for job title
        for pattern in job_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match and len(line) < 100:
                current_role = line[:100]
                break
        
        # Check for company
        for pattern in company_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                current_company = match.group(1).strip()[:100]
                break
        
        # Check for duration
        for pattern in duration_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match:
                current_duration = match.group(1).strip()[:50]
                break
        
        # If we have enough info, add to experiences
        if current_role and (current_company or current_duration):
            exp = {"role": current_role, "company": current_company or "", "duration": current_duration or ""}
            if exp not in experiences:
                experiences.append(exp)
            current_role = None
            current_company = None
            current_duration = None
    
    return experiences[:5]  # Limit to 5 experiences

def extract_education(text):
    """Extract education from resume text."""
    if not text:
        return []
    
    education = []
    
    # Look for education section
    patterns = [
        r'(?:Education|Qualification|Academic)[:\s]*',
    ]
    
    # Degree patterns
    degree_patterns = [
        r'(Bachelor|Master|PhD|B\.Tech|M\.Tech|MBA|B\.E\.|B\.S\.|M\.S\.|Diploma)',
    ]
    
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        
        for pattern in degree_patterns:
            match = re.search(pattern, line, re.IGNORECASE)
            if match and len(line) < 150:
                # Try to extract year
                year_match = re.search(r'(20\d{2}|19\d{2})', line)
                year = year_match.group(1) if year_match else ""
                
                edu = {
                    "degree": line[:100],
                    "institution": "",
                    "year": year
                }
                if edu not in education:
                    education.append(edu)
    
    return education[:5]  # Limit to 5 education entries

def extract_projects(text):
    """Extract projects from resume text."""
    if not text:
        return []
    
    projects = []
    
    lines = text.split('\n')
    for line in lines:
        line = line.strip()
        
        # Look for project keywords
        if re.search(r'(?:Project|Project Name)[:\s]', line, re.IGNORECASE):
            if len(line) < 100:
                proj = {
                    "title": line.replace('Project', '').replace(':', '').strip()[:100],
                    "description": ""
                }
                if proj not in projects:
                    projects.append(proj)
    
    return projects[:5]  # Limit to 5 projects

def populate_missing_data():
    """Populate missing experience, education, and projects from resume text."""
    candidates = Candidate.objects.all()
    updated_count = 0
    
    for candidate in candidates:
        changes = []
        
        # Get resume text
        resume_text = ""
        if hasattr(candidate, 'resumes') and candidate.resumes.exists():
            for resume in candidate.resumes.all():
                if resume.text:
                    resume_text = resume.text
                    break
        
        # If no resume text, try to get from summary or other fields
        if not resume_text:
            resume_text = candidate.summary or ""
        
        # Populate experience if empty
        if not candidate.experience or candidate.experience == [] or candidate.experience == "[]":
            experience = extract_experience(resume_text)
            if experience:
                candidate.experience = experience
                changes.append("experience")
        
        # Populate education if empty
        if not candidate.education or candidate.education == [] or candidate.education == "[]":
            education = extract_education(resume_text)
            if education:
                candidate.education = education
                changes.append("education")
        
        # Populate projects if empty
        if not candidate.projects or candidate.projects == [] or candidate.projects == "[]":
            projects = extract_projects(resume_text)
            if projects:
                candidate.projects = projects
                changes.append("projects")
        
        # Save if there were changes
        if changes:
            candidate.save()
            updated_count += 1
            print(f"Updated {candidate.name}: {', '.join(changes)}")
    
    print(f"\nTotal candidates updated: {updated_count}")

if __name__ == "__main__":
    print("Populating missing data from resume text...")
    populate_missing_data()
