import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.activity import ActivityLog
from app.models.integration import Integration
from app.models.user import User
from app.models.workspace import Workspace
from app.services.integrations.oauth import generate_oauth_state
from app.services.integrations.registry import get_provider, list_providers, normalize_provider

# In-memory OAuth state store (use Redis in production)
_oauth_states: dict[str, dict] = {}


def get_workspace_id(db: Session) -> uuid.UUID:
    ws = db.query(Workspace).first()
    if not ws:
        ws = Workspace(name="Default Workspace")
        db.add(ws)
        db.commit()
        db.refresh(ws)
    return ws.id


def get_available_providers() -> list[dict]:
    return list_providers()


def initiate_oauth(provider_slug: str, user_id: uuid.UUID) -> dict:
    provider = get_provider(provider_slug)
    if not provider.supports_oauth:
        raise ValueError(f"{provider.display_name} does not support OAuth")

    state = generate_oauth_state()
    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE_URL}/settings?tab=integrations"

    _oauth_states[state] = {
        "provider": provider.slug,
        "user_id": str(user_id),
        "created_at": datetime.utcnow().isoformat(),
    }

    authorize_url = provider.get_oauth_authorize_url(state, redirect_uri)
    mock_mode = authorize_url is None

    if mock_mode:
        authorize_url = (
            f"{settings.OAUTH_REDIRECT_BASE_URL}/settings"
            f"?tab=integrations&provider={provider.slug}&code=mock_{state[:16]}&state={state}"
        )

    return {
        "provider": provider.slug,
        "authorize_url": authorize_url,
        "state": state,
        "mock_mode": mock_mode,
    }


def complete_oauth(
    db: Session,
    provider_slug: str,
    code: str,
    state: str,
    current_user: User,
) -> Integration:
    stored = _oauth_states.pop(state, None)
    if not stored:
        raise ValueError("Invalid or expired OAuth state")

    if stored["user_id"] != str(current_user.id):
        raise ValueError("OAuth state does not match current user")

    slug = normalize_provider(provider_slug)
    if stored["provider"] != slug:
        raise ValueError("OAuth state provider mismatch")

    provider = get_provider(slug)
    redirect_uri = f"{settings.OAUTH_REDIRECT_BASE_URL}/settings?tab=integrations"
    credentials = provider.exchange_oauth_code(code, redirect_uri)
    config = provider.build_config_from_oauth(credentials)
    validated = provider.validate_config(config)

    ws_id = get_workspace_id(db)
    integration = db.query(Integration).filter(
        Integration.workspace_id == ws_id,
        Integration.provider == slug,
    ).first()

    if integration:
        integration.config = validated
        integration.status = "Active"
    else:
        integration = Integration(
            workspace_id=ws_id,
            provider=slug,
            status="Active",
            config=validated,
        )
        db.add(integration)

    log = ActivityLog(
        user_id=current_user.id,
        action="Integration OAuth Connected",
        details=f"Connected {provider.display_name} via OAuth.",
    )
    db.add(log)
    db.commit()
    db.refresh(integration)
    return integration


def create_integration(
    db: Session,
    provider_slug: str,
    config: dict,
    current_user: User,
) -> Integration:
    slug = normalize_provider(provider_slug)
    provider = get_provider(slug)
    validated = provider.validate_config(config)
    ws_id = get_workspace_id(db)

    existing = db.query(Integration).filter(
        Integration.workspace_id == ws_id,
        Integration.provider == slug,
    ).first()
    if existing:
        raise ValueError(f"{provider.display_name} is already configured")

    integration = Integration(
        workspace_id=ws_id,
        provider=slug,
        status="Active",
        config=validated,
    )
    db.add(integration)

    log = ActivityLog(
        user_id=current_user.id,
        action="Integration Configured",
        details=f"Enabled {provider.display_name} integration.",
    )
    db.add(log)
    db.commit()
    db.refresh(integration)
    return integration


def sanitize_integration(integration: Integration) -> dict:
    provider = get_provider(integration.provider)
    return {
        "id": integration.id,
        "workspace_id": integration.workspace_id,
        "provider": integration.provider,
        "display_name": provider.display_name,
        "status": integration.status,
        "config": provider.get_public_config(integration.config),
        "supports_oauth": provider.supports_oauth,
        "created_at": integration.created_at,
        "updated_at": integration.updated_at,
    }
