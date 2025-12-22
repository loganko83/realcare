"""
API v1 Router
Aggregates all endpoint routers
"""

from fastapi import APIRouter

from app.api.v1.endpoints import health, reality, signals, contracts, auth

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(reality.router, prefix="/reality", tags=["Reality Check"])
api_router.include_router(signals.router, prefix="/signals", tags=["Owner Signals"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
