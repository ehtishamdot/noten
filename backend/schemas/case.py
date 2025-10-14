from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import Any, Dict

class CaseBase(BaseModel):
    name: str
    input_json: Dict[str, Any]
    output_json: Dict[str, Any]

class CaseCreate(BaseModel):
    input_json: Dict[str, Any]
    output_json: Dict[str, Any]

class CaseUpdate(BaseModel):
    name: str

class CaseResponse(CaseBase):
    id: UUID
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class CaseListResponse(BaseModel):
    id: UUID
    user_id: UUID
    name: str
    created_at: datetime
    
    class Config:
        from_attributes = True
