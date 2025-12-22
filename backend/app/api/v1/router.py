"""
API v1 Router
Aggregates all endpoint routers
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    health,
    reality,
    signals,
    contracts,
    auth,
    agents,
    blockchain,
    payments,
    oauth,
    push,
    files,
    admin,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(health.router, prefix="/health", tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(oauth.router, prefix="/oauth", tags=["OAuth"])
api_router.include_router(reality.router, prefix="/reality", tags=["Reality Check"])
api_router.include_router(signals.router, prefix="/signals", tags=["Owner Signals"])
api_router.include_router(contracts.router, prefix="/contracts", tags=["Contracts"])
api_router.include_router(agents.router, prefix="/agents", tags=["Agents (B2B)"])
api_router.include_router(blockchain.router, prefix="/blockchain", tags=["Blockchain (DID/Xphere)"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(push.router, prefix="/push", tags=["Push Notifications"])
api_router.include_router(files.router, prefix="/files", tags=["File Uploads"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
