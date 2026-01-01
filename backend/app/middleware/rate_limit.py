"""
Rate Limiting Middleware
Protects API from abuse using sliding window rate limiting.

Optimized with:
- collections.deque for O(1) operations
- Lazy cleanup to reduce per-request overhead
"""

import os
import time
from typing import Dict, Optional, Callable
from collections import deque
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import structlog

logger = structlog.get_logger()

# Disable rate limiting in test environment
TESTING = os.environ.get("TESTING", "").lower() == "true"

# In-memory store using deque for O(1) append/popleft (use Redis in production)
rate_limit_store: Dict[str, deque] = {}
# Track last cleanup time
_last_cleanup_time: float = 0
_cleanup_interval: float = 60  # Cleanup every 60 seconds


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
            token = auth_header[7:]
            # Extract user ID from JWT for proper tracking
            try:
                from app.core.security import verify_token
                user_id = verify_token(token, token_type="access")
                if user_id:
                    return f"user:{user_id}"
            except Exception:
                pass
            # Fallback: Use token signature (last 16 chars) as identifier
            # More stable than hash() which can vary across sessions
            return f"token:{token[-16:]}" if len(token) > 16 else f"token:{token}"

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

        Uses deque with O(1) operations instead of list comprehension.

        Returns:
            (is_limited, remaining_requests)
        """
        now = time.time()
        window_start = now - self.window_seconds

        # Get or create request timestamps for this client
        if client_id not in rate_limit_store:
            rate_limit_store[client_id] = deque()

        timestamps = rate_limit_store[client_id]

        # Remove old entries from the left (O(1) per removal with deque)
        while timestamps and timestamps[0] <= window_start:
            timestamps.popleft()

        current_count = len(timestamps)

        if current_count >= limit:
            return True, 0

        # Add current request (O(1) append)
        timestamps.append(now)

        return False, limit - current_count - 1

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting."""
        # Skip rate limiting in test environment
        if TESTING:
            return await call_next(request)

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
    """Periodic cleanup of expired entries. Uses O(1) deque operations."""
    global _last_cleanup_time

    now = time.time()

    # Only run cleanup if enough time has passed
    if now - _last_cleanup_time < _cleanup_interval:
        return

    _last_cleanup_time = now
    cutoff = now - 120  # Keep entries for 2 minutes

    # Iterate over copy of keys to allow deletion
    for client_id in list(rate_limit_store.keys()):
        timestamps = rate_limit_store[client_id]
        # O(1) popleft for each expired entry
        while timestamps and timestamps[0] <= cutoff:
            timestamps.popleft()
        # Remove empty entries
        if not timestamps:
            del rate_limit_store[client_id]
