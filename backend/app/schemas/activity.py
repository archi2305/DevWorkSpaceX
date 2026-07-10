import uuid
from datetime import datetime
from typing import Optional
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
    action: str
    details: str
    target_type: Optional[str] = None
    target_name: Optional[str] = None
    created_at: datetime
    user: UserMiniResponse

    class Config:
        from_attributes = True
