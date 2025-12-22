"""User repository for database operations."""
from datetime import datetime
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, AuthProvider


class UserRepository:
    """Repository for user database operations."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        result = await self.session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email."""
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()

    async def get_by_provider(
        self, provider: AuthProvider, provider_id: str
    ) -> Optional[User]:
        """Get user by OAuth provider and provider ID."""
        result = await self.session.execute(
            select(User).where(
                User.auth_provider == provider,
                User.provider_id == provider_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, user: User) -> User:
        """Create a new user."""
        self.session.add(user)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update(self, user: User, **kwargs) -> User:
        """Update user fields."""
        for key, value in kwargs.items():
            if hasattr(user, key):
                setattr(user, key, value)
        await self.session.commit()
        await self.session.refresh(user)
        return user

    async def update_last_login(self, user_id: str) -> None:
        """Update user's last login timestamp."""
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(last_login_at=datetime.utcnow())
        )
        await self.session.commit()

    async def set_did(self, user_id: str, did_id: str, wallet_address: str) -> None:
        """Set user's DID and wallet address."""
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(did_id=did_id, wallet_address=wallet_address)
        )
        await self.session.commit()

    async def verify_user(self, user_id: str) -> None:
        """Mark user as verified."""
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_verified=True)
        )
        await self.session.commit()

    async def deactivate(self, user_id: str) -> None:
        """Deactivate user."""
        await self.session.execute(
            update(User)
            .where(User.id == user_id)
            .values(is_active=False)
        )
        await self.session.commit()
