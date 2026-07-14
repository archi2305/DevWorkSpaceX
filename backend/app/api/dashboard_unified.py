import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.activity import ActivityLog
from app.models.notification import Notification
from app.models.sprint import Sprint
from app.models.suggestion import AISuggestion
from app.models.workspace_member import WorkspaceMember
from app.schemas.dashboard_unified import (
    DashboardUnifiedResponse, 
    ActivityLogResponse, 
    NotificationResponse, 
    SprintResponse, 
    AISuggestionResponse,
    WorkspaceMemberResponse
)

router = APIRouter(tags=["Unified Dashboard"])

def seed_default_data_if_needed(db: Session, current_user: User):
    """
    Auto-seeds only user-scoped supporting records that are not project/task data.
    """
    # 1. Seed Welcome Notifications if empty
    notifs = db.query(Notification).filter(Notification.user_id == current_user.id).all()
    if not notifs:
        welcome_notifs = [
            Notification(
                user_id=current_user.id,
                title="Welcome to DevWorkspace X",
                message="Your workspace onboarding is complete. Explore project management tools now.",
                is_read=False
            ),
            Notification(
                user_id=current_user.id,
                title="Alembic Migrations Applied",
                message="Successfully registered project and task schemas.",
                is_read=False
            ),
            Notification(
                user_id=current_user.id,
                title="AI Engine Active",
                message="AISuggestions is online and scanning code packages.",
                is_read=True
            )
        ]
        db.add_all(welcome_notifs)
        db.commit()

    # 2. Seed initial Activity Logs if empty
    activities = db.query(ActivityLog).filter(ActivityLog.user_id == current_user.id).all()
    if not activities:
        initial_logs = [
            ActivityLog(
                user_id=current_user.id,
                action="Project initialized",
                details="Authentication and project tables initialized successfully.",
                target_type="System",
                target_name="DevWorkspace X"
            ),
            ActivityLog(
                user_id=current_user.id,
                action="Pushed changes to main branch",
                details="Refactored workspace top-navigation and headers layout.",
                target_type="Code",
                target_name="Repository"
            ),
            ActivityLog(
                user_id=current_user.id,
                action="Completed task",
                details="Marked 'Configure CORS headers' as done.",
                target_type="Task",
                target_name="Configure CORS"
            )
        ]
        db.add_all(initial_logs)
        db.commit()

    # 3. Seed AI Suggestions if empty
    suggestions = db.query(AISuggestion).filter(AISuggestion.user_id == current_user.id).all()
    if not suggestions:
        initial_suggestions = [
            AISuggestion(
                user_id=current_user.id,
                priority="high",
                title="Optimize Database Queries",
                description="Your recent queries could benefit from indexing. I found 3 slow queries.",
                action="Review",
                icon="⚡"
            ),
            AISuggestion(
                user_id=current_user.id,
                priority="medium",
                title="Update Dependencies",
                description="New versions available for 5 packages. Security updates included.",
                action="Update",
                icon="📦"
            )
        ]
        db.add_all(initial_suggestions)
        db.commit()

