"""
OAuth Social Login Endpoints
Handles Kakao, Naver, and Google OAuth callbacks.
"""

import secrets
from typing import Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Query, HTTPException, Response
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import create_access_token, create_refresh_token
from app.models.user import User
from app.services.oauth import oauth_service, OAuthError, OAuthUserInfo
import structlog

logger = structlog.get_logger()
router = APIRouter()

# State storage (in production, use Redis)
oauth_states: dict = {}


def generate_state(redirect_url: str = "/") -> str:
    """Generate and store OAuth state."""
    state = secrets.token_urlsafe(32)
    oauth_states[state] = {
        "redirect": redirect_url,
        "created_at": datetime.utcnow()
    }
    return state


def validate_state(state: str) -> Optional[str]:
    """Validate and consume OAuth state."""
    if state not in oauth_states:
        return None

    data = oauth_states.pop(state)

    # Check expiration (5 minutes)
    if datetime.utcnow() - data["created_at"] > timedelta(minutes=5):
        return None

    return data["redirect"]


async def get_or_create_user(
    db: AsyncSession,
    user_info: OAuthUserInfo
) -> User:
    """Get existing user or create new one from OAuth info."""
    from app.models.user import AuthProvider
    import uuid

    # Map provider string to AuthProvider enum
    provider_map = {
        "kakao": AuthProvider.KAKAO,
        "naver": AuthProvider.NAVER,
        "google": AuthProvider.GOOGLE,
    }
    auth_provider = provider_map.get(user_info.provider, AuthProvider.EMAIL)

    # Check for existing user by provider ID
    result = await db.execute(
        select(User).where(
            User.auth_provider == auth_provider,
            User.provider_id == user_info.provider_id
        )
    )
    user = result.scalar_one_or_none()

    if user:
        # Update last login
        user.last_login_at = datetime.utcnow()
        await db.commit()
        return user

    # Check for existing user by email
    if user_info.email:
        result = await db.execute(
            select(User).where(User.email == user_info.email)
        )
        user = result.scalar_one_or_none()

        if user:
            # Link OAuth provider to existing user
            user.auth_provider = auth_provider
            user.provider_id = user_info.provider_id
            user.last_login_at = datetime.utcnow()
            await db.commit()
            return user

    # Create new user
    user = User(
        id=str(uuid.uuid4()),
        email=user_info.email or f"{user_info.provider}_{user_info.provider_id}@oauth.local",
        name=user_info.name or "User",
        auth_provider=auth_provider,
        provider_id=user_info.provider_id,
        phone=user_info.phone,
        is_verified=True,  # OAuth users are verified
        hashed_password=None  # No password for OAuth users
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    logger.info(
        "Created new user from OAuth",
        provider=user_info.provider,
        user_id=str(user.id)
    )

    return user


@router.get("/{provider}/login")
async def oauth_login(
    provider: str,
    redirect: str = Query("/", description="URL to redirect after login")
):
    """
    Initiate OAuth login flow.

    Redirects user to OAuth provider's authorization page.
    """
    try:
        state = generate_state(redirect)
        auth_url = oauth_service.get_authorization_url(provider, state)
        return RedirectResponse(url=auth_url)

    except OAuthError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{provider}/callback")
async def oauth_callback(
    provider: str,
    code: str = Query(..., description="Authorization code"),
    state: str = Query(..., description="State parameter")
):
    """
    Handle OAuth callback.

    Exchanges authorization code for tokens, creates/updates user,
    and redirects to frontend with JWT tokens.
    """
    from app.core.database import async_session_maker

    # Validate state
    redirect_url = validate_state(state)
    if not redirect_url:
        raise HTTPException(status_code=400, detail="Invalid or expired state")

    try:
        # Complete OAuth flow
        user_info = await oauth_service.authenticate(provider, code, state)

        # Get database session
        async with async_session_maker() as db:
            user = await get_or_create_user(db, user_info)

            # Generate JWT tokens
            access_token = create_access_token(subject=str(user.id))
            refresh_token = create_refresh_token(subject=str(user.id))

            # Redirect to frontend with tokens
            # In production, use secure cookies instead of URL parameters
            from app.core.config import get_settings
            settings = get_settings()
            base_path = settings.FRONTEND_URL.replace("https://trendy.storydot.kr", "")
            frontend_url = f"{base_path}{redirect_url}"

            if "?" in frontend_url:
                frontend_url += f"&access_token={access_token}&refresh_token={refresh_token}"
            else:
                frontend_url += f"?access_token={access_token}&refresh_token={refresh_token}"

            return RedirectResponse(url=frontend_url)

    except OAuthError as e:
        logger.error("OAuth callback failed", provider=provider, error=str(e))
        from app.core.config import get_settings
        settings = get_settings()
        base_path = settings.FRONTEND_URL.replace("https://trendy.storydot.kr", "")
        return RedirectResponse(url=f"{base_path}/login?error={e.code}")
