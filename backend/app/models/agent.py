"""Agent model for real estate agents."""
from datetime import datetime
from typing import Optional, List

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

import enum


class AgentStatus(str, enum.Enum):
    """Agent verification status."""
    PENDING = "pending"
    VERIFIED = "verified"
    SUSPENDED = "suspended"
    REJECTED = "rejected"


class AgentTier(str, enum.Enum):
    """Agent subscription tier."""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"


class Agent(Base, UUIDMixin, TimestampMixin):
    """Real estate agent profile."""

    __tablename__ = "agents"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False
    )

    # Business info
    business_name: Mapped[str] = mapped_column(String(255), nullable=False)
    business_number: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)
    license_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    representative_name: Mapped[str] = mapped_column(String(100), nullable=False)

    # Contact
    office_phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    office_address: Mapped[str] = mapped_column(String(500), nullable=False)
    office_region: Mapped[str] = mapped_column(String(100), nullable=False)

    # Status
    status: Mapped[AgentStatus] = mapped_column(
        Enum(AgentStatus),
        default=AgentStatus.PENDING,
        nullable=False
    )
    tier: Mapped[AgentTier] = mapped_column(
        Enum(AgentTier),
        default=AgentTier.FREE,
        nullable=False
    )

    # Verification
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    verification_doc_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Profile
    introduction: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    specialties: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    profile_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Statistics
    total_deals: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    success_rate: Mapped[Optional[float]] = mapped_column(Integer, nullable=True)
    rating: Mapped[Optional[float]] = mapped_column(Integer, nullable=True)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Subscription
    subscription_expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    monthly_signal_limit: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    signals_used_this_month: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", backref="agent")
    listings = relationship("AgentListing", back_populates="agent")
    signal_responses = relationship("AgentSignalResponse", back_populates="agent")

    def __repr__(self) -> str:
        return f"<Agent {self.business_name}>"


class AgentListing(Base, UUIDMixin, TimestampMixin):
    """Property listing by agent."""

    __tablename__ = "agent_listings"

    agent_id: Mapped[str] = mapped_column(
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False
    )

    # Property info
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    property_type: Mapped[str] = mapped_column(String(50), nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    address: Mapped[str] = mapped_column(String(500), nullable=False)
    region: Mapped[str] = mapped_column(String(100), nullable=False)

    # Pricing
    price: Mapped[int] = mapped_column(Integer, nullable=False)
    deposit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    monthly_rent: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Details
    size_sqm: Mapped[Optional[float]] = mapped_column(Integer, nullable=True)
    rooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    floor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_floors: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    built_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Description
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    features: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Status
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    inquiry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    agent = relationship("Agent", back_populates="listings")

    def __repr__(self) -> str:
        return f"<AgentListing {self.title}>"


class AgentSignalResponse(Base, UUIDMixin, TimestampMixin):
    """Agent's response to an owner signal."""

    __tablename__ = "agent_signal_responses"

    agent_id: Mapped[str] = mapped_column(
        ForeignKey("agents.id", ondelete="CASCADE"),
        nullable=False
    )
    signal_id: Mapped[str] = mapped_column(
        ForeignKey("owner_signals.id", ondelete="CASCADE"),
        nullable=False
    )

    # Response content
    message: Mapped[str] = mapped_column(Text, nullable=False)
    proposed_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    commission_rate: Mapped[Optional[float]] = mapped_column(Integer, nullable=True)

    # Status
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Owner response
    owner_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    owner_responded_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    agent = relationship("Agent", back_populates="signal_responses")
    signal = relationship("OwnerSignal")

    def __repr__(self) -> str:
        return f"<AgentSignalResponse {self.id}>"
