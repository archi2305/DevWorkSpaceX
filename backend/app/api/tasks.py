import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.project import Project
from app.models.activity import ActivityLog
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.api.notification import dispatch_notification

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def recalculate_project_progress(project_id: uuid.UUID, db: Session):
    """
    Recalculates a project's overall progress based on its tasks' status.
    Progress = (Tasks marked as 'Done' or 'completed' / Total tasks) * 100
    """
    total_tasks = db.query(Task).filter(Task.project_id == project_id).count()
    if total_tasks == 0:
        return
        
    completed_tasks = db.query(Task).filter(
        (Task.project_id == project_id) & 
        ((Task.completed == True) | (Task.status == "Done"))
    ).count()
    
    progress = int((completed_tasks / total_tasks) * 100)
    
    project = db.query(Project).filter(Project.id == project_id).first()
    if project:
        project.progress = progress

@router.get(
    "",
    response_model=List[TaskResponse],
    summary="Get workspace tasks",
    description="Loads tasks with optional filter by project ID."
)
def get_tasks(
    project_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List tasks optionally filtered by project.
    """
    query = db.query(Task)
    if project_id:
        query = query.filter(Task.project_id == project_id)
    else:
        query = query.filter(Task.assignee_id == current_user.id)
        
    return query.order_by(Task.created_at.desc()).all()

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
        (Task.assignee_id == current_user.id) &
        (Task.completed == False) &
        (Task.status != "Done")
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
    
    # Sync completed boolean based on status value
    is_completed = task_data.completed or task_data.status == "Done"
    
    db_task = Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        labels=task_data.labels,
        due_date=task_data.due_date,
        priority=task_data.priority,
        completed=is_completed,
        assignee_id=assignee_id,
        project_id=task_data.project_id
    )
    
    db.add(db_task)
    
    # Log task creation activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Task Created",
        details=f"Task '{db_task.title}' was created under project status: {db_task.status}",
        target_type="Task",
        target_name=db_task.title
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_task)
    
    # Recalculate associated project progress
    if db_task.project_id:
        recalculate_project_progress(db_task.project_id, db)
        db.commit()
        db.refresh(db_task)
        
    # Dispatch notification
    dispatch_notification(
        db=db,
        user_id=db_task.assignee_id,
        title="Task Assigned",
        message=f"You have been assigned to task: '{db_task.title}'",
        notification_type="Mention"
    )
        
    return db_task

@router.patch(
    "/{task_id}",
    response_model=TaskResponse,
    summary="Update a task",
    description="Updates task status, details, or assignment."
)
def update_task(
    task_id: uuid.UUID,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update details of a task (e.g. status columns, due dates, description).
    """
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    was_completed = db_task.completed
    old_project_id = db_task.project_id
    
    # Standard Pydantic model update loop
    update_data = task_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    # Automatically sync completed flag with Done status
    if "status" in update_data:
        db_task.completed = (db_task.status == "Done")
        
    # Log completions or changes
    log_action = "Task Updated"
    log_details = f"Task '{db_task.title}' details were updated"
    if db_task.completed and not was_completed:
        log_action = "Task Completed"
        log_details = f"Task '{db_task.title}' was completed"
    elif "assignee_id" in update_data and update_data["assignee_id"]:
        log_action = "Task Assigned"
        assignee_user = db.query(User).filter(User.id == db_task.assignee_id).first()
        assignee_name = assignee_user.full_name if assignee_user else "someone"
        log_details = f"Task '{db_task.title}' was assigned to {assignee_name}"
        
    db_log = ActivityLog(
        user_id=current_user.id,
        action=log_action,
        details=log_details,
        target_type="Task",
        target_name=db_task.title
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_task)
    
    # Recalculate project progress settings
    if db_task.project_id:
        recalculate_project_progress(db_task.project_id, db)
        db.commit()
    if old_project_id and old_project_id != db_task.project_id:
        recalculate_project_progress(old_project_id, db)
        db.commit()
        
    db.refresh(db_task)
    
    # Dispatch notifications on status change or reassignments
    if db_task.completed and not was_completed:
        dispatch_notification(db, db_task.assignee_id, "Task Completed", f"Task '{db_task.title}' was completed.", "Info")
    if "assignee_id" in update_data and update_data["assignee_id"] != current_user.id:
        dispatch_notification(db, db_task.assignee_id, "Task Assigned", f"You have been assigned to task: '{db_task.title}'", "Mention")
        
    return db_task

@router.delete(
    "/{task_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a task",
    description="Removes task from database and writes an activity log."
)
def delete_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes the task after writing delete log.
    """
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )
        
    project_id = db_task.project_id
    
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Task Deleted",
        details=f"Task '{db_task.title}' was deleted",
        target_type="Task",
        target_name=db_task.title
    )
    db.add(db_log)
    db.delete(db_task)
    db.commit()
    
    # Recalculate project progress
    if project_id:
        recalculate_project_progress(project_id, db)
        db.commit()
        
    return None


