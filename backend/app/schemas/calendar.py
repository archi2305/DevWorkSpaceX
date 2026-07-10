import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class CalendarEventResponse(BaseModel):
    id: uuid.UUID
    type: str  # "task" or "project"
    title: str
    due_date: datetime
    status: Optional[str] = None
    priority: Optional[str] = None
    project_name: Optional[str] = None
    progress: Optional[int] = None
    completed: Optional[bool] = None

    class Config:
        from_attributes = True
