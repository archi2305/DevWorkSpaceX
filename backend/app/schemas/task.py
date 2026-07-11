import uuid
from datetime import datetime
from app.schemas.label import LabelResponse
from typing import Optional, List
from pydantic import BaseModel, Field

class TaskBase(BaseModel):
    """
    Base shared properties for tasks.
    """
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: str = Field("Todo", max_length=50) # 'Todo', 'In Progress', 'Review', 'Done'
    due_date: Optional[str] = Field(None, max_length=50)
    priority: str = Field("medium", max_length=50) # 'low', 'medium', 'high'
    completed: bool = False
    project_id: Optional[uuid.UUID] = None
    sprint_id: Optional[uuid.UUID] = None
    story_points: Optional[int] = None
    estimated_time: Optional[int] = None
    is_archived: bool = False
    attachments: Optional[List[dict]] = []

class TaskCreate(BaseModel):
    """
    Data structure for task creation.
    """
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: str = Field("Todo", max_length=50)
    due_date: Optional[str] = Field(None, max_length=50)
    priority: str = Field("medium", max_length=50)
    assignee_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    sprint_id: Optional[uuid.UUID] = None
    completed: bool = False
    story_points: Optional[int] = None
    estimated_time: Optional[int] = None
    is_archived: bool = False
    attachments: Optional[List[dict]] = []

class TaskUpdate(BaseModel):
    """
    Data structure for task updates.
    """
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    status: Optional[str] = Field(None, max_length=50)
    due_date: Optional[str] = Field(None, max_length=50)
    priority: Optional[str] = Field(None, max_length=50)
    completed: Optional[bool] = None
    assignee_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    sprint_id: Optional[uuid.UUID] = None
    story_points: Optional[int] = None
    estimated_time: Optional[int] = None
    is_archived: Optional[bool] = None
    attachments: Optional[List[dict]] = None

class TaskAssigneeResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True

class TaskResponse(TaskBase):
    """
    Database representation schema returned to clients.
    """
    id: uuid.UUID
    assignee_id: Optional[uuid.UUID]
    assignee: Optional[TaskAssigneeResponse] = None
    labels: List[LabelResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: uuid.UUID
    content: str
    task_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    user: TaskAssigneeResponse

    class Config:
        from_attributes = True
