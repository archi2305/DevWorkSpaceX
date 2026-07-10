import uuid
from datetime import datetime
from pydantic import BaseModel

class SavedFilterCreate(BaseModel):
    name: str
    target_type: str # 'Project', 'Task'
    criteria: dict

class SavedFilterResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    name: str
    target_type: str
    criteria: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
