import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.activity import ActivityLog
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get(
    "",
    response_model=List[ProjectResponse],
    summary="Get user projects",
    description="Loads all projects for the user with support for search, archiving status filters, and sorting parameters."
)
def get_projects(
    search: Optional[str] = None,
    is_archived: bool = False,
    status_filter: Optional[str] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List user projects with optional filters and sorting options.
    """
    query = db.query(Project).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))
    )
    
    # Filter by archive status
    query = query.filter(Project.is_archived == is_archived)
    
    if search:
        query = query.filter(Project.name.ilike(f"%{search}%"))
        
    if status_filter:
        query = query.filter(Project.status == status_filter)
        
    # Sort criteria
    if sort_by == "newest":
        query = query.order_by(Project.created_at.desc())
    elif sort_by == "oldest":
        query = query.order_by(Project.created_at.asc())
    elif sort_by == "most_progress":
        query = query.order_by(Project.progress.desc())
    elif sort_by == "least_progress":
        query = query.order_by(Project.progress.asc())
    elif sort_by == "alphabetical":
        query = query.order_by(Project.name.asc())
    else:
        query = query.order_by(Project.updated_at.desc())
        
    return query.all()

@router.get(
    "/recent",
    response_model=List[ProjectResponse],
    summary="Get recent projects",
    description="Loads the 5 most recently updated unarchived projects for the user."
)
def get_recent_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List user's recently modified projects sorted by updated_at (unarchived only).
    """
    projects = db.query(Project).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))
    ).filter(
        Project.is_archived == False
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
        owner_id=current_user.id,
        visibility=project_data.visibility or "Workspace",
        workspace_id=project_data.workspace_id
    )
    db_project.members.append(current_user)
    
    db.add(db_project)
    
    # Log project creation activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Project Created",
        details=f"Project '{db_project.name}' was created",
        target_type="Project",
        target_name=db_project.name
    )
    db.add(db_log)
    
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
        
    # Log project update activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Project Updated",
        details=f"Project '{project.name}' details were updated",
        target_type="Project",
        target_name=project.name
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(project)
    return project

@router.patch(
    "/archive/{project_id}",
    response_model=ProjectResponse,
    summary="Toggle project archived state",
    description="Toggles the archive flag of a project. Only the project owner can change this."
)
def toggle_project_archive(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Toggles the is_archived state of a project.
    """
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can archive or unarchive this project"
        )
        
    project.is_archived = not project.is_archived
    
    # Log archiving activity
    log_action = "Project Archived" if project.is_archived else "Project Restored"
    db_log = ActivityLog(
        user_id=current_user.id,
        action=log_action,
        details=f"Project '{project.name}' was {log_action.lower()}",
        target_type="Project",
        target_name=project.name
    )
    db.add(db_log)
    
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
        
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can delete this project"
        )
        
    # Log project deletion activity before database record deletion
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Project Deleted",
        details=f"Project '{project.name}' was deleted",
        target_type="Project",
        target_name=project.name
    )
    db.add(db_log)
    
    db.delete(project)
    db.commit()
    return None
