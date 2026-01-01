"""
Owner Signal Endpoints
Anonymous property listings with full DB integration
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.api.v1.endpoints.auth import oauth2_scheme, get_current_user
from app.schemas.user import UserResponse
from app.schemas.signal import (
    SignalCreate,
    SignalUpdate,
    SignalResponse,
    SignalListResponse,
    InterestCreate,
    InterestResponse,
)
from app.services.signal import SignalService

router = APIRouter()


async def get_signal_service(db: AsyncSession = Depends(get_db)) -> SignalService:
    """Get signal service instance."""
    return SignalService(db)


@router.get("", response_model=SignalListResponse)
async def list_signals(
    region: Optional[str] = None,
    property_type: Optional[str] = None,
    min_price: Optional[int] = Query(None, gt=0),
    max_price: Optional[int] = Query(None, gt=0),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    service: SignalService = Depends(get_signal_service),
):
    """
    List all active signals with optional filters.

    Public endpoint - no authentication required.
    """
    signals, total, total_pages = await service.list_signals(
        region=region,
        property_type=property_type,
        min_price=min_price,
        max_price=max_price,
        page=page,
        page_size=page_size,
    )

    return SignalListResponse(
        items=[SignalResponse.model_validate(s) for s in signals],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=SignalResponse, status_code=status.HTTP_201_CREATED)
async def create_signal(
    data: SignalCreate,
    current_user: UserResponse = Depends(get_current_user),
    service: SignalService = Depends(get_signal_service),
):
    """
    Create a new owner signal.

    Requires authentication.
    """
    signal = await service.create_signal(current_user.id, data)
    return SignalResponse.model_validate(signal)


@router.get("/my", response_model=List[SignalResponse])
async def get_my_signals(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: UserResponse = Depends(get_current_user),
    service: SignalService = Depends(get_signal_service),
):
    """
    Get current user's signals.

    Requires authentication.
    """
    signals = await service.get_user_signals(current_user.id, limit, offset)
    return [SignalResponse.model_validate(s) for s in signals]


@router.get("/{signal_id}", response_model=SignalResponse)
async def get_signal(
    signal_id: str,
    service: SignalService = Depends(get_signal_service),
):
    """
    Get a specific signal by ID.

    Public endpoint - increments view count.
    """
    signal = await service.get_signal(signal_id, increment_view=True)
    return SignalResponse.model_validate(signal)


@router.put("/{signal_id}", response_model=SignalResponse)
async def update_signal(
    signal_id: str,
    data: SignalUpdate,
    current_user: UserResponse = Depends(get_current_user),
    service: SignalService = Depends(get_signal_service),
):
    """
    Update a signal.

    Requires authentication. Only owner can update.
    """
    signal = await service.update_signal(signal_id, current_user.id, data)
    return SignalResponse.model_validate(signal)


@router.delete("/{signal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_signal(
    signal_id: str,
    current_user: UserResponse = Depends(get_current_user),
    service: SignalService = Depends(get_signal_service),
):
    """
    Delete a signal.

    Requires authentication. Only owner can delete.
    """
    await service.delete_signal(signal_id, current_user.id)


@router.post("/{signal_id}/interest", response_model=InterestResponse, status_code=status.HTTP_201_CREATED)
async def create_interest(
    signal_id: str,
    data: InterestCreate,
    current_user: UserResponse = Depends(get_current_user),
    service: SignalService = Depends(get_signal_service),
):
    """
    Express interest in a signal.

    Requires authentication. Cannot express interest in own signal.
    """
    # Check if user is an agent (simplified check)
    is_agent = current_user.role == "AGENT"
    interest = await service.create_interest(signal_id, current_user.id, data, is_agent)
    return InterestResponse.model_validate(interest)


@router.get("/{signal_id}/interests", response_model=List[InterestResponse])
async def get_signal_interests(
    signal_id: str,
    current_user: UserResponse = Depends(get_current_user),
    service: SignalService = Depends(get_signal_service),
):
    """
    Get interests for a signal.

    Requires authentication. Only signal owner can view.
    """
    interests = await service.get_signal_interests(signal_id, current_user.id)
    return [InterestResponse.model_validate(i) for i in interests]


@router.patch("/{signal_id}/interests/{interest_id}/status")
async def update_interest_status(
    signal_id: str,
    interest_id: str,
    new_status: str = Query(..., regex="^(pending|accepted|rejected)$"),
    current_user: UserResponse = Depends(get_current_user),
    service: SignalService = Depends(get_signal_service),
):
    """
    Update interest status.

    Requires authentication. Only signal owner can update.
    """
    await service.update_interest_status(interest_id, current_user.id, new_status)
    return {"message": f"Interest status updated to {new_status}"}
