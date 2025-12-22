"""
Payment Endpoints
Payment processing and subscription management APIs
"""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.payment import (
    Payment,
    Subscription,
    PaymentStatus,
    PaymentMethod,
    SubscriptionPlan,
)
from app.models.agent import Agent
from app.services.payment import PaymentService, PaymentError, SUBSCRIPTION_PRICES
from app.api.v1.endpoints.auth import oauth2_scheme
from app.services.auth import AuthService

router = APIRouter()


# Schemas
class PaymentCreateRequest(BaseModel):
    """Payment creation request."""
    amount: int = Field(..., gt=0)
    method: str = Field(..., description="card, bank_transfer, kakao_pay, naver_pay, toss_pay")
    product_type: str = Field(..., description="subscription, one_time")
    product_id: Optional[str] = None
    description: Optional[str] = None


class PaymentProcessRequest(BaseModel):
    """Payment processing request."""
    gateway: str = Field(..., description="inicis, kakao, naver, toss")
    card_number: Optional[str] = None
    expiry: Optional[str] = None
    cvv: Optional[str] = None


class PaymentResponse(BaseModel):
    """Payment response."""
    id: str
    amount: int
    currency: str
    method: str
    status: str
    product_type: str
    product_id: Optional[str]
    description: Optional[str]
    gateway: Optional[str]
    gateway_tx_id: Optional[str]
    paid_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionCreateRequest(BaseModel):
    """Subscription creation request."""
    plan: str = Field(..., description="free, basic, premium, enterprise")
    billing_cycle: str = Field("monthly", description="monthly or yearly")


class SubscriptionResponse(BaseModel):
    """Subscription response."""
    id: str
    plan: str
    billing_cycle: str
    price: int
    is_active: bool
    auto_renew: bool
    starts_at: datetime
    expires_at: datetime
    next_billing_date: Optional[datetime]
    features: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True


class PlanInfoResponse(BaseModel):
    """Subscription plan info."""
    plan: str
    price_monthly: int
    price_yearly: int
    features: dict


# Endpoints
@router.get("/plans", response_model=List[PlanInfoResponse])
async def get_subscription_plans():
    """Get available subscription plans."""
    plans = [
        PlanInfoResponse(
            plan="free",
            price_monthly=0,
            price_yearly=0,
            features={
                "signal_responses": 5,
                "listings": 3,
                "analytics": False,
                "priority_matching": False,
            },
        ),
        PlanInfoResponse(
            plan="basic",
            price_monthly=29000,
            price_yearly=290000,
            features={
                "signal_responses": 20,
                "listings": 10,
                "analytics": True,
                "priority_matching": False,
            },
        ),
        PlanInfoResponse(
            plan="premium",
            price_monthly=79000,
            price_yearly=790000,
            features={
                "signal_responses": 50,
                "listings": 30,
                "analytics": True,
                "priority_matching": True,
            },
        ),
        PlanInfoResponse(
            plan="enterprise",
            price_monthly=199000,
            price_yearly=1990000,
            features={
                "signal_responses": "unlimited",
                "listings": "unlimited",
                "analytics": True,
                "priority_matching": True,
                "api_access": True,
            },
        ),
    ]
    return plans


@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    request: PaymentCreateRequest,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Create a new payment."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    try:
        method = PaymentMethod(request.method)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid payment method: {request.method}"
        )

    payment_service = PaymentService(db)
    payment = await payment_service.create_payment(
        user_id=user.id,
        amount=request.amount,
        method=method,
        product_type=request.product_type,
        product_id=request.product_id,
        description=request.description,
    )

    return PaymentResponse.model_validate(payment)


@router.post("/payments/{payment_id}/process", response_model=PaymentResponse)
async def process_payment(
    payment_id: str,
    request: PaymentProcessRequest,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Process a pending payment."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    # Verify payment belongs to user
    result = await db.execute(
        select(Payment).where(
            Payment.id == payment_id,
            Payment.user_id == user.id
        )
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    try:
        payment_service = PaymentService(db)
        payment = await payment_service.process_payment(
            payment_id=payment_id,
            gateway=request.gateway,
            gateway_data=request.model_dump(),
        )

        return PaymentResponse.model_validate(payment)

    except PaymentError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/payments", response_model=List[PaymentResponse])
async def get_my_payments(
    status: Optional[str] = None,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Get user's payment history."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    query = select(Payment).where(Payment.user_id == user.id)

    if status:
        query = query.where(Payment.status == status)

    query = query.order_by(Payment.created_at.desc())

    result = await db.execute(query)
    payments = result.scalars().all()

    return [PaymentResponse.model_validate(p) for p in payments]


@router.get("/payments/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: str,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Get a specific payment."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    result = await db.execute(
        select(Payment).where(
            Payment.id == payment_id,
            Payment.user_id == user.id
        )
    )
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return PaymentResponse.model_validate(payment)


@router.post("/subscriptions", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    request: SubscriptionCreateRequest,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Create a new subscription."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    try:
        plan = SubscriptionPlan(request.plan)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan: {request.plan}"
        )

    # Check if user is an agent
    result = await db.execute(
        select(Agent).where(Agent.user_id == user.id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only agents can subscribe to plans"
        )

    payment_service = PaymentService(db)
    subscription = await payment_service.create_subscription(
        user_id=user.id,
        plan=plan,
        billing_cycle=request.billing_cycle,
    )

    # Apply subscription to agent
    await payment_service.apply_subscription_to_agent(
        agent_id=agent.id,
        plan=plan,
        expires_at=subscription.expires_at,
    )

    return SubscriptionResponse.model_validate(subscription)


@router.get("/subscriptions/current", response_model=SubscriptionResponse)
async def get_current_subscription(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Get current active subscription."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    result = await db.execute(
        select(Subscription)
        .where(Subscription.user_id == user.id, Subscription.is_active == True)
        .order_by(Subscription.created_at.desc())
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(status_code=404, detail="No active subscription")

    return SubscriptionResponse.model_validate(subscription)


@router.post("/subscriptions/{subscription_id}/cancel")
async def cancel_subscription(
    subscription_id: str,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Cancel a subscription."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    result = await db.execute(
        select(Subscription).where(
            Subscription.id == subscription_id,
            Subscription.user_id == user.id
        )
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    subscription.auto_renew = False
    subscription.cancelled_at = datetime.utcnow()
    await db.commit()

    return {
        "message": "Subscription cancelled",
        "expires_at": subscription.expires_at.isoformat(),
    }


@router.post("/subscriptions/upgrade", response_model=SubscriptionResponse)
async def upgrade_subscription(
    request: SubscriptionCreateRequest,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Upgrade subscription to a new plan."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    try:
        plan = SubscriptionPlan(request.plan)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid plan: {request.plan}"
        )

    # Check if user is an agent
    result = await db.execute(
        select(Agent).where(Agent.user_id == user.id)
    )
    agent = result.scalar_one_or_none()

    if not agent:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only agents can subscribe to plans"
        )

    payment_service = PaymentService(db)
    subscription = await payment_service.upgrade_subscription(
        user_id=user.id,
        new_plan=plan,
    )

    # Apply subscription to agent
    await payment_service.apply_subscription_to_agent(
        agent_id=agent.id,
        plan=plan,
        expires_at=subscription.expires_at,
    )

    return SubscriptionResponse.model_validate(subscription)
