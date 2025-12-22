"""
Application Configuration
Uses Pydantic Settings for environment variable management
"""

from functools import lru_cache
from typing import List, Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App Info
    APP_NAME: str = "RealCare API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8092  # Different from DID BaaS which uses 8091

    # CORS
    CORS_ORIGINS: List[str] = [
        "https://trendy.storydot.kr",
        "http://localhost:3000",
        "http://localhost:5173",
    ]

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://realcare:realcare@localhost:5432/realcare"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/2"

    # JWT Settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Google Gemini
    GEMINI_API_KEY: Optional[str] = None

    # DID BaaS Integration
    DID_BAAS_URL: str = "http://localhost:8091/api/v1"

    # Xphere Blockchain
    XPHERE_RPC_URL: str = "https://rpc.xphere.network"
    XPHERE_CHAIN_ID: int = 20250217

    # Kakao API (for maps, social login)
    KAKAO_REST_API_KEY: Optional[str] = None
    KAKAO_JS_KEY: Optional[str] = None

    # Naver API (for social login)
    NAVER_CLIENT_ID: Optional[str] = None
    NAVER_CLIENT_SECRET: Optional[str] = None

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
