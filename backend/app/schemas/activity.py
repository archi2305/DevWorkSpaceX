import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel

class UserMiniResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True

class ActivityResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    category: Optional[str] = None
    event_type: Optional[str] = None
    action: str
    details: str
    target_type: Optional[str] = None
    target_name: Optional[str] = None
    target_id: Optional[uuid.UUID] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    meta_data: Optional[dict[str, Any]] = None
    created_at: datetime
    user: UserMiniResponse

    class Config:
        from_attributes = True

class AuditLogFilter(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    user_id: Optional[uuid.UUID] = None
    category: Optional[str] = None
    event_type: Optional[str] = None
    target_type: Optional[str] = None
    action: Optional[str] = None
