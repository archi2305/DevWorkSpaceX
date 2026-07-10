import uuid
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Set
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from jose import jwt, JWTError
from app.core.config import settings

router = APIRouter(prefix="/collaboration", tags=["Real-Time Collaboration"])

class CollaborationManager:
    def __init__(self):
        # Maps user_id -> set of active WebSockets
        self.user_sockets: Dict[uuid.UUID, Set[WebSocket]] = {}
        # Maps socket -> user dict info (id, name, email)
        self.socket_users: Dict[WebSocket, dict] = {}

    async def connect(self, websocket: WebSocket, user: User):
        await websocket.accept()
        user_info = {
            "id": str(user.id),
            "full_name": user.full_name,
            "email": user.email
        }
        self.socket_users[websocket] = user_info
        if user.id not in self.user_sockets:
            self.user_sockets[user.id] = set()
        self.user_sockets[user.id].add(websocket)
        
        # Broadcast presence list update
        await self.broadcast_online_users()

    async def disconnect(self, websocket: WebSocket):
        user_info = self.socket_users.pop(websocket, None)
        if user_info:
            uid = uuid.UUID(user_info["id"])
            if uid in self.user_sockets:
                self.user_sockets[uid].discard(websocket)
                if not self.user_sockets[uid]:
                    del self.user_sockets[uid]
        # Broadcast presence list update
        await self.broadcast_online_users()

    async def broadcast_online_users(self):
        online_list = list(self.socket_users.values())
        # De-duplicate by user ID
        unique_online = {u["id"]: u for u in online_list}.values()
        payload = {
            "type": "presence",
            "users": list(unique_online)
        }
        await self.broadcast(payload)

    async def broadcast(self, message: dict, exclude_socket: WebSocket = None):
        data = json.dumps(message)
        dead_sockets = []
        for socket in list(self.socket_users.keys()):
            if socket == exclude_socket:
                continue
            try:
                await socket.send_text(data)
            except Exception:
                dead_sockets.append(socket)
                
        for socket in dead_sockets:
            await self.disconnect(socket)

manager = CollaborationManager()

@router.websocket("/ws")
async def websocket_collaboration(websocket: WebSocket, token: str, db: Session = Depends(get_db)):
    """
    WebSocket endpoint managing Kanban tasks sync, comments, typing indicators, and user presence.
    """
    # 1. Authorize JWT token
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id_str: str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        user_id = uuid.UUID(user_id_str)
    except (JWTError, ValueError):
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Verify user exists in database
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Register socket connection
    await manager.connect(websocket, user)

    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                event = json.loads(raw_data)
                event_type = event.get("type")
                
                # Attach sender details for client trust
                event["sender"] = {
                    "id": str(user.id),
                    "full_name": user.full_name
                }
                
                # Broadcast real-time events to all other connected participants
                if event_type in ["typing", "kanban_update", "comment_added", "dashboard_refresh"]:
                    await manager.broadcast(event, exclude_socket=websocket)
            except (json.JSONDecodeError, KeyError):
                # Ignore malformed events
                pass
    except WebSocketDisconnect:
        await manager.disconnect(websocket)
