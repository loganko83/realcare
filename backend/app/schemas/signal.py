"""Owner signal schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class SignalCreate(BaseModel):
    """Schema for creating an owner signal."""
    property_type: str = Field(..., description="apartment, villa, officetel, house, commercial, land")
    property_address: str = Field(..., min_length=5, max_length=500)
    property_size: Optional[float] = Field(None, gt=0)
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    built_year: Optional[int] = Field(None, ge=1900, le=2030)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    region: str = Field(..., max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    asking_price: int = Field(..., gt=0)
    is_negotiable: bool = True
    min_acceptable_price: Optional[int] = Field(None, gt=0)
    is_anonymous: bool = True
    description: Optional[str] = Field(None, max_length=2000)
    features: Optional[List[str]] = None


class SignalUpdate(BaseModel):
    """Schema for updating an owner signal."""
    asking_price: Optional[int] = Field(None, gt=0)
    is_negotiable: Optional[bool] = None
    min_acceptable_price: Optional[int] = Field(None, gt=0)
    status: Optional[str] = None
    description: Optional[str] = Field(None, max_length=2000)
    features: Optional[List[str]] = None


class SignalResponse(BaseModel):
    """Owner signal response."""
    id: str
    property_type: str
    property_address: str
    property_size: Optional[float]
    floor: Optional[int]
    total_floors: Optional[int]
    built_year: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    region: str
    district: Optional[str]
    asking_price: int
    is_negotiable: bool
    status: str
    is_anonymous: bool
    description: Optional[str]
    features: Optional[List[str]]
    view_count: int
    interest_count: int
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SignalListResponse(BaseModel):
    """Paginated list of signals."""
    items: List[SignalResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class InterestCreate(BaseModel):
    """Schema for expressing interest in a signal."""
    message: Optional[str] = Field(None, max_length=1000)
    offered_price: Optional[int] = Field(None, gt=0)


class InterestResponse(BaseModel):
    """Interest response."""
    id: str
    signal_id: str
    user_id: str
    message: Optional[str]
    offered_price: Optional[int]
    is_agent: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class SignalFilterParams(BaseModel):
    """Filter parameters for signal search."""
    region: Optional[str] = None
    property_type: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    status: Optional[str] = "active"
