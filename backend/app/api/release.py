import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.release import Release
from app.models.task import Task
from app.models.activity import ActivityLog
from app.schemas.release import (
    ReleaseCreate,
    ReleaseUpdate,
    ReleaseResponse,
    ReleaseStatsResponse
)

router = APIRouter(prefix="/releases", tags=["Release Management"])

@router.post(
    "",
    response_model=ReleaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new release version"
)
def create_release(
    request: ReleaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    release = Release(
        project_id=request.project_id,
        version=request.version,
        title=request.title,
        release_notes=request.release_notes,
        status=request.status or "Draft",
        released_at=request.released_at
    )
    db.add(release)
    
    # Log Activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Release Created",
        details=f"Created release version '{release.version}' ({release.title})",
        target_type="Release",
        target_name=release.version
    )
    db.add(db_log)
    db.commit()
    db.refresh(release)
    return release

@router.get(
    "",
    response_model=List[ReleaseResponse],
    summary="List all releases in a project"
)
def list_releases(
    project_id: uuid.UUID,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Release).filter(Release.project_id == project_id)
    if status:
        query = query.filter(Release.status == status)
    return query.order_by(Release.created_at.desc()).all()

@router.get(
    "/{id}",
    response_model=ReleaseResponse,
    summary="Get release details"
)
def get_release(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    release = db.query(Release).filter(Release.id == id).first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release version not found."
        )
    return release

@router.patch(
    "/{id}",
    response_model=ReleaseResponse,
    summary="Update release details or notes"
)
def update_release(
    id: uuid.UUID,
    request: ReleaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    release = db.query(Release).filter(Release.id == id).first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release version not found."
        )

    update_data = request.model_dump(exclude_unset=True)
    
    # Auto-set released_at if status changes to Released
    if update_data.get("status") == "Released" and release.status != "Released":
        update_data["released_at"] = datetime.utcnow()
        
    for key, value in update_data.items():
        setattr(release, key, value)
        
    release.updated_at = datetime.utcnow()
    
    # Log Activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Release Updated",
        details=f"Updated release version '{release.version}'",
        target_type="Release",
        target_name=release.version
    )
    db.add(db_log)
    db.commit()
    db.refresh(release)
    return release

@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a release version"
)
def delete_release(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    release = db.query(Release).filter(Release.id == id).first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release version not found."
        )
        
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Release Deleted",
        details=f"Deleted release version '{release.version}'",
        target_type="Release",
        target_name=release.version
    )
    db.add(db_log)
    db.delete(release)
    db.commit()
    return None

@router.post(
    "/{id}/tasks",
    summary="Assign tasks to a release version"
)
def assign_tasks_to_release(
    id: uuid.UUID,
    task_ids: List[uuid.UUID],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    release = db.query(Release).filter(Release.id == id).first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release version not found."
        )

    # Associate tasks with this release version
    db.query(Task).filter(Task.id.in_(task_ids)).update(
        {Task.release_id: id},
        synchronize_session=False
    )
    db.commit()
    return {"message": f"Successfully assigned {len(task_ids)} tasks to release version '{release.version}'."}

@router.get(
    "/{id}/stats",
    response_model=ReleaseStatsResponse,
    summary="Get release progress metrics"
)
def get_release_stats(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    release = db.query(Release).filter(Release.id == id).first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release version not found."
        )

    total_tasks = db.query(func.count(Task.id)).filter(Task.release_id == id).scalar() or 0
    completed_tasks = db.query(func.count(Task.id)).filter(Task.release_id == id, Task.completed == True).scalar() or 0
    
    completion_percentage = 0.0
    if total_tasks > 0:
        completion_percentage = round((completed_tasks / total_tasks) * 100, 2)

    return {
        "release_id": release.id,
        "version": release.version,
        "title": release.title,
        "status": release.status,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_percentage": completion_percentage,
        "released_at": release.released_at
    }
