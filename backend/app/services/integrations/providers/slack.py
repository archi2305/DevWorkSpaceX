from typing import Any

from app.core.config import settings
from app.services.integrations.base import IntegrationProvider
from app.services.integrations.oauth import (
    build_authorize_url,
    exchange_code_for_token,
    mock_oauth_credentials,
)


class SlackProvider(IntegrationProvider):
    slug = "slack"
    display_name = "Slack"
    supports_oauth = True
    oauth_scopes = ["incoming-webhook", "channels:read", "chat:write"]

    def validate_config(self, config: dict[str, Any]) -> dict[str, Any]:
        if not config.get("access_token") and not config.get("webhook_url"):
            raise ValueError("Slack config requires access_token or webhook_url")
        return {
            "access_token": config.get("access_token"),
            "webhook_url": config.get("webhook_url"),
            "team_id": config.get("team_id"),
            "channel": config.get("channel"),
            "scopes": config.get("scopes", self.oauth_scopes),
        }

    def get_oauth_authorize_url(self, state: str, redirect_uri: str) -> str | None:
        if not settings.SLACK_CLIENT_ID:
            return None
        return build_authorize_url(
            "https://slack.com/oauth/v2/authorize",
            settings.SLACK_CLIENT_ID,
            redirect_uri,
            self.oauth_scopes,
            state,
        )

    def exchange_oauth_code(self, code: str, redirect_uri: str) -> dict[str, Any]:
        if not settings.SLACK_CLIENT_ID or not settings.SLACK_CLIENT_SECRET:
            creds = mock_oauth_credentials(self.slug)
            creds["team_id"] = "T00000000"
            creds["channel"] = "#general"
            return creds

        token_data = exchange_code_for_token(
            "https://slack.com/api/oauth.v2.access",
            {
                "client_id": settings.SLACK_CLIENT_ID,
                "client_secret": settings.SLACK_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
            },
        )
        if not token_data.get("ok", True) and token_data.get("error"):
            raise ValueError(f"Slack OAuth failed: {token_data['error']}")

        authed = token_data.get("authed_user", {})
        incoming = token_data.get("incoming_webhook", {})
        return {
            "access_token": token_data.get("access_token"),
            "team_id": token_data.get("team", {}).get("id"),
            "channel": incoming.get("channel"),
            "webhook_url": incoming.get("url"),
            "scopes": token_data.get("scope", "").split(","),
            "mock": False,
        }

    def build_config_from_oauth(self, credentials: dict[str, Any]) -> dict[str, Any]:
        return {
            "access_token": credentials.get("access_token"),
            "team_id": credentials.get("team_id"),
            "channel": credentials.get("channel"),
            "webhook_url": credentials.get("webhook_url"),
            "scopes": credentials.get("scopes", self.oauth_scopes),
            "connected_via": "oauth",
        }
