import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class FileAssetBase(BaseModel):
    name: str
    is_folder: bool = False
    project_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None

class FileAssetCreateFolder(BaseModel):
    name: str
    project_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None

class FileAssetUpdate(BaseModel):
    name: str

class FileAssetResponse(BaseModel):
    id: uuid.UUID
    name: str
    file_path: Optional[str] = None
    mime_type: Optional[str] = None
    size: Optional[int] = None
    is_folder: bool
    project_id: Optional[uuid.UUID] = None
    parent_id: Optional[uuid.UUID] = None
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
