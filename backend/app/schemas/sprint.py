import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.task import TaskResponse

class SprintCreate(BaseModel):
    project_id: uuid.UUID
    name: str = Field(..., min_length=1, max_length=255)
    goal: Optional[str] = Field(None, max_length=1000)
    description: Optional[str] = Field(None, max_length=2000)
    duration_weeks: Optional[int] = 2
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SprintUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    goal: Optional[str] = Field(None, max_length=1000)
    description: Optional[str] = Field(None, max_length=2000)
    duration_weeks: Optional[int] = None
    status: Optional[str] = None # 'Planned', 'Active', 'Completed'
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    is_archived: Optional[bool] = None

class SprintTaskMove(BaseModel):
    task_ids: List[uuid.UUID]

class SprintTaskMoveBetween(BaseModel):
    task_ids: List[uuid.UUID]
    target_sprint_id: Optional[uuid.UUID] = None

class SprintResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    goal: Optional[str] = None
    description: Optional[str] = None
    duration_weeks: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str
    is_archived: bool
    archived_at: Optional[datetime] = None
    total_story_points: int
    completed_story_points: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SprintStatsResponse(BaseModel):
    sprint_id: uuid.UUID
    name: str
    goal: Optional[str] = None
    description: Optional[str] = None
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    total_tasks: int
    completed_tasks: int
    remaining_tasks: int
    total_story_points: int
    completed_story_points: int
    remaining_story_points: int
    velocity: int
    completion_percentage: float
    burndown: List[dict] # List of {"day": str, "remaining": int}
    tasks: List[TaskResponse] = []
