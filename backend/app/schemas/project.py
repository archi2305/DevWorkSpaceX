import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

class ProjectBase(BaseModel):
    """
    Base shared properties for projects.
    """
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1024)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    status: str = Field("Pending", max_length=50)
    progress: int = Field(0, ge=0, le=100)

class ProjectCreate(BaseModel):
    """
    Data structure for project creation.
    """
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1024)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field("Pending", max_length=50)

class ProjectUpdate(BaseModel):
    """
    Data structure for project editing. All fields are optional.
    """
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1024)
    icon: Optional[str] = Field(None, max_length=50)
    color: Optional[str] = Field(None, max_length=50)
    status: Optional[str] = Field(None, max_length=50)
    progress: Optional[int] = Field(None, ge=0, le=100)

class ProjectMember(BaseModel):
    """
    Simple schema for user memberships in project teams.
    """
    id: uuid.UUID
    full_name: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True

class ProjectResponse(ProjectBase):
    """
    Database representation schema returned to clients.
    """
    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    members: List[ProjectMember] = []

    class Config:
        from_attributes = True
