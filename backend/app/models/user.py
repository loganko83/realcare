"""User model for authentication."""
from datetime import datetime
from typing import Optional

from sqlalchemy import Boolean, DateTime, Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

import enum


class UserRole(str, enum.Enum):
    """User roles in the system."""
    USER = "user"
    AGENT = "agent"
    ADMIN = "admin"


class AuthProvider(str, enum.Enum):
    """OAuth providers."""
    EMAIL = "email"
    KAKAO = "kakao"
    NAVER = "naver"
    GOOGLE = "google"


class User(Base, UUIDMixin, TimestampMixin):
    """User model."""

    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    hashed_password: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        default=UserRole.USER,
        nullable=False
    )
    auth_provider: Mapped[AuthProvider] = mapped_column(
        Enum(AuthProvider),
        default=AuthProvider.EMAIL,
        nullable=False
    )
    provider_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    last_login_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # DID integration
    did_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    wallet_address: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    # Relationships
    reality_reports = relationship("RealityReport", back_populates="user")
    signals = relationship("OwnerSignal", back_populates="user")
    contracts = relationship("Contract", back_populates="user")
    uploaded_files = relationship("UploadedFile", back_populates="user")

    def __repr__(self) -> str:
        return f"<User {self.email}>"
