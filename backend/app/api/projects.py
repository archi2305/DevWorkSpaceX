import uuid
import re
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

def generate_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug)
    return slug.strip('-')

@router.get(
    "",
    response_model=List[ProjectResponse],
    summary="Get user projects",
    description="Loads all projects for the user with support for search, status, priority, visibility, favorites, pinned, archiving status filters, and sorting parameters."
)
def get_projects(
    search: Optional[str] = None,
    is_archived: Optional[bool] = False,
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    visibility: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    is_pinned: Optional[bool] = None,
    owner_id: Optional[uuid.UUID] = None,
    sort_by: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Project).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))
    )
    
    # Filter constraints
    if is_archived is not None:
        query = query.filter(Project.is_archived == is_archived)
        
    if search:
        query = query.filter(
            Project.name.ilike(f"%{search}%") | 
            Project.description.ilike(f"%{search}%")
        )
        
    if status_filter:
        query = query.filter(Project.status == status_filter)
        
    if priority:
        query = query.filter(Project.priority == priority)
        
    if visibility:
        query = query.filter(Project.visibility == visibility)
        
    if is_favorite is not None:
        query = query.filter(Project.is_favorite == is_favorite)
        
    if is_pinned is not None:
        query = query.filter(Project.is_pinned == is_pinned)
        
    if owner_id:
        query = query.filter(Project.owner_id == owner_id)
        
    # Sort criteria
    if sort_by == "newest":
        query = query.order_by(Project.created_at.desc())
    elif sort_by == "oldest":
        query = query.order_by(Project.created_at.asc())
    elif sort_by == "recently_updated" or sort_by == "recent":
        query = query.order_by(Project.updated_at.desc())
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
    "/search",
    response_model=List[ProjectResponse],
    summary="Search projects",
    description="Real-time search endpoint returning projects based on name, description, or status."
)
def search_projects(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Project).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))
    )
    if q:
        query = query.filter(
            Project.name.ilike(f"%{q}%") |
            Project.description.ilike(f"%{q}%") |
            Project.status.ilike(f"%{q}%")
        )
    return query.all()

@router.get(
    "/filter",
    response_model=List[ProjectResponse],
    summary="Filter projects list",
    description="Alias path matching filtered listings."
)
def filter_projects(
    status_filter: Optional[str] = None,
    priority: Optional[str] = None,
    visibility: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_projects(
        status_filter=status_filter,
        priority=priority,
        visibility=visibility,
        db=db,
        current_user=current_user
    )

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
    projects = db.query(Project).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))
    ).filter(
        Project.is_archived == False
    ).order_by(Project.updated_at.desc()).limit(5).all()
    
    return projects

@router.get(
    "/statistics",
    summary="Get project module statistics",
    description="Calculates project counters, average completion velocity, pinned ratios, and active workspace rates."
)
def get_projects_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))
    ).all()
    
    total = len(projects)
    active = len([p for p in projects if p.status == "In Progress" and not p.is_archived])
    archived = len([p for p in projects if p.is_archived])
    pinned = len([p for p in projects if p.is_pinned])
    favorites = len([p for p in projects if p.is_favorite])
    
    avg_progress = 0
    if total > 0:
        avg_progress = int(sum(p.progress for p in projects) / total)
        
    return {
        "total_projects": total,
        "active_projects": active,
        "archived_projects": archived,
        "pinned_projects": pinned,
        "favorite_projects": favorites,
        "average_progress": avg_progress
    }

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
    existing = db.query(Project).filter(
        (Project.owner_id == current_user.id) &
        (Project.name == project_data.name)
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A project with this name already exists in your workspace."
        )
        
    slug = project_data.slug or generate_slug(project_data.name)
    
    db_project = Project(
        name=project_data.name,
        slug=slug,
        description=project_data.description,
        icon=project_data.icon,
        cover_image=project_data.cover_image,
        color=project_data.color,
        status=project_data.status or "Pending",
        priority=project_data.priority or "Medium",
        progress=0,
        owner_id=current_user.id,
        visibility=project_data.visibility or "Workspace",
        workspace_id=project_data.workspace_id,
        due_date=project_data.due_date
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
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
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
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can modify project details"
        )
        
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
    summary="Archive project",
    description="Sets a project's archived state to True. Only the project owner can archive a project."
)
def archive_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can archive this project"
        )
        
    project.is_archived = True
    
    # Log archiving activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Project Archived",
        details=f"Project '{project.name}' was archived",
        target_type="Project",
        target_name=project.name
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(project)
    return project

@router.patch(
    "/restore/{project_id}",
    response_model=ProjectResponse,
    summary="Restore archived project",
    description="Restores an archived project back to active state."
)
def restore_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    if project.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the project owner can restore this project"
        )
        
    project.is_archived = False
    
    # Log restore activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Project Restored",
        details=f"Project '{project.name}' was restored",
        target_type="Project",
        target_name=project.name
    )
    db.add(db_log)
    
    db.commit()
    db.refresh(project)
    return project

@router.patch(
    "/favorite/{project_id}",
    response_model=ProjectResponse,
    summary="Toggle project favorite state",
    description="Toggles the user's favorite setting flag."
)
def toggle_project_favorite(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    project.is_favorite = not project.is_favorite
    db.commit()
    db.refresh(project)
    return project

@router.patch(
    "/pin/{project_id}",
    response_model=ProjectResponse,
    summary="Toggle project pinned state",
    description="Toggles whether a project is pinned to the dashboard."
)
def toggle_project_pin(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    project.is_pinned = not project.is_pinned
    db.commit()
    db.refresh(project)
    return project

@router.patch(
    "/progress/{project_id}",
    response_model=ProjectResponse,
    summary="Directly update project progress",
    description="Updates progress percentage value."
)
def update_project_progress(
    project_id: uuid.UUID,
    progress: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if progress < 0 or progress > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Progress must be between 0 and 100"
        )
        
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
        
    project.progress = progress
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
