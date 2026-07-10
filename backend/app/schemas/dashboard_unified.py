import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel
from app.schemas.project import ProjectResponse
from app.schemas.task import TaskResponse

class ActivityLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    action: str
    details: str
    target_type: Optional[str]
    target_name: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    message: str
    is_read: bool
    type: str
    created_at: datetime

    class Config:
        from_attributes = True

class SprintResponse(BaseModel):
    id: uuid.UUID
    name: str
    start_date: datetime
    end_date: datetime
    completed_tasks: int
    total_tasks: int
    velocity: int
    created_at: datetime

    class Config:
        from_attributes = True

class AISuggestionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    priority: str
    title: str
    description: str
    action: str
    icon: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserProfileMini(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    profile_image: Optional[str] = None

    class Config:
        from_attributes = True

class DashboardMetrics(BaseModel):
    active_projects: int
    completed_tasks: int
    pending_tasks: int
    registered_users: int
    workspace_completion: int
    completion_rate: int

class WorkspaceMemberResponse(BaseModel):
    initials: str
    name: str
    is_online: bool

class DashboardUnifiedResponse(BaseModel):
    """
    Combined aggregation response for the unified GET /dashboard query.
    """
    user: UserProfileMini
    metrics: DashboardMetrics
    recentProjects: List[ProjectResponse]
    recentTasks: List[TaskResponse]
    recentActivities: List[ActivityLogResponse]
    workspaceHealth: DashboardMetrics
    notifications: List[NotificationResponse]
    sprint: SprintResponse
    aiSuggestions: List[AISuggestionResponse]
    teamMembers: List[WorkspaceMemberResponse]
