# Note Ninjas Backend

RAG-only OT recommendation engine with feedback handling for the Note Ninjas application.

## Features

- **RAG-Only Recommendations**: Grounded in retrieved sources (Note Ninjas → CPGs → Textbooks)
- **Hybrid Retrieval**: BM25 + dense vector search with cross-encoder reranking
- **Feedback System**: Session-based feedback handling with preference learning
- **Multi-format Support**: PDF, DOCX, and TXT document processing
- **Structured Output**: JSON responses with exercises, cues, documentation, and CPT codes
- **Source Prioritization**: Note Ninjas content prioritized over CPGs and textbooks

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Document      │    │   Retrieval     │    │   Generation    │
│   Processing    │───▶│   System        │───▶│   Engine        │
│   (PDF/DOCX)    │    │   (BM25+Dense)  │    │   (RAG)         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Feedback      │
                       │   Manager       │
                       │   (Session)     │
                       └─────────────────┘
```

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd note-ninjas/backend
   ```

2. **Create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Configuration

Create a `.env` file with the following variables:

```env
# Document paths
NOTE_NINJAS_PATH=../NoteNinjas
TITLED_CPG_PATH=../Titled_CPGs
UNTITLED_CPG_PATH=../Untitled_CPGs
VECTOR_STORE_PATH=./vector_store

# API settings
ALLOWED_ORIGINS=["http://localhost:3000"]

# RAG settings
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K_RETRIEVAL=50
TOP_N_RERANK=12

# Model settings
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RERANK_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2

# Logging
LOG_LEVEL=INFO
```

## Usage

### Development Server

```bash
# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Production Server

```bash
# Run production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## API Endpoints

### Health Check
```http
GET /health
```

### Get Recommendations
```http
POST /recommendations
Content-Type: application/json

{
  "user_input": {
    "patient_condition": "21 year old female with torn rotator cuff",
    "desired_outcome": "increase right shoulder abduction painless arc to 150° in 3-4 weeks",
    "treatment_progression": "progressed from 130° to 135° in week 1"
  },
  "session_id": "session_123",
  "rag_manifest": {
    "source_boosts": {
      "note_ninjas": 1.0,
      "cpg": 0.8,
      "textbook": 0.6
    }
  }
}
```

### Submit Feedback
```http
POST /feedback
Content-Type: application/json

{
  "session_id": "session_123",
  "recommendation_id": "rec_456",
  "feedback_type": "thumbs_down",
  "feedback_data": {
    "reason": "too_advanced"
  }
}
```

### Get Session Feedback
```http
GET /feedback/{session_id}
```

### Get Available Sources
```http
GET /sources
```

## Document Processing

The system processes documents in the following priority order:

1. **Note Ninjas** (highest priority)
   - Documentation Banks
   - CPT/Billing information
   - OTPF/terminology
   - Internal notes

2. **Clinical Practice Guidelines** (secondary)
   - Evidence-based recommendations
   - Contraindications
   - Safety guidelines

3. **Textbooks/Other** (tertiary)
   - Background information
   - Definitions

## RAG System

### Retrieval Process

1. **Query Building**: Extract queries from user input
2. **Hybrid Search**: BM25 + dense vector search
3. **Reranking**: Cross-encoder reranking for relevance
4. **Source Filtering**: Ensure Note Ninjas sources per exercise

### Response Generation

1. **High-level Recommendations**: Extract treatment principles
2. **Subsections**: Group exercises by topic/function
3. **Exercises**: Parse structured exercise data
4. **Alternatives**: Extract alternative approaches from CPGs

## Feedback System

### Supported Feedback Types

- `thumbs_up`: Positive feedback
- `thumbs_down`: Negative feedback with reasons
- `correction`: CPT or content corrections
- `preference`: User preferences (difficulty, style)
- `block`: Block specific content

### Feedback Processing

- **Session-based**: Feedback tied to user sessions
- **Preference Learning**: Adjust future recommendations
- **Content Filtering**: Block inappropriate content
- **CPT Corrections**: Learn correct billing codes

## Development

### Code Structure

```
backend/
├── main.py                 # FastAPI application
├── config.py              # Configuration settings
├── requirements.txt       # Dependencies
├── core/                  # Core RAG system
│   ├── __init__.py
│   ├── rag_system.py     # Main RAG orchestrator
│   ├── document_processor.py  # Document processing
│   ├── retriever.py      # Hybrid retrieval
│   ├── reranker.py       # Cross-encoder reranking
│   └── feedback_manager.py    # Feedback handling
├── models/               # Pydantic models
│   ├── __init__.py
│   ├── request_models.py
│   └── response_models.py
└── tests/               # Test files
    ├── __init__.py
    └── test_rag_system.py
```

### Running Tests

```bash
pytest tests/ -v
```

### Code Formatting

```bash
black backend/
flake8 backend/
mypy backend/
```

## Deployment

### Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

```env
# Production settings
LOG_LEVEL=WARNING
FEEDBACK_STORAGE_TYPE=database
DATABASE_URL=postgresql://user:pass@localhost/note_ninjas
REDIS_URL=redis://localhost:6379
```

## Troubleshooting

### Common Issues

1. **Document Processing Errors**
   - Check file permissions
   - Verify document formats are supported
   - Check for corrupted files

2. **Memory Issues**
   - Reduce `CHUNK_SIZE` and `TOP_K_RETRIEVAL`
   - Use smaller embedding models
   - Process documents in batches

3. **Slow Retrieval**
   - Use GPU acceleration for embeddings
   - Implement caching for frequent queries
   - Optimize chunk sizes

### Performance Optimization

- Use GPU for embedding generation
- Implement vector store caching
- Batch process documents
- Use connection pooling for databases

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

[Your License Here]
