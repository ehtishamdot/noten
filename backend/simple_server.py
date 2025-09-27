#!/usr/bin/env python3
"""
Simple FastAPI server for testing without full RAG initialization
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Note Ninjas API",
    description="RAG-powered OT/PT recommendation system",
    version="1.0.0"
)

# Add CORS middleware
from config import settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Response models
class HealthResponse(BaseModel):
    status: str
    version: str
    rag_system_ready: bool
    feedback_system_ready: bool

class RecommendationResponse(BaseModel):
    high_level: List[str]
    subsections: List[Dict[str, Any]]
    suggested_alternatives: List[Dict[str, Any]]
    confidence: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        rag_system_ready=True,  # Simplified for testing
        feedback_system_ready=True
    )

@app.get("/sources")
async def get_sources():
    """Get available sources"""
    return {
        "total_chunks": 0,
        "source_counts": {"note_ninjas": 0, "cpg": 0},
        "sources_by_type": {"note_ninjas": [], "cpg": []}
    }

@app.post("/recommendations", response_model=RecommendationResponse)
async def generate_recommendations(request: Dict[str, Any]):
    """Generate recommendations (simplified for testing)"""
    
    # Extract user input
    user_input = request.get("user_input", {})
    patient_condition = user_input.get("patient_condition", "")
    desired_outcome = user_input.get("desired_outcome", "")
    
    # Generate simple mock recommendations
    high_level = [
        f"Based on your patient's condition: {patient_condition[:50]}...",
        f"Focus on achieving: {desired_outcome[:50]}..."
    ]
    
    subsections = [
        {
            "title": "Range of Motion Exercises",
            "description": "Begin with gentle ROM exercises to improve mobility",
            "exercises": [
                {
                    "description": "Passive ROM exercises with therapist assistance",
                    "cues": ["Move slowly and gently", "Stop if pain increases"],
                    "documentation_exemplar": ["Patient tolerated passive ROM well", "No increase in pain noted"],
                    "cpt_code": "97110",
                    "sources": [{"type": "note_ninjas", "id": "sample", "section": "ROM", "page": 1, "quote": "Passive ROM exercises are fundamental"}]
                }
            ]
        }
    ]
    
    suggested_alternatives = [
        {
            "when": "If progress stalls after 2 weeks",
            "instead_try": "Consider manual therapy techniques or aquatic therapy",
            "sources": [{"type": "note_ninjas", "id": "alternative", "section": "Advanced", "page": 1, "quote": "Alternative approaches for stalled progress"}]
        }
    ]
    
    return RecommendationResponse(
        high_level=high_level,
        subsections=subsections,
        suggested_alternatives=suggested_alternatives,
        confidence="medium"
    )

@app.post("/feedback")
async def submit_feedback(request: Dict[str, Any]):
    """Submit feedback"""
    return {
        "success": True,
        "message": "Feedback received successfully",
        "feedback_id": "mock_feedback_123"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
