import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, EmailStr

class WorkspaceInvite(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    role: str = Field("Developer", max_length=50)

class WorkspaceMemberUpdate(BaseModel):
    role: str = Field(..., max_length=50)

class ProjectMemberAdd(BaseModel):
    user_id: uuid.UUID

class MemberUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True

class WorkspaceMemberResponse(BaseModel):
    id: uuid.UUID
    role: str
    user: MemberUserResponse
    created_at: datetime

    class Config:
        from_attributes = True
