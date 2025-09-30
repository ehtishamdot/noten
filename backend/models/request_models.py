"""
Request models for Note Ninjas API
"""

from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from enum import Enum
class FeedbackType(str, Enum):
    THUMBS_UP = "thumbs_up"
    THUMBS_DOWN = "thumbs_down"
    CORRECTION = "correction"
    PREFERENCE = "preference"
    BLOCK = "block"
class UserInput(BaseModel):
    patient_condition: str = Field(..., description="Patient condition and details")
    desired_outcome: str = Field(..., description="Desired treatment outcome")
    treatment_progression: Optional[str] = Field(None, description="Current treatment progression")
    input_mode: str = Field("simple", description="Input mode: simple or detailed")
    

    age: Optional[str] = Field(None, description="Patient age")
    gender: Optional[str] = Field(None, description="Patient gender")
    diagnosis: Optional[str] = Field(None, description="Primary diagnosis")
    comorbidities: Optional[str] = Field(None, description="Comorbidities")
    severity: Optional[str] = Field(None, description="Severity level")
    date_of_onset: Optional[str] = Field(None, description="Date of onset")
    prior_level_of_function: Optional[str] = Field(None, description="Prior level of function")
    work_life_requirements: Optional[str] = Field(None, description="Work/life requirements")
class RAGManifest(BaseModel):

    sources: List[str] = Field(default_factory=lambda: ["note_ninjas", "cpg"], description="Source types to use")
    max_sources: int = Field(5, description="Maximum number of sources to retrieve")
    min_confidence: float = Field(0.7, description="Minimum confidence threshold")
    source_boosts: Optional[Dict[str, float]] = Field(
        default_factory=lambda: {
            "note_ninjas": 1.0,
            "cpg": 0.8,
            "textbook": 0.6
        },
        description="Source type priority boosts"
    )
    header_boosts: Optional[Dict[str, float]] = Field(
        default_factory=lambda: {
            "cpt": 1.2,
            "documentation": 1.1,
            "exercise": 1.0,
            "safety": 1.3
        },
        description="Header/section priority boosts"
    )
    topic_boosts: Optional[Dict[str, float]] = Field(
        default_factory=dict,
        description="Topic-specific boosts"
    )
    filters: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Additional filters for retrieval"
    )
class RecommendationRequest(BaseModel):
    user_input: UserInput = Field(..., description="User input data")
    session_id: str = Field(..., description="Session identifier")
    rag_manifest: Optional[RAGManifest] = Field(None, description="RAG configuration")
    feedback_state: Optional[Dict[str, Any]] = Field(None, description="Current feedback state")
    max_exercises: Optional[int] = Field(8, description="Maximum number of exercises")
class FeedbackRequest(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    recommendation_id: Optional[str] = Field(None, description="Specific recommendation ID")
    feedback_type: FeedbackType = Field(..., description="Type of feedback")
    feedback_data: Dict[str, Any] = Field(..., description="Feedback data")
    comment: Optional[str] = Field(None, description="Additional comments")
