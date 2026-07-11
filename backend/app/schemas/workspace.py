import uuid
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel

class WorkspaceSettingsResponse(BaseModel):
    id: uuid.UUID
    name: str
    logo_url: Optional[str] = None
    theme: str
    accent_color: str
    timezone: str
    allow_member_invites: bool
    enable_email_notifications: bool
    enable_desktop_notifications: bool

    class Config:
        from_attributes = True

class WorkspaceSettingsUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    theme: Optional[str] = None
    accent_color: Optional[str] = None
    timezone: Optional[str] = None
    allow_member_invites: Optional[bool] = None
    enable_email_notifications: Optional[bool] = None
    enable_desktop_notifications: Optional[bool] = None

class APIKeyResponse(BaseModel):
    id: uuid.UUID
    name: str
    key_prefix: str
    expires_at: Optional[datetime] = None
    scopes: Optional[List[str]] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class APIKeyCreateRequest(BaseModel):
    name: str
    expires_in_days: Optional[int] = None
    scopes: Optional[List[str]] = None

class APIKeyCreateResponse(BaseModel):
    id: uuid.UUID
    name: str
    token: str
    expires_at: Optional[datetime] = None
    scopes: Optional[List[str]] = None
    created_at: datetime

class APIKeyUsageHistoryResponse(BaseModel):
    id: uuid.UUID
    api_key_id: uuid.UUID
    endpoint: str
    method: str
    status_code: int
    used_at: datetime

    class Config:
        from_attributes = True

class UserSessionResponse(BaseModel):
    id: uuid.UUID
    user_agent: str
    ip_address: str
    last_active: datetime

    class Config:
        from_attributes = True

class ConnectedAccountResponse(BaseModel):
    id: uuid.UUID
    provider: str
    username: str
    connected_at: datetime

    class Config:
        from_attributes = True

class ConnectedAccountCreateRequest(BaseModel):
    provider: str
    username: str

class WorkspaceInvitationCreate(BaseModel):
    email: str
    role: str # Owner, Admin, Developer, Viewer

class WorkspaceInvitationResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    email: str
    role: str
    token: str
    invited_by_id: uuid.UUID
    status: str
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True
