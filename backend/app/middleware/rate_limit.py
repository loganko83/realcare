"""
Rate Limiting Middleware
Protects API from abuse using sliding window rate limiting.
"""

import time
from typing import Dict, Optional, Callable
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

logger = structlog.get_logger()

# In-memory store (use Redis in production)
rate_limit_store: Dict[str, list] = {}


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware with sliding window algorithm.

    Limits:
    - Anonymous: 30 requests per minute
    - Authenticated: 100 requests per minute
    - Premium: 300 requests per minute
    """

    def __init__(
        self,
        app,
        default_limit: int = 30,
        auth_limit: int = 100,
        premium_limit: int = 300,
        window_seconds: int = 60,
        exclude_paths: Optional[list] = None
    ):
        super().__init__(app)
        self.default_limit = default_limit
        self.auth_limit = auth_limit
        self.premium_limit = premium_limit
        self.window_seconds = window_seconds
        self.exclude_paths = exclude_paths or [
            "/docs",
            "/redoc",
            "/openapi.json",
            "/health",
            "/api/v1/health"
        ]

    def get_client_id(self, request: Request) -> str:
        """Get unique identifier for the client."""
        # Try to get user ID from auth header
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            # Use token hash as identifier
            token = auth_header[7:]
            return f"auth:{hash(token)}"

        # Fall back to IP address
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            ip = forwarded.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"

        return f"ip:{ip}"

    def get_rate_limit(self, request: Request) -> int:
        """Get rate limit based on authentication status."""
        auth_header = request.headers.get("Authorization", "")

        if auth_header.startswith("Bearer "):
            # Check for premium status (simplified - check token claims in production)
            return self.auth_limit

        return self.default_limit

    def is_rate_limited(self, client_id: str, limit: int) -> tuple[bool, int]:
        """
        Check if client is rate limited.

        Returns:
            (is_limited, remaining_requests)
        """
        now = time.time()
        window_start = now - self.window_seconds

        # Get request timestamps for this client
        if client_id not in rate_limit_store:
            rate_limit_store[client_id] = []

        # Remove old entries
        rate_limit_store[client_id] = [
            ts for ts in rate_limit_store[client_id]
            if ts > window_start
        ]

        current_count = len(rate_limit_store[client_id])

        if current_count >= limit:
            return True, 0

        # Add current request
        rate_limit_store[client_id].append(now)

        return False, limit - current_count - 1

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        # Skip excluded paths
        path = request.url.path
        if any(path.startswith(excluded) for excluded in self.exclude_paths):
            return await call_next(request)

        client_id = self.get_client_id(request)
        limit = self.get_rate_limit(request)

        is_limited, remaining = self.is_rate_limited(client_id, limit)

        if is_limited:
            logger.warning(
                "Rate limit exceeded",
                client_id=client_id,
                path=path
            )
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later.",
                headers={
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time() + self.window_seconds)),
                    "Retry-After": str(self.window_seconds)
                }
            )

        response = await call_next(request)

        # Add rate limit headers
        response.headers["X-RateLimit-Limit"] = str(limit)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + self.window_seconds))

        return response


def cleanup_rate_limit_store():
    """Periodic cleanup of expired entries."""
    now = time.time()
    cutoff = now - 120  # Keep entries for 2 minutes

    for client_id in list(rate_limit_store.keys()):
        rate_limit_store[client_id] = [
            ts for ts in rate_limit_store[client_id]
            if ts > cutoff
        ]
        if not rate_limit_store[client_id]:
            del rate_limit_store[client_id]
