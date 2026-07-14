from typing import Any

from app.core.config import settings
from app.services.integrations.base import IntegrationProvider
from app.services.integrations.oauth import (
    build_authorize_url,
    exchange_code_for_token,
    mock_oauth_credentials,
)


class GitHubProvider(IntegrationProvider):
    slug = "github"
    display_name = "GitHub"
    supports_oauth = True
    oauth_scopes = ["repo", "read:user", "user:email"]

    def validate_config(self, config: dict[str, Any]) -> dict[str, Any]:
        if not config.get("access_token") and not config.get("repo"):
            raise ValueError("GitHub config requires access_token or repo")
        return {
            "access_token": config.get("access_token"),
            "refresh_token": config.get("refresh_token"),
            "username": config.get("username"),
            "repo": config.get("repo"),
            "scopes": config.get("scopes", self.oauth_scopes),
        }

    def get_oauth_authorize_url(self, state: str, redirect_uri: str) -> str | None:
        if not settings.GITHUB_CLIENT_ID:
            return None
        return build_authorize_url(
            "https://github.com/login/oauth/authorize",
            settings.GITHUB_CLIENT_ID,
            redirect_uri,
            self.oauth_scopes,
            state,
        )

    def exchange_oauth_code(self, code: str, redirect_uri: str) -> dict[str, Any]:
        if not settings.GITHUB_CLIENT_ID or not settings.GITHUB_CLIENT_SECRET:
            creds = mock_oauth_credentials(self.slug)
            creds["username"] = "octocat"
            return creds

        token_data = exchange_code_for_token(
            "https://github.com/login/oauth/access_token",
            {
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": redirect_uri,
            },
            headers={"Accept": "application/json"},
        )
        return {
            "access_token": token_data.get("access_token"),
            "token_type": token_data.get("token_type", "bearer"),
            "scopes": token_data.get("scope", "").split(","),
            "mock": False,
        }

    def build_config_from_oauth(self, credentials: dict[str, Any]) -> dict[str, Any]:
        return {
            "access_token": credentials.get("access_token"),
            "username": credentials.get("username", "connected_user"),
            "scopes": credentials.get("scopes", self.oauth_scopes),
            "connected_via": "oauth",
        }
