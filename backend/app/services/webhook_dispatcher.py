import hashlib
import hmac
import json
import uuid
import urllib.request
from typing import Any

from sqlalchemy.orm import Session

from app.models.system_webhook import SystemWebhook
from app.models.workspace import Workspace


def get_workspace_id(db: Session) -> uuid.UUID:
    ws = db.query(Workspace).first()
    if not ws:
        raise ValueError("Workspace not found")
    return ws.id


def dispatch_webhook(
    webhook: SystemWebhook,
    event: str,
    payload: dict[str, Any],
) -> dict:
    body = json.dumps({
        "event": event,
        "timestamp": payload.get("timestamp"),
        "data": payload,
    }).encode()

    headers = {"Content-Type": "application/json", "X-Webhook-Event": event}
    if webhook.secret:
        signature = hmac.new(webhook.secret.encode(), body, hashlib.sha256).hexdigest()
        headers["X-Webhook-Signature"] = f"sha256={signature}"

    req = urllib.request.Request(webhook.target_url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return {"success": True, "status_code": resp.status}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def dispatch_event_to_workspace(
    db: Session,
    event: str,
    payload: dict[str, Any],
) -> list[dict]:
    ws_id = get_workspace_id(db)
    webhooks = db.query(SystemWebhook).filter(
        SystemWebhook.workspace_id == ws_id,
        SystemWebhook.is_active == True,
    ).all()

    results = []
    for wh in webhooks:
        events = wh.events or []
        if events and event not in events:
            continue
        result = dispatch_webhook(wh, event, payload)
        results.append({"webhook_id": str(wh.id), "name": wh.name, **result})
    return results
