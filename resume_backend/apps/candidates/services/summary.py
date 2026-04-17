import logging
import os
from typing import Any, Optional

import google.generativeai as genai
from django.conf import settings

from ..models import Candidate

logger = logging.getLogger(__name__)


class SummaryGeneratorService:
    def __init__(self) -> None:
        self.api_key: Optional[str] = getattr(settings, 'GEMINI_API_KEY', None)
        if not self.api_key:
            # Try to get from os.environ as fallback
            self.api_key = os.environ.get('GEMINI_API_KEY')
        
        self.model: Optional[Any] = None

        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.5-flash')

    def generate_candidate_summary(self, candidate: Candidate, resume_text: str) -> str:
        """
        Generate a concise candidate summary using Gemini LLM.
        The summary includes years of experience, key skills, and domain expertise.
        """
        if not self.model:
            return "Gemini API key not configured."

        if not resume_text:
            return "No resume text available for summary generation."

        truncated_resume_text = resume_text[:10000]
        prompt = f"""
        Act as a senior technical recruiter. Based on the following resume text,
        generate a concise, professional summary for the candidate.

        The summary MUST include:
        1. Total years of experience.
        2. Key technical skills.
        3. Primary domain expertise.

        Format the summary as a single, recruiter-friendly paragraph (3-5 sentences).

        Resume Text:
        {truncated_resume_text}
        """

        try:
            return self._extracted_from_generate_candidate_summary_29(prompt, candidate)
        except Exception as e:
            logger.exception("Error generating summary for candidate %s", candidate.id)
            return f"Error generating summary: {str(e)}"

    # TODO Rename this here and in `generate_candidate_summary`
    def _extracted_from_generate_candidate_summary_29(self, prompt, candidate):
        response = self.model.generate_content(prompt)
        summary_text = (getattr(response, 'text', '') or '').strip()

        if not summary_text:
            return "Summary generation returned no text."

        # Store the generated summary in the candidate model
        candidate.summary = summary_text
        candidate.save(update_fields=['summary'])

        return summary_text

# Singleton instance
summary_service = SummaryGeneratorService()
