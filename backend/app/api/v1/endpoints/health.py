"""
Health Check Endpoints
Comprehensive health monitoring for RealCare API
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from pydantic import BaseModel
from typing import Dict, Optional

from app.core.database import get_db
from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


class HealthCheckResponse(BaseModel):
    """Health check response schema."""
    status: str
    service: str
    timestamp: str
    version: Optional[str] = None
    checks: Optional[Dict[str, str]] = None


@router.get("", response_model=HealthCheckResponse)
async def health_check():
    """Basic health check for load balancers."""
    return HealthCheckResponse(
        status="healthy",
        service="realcare-api",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/detailed", response_model=HealthCheckResponse)
async def detailed_health_check(db: AsyncSession = Depends(get_db)):
    """
    Detailed health check including:
    - Database connectivity
    - Redis connectivity
    - External service status
    """
    checks = {
        "api": "healthy",
        "database": "unknown",
        "redis": "unknown",
    }

    # Check database
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar()
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)[:100]}"

    # Check Redis
    try:
        import redis.asyncio as redis
        redis_client = redis.from_url(settings.REDIS_URL)
        await redis_client.ping()
        await redis_client.close()
        checks["redis"] = "healthy"
    except ImportError:
        checks["redis"] = "skipped: redis package not installed"
    except Exception as e:
        checks["redis"] = f"unhealthy: {str(e)[:100]}"

    # Determine overall status
    critical_services = ["api", "database"]
    critical_healthy = all(
        checks.get(s) == "healthy" for s in critical_services
    )

    if critical_healthy:
        overall = "healthy"
    elif checks["api"] == "healthy":
        overall = "degraded"
    else:
        overall = "unhealthy"

    return HealthCheckResponse(
        status=overall,
        service="realcare-api",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version=settings.APP_VERSION,
        checks=checks,
    )


@router.get("/ready")
async def readiness_check(db: AsyncSession = Depends(get_db)):
    """
    Kubernetes-style readiness check.
    Returns 200 only if the service is ready to accept traffic.
    """
    from fastapi import HTTPException

    # Check database connection
    try:
        result = await db.execute(text("SELECT 1"))
        result.scalar()
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Database not ready: {str(e)[:100]}"
        )

    return {"status": "ready"}


@router.get("/live")
async def liveness_check():
    """
    Kubernetes-style liveness check.
    Returns 200 if the service process is alive.
    """
    return {"status": "alive"}
