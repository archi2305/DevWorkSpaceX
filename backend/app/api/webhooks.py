import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.dependencies.db import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.system_webhook import SystemWebhook
from app.models.activity import ActivityLog
from app.schemas.integration import (
    SystemWebhookCreate,
    SystemWebhookUpdate,
    SystemWebhookResponse,
    WebhookTestRequest,
)
from app.services.integration_service import get_workspace_id
from app.services.webhook_dispatcher import dispatch_webhook

router = APIRouter(prefix="/webhooks", tags=["Webhooks"])


@router.post("", response_model=SystemWebhookResponse, status_code=status.HTTP_201_CREATED)
def create_webhook(
    request: SystemWebhookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = get_workspace_id(db)
    webhook = SystemWebhook(
        workspace_id=ws_id,
        name=request.name,
        target_url=request.target_url,
        secret=request.secret,
        events=request.events or ["task.created", "task.updated", "task.completed"],
        is_active=request.is_active,
    )
    db.add(webhook)
    db.add(ActivityLog(
        user_id=current_user.id,
        action="Webhook Created",
        details=f"Created outbound webhook '{request.name}'.",
    ))
    db.commit()
    db.refresh(webhook)
    return webhook


@router.get("", response_model=List[SystemWebhookResponse])
def list_webhooks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = get_workspace_id(db)
    return db.query(SystemWebhook).filter(SystemWebhook.workspace_id == ws_id).all()


@router.put("/{id}", response_model=SystemWebhookResponse)
def update_webhook(
    id: uuid.UUID,
    request: SystemWebhookUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = get_workspace_id(db)
    webhook = db.query(SystemWebhook).filter(
        SystemWebhook.id == id,
        SystemWebhook.workspace_id == ws_id,
    ).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    for field in ("name", "target_url", "secret", "events", "is_active"):
        value = getattr(request, field)
        if value is not None:
            setattr(webhook, field, value)

    db.commit()
    db.refresh(webhook)
    return webhook


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_webhook(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = get_workspace_id(db)
    webhook = db.query(SystemWebhook).filter(
        SystemWebhook.id == id,
        SystemWebhook.workspace_id == ws_id,
    ).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    db.delete(webhook)
    db.commit()
    return None


@router.post("/{id}/test")
def test_webhook(
    id: uuid.UUID,
    request: WebhookTestRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ws_id = get_workspace_id(db)
    webhook = db.query(SystemWebhook).filter(
        SystemWebhook.id == id,
        SystemWebhook.workspace_id == ws_id,
    ).first()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    payload = request.payload or {
        "message": "Test webhook from DevWorkspace X",
        "triggered_by": current_user.email,
    }
    payload["timestamp"] = datetime.utcnow().isoformat()

    result = dispatch_webhook(webhook, request.event, payload)
    if not result.get("success"):
        raise HTTPException(status_code=502, detail=result.get("error", "Webhook delivery failed"))
    return result
