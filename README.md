🧠 Resume Intelligence System  
 AI-Powered Recruitment Automation Platform

> Transforming unstructured resumes into intelligent hiring decisions using AI, vector search, and scalable full-stack architecture.

---

 🎥 Demo

👉 Live Demo: https://resume-ai-sable.vercel.app/
👉 Backend API: https://resume-ai-obq3.onrender.com

⚡ Problem

Recruiters face:
- ⏱️ Hours of manual resume screening
- ❌ Poor keyword-based filtering
- 📂 No centralized candidate tracking
- 🔍 No intelligent ranking system

---

💡 Solution

An AI-powered recruitment system that:

- Parses resumes using LLMs  
- Converts data into semantic embeddings  
- Matches candidates intelligently  
- Provides a complete hiring pipeline  

---

🏗️ Architecture Diagram

```
             ┌────────────────────┐
             │   React Frontend   │
             │ (Vercel Hosted)   │
             └────────┬──────────┘
                      │ API Calls
                      ▼
             ┌────────────────────┐
             │ Django REST API    │
             │ (Render Hosted)    │
             └────────┬──────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼                             ▼
┌───────────────┐          ┌──────────────────┐
│ Service Layer │          │ AI Layer         │
│ (Business     │          │ (LLM + Embedding)│
│ Logic)        │          └──────────────────┘
└──────┬────────┘                   │
       ▼                            ▼
┌──────────────────┐      ┌──────────────────┐
│ PostgreSQL       │      │ Vector DB        │
│ (Supabase)       │      │ (pgvector)       │
└──────────────────┘      └──────────────────┘
```

---

 🔄 Data Flow

```
Resume Upload
   ↓
Text Extraction (PDF/DOCX/OCR)
   ↓
LLM Parsing (Gemini API)
   ↓
Chunking
   ↓
Embedding Generation
   ↓
pgvector Storage
   ↓
Semantic Matching
   ↓
Ranked Candidates
```

---

🔥 Core Features

🤖 AI Engine
- Resume parsing (PDF, DOCX, Images)
- Semantic embeddings (MiniLM)
- Candidate-job matching
- AI interview question generator
- Resume chat (RAG-based)

 📊 Recruitment Workflow
- Job session management
- Candidate pipeline tracking
- Ranking system with similarity scores
- Analytics dashboard

🔐 Security
- JWT Authentication
- Role-based access
- File validation
- Environment variable protection

---

🧠 How Ranking Works (Deep Dive)

 Step 1: Text → Embeddings
Each resume is split into chunks and converted into vectors:

```
Resume Text → SentenceTransformer → 384-d Vector
```

 Step 2: Job Description Embedding
```
Job Description → Embedding Vector
```

 Step 3: Similarity Calculation
Using cosine similarity:

```
similarity = cosine(resume_vector, job_vector)
```

 Step 4: Ranking
- Candidates sorted by similarity score
- Top matches displayed

---

🧩 Engineering Decisions

| Decision | Reason |
|--------|--------|
| Django | Fast API development, strong ORM |
| pgvector | Cost-efficient vector search |
| MiniLM | Fast + accurate embeddings |
| Service Layer | Clean, scalable architecture |
| Supabase | Managed DB + storage |

---

⚙️ Tech Stack

Frontend
- React (Vite)
- Axios
- Zustand
- React Router

 Backend
- Django
- Django REST Framework
- Simple JWT
- django-cors-headers

 AI
- SentenceTransformers
- Google Gemini API

 Database
- PostgreSQL + pgvector (Supabase)

 Deployment
- Vercel (Frontend)
- Render (Backend)

---

⚠️ Real-World Problems Solved

- CORS issues (Vercel ↔ Render)
- API routing conflicts (/api handling)
- Axios base URL bugs
- Authentication deadlock
- Cold start delays (Render)

---

⚡ Performance Optimizations

- Vector search (fast retrieval)
- DB indexing
- Batch embedding generation
- API timeout handling

---

🧪 Testing

- API testing (Postman)
- UI flow testing
- Edge cases:
  - Empty resumes
  - Duplicate uploads
  - Invalid formats

---

 📊 Results

- ⏱️ 70–80% reduction in manual screening
- 🎯 Improved candidate matching
- 📈 Automated hiring workflow

---

🚧 Limitations

- AI responses vary
- OCR depends on input quality
- Cold start delays (Render free tier)

---

🔮 Future Scope

- WebSocket real-time updates
- Background jobs (Celery)
- Hybrid ranking (rules + AI)
- Multi-user collaboration
- Fine-tuned LLM

---

 🚀 Setup

 Backend

```bash
cd resume_backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

 Frontend

```bash
cd resume-frontend
npm install
npm run dev
```

---

👨‍💻 Author

N. Jayachandrasai

- GitHub: https://github.com/Jayachandrasai11
- LinkedIn: https://www.linkedin.com/in/sai-fullstackdeveloper/
