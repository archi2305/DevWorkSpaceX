import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
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
    Auto-seeds default records if the database lacks initial dashboard statistics
    for the logged-in user, avoiding blank visual widgets on first login.
    """
    # 1. Seed Active Sprint if empty
    sprint = db.query(Sprint).first()
    if not sprint:
        sprint = Sprint(
            name="Sprint 24",
            start_date=datetime.utcnow() - timedelta(days=5),
            end_date=datetime.utcnow() + timedelta(days=9),
            completed_tasks=12,
            total_tasks=18,
            velocity=42
        )
        db.add(sprint)
        db.commit()
        db.refresh(sprint)

    # 2. Seed Welcome Notifications if empty
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

    # 3. Seed initial Activity Logs if empty
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

    # 4. Seed AI Suggestions if empty
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

    # 1. Projects (limit 10)
    projects = db.query(Project).filter(
        (Project.owner_id == current_user.id) |
        (Project.members.any(id=current_user.id))
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
    sprint = db.query(Sprint).first()

    # 7. Team online statuses
    users = db.query(User).all()
    team_members = []
    for u in users:
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
    registered_users = len(users)
    
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

@router.get("/activities", response_model=List[ActivityLogResponse])
def get_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List user workspace timeline logs.
    """
    return db.query(ActivityLog).filter(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).all()

@router.get("/workspace/members", response_model=List[WorkspaceMemberResponse])
def get_workspace_members(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List registered team members and online statuses.
    """
    users = db.query(User).all()
    team_members = []
    for u in users:
        initials = "".join([n[0] for n in u.full_name.split() if n]).upper()[:2]
        team_members.append(
            WorkspaceMemberResponse(
                initials=initials or "U",
                name=u.full_name,
                is_online=True if u.id == current_user.id else False
            )
        )
    return team_members

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
    sprint = db.query(Sprint).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Active sprint not found")
    return sprint

@router.get("/notifications", response_model=List[NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch notifications.
    """
    return db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

@router.post("/notifications/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mark an alert read.
    """
    notif = db.query(Notification).filter(
        (Notification.id == notification_id) & (Notification.user_id == current_user.id)
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif
