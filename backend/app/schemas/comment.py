import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
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
    content_markdown: Optional[str] = None
    mentions: Optional[List[str]] = None
    attachments: Optional[List[Dict[str, Any]]] = None

class CommentReplyResponse(BaseModel):
    id: uuid.UUID
    comment_id: uuid.UUID
    user_id: uuid.UUID
    content: str
    content_markdown: Optional[str] = None
    mentions: Optional[List[str]] = None
    reactions: Optional[Dict[str, List[str]]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime
    user: UserMiniResponse

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str
    content_markdown: Optional[str] = None
    task_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    mentions: Optional[List[str]] = None
    attachments: Optional[List[Dict[str, Any]]] = None

class CommentUpdate(BaseModel):
    content: str
    content_markdown: Optional[str] = None
    mentions: Optional[List[str]] = None
    attachments: Optional[List[Dict[str, Any]]] = None

class CommentResponse(BaseModel):
    id: uuid.UUID
    content: str
    content_markdown: Optional[str] = None
    task_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    user_id: uuid.UUID
    mentions: Optional[List[str]] = None
    reactions: Optional[Dict[str, List[str]]] = None
    attachments: Optional[List[Dict[str, Any]]] = None
    created_at: datetime
    updated_at: datetime
    user: UserMiniResponse
    replies: List[CommentReplyResponse] = []

    class Config:
        from_attributes = True

class ReactionCreate(BaseModel):
    emoji: str

class ReactionResponse(BaseModel):
    emoji: str
    user_ids: List[str]
    count: int
