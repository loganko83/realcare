"""
OAuth 2.0 Social Login Services
Supports Kakao, Naver, and Google OAuth.
"""

import httpx
from typing import Dict, Any, Optional
from urllib.parse import urlencode
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class OAuthError(Exception):
    """OAuth authentication error."""
    def __init__(self, provider: str, message: str, code: str = "OAUTH_ERROR"):
        self.provider = provider
        self.message = message
        self.code = code
        super().__init__(f"{provider}: {message}")


class OAuthUserInfo:
    """Normalized user info from OAuth providers."""

    def __init__(
        self,
        provider: str,
        provider_id: str,
        email: Optional[str],
        name: Optional[str],
        profile_image: Optional[str] = None,
        phone: Optional[str] = None
    ):
        self.provider = provider
        self.provider_id = provider_id
        self.email = email
        self.name = name
        self.profile_image = profile_image
        self.phone = phone


class KakaoOAuth:
    """Kakao OAuth service."""

    AUTH_URL = "https://kauth.kakao.com/oauth/authorize"
    TOKEN_URL = "https://kauth.kakao.com/oauth/token"
    USER_URL = "https://kapi.kakao.com/v2/user/me"

    def __init__(self):
        self.client_id = settings.KAKAO_CLIENT_ID
        self.client_secret = settings.KAKAO_CLIENT_SECRET
        self.redirect_uri = f"{settings.FRONTEND_URL}/real/api/v1/auth/social/kakao/callback"

    def get_authorization_url(self, state: str) -> str:
        """Get Kakao authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "state": state,
            "scope": "profile_nickname profile_image account_email"
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    async def get_access_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                    "code": code
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )

            if response.status_code != 200:
                raise OAuthError("kakao", "Failed to get access token")

            return response.json()

    async def get_user_info(self, access_token: str) -> OAuthUserInfo:
        """Get user info from Kakao."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USER_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code != 200:
                raise OAuthError("kakao", "Failed to get user info")

            data = response.json()
            kakao_account = data.get("kakao_account", {})
            profile = kakao_account.get("profile", {})

            return OAuthUserInfo(
                provider="kakao",
                provider_id=str(data["id"]),
                email=kakao_account.get("email"),
                name=profile.get("nickname"),
                profile_image=profile.get("profile_image_url")
            )


class NaverOAuth:
    """Naver OAuth service."""

    AUTH_URL = "https://nid.naver.com/oauth2.0/authorize"
    TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
    USER_URL = "https://openapi.naver.com/v1/nid/me"

    def __init__(self):
        self.client_id = settings.NAVER_CLIENT_ID
        self.client_secret = settings.NAVER_CLIENT_SECRET
        self.redirect_uri = f"{settings.FRONTEND_URL}/real/api/v1/auth/social/naver/callback"

    def get_authorization_url(self, state: str) -> str:
        """Get Naver authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "state": state
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    async def get_access_token(self, code: str, state: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code,
                    "state": state
                }
            )

            if response.status_code != 200:
                raise OAuthError("naver", "Failed to get access token")

            return response.json()

    async def get_user_info(self, access_token: str) -> OAuthUserInfo:
        """Get user info from Naver."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USER_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code != 200:
                raise OAuthError("naver", "Failed to get user info")

            data = response.json()
            user = data.get("response", {})

            return OAuthUserInfo(
                provider="naver",
                provider_id=user.get("id"),
                email=user.get("email"),
                name=user.get("name") or user.get("nickname"),
                profile_image=user.get("profile_image"),
                phone=user.get("mobile")
            )


class GoogleOAuth:
    """Google OAuth service."""

    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = f"{settings.FRONTEND_URL}/real/api/v1/auth/social/google/callback"

    def get_authorization_url(self, state: str) -> str:
        """Get Google authorization URL."""
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "state": state,
            "scope": "openid email profile",
            "access_type": "offline",
            "prompt": "consent"
        }
        return f"{self.AUTH_URL}?{urlencode(params)}"

    async def get_access_token(self, code: str) -> Dict[str, Any]:
        """Exchange authorization code for access token."""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                    "code": code
                }
            )

            if response.status_code != 200:
                raise OAuthError("google", "Failed to get access token")

            return response.json()

    async def get_user_info(self, access_token: str) -> OAuthUserInfo:
        """Get user info from Google."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USER_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )

            if response.status_code != 200:
                raise OAuthError("google", "Failed to get user info")

            data = response.json()

            return OAuthUserInfo(
                provider="google",
                provider_id=data.get("id"),
                email=data.get("email"),
                name=data.get("name"),
                profile_image=data.get("picture")
            )


class OAuthService:
    """Unified OAuth service."""

    def __init__(self):
        self.kakao = KakaoOAuth()
        self.naver = NaverOAuth()
        self.google = GoogleOAuth()

    def get_provider(self, provider: str):
        """Get OAuth provider by name."""
        providers = {
            "kakao": self.kakao,
            "naver": self.naver,
            "google": self.google
        }

        if provider not in providers:
            raise OAuthError(provider, f"Unknown provider: {provider}")

        return providers[provider]

    def get_authorization_url(self, provider: str, state: str) -> str:
        """Get authorization URL for provider."""
        return self.get_provider(provider).get_authorization_url(state)

    async def authenticate(
        self,
        provider: str,
        code: str,
        state: Optional[str] = None
    ) -> OAuthUserInfo:
        """
        Complete OAuth flow and get user info.

        Args:
            provider: OAuth provider name
            code: Authorization code
            state: State parameter (required for Naver)

        Returns:
            Normalized user info
        """
        oauth_provider = self.get_provider(provider)

        # Get access token
        if provider == "naver":
            tokens = await oauth_provider.get_access_token(code, state)
        else:
            tokens = await oauth_provider.get_access_token(code)

        access_token = tokens.get("access_token")
        if not access_token:
            raise OAuthError(provider, "No access token received")

        # Get user info
        user_info = await oauth_provider.get_user_info(access_token)

        logger.info(
            "OAuth authentication successful",
            provider=provider,
            provider_id=user_info.provider_id
        )

        return user_info


# Singleton instance
oauth_service = OAuthService()
