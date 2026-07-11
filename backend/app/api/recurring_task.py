import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.recurring_task import RecurringTask, RecurringTaskHistory
from app.models.activity import ActivityLog
from app.schemas.recurring_task import (
    RecurringTaskCreate,
    RecurringTaskResponse,
    RecurringTaskHistoryResponse
)

router = APIRouter(prefix="/recurring-tasks", tags=["Recurring Tasks"])

def calculate_next_run(pattern: str, interval: int, current_next: datetime) -> datetime:
    """
    Computes the next target date based on recurrence pattern intervals.
    """
    if pattern == "Daily":
        return current_next + timedelta(days=interval)
    elif pattern == "Weekly":
        return current_next + timedelta(weeks=interval)
    elif pattern == "Monthly":
        # Simplified monthly step
        return current_next + timedelta(days=30 * interval)
    else: # Custom / fallback
        return current_next + timedelta(days=interval)

def check_and_generate_tasks(db: Session):
    """
    Scans for active recurring tasks past their next_run_at target,
    creates the database task instances, and logs histories.
    """
    now = datetime.utcnow()
    pending = db.query(RecurringTask).filter(
        RecurringTask.is_active == True,
        RecurringTask.next_run_at <= now
    ).all()

    for config in pending:
        # Create Task
        new_task = Task(
            title=config.title,
            description=config.description,
            status=config.status or "Todo",
            priority=config.priority or "Medium",
            project_id=config.project_id,
            assignee_id=config.assignee_id,
            due_date=config.next_run_at # Synchronize calendar via Task due_date!
        )
        db.add(new_task)
        db.flush()

        # Create History entry
        history = RecurringTaskHistory(
            recurring_task_id=config.id,
            generated_task_id=new_task.id,
            status="Generated",
            run_at=config.next_run_at
        )
        db.add(history)

        # Increment next run time
        config.next_run_at = calculate_next_run(config.recurrence_pattern, config.recurrence_interval, config.next_run_at)
    db.commit()

@router.post("", response_model=RecurringTaskResponse, status_code=status.HTTP_201_CREATED, summary="Create a recurring task config")
def create_recurring_config(
    request: RecurringTaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    config = RecurringTask(
        title=request.title,
        description=request.description,
        status=request.status or "Todo",
        priority=request.priority or "Medium",
        project_id=request.project_id,
        assignee_id=request.assignee_id,
        recurrence_pattern=request.recurrence_pattern,
        recurrence_interval=request.recurrence_interval or 1,
        custom_cron=request.custom_cron,
        next_run_at=request.next_run_at,
        is_active=True
    )
    db.add(config)
    db.commit()
    db.refresh(config)
    
    # Run a dynamic check
    check_and_generate_tasks(db)
    db.refresh(config)
    return config

@router.get("", response_model=List[RecurringTaskResponse], summary="List all recurring task configs")
def list_recurring_configs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_and_generate_tasks(db)
    return db.query(RecurringTask).all()

@router.post("/trigger-check", summary="Manually trigger pending recurrence checks")
def trigger_generation_check(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_and_generate_tasks(db)
    return {"status": "success", "detail": "Generation checks completed."}

@router.patch("/{id}/pause", response_model=RecurringTaskResponse, summary="Pause task recurrence")
def pause_recurrence(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    config = db.query(RecurringTask).filter(RecurringTask.id == id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Recurring task configuration not found")
    config.is_active = False
    
    log = ActivityLog(
        user_id=current_user.id,
        action="Recurrence Paused",
        details=f"Paused recurring task '{config.title}'."
    )
    db.add(log)
    db.commit()
    db.refresh(config)
    return config

@router.patch("/{id}/resume", response_model=RecurringTaskResponse, summary="Resume task recurrence")
def resume_recurrence(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    config = db.query(RecurringTask).filter(RecurringTask.id == id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Recurring task configuration not found")
    config.is_active = True

    log = ActivityLog(
        user_id=current_user.id,
        action="Recurrence Resumed",
        details=f"Resumed recurring task '{config.title}'."
    )
    db.add(log)
    db.commit()
    db.refresh(config)
    return config

@router.patch("/{id}/skip", response_model=RecurringTaskResponse, summary="Skip next task recurrence run")
def skip_recurrence_run(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    config = db.query(RecurringTask).filter(RecurringTask.id == id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Recurring task configuration not found")

    # Create skipped history entry
    history = RecurringTaskHistory(
        recurring_task_id=config.id,
        generated_task_id=None,
        status="Skipped",
        run_at=config.next_run_at
    )
    db.add(history)

    # Move target run to the next step
    config.next_run_at = calculate_next_run(config.recurrence_pattern, config.recurrence_interval, config.next_run_at)

    log = ActivityLog(
        user_id=current_user.id,
        action="Recurrence Skipped",
        details=f"Skipped run for recurring task '{config.title}'."
    )
    db.add(log)
    db.commit()
    db.refresh(config)
    return config

@router.get("/{id}/history", response_model=List[RecurringTaskHistoryResponse], summary="Get recurrence run history logs")
def get_recurrence_history(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(RecurringTaskHistory).filter(RecurringTaskHistory.recurring_task_id == id).order_by(RecurringTaskHistory.run_at.desc()).all()
