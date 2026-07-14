import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, status, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import io
import csv

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.activity import ActivityLog
from app.schemas.activity import ActivityResponse

router = APIRouter(prefix="/activities", tags=["Activity Timeline"])

@router.get(
    "",
    response_model=List[ActivityResponse],
    summary="Get activity timeline logs"
)
def get_activity_timeline(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    user_id: Optional[uuid.UUID] = None,
    target_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns workspace activity logs with filters, support for infinite scrolling, and author metadata.
    """
    query = db.query(ActivityLog)
    
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if target_type:
        query = query.filter(ActivityLog.target_type == target_type)
        
    return query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit).all()

@router.get(
    "/audit",
    response_model=List[ActivityResponse],
    summary="Get filtered audit logs with comprehensive filtering"
)
def get_audit_logs(
    start_date: Optional[str] = Query(None, description="Start date in ISO format"),
    end_date: Optional[str] = Query(None, description="End date in ISO format"),
    user_id: Optional[uuid.UUID] = Query(None, description="Filter by user ID"),
    category: Optional[str] = Query(None, description="Filter by category (login, permission, project, task, document)"),
    event_type: Optional[str] = Query(None, description="Filter by event type (create, update, delete, view, export)"),
    target_type: Optional[str] = Query(None, description="Filter by target type"),
    action: Optional[str] = Query(None, description="Filter by action text"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of logs to return"),
    offset: int = Query(0, ge=0, description="Number of logs to skip"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns audit logs with comprehensive filtering options for the audit dashboard.
    Supports date range, user, category, event type, and target type filtering.
    """
    query = db.query(ActivityLog)
    
    # Date range filtering
    if start_date:
        try:
            dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            query = query.filter(ActivityLog.created_at >= dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            query = query.filter(ActivityLog.created_at <= dt)
        except ValueError:
            pass
    
    # User filtering
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    
    # Category filtering
    if category:
        query = query.filter(ActivityLog.category == category)
    
    # Event type filtering
    if event_type:
        query = query.filter(ActivityLog.event_type == event_type)
    
    # Target type filtering
    if target_type:
        query = query.filter(ActivityLog.target_type == target_type)
    
    # Action text filtering
    if action:
        query = query.filter(ActivityLog.action.ilike(f"%{action}%"))
        
    return query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit).all()

@router.get(
    "/audit/stats",
    summary="Get audit log statistics"
)
def get_audit_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns statistics for audit dashboard including counts by category and event type.
    """
    query = db.query(ActivityLog)
    
    if start_date:
        try:
            dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            query = query.filter(ActivityLog.created_at >= dt)
        except ValueError:
            pass
    
    if end_date:
        try:
            dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            query = query.filter(ActivityLog.created_at <= dt)
        except ValueError:
            pass
    
    total_logs = query.count()
    
    # Count by category
    category_counts = {}
    for cat in ['login', 'permission', 'project', 'task', 'document']:
        count = query.filter(ActivityLog.category == cat).count()
        if count > 0:
            category_counts[cat] = count
    
    # Count by event type
    event_type_counts = {}
    for event in ['create', 'update', 'delete', 'view', 'export', 'login']:
        count = query.filter(ActivityLog.event_type == event).count()
        if count > 0:
            event_type_counts[event] = count
    
    return {
        "total_logs": total_logs,
        "category_counts": category_counts,
        "event_type_counts": event_type_counts
    }

@router.get(
    "/audit/export",
    summary="Export audit logs to CSV format"
)
def export_audit_logs(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    user_id: Optional[uuid.UUID] = Query(None),
    category: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    target_type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export filtered audit logs to CSV format with all available fields.
    """
    logs = get_audit_logs(
        start_date=start_date,
        end_date=end_date,
        user_id=user_id,
        category=category,
        event_type=event_type,
        target_type=target_type,
        action=action,
        limit=10000,
        offset=0,
        db=db,
        current_user=current_user
    )

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write CSV Header
    writer.writerow([
        "Log ID", "User ID", "User Name", "User Email", "Category", "Event Type",
        "Action", "Details", "Target Type", "Target Name", "Target ID",
        "IP Address", "User Agent", "Timestamp"
    ])
    
    # Write rows
    for log in logs:
        user_name = log.user.full_name if log.user else "System"
        user_email = log.user.email if log.user else "system@local"
        writer.writerow([
            str(log.id),
            str(log.user_id),
            user_name,
            user_email,
            log.category or "",
            log.event_type or "",
            log.action,
            log.details,
            log.target_type or "",
            log.target_name or "",
            str(log.target_id) if log.target_id else "",
            log.ip_address or "",
            log.user_agent or "",
            log.created_at.isoformat()
        ])
        
    output.seek(0)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=audit_logs_{timestamp}.csv"}
    )
