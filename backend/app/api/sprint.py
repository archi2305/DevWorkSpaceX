import uuid
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.api.notification import dispatch_notification
from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.sprint import Sprint
from app.models.task import Task
from app.models.user import User
from app.models.activity import ActivityLog
from app.schemas.sprint import (
    SprintCreate,
    SprintResponse,
    SprintStatsResponse,
    SprintTaskMove,
    SprintTaskMoveBetween,
    SprintUpdate,
)

router = APIRouter(prefix="/sprints", tags=["Sprints"])

DONE_STATUSES = {"done", "completed", "closed"}
VALID_STATUSES = {"Planned", "Active", "Completed"}


def get_sprint_or_404(db: Session, sprint_id: uuid.UUID) -> Sprint:
    sprint = (
        db.query(Sprint)
        .options(joinedload(Sprint.tasks).joinedload(Task.assignee), joinedload(Sprint.tasks).joinedload(Task.labels))
        .filter(Sprint.id == sprint_id)
        .first()
    )
    if not sprint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sprint not found.")
    return sprint


def get_active_sprint(db: Session, project_id: uuid.UUID, exclude_id: Optional[uuid.UUID] = None) -> Optional[Sprint]:
    query = db.query(Sprint).filter(
        Sprint.project_id == project_id,
        Sprint.status == "Active",
        Sprint.is_archived == False,
    )
    if exclude_id:
        query = query.filter(Sprint.id != exclude_id)
    return query.first()


def load_sprint_tasks(db: Session, sprint_id: uuid.UUID) -> List[Task]:
    return (
        db.query(Task)
        .options(joinedload(Task.assignee), joinedload(Task.labels))
        .filter(Task.sprint_id == sprint_id, Task.is_deleted == False)
        .order_by(Task.created_at.asc())
        .all()
    )


def story_points(tasks: List[Task]) -> int:
    return sum(task.story_points or 0 for task in tasks)


def is_task_complete(task: Task) -> bool:
    return bool(task.completed) or task.status.lower() in DONE_STATUSES


def calculate_project_velocity(db: Session, project_id: uuid.UUID) -> int:
    completed_sprints = (
        db.query(Sprint)
        .filter(
            Sprint.project_id == project_id,
            Sprint.status == "Completed",
            Sprint.is_archived == False,
        )
        .order_by(Sprint.end_date.desc().nullslast(), Sprint.updated_at.desc())
        .limit(5)
        .all()
    )
    if not completed_sprints:
        return 0

    totals = []
    for sprint in completed_sprints:
        completed_points = (
            db.query(func.coalesce(func.sum(Task.story_points), 0))
            .filter(
                Task.sprint_id == sprint.id,
                Task.is_deleted == False,
                ((Task.completed == True) | (func.lower(Task.status).in_(DONE_STATUSES))),
            )
            .scalar()
            or 0
        )
        totals.append(int(completed_points))

    return round(sum(totals) / len(totals)) if totals else 0


def build_sprint_stats(db: Session, sprint: Sprint) -> dict:
    tasks = load_sprint_tasks(db, sprint.id)
    completed_tasks = [task for task in tasks if is_task_complete(task)]
    total_points = story_points(tasks)
    completed_points = story_points(completed_tasks)
    remaining_points = max(total_points - completed_points, 0)
    completion_percentage = round((completed_points / total_points) * 100, 2) if total_points else 0.0

    start_dt = sprint.start_date or sprint.created_at
    end_dt = sprint.end_date or (start_dt + timedelta(weeks=sprint.duration_weeks))
    checkpoints = []
    steps = 9
    step_duration = (end_dt - start_dt) / steps if end_dt > start_dt else timedelta(days=1)

    for index in range(steps + 1):
        checkpoint_time = start_dt + (step_duration * index)
        completed_before = [
            task
            for task in completed_tasks
            if task.updated_at and task.updated_at <= checkpoint_time
        ]
        checkpoints.append(
            {
                "day": checkpoint_time.strftime("%b %d"),
                "remaining": max(total_points - story_points(completed_before), 0),
            }
        )

    return {
        "sprint_id": sprint.id,
        "name": sprint.name,
        "goal": sprint.goal,
        "description": sprint.description,
        "status": sprint.status,
        "start_date": sprint.start_date,
        "end_date": sprint.end_date,
        "total_tasks": len(tasks),
        "completed_tasks": len(completed_tasks),
        "remaining_tasks": max(len(tasks) - len(completed_tasks), 0),
        "total_story_points": total_points,
        "completed_story_points": completed_points,
        "remaining_story_points": remaining_points,
        "velocity": calculate_project_velocity(db, sprint.project_id),
        "completion_percentage": completion_percentage,
        "burndown": checkpoints,
        "tasks": tasks,
    }