@router.get("/dashboard", response_model=DashboardUnifiedResponse)
def get_unified_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch the complete, aggregated dashboard statistics payload in a single HTTP request.
    """
    # Seed default stats to avoid layout blanks
    seed_default_data_if_needed(db, current_user)

    # 1. Projects (limit 10, unarchived only)
    projects = db.query(Project).filter(
        ((Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))) &
        (Project.is_archived == False)
    ).all()

    # 2. Upcoming tasks (limit 10)
    tasks = db.query(Task).filter(
        (Task.assignee_id == current_user.id) &
        (Task.completed == False)
    ).order_by(Task.created_at.desc()).limit(10).all()

    # 3. Activity Timeline (limit 5)
    activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).limit(5).all()

    # 4. Unread Notifications
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    # 5. AI Suggestions
    ai_suggestions = db.query(AISuggestion).filter(
        AISuggestion.user_id == current_user.id
    ).order_by(AISuggestion.created_at.desc()).all()

    # 6. Sprint Info
    project_ids = [project.id for project in projects]
    sprint_obj = None
    if project_ids:
        sprint_obj = (
            db.query(Sprint)
            .filter(
                Sprint.project_id.in_(project_ids),
                Sprint.status == "Active",
                Sprint.is_archived == False,
            )
            .order_by(Sprint.start_date.desc().nullslast(), Sprint.created_at.desc())
            .first()
        )

    sprint = None
    if sprint_obj:
        sprint_tasks = db.query(Task).filter(Task.sprint_id == sprint_obj.id, Task.is_deleted == False).all()
        done_tasks = [task for task in sprint_tasks if task.completed or task.status.lower() in {"done", "completed", "closed"}]
        total_story_points = sum(task.story_points or 0 for task in sprint_tasks)
        completed_story_points = sum(task.story_points or 0 for task in done_tasks)
        remaining_story_points = max(total_story_points - completed_story_points, 0)
        completed_sprints = (
            db.query(Sprint)
            .filter(
                Sprint.project_id == sprint_obj.project_id,
                Sprint.status == "Completed",
                Sprint.is_archived == False,
            )
            .order_by(Sprint.end_date.desc().nullslast(), Sprint.updated_at.desc())
            .limit(5)
            .all()
        )
        velocity_values = []
        for completed_sprint in completed_sprints:
            points = (
                db.query(func.coalesce(func.sum(Task.story_points), 0))
                .filter(
                    Task.sprint_id == completed_sprint.id,
                    Task.is_deleted == False,
                    ((Task.completed == True) | (func.lower(Task.status).in_(["done", "completed", "closed"]))),
                )
                .scalar()
                or 0
            )
            velocity_values.append(int(points))
        velocity = round(sum(velocity_values) / len(velocity_values)) if velocity_values else 0
        progress = int((completed_story_points / total_story_points) * 100) if total_story_points else 0
        sprint = {
            "id": sprint_obj.id,
            "project_id": sprint_obj.project_id,
            "name": sprint_obj.name,
            "goal": sprint_obj.goal,
            "start_date": sprint_obj.start_date,
            "end_date": sprint_obj.end_date,
            "status": sprint_obj.status,
            "completed_tasks": len(done_tasks),
            "total_tasks": len(sprint_tasks),
            "completed_story_points": completed_story_points,
            "total_story_points": total_story_points,
            "remaining_story_points": remaining_story_points,
            "velocity": velocity,
            "progress_percentage": progress,
            "created_at": sprint_obj.created_at
        }

    # 7. Team online statuses
    workspace_members = db.query(WorkspaceMember).all()
    if not workspace_members:
        owner_member = WorkspaceMember(user_id=current_user.id, role="Owner")
        db.add(owner_member)
        db.commit()
        workspace_members = [owner_member]

    team_members = []
    for wm in workspace_members:
        u = wm.user
        initials = "".join([n[0] for n in u.full_name.split() if n]).upper()[:2]
        team_members.append(
            WorkspaceMemberResponse(
                initials=initials or "U",
                name=u.full_name,
                is_online=True if u.id == current_user.id else False
            )
        )

    # 8. Core Metrics
    active_projects = sum(1 for p in projects if p.progress < 100)
    completed_tasks = db.query(Task).filter((Task.assignee_id == current_user.id) & (Task.completed == True)).count()
    pending_tasks = db.query(Task).filter((Task.assignee_id == current_user.id) & (Task.completed == False)).count()
    registered_users = db.query(User).count()
    
    total_tasks_count = completed_tasks + pending_tasks
    completion_rate = int((completed_tasks / total_tasks_count) * 100) if total_tasks_count > 0 else 0

    metrics = {
        "active_projects": active_projects,
        "completed_tasks": completed_tasks,
        "pending_tasks": pending_tasks,
        "registered_users": registered_users,
        "workspace_completion": completion_rate,
        "completion_rate": completion_rate
    }

    return {
        "user": current_user,
        "metrics": metrics,
        "recentProjects": projects,
        "recentTasks": tasks,
        "recentActivities": activities,
        "workspaceHealth": metrics,
        "notifications": notifications,
        "sprint": sprint,
        "aiSuggestions": ai_suggestions,
        "teamMembers": team_members
    }



@router.get("/ai/suggestions", response_model=List[AISuggestionResponse])
def get_ai_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch AI optimization tips.
    """
    return db.query(AISuggestion).filter(
        AISuggestion.user_id == current_user.id
    ).all()

@router.get("/dashboard/sprint", response_model=SprintResponse)
def get_active_sprint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch active milestone stats.
    """
    project_ids = [
        project.id
        for project in db.query(Project).filter(
            ((Project.owner_id == current_user.id) | (Project.members.any(id=current_user.id))) &
            (Project.is_archived == False)
        ).all()
    ]
    sprint_obj = None
    if project_ids:
        sprint_obj = (
            db.query(Sprint)
            .filter(
                Sprint.project_id.in_(project_ids),
                Sprint.status == "Active",
                Sprint.is_archived == False,
            )
            .order_by(Sprint.start_date.desc().nullslast(), Sprint.created_at.desc())
            .first()
        )
    if not sprint_obj:
        raise HTTPException(status_code=404, detail="Active sprint not found")
    
    sprint_tasks = db.query(Task).filter(Task.sprint_id == sprint_obj.id, Task.is_deleted == False).all()
    done_tasks = [task for task in sprint_tasks if task.completed or task.status.lower() in {"done", "completed", "closed"}]
    total_story_points = sum(task.story_points or 0 for task in sprint_tasks)
    completed_story_points = sum(task.story_points or 0 for task in done_tasks)
    remaining_story_points = max(total_story_points - completed_story_points, 0)
    progress = int((completed_story_points / total_story_points) * 100) if total_story_points else 0
    return {
        "id": sprint_obj.id,
        "project_id": sprint_obj.project_id,
        "name": sprint_obj.name,
        "goal": sprint_obj.goal,
        "start_date": sprint_obj.start_date,
        "end_date": sprint_obj.end_date,
        "status": sprint_obj.status,
        "completed_tasks": len(done_tasks),
        "total_tasks": len(sprint_tasks),
        "completed_story_points": completed_story_points,
        "total_story_points": total_story_points,
        "remaining_story_points": remaining_story_points,
        "velocity": 0,
        "progress_percentage": progress,
        "created_at": sprint_obj.created_at
    }
