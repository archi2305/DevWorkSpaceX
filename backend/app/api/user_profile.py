import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.task import Task
from app.models.project import Project
from app.models.activity import ActivityLog
from app.models.workspace import WorkspaceMember
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.task import TaskResponse
from app.schemas.project import ProjectResponse
from app.schemas.activity import ActivityResponse

router = APIRouter(prefix="/users", tags=["User Profiles"])

def assemble_profile_payload(user: User, db: Session) -> Dict[str, Any]:
    # 1. Fetch assigned tasks
    tasks = db.query(Task).filter(Task.assignee_id == user.id, Task.is_deleted == False).all()
    
    # 2. Fetch projects user is involved in
    projects = db.query(Project).join(
        WorkspaceMember, WorkspaceMember.workspace_id == Project.workspace_id
    ).filter(WorkspaceMember.user_id == user.id, Project.is_deleted == False).all()

    # 3. Fetch recent activity logs
    activities = db.query(ActivityLog).filter(
        ActivityLog.user_id == user.id
    ).order_by(ActivityLog.created_at.desc()).limit(15).all()

    return {
        "user": UserResponse.model_validate(user),
        "assigned_tasks": [TaskResponse.model_validate(t) for t in tasks],
        "projects": [ProjectResponse.model_validate(p) for p in projects],
        "recent_activity": [ActivityResponse.model_validate(a) for a in activities]
    }

@router.get("/me/profile", summary="Get logged in user profile details")
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return assemble_profile_payload(current_user, db)

@router.get("/{user_id}/profile", summary="Get public profile metrics of a team member")
def get_user_profile(
    user_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return assemble_profile_payload(user, db)

@router.put("/me/profile", response_model=UserResponse, summary="Update profile settings")
def update_profile_settings(
    request: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if request.full_name is not None:
        current_user.full_name = request.full_name
    if request.profile_image is not None:
        current_user.profile_image = request.profile_image
    if request.bio is not None:
        current_user.bio = request.bio
    if request.skills is not None:
        current_user.skills = request.skills
    if request.timezone is not None:
        current_user.timezone = request.timezone

    db.commit()
    db.refresh(current_user)
    return current_user
