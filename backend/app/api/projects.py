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
from app.api.notification import dispatch_notification
from app.dependencies.rbac import PermissionChecker

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
    current_user: User = Depends(get_current_user),
    has_perm: bool = Depends(PermissionChecker("create_project"))
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
    
    default_columns = [
        {"id": "Todo", "title": "To Do", "taskIds": []},
        {"id": "In Progress", "title": "In Progress", "taskIds": []},
        {"id": "Review", "title": "Review", "taskIds": []},
        {"id": "Done", "title": "Done", "taskIds": []}
    ]
    kanban_cols = project_data.kanban_columns or default_columns

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
        due_date=project_data.due_date,
        kanban_columns=kanban_cols
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
    
    # Dispatch notification
    dispatch_notification(
        db=db,
        user_id=current_user.id,
        title="Project Created",
        message=f"Project '{db_project.name}' was created.",
        notification_type="Info"
    )
    
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
    current_user: User = Depends(get_current_user),
    has_perm: bool = Depends(PermissionChecker("edit_project"))
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
    current_user: User = Depends(get_current_user),
    has_perm: bool = Depends(PermissionChecker("delete_project"))
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

@router.get(
    "/templates/list",
    summary="Get all project templates"
)
def list_project_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Project).filter(Project.is_template == True).all()

@router.patch(
    "/{project_id}/template",
    summary="Save project as a template"
)
def save_project_as_template(
    project_id: uuid.UUID,
    is_template: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    project.is_template = is_template
    db.commit()
    return {"message": f"Project template status set to {is_template}.", "is_template": project.is_template}

@router.post(
    "/{project_id}/duplicate",
    summary="Duplicate an existing project",
    description="Clones project details, milestones, releases, sprints, and tasks recursively."
)
def duplicate_project(
    project_id: uuid.UUID,
    new_name: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source_project = db.query(Project).filter(Project.id == project_id).first()
    if not source_project:
        raise HTTPException(status_code=404, detail="Project not found")

    dup_project = Project(
        name=new_name or f"{source_project.name} Copy",
        slug=f"{source_project.slug}-copy-{uuid.uuid4().hex[:4]}",
        description=source_project.description,
        icon=source_project.icon,
        cover_image=source_project.cover_image,
        color=source_project.color,
        status="Pending",
        priority=source_project.priority,
        owner_id=current_user.id,
        is_template=False
    )
    db.add(dup_project)
    db.flush()

    # 1. Duplicate Sprints
    from app.models.sprint import Sprint
    sprints = db.query(Sprint).filter(Sprint.project_id == project_id).all()
    sprint_map = {}
    for spr in sprints:
        dup_spr = Sprint(
            project_id=dup_project.id,
            name=spr.name,
            goal=spr.goal,
            duration=spr.duration,
            status="Planned"
        )
        db.add(dup_spr)
        db.flush()
        sprint_map[spr.id] = dup_spr.id

    # 2. Duplicate Milestones
    from app.models.milestone import Milestone
    milestones = db.query(Milestone).filter(Milestone.project_id == project_id).all()
    milestone_map = {}
    for ms in milestones:
        dup_ms = Milestone(
            project_id=dup_project.id,
            title=ms.title,
            description=ms.description,
            due_date=ms.due_date,
            status="Planned"
        )
        db.add(dup_ms)
        db.flush()
        milestone_map[ms.id] = dup_ms.id

    # 3. Duplicate Releases
    from app.models.release import Release
    releases = db.query(Release).filter(Release.project_id == project_id).all()
    release_map = {}
    for rel in releases:
        dup_rel = Release(
            project_id=dup_project.id,
            version=rel.version,
            title=rel.title,
            release_notes=rel.release_notes,
            status="Draft"
        )
        db.add(dup_rel)
        db.flush()
        release_map[rel.id] = dup_rel.id

    # 4. Duplicate Tasks
    from app.models.task import Task
    tasks = db.query(Task).filter(Task.project_id == project_id).all()
    task_map = {}
    for task in tasks:
        dup_task = Task(
            project_id=dup_project.id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            due_date=task.due_date,
            assignee_id=task.assignee_id,
            story_points=task.story_points,
            estimated_time=task.estimated_time,
            attachments=task.attachments,
            completed=task.completed,
            sprint_id=sprint_map.get(task.sprint_id),
            milestone_id=milestone_map.get(task.milestone_id),
            release_id=release_map.get(task.release_id)
        )
        db.add(dup_task)
        db.flush()
        task_map[task.id] = dup_task.id

    # Second pass for parent links
    for task in tasks:
        if task.parent_id and task.parent_id in task_map:
            dup_task_id = task_map[task.id]
            db_task = db.query(Task).filter(Task.id == dup_task_id).first()
            if db_task:
                db_task.parent_id = task_map[task.parent_id]

    db_log = ActivityLog(
        user_id=current_user.id,
        action="Project Duplicated",
        details=f"Duplicated project '{source_project.name}' as '{dup_project.name}'",
        target_type="Project",
        target_name=dup_project.name
    )
    db.add(db_log)
    db.commit()
    db.refresh(dup_project)

    return {"message": "Project duplicated successfully.", "project": {"id": str(dup_project.id), "name": dup_project.name}}
