import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.milestone import Milestone

router = APIRouter(prefix="/quick-actions", tags=["Quick Actions & Seed Tool"])

class SeedResponse(BaseModel):
    message: str
    project_id: uuid.UUID
    tasks_seeded: int

class TriggerMacroRequest(BaseModel):
    macro_name: str

class MacroResponse(BaseModel):
    message: str
    actions_run: list

@router.post("/seed", response_model=SeedResponse, status_code=status.HTTP_201_CREATED)
def seed_demo_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Create a Seeded Project
    project_name = f"Quick Seeded Project {uuid.uuid4().hex[:4].upper()}"
    project_slug = project_name.lower().replace(" ", "-")
    
    db_project = Project(
        name=project_name,
        slug=project_slug,
        description="This project and its tasks were automatically seeded by the Quick Actions tool.",
        icon="🚀",
        color="#5bb98c",
        status="In Progress",
        priority="High",
        owner_id=current_user.id,
        kanban_columns=["Todo", "In Progress", "In Review", "Done"]
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # 2. Seed 5 demo tasks
    task_titles = [
        "Setup production telemetry and metrics dashboards",
        "Implement end-to-end authentication coverage checks",
        "Verify CORS preflight routing headers on gateway",
        "Benchmark database index performance under concurrency load",
        "Audit frontend layout hydration failures"
    ]
    
    seeded_tasks = []
    for i, title in enumerate(task_titles):
        db_task = Task(
            title=title,
            description=f"Automated task {i+1} seeded to test workspace workflows.",
            status="Todo" if i != 2 else "In Progress",
            priority="medium" if i % 2 == 0 else "high",
            assignee_id=current_user.id,
            project_id=db_project.id,
            completed=False
        )
        db.add(db_task)
        seeded_tasks.append(db_task)

    # 3. Seed 1 milestone
    db_milestone = Milestone(
        project_id=db_project.id,
        title="Beta Release Milestone",
        description="Verify all seeded beta tasks are solved.",
        status="Active",
        due_date=datetime.utcnow() + timedelta(days=14)
    )
    db.add(db_milestone)

    db.commit()

    return {
        "message": "Demo project, tasks, and milestone seeded successfully!",
        "project_id": db_project.id,
        "tasks_seeded": len(seeded_tasks)
    }

@router.post("/trigger-macro", response_model=MacroResponse)
def trigger_macro(
    request: TriggerMacroRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actions_run = []
    
    if request.macro_name == "mark_all_done":
        # Mark all user's tasks as completed
        tasks = db.query(Task).filter(Task.assignee_id == current_user.id, Task.completed == False).all()
        for t in tasks:
            t.completed = True
            t.status = "Done"
        db.commit()
        actions_run.append(f"Marked {len(tasks)} tasks as completed.")
        
    elif request.macro_name == "clear_empty_projects":
        # Delete projects with no tasks owned by current user
        projects = db.query(Project).filter(Project.owner_id == current_user.id).all()
        deleted_count = 0
        for p in projects:
            task_count = db.query(Task).filter(Task.project_id == p.id).count()
            if task_count == 0:
                db.delete(p)
                deleted_count += 1
        db.commit()
        actions_run.append(f"Deleted {deleted_count} empty projects.")
        
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown macro: {request.macro_name}"
        )

    return {
        "message": f"Macro '{request.macro_name}' completed successfully.",
        "actions_run": actions_run
    }
