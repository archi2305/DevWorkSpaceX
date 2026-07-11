import uuid
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, status, HTTPException, Request
from sqlalchemy.orm import Session
from typing import List
from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.project import Project
from app.models.task import Task
from app.models.document import Document
from app.models.workspace import Workspace, APIKey, UserSession, ConnectedAccount
from app.schemas.workspace import (
    WorkspaceSettingsResponse,
    WorkspaceSettingsUpdate,
    APIKeyResponse,
    APIKeyCreateRequest,
    APIKeyCreateResponse,
    UserSessionResponse,
    ConnectedAccountResponse,
    ConnectedAccountCreateRequest
)

router = APIRouter(prefix="/workspace", tags=["Workspace Settings"])

def _get_or_create_default_workspace(db: Session) -> Workspace:
    ws = db.query(Workspace).first()
    if not ws:
        ws = Workspace(
            name="My Workspace",
            theme="dark",
            timezone="UTC",
            allow_member_invites=True
        )
        db.add(ws)
        db.commit()
        db.refresh(ws)
    return ws

@router.get(
    "/settings",
    response_model=WorkspaceSettingsResponse,
    summary="Get workspace settings"
)
def get_settings(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns settings for the active workspace. Generates a default configuration if none exists.
    """
    return _get_or_create_default_workspace(db)

@router.patch(
    "/settings",
    response_model=WorkspaceSettingsResponse,
    summary="Update workspace settings"
)
def update_settings(
    request: WorkspaceSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Updates the workspace configuration parameters.
    """
    ws = _get_or_create_default_workspace(db)
    
    update_data = request.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ws, key, value)
        
    db.commit()
    db.refresh(ws)
    return ws

@router.delete(
    "/settings",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete workspace"
)
def delete_workspace(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Destroys the workspace and cascade purges all data.
    """
    ws = db.query(Workspace).first()
    if ws:
        db.delete(ws)
        db.commit()
    return None

import hashlib

@router.get(
    "/api-keys",
    response_model=List[APIKeyResponse],
    summary="List active API keys"
)
def list_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = _get_or_create_default_workspace(db)
    return db.query(APIKey).filter(APIKey.workspace_id == ws.id).all()

@router.post(
    "/api-keys",
    response_model=APIKeyCreateResponse,
    summary="Generate API key"
)
def create_api_key(
    request: APIKeyCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ws = _get_or_create_default_workspace(db)
    
    # Generate token
    raw_token = f"ak_live_{secrets.token_urlsafe(32)}"
    prefix = raw_token[:12]
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()
    
    expires_at = None
    if request.expires_in_days:
        expires_at = datetime.utcnow() + timedelta(days=request.expires_in_days)

    new_key = APIKey(
        workspace_id=ws.id,
        name=request.name,
        key_prefix=prefix,
        token=hashed_token,
        expires_at=expires_at,
        scopes=request.scopes or ["read"]
    )
    db.add(new_key)
    db.commit()
    db.refresh(new_key)
    
    return APIKeyCreateResponse(
        id=new_key.id,
        name=new_key.name,
        token=raw_token, # Return raw token ONCE!
        expires_at=new_key.expires_at,
        scopes=new_key.scopes,
        created_at=new_key.created_at
    )

@router.post(
    "/api-keys/{key_id}/rotate",
    response_model=APIKeyCreateResponse,
    summary="Rotate developer API key"
)
def rotate_api_key(
    key_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=404, detail="API Key not found")
        
    # Generate new raw token
    raw_token = f"ak_live_{secrets.token_urlsafe(32)}"
    prefix = raw_token[:12]
    hashed_token = hashlib.sha256(raw_token.encode()).hexdigest()

    key.key_prefix = prefix
    key.token = hashed_token
    db.commit()
    db.refresh(key)

    return APIKeyCreateResponse(
        id=key.id,
        name=key.name,
        token=raw_token, # Return new raw token ONCE!
        expires_at=key.expires_at,
        scopes=key.scopes,
        created_at=key.created_at
    )

@router.delete(
    "/api-keys/{key_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke API key"
)
def revoke_api_key(
    key_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    key = db.query(APIKey).filter(APIKey.id == key_id).first()
    if not key:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="API Key not found"
        )
    db.delete(key)
    db.commit()
    return None

@router.get(
    "/api-keys/{key_id}/history",
    response_model=List[APIKeyUsageHistoryResponse],
    summary="List API Key usage history"
)
def get_api_key_usage_history(
    key_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from app.models.workspace import APIKeyUsageHistory
    return db.query(APIKeyUsageHistory).filter(APIKeyUsageHistory.api_key_id == key_id).order_by(APIKeyUsageHistory.used_at.desc()).all()

@router.get(
    "/sessions",
    response_model=List[UserSessionResponse],
    summary="List active user sessions"
)
def get_user_sessions(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists the current user's active device sessions.
    """
    sessions = db.query(UserSession).filter(UserSession.user_id == current_user.id).all()
    if not sessions:
        # Create a default session representing their current request
        user_agent = request.headers.get("user-agent", "Unknown Browser")
        ip = request.client.host if request.client else "127.0.0.1"
        sess = UserSession(
            user_id=current_user.id,
            user_agent=user_agent[:450],
            ip_address=ip
        )
        db.add(sess)
        db.commit()
        sessions = [sess]
        
    return sessions

@router.get(
    "/connected-accounts",
    response_model=List[ConnectedAccountResponse],
    summary="List connected accounts"
)
def list_connected_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists third-party accounts (GitHub, Slack) integrated with the user profile.
    """
    return db.query(ConnectedAccount).filter(ConnectedAccount.user_id == current_user.id).all()

@router.post(
    "/connected-accounts",
    response_model=ConnectedAccountResponse,
    summary="Connect third-party account"
)
def connect_account(
    request: ConnectedAccountCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Links a new developer profile integration.
    """
    existing = db.query(ConnectedAccount).filter(
        ConnectedAccount.user_id == current_user.id,
        ConnectedAccount.provider == request.provider
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Already connected a {request.provider} account."
        )
        
    new_conn = ConnectedAccount(
        user_id=current_user.id,
        provider=request.provider,
        username=request.username
    )
    db.add(new_conn)
    db.commit()
    db.refresh(new_conn)
    return new_conn

@router.delete(
    "/connected-accounts/{account_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Disconnect account"
)
def disconnect_account(
    account_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Removes third-party account bindings.
    """
    conn = db.query(ConnectedAccount).filter(
        ConnectedAccount.id == account_id,
        ConnectedAccount.user_id == current_user.id
    ).first()
    if not conn:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account connection not found"
        )
    db.delete(conn)
    db.commit()
    return None

@router.post(
    "/export",
    summary="Export workspace data"
)
def export_workspace_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compiles a comprehensive workspace backup containing project listings, tasks, and document logs.
    """
    projects = db.query(Project).all()
    tasks = db.query(Task).all()
    docs = db.query(Document).all()
    
    export_payload = {
        "export_metadata": {
            "timestamp": get_settings(db, current_user).created_at.isoformat(),
            "exported_by": current_user.email,
        },
        "projects": [
            {
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "status": p.status,
                "progress": p.progress
            } for p in projects
        ],
        "tasks": [
            {
                "id": str(t.id),
                "title": t.title,
                "status": t.status,
                "priority": t.priority,
                "completed": t.completed
            } for t in tasks
        ],
        "documents": [
            {
                "id": str(d.id),
                "title": d.title,
                "version": d.version
            } for d in docs
        ]
    }
    
    return {
        "message": "Export compiled successfully.",
        "payload": export_payload
    }
