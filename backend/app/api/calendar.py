import uuid
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.project import Project
from app.schemas.calendar import CalendarEventResponse

router = APIRouter(prefix="/calendar", tags=["Calendar"])

@router.get(
    "/events",
    response_model=List[CalendarEventResponse],
    summary="Get all calendar events"
)
def get_calendar_events(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves all tasks and projects with due dates within the workspace.
    """
    events = []
    
    # 1. Fetch Projects with due dates
    projects_query = db.query(Project).filter(Project.due_date != None)
    if start_date:
        projects_query = projects_query.filter(Project.due_date >= datetime.fromisoformat(start_date))
    if end_date:
        projects_query = projects_query.filter(Project.due_date <= datetime.fromisoformat(end_date))
        
    projects = projects_query.all()
    for p in projects:
        events.append(
            CalendarEventResponse(
                id=p.id,
                type="project",
                title=p.name,
                due_date=p.due_date,
                progress=p.progress,
                completed=p.progress == 100
            )
        )
        
    # 2. Fetch Tasks with due dates
    tasks_query = db.query(Task).filter(Task.due_date != None)
    if start_date:
        tasks_query = tasks_query.filter(Task.due_date >= datetime.fromisoformat(start_date))
    if end_date:
        tasks_query = tasks_query.filter(Task.due_date <= datetime.fromisoformat(end_date))
        
    tasks = tasks_query.all()
    for t in tasks:
        events.append(
            CalendarEventResponse(
                id=t.id,
                type="task",
                title=t.title,
                due_date=t.due_date,
                status=t.status,
                priority=t.priority,
                project_name=t.project.name if t.project else None,
                completed=t.completed
            )
        )
        
    # Sort events by due date ascending, safe against timezone offset comparisons
    events.sort(key=lambda x: x.due_date.replace(tzinfo=None) if x.due_date.tzinfo else x.due_date)
    return events
