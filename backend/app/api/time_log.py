import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.time_log import TimeLog
from app.schemas.time_log import (
    TimeLogStartRequest,
    TimeLogManualRequest,
    TimeLogResponse,
    TimeTotalsResponse,
    ProductivityReportResponse,
    ProductivityReportItem
)

router = APIRouter(prefix="/time-logs", tags=["Time Tracking"])

@router.post(
    "/start",
    response_model=TimeLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start timer"
)
def start_timer(
    request: TimeLogStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Stop any active timers first
    active_logs = db.query(TimeLog).filter(
        TimeLog.user_id == current_user.id,
        TimeLog.is_running == True
    ).all()
    
    now = datetime.utcnow()
    for active in active_logs:
        active.is_running = False
        active.end_time = now
        active.duration_seconds = int((now.replace(tzinfo=None) - active.start_time.replace(tzinfo=None)).total_seconds())

    new_log = TimeLog(
        user_id=current_user.id,
        task_id=request.task_id,
        project_id=request.project_id,
        sprint_id=request.sprint_id,
        start_time=now,
        description=request.description,
        is_running=True
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.post(
    "/stop",
    response_model=TimeLogResponse,
    summary="Stop active timer"
)
def stop_timer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    active_log = db.query(TimeLog).filter(
        TimeLog.user_id == current_user.id,
        TimeLog.is_running == True
    ).first()

    if not active_log:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active timer segment is currently running."
        )

    now = datetime.utcnow()
    active_log.is_running = False
    active_log.end_time = now
    active_log.duration_seconds = int((now.replace(tzinfo=None) - active_log.start_time.replace(tzinfo=None)).total_seconds())
    
    db.commit()
    db.refresh(active_log)
    return active_log

@router.post(
    "/pause",
    response_model=TimeLogResponse,
    summary="Pause active timer"
)
def pause_timer(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Pausing is identical to stopping the current active segment
    return stop_timer(db, current_user)

@router.post(
    "/resume",
    response_model=TimeLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Resume timer"
)
def resume_timer(
    request: TimeLogStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Resume is starting a new active segment
    return start_timer(request, db, current_user)

@router.post(
    "/manual",
    response_model=TimeLogResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Manual time entry"
)
def manual_time_entry(
    request: TimeLogManualRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if request.end_time <= request.start_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End time must be after start time."
        )

    duration = int((request.end_time - request.start_time).total_seconds())
    new_log = TimeLog(
        user_id=current_user.id,
        task_id=request.task_id,
        project_id=request.project_id,
        sprint_id=request.sprint_id,
        start_time=request.start_time,
        end_time=request.end_time,
        duration_seconds=duration,
        description=request.description,
        is_running=False
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log

@router.get(
    "",
    response_model=List[TimeLogResponse],
    summary="List all time logs"
)
def list_time_logs(
    task_id: Optional[uuid.UUID] = None,
    project_id: Optional[uuid.UUID] = None,
    sprint_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(TimeLog).filter(TimeLog.user_id == current_user.id)
    if task_id:
        query = query.filter(TimeLog.task_id == task_id)
    if project_id:
        query = query.filter(TimeLog.project_id == project_id)
    if sprint_id:
        query = query.filter(TimeLog.sprint_id == sprint_id)
        
    return query.order_by(TimeLog.start_time.desc()).all()

@router.get(
    "/totals",
    response_model=TimeTotalsResponse,
    summary="Get total logged times per scope"
)
def get_time_totals(
    task_id: Optional[uuid.UUID] = None,
    sprint_id: Optional[uuid.UUID] = None,
    project_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task_seconds = 0
    if task_id:
        task_seconds = db.query(func.sum(TimeLog.duration_seconds)).filter(
            TimeLog.task_id == task_id
        ).scalar() or 0

    sprint_seconds = 0
    if sprint_id:
        sprint_seconds = db.query(func.sum(TimeLog.duration_seconds)).filter(
            TimeLog.sprint_id == sprint_id
        ).scalar() or 0

    project_seconds = 0
    if project_id:
        project_seconds = db.query(func.sum(TimeLog.duration_seconds)).filter(
            TimeLog.project_id == project_id
        ).scalar() or 0

    return {
        "total_task_seconds": task_seconds,
        "total_sprint_seconds": sprint_seconds,
        "total_project_seconds": project_seconds
    }

@router.get(
    "/today",
    response_model=dict,
    summary="Get today's total time"
)
def get_today_time(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.utcnow()
    day_start = datetime(today.year, today.month, today.day, 0, 0, 0)
    day_end = datetime(today.year, today.month, today.day, 23, 59, 59)

    logged = db.query(func.sum(TimeLog.duration_seconds)).filter(
        TimeLog.user_id == current_user.id,
        TimeLog.start_time >= day_start,
        TimeLog.start_time <= day_end
    ).scalar() or 0

    return {"total_seconds": logged}

@router.get(
    "/weekly",
    response_model=List[ProductivityReportItem],
    summary="Get weekly time logs"
)
def get_weekly_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.utcnow()
    weekly_items = []
    
    # Track daily logged seconds for the last 7 days (current week)
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, 0, 0, 0)
        day_end = datetime(day.year, day.month, day.day, 23, 59, 59)

        logged = db.query(func.sum(TimeLog.duration_seconds)).filter(
            TimeLog.user_id == current_user.id,
            TimeLog.start_time >= day_start,
            TimeLog.start_time <= day_end
        ).scalar() or 0
        
        weekly_items.append(
            ProductivityReportItem(
                date=day.strftime("%Y-%m-%d"),
                logged_seconds=logged
            )
        )

    return weekly_items

@router.get(
    "/report",
    response_model=ProductivityReportResponse,
    summary="Get productivity report data"
)
def get_productivity_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = datetime.utcnow()
    daily_items = []
    
    # Track daily logged seconds for the last 7 days
    total_seconds = 0
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = datetime(day.year, day.month, day.day, 0, 0, 0)
        day_end = datetime(day.year, day.month, day.day, 23, 59, 59)

        logged = db.query(func.sum(TimeLog.duration_seconds)).filter(
            TimeLog.user_id == current_user.id,
            TimeLog.start_time >= day_start,
            TimeLog.start_time <= day_end
        ).scalar() or 0
        
        total_seconds += logged
        daily_items.append(
            ProductivityReportItem(
                date=day.strftime("%Y-%m-%d"),
                logged_seconds=logged
            )
        )

    hours = round(total_seconds / 3600.0, 2)
    
    # Compute rating based on hours
    if hours >= 40.0:
        rating = "Elite"
    elif hours >= 25.0:
        rating = "High"
    elif hours >= 10.0:
        rating = "Moderate"
    else:
        rating = "Low"

    return {
        "daily_totals": daily_items,
        "productivity_rating": rating,
        "total_logged_hours": hours
    }
