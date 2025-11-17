# Note Ninjas Backend - Complete Feature Documentation

## Overview
The Note Ninjas Backend is a **RAG-only (Retrieval-Augmented Generation) OT recommendation engine** designed specifically for occupational therapy professionals. It uses advanced AI techniques to provide evidence-based recommendations grounded in retrieved medical documents, with no hallucination or fabricated information.

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Document      │    │   Retrieval     │    │   Generation    │
│   Processing    │───▶│   System        │───▶│   Engine        │
│   (PDF/DOCX)    │    │   (BM25+Dense)  │    │   (RAG+GPT-4)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Feedback      │
                       │   Manager       │
                       │   (Session)     │
                       └─────────────────┘
```

## Core Features

### 1. RAG-Only Recommendation System

**Purpose**: Generate evidence-based occupational therapy recommendations without hallucination.

**Key Components**:
- **Document Processors**: Handle PDF, DOCX, and TXT files
- **Hybrid Retrieval**: Combines BM25 (keyword) + dense vector search
- **Cross-encoder Reranking**: Improves relevance of retrieved documents
- **GPT-4o Mini Generation**: Structured JSON responses with proper citations

**How it Works**:
1. **Document Ingestion**: Processes documents from three priority sources:
   - **Note Ninjas** (Primary): Internal documentation, CPT codes, terminology
   - **Clinical Practice Guidelines** (Secondary): Evidence-based medical guidelines
   - **Textbooks/Other** (Tertiary): Background information and definitions

2. **Query Processing**: User input is analyzed and converted into multiple search queries
3. **Hybrid Retrieval**: Searches using both keyword matching (BM25) and semantic similarity
4. **Reranking**: Uses cross-encoder models to improve result relevance
5. **Generation**: GPT-4o Mini creates structured recommendations with proper source citations

**File**: `core/gpt_rag_system.py`, `core/rag_system.py`

### 2. Document Processing System

**Purpose**: Extract and chunk text from various document formats for RAG retrieval.

**Supported Formats**:
- **PDF**: Uses PyPDF2 for text extraction
- **DOCX**: Uses python-docx for Microsoft Word documents  
- **TXT**: Plain text files

**Processing Pipeline**:
1. **File Detection**: Automatically detects file type based on extension
2. **Text Extraction**: Extracts raw text maintaining structure
3. **Chunking**: Splits documents into overlapping chunks (default 1000 chars with 200 overlap)
4. **Metadata Extraction**: Identifies headers, page references, source types
5. **Source Classification**: Automatically classifies as note_ninjas, cpg, or textbook

**Key Features**:
- Smart chunking that respects sentence boundaries
- Header extraction for better document structure
- Source type detection based on file paths
- Page reference preservation for citations

**Files**: `core/document_processor.py`

### 3. Hybrid Retrieval System

**Purpose**: Find the most relevant documents using both keyword and semantic search.

**Components**:

#### BM25 (Keyword Search)
- Traditional TF-IDF based ranking
- Excellent for exact term matches
- Fast and computationally efficient

#### Dense Vector Search  
- Uses embedding models for semantic similarity
- **Primary**: OpenAI text-embedding-3-small
- **Fallback**: sentence-transformers/all-MiniLM-L6-v2
- Captures meaning beyond exact keywords

**Retrieval Process**:
1. **Query Building**: Extracts multiple search queries from user input
2. **Parallel Search**: Runs BM25 and vector search simultaneously
3. **Score Combination**: Merges results with configurable weights
4. **Source Boosting**: Prioritizes Note Ninjas sources over CPGs and textbooks
5. **Result Aggregation**: Returns top-k results for reranking

**Configuration Options**:
- `TOP_K_RETRIEVAL`: Number of initial results (default: 50)
- `source_boosts`: Weight different source types
- `header_boosts`: Prioritize specific document sections
- `topic_boosts`: Custom topic-specific weighting

**Files**: `core/retriever.py`

### 4. Cross-Encoder Reranking

**Purpose**: Improve retrieval precision by scoring query-document pairs.

**How it Works**:
- Uses cross-encoder/ms-marco-MiniLM-L-6-v2 model
- Evaluates each query-document pair individually
- Provides more accurate relevance scores than bi-encoder approaches

**Features**:
- **Diversity Filtering**: Reduces redundant results
- **Source Diversity**: Ensures representation from different document types
- **Configurable Top-N**: Controls final result count (default: 12)

**Process**:
1. Takes retrieval results and query
2. Creates query-document pairs
3. Scores each pair using cross-encoder
4. Re-ranks based on new scores
5. Applies diversity filtering
6. Returns top-N most relevant results

**Files**: `core/reranker.py`

### 5. Session-Based Feedback System

**Purpose**: Learn from user preferences and improve recommendations over time.

**Feedback Types**:

#### Thumbs Up/Down
- Simple positive/negative feedback
- Tracks recommendation quality
- Influences future result ranking

#### Corrections
- CPT code corrections
- Content accuracy improvements
- Builds correction database

#### Preferences  
- Difficulty level preferences (easier/harder)
- Style preferences
- Treatment approach preferences

#### Blocking
- Block specific CPT codes
- Block specific exercises or sources
- Remove inappropriate content

**Storage Options**:
- **Memory**: In-process storage (default)
- **File**: Persistent JSON storage
- **Database**: PostgreSQL/Redis (configurable)

**How Feedback Works**:
1. **Collection**: Receives feedback through API endpoints
2. **Processing**: Extracts actionable insights from feedback
3. **State Management**: Updates session-specific preferences
4. **Application**: Modifies future queries based on learned preferences
5. **Persistence**: Saves feedback state for session continuity

**Files**: `core/feedback_manager.py`

### 6. Structured Response Generation

**Purpose**: Generate consistent, clinician-friendly recommendations with proper citations.

**Response Structure**:

```json
{
  "high_level": ["Action-oriented recommendations"],
  "subsections": [{
    "title": "Treatment area",
    "rationale": "Evidence-based reasoning",
    "exercises": [{
      "title": "Exercise name",
      "description": "How to perform",
      "cues": ["Verbal cues"],
      "documentation": "Clinical documentation example",
      "cpt": "Billing code",
      "rationale": "Why this exercise",
      "contraindications": "Safety concerns",
      "progression_options": "How to progress",
      "dosage_specifics": "Sets/reps/duration",
      "timeline_phase": "Treatment phase",
      "monitoring_measures": "What to assess",
      "sources": [{"type": "note_ninjas", "quote": "..."}]
    }]
  }],
  "suggested_alternatives": [{
    "when": "Condition for alternative",
    "instead_try": "Alternative approach",
    "sources": [{"type": "cpg", "quote": "..."}]
  }],
  "confidence": "high|medium|low"
}
```

**Key Features**:
- **Evidence Grounding**: Every recommendation includes source citations
- **CPT Code Accuracy**: Only returns verified billing codes from documents
- **Clinical Language**: Uses appropriate medical terminology
- **Safety Focus**: Includes contraindications and safety guidelines
- **Progression Guidance**: Provides treatment progression options

**Files**: `models/response_models.py`

## API Endpoints

### 1. Health Check
```http
GET /health
```
**Purpose**: Check system status and component readiness
**Response**: Service health, version, and system component status

### 2. Generate Recommendations
```http  
POST /recommendations
```
**Purpose**: Main endpoint for generating OT recommendations

**Input Parameters**:
- `user_input`: Patient condition, desired outcome, treatment progression
- `session_id`: Session identifier for feedback tracking
- `rag_manifest`: Configuration for retrieval (source boosts, filters)
- `max_exercises`: Limit on number of exercises (default: 8)

**Response**: Structured recommendations with exercises, cues, documentation, and CPT codes

### 3. Submit Feedback
```http
POST /feedback
```
**Purpose**: Submit user feedback on recommendations

**Feedback Types**: thumbs_up, thumbs_down, correction, preference, block
**Input**: Session ID, recommendation ID, feedback type and data
**Response**: Confirmation of feedback storage

### 4. Get Session Feedback
```http
GET /feedback/{session_id}
```
**Purpose**: Retrieve all feedback for a session
**Response**: Complete feedback state including preferences and corrections

### 5. Clear Session Feedback
```http
DELETE /feedback/{session_id}
```
**Purpose**: Clear all feedback for a session
**Use Case**: Starting fresh or testing

### 6. Get Sources
```http
GET /sources
```
**Purpose**: Get information about available document sources
**Response**: Source statistics and availability

**Files**: `main.py`

## Data Models

### Request Models (`models/request_models.py`)

#### UserInput
- **Simple Mode**: Basic patient condition and desired outcome
- **Detailed Mode**: Comprehensive patient information including:
  - Demographics (age, gender)
  - Medical details (diagnosis, comorbidities, severity)
  - Functional status (prior function level, work requirements)
  - Treatment progression tracking

#### RAGManifest
- **Source Control**: Which document types to include
- **Boosting Configuration**: Priority weights for different sources
- **Filtering Options**: Content filters and constraints
- **Retrieval Parameters**: Top-k settings, confidence thresholds

#### FeedbackRequest
- **Session Tracking**: Links feedback to user sessions
- **Structured Data**: Typed feedback with metadata
- **Comments**: Free-text additional feedback

### Response Models (`models/response_models.py`)

#### RecommendationResponse
- **Hierarchical Structure**: High-level → subsections → exercises
- **Rich Exercise Data**: Comprehensive exercise information
- **Source Citations**: Proper academic-style citations
- **Confidence Scoring**: System confidence in recommendations

#### Exercise Model
- **Clinical Details**: Description, cues, contraindications
- **Billing Information**: CPT codes and documentation examples
- **Progression Data**: How to advance or modify exercises
- **Evidence Base**: Source citations and rationale

## Configuration System

**File**: `config.py`

**Key Settings**:

### Document Paths
- `NOTE_NINJAS_PATH`: Primary source documents
- `TITLED_CPG_PATH` / `UNTITLED_CPG_PATH`: Clinical guidelines
- `VECTOR_STORE_PATH`: Embedding storage location

### RAG Parameters
- `CHUNK_SIZE`: Document chunk size (default: 1000)
- `CHUNK_OVERLAP`: Chunk overlap (default: 200)  
- `TOP_K_RETRIEVAL`: Initial retrieval count (default: 50)
- `TOP_N_RERANK`: Final result count (default: 12)

### AI Models
- `USE_OPENAI_EMBEDDINGS`: Use OpenAI vs local embeddings
- `OPENAI_EMBEDDING_MODEL`: text-embedding-3-small
- `OPENAI_CHAT_MODEL`: gpt-4o-mini
- `EMBEDDING_MODEL`: Local fallback model
- `RERANK_MODEL`: Cross-encoder model

### API Configuration
- `ALLOWED_ORIGINS`: CORS configuration for frontend
- `FEEDBACK_STORAGE_TYPE`: How to persist feedback

## Security & Safety Features

### 1. RAG-Only Approach
- **No Hallucination**: All recommendations grounded in retrieved sources
- **Source Transparency**: Every claim includes citations
- **Evidence Hierarchy**: Prioritizes medical guidelines over general sources

### 2. Clinical Safety Guards
- **Contraindication Detection**: Flags safety concerns from CPGs
- **CPT Verification**: Only returns verified billing codes
- **Professional Language**: Clinician-facing, not patient advice

### 3. Feedback Safety
- **Session Isolation**: Feedback contained within sessions
- **Content Filtering**: Block inappropriate or unsafe recommendations
- **Correction Learning**: Learns from professional corrections

### 4. API Security
- **CORS Configuration**: Restricts frontend access
- **Input Validation**: Pydantic model validation
- **Error Handling**: Graceful error responses without system exposure

## Performance Features

### 1. Caching & Optimization
- **Embedding Cache**: Persistent vector storage
- **BM25 Index**: Fast keyword search
- **Batch Processing**: Efficient document processing

### 2. Scalability Options
- **Async Processing**: Non-blocking operations
- **Configurable Workers**: Multiple uvicorn workers
- **Memory Management**: Configurable chunk sizes

### 3. Monitoring & Logging
- **Request Logging**: Track API usage and performance
- **Error Tracking**: Detailed error logging and handling  
- **Health Monitoring**: System component status tracking

## Testing & Development

### Test Files
- `test_api.py`: API endpoint testing
- `test_full_integration.py`: End-to-end system testing
- `test_rag_direct.py`: Direct RAG system testing
- `test_basic.py`: Basic functionality tests

### Development Tools
- `demo.py`: Interactive system demonstration
- `integration_example.py`: Usage examples
- `simple_server.py`: Lightweight development server

## Deployment & Production

### Requirements
- Python 3.11+
- OpenAI API key (for embeddings)
- Sufficient memory for document embeddings
- Document source files

### Production Considerations
- **Environment Variables**: Secure configuration management
- **Logging Levels**: Appropriate production logging
- **Resource Allocation**: Memory and CPU requirements
- **Document Updates**: Process for updating source documents

### Docker Support
The system is designed for containerized deployment with configurable environment variables for production use.

## Future Extensibility

### Planned Features
- **Database Integration**: PostgreSQL/Redis for persistence
- **User Authentication**: Multi-user support with user-specific preferences
- **Advanced Analytics**: Usage analytics and recommendation tracking
- **API Versioning**: Support for multiple API versions

### Extension Points
- **Custom Processors**: Additional document format support
- **Model Flexibility**: Support for different LLM backends
- **Storage Backends**: Multiple feedback storage options
- **Integration APIs**: Third-party system integration

## Summary

The Note Ninjas Backend is a sophisticated RAG system specifically designed for occupational therapy professionals. It combines advanced AI techniques with medical domain expertise to provide safe, evidence-based recommendations. The system prioritizes accuracy, safety, and professional utility while maintaining full transparency through comprehensive source citations.

The modular architecture allows for easy extension and customization while the feedback system enables continuous improvement based on professional input. The system is production-ready with appropriate security measures and performance optimizations for clinical environments.