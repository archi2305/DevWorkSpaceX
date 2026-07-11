import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class ReleaseBase(BaseModel):
    version: str = Field(..., min_length=1, max_length=50) # e.g. 'v1.0.0'
    title: str = Field(..., min_length=1, max_length=255)
    release_notes: Optional[str] = None # Markdown Description
    status: str = Field("Draft", max_length=50) # 'Draft', 'Unreleased', 'Released'
    released_at: Optional[datetime] = None

class ReleaseCreate(ReleaseBase):
    project_id: uuid.UUID

class ReleaseUpdate(BaseModel):
    version: Optional[str] = Field(None, min_length=1, max_length=50)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    release_notes: Optional[str] = None
    status: Optional[str] = Field(None, max_length=50)
    released_at: Optional[datetime] = None

class ReleaseResponse(ReleaseBase):
    id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReleaseStatsResponse(BaseModel):
    release_id: uuid.UUID
    version: str
    title: str
    status: str
    total_tasks: int
    completed_tasks: int
    completion_percentage: float
    released_at: Optional[datetime] = None
