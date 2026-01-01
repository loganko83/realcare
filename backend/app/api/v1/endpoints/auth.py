"""
Authentication Endpoints
Handles user registration, login, and token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import AuthProvider
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token, RefreshTokenRequest
from app.services.auth import AuthService

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    """Get auth service instance."""
    return AuthService(db)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    auth_service: AuthService = Depends(get_auth_service),
) -> UserResponse:
    """Get current authenticated user."""
    user = await auth_service.get_current_user(token)
    return UserResponse.model_validate(user)


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Register a new user.

    Creates a new user account with email and password.
    """
    user = await auth_service.register(user_data)
    return UserResponse.model_validate(user)


@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Login with email and password.

    Returns access and refresh tokens.
    """
    _, token = await auth_service.login(form_data.username, form_data.password)
    return token


@router.post("/login/json", response_model=Token)
async def login_json(
    credentials: UserLogin,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Login with JSON body.

    Alternative login endpoint for JSON requests.
    """
    _, token = await auth_service.login(credentials.email, credentials.password)
    return token


@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: RefreshTokenRequest,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Refresh access token.

    Accepts refresh token in POST body for security (not query parameter).
    Returns new access and refresh tokens.
    """
    return await auth_service.refresh_tokens(request.refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Get current user profile.

    Returns the authenticated user's information.
    """
    return current_user


# OAuth callbacks are handled by /api/v1/auth/social/{provider}/callback
# See app/api/v1/endpoints/oauth.py for implementation


@router.post("/logout")
async def logout(
    token: str = Depends(oauth2_scheme),
    current_user: UserResponse = Depends(get_current_user)
):
    """
    Logout user.

    Invalidates the current access token by adding it to the blacklist.
    Client should also remove tokens from storage.
    """
    from app.core.security import blacklist_token

    # Add token to blacklist
    blacklist_token(token)

    return {"message": "Successfully logged out"}
