from pydantic import BaseModel
from typing import List
from app.schemas.project import ProjectResponse
from app.schemas.task import TaskResponse

class DashboardSummary(BaseModel):
    """
    Summary metrics payload returned for workspace status widgets.
    """
    active_projects: int
    completed_tasks: int
    pending_tasks: int
    notifications: int
    team_members: int

class SearchResults(BaseModel):
    """
    Live query search output schema grouping results by model.
    """
    projects: List[ProjectResponse]
    tasks: List[TaskResponse]
    documentation: List[str] = []
    users: List[str] = []
