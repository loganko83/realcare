"""Agent schemas."""
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class AgentRegister(BaseModel):
    """Schema for agent registration."""
    business_name: str = Field(..., min_length=2, max_length=255)
    business_number: str = Field(..., min_length=10, max_length=20)
    license_number: str = Field(..., min_length=5, max_length=50)
    representative_name: str = Field(..., min_length=2, max_length=100)
    office_phone: Optional[str] = Field(None, max_length=20)
    office_address: str = Field(..., min_length=10, max_length=500)
    office_region: str = Field(..., max_length=100)
    introduction: Optional[str] = None
    specialties: Optional[List[str]] = None


class AgentUpdate(BaseModel):
    """Schema for updating agent profile."""
    office_phone: Optional[str] = Field(None, max_length=20)
    office_address: Optional[str] = Field(None, max_length=500)
    introduction: Optional[str] = None
    specialties: Optional[List[str]] = None
    profile_image_url: Optional[str] = None


class AgentResponse(BaseModel):
    """Agent response schema."""
    id: str
    user_id: str
    business_name: str
    business_number: str
    license_number: str
    representative_name: str
    office_phone: Optional[str]
    office_address: str
    office_region: str
    status: str
    tier: str
    verified_at: Optional[datetime]
    introduction: Optional[str]
    specialties: Optional[List[str]]
    profile_image_url: Optional[str]
    total_deals: int
    rating: Optional[float]
    review_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class AgentPublicResponse(BaseModel):
    """Public agent info (for clients)."""
    id: str
    business_name: str
    office_region: str
    introduction: Optional[str]
    specialties: Optional[List[str]]
    profile_image_url: Optional[str]
    total_deals: int
    rating: Optional[float]
    review_count: int

    class Config:
        from_attributes = True


class AgentListResponse(BaseModel):
    """Paginated list of agents."""
    items: List[AgentPublicResponse]
    total: int
    page: int
    page_size: int


# Listing schemas
class ListingCreate(BaseModel):
    """Schema for creating a property listing."""
    title: str = Field(..., min_length=5, max_length=255)
    property_type: str = Field(..., description="apartment, villa, officetel, house, commercial")
    transaction_type: str = Field(..., description="sale, jeonse, monthly_rent")
    address: str = Field(..., min_length=10, max_length=500)
    region: str = Field(..., max_length=100)
    price: int = Field(..., gt=0)
    deposit: Optional[int] = Field(None, ge=0)
    monthly_rent: Optional[int] = Field(None, ge=0)
    size_sqm: Optional[float] = Field(None, gt=0)
    rooms: Optional[int] = Field(None, ge=0)
    bathrooms: Optional[int] = Field(None, ge=0)
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    built_year: Optional[int] = Field(None, ge=1900, le=2030)
    description: Optional[str] = None
    features: Optional[List[str]] = None
    images: Optional[List[str]] = None


class ListingUpdate(BaseModel):
    """Schema for updating a listing."""
    title: Optional[str] = Field(None, min_length=5, max_length=255)
    price: Optional[int] = Field(None, gt=0)
    deposit: Optional[int] = Field(None, ge=0)
    monthly_rent: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    features: Optional[List[str]] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None


class ListingResponse(BaseModel):
    """Listing response schema."""
    id: str
    agent_id: str
    title: str
    property_type: str
    transaction_type: str
    address: str
    region: str
    price: int
    deposit: Optional[int]
    monthly_rent: Optional[int]
    size_sqm: Optional[float]
    rooms: Optional[int]
    bathrooms: Optional[int]
    floor: Optional[int]
    total_floors: Optional[int]
    built_year: Optional[int]
    description: Optional[str]
    features: Optional[List[str]]
    images: Optional[List[str]]
    is_active: bool
    view_count: int
    inquiry_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ListingListResponse(BaseModel):
    """Paginated list of listings."""
    items: List[ListingResponse]
    total: int
    page: int
    page_size: int


# Signal response schemas
class SignalResponseCreate(BaseModel):
    """Schema for agent responding to a signal."""
    message: str = Field(..., min_length=10, max_length=2000)
    proposed_price: Optional[int] = Field(None, gt=0)
    commission_rate: Optional[float] = Field(None, ge=0, le=10)


class SignalResponseResponse(BaseModel):
    """Signal response schema."""
    id: str
    agent_id: str
    signal_id: str
    message: str
    proposed_price: Optional[int]
    commission_rate: Optional[float]
    status: str
    is_read: bool
    read_at: Optional[datetime]
    owner_response: Optional[str]
    owner_responded_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# Dashboard schemas
class AgentDashboardStats(BaseModel):
    """Agent dashboard statistics."""
    total_listings: int
    active_listings: int
    total_inquiries: int
    total_views: int
    pending_responses: int
    signals_used: int
    signals_limit: int
    tier: str
    subscription_expires_at: Optional[datetime]


class MatchedSignal(BaseModel):
    """Signal matched to agent's region."""
    id: str
    property_type: str
    region: str
    asking_price: int
    is_negotiable: bool
    created_at: datetime
    has_responded: bool
