import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.sprint import Sprint
from app.models.task import Task
from app.api.notification import dispatch_notification
from app.schemas.sprint import (
    SprintCreate,
    SprintUpdate,
    SprintResponse,
    SprintStatsResponse
)

router = APIRouter(prefix="/sprints", tags=["Sprints"])

@router.post(
    "",
    response_model=SprintResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new sprint"
)
def create_sprint(
    request: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = Sprint(
        project_id=request.project_id,
        name=request.name,
        goal=request.goal,
        duration_weeks=request.duration_weeks or 2,
        status="Planned"
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return sprint

@router.get(
    "",
    response_model=List[SprintResponse],
    summary="List all sprints in the project"
)
def list_sprints(
    project_id: uuid.UUID,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Sprint).filter(Sprint.project_id == project_id)
    if status:
        query = query.filter(Sprint.status == status)
    return query.order_by(Sprint.created_at.asc()).all()

@router.get(
    "/{id}",
    response_model=SprintResponse,
    summary="Get sprint details"
)
def get_sprint(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found."
        )
    return sprint

@router.patch(
    "/{id}",
    response_model=SprintResponse,
    summary="Update sprint metadata or status"
)
def update_sprint(
    id: uuid.UUID,
    request: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found."
        )

    update_data = request.model_dump(exclude_unset=True)
    
    # Handle state transitions
    if "status" in update_data:
        new_status = update_data["status"]
        if new_status == "Active" and sprint.status != "Active":
            # Check if another sprint is already active in the project
            active_exists = db.query(Sprint).filter(
                Sprint.project_id == sprint.project_id,
                Sprint.status == "Active"
            ).first()
            if active_exists:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Another sprint is already active on this project. Complete it first."
                )
            # Set dates
            sprint.start_date = datetime.utcnow()
            sprint.end_date = sprint.start_date + timedelta(weeks=sprint.duration_weeks)
            dispatch_notification(db, current_user.id, "Sprint Started", f"Sprint '{sprint.name}' has been started.", "Info")
        elif new_status == "Completed" and sprint.status == "Active":
            sprint.end_date = datetime.utcnow()
            dispatch_notification(db, current_user.id, "Sprint Completed", f"Sprint '{sprint.name}' has been completed.", "Info")

    for key, value in update_data.items():
        setattr(sprint, key, value)

    db.commit()
    db.refresh(sprint)
    return sprint

@router.delete(
    "/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a sprint"
)
def delete_sprint(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found."
        )
    # Tasks inside this sprint will automatically set sprint_id to null ondelete CASCADE/SET NULL
    db.delete(sprint)
    db.commit()
    return None

@router.post(
    "/{id}/tasks",
    summary="Assign tasks to a sprint"
)
def add_tasks_to_sprint(
    id: uuid.UUID,
    task_ids: List[uuid.UUID],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found."
        )

    # Assign all tasks to this sprint
    db.query(Task).filter(Task.id.in_(task_ids)).update(
        {Task.sprint_id: id},
        synchronize_session=False
    )
    db.commit()
    return {"message": f"Successfully moved {len(task_ids)} tasks into sprint '{sprint.name}'."}

@router.delete(
    "/{id}/tasks/{task_id}",
    summary="Remove a task from sprint backlog"
)
def remove_task_from_sprint(
    id: uuid.UUID,
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id, Task.sprint_id == id).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found in this sprint."
        )

    task.sprint_id = None
    db.commit()
    return {"message": "Task removed from sprint back to backlog."}

@router.get(
    "/{id}/stats",
    response_model=SprintStatsResponse,
    summary="Get sprint progress and burndown metrics"
)
def get_sprint_stats(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sprint = db.query(Sprint).filter(Sprint.id == id).first()
    if not sprint:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sprint not found."
        )

    # Gather task stats
    total_tasks = db.query(func.count(Task.id)).filter(Task.sprint_id == id).scalar() or 0
    completed_tasks = db.query(func.count(Task.id)).filter(Task.sprint_id == id, Task.completed == True).scalar() or 0
    remaining_tasks = total_tasks - completed_tasks
    
    completion_percentage = 0.0
    if total_tasks > 0:
        completion_percentage = round((completed_tasks / total_tasks) * 100, 2)

    # Burndown simulation: 10 steps representing the sprint duration
    burndown_points = []
    # If the sprint is not active yet, show a flat ideal burndown
    start_dt = sprint.start_date or (datetime.utcnow() - timedelta(days=5))
    end_dt = sprint.end_date or (start_dt + timedelta(weeks=sprint.duration_weeks))
    
    step_duration = (end_dt - start_dt) / 9
    
    for i in range(10):
        checkpoint_time = start_dt + (step_duration * i)
        
        # Simulate completed tasks before checkpoint_time
        done_before = db.query(func.count(Task.id)).filter(
            Task.sprint_id == id,
            Task.completed == True,
            Task.updated_at <= checkpoint_time
        ).scalar() or 0
        
        remaining_at_point = max(0, total_tasks - done_before)
        burndown_points.append({
            "day": checkpoint_time.strftime("%b %d"),
            "remaining": remaining_at_point
        })

    return {
        "sprint_id": sprint.id,
        "name": sprint.name,
        "status": sprint.status,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "remaining_tasks": remaining_tasks,
        "completion_percentage": completion_percentage,
        "burndown": burndown_points
    }
