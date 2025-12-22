# Phase 12: Security & Performance

> Spec-Kit Methodology v2.0
> Priority: MEDIUM
> Dependencies: Phase 8-11 Complete
> Estimated Tasks: 24

---

## Overview

This phase hardens the platform for production deployment with security measures, performance optimizations, and monitoring. Focus on protecting user data and ensuring responsive user experience.

---

## P12-01: Redis Caching

### P12-01-A: Cache Service

**File**: `backend/app/services/cache.py`

```python
"""
Redis caching service for API response caching and rate limiting.
"""

import json
from typing import Any, Optional, Callable
from datetime import timedelta
import redis.asyncio as redis
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class CacheService:
    """Redis cache service."""

    def __init__(self):
        self.redis: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis."""
        if self.redis:
            return

        self.redis = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )

        try:
            await self.redis.ping()
            logger.info("Redis connected")
        except Exception as e:
            logger.error("Redis connection failed", error=str(e))
            self.redis = None

    async def disconnect(self):
        """Disconnect from Redis."""
        if self.redis:
            await self.redis.close()
            self.redis = None

    async def get(self, key: str) -> Optional[Any]:
        """Get cached value."""
        if not self.redis:
            return None

        try:
            data = await self.redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.error("Cache get error", key=key, error=str(e))
            return None

    async def set(
        self,
        key: str,
        value: Any,
        expire: int = 300  # 5 minutes default
    ):
        """Set cached value."""
        if not self.redis:
            return

        try:
            await self.redis.setex(key, expire, json.dumps(value))
        except Exception as e:
            logger.error("Cache set error", key=key, error=str(e))

    async def delete(self, key: str):
        """Delete cached value."""
        if not self.redis:
            return

        try:
            await self.redis.delete(key)
        except Exception as e:
            logger.error("Cache delete error", key=key, error=str(e))

    async def delete_pattern(self, pattern: str):
        """Delete all keys matching pattern."""
        if not self.redis:
            return

        try:
            cursor = 0
            while True:
                cursor, keys = await self.redis.scan(cursor, match=pattern)
                if keys:
                    await self.redis.delete(*keys)
                if cursor == 0:
                    break
        except Exception as e:
            logger.error("Cache delete pattern error", pattern=pattern)

    # Cache decorator
    def cached(
        self,
        key_prefix: str,
        expire: int = 300,
        key_builder: Optional[Callable] = None
    ):
        """Decorator for caching function results."""
        def decorator(func):
            async def wrapper(*args, **kwargs):
                # Build cache key
                if key_builder:
                    cache_key = f"{key_prefix}:{key_builder(*args, **kwargs)}"
                else:
                    cache_key = key_prefix

                # Try cache first
                cached = await self.get(cache_key)
                if cached is not None:
                    logger.debug("Cache hit", key=cache_key)
                    return cached

                # Execute function
                result = await func(*args, **kwargs)

                # Cache result
                await self.set(cache_key, result, expire)
                logger.debug("Cache miss", key=cache_key)

                return result

            return wrapper
        return decorator


cache_service = CacheService()
```

**Tasks**:
- [ ] P12-01-A-1: Implement cache service
- [ ] P12-01-A-2: Add cache decorator
- [ ] P12-01-A-3: Connect on app startup
- [ ] P12-01-A-4: Add cache invalidation

---

### P12-01-B: Cache Integration

**File**: `backend/app/api/v1/endpoints/reality.py` (update)

```python
# Add caching to expensive calculations

from app.services.cache import cache_service

@router.post("/calculate")
async def calculate_reality_check(
    request: RealityCheckRequest,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Create cache key from request
    cache_key = f"reality:{user.id}:{request.target_price}:{request.region}"

    # Check cache
    cached = await cache_service.get(cache_key)
    if cached:
        return cached

    # Calculate
    result = await reality_service.calculate(request)

    # Cache for 1 hour (static regulations don't change often)
    await cache_service.set(cache_key, result, expire=3600)

    return result
```

**Cached Endpoints**:
- Reality Check calculations (1 hour)
- Subscription plans (24 hours)
- Region regulations (24 hours)
- User profile (5 minutes)

