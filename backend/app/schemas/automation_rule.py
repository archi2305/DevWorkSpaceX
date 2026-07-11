import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class AutomationRuleBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    trigger_event: str = Field(..., max_length=100) # 'task_completed', 'due_date_passed', 'sprint_completed'
    action_type: str = Field(..., max_length=100)   # 'move_to_done', 'notify_owner', 'archive_sprint'
    action_target: Optional[str] = Field(None, max_length=255)
    is_active: bool = True

class AutomationRuleCreate(AutomationRuleBase):
    project_id: uuid.UUID

class AutomationRuleUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    trigger_event: Optional[str] = Field(None, max_length=100)
    action_type: Optional[str] = Field(None, max_length=100)
    action_target: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None

class AutomationRuleResponse(AutomationRuleBase):
    id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