def validate_task_ids_for_sprint(db: Session, sprint: Sprint, task_ids: List[uuid.UUID]) -> List[Task]:
    if not task_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one task is required.")

    tasks = (
        db.query(Task)
        .filter(
            Task.id.in_(task_ids),
            Task.project_id == sprint.project_id,
            Task.is_deleted == False,
        )
        .all()
    )
    if len(tasks) != len(set(task_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All tasks must exist and belong to the same project as the sprint.",
        )
    return tasks


@router.post("", response_model=SprintResponse, status_code=status.HTTP_201_CREATED, summary="Create a new sprint")
def create_sprint(
    request: SprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = Sprint(
        project_id=request.project_id,
        name=request.name,
        goal=request.goal,
        description=request.description,
        duration_weeks=request.duration_weeks or 2,
        start_date=request.start_date,
        end_date=request.end_date,
        status="Planned",
    )
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    
    # Log sprint creation activity
    db_log = ActivityLog(
        user_id=current_user.id,
        category="project",
        event_type="create",
        action="Sprint Created",
        details=f"Sprint '{sprint.name}' was created with status: {sprint.status}",
        target_type="Sprint",
        target_name=sprint.name,
        target_id=sprint.id
    )
    db.add(db_log)
    db.commit()
    
    return sprint


@router.get("", response_model=List[SprintResponse], summary="List project sprints")
def list_sprints(
    project_id: uuid.UUID,
    status: Optional[str] = None,
    include_archived: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Sprint).options(joinedload(Sprint.tasks)).filter(Sprint.project_id == project_id)
    if status:
        query = query.filter(Sprint.status == status)
    if not include_archived:
        query = query.filter(Sprint.is_archived == False)
    return query.order_by(Sprint.created_at.desc()).all()


@router.get("/{id}", response_model=SprintResponse, summary="Get sprint details")
def get_sprint(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_sprint_or_404(db, id)


@router.patch("/{id}", response_model=SprintResponse, summary="Edit sprint metadata")
def update_sprint(
    id: uuid.UUID,
    request: SprintUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = get_sprint_or_404(db, id)
    update_data = request.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid sprint status.")

    status_value = update_data.pop("status", None)
    update_data.pop("is_archived", None)

    for key, value in update_data.items():
        setattr(sprint, key, value)

    if status_value:
        if status_value == "Active":
            start_sprint(id, db, current_user)
            return get_sprint_or_404(db, id)
        if status_value == "Completed":
            complete_sprint(id, db, current_user)
            return get_sprint_or_404(db, id)
        sprint.status = status_value

    db.commit()
    db.refresh(sprint)
    return sprint


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a sprint")
def delete_sprint(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = get_sprint_or_404(db, id)
    db.query(Task).filter(Task.sprint_id == id).update({Task.sprint_id: None}, synchronize_session=False)
    db.delete(sprint)
    db.commit()
    return None


@router.post("/{id}/start", response_model=SprintResponse, summary="Start a planned sprint")
def start_sprint(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = get_sprint_or_404(db, id)
    if sprint.is_archived:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Archived sprints cannot be started.")
    active_exists = get_active_sprint(db, sprint.project_id, exclude_id=sprint.id)
    if active_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Another sprint is already active on this project. Complete it first.",
        )
    sprint.status = "Active"
    sprint.start_date = sprint.start_date or datetime.utcnow()
    sprint.end_date = sprint.end_date or (sprint.start_date + timedelta(weeks=sprint.duration_weeks))
    
    # Log sprint start activity
    db_log = ActivityLog(
        user_id=current_user.id,
        category="project",
        event_type="create",
        action="Sprint Started",
        details=f"Sprint '{sprint.name}' was started",
        target_type="Sprint",
        target_name=sprint.name,
        target_id=sprint.id
    )
    db.add(db_log)
    db.commit()
    dispatch_notification(db, current_user.id, "Sprint Started", f"Sprint '{sprint.name}' has been started.", "Info")
    db.commit()
    db.refresh(sprint)
    return sprint


@router.post("/{id}/complete", response_model=SprintResponse, summary="Complete an active sprint")
def complete_sprint(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = get_sprint_or_404(db, id)
    if sprint.status != "Active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only active sprints can be completed.")
    sprint.status = "Completed"
    sprint.end_date = datetime.utcnow()
    dispatch_notification(db, current_user.id, "Sprint Completed", f"Sprint '{sprint.name}' has been completed.", "Info")
    db.commit()
    db.refresh(sprint)
    return sprint


@router.post("/{id}/archive", response_model=SprintResponse, summary="Archive a sprint")
def archive_sprint(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = get_sprint_or_404(db, id)
    if sprint.status == "Active":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Complete active sprints before archiving.")
    sprint.is_archived = True
    sprint.archived_at = datetime.utcnow()
    db.commit()
    db.refresh(sprint)
    return sprint


@router.post("/{id}/tasks", summary="Add tasks to a sprint")
def add_tasks_to_sprint(
    id: uuid.UUID,
    request: SprintTaskMove,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = get_sprint_or_404(db, id)
    tasks = validate_task_ids_for_sprint(db, sprint, request.task_ids)
    for task in tasks:
        task.sprint_id = sprint.id
    db.commit()
    return {"message": f"Moved {len(tasks)} task(s) into sprint '{sprint.name}'."}


@router.delete("/{id}/tasks/{task_id}", summary="Remove a task from a sprint")
def remove_task_from_sprint(
    id: uuid.UUID,
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.sprint_id == id, Task.is_deleted == False).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found in this sprint.")
    task.sprint_id = None
    db.commit()
    return {"message": "Task removed from sprint."}


@router.post("/{id}/move-tasks", summary="Move tasks between sprints")
def move_tasks_between_sprints(
    id: uuid.UUID,
    request: SprintTaskMoveBetween,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    source = get_sprint_or_404(db, id)
    target = None
    if request.target_sprint_id:
        target = get_sprint_or_404(db, request.target_sprint_id)
        if target.project_id != source.project_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target sprint must be in the same project.")

    tasks = validate_task_ids_for_sprint(db, source, request.task_ids)
    for task in tasks:
        if task.sprint_id != source.id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All tasks must belong to the source sprint.")
        task.sprint_id = target.id if target else None

    db.commit()
    target_name = target.name if target else "project backlog"
    return {"message": f"Moved {len(tasks)} task(s) to {target_name}."}


@router.get("/{id}/stats", response_model=SprintStatsResponse, summary="Get sprint progress and velocity metrics")
def get_sprint_stats(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sprint = get_sprint_or_404(db, id)
    return build_sprint_stats(db, sprint)
