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
    created_at: datetime

    class Config:
        from_attributes = True

class APIKeyCreateRequest(BaseModel):
    name: str

class APIKeyCreateResponse(BaseModel):
    id: uuid.UUID
    name: str
    token: str
    created_at: datetime

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
