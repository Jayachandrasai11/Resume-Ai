# Interview Questions Generator - System Integration Diagram

## High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile App]
        C[API Client]
    end
    
    subgraph "API Gateway"
        D[Django REST Framework]
        E[InterviewQuestionsAPIView]
    end
    
    subgraph "Service Layer"
        F[InterviewQuestionGeneratorService]
        G[Skill Extraction]
        H[Profile Building]
        I[LLM Integration]
    end
    
    subgraph "Data Layer"
        J[(PostgreSQL Database)]
        K[Candidate Model]
        L[Skill Model]
        M[Resume Model]
    end
    
    subgraph "External Services"
        N[Gemini API]
        O[LLM Processing]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    G --> J
    H --> J
    I --> N
    J --> K
    J --> L
    J --> M
    N --> O
    
    style A fill:#e1f5ff
    style B fill:#e1f5ff
    style C fill:#e1f5ff
    style N fill:#fff3e0
    style O fill:#fff3e0
    style J fill:#e8f5e9
```

## Detailed Component Interaction

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant API as InterviewQuestionsAPIView
    participant Service as InterviewQuestionGeneratorService
    participant DB as PostgreSQL Database
    participant LLM as Gemini API
    
    Client->>API: POST /api/candidates/interview-questions/
    Note over Client,API: {candidate_id, job_role, question_count}
    
    API->>API: Validate Input
    alt Invalid Input
        API-->>Client: 400 Bad Request
    end
    
    API->>Service: generate_interview_questions()
    
    Service->>DB: Query Candidate
    DB-->>Service: Candidate Object
    
    alt Candidate Not Found
        Service-->>API: Error: Not Found
        API-->>Client: 400 Bad Request
    end
    
    Service->>Service: Extract Skills
    Note over Service: From M2M + JSON
    
    alt No Skills
        Service-->>API: Error: No Skills
        API-->>Client: 400 Bad Request
    end
    
    Service->>Service: Build Profile
    Note over Service: Skills, Experience, Education, Summary
    
    Service->>Service: Construct Prompt
    Note over Service: Include job_role and skills
    
    Service->>LLM: Send Prompt
    LLM-->>Service: JSON Response
    
    alt Invalid Response
        Service-->>API: Error: Parse Failed
        API-->>Client: 400 Bad Request
    end
    
    Service->>Service: Validate Questions
    Note over Service: Check structure and content
    
    Service-->>API: Success Response
    Note over Service,API: {status, questions, ...}
    
    API-->>Client: 200 OK
    Note over API,Client: {questions: [...]}
```

## Data Model Relationships

```mermaid
erDiagram
    Candidate ||--o{ Resume : has
    Candidate ||--o{ Skill : possesses
    Candidate {
        int id PK
        string name
        string email
        string phone
        json skills
        json education
        json experience
        text summary
    }
    
    Resume {
        int id PK
        int candidate_id FK
        string file
        string file_name
        text text
        string source
        datetime uploaded_at
        boolean chunked
    }
    
    Skill {
        int id PK
        string name UK
        datetime created_at
    }
    
    Candidate }o--o{ Skill : skills_m2m
```

## API Request/Response Flow

```mermaid
graph LR
    A[Request] --> B{Validate}
    B -->|Valid| C[Service]
    B -->|Invalid| D[Error 400]
    
    C --> E{Candidate Exists?}
    E -->|Yes| F{Skills Available?}
    E -->|No| G[Error 404]
    
    F -->|Yes| H{LLM Ready?}
    F -->|No| I[Error 400]
    
    H -->|Yes| J[Generate Questions]
    H -->|No| K[Error 500]
    
    J --> L{Valid Response?}
    L -->|Yes| M[Success 200]
    L -->|No| N[Error 400]
    
    style A fill:#e1f5ff
    style M fill:#e8f5e9
    style D fill:#ffebee
    style G fill:#ffebee
    style I fill:#ffebee
    style K fill:#ffebee
    style N fill:#ffebee
```

