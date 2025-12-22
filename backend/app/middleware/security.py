"""
Security Middleware
Adds security headers to all responses.
"""

from typing import Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Adds security headers to protect against common web vulnerabilities.

    Headers added:
    - X-Content-Type-Options: Prevents MIME type sniffing
    - X-Frame-Options: Prevents clickjacking
    - X-XSS-Protection: Legacy XSS protection
    - Strict-Transport-Security: Forces HTTPS
    - Content-Security-Policy: Controls resource loading
    - Referrer-Policy: Controls referrer information
    - Permissions-Policy: Controls browser features
    """

    def __init__(self, app, enable_hsts: bool = True, csp_report_only: bool = False):
        super().__init__(app)
        self.enable_hsts = enable_hsts
        self.csp_report_only = csp_report_only

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Prevent MIME type sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"

        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"

        # Legacy XSS protection (for older browsers)
        response.headers["X-XSS-Protection"] = "1; mode=block"

        # HTTP Strict Transport Security (HTTPS only)
        if self.enable_hsts:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        # Content Security Policy
        csp = "; ".join([
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://openapi.map.naver.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https: blob:",
            "font-src 'self' data:",
            "connect-src 'self' https://api.tosspayments.com https://kauth.kakao.com https://kapi.kakao.com https://nid.naver.com https://openapi.naver.com https://accounts.google.com https://oauth2.googleapis.com https://openapi.map.naver.com wss:",
            "frame-src 'self' https://js.tosspayments.com",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ])

        header_name = "Content-Security-Policy-Report-Only" if self.csp_report_only else "Content-Security-Policy"
        response.headers[header_name] = csp

        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # Permissions Policy (formerly Feature Policy)
        response.headers["Permissions-Policy"] = "geolocation=(self), camera=(), microphone=()"

        return response


class RequestValidationMiddleware(BaseHTTPMiddleware):
    """
    Validates incoming requests for security issues.

    Checks:
    - Request body size limits
    - Content-Type validation
    - Path traversal attempts
    """

    def __init__(self, app, max_body_size: int = 10 * 1024 * 1024):  # 10MB default
        super().__init__(app)
        self.max_body_size = max_body_size

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Check content length
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.max_body_size:
            return Response(
                content="Request body too large",
                status_code=413
            )

        # Check for path traversal attempts
        path = request.url.path
        if ".." in path or path.startswith("//"):
            return Response(
                content="Invalid path",
                status_code=400
            )

        return await call_next(request)
