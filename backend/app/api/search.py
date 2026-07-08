from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.schemas.dashboard import SearchResults

router = APIRouter(prefix="/search", tags=["Search"])

@router.get(
    "",
    response_model=SearchResults,
    summary="Global search",
    description="Searches projects, tasks, documentation, and users matching a query string."
)
def search_workspace(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Search database tables for matches containing the parameter string.
    """
    # 1. Search projects where user has access (owned or member) and name contains q
    projects = db.query(Project).filter(
        ((Project.owner_id == current_user.id) | (Project.members.any(id=current_user.id))) &
        (Project.name.ilike(f"%{q}%"))
    ).all()

    # 2. Search tasks assigned to user containing q
    tasks = db.query(Task).filter(
        (Task.assignee_id == current_user.id) &
        (Task.title.ilike(f"%{q}%"))
    ).all()

    # 3. Search dummy documentation library
    documentation = []
    mock_docs = ["API Documentation", "Sprint Guidelines", "Component Guide", "Authentication Module Layout"]
    for doc in mock_docs:
        if q.lower() in doc.lower():
            documentation.append(doc)

    # 4. Search registered user profiles
    matching_users = db.query(User).filter(
        User.full_name.ilike(f"%{q}%")
    ).all()
    users_list = [user.full_name for user in matching_users]

    return {
        "projects": projects,
        "tasks": tasks,
        "documentation": documentation,
        "users": users_list
    }
