import uuid
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
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
    summary="Get filtered immutable audit logs"
)
def get_audit_logs(
    user_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(ActivityLog)
    if user_id:
        query = query.filter(ActivityLog.user_id == user_id)
    if action:
        query = query.filter(ActivityLog.action.ilike(f"%{action}%"))
    if target_type:
        query = query.filter(ActivityLog.target_type == target_type)
    if start_date:
        try:
            dt = datetime.fromisoformat(start_date.replace("Z", ""))
            query = query.filter(ActivityLog.created_at >= dt)
        except ValueError:
            pass
    if end_date:
        try:
            dt = datetime.fromisoformat(end_date.replace("Z", ""))
            query = query.filter(ActivityLog.created_at <= dt)
        except ValueError:
            pass
            
    return query.order_by(ActivityLog.created_at.desc()).all()

@router.get(
    "/audit/export",
    summary="Export audit logs to CSV format"
)
def export_audit_logs(
    user_id: Optional[uuid.UUID] = None,
    action: Optional[str] = None,
    target_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from fastapi.responses import StreamingResponse
    import io
    import csv

    logs = get_audit_logs(
        user_id=user_id,
        action=action,
        target_type=target_type,
        start_date=start_date,
        end_date=end_date,
        db=db,
        current_user=current_user
    )

    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write CSV Header
    writer.writerow(["Log ID", "User ID", "User Name", "Action Triggered", "Description Details", "Target Type", "Target Name", "Timestamp"])
    
    # Write rows
    for log in logs:
        user_name = log.user.full_name if log.user else "System"
        writer.writerow([
            str(log.id),
            str(log.user_id),
            user_name,
            log.action,
            log.details,
            log.target_type or "",
            log.target_name or "",
            log.created_at.isoformat()
        ])
        
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=audit_logs_export.csv"}
    )
