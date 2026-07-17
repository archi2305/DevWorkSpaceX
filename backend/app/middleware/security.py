import time
from collections import defaultdict
from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

# Simple IP-based sliding window rate limiter
class RateLimiterMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, requests_limit: int = 100, window_seconds: int = 60, rate_limit_endpoints: dict = None):
        super().__init__(app)
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        # Endpoint-specific overrides (e.g. login/register)
        self.rate_limit_endpoints = rate_limit_endpoints or {
            "/auth/login": (10, 60),
            "/auth/register": (10, 60)
        }
        self.request_history = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Allow OPTIONS request (pre-flight checks) without limiting
        if request.method == "OPTIONS":
            return await call_next(request)

        client_ip = request.client.host if request.client else "127.0.0.1"
        path = request.url.path
        now = time.time()

        limit, window = self.requests_limit, self.window_seconds
        for prefix, config in self.rate_limit_endpoints.items():
            if path.startswith(prefix):
                limit, window = config
                break

        # Unique key based on IP + endpoint prefix
        key = f"{client_ip}:{limit}"
        history = self.request_history[key]

        # Evict timestamps outside the window
        while history and history[0] < now - window:
            history.pop(0)

        if len(history) >= limit:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Too many requests. Please try again later."}
            )

        history.append(now)
        return await call_next(request)

# Security headers middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Permissive CSP fallback for Swagger docs and WebSocket connections
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; "
            "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
            "img-src 'self' data: https:; "
            "connect-src 'self' ws: wss: http: https:;"
        )
        return response
