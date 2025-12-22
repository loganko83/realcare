"""
Authentication Endpoints
Handles user registration, login, and token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import AuthProvider
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
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
    refresh_token: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Refresh access token.

    Returns new access and refresh tokens.
    """
    return await auth_service.refresh_tokens(refresh_token)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """
    Get current user profile.

    Returns the authenticated user's information.
    """
    return current_user


@router.post("/kakao/callback", response_model=Token)
async def kakao_callback(
    code: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Kakao OAuth callback.

    Exchanges authorization code for tokens and user info.
    """
    # TODO: Implement Kakao OAuth
    # 1. Exchange code for access token
    # 2. Get user info from Kakao
    # 3. Create/update user and return tokens
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Kakao OAuth not yet implemented"
    )


@router.post("/naver/callback", response_model=Token)
async def naver_callback(
    code: str,
    state: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    """
    Naver OAuth callback.

    Exchanges authorization code for tokens and user info.
    """
    # TODO: Implement Naver OAuth
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Naver OAuth not yet implemented"
    )


@router.post("/logout")
async def logout(current_user: UserResponse = Depends(get_current_user)):
    """
    Logout user.

    Invalidates the current session.
    Note: In a stateless JWT system, logout is handled client-side
    by removing the tokens. This endpoint is for server-side logging.
    """
    return {"message": "Successfully logged out"}
