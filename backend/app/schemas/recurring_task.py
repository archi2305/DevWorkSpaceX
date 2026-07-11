import uuid
from datetime import datetime
from pydantic import BaseModel
from typing import List, Optional

class RecurringTaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[str] = "Todo"
    priority: Optional[str] = "Medium"
    project_id: Optional[uuid.UUID] = None
    assignee_id: Optional[uuid.UUID] = None
    recurrence_pattern: str # 'Daily', 'Weekly', 'Monthly', 'Custom'
    recurrence_interval: Optional[int] = 1
    custom_cron: Optional[str] = None
    next_run_at: datetime

class RecurringTaskResponse(BaseModel):
    id: uuid.UUID
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    project_id: Optional[uuid.UUID] = None
    assignee_id: Optional[uuid.UUID] = None
    recurrence_pattern: str
    recurrence_interval: int
    custom_cron: Optional[str] = None
    next_run_at: datetime
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class RecurringTaskHistoryResponse(BaseModel):
    id: uuid.UUID
    recurring_task_id: uuid.UUID
    generated_task_id: Optional[uuid.UUID] = None
    status: str
    run_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
