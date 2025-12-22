"""
Owner Signal Endpoints
Anonymous property listings
"""

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from enum import Enum

router = APIRouter()


class SignalType(str, Enum):
    SELL = "sell"
    RENT = "rent"


class PropertyType(str, Enum):
    APARTMENT = "apartment"
    VILLA = "villa"
    OFFICETEL = "officetel"
    HOUSE = "house"


class UrgencyLevel(str, Enum):
    URGENT = "urgent"
    NORMAL = "normal"
    FLEXIBLE = "flexible"


class SignalStatus(str, Enum):
    ACTIVE = "active"
    PAUSED = "paused"
    MATCHED = "matched"
    CLOSED = "closed"


class PropertyInfo(BaseModel):
    """Property information."""
    property_type: PropertyType
    district: str
    address_masked: str
    area_sqm: float = Field(..., gt=0)
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    built_year: Optional[int] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


class PricingInfo(BaseModel):
    """Pricing information."""
    min_price: int = Field(..., gt=0)
    max_price: int = Field(..., gt=0)
    is_negotiable: bool = True


class PreferencesInfo(BaseModel):
    """Owner preferences."""
    urgency: UrgencyLevel = UrgencyLevel.NORMAL
    preferred_contact: List[str] = ["kakao"]
    description: Optional[str] = None


class SignalCreate(BaseModel):
    """Create signal request."""
    signal_type: SignalType
    property: PropertyInfo
    pricing: PricingInfo
    preferences: PreferencesInfo


class SignalUpdate(BaseModel):
    """Update signal request."""
    pricing: Optional[PricingInfo] = None
    preferences: Optional[PreferencesInfo] = None
    status: Optional[SignalStatus] = None


class SignalStats(BaseModel):
    """Signal statistics."""
    view_count: int = 0
    contact_request_count: int = 0
    favorite_count: int = 0


class SignalResponse(BaseModel):
    """Signal response."""
    id: str
    user_id: str
    signal_type: SignalType
    property: PropertyInfo
    pricing: PricingInfo
    preferences: PreferencesInfo
    stats: SignalStats
    status: SignalStatus
    created_at: datetime
    updated_at: datetime


class ContactRequestCreate(BaseModel):
    """Contact request creation."""
    message: Optional[str] = None
    reality_score: Optional[int] = None
    contact_preference: str = "kakao"


@router.get("", response_model=List[SignalResponse])
async def list_signals(
    signal_type: Optional[SignalType] = None,
    district: Optional[str] = None,
    min_price: Optional[int] = None,
    max_price: Optional[int] = None,
    limit: int = Query(20, le=100),
    offset: int = 0,
):
    """
    List all active signals with optional filters.

    TODO: Implement with database
    """
    # Placeholder
    return []


@router.post("", response_model=SignalResponse)
async def create_signal(signal: SignalCreate):
    """
    Create a new owner signal.

    TODO: Implement with database
    """
    # Placeholder
    return SignalResponse(
        id="signal_placeholder",
        user_id="user_placeholder",
        signal_type=signal.signal_type,
        property=signal.property,
        pricing=signal.pricing,
        preferences=signal.preferences,
        stats=SignalStats(),
        status=SignalStatus.ACTIVE,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.get("/my", response_model=List[SignalResponse])
async def get_my_signals():
    """
    Get current user's signals.

    TODO: Implement with authentication
    """
    return []


@router.get("/{signal_id}", response_model=SignalResponse)
async def get_signal(signal_id: str):
    """
    Get a specific signal.

    TODO: Implement with database
    """
    raise HTTPException(status_code=404, detail="Signal not found")


@router.put("/{signal_id}", response_model=SignalResponse)
async def update_signal(signal_id: str, update: SignalUpdate):
    """
    Update a signal.

    TODO: Implement with database
    """
    raise HTTPException(status_code=404, detail="Signal not found")


@router.delete("/{signal_id}")
async def delete_signal(signal_id: str):
    """
    Delete a signal.

    TODO: Implement with database
    """
    return {"message": "Signal deleted"}


@router.post("/{signal_id}/contact")
async def send_contact_request(signal_id: str, request: ContactRequestCreate):
    """
    Send a contact request to signal owner.

    TODO: Implement with database
    """
    return {
        "message": "Contact request sent",
        "request_id": "contact_placeholder",
    }
