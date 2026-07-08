from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.schemas.dashboard import DashboardSummary

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get(
    "/summary",
    response_model=DashboardSummary,
    summary="Get dashboard summary metrics",
    description="Loads aggregate metrics (projects, tasks, members) to display on the dashboard."
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Queries database counts for active projects, tasks, and users.
    """
    # 1. Count projects user is part of (owned or member) that are not completed (progress < 100)
    active_projects = db.query(Project).filter(
        ((Project.owner_id == current_user.id) | (Project.members.any(id=current_user.id))) &
        (Project.progress < 100)
    ).count()

    # 2. Count completed tasks assigned to user
    completed_tasks = db.query(Task).filter(
        (Task.assignee_id == current_user.id) & (Task.completed == True)
    ).count()

    # 3. Count pending tasks assigned to user
    pending_tasks = db.query(Task).filter(
        (Task.assignee_id == current_user.id) & (Task.completed == False)
    ).count()

    # 4. Mock notifications count (can be populated in V2)
    notifications = 3

    # 5. Count total users in system to represent workspace size
    team_members = db.query(User).count()

    return {
        "active_projects": active_projects,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "notifications": notifications,
        "team_members": team_members
    }