**Tasks**:
- [ ] P12-01-B-1: Add caching to reality check
- [ ] P12-01-B-2: Cache subscription plans
- [ ] P12-01-B-3: Cache user sessions
- [ ] P12-01-B-4: Add cache headers to responses

---

## P12-02: Rate Limiting

### P12-02-A: Rate Limiter Middleware

**File**: `backend/app/middleware/rate_limit.py`

```python
"""
Rate limiting middleware using Redis.
"""

from typing import Optional
from fastapi import Request, HTTPException
import redis.asyncio as redis
import time
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class RateLimiter:
    """Token bucket rate limiter using Redis."""

    def __init__(self):
        self.redis: Optional[redis.Redis] = None

    async def connect(self):
        self.redis = redis.from_url(settings.REDIS_URL)

    async def is_allowed(
        self,
        key: str,
        limit: int,
        window: int  # seconds
    ) -> tuple[bool, int, int]:
        """
        Check if request is allowed.

        Returns:
            (allowed, remaining, reset_time)
        """
        if not self.redis:
            return True, limit, 0

        now = int(time.time())
        window_start = now - (now % window)
        redis_key = f"rate:{key}:{window_start}"

        try:
            current = await self.redis.incr(redis_key)
            if current == 1:
                await self.redis.expire(redis_key, window)

            remaining = max(0, limit - current)
            reset_time = window_start + window

            return current <= limit, remaining, reset_time

        except Exception as e:
            logger.error("Rate limit error", error=str(e))
            return True, limit, 0

    def get_key(self, request: Request, user_id: Optional[str] = None) -> str:
        """Get rate limit key for request."""
        if user_id:
            return f"user:{user_id}"
        return f"ip:{request.client.host}"


rate_limiter = RateLimiter()


# Rate limit configurations
RATE_LIMITS = {
    # Public endpoints (per IP)
    "auth/login": (10, 60),        # 10 requests per minute
    "auth/register": (5, 3600),    # 5 per hour

    # Authenticated endpoints (per user)
    "reality/calculate": (30, 60),  # 30 per minute
    "signals": (60, 60),           # 60 per minute
    "agents": (100, 60),           # 100 per minute

    # Default
    "default": (100, 60),          # 100 per minute
}


async def rate_limit_middleware(request: Request, call_next):
    """Rate limiting middleware."""
    # Skip rate limiting for certain paths
    if request.url.path.startswith("/api/docs"):
        return await call_next(request)

    # Determine rate limit config
    path_key = request.url.path.replace("/api/v1/", "").split("/")[0]
    limit, window = RATE_LIMITS.get(path_key, RATE_LIMITS["default"])

    # Get user ID if authenticated
    user_id = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        # Extract user_id from token (simplified)
        user_id = "authenticated_user"  # Replace with actual token parsing

    key = rate_limiter.get_key(request, user_id)
    allowed, remaining, reset_time = await rate_limiter.is_allowed(
        key, limit, window
    )

    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many requests",
            headers={
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": str(reset_time),
                "Retry-After": str(reset_time - int(time.time()))
            }
        )

    response = await call_next(request)

    # Add rate limit headers
    response.headers["X-RateLimit-Limit"] = str(limit)
    response.headers["X-RateLimit-Remaining"] = str(remaining)
    response.headers["X-RateLimit-Reset"] = str(reset_time)

    return response
```

**Tasks**:
- [ ] P12-02-A-1: Implement rate limiter
- [ ] P12-02-A-2: Add middleware to app
- [ ] P12-02-A-3: Configure limits per endpoint
- [ ] P12-02-A-4: Add rate limit headers

---

## P12-03: Input Validation & Sanitization

### P12-03-A: Request Validation

**File**: `backend/app/core/validation.py`

