from abc import ABC, abstractmethod
from typing import Any


class IntegrationProvider(ABC):
    """Base class for all third-party integration providers."""

    slug: str
    display_name: str
    supports_oauth: bool = False
    oauth_scopes: list[str] = []

    @abstractmethod
    def validate_config(self, config: dict[str, Any]) -> dict[str, Any]:
        """Validate and normalize provider-specific configuration."""

    def get_oauth_authorize_url(self, state: str, redirect_uri: str) -> str | None:
        return None

    def exchange_oauth_code(self, code: str, redirect_uri: str) -> dict[str, Any]:
        raise NotImplementedError(f"{self.display_name} does not support OAuth")

    def build_config_from_oauth(self, credentials: dict[str, Any]) -> dict[str, Any]:
        return credentials

    def get_public_config(self, config: dict[str, Any] | None) -> dict[str, Any] | None:
        """Return config safe for API responses (strips secrets)."""
        if not config:
            return None
        sanitized = dict(config)
        for key in ("access_token", "refresh_token", "secret", "webhook_url"):
            if key in sanitized:
                sanitized[key] = "••••••••"
        return sanitized
