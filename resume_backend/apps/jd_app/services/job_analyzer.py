"""
AI Job Description Analyzer Service
Uses Gemini LLM to extract structured data from job descriptions.
"""

import logging
import json
from typing import Dict, List, Optional, Any
from django.conf import settings
import google.generativeai as genai

logger = logging.getLogger(__name__)


class JobDescriptionAnalyzer:
    """Service for analyzing job descriptions using AI."""
    
    def __init__(self):
        """Initialize the analyzer with Gemini API."""
        self.api_key = settings.GEMINI_API_KEY
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found in settings")
        
        try:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-pro')
            logger.info("Job Description Analyzer initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Job Description Analyzer: {e}")
            self.model = None
    
    def analyze_job_description(self, job_description: str, job_title: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze a job description and extract structured data.
        
        Args:
            job_description: The full job description text
            job_title: Optional job title for context
            
        Returns:
            Dictionary containing extracted structured data
        """
        if not self.model:
            logger.error("Gemini model not initialized")
            return self._get_default_response()
        
        if not job_description:
            logger.warning("Empty job description provided")
            return self._get_default_response()
        
        try:
            # Prepare the prompt
            prompt = self._build_analysis_prompt(job_description, job_title)
            
            # Generate response
            logger.info(f"Analyzing job description: {job_title or 'Untitled'}")
            response = self.model.generate_content(prompt)
            
            # Parse the response
            extracted_data = self._parse_analysis_response(response.text)
            
            logger.info(f"Successfully analyzed job description: {job_title or 'Untitled'}")
            return extracted_data
            
        except Exception as e:
            logger.error(f"Error analyzing job description: {e}")
            return self._get_default_response()
    
    def _build_analysis_prompt(self, job_description: str, job_title: Optional[str] = None) -> str:
        """
        Build the analysis prompt for the LLM.
        
        Args:
            job_description: The job description text
            job_title: Optional job title
            
        Returns:
            Formatted prompt string
        """
        title_context = f"Job Title: {job_title}\n\n" if job_title else ""
        
        prompt = f"""You are an expert HR analyst and job description specialist. Analyze the following job description and extract structured information.

{title_context}Job Description:
{job_description}

Please extract the following information and return it as a valid JSON object:

{{
    "extracted_role": "The main job role or position title",
    "required_skills": ["List of must-have technical and soft skills"],
    "preferred_skills": ["List of nice-to-have skills"],
    "min_experience": "Minimum experience required (e.g., '3-5 years', '5+ years')",
    "experience_years": "Minimum experience as a number (e.g., 3, 5, 10)",
    "salary_range": "Salary range if mentioned (e.g., '$80,000 - $120,000')",
    "location": "Job location if mentioned",
    "employment_type": "Employment type (Full-time, Part-time, Contract, Remote, etc.)",
    "responsibilities": ["List of main responsibilities"],
    "qualifications": ["List of required qualifications and certifications"]
}}

Important guidelines:
1. Only extract information that is explicitly mentioned in the job description
2. If information is not available, use empty string "" or empty list []
3. For experience_years, extract only the numeric value (e.g., if "3-5 years", use 3)
4. Return ONLY the JSON object, no additional text
5. Ensure the JSON is valid and properly formatted
6. Skills should be specific and relevant to the job
7. Responsibilities should be concise bullet points
8. Qualifications should include degrees, certifications, or specific requirements

Return the JSON object:"""

        return prompt
    
    def _parse_analysis_response(self, response_text: str) -> Dict[str, Any]:
        """
        Parse the LLM response into structured data.
        
        Args:
            response_text: Raw response text from LLM
            
        Returns:
            Parsed dictionary with extracted data
        """
        try:
            # Remove markdown code blocks if present
            response_text = response_text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
            
            response_text = response_text.strip()
            
            # Parse JSON
            extracted_data = json.loads(response_text)
            
            # Validate and clean the data
            cleaned_data = self._clean_extracted_data(extracted_data)
            
            return cleaned_data
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            logger.debug(f"Response text: {response_text}")
            return self._get_default_response()
        except Exception as e:
            logger.error(f"Error parsing analysis response: {e}")
            return self._get_default_response()
    
    def _clean_extracted_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Clean and validate the extracted data.
        
        Args:
            data: Raw extracted data
            
        Returns:
            Cleaned data dictionary
        """
        cleaned = {}
        
        # String fields
        string_fields = ['extracted_role', 'min_experience', 'salary_range', 'location', 'employment_type']
        for field in string_fields:
            cleaned[field] = data.get(field, '') if isinstance(data.get(field), str) else ''
        
        # List fields
        list_fields = ['required_skills', 'preferred_skills', 'responsibilities', 'qualifications']
        for field in list_fields:
            value = data.get(field, [])
            if isinstance(value, list):
                cleaned[field] = [str(item).strip() for item in value if item]
            else:
                cleaned[field] = []
        
        # Numeric field
        experience_years = data.get('experience_years')
        try:
            if isinstance(experience_years, (int, float)):
                cleaned['experience_years'] = float(experience_years)
            elif isinstance(experience_years, str):
                # Try to extract number from string
                import re
                numbers = re.findall(r'\d+\.?\d*', experience_years)
                if numbers:
                    cleaned['experience_years'] = float(numbers[0])
                else:
                    cleaned['experience_years'] = None
            else:
                cleaned['experience_years'] = None
        except Exception:
            cleaned['experience_years'] = None
        
        return cleaned
    
    def _get_default_response(self) -> Dict[str, Any]:
        """
        Get default response when analysis fails.
        
        Returns:
            Default empty response
        """
        return {
            'extracted_role': '',
            'required_skills': [],
            'preferred_skills': [],
            'min_experience': '',
            'experience_years': None,
            'salary_range': '',
            'location': '',
            'employment_type': '',
            'responsibilities': [],
            'qualifications': []
        }
    
    def analyze_and_update_job(self, job_instance) -> bool:
        """
        Analyze a job description and update the job instance with extracted data.
        
        Args:
            job_instance: JobDescription model instance
            
        Returns:
            bool: True if analysis was successful, False otherwise
        """
        try:
            # Update status to analyzing
            job_instance.analysis_status = 'analyzing'
            job_instance.save(update_fields=['analysis_status'])
            
            # Perform analysis
            extracted_data = self.analyze_job_description(
                job_description=job_instance.description,
                job_title=job_instance.title
            )
            
            # Update job instance with extracted data
            job_instance.extracted_role = extracted_data.get('extracted_role', '')
            job_instance.required_skills = extracted_data.get('required_skills', [])
            job_instance.preferred_skills = extracted_data.get('preferred_skills', [])
            job_instance.min_experience = extracted_data.get('min_experience', '')
            job_instance.experience_years = extracted_data.get('experience_years')
            job_instance.salary_range = extracted_data.get('salary_range', '')
            job_instance.location = extracted_data.get('location', '')
            job_instance.employment_type = extracted_data.get('employment_type', '')
            job_instance.responsibilities = extracted_data.get('responsibilities', [])
            job_instance.qualifications = extracted_data.get('qualifications', [])
            
            # Update status and timestamp
            from django.utils import timezone
            job_instance.analyzed_at = timezone.now()
            job_instance.analysis_status = 'completed'
            job_instance.analysis_error = None
            
            job_instance.save()
            
            logger.info(f"Successfully analyzed and updated job: {job_instance.title}")
            return True
            
        except Exception as e:
            logger.error(f"Error analyzing and updating job {job_instance.id}: {e}")
            
            # Update status to failed
            job_instance.analysis_status = 'failed'
            job_instance.analysis_error = str(e)
            job_instance.save(update_fields=['analysis_status', 'analysis_error'])
            
            return False


# Singleton instance
job_analyzer = JobDescriptionAnalyzer()