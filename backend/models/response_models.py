"""
Response models for Note Ninjas API
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from enum import Enum


class SourceType(str, Enum):
    """Source types"""
    NOTE_NINJAS = "note_ninjas"
    CPG = "cpg"
    TEXTBOOK = "textbook"


class ConfidenceLevel(str, Enum):
    """Confidence levels"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class Source(BaseModel):
    """Source citation"""
    type: SourceType = Field(..., description="Source type")
    id: str = Field(..., description="Source identifier")
    section: Optional[str] = Field(None, description="Section or heading")
    page: Optional[str] = Field(None, description="Page reference")
    quote: str = Field(..., max_length=300, description="Quote from source (max 300 chars)")
    file_path: Optional[str] = Field(None, description="Full file path (e.g., NoteNinjas/Arthritis.docx)")


class Exercise(BaseModel):
    """Exercise recommendation"""
    title: Optional[str] = Field(None, description="Exercise title")
    description: str = Field(..., description="How to run the exercise")
    cues: List[str] = Field(default_factory=list, description="Cueing instructions")
    documentation: Optional[str] = Field(None, description="Documentation exemplar")
    cpt: Optional[str] = Field(None, description="CPT code")
    notes: Optional[str] = Field(None, description="Additional notes")
    sources: List[Source] = Field(default_factory=list, description="Source citations")


class Subsection(BaseModel):
    """Treatment subsection"""
    title: str = Field(..., description="Subsection title")
    rationale: Optional[str] = Field(None, description="Rationale for this subsection")
    exercises: List[Exercise] = Field(..., description="Exercises in this subsection")


class Alternative(BaseModel):
    """Alternative recommendation"""
    when: str = Field(..., description="When to use this alternative")
    instead_try: str = Field(..., description="What to try instead")
    sources: List[Source] = Field(..., description="Source citations")


class RecommendationResponse(BaseModel):
    """Response for recommendations"""
    high_level: List[str] = Field(..., description="High-level recommendations")
    subsections: List[Subsection] = Field(..., description="Treatment subsections")
    suggested_alternatives: List[Alternative] = Field(default_factory=list, description="Alternative recommendations")
    confidence: ConfidenceLevel = Field(..., description="Confidence level")
    
    class Config:
        json_schema_extra = {
            "example": {
                "high_level": [
                    "Prioritize task-specific sit↔stand practice with graded tactile/verbal cueing; integrate orthostatic monitoring."
                ],
                "subsections": [
                    {
                        "title": "Transfer Skill Acquisition",
                        "rationale": "Task-specific practice supports functional carryover; monitor vitals due to hypotension risk.",
                        "exercises": [
                            {
                                "title": "STS from elevated surface with tactile cue at trunk",
                                "description": "Set chair height to allow ~90° hip/knee. Block knees if needed. 3×5 reps with 60–90s rest, monitor BP pre/post.",
                                "cues": ["'Nose over toes'", "Tactile cue at sternum for forward shift"],
                                "documentation": "Instructed STS with graded tactile/verbal cues; patient performed 3×5 with min A, improved anterior weight shift; educated on hypotension strategies.",
                                "cpt": "97530",
                                "notes": "If symptomatic hypotension, pause and recline; recheck BP.",
                                "sources": [
                                    {
                                        "type": "note_ninjas",
                                        "id": "nn_doc_bank_cpt",
                                        "section": "functional training",
                                        "page": None,
                                        "quote": "Use functional tasks (STS) with skilled cueing; 97530 applies when..."
                                    }
                                ]
                            }
                        ]
                    }
                ],
                "suggested_alternatives": [
                    {
                        "when": "Orthostatic symptoms persist in upright",
                        "instead_try": "Seated anterior/posterior weight shifts with BP monitoring; progress to partial STS with hands-on assist.",
                        "sources": [
                            {
                                "type": "cpg",
                                "id": "AHA/ASA_Stroke_2024",
                                "page": "p. e345",
                                "quote": "Monitor for orthostatic hypotension..."
                            }
                        ]
                    }
                ],
                "confidence": "medium"
            }
        }


class FeedbackResponse(BaseModel):
    """Response for feedback submission"""
    success: bool = Field(..., description="Whether feedback was recorded successfully")
    message: str = Field(..., description="Response message")
    feedback_id: Optional[str] = Field(None, description="Feedback identifier")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    version: str = Field(..., description="Service version")
    rag_system_ready: bool = Field(..., description="Whether RAG system is ready")
    feedback_system_ready: bool = Field(..., description="Whether feedback system is ready")
