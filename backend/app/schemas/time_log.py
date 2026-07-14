import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class TimeLogStartRequest(BaseModel):
    task_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    sprint_id: Optional[uuid.UUID] = None
    description: Optional[str] = None

class TimeLogManualRequest(BaseModel):
    task_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    sprint_id: Optional[uuid.UUID] = None
    start_time: datetime
    end_time: datetime
    description: Optional[str] = None

class TimeLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    task_id: Optional[uuid.UUID] = None
    project_id: Optional[uuid.UUID] = None
    sprint_id: Optional[uuid.UUID] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = 0
    description: Optional[str] = None
    is_running: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TimeTotalsResponse(BaseModel):
    total_task_seconds: int
    total_sprint_seconds: int
    total_project_seconds: int

class ProductivityReportItem(BaseModel):
    date: str
    logged_seconds: int

class ProductivityReportResponse(BaseModel):
    daily_totals: List[ProductivityReportItem]
    productivity_rating: str # 'Low', 'Moderate', 'High', 'Elite'
    total_logged_hours: float
