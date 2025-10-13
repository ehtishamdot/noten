# Note Ninjas - Full Stack Physical Therapy Application

A comprehensive physical therapy workflow application featuring an AI-powered RAG (Retrieval-Augmented Generation) backend for OT recommendations and a modern Next.js frontend.

## Project Structure

This repository contains both the backend and frontend components:

- **Backend**: Python FastAPI server with RAG-based recommendation engine
- **Frontend**: Next.js application with modern UI for physical therapy workflows

---

## 🔧 Backend - Note Ninjas RAG Engine

RAG-only OT recommendation engine with feedback handling for the Note Ninjas application.

### Backend Features

- **RAG-Only Recommendations**: Grounded in retrieved sources (Note Ninjas → CPGs → Textbooks)
- **Hybrid Retrieval**: BM25 + dense vector search with cross-encoder reranking
- **Feedback System**: Session-based feedback handling with preference learning
- **Multi-format Support**: PDF, DOCX, and TXT document processing
- **Structured Output**: JSON responses with exercises, cues, documentation, and CPT codes
- **Source Prioritization**: Note Ninjas content prioritized over CPGs and textbooks

### Backend Architecture

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

### Backend Installation

1. **Navigate to backend directory and create virtual environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

### Backend Usage

```bash
# Run development server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Run production server
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 🌐 Frontend - NextGenPT Demo

A modern physical therapy workflow application built with Next.js.

### Frontend Features

- Clean, modern UI with a subtle blue color scheme
- Patient selection interface
- Responsive design with Tailwind CSS
- TypeScript for type safety
- Integration ready for backend API

### Frontend Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open [http://localhost:3000](http://localhost:3000)** with your browser to see the application.

### Patient Selection

The demo includes three patient profiles:

- John Doe (Male, 45 years old)
- Emily Smith (Female, 32 years old)
- Maria Garcia (Female, 58 years old)

Click on any patient card to begin the intake process (functionality to be expanded).

---

## 🚀 Full Stack Development

### Running Both Services

1. **Start the backend server** (Terminal 1):
   ```bash
   source venv/bin/activate
   uvicorn main:app --reload --port 8000
   ```

2. **Start the frontend server** (Terminal 2):
   ```bash
   npm run dev
   ```

### Tech Stack

**Backend:**
- **FastAPI** - Modern Python web framework
- **Python 3.11+** - Programming language
- **Sentence Transformers** - Embedding models
- **ChromaDB/FAISS** - Vector databases
- **Pydantic** - Data validation

**Frontend:**
- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React 18** - UI library

---

## 📚 API Documentation

When the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

### Key Endpoints

- `POST /recommendations` - Get AI-powered therapy recommendations
- `POST /feedback` - Submit user feedback
- `GET /health` - Health check
- `GET /sources` - Available document sources

---

## 🏗️ Development

### Backend Structure

```
backend/
├── main.py                 # FastAPI application
├── config.py              # Configuration settings
├── requirements.txt       # Dependencies
├── core/                  # Core RAG system
│   ├── rag_system.py     # Main RAG orchestrator
│   ├── document_processor.py  # Document processing
│   ├── retriever.py      # Hybrid retrieval
│   ├── reranker.py       # Cross-encoder reranking
│   └── feedback_manager.py    # Feedback handling
├── models/               # Pydantic models
└── tests/               # Test files
```

### Frontend Structure

```
app/
├── page.tsx              # Home page
├── layout.tsx            # Root layout
├── globals.css           # Global styles
├── components/           # React components
│   ├── LoginPage.tsx
│   └── HistorySidebar.tsx
├── note-ninjas/         # Main app pages
└── history/             # History pages
```

---

## 🧪 Testing

```bash
# Backend tests
pytest tests/ -v

# Frontend tests (when available)
npm test
```

---

## 📄 License

[Your License Here]

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request
