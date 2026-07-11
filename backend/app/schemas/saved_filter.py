import uuid
from datetime import datetime
from pydantic import BaseModel

from typing import Optional

class SavedFilterCreate(BaseModel):
    name: str
    target_type: str # 'Project', 'Task'
    criteria: dict
    layout: Optional[str] = None
    is_favorite: Optional[bool] = False

class SavedFilterResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    target_type: str
    criteria: dict
    layout: Optional[str] = None
    is_favorite: bool
    last_used_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
