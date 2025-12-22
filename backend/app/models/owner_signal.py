"""Owner signal model for anonymous selling intent."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

import enum


class PropertyType(str, enum.Enum):
    """Type of property."""
    APARTMENT = "apartment"
    VILLA = "villa"
    OFFICETEL = "officetel"
    HOUSE = "house"
    COMMERCIAL = "commercial"
    LAND = "land"


class SignalStatus(str, enum.Enum):
    """Status of the owner signal."""
    ACTIVE = "active"
    PAUSED = "paused"
    MATCHED = "matched"
    COMPLETED = "completed"
    EXPIRED = "expired"


class OwnerSignal(Base, UUIDMixin, TimestampMixin):
    """Owner signal for anonymous property selling intent."""

    __tablename__ = "owner_signals"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Property details
    property_type: Mapped[PropertyType] = mapped_column(
        Enum(PropertyType),
        nullable=False
    )
    property_address: Mapped[str] = mapped_column(String(500), nullable=False)
    property_size: Mapped[Optional[float]] = mapped_column(Numeric(10, 2), nullable=True)
    floor: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_floors: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    built_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Location
    latitude: Mapped[Optional[float]] = mapped_column(Numeric(10, 8), nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Numeric(11, 8), nullable=True)
    region: Mapped[str] = mapped_column(String(100), nullable=False)
    district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Pricing
    asking_price: Mapped[int] = mapped_column(Integer, nullable=False)
    is_negotiable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    min_acceptable_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Signal settings
    status: Mapped[SignalStatus] = mapped_column(
        Enum(SignalStatus),
        default=SignalStatus.ACTIVE,
        nullable=False
    )
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expires_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Additional info
    description: Mapped[Optional[str]] = mapped_column(String(2000), nullable=True)
    features: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    images: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Verification
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_doc_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    # Statistics
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    interest_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    user = relationship("User", back_populates="signals")
    interests = relationship("SignalInterest", back_populates="signal")

    def __repr__(self) -> str:
        return f"<OwnerSignal {self.id} - {self.property_type.value}>"


class SignalInterest(Base, UUIDMixin, TimestampMixin):
    """Interest expressed in an owner signal."""

    __tablename__ = "signal_interests"

    signal_id: Mapped[str] = mapped_column(
        ForeignKey("owner_signals.id", ondelete="CASCADE"),
        nullable=False
    )
    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    message: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    offered_price: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_agent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)

    # Relationships
    signal = relationship("OwnerSignal", back_populates="interests")
    user = relationship("User")

    def __repr__(self) -> str:
        return f"<SignalInterest {self.id}>"
