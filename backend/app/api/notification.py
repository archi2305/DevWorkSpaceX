import uuid
from jose import jwt, JWTError
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.schemas.dashboard_unified import NotificationResponse
from app.core.config import settings

router = APIRouter(prefix="/notifications", tags=["Notifications"])

# Real-time WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        # Maps user_id -> list of active WebSocket connections
        self.active_connections: dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)

    def disconnect(self, websocket: WebSocket, user_id: uuid.UUID):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]

    async def send_personal_message(self, message: dict, user_id: uuid.UUID):
        if user_id in self.active_connections:
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    pass

manager = ConnectionManager()

import asyncio

# Global notification dispatcher helper
def dispatch_notification(
    db: Session,
    user_id: uuid.UUID,
    title: str,
    message: str,
    notification_type: str = "Info"
):
    """
    Saves a notification to PostgreSQL and pushes it in real-time if a WebSocket is active.
    """
    notif = Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notification_type,
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    
    # Push real-time payload
    payload = {
        "id": str(notif.id),
        "title": notif.title,
        "message": notif.message,
        "type": notif.type,
        "is_read": notif.is_read,
        "created_at": notif.created_at.isoformat()
    }
    
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.create_task(manager.send_personal_message(payload, user_id))
        else:
            loop.run_until_complete(manager.send_personal_message(payload, user_id))
    except Exception:
        pass
        
    return notif

@router.get(
    "",
    response_model=List[NotificationResponse],
    summary="Get user notifications"
)
def get_notifications(
    is_read: Optional[bool] = None,
    type_filter: Optional[str] = None, # Mention, Reminder, Info
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List user workspace notifications. Supports filtering by read state and categories.
    """
    query = db.query(Notification).filter(Notification.user_id == current_user.id)
    if is_read is not None:
        query = query.filter(Notification.is_read == is_read)
    if type_filter:
        query = query.filter(Notification.type == type_filter)
        
    return query.order_by(Notification.created_at.desc()).all()

@router.post(
    "/{notification_id}/read",
    response_model=NotificationResponse,
    summary="Mark single notification read"
)
def mark_notification_read(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks a single workspace notification read.
    """
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
        
    notif.is_read = True
    db.commit()
    db.refresh(notif)
    return notif

@router.post(
    "/read-all",
    status_code=status.HTTP_200_OK,
    summary="Mark all notifications read"
)
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks all unread notifications for the querying user as read.
    """
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"message": "All notifications marked as read"}

@router.get(
    "/unread-count",
    summary="Get unread notification count"
)
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns the total unread notification count.
    """
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    return {"count": count}

@router.delete(
    "/{notification_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a notification"
)
def delete_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Deletes a notification record from PostgreSQL.
    """
    notif = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
        
    db.delete(notif)
    db.commit()
    return

async def websocket_endpoint(
    websocket: WebSocket,
    token: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time notifications streaming.
    Pass token as query param, e.g. ws://127.0.0.1:8000/notifications/ws?token=...
    """
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = uuid.UUID(user_id_str)
    except Exception:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
        
    await manager.connect(websocket, user_id)
    
    try:
        while True:
            # Keep connection alive; discard incoming text
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