```python
"""
Input validation and sanitization utilities.
"""

import re
import html
from typing import Optional
from pydantic import validator


def sanitize_html(text: str) -> str:
    """Escape HTML entities to prevent XSS."""
    return html.escape(text)


def sanitize_sql(text: str) -> str:
    """Remove potential SQL injection patterns."""
    # Remove common SQL keywords when not expected
    dangerous = ["--", ";", "DROP", "DELETE", "UPDATE", "INSERT", "UNION"]
    result = text
    for pattern in dangerous:
        result = result.replace(pattern.lower(), "")
        result = result.replace(pattern.upper(), "")
    return result


def validate_korean_phone(phone: str) -> bool:
    """Validate Korean phone number format."""
    pattern = r'^01[0-9]-?[0-9]{4}-?[0-9]{4}$'
    return bool(re.match(pattern, phone))


def validate_korean_address(address: str) -> bool:
    """Basic validation for Korean address."""
    # Should contain Korean characters and numbers
    return bool(re.search(r'[\uAC00-\uD7AF]', address))


def validate_business_number(number: str) -> bool:
    """Validate Korean business registration number."""
    pattern = r'^\d{3}-\d{2}-\d{5}$'
    return bool(re.match(pattern, number))


class ValidatedString(str):
    """String with automatic sanitization."""

    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not isinstance(v, str):
            raise ValueError("string required")
        return sanitize_html(v.strip())


# Example Pydantic model with validation
from pydantic import BaseModel, Field

class SafeUserInput(BaseModel):
    """User input with validation."""

    name: str = Field(..., min_length=2, max_length=50)
    email: str = Field(..., regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    phone: Optional[str] = None

    @validator('name')
    def sanitize_name(cls, v):
        return sanitize_html(v.strip())

    @validator('phone')
    def validate_phone(cls, v):
        if v and not validate_korean_phone(v):
            raise ValueError('Invalid Korean phone number')
        return v
```

**Tasks**:
- [ ] P12-03-A-1: Create sanitization utilities
- [ ] P12-03-A-2: Add validators for Korean formats
- [ ] P12-03-A-3: Apply to all input schemas
- [ ] P12-03-A-4: Add SQL injection prevention

---

### P12-03-B: Content Security

**File**: `backend/app/middleware/security.py`

```python
"""
Security middleware and headers.
"""

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)

        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        # Content Security Policy
        csp = "; ".join([
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://openapi.map.naver.com https://js.tosspayments.com",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: https:",
            "font-src 'self'",
            "connect-src 'self' https://api.tosspayments.com https://en-bkk.x-phere.com",
            "frame-ancestors 'none'",
        ])
        response.headers["Content-Security-Policy"] = csp

        # HSTS (only in production)
        if not request.url.hostname.startswith("localhost"):
            response.headers["Strict-Transport-Security"] = (
                "max-age=31536000; includeSubDomains"
            )

        return response
```

**Tasks**:
- [ ] P12-03-B-1: Add security headers middleware
- [ ] P12-03-B-2: Configure CSP
- [ ] P12-03-B-3: Enable HSTS
- [ ] P12-03-B-4: Add CORS validation

---

## P12-04: Database Performance

### P12-04-A: Query Optimization

**File**: `backend/app/core/database.py` (update)

```python
"""
Database configuration with performance optimizations.
"""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

settings = get_settings()

# Production engine configuration
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
    pool_pre_ping=True,        # Check connection before use
    pool_size=10,              # Connection pool size
    max_overflow=20,           # Additional connections when pool exhausted
    pool_timeout=30,           # Wait time for connection
    pool_recycle=3600,         # Recycle connections after 1 hour
)

async_session = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)
```

**Tasks**:
- [ ] P12-04-A-1: Configure connection pooling
- [ ] P12-04-A-2: Add query logging (debug mode)
- [ ] P12-04-A-3: Review and add indexes
- [ ] P12-04-A-4: Add slow query monitoring

---

### P12-04-B: Database Indexes

**File**: `backend/alembic/versions/xxx_add_performance_indexes.py`

