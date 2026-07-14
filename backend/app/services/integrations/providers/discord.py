from typing import Any

from app.core.config import settings
from app.services.integrations.base import IntegrationProvider
from app.services.integrations.oauth import (
    build_authorize_url,
    exchange_code_for_token,
    mock_oauth_credentials,
)


class DiscordProvider(IntegrationProvider):
    slug = "discord"
    display_name = "Discord"
    supports_oauth = True
    oauth_scopes = ["identify", "webhook.incoming"]

    def validate_config(self, config: dict[str, Any]) -> dict[str, Any]:
        if not config.get("webhook_url") and not config.get("access_token"):
            raise ValueError("Discord config requires webhook_url or access_token")
        return {
            "webhook_url": config.get("webhook_url"),
            "access_token": config.get("access_token"),
            "guild_id": config.get("guild_id"),
            "channel_name": config.get("channel_name"),
        }

    def get_oauth_authorize_url(self, state: str, redirect_uri: str) -> str | None:
        if not settings.DISCORD_CLIENT_ID:
            return None
        return build_authorize_url(
            "https://discord.com/api/oauth2/authorize",
            settings.DISCORD_CLIENT_ID,
            redirect_uri,
            self.oauth_scopes,
            state,
            extra_params={"permissions": "0"},
        )

    def exchange_oauth_code(self, code: str, redirect_uri: str) -> dict[str, Any]:
        if not settings.DISCORD_CLIENT_ID or not settings.DISCORD_CLIENT_SECRET:
            creds = mock_oauth_credentials(self.slug)
            creds["guild_id"] = "000000000000000000"
            creds["channel_name"] = "general"
            return creds

        token_data = exchange_code_for_token(
            "https://discord.com/api/oauth2/token",
            {
                "client_id": settings.DISCORD_CLIENT_ID,
                "client_secret": settings.DISCORD_CLIENT_SECRET,
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        return {
            "access_token": token_data.get("access_token"),
            "refresh_token": token_data.get("refresh_token"),
            "expires_in": token_data.get("expires_in"),
            "scopes": token_data.get("scope", "").split(" "),
            "mock": False,
        }

    def build_config_from_oauth(self, credentials: dict[str, Any]) -> dict[str, Any]:
        return {
            "access_token": credentials.get("access_token"),
            "refresh_token": credentials.get("refresh_token"),
            "guild_id": credentials.get("guild_id"),
            "channel_name": credentials.get("channel_name", "general"),
            "connected_via": "oauth",
        }
