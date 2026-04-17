# AI Interview Question Generator API

## Overview

The AI Interview Question Generator is a powerful feature that automatically generates relevant interview questions based on a candidate's skills, experience, and the target job role. This leverages Gemini LLM to create role-specific, skill-targeted interview questions.

## Features

- **Skill-Based Questions**: Questions are tailored to the candidate's specific technical skills
- **Role-Specific**: Questions are customized for the target job role
- **Mixed Question Types**: Includes technical, behavioral, scenario-based, and problem-solving questions
- **Configurable Count**: Generate 5-10 questions per request
- **Smart Categorization**: Each question is categorized by type and related skill

## API Endpoint

### Generate Interview Questions

**Endpoint**: `POST /api/candidates/interview-questions/`

**Request Body**:
```json
{
  "candidate_id": 1,
  "job_role": "Senior Python Developer",
  "question_count": 8
}
```

**Parameters**:
- `candidate_id` (required): ID of the candidate in the database
- `job_role` (required): The job role for which interview questions are needed
- `question_count` (optional): Number of questions to generate (default: 8, range: 5-10)

**Success Response** (200 OK):
```json
{
  "status": "success",
  "candidate_id": 1,
  "candidate_name": "John Doe",
  "job_role": "Senior Python Developer",
  "skills": [
    "Python",
    "Django",
    "PostgreSQL",
    "Docker",
    "AWS",
    "REST API"
  ],
  "questions": [
    {
      "question": "Explain how you would optimize a Django REST API for high traffic scenarios?",
      "category": "Technical",
      "skill_related": "Django"
    },
    {
      "question": "Describe a challenging technical problem you solved recently and your approach to it.",
      "category": "Behavioral",
      "skill_related": "General"
    },
    {
      "question": "How would you design a database schema for a multi-tenant SaaS application using PostgreSQL?",
      "category": "Scenario-based",
      "skill_related": "PostgreSQL"
    }
  ],
  "question_count": 8
}
```

**Error Responses**:

400 Bad Request - Missing required fields:
```json
{
  "error": "candidate_id is required"
}
```

400 Bad Request - Candidate not found:
```json
{
  "status": "error",
  "error": "Candidate with ID 999 not found"
}
```

400 Bad Request - No skills found:
```json
{
  "status": "error",
  "error": "No skills found for this candidate. Please ensure skills are extracted."
}
```

400 Bad Request - API not configured:
```json
{
  "status": "error",
  "error": "Gemini API key not configured. Please set GEMINI_API_KEY in settings."
}
```

## Question Categories

The generator creates questions in four categories:

1. **Technical**: Questions testing specific technical knowledge and skills
2. **Behavioral**: Questions about past experiences and work style
3. **Scenario-based**: Questions about handling real-world situations
4. **Problem-solving**: Questions testing analytical and problem-solving abilities

## Usage Examples

### Example 1: Generate questions for a Python Developer

```bash
curl -X POST http://localhost:8000/api/candidates/interview-questions/ \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "job_role": "Senior Python Developer",
    "question_count": 8
  }'
```

### Example 2: Generate questions for a DevOps Engineer

```bash
curl -X POST http://localhost:8000/api/candidates/interview-questions/ \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 2,
    "job_role": "DevOps Engineer",
    "question_count": 10
  }'
```

### Example 3: Generate minimal questions (5)

```bash
curl -X POST http://localhost:8000/api/candidates/interview-questions/ \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 3,
    "job_role": "Full Stack Developer",
    "question_count": 5
  }'
```

## Integration with Existing System

### Prerequisites

Before using the interview question generator:

1. **Candidate must exist in the database**
2. **Candidate must have skills extracted** (either via M2M relationship or JSON field)
3. **Gemini API key must be configured** in settings

### Skill Extraction

If a candidate doesn't have skills, use the skill extraction endpoint:

```bash
curl -X POST http://localhost:8000/api/candidates/{candidate_id}/skills/
```

### View Candidate Skills

To check what skills a candidate has:

```bash
curl -X GET http://localhost:8000/api/candidates/{candidate_id}/skills/
```

## How It Works

### Service Architecture

```
Request (candidate_id, job_role)
    ↓
InterviewQuestionsAPIView
    ↓
InterviewQuestionGeneratorService
    ↓
1. Retrieve candidate from database
2. Extract candidate skills (M2M + JSON fallback)
3. Build candidate profile (skills, experience, education, summary)
4. Construct LLM prompt with job role and skills
5. Send to Gemini LLM
6. Parse and validate response
7. Return structured questions
```

### LLM Prompt Strategy

The service uses a sophisticated prompt that:

1. **Includes full candidate profile**: Skills, experience, education, summary
2. **Specifies job role context**: Questions are role-specific
3. **Defines question mix**: Technical, behavioral, scenario-based, problem-solving
4. **Enforces skill relevance**: At least 2 questions test specific skills
5. **Requires structured output**: JSON format with question, category, and skill

### Error Handling

The service includes comprehensive error handling for:

- Missing or invalid candidate_id
- Candidate not found in database
- No skills available for candidate
- LLM API not configured
- LLM response parsing failures
- Network or API errors

## Testing

### Manual Testing

Use Django's test client or curl to test the endpoint:

```python
from django.test import Client
import json

client = Client()
response = client.post(
    '/api/candidates/interview-questions/',
    data=json.dumps({
        'candidate_id': 1,
        'job_role': 'Python Developer',
        'question_count': 8
    }),
    content_type='application/json'
)
print(response.json())
```

### Automated Testing

Unit tests are available in `candidates/tests/test_interview_questions.py`:

```bash
python manage.py test candidates.tests.InterviewQuestionTests
```

## Configuration

### Environment Variables

Ensure the following is set in your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Settings

The service uses the `GEMINI_API_KEY` from Django settings:

```python
# resume_backend/settings.py
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
```

## Performance Considerations

- **Response Time**: Typically 2-5 seconds per request (depends on LLM API)
- **Rate Limits**: Respect Gemini API rate limits
- **Caching**: Consider caching results for repeated requests
- **Batch Processing**: For multiple candidates, implement batch processing

## Future Enhancements

Potential improvements:

1. **Question Difficulty Levels**: Add easy/medium/hard difficulty options
2. **Custom Question Templates**: Allow companies to add their own question templates
3. **Answer Evaluation**: Use LLM to evaluate candidate answers
4. **Question History**: Track which questions were asked to which candidates
5. **Analytics**: Track question effectiveness and candidate performance
6. **Multi-language Support**: Generate questions in different languages

## Troubleshooting

### Common Issues

**Issue**: "No skills found for this candidate"
- **Solution**: Ensure skills are extracted using the skill extraction endpoint

**Issue**: "Gemini API key not configured"
- **Solution**: Set GEMINI_API_KEY in your .env file

**Issue**: "Failed to parse LLM response"
- **Solution**: Check Gemini API status and ensure valid API key

**Issue**: Slow response times
- **Solution**: This is normal for LLM calls; consider caching for frequently used candidates

## Support

For issues or questions:
- Check the logs: `DEBUG=True` in settings
- Review the service code: `candidates/services/interview_questions.py`
- Test the API endpoint directly
- Verify Gemini API key is valid and has credits

## License

This feature is part of the Resume Intelligence System.