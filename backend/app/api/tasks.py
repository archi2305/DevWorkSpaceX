import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get(
    "/upcoming",
    response_model=List[TaskResponse],
    summary="Get upcoming tasks",
    description="Loads all incomplete tasks assigned to the logged-in user."
)
def get_upcoming_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Query tasks assigned to the user.
    """
    tasks = db.query(Task).filter(
        Task.assignee_id == current_user.id
    ).order_by(Task.created_at.desc()).all()
    return tasks

@router.post(
    "",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new task",
    description="Creates a new task in the workspace."
)
def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new task. Defaults assignee to creator if not specified.
    """
    assignee_id = task_data.assignee_id or current_user.id
    
    db_task = Task(
        title=task_data.title,
        due_date=task_data.due_date,
        priority=task_data.priority,
        completed=task_data.completed,
        assignee_id=assignee_id,
        project_id=task_data.project_id
    )
    
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update a task",
    description="Updates task completed status, details, or assignment."
)
def update_task(
    task_id: uuid.UUID,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update details of a task (e.g. toggling complete status).
    """
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    # Standard Pydantic model update loop
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task
