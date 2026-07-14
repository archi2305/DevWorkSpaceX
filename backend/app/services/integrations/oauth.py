import json
import secrets
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


def generate_oauth_state() -> str:
    return secrets.token_urlsafe(32)


def build_authorize_url(
    base_url: str,
    client_id: str,
    redirect_uri: str,
    scopes: list[str],
    state: str,
    extra_params: dict[str, str] | None = None,
) -> str:
    params: dict[str, str] = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": " ".join(scopes),
        "state": state,
        "response_type": "code",
    }
    if extra_params:
        params.update(extra_params)
    return f"{base_url}?{urllib.parse.urlencode(params)}"


def exchange_code_for_token(
    token_url: str,
    data: dict[str, str],
    headers: dict[str, str] | None = None,
) -> dict[str, Any]:
    encoded = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(
        token_url,
        data=encoded,
        headers={"Accept": "application/json", **(headers or {})},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as exc:
        body = exc.read().decode()
        raise ValueError(f"OAuth token exchange failed: {body}") from exc


def mock_oauth_credentials(provider: str) -> dict[str, Any]:
    """Simulated credentials when OAuth client secrets are not configured."""
    return {
        "access_token": f"mock_{provider}_{secrets.token_hex(16)}",
        "token_type": "bearer",
        "expires_in": 3600,
        "mock": True,
    }
