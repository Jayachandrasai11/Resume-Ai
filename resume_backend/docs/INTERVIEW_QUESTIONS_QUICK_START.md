# Interview Questions Generator - Quick Start Guide

## Overview

The AI Interview Question Generator automatically creates relevant interview questions based on a candidate's skills and the target job role.

## Prerequisites

1. ✅ Django server running
2. ✅ Candidates with skills in the database
3. ✅ Gemini API key configured in `.env` file

## Setup (2 minutes)

### 1. Configure Gemini API Key

Add this to your `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Ensure Candidates Have Skills

If candidates don't have skills yet, extract them:

```bash
# Extract skills for a specific candidate
curl -X POST http://localhost:8000/api/candidates/1/skills/

# Or process all resumes to extract skills
python process_all.py
```

### 3. Start the Server

```bash
cd Project1/resume_backend
python manage.py runserver
```

## Usage

### Basic Example

Generate 8 interview questions for a Python Developer:

```bash
curl -X POST http://localhost:8000/api/candidates/interview-questions/ \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "job_role": "Senior Python Developer"
  }'
```

### Custom Question Count

Generate 5 questions (minimum):

```bash
curl -X POST http://localhost:8000/api/candidates/interview-questions/ \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "job_role": "Full Stack Developer",
    "question_count": 5
  }'
```

Generate 10 questions (maximum):

```bash
curl -X POST http://localhost:8000/api/candidates/interview-questions/ \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 2,
    "job_role": "DevOps Engineer",
    "question_count": 10
  }'
```

## Expected Response

```json
{
  "status": "success",
  "candidate_id": 1,
  "candidate_name": "John Doe",
  "job_role": "Senior Python Developer",
  "skills": ["Python", "Django", "PostgreSQL", "Docker", "AWS"],
  "questions": [
    {
      "question": "Explain how you would optimize a Django REST API for high traffic?",
      "category": "Technical",
      "skill_related": "Django"
    },
    {
      "question": "Describe a challenging technical problem you solved recently.",
      "category": "Behavioral",
      "skill_related": "General"
    }
  ],
  "question_count": 8
}
```

## Python Example

```python
import requests

def generate_interview_questions(candidate_id, job_role, question_count=8):
    url = "http://localhost:8000/api/candidates/interview-questions/"
    
    payload = {
        "candidate_id": candidate_id,
        "job_role": job_role,
        "question_count": question_count
    }
    
    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Generated {data['question_count']} questions for {data['candidate_name']}")
        print(f"Role: {data['job_role']}")
        print(f"Skills: {', '.join(data['skills'])}")
        print()
        
        for i, q in enumerate(data['questions'], 1):
            print(f"{i}. [{q['category']}] {q['question']}")
            print(f"   Skill: {q['skill_related']}")
            print()
        
        return data['questions']
    else:
        print(f"Error: {response.json()}")
        return None

# Usage
questions = generate_interview_questions(
    candidate_id=1,
    job_role="Senior Python Developer",
    question_count=8
)
```

## JavaScript Example

```javascript
async function generateInterviewQuestions(candidateId, jobRole, questionCount = 8) {
    const url = 'http://localhost:8000/api/candidates/interview-questions/';
    
    const payload = {
        candidate_id: candidateId,
        job_role: jobRole,
        question_count: questionCount
    };
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(`Generated ${data.question_count} questions for ${data.candidate_name}`);
            console.log(`Role: ${data.job_role}`);
            console.log(`Skills: ${data.skills.join(', ')}`);
            console.log();
            
            data.questions.forEach((q, i) => {
                console.log(`${i + 1}. [${q.category}] ${q.question}`);
                console.log(`   Skill: ${q.skill_related}`);
                console.log();
            });
            
            return data.questions;
        } else {
            console.error('Error:', data);
            return null;
        }
    } catch (error) {
        console.error('Request failed:', error);
        return null;
    }
}

// Usage
generateInterviewQuestions(1, 'Senior Python Developer', 8);
```

## Testing

### Run the Test Script

```bash
cd Project1/resume_backend
python test_interview_questions_api.py
```

### Run Unit Tests

```bash
python manage.py test candidates.tests.test_interview_questions
```

## Common Issues

### Issue: "No skills found for this candidate"

**Solution**: Extract skills first:
```bash
curl -X POST http://localhost:8000/api/candidates/{candidate_id}/skills/
```

### Issue: "Gemini API key not configured"

**Solution**: Add `GEMINI_API_KEY` to your `.env` file:
```env
GEMINI_API_KEY=your_api_key_here
```

### Issue: "Candidate with ID X not found"

**Solution**: Verify the candidate exists:
```bash
curl http://localhost:8000/api/candidates/
```

## Question Categories

The generator creates questions in four categories:

1. **Technical**: Tests specific technical knowledge
2. **Behavioral**: Assesses past experiences and work style
3. **Scenario-based**: Evaluates handling of real-world situations
4. **Problem-solving**: Tests analytical abilities

## Next Steps

- 📖 Read the full documentation: `INTERVIEW_QUESTIONS_API.md`
- 🧪 Run comprehensive tests: `python manage.py test`
- 🚀 Integrate with your frontend application
- 📊 Add analytics to track question effectiveness

## Support

For issues or questions:
- Check the API documentation
- Review the service code: `candidates/services/interview_questions.py`
- Verify your Gemini API key is valid

## Features Summary

✅ **Skill-Based**: Questions tailored to candidate's specific skills  
✅ **Role-Specific**: Customized for target job role  
✅ **Mixed Types**: Technical, behavioral, scenario-based, problem-solving  
✅ **Configurable**: 5-10 questions per request  
✅ **Smart Categorization**: Each question categorized by type and skill  
✅ **Error Handling**: Comprehensive validation and error messages