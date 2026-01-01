"""Signal repository for database operations."""
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import select, update, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.owner_signal import OwnerSignal, SignalInterest, SignalStatus, PropertyType


class SignalRepository:
    """Repository for owner signal database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, signal_id: str) -> Optional[OwnerSignal]:
        """Get signal by ID."""
        result = await self.session.execute(
            select(OwnerSignal).where(OwnerSignal.id == signal_id)
        )
        return result.scalar_one_or_none()

    async def get_by_user_id(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[OwnerSignal]:
        """Get signals by user ID."""
        result = await self.session.execute(
            select(OwnerSignal)
            .where(OwnerSignal.user_id == user_id)
            .order_by(OwnerSignal.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all())

    async def list_active(
        self,
        region: Optional[str] = None,
        property_type: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[OwnerSignal], int]:
        """List active signals with filters and pagination."""
        conditions = [OwnerSignal.status == SignalStatus.ACTIVE]

        if region:
            conditions.append(OwnerSignal.region == region)
        if property_type:
            conditions.append(OwnerSignal.property_type == PropertyType(property_type))
        if min_price is not None:
            conditions.append(OwnerSignal.asking_price >= min_price)
        if max_price is not None:
            conditions.append(OwnerSignal.asking_price <= max_price)

        # Get total count
        count_query = select(func.count(OwnerSignal.id)).where(and_(*conditions))
        total_result = await self.session.execute(count_query)
        total = total_result.scalar() or 0

        # Get paginated results
        result = await self.session.execute(
            select(OwnerSignal)
            .where(and_(*conditions))
            .order_by(OwnerSignal.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        signals = list(result.scalars().all())

        return signals, total

    async def create(self, signal: OwnerSignal) -> OwnerSignal:
        """Create a new signal."""
        self.session.add(signal)
        await self.session.commit()
        await self.session.refresh(signal)
        return signal

    async def update(self, signal: OwnerSignal, **kwargs) -> OwnerSignal:
        """Update signal fields."""
        for key, value in kwargs.items():
            if hasattr(signal, key) and value is not None:
                setattr(signal, key, value)
        await self.session.commit()
        await self.session.refresh(signal)
        return signal

    async def update_status(self, signal_id: str, status: SignalStatus) -> None:
        """Update signal status."""
        await self.session.execute(
            update(OwnerSignal)
            .where(OwnerSignal.id == signal_id)
            .values(status=status)
        )
        await self.session.commit()

    async def increment_view_count(self, signal_id: str) -> None:
        """Increment signal view count."""
        await self.session.execute(
            update(OwnerSignal)
            .where(OwnerSignal.id == signal_id)
            .values(view_count=OwnerSignal.view_count + 1)
        )
        await self.session.commit()

    async def increment_interest_count(self, signal_id: str) -> None:
        """Increment signal interest count."""
        await self.session.execute(
            update(OwnerSignal)
            .where(OwnerSignal.id == signal_id)
            .values(interest_count=OwnerSignal.interest_count + 1)
        )
        await self.session.commit()

    async def delete(self, signal_id: str) -> None:
        """Delete a signal."""
        signal = await self.get_by_id(signal_id)
        if signal:
            await self.session.delete(signal)
            await self.session.commit()


class SignalInterestRepository:
    """Repository for signal interest database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, interest_id: str) -> Optional[SignalInterest]:
        """Get interest by ID."""
        result = await self.session.execute(
            select(SignalInterest).where(SignalInterest.id == interest_id)
        )
        return result.scalar_one_or_none()

    async def get_by_signal_id(
        self,
        signal_id: str,
        limit: int = 50
    ) -> List[SignalInterest]:
        """Get interests for a signal."""
        result = await self.session.execute(
            select(SignalInterest)
            .where(SignalInterest.signal_id == signal_id)
            .order_by(SignalInterest.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def get_by_user_id(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[SignalInterest]:
        """Get interests by user ID."""
        result = await self.session.execute(
            select(SignalInterest)
            .where(SignalInterest.user_id == user_id)
            .order_by(SignalInterest.created_at.desc())
            .limit(limit)
        )
        return list(result.scalars().all())

    async def exists(self, signal_id: str, user_id: str) -> bool:
        """Check if user already expressed interest."""
        result = await self.session.execute(
            select(func.count(SignalInterest.id))
            .where(
                SignalInterest.signal_id == signal_id,
                SignalInterest.user_id == user_id
            )
        )
        return (result.scalar() or 0) > 0

    async def create(self, interest: SignalInterest) -> SignalInterest:
        """Create a new interest."""
        self.session.add(interest)
        await self.session.commit()
        await self.session.refresh(interest)
        return interest

    async def update_status(self, interest_id: str, status: str) -> None:
        """Update interest status."""
        await self.session.execute(
            update(SignalInterest)
            .where(SignalInterest.id == interest_id)
            .values(status=status)
        )
        await self.session.commit()