```python
"""Add performance indexes

Revision ID: 004
"""

from alembic import op


def upgrade() -> None:
    # User queries
    op.create_index('ix_users_email_active', 'users', ['email', 'is_active'])
    op.create_index('ix_users_role', 'users', ['role'])

    # Reality reports - common queries
    op.create_index('ix_reality_reports_user_date', 'reality_reports',
                    ['user_id', 'created_at'])
    op.create_index('ix_reality_reports_region', 'reality_reports',
                    ['region_code'])

    # Owner signals - search queries
    op.create_index('ix_owner_signals_search', 'owner_signals',
                    ['status', 'region_code', 'property_type'])
    op.create_index('ix_owner_signals_expires', 'owner_signals',
                    ['expires_at'])

    # Contracts - timeline queries
    op.create_index('ix_contracts_user_active', 'contracts',
                    ['user_id', 'status'])
    op.create_index('ix_timeline_tasks_due', 'timeline_tasks',
                    ['contract_id', 'due_date', 'status'])

    # Payments - reporting
    op.create_index('ix_payments_date_status', 'payments',
                    ['created_at', 'status'])

    # Agents - search
    op.create_index('ix_agents_verified_regions', 'agents',
                    ['is_verified', 'regions'])


def downgrade() -> None:
    op.drop_index('ix_users_email_active')
    # ... drop all indexes
```

**Tasks**:
- [ ] P12-04-B-1: Analyze query patterns
- [ ] P12-04-B-2: Create composite indexes
- [ ] P12-04-B-3: Add covering indexes
- [ ] P12-04-B-4: Test index effectiveness

---

## P12-05: Frontend Performance

### P12-05-A: Bundle Optimization

**File**: `vite.config.ts` (update)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      autoCodeSplitting: true,  // Route-based code splitting
    }),
    react(),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-tanstack': [
            '@tanstack/react-query',
            '@tanstack/react-router',
            '@tanstack/react-form',
          ],
          'vendor-gemini': ['@google/generative-ai'],
          // Heavy libraries loaded on demand
        },
      },
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // Remove console.log in production
      },
    },
  },
  // Enable gzip compression hints
  server: {
    headers: {
      'Cache-Control': 'public, max-age=31536000',
    },
  },
});
```

**Tasks**:
- [ ] P12-05-A-1: Enable code splitting
- [ ] P12-05-A-2: Optimize bundle chunks
- [ ] P12-05-A-3: Add compression
- [ ] P12-05-A-4: Configure caching headers

---

### P12-05-B: Lazy Loading

**File**: `src/components/charts/LazyCharts.tsx`

```typescript
/**
 * Lazy-loaded chart components
 */

import { lazy, Suspense } from 'react';

// Lazy load recharts (heavy library)
const LazyLineChart = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.LineChart }))
);

const LazyBarChart = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.BarChart }))
);

const LazyPieChart = lazy(() =>
  import('recharts').then((mod) => ({ default: mod.PieChart }))
);

interface ChartWrapperProps {
  children: React.ReactNode;
}

