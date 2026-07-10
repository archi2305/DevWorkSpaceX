import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class SprintCreate(BaseModel):
    project_id: uuid.UUID
    name: str
    goal: Optional[str] = None
    duration_weeks: Optional[int] = 2

class SprintUpdate(BaseModel):
    name: Optional[str] = None
    goal: Optional[str] = None
    duration_weeks: Optional[int] = None
    status: Optional[str] = None # 'Planned', 'Active', 'Completed'
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class SprintResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    goal: Optional[str] = None
    duration_weeks: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class SprintStatsResponse(BaseModel):
    sprint_id: uuid.UUID
    name: str
    status: str
    total_tasks: int
    completed_tasks: int
    remaining_tasks: int
    completion_percentage: float
    burndown: List[dict] # List of {"day": str, "remaining": int}
