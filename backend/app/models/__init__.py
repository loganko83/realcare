"""Database models."""
from app.models.base import Base, TimestampMixin, UUIDMixin
from app.models.user import User, UserRole, AuthProvider
from app.models.reality_report import RealityReport, TransactionType
from app.models.owner_signal import OwnerSignal, SignalInterest, PropertyType, SignalStatus
from app.models.contract import Contract, TimelineTask, ContractType, ContractStatus

__all__ = [
    # Base
    "Base",
    "TimestampMixin",
    "UUIDMixin",
    # User
    "User",
    "UserRole",
    "AuthProvider",
    # Reality Report
    "RealityReport",
    "TransactionType",
    # Owner Signal
    "OwnerSignal",
    "SignalInterest",
    "PropertyType",
    "SignalStatus",
    # Contract
    "Contract",
    "TimelineTask",
    "ContractType",
    "ContractStatus",
]