## Question Generation Process

```mermaid
graph TD
    Start[Start Generation] --> Input[Input: candidate_id, job_role, count]
    Input --> GetCandidate[Get Candidate from DB]
    GetCandidate --> CheckCandidate{Candidate Exists?}
    CheckCandidate -->|No| Error1[Error: Not Found]
    CheckCandidate -->|Yes| GetSkills[Get Skills]
    
    GetSkills --> ExtractM2M[Extract from M2M]
    ExtractM2M --> ExtractJSON[Extract from JSON]
    ExtractJSON --> Combine[Combine Skills]
    Combine --> CheckSkills{Skills Available?}
    CheckSkills -->|No| Error2[Error: No Skills]
    CheckSkills -->|Yes| BuildProfile[Build Profile]
    
    BuildProfile --> AddName[Add Name]
    AddName --> AddExp[Add Experience]
    AddExp --> AddEdu[Add Education]
    AddEdu --> AddSummary[Add Summary]
    AddSummary --> BuildPrompt[Build LLM Prompt]
    
    BuildPrompt --> AddRole[Add Job Role]
    AddRole --> AddSkills[Add Skills]
    AddSkills --> AddCount[Add Question Count]
    AddCount --> CallLLM[Call Gemini API]
    
    CallLLM --> GetResponse[Get Response]
    GetResponse --> ParseJSON[Parse JSON]
    ParseJSON --> CheckParse{Valid JSON?}
    CheckParse -->|No| Error3[Error: Parse Failed]
    CheckParse -->|Yes| ValidateQuestions[Validate Questions]
    
    ValidateQuestions --> CheckQuestions{Valid Questions?}
    CheckQuestions -->|No| Error4[Error: No Questions]
    CheckQuestions -->|Yes| FormatResponse[Format Response]
    FormatResponse --> Return[Return Success]
    
    Error1 --> End[End]
    Error2 --> End
    Error3 --> End
    Error4 --> End
    Return --> End
    
    style Start fill:#e1f5ff
    style Return fill:#e8f5e9
    style Error1 fill:#ffebee
    style Error2 fill:#ffebee
    style Error3 fill:#ffebee
    style Error4 fill:#ffebee
```

## System Components Overview

### 1. Client Layer
- **Web Browser**: React/Vue/Angular frontend
- **Mobile App**: iOS/Android application
- **API Client**: Python/JavaScript/other clients

### 2. API Layer
- **Django REST Framework**: REST API framework
- **InterviewQuestionsAPIView**: Main API endpoint
- **Authentication**: JWT (future)
- **Rate Limiting**: Configurable

### 3. Service Layer
- **InterviewQuestionGeneratorService**: Core business logic
- **Skill Extraction**: Multi-source skill retrieval
- **Profile Building**: Candidate profile construction
- **LLM Integration**: Gemini API communication

### 4. Data Layer
- **PostgreSQL**: Primary database
- **Candidate Model**: Candidate data
- **Skill Model**: Skill records
- **Resume Model**: Resume files and text

### 5. External Services
- **Gemini API**: LLM for question generation
- **Model**: gemini-2.5-flash-exp
- **Features**: Text generation, JSON parsing

## Integration Points

### Existing System Integration

```mermaid
graph LR
    subgraph "Existing Features"
        A[Candidate Management]
        B[Resume Parsing]
        C[Skill Extraction]
        D[RAG System]
    end
    
    subgraph "New Feature"
        E[Interview Questions]
    end
    
    A --> E
    B --> E
    C --> E
    D -.-> E
    
    style E fill:#c8e6c9
```

### Database Integration

```mermaid
graph TD
    A[Candidate Table] --> B[Skills M2M]
    A --> C[Skills JSON]
    A --> D[Experience JSON]
    A --> E[Education JSON]
    A --> F[Summary Text]
    
    B --> G[Skill Table]
    
    H[Interview Questions Service] --> A
    H --> B
    H --> C
    H --> D
    H --> E
    H --> F
    
    style H fill:#c8e6c9
```

