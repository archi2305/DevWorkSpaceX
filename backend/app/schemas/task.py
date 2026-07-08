import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TaskBase(BaseModel):
    """
    Base shared properties for tasks.
    """
    title: str = Field(..., min_length=1, max_length=255)
    due_date: Optional[str] = Field(None, max_length=50)
    priority: str = Field("medium", max_length=50) # 'low', 'medium', 'high'
    completed: bool = False
    project_id: Optional[uuid.UUID] = None

class TaskCreate(BaseModel):
    """
    Data structure for task creation.
    """
    title: str = Field(..., min_length=1, max_length=255)
    due_date: Optional[str] = Field(None, max_length=50)
    priority: str = Field("medium", max_length=50)
    assignee_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None

class TaskUpdate(BaseModel):
    """
    Data structure for task updates (such as checking it off).
    """
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    due_date: Optional[str] = Field(None, max_length=50)
    priority: Optional[str] = Field(None, max_length=50)
    completed: Optional[bool] = None
    assignee_id: Optional[uuid.UUID] = None

class TaskResponse(TaskBase):
    """
    Database representation schema returned to clients.
    """
    id: uuid.UUID
    assignee_id: Optional[uuid.UUID]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
