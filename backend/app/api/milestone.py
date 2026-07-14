import uuid
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.activity import ActivityLog
from app.models.milestone import Milestone
from app.models.project import Project
from app.models.task import Task
from app.models.user import User
from app.schemas.milestone import (
    MilestoneCreate,
    MilestoneResponse,
    MilestoneStatsResponse,
    MilestoneTaskAssignment,
    MilestoneUpdate,
)

router = APIRouter(prefix="/milestones", tags=["Milestones"])

DONE_STATUSES = {"done", "completed", "closed"}
VALID_STATUSES = {"Planned", "Active", "Completed"}


def get_milestone_or_404(db: Session, milestone_id: uuid.UUID) -> Milestone:
    milestone = (
        db.query(Milestone)
        .options(joinedload(Milestone.tasks).joinedload(Task.assignee), joinedload(Milestone.tasks).joinedload(Task.labels))
        .filter(Milestone.id == milestone_id)
        .first()
    )
    if not milestone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Milestone not found.")
    return milestone


def is_task_complete(task: Task) -> bool:
    return bool(task.completed) or task.status.lower() in DONE_STATUSES


def load_milestone_tasks(db: Session, milestone_id: uuid.UUID) -> List[Task]:
    return (
        db.query(Task)
        .options(joinedload(Task.assignee), joinedload(Task.labels))
        .filter(Task.milestone_id == milestone_id, Task.is_deleted == False)
        .order_by(Task.created_at.asc())
        .all()
    )


def build_timeline(milestone: Milestone, tasks: List[Task]) -> List[dict]:
    points = [
        {
            "label": "Created",
            "date": milestone.created_at,
            "status": "Completed",
        }
    ]
    if tasks:
        points.append(
            {
                "label": "Tasks Assigned",
                "date": min(task.created_at for task in tasks),
                "status": "Completed",
            }
        )
    if milestone.due_date:
        points.append(
            {
                "label": "Due Date",
                "date": milestone.due_date,
                "status": "Completed" if milestone.status == "Completed" else "Upcoming",
            }
        )
    return points


def build_milestone_stats(db: Session, milestone: Milestone) -> dict:
    tasks = load_milestone_tasks(db, milestone.id)
    completed_tasks = [task for task in tasks if is_task_complete(task)]
    completion_percentage = round((len(completed_tasks) / len(tasks)) * 100, 2) if tasks else 0.0
    return {
        "milestone_id": milestone.id,
        "title": milestone.title,
        "description": milestone.description,
        "status": milestone.status,
        "total_tasks": len(tasks),
        "completed_tasks": len(completed_tasks),
        "remaining_tasks": max(len(tasks) - len(completed_tasks), 0),
        "completion_percentage": completion_percentage,
        "due_date": milestone.due_date,
        "is_archived": milestone.is_archived,
        "timeline": build_timeline(milestone, tasks),
        "tasks": tasks,
    }


def validate_task_ids_for_milestone(db: Session, milestone: Milestone, task_ids: List[uuid.UUID]) -> List[Task]:
    if not task_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one task is required.")

    tasks = (
        db.query(Task)
        .filter(
            Task.id.in_(task_ids),
            Task.project_id == milestone.project_id,
            Task.is_deleted == False,
        )
        .all()
    )
    if len(tasks) != len(set(task_ids)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="All tasks must exist and belong to the same project as the milestone.",
        )
    return tasks


def add_activity(db: Session, user_id: uuid.UUID, action: str, title: str) -> None:
    db.add(
        ActivityLog(
            user_id=user_id,
            action=action,
            details=f"{action}: '{title}'",
            target_type="Milestone",
            target_name=title,
        )
    )


