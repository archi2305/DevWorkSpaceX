import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class DocumentBase(BaseModel):
    title: str = Field("Untitled Document", max_length=255)
    content: str = Field("")
    project_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None
    is_favorite: bool = False

class DocumentCreate(BaseModel):
    title: Optional[str] = "Untitled Document"
    content: Optional[str] = ""
    project_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    parent_id: Optional[uuid.UUID] = None
    is_favorite: Optional[bool] = None

class DocumentVersionResponse(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    version_number: int
    title: str
    content: str
    created_at: datetime
    author_id: uuid.UUID

    class Config:
        from_attributes = True

class DocumentResponse(DocumentBase):
    id: uuid.UUID
    version: int
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
