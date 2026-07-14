import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.task import TaskResponse

class MilestoneBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    due_date: Optional[datetime] = None
    status: str = Field("Planned", max_length=50) # 'Planned', 'Active', 'Completed'
    is_archived: bool = False

class MilestoneCreate(MilestoneBase):
    project_id: uuid.UUID

class MilestoneUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    due_date: Optional[datetime] = None
    status: Optional[str] = Field(None, max_length=50)
    is_archived: Optional[bool] = None

class MilestoneTaskAssignment(BaseModel):
    task_ids: List[uuid.UUID]

class MilestoneResponse(MilestoneBase):
    id: uuid.UUID
    project_id: uuid.UUID
    progress_percentage: float = 0
    total_tasks: int = 0
    completed_tasks: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MilestoneStatsResponse(BaseModel):
    milestone_id: uuid.UUID
    title: str
    description: Optional[str] = None
    status: str
    total_tasks: int
    completed_tasks: int
    remaining_tasks: int
    completion_percentage: float
    due_date: Optional[datetime] = None
    is_archived: bool
    timeline: List[dict]
    tasks: List[TaskResponse] = []
