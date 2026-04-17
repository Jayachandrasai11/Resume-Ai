import os
import json
import re
import google.generativeai as genai
from django.conf import settings
from ..models import Candidate, Skill

# Predefined list of common technical skills for baseline extraction
COMMON_SKILLS = [
    "Python", "Java", "C++", "C#", "JavaScript", "TypeScript", "Go", "Rust", "Swift", "Kotlin",
    "Django", "Flask", "FastAPI", "Spring Boot", "ASP.NET", "Node.js", "Express.js",
    "React", "Angular", "Vue.js", "Next.js", "Svelte",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "Cassandra", "DynamoDB",
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Terraform", "Ansible", "Jenkins",
    "Git", "CI/CD", "REST API", "GraphQL", "Microservices", "Serverless",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision", "TensorFlow", "PyTorch",
    "Pandas", "NumPy", "Scikit-learn", "Keras", "Matplotlib", "Seaborn",
    "SQL", "NoSQL", "RabbitMQ", "Kafka", "Celery", "Apache Spark", "Hadoop",
    "Linux", "Bash", "Shell Scripting", "Agile", "Scrum", "TDD", "Unit Testing"
]

class SkillExtractionService:
    def __init__(self):
        self.api_key = getattr(settings, 'GEMINI_API_KEY', os.environ.get('GEMINI_API_KEY'))
        if self.api_key:
            genai.configure(api_key=self.api_key)
            # Using gemini-2.5-flash as it's a stable and fast model
            self.model = genai.GenerativeModel('gemini-2.5-flash')
        else:
            self.model = None

    def _extract_predefined_skills(self, text: str) -> set:
        """Extract skills based on a predefined list using regex."""
        found_skills = set()
        for skill in COMMON_SKILLS:
            # Use word boundaries to avoid partial matches (e.g., "Go" in "Google")
            # Special handling for skills with special characters like C++, C#
            escaped_skill = re.escape(skill)
            pattern = rf'\b{escaped_skill}\b'
            if re.search(pattern, text, re.IGNORECASE):
                found_skills.add(skill)
        return found_skills

    def extract_skills(self, candidate: Candidate, resume_text: str) -> list:
        """
        Extract technical skills from resume text using predefined list only (no LLM).
        Stores them in the Skill table and links them to the Candidate via M2M.
        """
        if not resume_text:
            return []

        # Use predefined list for regex-based extraction only
        # This avoids Gemini API quota issues
        extracted_skill_names = self._extract_predefined_skills(resume_text)

        # 3. Process and store skills
        final_skills = []
        for name in extracted_skill_names:
            name = name.strip()
            if not name: continue  # noqa: E701

            if existing_skill := Skill.objects.filter(name__iexact=name).first():
                skill = existing_skill
            else:
                # If it's a known acronym, keep it uppercase, otherwise Title case
                if name.upper() in ["AWS", "GCP", "API", "REST", "SQL", "CI/CD", "TDD", "NLP"]:
                    name = name.upper()
                else:
                    name = name.title()
                skill, _ = Skill.objects.get_or_create(name=name)

            final_skills.append(skill)

        # 4. Link to candidate
        if final_skills:
            candidate.skills_m2m.add(*final_skills)

            # 5. Sync with the legacy JSON field for backward compatibility
            current_json_skills = set(candidate.skills or [])
            for s in final_skills:
                current_json_skills.add(s.name)
            candidate.skills = list(current_json_skills)
            candidate.save(update_fields=['skills'])

        return [s.name for s in final_skills]

skill_service = SkillExtractionService()
