"""User schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    """Base user schema."""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    """Schema for updating a user."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)


class UserResponse(UserBase):
    """User response schema."""
    id: str
    role: str
    is_active: bool
    is_verified: bool
    did_id: Optional[str] = None
    wallet_address: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    """Login request schema."""
    email: EmailStr
    password: str


class Token(BaseModel):
    """Token response schema."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """Token payload schema."""
    sub: str
    exp: datetime
    type: str


class RefreshTokenRequest(BaseModel):
    """Refresh token request schema - uses POST body for security."""
    refresh_token: str = Field(..., description="Refresh token from login response")
