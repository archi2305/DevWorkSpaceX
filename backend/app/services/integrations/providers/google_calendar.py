from typing import Any

from app.core.config import settings
from app.services.integrations.base import IntegrationProvider
from app.services.integrations.oauth import (
    build_authorize_url,
    exchange_code_for_token,
    mock_oauth_credentials,
)


class GoogleCalendarProvider(IntegrationProvider):
    slug = "google_calendar"
    display_name = "Google Calendar"
    supports_oauth = True
    oauth_scopes = [
        "https://www.googleapis.com/auth/calendar.readonly",
        "https://www.googleapis.com/auth/calendar.events",
    ]

    def validate_config(self, config: dict[str, Any]) -> dict[str, Any]:
        if not config.get("access_token") and not config.get("calendar_id"):
            raise ValueError("Google Calendar config requires access_token or calendar_id")
        return {
            "access_token": config.get("access_token"),
            "refresh_token": config.get("refresh_token"),
            "calendar_id": config.get("calendar_id", "primary"),
            "email": config.get("email"),
            "scopes": config.get("scopes", self.oauth_scopes),
        }

    def get_oauth_authorize_url(self, state: str, redirect_uri: str) -> str | None:
        if not settings.GOOGLE_CLIENT_ID:
            return None
        return build_authorize_url(
            "https://accounts.google.com/o/oauth2/v2/auth",
            settings.GOOGLE_CLIENT_ID,
            redirect_uri,
            self.oauth_scopes,
            state,
            extra_params={"access_type": "offline", "prompt": "consent"},
        )

    def exchange_oauth_code(self, code: str, redirect_uri: str) -> dict[str, Any]:
        if not settings.GOOGLE_CLIENT_ID or not settings.GOOGLE_CLIENT_SECRET:
            creds = mock_oauth_credentials(self.slug)
            creds["calendar_id"] = "primary"
            creds["email"] = "user@gmail.com"
            return creds

        token_data = exchange_code_for_token(
            "https://oauth2.googleapis.com/token",
            {
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "code": code,
                "grant_type": "authorization_code",
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
            "calendar_id": credentials.get("calendar_id", "primary"),
            "email": credentials.get("email"),
            "scopes": credentials.get("scopes", self.oauth_scopes),
            "connected_via": "oauth",
        }
