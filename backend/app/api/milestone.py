import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.milestone import Milestone
from app.models.task import Task
from app.models.activity import ActivityLog
from app.schemas.milestone import (
    MilestoneCreate,
    MilestoneUpdate,
    MilestoneResponse,
    MilestoneStatsResponse
)

router = APIRouter(prefix="/milestones", tags=["Milestones"])

@router.post(
    "",
    response_model=MilestoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new milestone"
)
def create_milestone(
    request: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    milestone = Milestone(
        project_id=request.project_id,
        title=request.title,
        description=request.description,
        due_date=request.due_date,
        status=request.status or "Planned",
        is_archived=request.is_archived or False
    )
    db.add(milestone)
    
    # Log Activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Milestone Created",
        details=f"Created milestone '{milestone.title}'",
        target_type="Milestone",
        target_name=milestone.title
    )
    db.add(db_log)
    db.commit()
    db.refresh(milestone)
    return milestone

@router.get(
    "",
    response_model=List[MilestoneResponse],
    summary="List all milestones in a project"
)
def list_milestones(
    project_id: uuid.UUID,
    is_archived: Optional[bool] = False,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Milestone).filter(Milestone.project_id == project_id)
    if is_archived is not None:
        query = query.filter(Milestone.is_archived == is_archived)
    if status:
        query = query.filter(Milestone.status == status)
    return query.order_by(Milestone.due_date.asc().nulls_last()).all()

@router.get(
    "/{id}",
    response_model=MilestoneResponse,
    summary="Get milestone details"
)
def get_milestone(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    milestone = db.query(Milestone).filter(Milestone.id == id).first()
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found."
        )
    return milestone

@router.patch(
    "/{id}",
    response_model=MilestoneResponse,
    summary="Update milestone details or archive status"
)
def update_milestone(
    id: uuid.UUID,
    request: MilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    milestone = db.query(Milestone).filter(Milestone.id == id).first()
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found."
        )

    update_data = request.model_dump(exclude_unset=True)
    
    # Check if we are changing archive status
    is_archiving = update_data.get("is_archived", False) and not milestone.is_archived
    
    for key, value in update_data.items():
        setattr(milestone, key, value)
        
    milestone.updated_at = datetime.utcnow()
    
    # Log Activity
    log_action = "Milestone Updated"
    log_details = f"Updated milestone '{milestone.title}' details"
    if is_archiving:
        log_action = "Milestone Archived"
        log_details = f"Archived milestone '{milestone.title}'"
        
    db_log = ActivityLog(
        user_id=current_user.id,
        action=log_action,
        details=log_details,
        target_type="Milestone",
        target_name=milestone.title
    )
    db.add(db_log)
    db.commit()
    db.refresh(milestone)
    return milestone

@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a milestone"
)
def delete_milestone(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    milestone = db.query(Milestone).filter(Milestone.id == id).first()
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found."
        )
        
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Milestone Deleted",
        details=f"Deleted milestone '{milestone.title}'",
        target_type="Milestone",
        target_name=milestone.title
    )
    db.add(db_log)
    db.delete(milestone)
    db.commit()
    return None

@router.post(
    "/{id}/tasks",
    summary="Assign tasks to a milestone"
)
def assign_tasks_to_milestone(
    id: uuid.UUID,
    task_ids: List[uuid.UUID],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    milestone = db.query(Milestone).filter(Milestone.id == id).first()
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found."
        )

    # Associate tasks with this milestone
    db.query(Task).filter(Task.id.in_(task_ids)).update(
        {Task.milestone_id: id},
        synchronize_session=False
    )
    db.commit()
    return {"message": f"Successfully assigned {len(task_ids)} tasks to milestone '{milestone.title}'."}

@router.get(
    "/{id}/stats",
    response_model=MilestoneStatsResponse,
    summary="Get milestone progress metrics"
)
def get_milestone_stats(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    milestone = db.query(Milestone).filter(Milestone.id == id).first()
    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Milestone not found."
        )

    total_tasks = db.query(func.count(Task.id)).filter(Task.milestone_id == id).scalar() or 0
    completed_tasks = db.query(func.count(Task.id)).filter(Task.milestone_id == id, Task.completed == True).scalar() or 0
    
    completion_percentage = 0.0
    if total_tasks > 0:
        completion_percentage = round((completed_tasks / total_tasks) * 100, 2)

    return {
        "milestone_id": milestone.id,
        "title": milestone.title,
        "status": milestone.status,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_percentage": completion_percentage,
        "due_date": milestone.due_date,
        "is_archived": milestone.is_archived
    }