function ChartWrapper({ children }: ChartWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="h-64 animate-pulse bg-gray-100 rounded-lg flex items-center justify-center">
          Loading chart...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

export { ChartWrapper, LazyLineChart, LazyBarChart, LazyPieChart };
```

**Tasks**:
- [ ] P12-05-B-1: Lazy load chart library
- [ ] P12-05-B-2: Lazy load PDF export
- [ ] P12-05-B-3: Lazy load maps
- [ ] P12-05-B-4: Add loading states

---

### P12-05-C: Image Optimization

**Tasks**:
- [ ] P12-05-C-1: Add image compression
- [ ] P12-05-C-2: Implement lazy loading for images
- [ ] P12-05-C-3: Use WebP format where supported
- [ ] P12-05-C-4: Add responsive images

---

## P12-06: Monitoring & Logging

### P12-06-A: Structured Logging

**File**: `backend/app/core/logging.py`

```python
"""
Structured logging configuration.
"""

import sys
import structlog
from app.core.config import get_settings

settings = get_settings()


def configure_logging():
    """Configure structured logging."""
    processors = [
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if settings.DEBUG:
        # Pretty print for development
        processors.append(structlog.dev.ConsoleRenderer())
    else:
        # JSON for production (easier to parse)
        processors.append(structlog.processors.JSONRenderer())

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


# Request logging middleware
from fastapi import Request
import time


async def log_requests(request: Request, call_next):
    """Log all API requests."""
    logger = structlog.get_logger()

    start_time = time.time()

    response = await call_next(request)

    process_time = time.time() - start_time

    logger.info(
        "request",
        method=request.method,
        path=request.url.path,
        status=response.status_code,
        duration_ms=round(process_time * 1000, 2),
        client_ip=request.client.host
    )

    return response
```

**Tasks**:
- [ ] P12-06-A-1: Configure structlog
- [ ] P12-06-A-2: Add request logging
- [ ] P12-06-A-3: Add error logging
- [ ] P12-06-A-4: Configure log rotation

---

### P12-06-B: Health Checks

**File**: `backend/app/api/v1/endpoints/health.py` (update)

```python
"""
Health check endpoints with detailed status.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.core.database import get_db
from app.services.cache import cache_service

router = APIRouter()


@router.get("/health")
async def health_check():
    """Basic health check."""
    return {"status": "healthy"}


@router.get("/health/detailed")
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """Detailed health check with dependency status."""
    checks = {
        "api": "healthy",
        "database": "unknown",
        "cache": "unknown",
    }

    # Check database
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"

    # Check Redis
    try:
        if cache_service.redis:
            await cache_service.redis.ping()
            checks["cache"] = "healthy"
        else:
            checks["cache"] = "not connected"
    except Exception as e:
        checks["cache"] = f"unhealthy: {str(e)}"

    # Overall status
    all_healthy = all(v == "healthy" for v in checks.values())

    return {
        "status": "healthy" if all_healthy else "degraded",
        "checks": checks
    }


@router.get("/health/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """Kubernetes readiness probe."""
    try:
        await db.execute(text("SELECT 1"))
        return {"ready": True}
    except:
        return {"ready": False}, 503


@router.get("/health/live")
async def liveness_check():
    """Kubernetes liveness probe."""
    return {"live": True}
```

**Tasks**:
- [ ] P12-06-B-1: Add detailed health check
- [ ] P12-06-B-2: Add readiness probe
- [ ] P12-06-B-3: Add liveness probe
- [ ] P12-06-B-4: Monitor external services

---

## Nginx Configuration

**File**: `/etc/nginx/sites-available/realcare`

```nginx
# RealCare API and Frontend configuration

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

server {
    listen 443 ssl http2;
    server_name trendy.storydot.kr;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/trendy.storydot.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/trendy.storydot.kr/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;

    # Frontend (static files)
    location /real/ {
        alias /var/www/realcare/dist/;
        try_files $uri $uri/ /real/index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API with rate limiting
    location /real/api/ {
        limit_req zone=api_limit burst=20 nodelay;

        proxy_pass http://localhost:8092/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }

    # Auth endpoints with stricter rate limiting
    location /real/api/v1/auth/ {
        limit_req zone=auth_limit burst=5 nodelay;

        proxy_pass http://localhost:8092/api/v1/auth/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

**Tasks**:
- [ ] P12-06-C-1: Configure Nginx rate limiting
- [ ] P12-06-C-2: Enable gzip compression
- [ ] P12-06-C-3: Configure static asset caching
- [ ] P12-06-C-4: Setup SSL/TLS

---

## Definition of Done

- [ ] Redis caching implemented
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] Security headers configured
- [ ] Database indexes optimized
- [ ] Frontend bundle optimized
- [ ] Structured logging enabled
- [ ] Health checks working
- [ ] Nginx configured for production
- [ ] Load testing passed (100+ concurrent users)

---

## Performance Targets

| Metric | Target |
|--------|--------|
| API Response (p95) | <200ms |
| First Contentful Paint | <1.5s |
| Time to Interactive | <3s |
| Bundle Size (gzipped) | <300KB |
| Lighthouse Score | >90 |
| Database Query Time | <50ms |

---

## Implementation Order

1. **Sprint 12.1**: Redis Caching
2. **Sprint 12.2**: Rate Limiting
3. **Sprint 12.3**: Security Headers & Validation
4. **Sprint 12.4**: Database Optimization
5. **Sprint 12.5**: Frontend Performance
6. **Sprint 12.6**: Monitoring & Logging
