import uuid
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class IntegrationCreate(BaseModel):
    provider: str
    config: Dict[str, Any]


class IntegrationUpdate(BaseModel):
    status: Optional[str] = None
    config: Optional[Dict[str, Any]] = None


class IntegrationResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    provider: str
    display_name: str
    status: str
    config: Optional[Dict[str, Any]] = None
    supports_oauth: bool = False
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProviderInfo(BaseModel):
    slug: str
    display_name: str
    supports_oauth: bool
    oauth_scopes: List[str] = []


class OAuthInitiateResponse(BaseModel):
    provider: str
    authorize_url: str
    state: str
    mock_mode: bool = False


class OAuthCallbackRequest(BaseModel):
    code: str
    state: str


class SystemWebhookCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_url: str = Field(..., min_length=1, max_length=1024)
    secret: Optional[str] = None
    events: Optional[List[str]] = None
    is_active: bool = True


class SystemWebhookUpdate(BaseModel):
    name: Optional[str] = None
    target_url: Optional[str] = None
    secret: Optional[str] = None
    events: Optional[List[str]] = None
    is_active: Optional[bool] = None


class SystemWebhookResponse(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    target_url: str
    secret: Optional[str] = None
    events: Optional[List[str]] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WebhookTestRequest(BaseModel):
    event: str = "test.ping"
    payload: Optional[Dict[str, Any]] = None