## Security Flow

```mermaid
graph TD
    A[Client Request] --> B[Input Validation]
    B --> C[Sanitization]
    C --> D[Authentication Check]
    D --> E[Authorization Check]
    E --> F[Rate Limit Check]
    F --> G[Service Processing]
    G --> H[Database Query]
    H --> I[LLM API Call]
    I --> J[Response Validation]
    J --> K[Output Sanitization]
    K --> L[Response]
    
    style A fill:#e1f5ff
    style L fill:#e8f5e9
    style B fill:#fff3e0
    style C fill:#fff3e0
    style D fill:#fff3e0
    style E fill:#fff3e0
    style F fill:#fff3e0
    style J fill:#fff3e0
    style K fill:#fff3e0
```

## Error Handling Flow

```mermaid
graph TD
    A[Request] --> B{Error Type?}
    
    B -->|Validation Error| C[400 Bad Request]
    B -->|Not Found| D[404 Not Found]
    B -->|API Error| E[500 Internal Server Error]
    B -->|LLM Error| F[503 Service Unavailable]
    
    C --> G[Return Error Message]
    D --> G
    E --> G
    F --> G
    
    G --> H[Log Error]
    H --> I[Return to Client]
    
    style A fill:#e1f5ff
    style I fill:#ffebee
    style C fill:#ffebee
    style D fill:#ffebee
    style E fill:#ffebee
    style F fill:#ffebee
```

## Performance Flow

```mermaid
graph TD
    A[Request Start] --> B[Validation 10ms]
    B --> C[DB Query 50ms]
    C --> D[Skill Extraction 20ms]
    D --> E[Profile Building 30ms]
    E --> F[LLM API Call 2000ms]
    F --> G[Response Parsing 50ms]
    G --> H[Validation 20ms]
    H --> I[Formatting 10ms]
    I --> J[Response 10ms]
    
    J --> K[Total: ~2200ms]
    
    style F fill:#fff3e0
    style K fill:#c8e6c9
```

## Deployment Architecture

```mermaid
graph TB
    subgraph "Load Balancer"
        LB[NGINX/AWS ELB]
    end
    
    subgraph "Web Servers"
        W1[Django Server 1]
        W2[Django Server 2]
        W3[Django Server N]
    end
    
    subgraph "Database"
        DB[(PostgreSQL Primary)]
        REPLICA[(PostgreSQL Replica)]
    end
    
    subgraph "Cache"
        REDIS[(Redis Cache)]
    end
    
    subgraph "External"
        GEMINI[Gemini API]
    end
    
    LB --> W1
    LB --> W2
    LB --> W3
    
    W1 --> DB
    W2 --> DB
    W3 --> DB
    
    DB --> REPLICA
    
    W1 --> REDIS
    W2 --> REDIS
    W3 --> REDIS
    
    W1 --> GEMINI
    W2 --> GEMINI
    W3 --> GEMINI
    
    style LB fill:#e1f5ff
    style DB fill:#e8f5e9
    style REDIS fill:#fff3e0
    style GEMINI fill:#fff3e0
```

## Monitoring & Observability

```mermaid
graph LR
    A[API Requests] --> B[Metrics Collection]
    B --> C[Prometheus]
    
    D[Application Logs] --> E[ELK Stack]
    
    F[Errors] --> G[Sentry]
    
    H[Performance] --> I[APM Tool]
    
    C --> J[Dashboard]
    E --> J
    G --> J
    I --> J
    
    J --> K[Alerts]
    K --> L[Notifications]
    
    style J fill:#c8e6c9
    style K fill:#fff3e0
    style L fill:#ffebee
```

---

**Diagram Legend**:
- 🟦 Blue: User/Client facing components
- 🟩 Green: Success/Database components
- 🟧 Orange: External services/Processing
- 🟥 Red: Error/Alert components

**Note**: All diagrams are created using Mermaid syntax and can be rendered in Markdown viewers that support Mermaid.