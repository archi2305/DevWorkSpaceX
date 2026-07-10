import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class UserMiniResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True

class CommentReplyCreate(BaseModel):
    content: str

class CommentReplyResponse(BaseModel):
    id: uuid.UUID
    comment_id: uuid.UUID
    user_id: uuid.UUID
    content: str
    created_at: datetime
    user: UserMiniResponse

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str
    task_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None

class CommentUpdate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: uuid.UUID
    content: str
    task_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    user_id: uuid.UUID
    created_at: datetime
    user: UserMiniResponse
    replies: List[CommentReplyResponse] = []

    class Config:
        from_attributes = True
