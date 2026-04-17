import logging
import os
import json
from typing import Any, Optional, List, Dict

import google.generativeai as genai
from django.conf import settings

from ..models import Candidate

logger = logging.getLogger(__name__)


class InterviewQuestionGeneratorService:
    """
    Service to generate interview questions based on candidate's skills and job role.
    Uses Gemini LLM to create relevant, role-specific interview questions.
    """

    def __init__(self) -> None:
        self.api_key: Optional[str] = getattr(settings, 'GEMINI_API_KEY', None)
        if not self.api_key:
            # Try to get from os.environ as fallback
            self.api_key = os.environ.get('GEMINI_API_KEY')
        
        self.model: Optional[Any] = None

        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')

    def _get_candidate_skills(self, candidate: Candidate) -> List[str]:
        """
        Extract candidate skills from both M2M relationship and JSON field.
        Returns a list of skill names.
        """
        skills = set()
        
        # Get skills from M2M relationship (preferred)
        if candidate.skills_m2m.exists():
            skills.update(candidate.skills_m2m.values_list('name', flat=True))
        
        # Get skills from JSON field (fallback)
        if candidate.skills:
            if isinstance(candidate.skills, list):
                skills.update(candidate.skills)
            elif isinstance(candidate.skills, str):
                # Handle case where skills might be stored as comma-separated string
                skills.update([s.strip() for s in candidate.skills.split(',')])
        
        return sorted(list(skills))

    def _build_candidate_profile(self, candidate: Candidate) -> str:
        """
        Build a comprehensive candidate profile string for the LLM.
        Includes skills, experience, education, and summary.
        """
        skills = self._get_candidate_skills(candidate)
        skills_str = ", ".join(skills) if skills else "Not specified"
        
        experience_str = "Not specified"
        if candidate.experience and (isinstance(candidate.experience, list) and len(candidate.experience) > 0):
            exp = candidate.experience[0]
            if isinstance(exp, dict):
                experience_str = exp.get('title', 'Not specified')
        
        education_str = "Not specified"
        if candidate.education and (isinstance(candidate.education, list) and len(candidate.education) > 0):
            edu = candidate.education[0]
            if isinstance(edu, dict):
                education_str = edu.get('degree', 'Not specified')
        
        summary_str = candidate.summary or "No summary available"
        
        profile = f"""
Candidate Profile:
- Name: {candidate.name or 'Not specified'}
- Skills: {skills_str}
- Experience: {experience_str}
- Education: {education_str}
- Summary: {summary_str}
        """
        return profile.strip()

    def generate_interview_questions(
        self,
        candidate_id: int,
        job_role: str,
        question_count: int = 8
    ) -> Dict[str, Any]:
        """
        Generate interview questions for a candidate based on their skills and the job role.
        """
        # Validate question count
        if not 5 <= question_count <= 10:
            question_count = 8
        
        # Retrieve candidate
        try:
            candidate = Candidate.objects.get(id=candidate_id)
        except Candidate.DoesNotExist:
            return {
                'status': 'error',
                'error': f'Candidate with ID {candidate_id} not found'
            }
        
        # Get candidate skills
        skills = self._get_candidate_skills(candidate)
        
        if not skills:
            return {
                'status': 'error',
                'error': 'No skills found for this candidate. Please ensure skills are extracted.'
            }
        
        # Build candidate profile
        candidate_profile = self._build_candidate_profile(candidate)
        
        # Construct the prompt
        skills_str = ", ".join(skills)
        prompt = f"""
You are an expert technical interviewer. Generate {question_count} interview questions for a candidate applying for the {job_role} role.

Candidate Profile:
{candidate_profile}

Key Skills: {skills_str}

Requirements:
1. Generate exactly {question_count} interview questions
2. Questions should be a mix of:
   - Technical questions related to their skills
   - Behavioral questions
   - Role-specific scenarios
   - Problem-solving questions
3. Each question should be clear, specific, and relevant to the {job_role} role
4. Questions should test the candidate's expertise in their listed skills
5. Include at least 2 questions that specifically test their experience with: {skills_str[:200]}

Return ONLY a valid JSON array of question objects. Each object should have:
- "question": The interview question text
- "category": One of ["Technical", "Behavioral", "Scenario-based", "Problem-solving"]
- "skill_related": The primary skill this question tests (or "General" if not skill-specific)

Example format:
[
    {{
        "question": "Explain how you would optimize a Django REST API for high traffic?",
        "category": "Technical",
        "skill_related": "Django"
    }},
    {{
        "question": "Describe a challenging technical problem you solved and your approach.",
        "category": "Behavioral",
        "skill_related": "General"
    }}
]

Generate {question_count} questions now:
"""
        return self._generate_from_prompt(prompt, question_count, candidate_id=candidate_id, candidate_name=candidate.name, job_role=job_role, skills=skills)

    def generate_generic_questions(
        self,
        role_or_skill: str,
        question_count: int = 8
    ) -> Dict[str, Any]:
        """
        Generate generic interview questions for a job role or specific skill.
        
        Args:
            role_or_skill: The job role or skill for which interview questions are needed
            question_count: Number of questions to generate (default: 8, range: 5-10)
        """
        # Validate question count
        if not 5 <= question_count <= 10:
            question_count = 8
            
        # Check if LLM is available
        if not self.model:
            return {
                'status': 'error',
                'error': 'Gemini API key not configured. Please set GEMINI_API_KEY in settings.'
            }
            
        # Construct the prompt
        prompt = f"""
You are an expert technical interviewer. Generate {question_count} interview questions for a candidate applying for the {role_or_skill} role or needing to demonstrate expertise in {role_or_skill}.

Requirements:
1. Generate exactly {question_count} interview questions
2. Questions should be a mix of:
   - Technical questions related to {role_or_skill}
   - Behavioral questions relevant to the field
   - Scenario-based questions for this type of role
   - Problem-solving questions
3. Each question should be clear, specific, and relevant to {role_or_skill}
4. Provide a balanced mix of different difficulty levels

Return ONLY a valid JSON array of question objects. Each object should have:
- "question": The interview question text
- "category": One of ["Technical", "Behavioral", "Scenario-based", "Problem-solving"]
- "skill_related": The primary skill this question tests (or "{role_or_skill}" if it's the main topic)

Example format:
[
    {{
        "question": "Explain how you would optimize a Django REST API for high traffic?",
        "category": "Technical",
        "skill_related": "Django"
    }},
    {{
        "question": "Describe a challenging technical problem you solved and your approach.",
        "category": "Behavioral",
        "skill_related": "General"
    }}
]

Generate {question_count} questions now:
"""
        return self._generate_from_prompt(prompt, question_count, role_or_skill=role_or_skill)

    def _generate_from_prompt(
        self,
        prompt: str,
        question_count: int,
        **extra_data
    ) -> Dict[str, Any]:
        """
        Shared logic for generating questions from a prompt.
        """
        if not self.model:
            return {
                'status': 'error',
                'error': 'Gemini API key not configured. Please set GEMINI_API_KEY in settings.'
            }

        try:
            # Generate questions using LLM
            response = self.model.generate_content(prompt)
            response_text = (getattr(response, 'text', '') or '').strip()

            if not response_text:
                return {
                    'status': 'error',
                    'error': 'LLM returned no response'
                }

            # Clean the response - remove markdown code blocks
            cleaned_text = response_text.strip()
            if cleaned_text.startswith('```'):
                # Extract JSON from markdown
                start = cleaned_text.find('[')
                end = cleaned_text.rfind(']') + 1
                if start != -1 and end != -1:
                    cleaned_text = cleaned_text[start:end]

            # Parse JSON
            questions = json.loads(cleaned_text)

            if not isinstance(questions, list) or len(questions) == 0:
                return {
                    'status': 'error',
                    'error': 'Invalid response format from LLM'
                }

            # Validate and clean questions
            validated_questions = []
            validated_questions.extend(
                {
                    'question': q['question'].strip(),
                    'category': q.get('category', 'Technical'),
                    'skill_related': q.get('skill_related', 'General'),
                }
                for q in questions[:question_count]
                if isinstance(q, dict)
                and 'question' in q
                and q['question'].strip()
            )
            if not validated_questions:
                return {
                    'status': 'error',
                    'error': 'No valid questions generated'
                }

            result = {
                'status': 'success',
                'questions': validated_questions,
                'question_count': len(validated_questions),
            } | extra_data
            return result

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing error: {e}")
            return {
                'status': 'error',
                'error': f'Failed to parse LLM response: {str(e)}'
            }
        except Exception as e:
            logger.exception(f"Error generating interview questions: {e}")
            return {
                'status': 'error',
                'error': f'Failed to generate questions: {str(e)}'
            }


# Singleton instance
interview_questions_service = InterviewQuestionGeneratorService()