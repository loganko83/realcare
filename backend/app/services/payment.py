"""
Payment Service
Handles payment processing and subscription management
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.payment import (
    Payment,
    Subscription,
    PaymentStatus,
    PaymentMethod,
    SubscriptionPlan,
)
from app.models.agent import Agent, AgentTier


# Subscription pricing (in KRW)
SUBSCRIPTION_PRICES = {
    SubscriptionPlan.FREE: 0,
    SubscriptionPlan.BASIC: 29000,
    SubscriptionPlan.PREMIUM: 79000,
    SubscriptionPlan.ENTERPRISE: 199000,
}

# Agent tier mapping
PLAN_TO_TIER = {
    SubscriptionPlan.FREE: AgentTier.FREE,
    SubscriptionPlan.BASIC: AgentTier.BASIC,
    SubscriptionPlan.PREMIUM: AgentTier.PREMIUM,
    SubscriptionPlan.ENTERPRISE: AgentTier.ENTERPRISE,
}

# Signal limits per tier
SIGNAL_LIMITS = {
    AgentTier.FREE: 5,
    AgentTier.BASIC: 20,
    AgentTier.PREMIUM: 50,
    AgentTier.ENTERPRISE: 999,
}


class PaymentService:
    """Service for payment processing."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create_payment(
        self,
        user_id: str,
        amount: int,
        method: PaymentMethod,
        product_type: str,
        product_id: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Payment:
        """Create a new payment record."""
        payment = Payment(
            user_id=user_id,
            amount=amount,
            method=method,
            product_type=product_type,
            product_id=product_id,
            description=description,
            status=PaymentStatus.PENDING,
        )

        self.session.add(payment)
        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def process_payment(
        self,
        payment_id: str,
        gateway: str,
        gateway_data: Dict[str, Any],
    ) -> Payment:
        """Process a payment through a payment gateway."""
        result = await self.session.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        payment = result.scalar_one_or_none()

        if not payment:
            raise PaymentError("Payment not found")

        if payment.status != PaymentStatus.PENDING:
            raise PaymentError(f"Payment is already {payment.status.value}")

        # Update status to processing
        payment.status = PaymentStatus.PROCESSING
        payment.gateway = gateway
        await self.session.commit()

        try:
            # Simulate payment processing
            # In production, this would call the actual payment gateway
            success = await self._call_payment_gateway(gateway, gateway_data)

            if success:
                payment.status = PaymentStatus.COMPLETED
                payment.paid_at = datetime.utcnow()
                payment.gateway_tx_id = f"{gateway}_{payment_id[:8]}"
                payment.gateway_response = {"status": "success"}
            else:
                payment.status = PaymentStatus.FAILED
                payment.gateway_response = {"status": "failed", "error": "Payment declined"}

        except Exception as e:
            payment.status = PaymentStatus.FAILED
            payment.gateway_response = {"status": "error", "error": str(e)}

        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def _call_payment_gateway(
        self,
        gateway: str,
        data: Dict[str, Any]
    ) -> bool:
        """Call the payment gateway API."""
        # This is a placeholder for actual gateway integration
        # In production, implement calls to:
        # - KG Inicis
        # - Kakao Pay
        # - Naver Pay
        # - Toss Payments
        return True

    async def refund_payment(self, payment_id: str, reason: str = None) -> Payment:
        """Refund a payment."""
        result = await self.session.execute(
            select(Payment).where(Payment.id == payment_id)
        )
        payment = result.scalar_one_or_none()

        if not payment:
            raise PaymentError("Payment not found")

        if payment.status != PaymentStatus.COMPLETED:
            raise PaymentError("Only completed payments can be refunded")

        payment.status = PaymentStatus.REFUNDED
        payment.refunded_at = datetime.utcnow()
        payment.gateway_response = {
            **(payment.gateway_response or {}),
            "refund_reason": reason,
            "refund_status": "success",
        }

        await self.session.commit()
        await self.session.refresh(payment)
        return payment

    async def create_subscription(
        self,
        user_id: str,
        plan: SubscriptionPlan,
        billing_cycle: str = "monthly",
    ) -> Subscription:
        """Create a new subscription."""
        now = datetime.utcnow()

        if billing_cycle == "monthly":
            expires_at = now + timedelta(days=30)
        elif billing_cycle == "yearly":
            expires_at = now + timedelta(days=365)
        else:
            expires_at = now + timedelta(days=30)

        subscription = Subscription(
            user_id=user_id,
            plan=plan,
            billing_cycle=billing_cycle,
            price=SUBSCRIPTION_PRICES[plan],
            starts_at=now,
            expires_at=expires_at,
            next_billing_date=expires_at,
            features=self._get_plan_features(plan),
        )

        self.session.add(subscription)
        await self.session.commit()
        await self.session.refresh(subscription)
        return subscription

    async def upgrade_subscription(
        self,
        user_id: str,
        new_plan: SubscriptionPlan,
    ) -> Subscription:
        """Upgrade user's subscription plan."""
        result = await self.session.execute(
            select(Subscription)
            .where(Subscription.user_id == user_id, Subscription.is_active == True)
            .order_by(Subscription.created_at.desc())
        )
        current_sub = result.scalar_one_or_none()

        if current_sub:
            # Deactivate current subscription
            current_sub.is_active = False
            current_sub.cancelled_at = datetime.utcnow()

        # Create new subscription
        return await self.create_subscription(user_id, new_plan)

    async def apply_subscription_to_agent(
        self,
        agent_id: str,
        plan: SubscriptionPlan,
        expires_at: datetime,
    ) -> None:
        """Apply subscription benefits to agent."""
        tier = PLAN_TO_TIER[plan]
        signal_limit = SIGNAL_LIMITS[tier]

        await self.session.execute(
            update(Agent)
            .where(Agent.id == agent_id)
            .values(
                tier=tier,
                monthly_signal_limit=signal_limit,
                subscription_expires_at=expires_at,
            )
        )
        await self.session.commit()

    def _get_plan_features(self, plan: SubscriptionPlan) -> dict:
        """Get features for a subscription plan."""
        features = {
            SubscriptionPlan.FREE: {
                "signal_responses": 5,
                "listings": 3,
                "analytics": False,
                "priority_matching": False,
                "api_access": False,
            },
            SubscriptionPlan.BASIC: {
                "signal_responses": 20,
                "listings": 10,
                "analytics": True,
                "priority_matching": False,
                "api_access": False,
            },
            SubscriptionPlan.PREMIUM: {
                "signal_responses": 50,
                "listings": 30,
                "analytics": True,
                "priority_matching": True,
                "api_access": False,
            },
            SubscriptionPlan.ENTERPRISE: {
                "signal_responses": 999,
                "listings": 999,
                "analytics": True,
                "priority_matching": True,
                "api_access": True,
            },
        }
        return features.get(plan, {})


class PaymentError(Exception):
    """Payment error exception."""
    pass
