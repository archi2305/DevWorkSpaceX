import uuid
from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.workspace_member import WorkspaceMember
from app.models.activity import ActivityLog

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get(
    "/summary",
    summary="Get aggregated workspace analytics"
)
def get_analytics_summary(
    project_id: Optional[uuid.UUID] = None,
    workspace_id: Optional[uuid.UUID] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Exposes SQL-aggregated metrics: Completed tasks trends, team workloads, project progressions, burndown timelines, and velocity indices.
    """
    # 1. Parsing dates
    today = datetime.utcnow()
    start_dt = today - timedelta(days=30)
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace("Z", ""))
        except ValueError:
            pass
            
    end_dt = today
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date.replace("Z", ""))
        except ValueError:
            pass

    # 2. Filter builders
    task_filters = []
    if project_id:
        task_filters.append(Task.project_id == project_id)
    elif workspace_id:
        project_ids_subquery = db.query(Project.id).filter(Project.workspace_id == workspace_id).scalar_subquery()
        task_filters.append(Task.project_id.in_(project_ids_subquery))
        
    # Overdue tasks scanner in Python
    all_incomplete_tasks = db.query(Task).filter(
        *task_filters,
        Task.completed == False,
        Task.due_date != None
    ).all()
    
    overdue_count = 0
    overdue_tasks = []
    
    for t in all_incomplete_tasks:
        try:
            # Parse ISO format date string safely
            task_date = datetime.fromisoformat(t.due_date.replace("Z", ""))
            if task_date.date() < today.date():
                overdue_count += 1
                days_over = (today.date() - task_date.date()).days
                overdue_tasks.append({
                    "title": t.title,
                    "due_date": t.due_date[:10],
                    "days_overdue": days_over
                })
        except Exception:
            pass
            
    # Sort overdue tasks by severity (days overdue descending) and slice to 5 items
    overdue_tasks.sort(key=lambda x: x["days_overdue"], reverse=True)
    overdue_tasks = overdue_tasks[:5]

    # 3. Project Progressions
    project_progress = []
    projects_query = db.query(Project)
    if project_id:
        projects_query = projects_query.filter(Project.id == project_id)
    elif workspace_id:
        projects_query = projects_query.filter(Project.workspace_id == workspace_id)
        
    for p in projects_query.all():
        total_tasks = db.query(func.count(Task.id)).filter(Task.project_id == p.id).scalar() or 0
        done_tasks = db.query(func.count(Task.id)).filter(Task.project_id == p.id, Task.completed == True).scalar() or 0
        project_progress.append({
            "project_name": p.name,
            "progress": p.progress,
            "status": p.status,
            "total_tasks": total_tasks,
            "completed_tasks": done_tasks
        })

    # 4. Completed Tasks Trend (last 7 days)
    completed_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, 0, 0, 0)
        day_end = datetime(day.year, day.month, day.day, 23, 59, 59)
        
        count = db.query(func.count(Task.id)).filter(
            *task_filters,
            Task.completed == True,
            Task.updated_at >= day_start,
            Task.updated_at <= day_end
        ).scalar() or 0
        
        completed_trend.append({
            "date": day.strftime("%Y-%m-%d"),
            "count": count
        })

    # 5. Velocity estimation (tasks completed per week over the last 4 weeks)
    velocity_data = []
    for week_idx in range(4):
        w_start = today - timedelta(days=(week_idx + 1) * 7)
        w_end = today - timedelta(days=week_idx * 7)
        
        completed_in_week = db.query(func.count(Task.id)).filter(
            *task_filters,
            Task.completed == True,
            Task.updated_at >= w_start,
            Task.updated_at <= w_end
        ).scalar() or 0
        
        velocity_data.append({
            "week": f"Week -{week_idx}",
            "completed": completed_in_week
        })
    velocity_data.reverse()

    # 6. Burn-down chart timeline simulation (tasks remaining day-by-day for last 10 days)
    burndown_data = []
    total_active_tasks = db.query(func.count(Task.id)).filter(*task_filters).scalar() or 0
    
    for i in range(9, -1, -1):
        day_limit = today - timedelta(days=i)
        
        # Count tasks completed *after* this day_limit (to see how many were still pending on that day)
        completed_after = db.query(func.count(Task.id)).filter(
            *task_filters,
            Task.completed == True,
            Task.updated_at > day_limit
        ).scalar() or 0
        
        # Count tasks created *after* this day_limit (subtract to roll back creation)
        created_after = db.query(func.count(Task.id)).filter(
            *task_filters,
            Task.created_at > day_limit
        ).scalar() or 0
        
        remaining = total_active_tasks - (total_active_tasks - completed_after - created_after)
        # Ideal line simulation
        ideal = int(total_active_tasks * (i / 10))
        
        burndown_data.append({
            "day": day_limit.strftime("%b %d"),
            "remaining": max(0, remaining),
            "ideal": ideal
        })

    # 7. Team Workloads (task splits per assignee)
    workload_data = []
    members = db.query(User).all()
    for m in members:
        assigned = db.query(func.count(Task.id)).filter(*task_filters, Task.assignee_id == m.id).scalar() or 0
        done = db.query(func.count(Task.id)).filter(*task_filters, Task.assignee_id == m.id, Task.completed == True).scalar() or 0
        
        if assigned > 0:
            workload_data.append({
                "member_name": m.full_name,
                "assigned": assigned,
                "completed": done,
                "pending": assigned - done
            })

    # 8. Most Active Members (Activity Log frequencies)
    active_members = []
    activity_aggregation = db.query(
        User.full_name,
        func.count(ActivityLog.id).label("actions")
    ).join(ActivityLog, ActivityLog.user_id == User.id).group_by(User.full_name).order_by(func.count(ActivityLog.id).desc()).limit(5).all()
    
    for row in activity_aggregation:
        active_members.append({
            "name": row[0],
            "actions": row[1]
        })



    return {
        "overdue_count": overdue_count,
        "project_progress": project_progress,
        "completed_trend": completed_trend,
        "velocity": velocity_data,
        "burndown": burndown_data,
        "workload": workload_data,
        "most_active_members": active_members,
        "overdue_tasks": overdue_tasks
    }
