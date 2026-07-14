from typing import Any

from app.services.integrations.base import IntegrationProvider


class WebhookProvider(IntegrationProvider):
    slug = "webhook"
    display_name = "Webhook"
    supports_oauth = False

    def validate_config(self, config: dict[str, Any]) -> dict[str, Any]:
        target_url = config.get("target_url") or config.get("webhook_url")
        if not target_url:
            raise ValueError("Webhook config requires target_url")
        if not target_url.startswith(("http://", "https://")):
            raise ValueError("Webhook target_url must be a valid HTTP(S) URL")
        return {
            "name": config.get("name", "Outbound Webhook"),
            "target_url": target_url,
            "secret": config.get("secret"),
            "events": config.get("events", ["task.created", "task.updated", "task.completed"]),
        }
