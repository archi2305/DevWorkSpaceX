import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel

class AIChatRequest(BaseModel):
    prompt: str
    conversation_id: Optional[uuid.UUID] = None

class AIChatResponse(BaseModel):
    conversation_id: uuid.UUID
    title: str
    reply: str

class AIConversationResponse(BaseModel):
    id: uuid.UUID
    title: str
    created_at: datetime

    class Config:
        from_attributes = True

class AIMessageResponse(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

class AIGeneratedTask(BaseModel):
    title: str
    description: str
    priority: str
    status: str

class PromptTemplateCreate(BaseModel):
    title: str
    content: str

class PromptTemplateResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    created_at: datetime

    class Config:
        from_attributes = True

