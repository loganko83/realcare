"""Signal service for business logic."""
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.owner_signal import OwnerSignal, SignalInterest, SignalStatus, PropertyType
from app.models.user import User
from app.repositories.signal import SignalRepository, SignalInterestRepository
from app.schemas.signal import SignalCreate, SignalUpdate, SignalResponse, InterestCreate


class SignalService:
    """Service for owner signal operations."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.signal_repo = SignalRepository(session)
        self.interest_repo = SignalInterestRepository(session)

    async def create_signal(
        self,
        user_id: str,
        data: SignalCreate
    ) -> OwnerSignal:
        """Create a new owner signal."""
        signal = OwnerSignal(
            id=str(uuid.uuid4()),
            user_id=user_id,
            property_type=PropertyType(data.property_type),
            property_address=data.property_address,
            property_size=data.property_size,
            floor=data.floor,
            total_floors=data.total_floors,
            built_year=data.built_year,
            latitude=data.latitude,
            longitude=data.longitude,
            region=data.region,
            district=data.district,
            asking_price=data.asking_price,
            is_negotiable=data.is_negotiable,
            min_acceptable_price=data.min_acceptable_price,
            is_anonymous=data.is_anonymous,
            description=data.description,
            features=data.features,
            status=SignalStatus.ACTIVE,
        )
        return await self.signal_repo.create(signal)

    async def get_signal(
        self,
        signal_id: str,
        increment_view: bool = True
    ) -> OwnerSignal:
        """Get a signal by ID."""
        signal = await self.signal_repo.get_by_id(signal_id)
        if not signal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signal not found"
            )
        if increment_view:
            await self.signal_repo.increment_view_count(signal_id)
        return signal

    async def get_user_signals(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[OwnerSignal]:
        """Get signals for a user."""
        return await self.signal_repo.get_by_user_id(user_id, limit, offset)

    async def list_signals(
        self,
        region: Optional[str] = None,
        property_type: Optional[str] = None,
        min_price: Optional[int] = None,
        max_price: Optional[int] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[OwnerSignal], int, int]:
        """List active signals with filters."""
        offset = (page - 1) * page_size
        signals, total = await self.signal_repo.list_active(
            region=region,
            property_type=property_type,
            min_price=min_price,
            max_price=max_price,
            limit=page_size,
            offset=offset
        )
        total_pages = (total + page_size - 1) // page_size
        return signals, total, total_pages

    async def update_signal(
        self,
        signal_id: str,
        user_id: str,
        data: SignalUpdate
    ) -> OwnerSignal:
        """Update a signal."""
        signal = await self.signal_repo.get_by_id(signal_id)
        if not signal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signal not found"
            )
        if signal.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this signal"
            )

        update_data = data.model_dump(exclude_unset=True)
        if "status" in update_data and update_data["status"]:
            update_data["status"] = SignalStatus(update_data["status"])

        return await self.signal_repo.update(signal, **update_data)

    async def delete_signal(
        self,
        signal_id: str,
        user_id: str
    ) -> None:
        """Delete a signal."""
        signal = await self.signal_repo.get_by_id(signal_id)
        if not signal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signal not found"
            )
        if signal.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this signal"
            )
        await self.signal_repo.delete(signal_id)

    async def create_interest(
        self,
        signal_id: str,
        user_id: str,
        data: InterestCreate,
        is_agent: bool = False
    ) -> SignalInterest:
        """Express interest in a signal."""
        signal = await self.signal_repo.get_by_id(signal_id)
        if not signal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signal not found"
            )
        if signal.status != SignalStatus.ACTIVE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Signal is not active"
            )
        if signal.user_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot express interest in your own signal"
            )

        # Check if already expressed interest
        if await self.interest_repo.exists(signal_id, user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Already expressed interest in this signal"
            )

        interest = SignalInterest(
            id=str(uuid.uuid4()),
            signal_id=signal_id,
            user_id=user_id,
            message=data.message,
            offered_price=data.offered_price,
            is_agent=is_agent,
            status="pending"
        )

        result = await self.interest_repo.create(interest)
        await self.signal_repo.increment_interest_count(signal_id)
        return result

    async def get_signal_interests(
        self,
        signal_id: str,
        user_id: str
    ) -> List[SignalInterest]:
        """Get interests for a signal (owner only)."""
        signal = await self.signal_repo.get_by_id(signal_id)
        if not signal:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Signal not found"
            )
        if signal.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to view interests"
            )
        return await self.interest_repo.get_by_signal_id(signal_id)

    async def update_interest_status(
        self,
        interest_id: str,
        user_id: str,
        new_status: str
    ) -> None:
        """Update interest status (signal owner only)."""
        interest = await self.interest_repo.get_by_id(interest_id)
        if not interest:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interest not found"
            )

        signal = await self.signal_repo.get_by_id(interest.signal_id)
        if not signal or signal.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this interest"
            )

        if new_status not in ["pending", "accepted", "rejected"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid status"
            )

        await self.interest_repo.update_status(interest_id, new_status)
