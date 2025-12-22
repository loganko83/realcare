"""Payment models."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

import enum


class PaymentStatus(str, enum.Enum):
    """Payment status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    """Payment method."""
    CARD = "card"
    BANK_TRANSFER = "bank_transfer"
    KAKAO_PAY = "kakao_pay"
    NAVER_PAY = "naver_pay"
    TOSS_PAY = "toss_pay"


class SubscriptionPlan(str, enum.Enum):
    """Subscription plan types."""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class Payment(Base, UUIDMixin, TimestampMixin):
    """Payment record."""

    __tablename__ = "payments"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Payment info
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="KRW", nullable=False)
    method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod),
        nullable=False
    )
    status: Mapped[PaymentStatus] = mapped_column(
        Enum(PaymentStatus),
        default=PaymentStatus.PENDING,
        nullable=False
    )

    # Product info
    product_type: Mapped[str] = mapped_column(String(50), nullable=False)
    product_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Gateway info
    gateway: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    gateway_tx_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    gateway_response: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Timestamps
    paid_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    refunded_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    user = relationship("User", backref="payments")

    def __repr__(self) -> str:
        return f"<Payment {self.id} - {self.amount} {self.currency}>"


class Subscription(Base, UUIDMixin, TimestampMixin):
    """User subscription record."""

    __tablename__ = "subscriptions"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    plan: Mapped[SubscriptionPlan] = mapped_column(
        Enum(SubscriptionPlan),
        default=SubscriptionPlan.FREE,
        nullable=False
    )

    # Billing cycle
    billing_cycle: Mapped[str] = mapped_column(
        String(20),
        default="monthly",
        nullable=False
    )
    price: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    auto_renew: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Dates
    starts_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False
    )
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Payment info
    last_payment_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    next_billing_date: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Features
    features: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    # Relationships
    user = relationship("User", backref="subscriptions")

    def __repr__(self) -> str:
        return f"<Subscription {self.id} - {self.plan.value}>"
