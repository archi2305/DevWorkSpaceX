import uuid
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from datetime import datetime
from app.models.user import User
from app.models.task import Task
from app.models.project import Project
from app.models.activity import ActivityLog
from app.models.label import Label
from app.schemas.task import TaskCreate, TaskResponse, TaskUpdate
from app.api.notification import dispatch_notification

router = APIRouter(prefix="/tasks", tags=["Tasks"])

def recalculate_project_progress(project_id: uuid.UUID, db: Session):
    """
    Recalculates a project's overall progress based on its tasks' status.
    Progress = (Tasks marked as 'Done' or 'completed' / Total tasks) * 100
    """
    total_tasks = db.query(Task).filter(
        (Task.project_id == project_id) & (Task.is_archived == False)
    ).count()
    if total_tasks == 0:
        return
        
    completed_tasks = db.query(Task).filter(
        (Task.project_id == project_id) & 
        (Task.is_archived == False) &
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
    status: Optional[str] = None,
    priority: Optional[str] = None,
    due_date: Optional[str] = None,
    sprint_id: Optional[uuid.UUID] = None,
    label_ids: Optional[str] = None,
    assignee_id: Optional[uuid.UUID] = None,
    is_archived: Optional[bool] = Query(False),
    created_at_start: Optional[datetime] = None,
    created_at_end: Optional[datetime] = None,
    updated_at_start: Optional[datetime] = None,
    updated_at_end: Optional[datetime] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List tasks with advanced filtering parameters.
    """
    query = db.query(Task)
    
    if project_id:
        query = query.filter(Task.project_id == project_id)
    
    if status:
        status_list = [s.strip() for s in status.split(",") if s.strip()]
        if status_list:
            query = query.filter(Task.status.in_(status_list))

    if priority:
        priority_list = [p.strip() for p in priority.split(",") if p.strip()]
        if priority_list:
            query = query.filter(Task.priority.in_(priority_list))

    if due_date:
        query = query.filter(Task.due_date == due_date)

    if sprint_id:
        query = query.filter(Task.sprint_id == sprint_id)

    if label_ids:
        label_uuids = []
        for lid in label_ids.split(","):
            try:
                label_uuids.append(uuid.UUID(lid.strip()))
            except ValueError:
                pass
        if label_uuids:
            query = query.filter(Task.labels.any(Label.id.in_(label_uuids)))

    if assignee_id:
        query = query.filter(Task.assignee_id == assignee_id)

    if is_archived is not None:
        query = query.filter(Task.is_archived == is_archived)

    if created_at_start:
        query = query.filter(Task.created_at >= created_at_start)
    if created_at_end:
        query = query.filter(Task.created_at <= created_at_end)

    if updated_at_start:
        query = query.filter(Task.updated_at >= updated_at_start)
    if updated_at_end:
        query = query.filter(Task.updated_at <= updated_at_end)
        
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
        (Task.status != "Done") &
        (Task.is_archived == False)
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
    is_completed = task_data.completed or task_data.status == "Done"
    
    db_task = Task(
        title=task_data.title,
        description=task_data.description,
        status=task_data.status,
        due_date=task_data.due_date,
        priority=task_data.priority,
        completed=is_completed,
        assignee_id=assignee_id,
        project_id=task_data.project_id,
        sprint_id=task_data.sprint_id,
        parent_id=task_data.parent_id,
        story_points=task_data.story_points,
        estimated_time=task_data.estimated_time,
        is_archived=task_data.is_archived,
        attachments=task_data.attachments
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
    
    update_data = task_update.model_dump(exclude_unset=True)
    
    # Pre-calculate completion status if changing
    new_completed = was_completed
    if "completed" in update_data:
        new_completed = update_data["completed"]
    if "status" in update_data:
        new_completed = (update_data["status"] == "Done")

    # Enforce Dependency Lock: Cannot complete task if blocked by uncompleted tasks
    if new_completed and not was_completed:
        from app.models.task import TaskDependency
        blocked_by_relations = db.query(TaskDependency).filter(
            TaskDependency.task_id == db_task.id,
            TaskDependency.dependency_type == "blocked_by"
        ).all()
        for dep in blocked_by_relations:
            blocking_task = db.query(Task).filter(Task.id == dep.depends_on_id).first()
            if blocking_task and not blocking_task.completed:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot complete task '{db_task.title}' because it is blocked by uncompleted task '{blocking_task.title}'."
                )

    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    # Automatically sync completed flag with Done status
    if "status" in update_data:
        db_task.completed = (db_task.status == "Done")
        
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
    
    # Dispatch notifications
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
    
    if project_id:
        recalculate_project_progress(project_id, db)
        db.commit()
        
    return None

@router.post(
    "/{task_id}/duplicate",
    response_model=TaskResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Duplicate a task",
)
def duplicate_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    source_task = db.query(Task).filter(Task.id == task_id).first()
    if not source_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    new_task = Task(
        title=f"{source_task.title} Copy",
        description=source_task.description,
        status=source_task.status,
        due_date=source_task.due_date,
        priority=source_task.priority,
        completed=source_task.completed,
        assignee_id=source_task.assignee_id,
        project_id=source_task.project_id,
        sprint_id=source_task.sprint_id,
        story_points=source_task.story_points,
        estimated_time=source_task.estimated_time,
        is_archived=source_task.is_archived,
        attachments=source_task.attachments
    )
    db.add(new_task)
    
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Task Duplicated",
        details=f"Task '{source_task.title}' was duplicated to '{new_task.title}'",
        target_type="Task",
        target_name=new_task.title
    )
    db.add(db_log)
    db.commit()
    db.refresh(new_task)

    if new_task.project_id:
        recalculate_project_progress(new_task.project_id, db)
        db.commit()

    return new_task

@router.post(
    "/{task_id}/archive",
    response_model=TaskResponse,
    summary="Archive a task",
)
def archive_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    db_task.is_archived = True
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Task Archived",
        details=f"Task '{db_task.title}' was archived",
        target_type="Task",
        target_name=db_task.title
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_task)

    if db_task.project_id:
        recalculate_project_progress(db_task.project_id, db)
        db.commit()

    return db_task

@router.post(
    "/{task_id}/restore",
    response_model=TaskResponse,
    summary="Restore a task",
)
def restore_task(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    db_task.is_archived = False
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Task Restored",
        details=f"Task '{db_task.title}' was restored",
        target_type="Task",
        target_name=db_task.title
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_task)

    if db_task.project_id:
        recalculate_project_progress(db_task.project_id, db)
        db.commit()

    return db_task

@router.get(
    "/{task_id}/subtasks",
    response_model=List[TaskResponse],
    summary="Get all subtasks of a task"
)
def get_subtasks(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Task).filter(Task.parent_id == task_id).all()

@router.get(
    "/{task_id}/dependencies",
    response_model=List[TaskDependencyResponse],
    summary="Get all dependencies of a task"
)
def get_dependencies(
    task_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.task import TaskDependency
    return db.query(TaskDependency).filter(
        (TaskDependency.task_id == task_id) | (TaskDependency.depends_on_id == task_id)
    ).all()

@router.post(
    "/{task_id}/dependencies",
    response_model=TaskDependencyResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add a dependency link to a task"
)
def add_dependency(
    task_id: uuid.UUID,
    req: TaskDependencyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.task import TaskDependency
    # Check that dependency doesn't already exist
    existing = db.query(TaskDependency).filter(
        TaskDependency.task_id == task_id,
        TaskDependency.depends_on_id == req.depends_on_id,
        TaskDependency.dependency_type == req.dependency_type
    ).first()
    if existing:
        return existing
        
    dep = TaskDependency(
        task_id=task_id,
        depends_on_id=req.depends_on_id,
        dependency_type=req.dependency_type
    )
    db.add(dep)
    db.commit()
    db.refresh(dep)
    return dep

@router.delete(
    "/{task_id}/dependencies/{dep_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove a dependency link from a task"
)
def remove_dependency(
    task_id: uuid.UUID,
    dep_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.task import TaskDependency
    dep = db.query(TaskDependency).filter(
        TaskDependency.id == dep_id,
        (TaskDependency.task_id == task_id) | (TaskDependency.depends_on_id == task_id)
    ).first()
    if not dep:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dependency not found"
        )
    db.delete(dep)
    db.commit()
    return None


