import uuid
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.integration import Integration
from app.models.activity import ActivityLog
from app.schemas.integration import (
    IntegrationCreate,
    IntegrationUpdate,
    IntegrationResponse,
    ProviderInfo,
    OAuthInitiateResponse,
    OAuthCallbackRequest,
)
from app.services import integration_service as svc
from app.services.integrations.registry import get_provider, normalize_provider

router = APIRouter(prefix="/integrations", tags=["Integrations"])


@router.get("/providers", response_model=List[ProviderInfo], summary="List available integration providers")
def list_providers(current_user: User = Depends(get_current_user)):
    return svc.get_available_providers()


@router.get("/{provider}/oauth/url", response_model=OAuthInitiateResponse, summary="Initiate OAuth flow")
def get_oauth_url(
    provider: str,
    current_user: User = Depends(get_current_user),
):
    try:
        return svc.initiate_oauth(provider, current_user.id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("/{provider}/oauth/callback", response_model=IntegrationResponse, summary="Complete OAuth flow")
def oauth_callback(
    provider: str,
    request: OAuthCallbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        integration = svc.complete_oauth(
            db, provider, request.code, request.state, current_user
        )
        return svc.sanitize_integration(integration)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.post("", response_model=IntegrationResponse, status_code=status.HTTP_201_CREATED, summary="Create integration")
def create_integration(
    request: IntegrationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        integration = svc.create_integration(
            db, request.provider, request.config, current_user
        )
        return svc.sanitize_integration(integration)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.get("", response_model=List[IntegrationResponse], summary="List workspace integrations")
def list_integrations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = svc.get_workspace_id(db)
    integrations = db.query(Integration).filter(Integration.workspace_id == ws_id).all()
    return [svc.sanitize_integration(i) for i in integrations]


@router.put("/{id}", response_model=IntegrationResponse, summary="Update integration")
def update_integration(
    id: uuid.UUID,
    request: IntegrationUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = svc.get_workspace_id(db)
    integration = db.query(Integration).filter(
        Integration.id == id,
        Integration.workspace_id == ws_id,
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    if request.status is not None:
        integration.status = request.status
    if request.config is not None:
        provider = get_provider(integration.provider)
        integration.config = provider.validate_config(request.config)

    log = ActivityLog(
        user_id=current_user.id,
        action="Integration Updated",
        details=f"Updated {integration.provider} integration.",
    )
    db.add(log)
    db.commit()
    db.refresh(integration)
    return svc.sanitize_integration(integration)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT, summary="Remove integration")
def delete_integration(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = svc.get_workspace_id(db)
    integration = db.query(Integration).filter(
        Integration.id == id,
        Integration.workspace_id == ws_id,
    ).first()
    if not integration:
        raise HTTPException(status_code=404, detail="Integration not found")

    db.delete(integration)
    log = ActivityLog(
        user_id=current_user.id,
        action="Integration Removed",
        details=f"Removed {integration.provider} integration.",
    )
    db.add(log)
    db.commit()
    return None
