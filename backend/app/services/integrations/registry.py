from app.services.integrations.providers.discord import DiscordProvider
from app.services.integrations.providers.github import GitHubProvider
from app.services.integrations.providers.google_calendar import GoogleCalendarProvider
from app.services.integrations.providers.slack import SlackProvider
from app.services.integrations.providers.webhook import WebhookProvider
from app.services.integrations.base import IntegrationProvider

_PROVIDERS: dict[str, IntegrationProvider] = {
    GitHubProvider.slug: GitHubProvider(),
    SlackProvider.slug: SlackProvider(),
    DiscordProvider.slug: DiscordProvider(),
    GoogleCalendarProvider.slug: GoogleCalendarProvider(),
    WebhookProvider.slug: WebhookProvider(),
}

# Legacy display-name aliases
_ALIASES = {
    "github": "github",
    "GitHub": "github",
    "slack": "slack",
    "Slack": "slack",
    "discord": "discord",
    "Discord": "discord",
    "google calendar": "google_calendar",
    "Google Calendar": "google_calendar",
    "google_calendar": "google_calendar",
    "webhook": "webhook",
    "Webhook": "webhook",
}


def normalize_provider(provider: str) -> str:
    slug = _ALIASES.get(provider, provider.lower().replace(" ", "_"))
    if slug not in _PROVIDERS:
        raise ValueError(f"Unknown integration provider: {provider}")
    return slug


def get_provider(provider: str) -> IntegrationProvider:
    slug = normalize_provider(provider)
    return _PROVIDERS[slug]


def list_providers() -> list[dict]:
    return [
        {
            "slug": p.slug,
            "display_name": p.display_name,
            "supports_oauth": p.supports_oauth,
            "oauth_scopes": p.oauth_scopes,
        }
        for p in _PROVIDERS.values()
    ]
