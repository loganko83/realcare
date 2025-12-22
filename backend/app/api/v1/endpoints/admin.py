"""
Admin Endpoints
Role-based access control for platform administration.
"""

from typing import Optional, List
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
import structlog

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.agent import Agent, AgentStatus
from app.models.payment import Payment, PaymentStatus, Subscription
from app.models.owner_signal import OwnerSignal
from app.services.auth import AuthService

router = APIRouter()
logger = structlog.get_logger()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


# Schemas
class UserListResponse(BaseModel):
    id: str
    email: str
    name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class AgentVerificationRequest(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None


class AdminStatsResponse(BaseModel):
    users: dict
    agents: dict
    payments: dict
    signals: dict


# Dependencies
async def require_admin(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency that requires admin role."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


# Stats Endpoints
@router.get("/stats", response_model=AdminStatsResponse)
async def get_admin_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get platform statistics for admin dashboard."""
    # User stats
    total_users = await db.scalar(select(func.count(User.id)))
    agent_count = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.AGENT)
    )
    new_users_week = await db.scalar(
        select(func.count(User.id))
        .where(User.created_at >= datetime.utcnow() - timedelta(days=7))
    )

    # Agent stats
    pending_agents = await db.scalar(
        select(func.count(Agent.id))
        .where(Agent.status == AgentStatus.PENDING)
    )
    verified_agents = await db.scalar(
        select(func.count(Agent.id))
        .where(Agent.status == AgentStatus.VERIFIED)
    )

    # Payment stats
    total_revenue = await db.scalar(
        select(func.sum(Payment.amount))
        .where(Payment.status == PaymentStatus.COMPLETED)
    ) or 0

    monthly_revenue = await db.scalar(
        select(func.sum(Payment.amount))
        .where(
            and_(
                Payment.status == PaymentStatus.COMPLETED,
                Payment.created_at >= datetime.utcnow() - timedelta(days=30)
            )
        )
    ) or 0

    active_subscriptions = await db.scalar(
        select(func.count(Subscription.id))
        .where(Subscription.status == "active")
    )

    # Signal stats
    active_signals = await db.scalar(
        select(func.count(OwnerSignal.id))
        .where(OwnerSignal.status == "active")
    )
    total_signals = await db.scalar(select(func.count(OwnerSignal.id)))

    return {
        "users": {
            "total": total_users or 0,
            "agents": agent_count or 0,
            "regular": (total_users or 0) - (agent_count or 0),
            "new_this_week": new_users_week or 0
        },
        "agents": {
            "pending_verification": pending_agents or 0,
            "verified": verified_agents or 0
        },
        "payments": {
            "total_revenue": total_revenue,
            "monthly_revenue": monthly_revenue,
            "active_subscriptions": active_subscriptions or 0,
            "currency": "KRW"
        },
        "signals": {
            "active": active_signals or 0,
            "total": total_signals or 0
        }
    }


# User Management Endpoints
@router.get("/users")
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """List all users with pagination and filters."""
    query = select(User)

    # Apply filters
    if search:
        query = query.where(
            (User.email.ilike(f"%{search}%")) |
            (User.name.ilike(f"%{search}%"))
        )

    if role:
        query = query.where(User.role == role)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Apply pagination
    query = query.offset((page - 1) * limit).limit(limit)
    query = query.order_by(User.created_at.desc())

    result = await db.execute(query)
    users = result.scalars().all()

    return {
        "users": [
            {
                "id": str(u.id),
                "email": u.email,
                "name": u.name,
                "role": u.role.value if hasattr(u.role, 'value') else u.role,
                "is_active": u.is_active,
                "created_at": u.created_at.isoformat()
            }
            for u in users
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit
        }
    }


@router.get("/users/{user_id}")
async def get_user_detail(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed user information."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get user's payments
    payments_query = select(Payment).where(Payment.user_id == user_id).limit(10)
    payments_result = await db.execute(payments_query)
    payments = payments_result.scalars().all()

    # Get user's subscription
    sub_query = select(Subscription).where(Subscription.user_id == user_id)
    sub_result = await db.execute(sub_query)
    subscription = sub_result.scalar_one_or_none()

    return {
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role.value if hasattr(user.role, 'value') else user.role,
            "is_active": user.is_active,
            "created_at": user.created_at.isoformat(),
            "updated_at": user.updated_at.isoformat() if user.updated_at else None
        },
        "subscription": {
            "plan": subscription.plan_id if subscription else None,
            "status": subscription.status if subscription else None,
            "expires_at": subscription.current_period_end.isoformat() if subscription else None
        } if subscription else None,
        "recent_payments": [
            {
                "id": str(p.id),
                "amount": p.amount,
                "status": p.status.value if hasattr(p.status, 'value') else p.status,
                "created_at": p.created_at.isoformat()
            }
            for p in payments
        ]
    }


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    data: UserUpdateRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Update user information."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.name is not None:
        user.name = data.name
    if data.role is not None:
        user.role = UserRole(data.role)
    if data.is_active is not None:
        user.is_active = data.is_active

    user.updated_at = datetime.utcnow()
    await db.commit()

    logger.info("User updated by admin", user_id=user_id, admin_id=str(admin.id))

    return {"message": "User updated successfully"}


@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: str,
    reason: Optional[str] = None,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Ban a user from the platform."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Cannot ban yourself")

    user.is_active = False
    user.updated_at = datetime.utcnow()
    await db.commit()

    logger.warning("User banned", user_id=user_id, admin_id=str(admin.id), reason=reason)

    return {"message": "User banned successfully"}


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Delete a user (soft delete by deactivating)."""
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if str(user.id) == str(admin.id):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    # Soft delete
    user.is_active = False
    user.email = f"deleted_{user.id}@deleted.local"
    user.updated_at = datetime.utcnow()
    await db.commit()

    logger.warning("User deleted", user_id=user_id, admin_id=str(admin.id))

    return {"message": "User deleted successfully"}


# Agent Verification Endpoints
@router.get("/agents/pending")
async def list_pending_agents(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """List agents pending verification."""
    query = select(Agent).where(Agent.status == AgentStatus.PENDING)

    # Get total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Paginate
    query = query.offset((page - 1) * limit).limit(limit)
    query = query.order_by(Agent.created_at.asc())  # Oldest first

    result = await db.execute(query)
    agents = result.scalars().all()

    return {
        "agents": [
            {
                "id": str(a.id),
                "user_id": str(a.user_id),
                "company_name": a.company_name,
                "license_number": a.license_number,
                "phone": a.phone,
                "region": a.region,
                "created_at": a.created_at.isoformat()
            }
            for a in agents
        ],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit if total else 0
        }
    }


@router.get("/agents/{agent_id}")
async def get_agent_detail(
    agent_id: str,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get detailed agent information for verification."""
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Get associated user
    user = await db.get(User, agent.user_id)

    return {
        "agent": {
            "id": str(agent.id),
            "company_name": agent.company_name,
            "license_number": agent.license_number,
            "phone": agent.phone,
            "region": agent.region,
            "specialties": agent.specialties,
            "status": agent.status.value if hasattr(agent.status, 'value') else agent.status,
            "created_at": agent.created_at.isoformat()
        },
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name
        } if user else None
    }


@router.post("/agents/{agent_id}/verify")
async def verify_agent(
    agent_id: str,
    data: AgentVerificationRequest,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Approve or reject agent verification."""
    agent = await db.get(Agent, agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    if agent.status != AgentStatus.PENDING:
        raise HTTPException(status_code=400, detail="Agent not pending verification")

    if data.approved:
        agent.status = AgentStatus.VERIFIED
        agent.verified_at = datetime.utcnow()

        # Update user role
        user = await db.get(User, agent.user_id)
        if user:
            user.role = UserRole.AGENT

        logger.info("Agent verified", agent_id=agent_id, admin_id=str(admin.id))
        message = "Agent verified successfully"
    else:
        agent.status = AgentStatus.REJECTED

        logger.info(
            "Agent rejected",
            agent_id=agent_id,
            admin_id=str(admin.id),
            reason=data.rejection_reason
        )
        message = "Agent rejected"

    await db.commit()

    # TODO: Send notification email to agent

    return {"message": message}


# Activity Log Endpoint
@router.get("/activity")
async def get_recent_activity(
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get recent platform activity for dashboard."""
    activities = []

    # Recent user registrations
    users_query = select(User).order_by(User.created_at.desc()).limit(10)
    users_result = await db.execute(users_query)
    for user in users_result.scalars().all():
        activities.append({
            "type": "user_registered",
            "description": f"New user: {user.email}",
            "timestamp": user.created_at.isoformat()
        })

    # Recent payments
    payments_query = (
        select(Payment)
        .where(Payment.status == PaymentStatus.COMPLETED)
        .order_by(Payment.created_at.desc())
        .limit(10)
    )
    payments_result = await db.execute(payments_query)
    for payment in payments_result.scalars().all():
        activities.append({
            "type": "payment_completed",
            "description": f"Payment: {payment.amount:,} KRW",
            "timestamp": payment.created_at.isoformat()
        })

    # Recent agent registrations
    agents_query = select(Agent).order_by(Agent.created_at.desc()).limit(10)
    agents_result = await db.execute(agents_query)
    for agent in agents_result.scalars().all():
        activities.append({
            "type": "agent_registered",
            "description": f"New agent: {agent.company_name}",
            "timestamp": agent.created_at.isoformat()
        })

    # Sort by timestamp and limit
    activities.sort(key=lambda x: x["timestamp"], reverse=True)
    return {"activities": activities[:limit]}
