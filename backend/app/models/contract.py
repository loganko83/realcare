"""Contract model for property transactions."""
from datetime import date, datetime
from typing import Optional

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

import enum


class ContractType(str, enum.Enum):
    """Type of contract."""
    SALE = "sale"
    JEONSE = "jeonse"
    MONTHLY_RENT = "monthly_rent"


class ContractStatus(str, enum.Enum):
    """Status of the contract."""
    DRAFT = "draft"
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Contract(Base, UUIDMixin, TimestampMixin):
    """Contract for property transactions."""

    __tablename__ = "contracts"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Contract basics
    contract_type: Mapped[ContractType] = mapped_column(
        Enum(ContractType),
        nullable=False
    )
    status: Mapped[ContractStatus] = mapped_column(
        Enum(ContractStatus),
        default=ContractStatus.DRAFT,
        nullable=False
    )

    # Property info
    property_address: Mapped[str] = mapped_column(String(500), nullable=False)
    property_description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    # Key dates
    contract_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    move_in_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    move_out_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    # Financial details
    total_price: Mapped[int] = mapped_column(Integer, nullable=False)
    deposit: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    monthly_rent: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    loan_amount: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Contract analysis
    risk_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    analysis_result: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    identified_risks: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    # Files
    contract_file_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contract_file_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    # Timeline
    has_loan: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    has_interior_work: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Blockchain verification
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    blockchain_tx_hash: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationships
    user = relationship("User", back_populates="contracts")
    timeline_tasks = relationship("TimelineTask", back_populates="contract")

    def __repr__(self) -> str:
        return f"<Contract {self.id} - {self.contract_type.value}>"


class TimelineTask(Base, UUIDMixin, TimestampMixin):
    """Timeline task for contract."""

    __tablename__ = "timeline_tasks"

    contract_id: Mapped[str] = mapped_column(
        ForeignKey("contracts.id", ondelete="CASCADE"),
        nullable=False
    )

    # Task details
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    priority: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)

    # Timing
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    d_day_offset: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Status
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_optional: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    contract = relationship("Contract", back_populates="timeline_tasks")

    def __repr__(self) -> str:
        return f"<TimelineTask {self.title}>"
