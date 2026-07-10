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
