"""Reality check report model."""
from typing import Optional

from sqlalchemy import JSON, Enum, ForeignKey, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin

import enum


class TransactionType(str, enum.Enum):
    """Type of real estate transaction."""
    SALE = "sale"
    JEONSE = "jeonse"
    MONTHLY_RENT = "monthly_rent"


class RealityReport(Base, UUIDMixin, TimestampMixin):
    """Reality check analysis report."""

    __tablename__ = "reality_reports"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    # Property information
    property_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    property_address: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    property_price: Mapped[int] = mapped_column(Integer, nullable=False)
    transaction_type: Mapped[TransactionType] = mapped_column(
        Enum(TransactionType),
        nullable=False
    )
    region: Mapped[str] = mapped_column(String(100), nullable=False)

    # Financial inputs
    annual_income: Mapped[int] = mapped_column(Integer, nullable=False)
    available_cash: Mapped[int] = mapped_column(Integer, nullable=False)
    existing_debt: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    monthly_expenses: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    house_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Analysis results
    reality_score: Mapped[int] = mapped_column(Integer, nullable=False)
    ltv_ratio: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    dsr_ratio: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    max_loan: Mapped[int] = mapped_column(Integer, nullable=False)
    required_cash: Mapped[int] = mapped_column(Integer, nullable=False)
    cash_gap: Mapped[int] = mapped_column(Integer, nullable=False)
    monthly_payment: Mapped[int] = mapped_column(Integer, nullable=False)

    # Detailed breakdown
    score_breakdown: Mapped[dict] = mapped_column(JSON, nullable=True)
    recommendations: Mapped[list] = mapped_column(JSON, nullable=True)

    # Relationships
    user = relationship("User", back_populates="reality_reports")

    def __repr__(self) -> str:
        return f"<RealityReport {self.id} - Score: {self.reality_score}>"
