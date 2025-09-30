# Note Ninjas Backend Setup Guide

## 🎯 Overview

I've created a comprehensive Python backend for the Note Ninjas OT Recommender system that implements your detailed system prompt requirements. The backend features:

- **RAG-Only Architecture**: Pure retrieval-augmented generation with no hallucination
- **Source Prioritization**: Note Ninjas → CPGs → Textbooks
- **Hybrid Retrieval**: BM25 + dense vectors + cross-encoder reranking
- **Feedback System**: Session-based feedback handling with preference learning
- **Multi-format Support**: PDF, DOCX, TXT document processing
- **Structured JSON Output**: Exactly matching your specified schema

## 📁 Backend Structure

```
backend/
├── main.py                    # FastAPI application entry point
├── config.py                 # Configuration settings
├── requirements.txt          # Python dependencies
├── run.py                   # Simple server runner
├── setup.py                 # Automated setup script
├── demo.py                  # Basic functionality demo
├── integration_example.py   # Frontend integration example
├── env.example              # Environment configuration template
├── README.md                # Detailed documentation
├── core/                    # Core RAG system components
│   ├── rag_system.py       # Main RAG orchestrator
│   ├── document_processor.py # Multi-format document processing
│   ├── retriever.py        # Hybrid retrieval (BM25 + dense)
│   ├── reranker.py         # Cross-encoder reranking
│   └── feedback_manager.py # Session-based feedback handling
├── models/                  # Pydantic data models
│   ├── request_models.py   # API request schemas
│   └── response_models.py  # API response schemas
└── tests/                   # Test files
    └── test_basic.py       # Basic functionality tests
```

## 🚀 Quick Start

### 1. Automated Setup
```bash
cd backend
python setup.py
```

### 2. Manual Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create configuration
cp env.example .env
# Edit .env with your paths

# Test basic functionality
python demo.py

# Start the server
python run.py
```

### 3. Access the API
- **Server**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔧 Key Features Implemented

### RAG System
- **Document Processing**: Handles PDF, DOCX, TXT files
- **Source Priority**: Note Ninjas (1.0) → CPGs (0.8) → Textbooks (0.6)
- **Hybrid Retrieval**: BM25 for keyword matching + dense vectors for semantic similarity
- **Cross-encoder Reranking**: Improves relevance with `ms-marco-MiniLM-L-6-v2`
- **Diversity Filtering**: Prevents redundant results

### Feedback System
- **Session Management**: Tracks feedback per user session
- **Preference Learning**: Adjusts future recommendations
- **Content Filtering**: Blocks inappropriate content
- **CPT Corrections**: Learns correct billing codes
- **Multiple Feedback Types**: Thumbs up/down, corrections, preferences, blocks

### API Endpoints
- `POST /recommendations` - Generate OT recommendations
- `POST /feedback` - Submit user feedback
- `GET /feedback/{session_id}` - Get session feedback
- `DELETE /feedback/{session_id}` - Clear session feedback
- `GET /sources` - Get available sources info
- `GET /health` - Health check

## 📋 Example Usage

### Generate Recommendations
```bash
curl -X POST "http://localhost:8000/recommendations" \
  -H "Content-Type: application/json" \
  -d '{
    "user_input": {
      "patient_condition": "21 year old female with torn rotator cuff",
      "desired_outcome": "increase right shoulder abduction to 150°",
      "diagnosis": "Torn rotator cuff",
      "severity": "Moderate"
    },
    "session_id": "session_123"
  }'
```

### Submit Feedback
```bash
curl -X POST "http://localhost:8000/feedback" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "session_123",
    "feedback_type": "thumbs_down",
    "feedback_data": {
      "reason": "too_advanced",
      "exercise": "wall_slides"
    }
  }'
```

## 🔗 Frontend Integration

The backend is designed to work seamlessly with your existing Next.js frontend:

1. **API Compatibility**: Matches your frontend's expected JSON format
2. **Session Management**: Uses session IDs for feedback tracking
3. **CORS Support**: Configured for localhost:3000
4. **Error Handling**: Proper HTTP status codes and error messages

### Frontend Code Example
```javascript
// Generate recommendations
const response = await fetch('http://localhost:8000/recommendations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_input: {
      patient_condition: formData.patientCondition,
      desired_outcome: formData.desiredOutcome,
      // ... other fields
    },
    session_id: sessionStorage.getItem('session-id')
  })
});

const recommendations = await response.json();

// Submit feedback
await fetch('http://localhost:8000/feedback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    session_id: sessionId,
    feedback_type: 'thumbs_up',
    feedback_data: { reason: 'helpful' }
  })
});
```

## 🎛️ Configuration

Key settings in `.env`:

```env
# Document paths
NOTE_NINJAS_PATH=../NoteNinjas
TITLED_CPG_PATH=../Titled_CPGs
UNTITLED_CPG_PATH=../Untitled_CPGs

# RAG settings
CHUNK_SIZE=1000
TOP_K_RETRIEVAL=50
TOP_N_RERANK=12

# Models
EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2
RERANK_MODEL=cross-encoder/ms-marco-MiniLM-L-6-v2
```

## 🧪 Testing

```bash
# Run basic tests
python demo.py

# Run integration example
python integration_example.py

# Run pytest (if installed)
pytest tests/ -v
```

## 🚀 Production Deployment

### Docker (Recommended)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables
```env
# Production settings
LOG_LEVEL=WARNING
FEEDBACK_STORAGE_TYPE=database
DATABASE_URL=postgresql://user:pass@localhost/note_ninjas
REDIS_URL=redis://localhost:6379
```

## 🔍 System Prompt Compliance

The backend implements all requirements from your system prompt:

✅ **RAG-Only**: No hallucination, all content grounded in retrieved sources  
✅ **Source Priority**: Note Ninjas → CPGs → Textbooks  
✅ **Structured JSON**: Exact schema matching your specification  
✅ **CPT Codes**: Only returns codes found in retrieved sources  
✅ **Feedback Loop**: Session-based feedback with preference learning  
✅ **Clinical Guardrails**: Clinician-facing, not medical advice  
✅ **Uncertainty Handling**: Returns "confidence": "low" when evidence is weak  
✅ **Framework Awareness**: Uses OTPF-4 reasoning when organizing content  

## 📞 Next Steps

1. **Install Dependencies**: Run `python setup.py` in the backend directory
2. **Test Basic Functionality**: Run `python demo.py`
3. **Start Server**: Run `python run.py`
4. **Integrate with Frontend**: Update your frontend to call the backend API
5. **Add Your Documents**: Place your Note Ninjas and CPG documents in the specified directories
6. **Customize**: Adjust configuration in `.env` for your specific needs

The backend is ready to use and should integrate seamlessly with your existing frontend code!
