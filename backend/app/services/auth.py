"""Authentication service."""
from datetime import datetime, timedelta
from typing import Optional, Tuple

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_password,
    get_password_hash,
    decode_token,
)
from app.models.user import User, UserRole, AuthProvider
from app.repositories.user import UserRepository
from app.schemas.user import UserCreate, Token


class AuthService:
    """Service for authentication operations."""

    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)

    async def register(self, user_data: UserCreate) -> User:
        """Register a new user."""
        # Check if email already exists
        existing = await self.user_repo.get_by_email(user_data.email)
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )

        # Create user
        user = User(
            email=user_data.email,
            name=user_data.name,
            phone=user_data.phone,
            hashed_password=get_password_hash(user_data.password),
            role=UserRole.USER,
            auth_provider=AuthProvider.EMAIL,
        )

        return await self.user_repo.create(user)

    async def login(self, email: str, password: str) -> Tuple[User, Token]:
        """Authenticate user and return tokens."""
        user = await self.user_repo.get_by_email(email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user.hashed_password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Please use social login for this account"
            )

        if not verify_password(password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )

        # Update last login
        await self.user_repo.update_last_login(user.id)

        # Create tokens
        access_token = create_access_token(subject=user.id)
        refresh_token = create_refresh_token(subject=user.id)

        return user, Token(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh_tokens(self, refresh_token: str) -> Token:
        """Refresh access token using refresh token."""
        payload = decode_token(refresh_token)

        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(user_id)

        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )

        access_token = create_access_token(subject=user.id)
        new_refresh_token = create_refresh_token(subject=user.id)

        return Token(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )

    async def oauth_login(
        self,
        provider: AuthProvider,
        provider_id: str,
        email: str,
        name: str,
    ) -> Tuple[User, Token]:
        """Handle OAuth login/registration."""
        # Check if user exists by provider
        user = await self.user_repo.get_by_provider(provider, provider_id)

        if not user:
            # Check if email exists (link accounts)
            user = await self.user_repo.get_by_email(email)

            if user:
                # Update provider info
                await self.user_repo.update(
                    user,
                    auth_provider=provider,
                    provider_id=provider_id,
                )
            else:
                # Create new user
                user = User(
                    email=email,
                    name=name,
                    role=UserRole.USER,
                    auth_provider=provider,
                    provider_id=provider_id,
                    is_verified=True,  # OAuth users are verified
                )
                user = await self.user_repo.create(user)

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )

        await self.user_repo.update_last_login(user.id)

        access_token = create_access_token(subject=user.id)
        refresh_token = create_refresh_token(subject=user.id)

        return user, Token(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def get_current_user(self, token: str) -> User:
        """Get current user from access token."""
        payload = decode_token(token)

        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        user_id = payload.get("sub")
        user = await self.user_repo.get_by_id(user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is deactivated"
            )

        return user
