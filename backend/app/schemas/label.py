import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class LabelCreate(BaseModel):
    project_id: Optional[uuid.UUID] = None
    name: str
    color: str

class LabelUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None

class LabelResponse(BaseModel):
    id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    name: str
    color: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