@router.post("", response_model=MilestoneResponse, status_code=status.HTTP_201_CREATED, summary="Create a new milestone")
def create_milestone(
    request: MilestoneCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if request.status not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid milestone status.")

    milestone = Milestone(
        project_id=request.project_id,
        title=request.title,
        description=request.description,
        due_date=request.due_date,
        status=request.status or "Planned",
        is_archived=request.is_archived or False,
    )
    db.add(milestone)
    add_activity(db, current_user.id, "Milestone Created", milestone.title)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.get("", response_model=List[MilestoneResponse], summary="List project milestones")
def list_milestones(
    project_id: uuid.UUID,
    is_archived: Optional[bool] = False,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Milestone).options(joinedload(Milestone.tasks)).filter(Milestone.project_id == project_id)
    if is_archived is not None:
        query = query.filter(Milestone.is_archived == is_archived)
    if status:
        query = query.filter(Milestone.status == status)
    return query.order_by(Milestone.due_date.asc().nulls_last(), Milestone.created_at.desc()).all()


@router.get("/upcoming", response_model=List[MilestoneStatsResponse], summary="Get upcoming milestones for dashboard")
def get_upcoming_milestones(
    limit: int = 5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    projects = db.query(Project).filter(
        ((Project.owner_id == current_user.id) | (Project.members.any(id=current_user.id))) &
        (Project.is_archived == False)
    ).all()
    project_ids = [project.id for project in projects]
    if not project_ids:
        return []

    milestones = (
        db.query(Milestone)
        .options(joinedload(Milestone.tasks))
        .filter(
            Milestone.project_id.in_(project_ids),
            Milestone.is_archived == False,
            Milestone.status != "Completed",
        )
        .order_by(Milestone.due_date.asc().nulls_last(), Milestone.created_at.desc())
        .limit(limit)
        .all()
    )
    return [build_milestone_stats(db, milestone) for milestone in milestones]


@router.get("/{id}", response_model=MilestoneResponse, summary="Get milestone details")
def get_milestone(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_milestone_or_404(db, id)


@router.patch("/{id}", response_model=MilestoneResponse, summary="Edit a milestone")
def update_milestone(
    id: uuid.UUID,
    request: MilestoneUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = get_milestone_or_404(db, id)
    update_data = request.model_dump(exclude_unset=True)
    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid milestone status.")

    for key, value in update_data.items():
        setattr(milestone, key, value)

    milestone.updated_at = datetime.utcnow()
    add_activity(db, current_user.id, "Milestone Updated", milestone.title)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a milestone")
def delete_milestone(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = get_milestone_or_404(db, id)
    db.query(Task).filter(Task.milestone_id == id).update({Task.milestone_id: None}, synchronize_session=False)
    add_activity(db, current_user.id, "Milestone Deleted", milestone.title)
    db.delete(milestone)
    db.commit()
    return None


@router.post("/{id}/archive", response_model=MilestoneResponse, summary="Archive a milestone")
def archive_milestone(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = get_milestone_or_404(db, id)
    milestone.is_archived = True
    milestone.updated_at = datetime.utcnow()
    add_activity(db, current_user.id, "Milestone Archived", milestone.title)
    db.commit()
    db.refresh(milestone)
    return milestone


@router.post("/{id}/tasks", summary="Assign tasks to a milestone")
def assign_tasks_to_milestone(
    id: uuid.UUID,
    request: MilestoneTaskAssignment,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = get_milestone_or_404(db, id)
    tasks = validate_task_ids_for_milestone(db, milestone, request.task_ids)
    for task in tasks:
        task.milestone_id = milestone.id
    db.commit()
    return {"message": f"Assigned {len(tasks)} task(s) to milestone '{milestone.title}'."}


@router.delete("/{id}/tasks/{task_id}", summary="Remove a task from a milestone")
def remove_task_from_milestone(
    id: uuid.UUID,
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    task = db.query(Task).filter(Task.id == task_id, Task.milestone_id == id, Task.is_deleted == False).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found in this milestone.")
    task.milestone_id = None
    db.commit()
    return {"message": "Task removed from milestone."}


@router.get("/{id}/stats", response_model=MilestoneStatsResponse, summary="Get milestone progress metrics")
def get_milestone_stats(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    milestone = get_milestone_or_404(db, id)
    return build_milestone_stats(db, milestone)
