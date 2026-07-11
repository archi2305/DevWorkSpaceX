import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.workspace_member import WorkspaceMember
from app.models.task import Task
from app.models.activity import ActivityLog

router = APIRouter(prefix="/workloads", tags=["Workload Planning"])

class MemberWorkloadResponse(BaseModel):
    member_id: uuid.UUID
    user_id: uuid.UUID
    full_name: str
    role: str
    weekly_capacity_hours: int
    assigned_hours: int
    remaining_hours: int
    is_overloaded: bool

class CapacityUpdateRequest(BaseModel):
    weekly_capacity_hours: int

class CalendarEventResponse(BaseModel):
    task_id: uuid.UUID
    title: str
    due_date: Optional[datetime]
    estimated_time: Optional[int]
    assignee_id: Optional[uuid.UUID]
    assignee_name: str

@router.get(
    "",
    response_model=List[MemberWorkloadResponse],
    summary="Get workload details for all members in a workspace"
)
def get_workspace_workload(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    members = db.query(WorkspaceMember).filter(WorkspaceMember.workspace_id == workspace_id).all()
    
    results = []
    for member in members:
        user = member.user
        if not user:
            continue
            
        # Sum estimated hours for incomplete tasks assigned to this member
        assigned_hours = db.query(func.sum(Task.estimated_time)).filter(
            Task.assignee_id == user.id,
            Task.completed == False
        ).scalar() or 0
        
        capacity = member.weekly_capacity_hours
        remaining = capacity - assigned_hours
        is_overloaded = assigned_hours > capacity
        
        results.append({
            "member_id": member.id,
            "user_id": user.id,
            "full_name": user.full_name,
            "role": member.role,
            "weekly_capacity_hours": capacity,
            "assigned_hours": int(assigned_hours),
            "remaining_hours": int(remaining),
            "is_overloaded": is_overloaded
        })
        
    return results

@router.patch(
    "/capacity/{member_id}",
    summary="Update a workspace member's weekly capacity hours"
)
def update_member_capacity(
    member_id: uuid.UUID,
    req: CapacityUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    member = db.query(WorkspaceMember).filter(WorkspaceMember.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workspace member not found."
        )
        
    member.weekly_capacity_hours = req.weekly_capacity_hours
    
    # Log Activity
    db_log = ActivityLog(
        user_id=current_user.id,
        action="Capacity Updated",
        details=f"Updated capacity of '{member.user.full_name}' to {req.weekly_capacity_hours} hours/week",
        target_type="Team Member",
        target_name=member.user.full_name
    )
    db.add(db_log)
    db.commit()
    db.refresh(member)
    
    return {"message": "Weekly capacity hours updated successfully.", "weekly_capacity_hours": member.weekly_capacity_hours}

@router.get(
    "/calendar",
    response_model=List[CalendarEventResponse],
    summary="Get task-based availability calendar loads"
)
def get_workload_calendar(
    workspace_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all tasks in this workspace / project scope assigned to users with estimated time and due dates
    tasks = db.query(Task).join(WorkspaceMember, WorkspaceMember.user_id == Task.assignee_id).filter(
        WorkspaceMember.workspace_id == workspace_id,
        Task.due_date.isnot(None),
        Task.estimated_time.isnot(None)
    ).all()
    
    events = []
    for task in tasks:
        assignee_name = task.assignee.full_name if task.assignee else "Unassigned"
        events.append({
            "task_id": task.id,
            "title": task.title,
            "due_date": task.due_date,
            "estimated_time": task.estimated_time,
            "assignee_id": task.assignee_id,
            "assignee_name": assignee_name
        })
    return events
