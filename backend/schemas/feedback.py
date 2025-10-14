from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Optional, Any, Dict

class FeedbackCreate(BaseModel):
    case_id: Optional[UUID] = None
    feedback_type: str
    exercise_name: Optional[str] = None
    cue_type: Optional[str] = None
    cpt_code: Optional[str] = None
    example_number: Optional[int] = None
    rating: Optional[str] = None
    comments: Optional[str] = None
    context_json: Optional[Dict[str, Any]] = None

class FeedbackResponse(FeedbackCreate):
    id: UUID
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True
