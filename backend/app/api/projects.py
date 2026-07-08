from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get(
    "",
    response_model=List[ProjectResponse],
    summary="Get user projects",
    description="Loads all projects that the logged-in user owns or is a member of."
)
def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Query all projects where the user is the owner or a member.
    """
    projects = db.query(Project).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))
    ).all()
    return projects

@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
    description="Creates a new project and automatically adds the creator as the first member."
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Insert a project and append the current user to the members array.
    """
    db_project = Project(
        name=project_data.name,
        description=project_data.description,
        status="In Progress",
        progress=0,
        owner_id=current_user.id
    )
    # The creator is automatically added to the project's member list
    db_project.members.append(current_user)
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project
