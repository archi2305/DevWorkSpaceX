import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get(
    "",
    response_model=List[ProjectResponse],
    summary="Get user projects",
    description="Loads all projects that the logged-in user owns or is a member of, with optional search query parameter."
)
def get_projects(
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List user projects with optional case-insensitive search filter.
    """
    query = db.query(Project).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))
    )
    
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))
        
    return query.all()

@router.get(
    "/recent",
    response_model=List[ProjectResponse],
    summary="Get recent projects",
    description="Loads the 5 most recently updated projects for the user."
)
def get_recent_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List the user's recently modified projects sorted by updated_at.
    """
    projects = db.query(Project).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))
    ).order_by(Project.updated_at.desc()).limit(5).all()
    
    return projects

@router.post(
    "",
    response_model=ProjectResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new project",
    description="Creates a project, setting owner. Prevents duplicate project names for same user."
)
def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validates duplicate projects and registers project instance.
    """
    # Enforce uniqueness of project names per owner
    existing = db.query(Project).filter(
        (Project.owner_id == current_user.id) &
        (Project.name == project_data.name)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A project with this name already exists in your workspace."
        )
        
    db_project = Project(
        name=project_data.name,
        description=project_data.description,
        icon=project_data.icon,
        color=project_data.color,
        status=project_data.status or "Pending",
        progress=0,
        owner_id=current_user.id
    )
    db_project.members.append(current_user)
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.get(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Get project details by ID",
    description="Loads details for a specific project. Requires ownership or membership."
)
def get_project_by_id(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Loads project details and enforces authorization checks.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    # Check permissions
    is_owner = project.owner_id == current_user.id
    is_member = any(member.id == current_user.id for member in project.members)
    
    if not (is_owner or is_member):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to access this project"
        )
        
    return project

@router.put(
    "/{project_id}",
    response_model=ProjectResponse,
    summary="Update a project",
    description="Updates project fields. Only the owner can modify project details."
)
def update_project(
    project_id: uuid.UUID,
    project_update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Validates ownership and merges modified parameters into the project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    # Only the owner is permitted to update the project
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can modify project details"
        )
        
    # If project name changes, check for unique names under owner
    if project_update.name and project_update.name != project.name:
        existing = db.query(Project).filter(
            (Project.owner_id == current_user.id) &
            (Project.name == project_update.name)
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A project with this name already exists in your workspace."
            )
            
    # Apply modifications
    update_data = project_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
        
    db.commit()
    db.refresh(project)
    return project

@router.delete(
    "/{project_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a project",
    description="Hard deletes a project. Only the owner can delete the project."
)
def delete_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Enforces owner authorization and deletes the project from database.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    # Only the owner is permitted to delete the project
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can delete this project"
        )
        
    db.delete(project)
    db.commit()
    return None
