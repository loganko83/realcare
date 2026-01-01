"""
Security Configuration
JWT tokens, password hashing, and authentication
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any, Set
import hashlib

import bcrypt
from jose import jwt, JWTError

from app.core.config import get_settings

settings = get_settings()

# In-memory token blacklist (use Redis in production for persistence)
# Stores token hashes with expiration
_token_blacklist: Dict[str, datetime] = {}
_blacklist_cleanup_interval = 300  # 5 minutes
_last_blacklist_cleanup = datetime.now(timezone.utc)


def _get_token_hash(token: str) -> str:
    """Get SHA256 hash of token for blacklist storage."""
    return hashlib.sha256(token.encode()).hexdigest()[:32]


def blacklist_token(token: str, expires_at: Optional[datetime] = None) -> None:
    """Add a token to the blacklist."""
    global _last_blacklist_cleanup

    token_hash = _get_token_hash(token)

    if expires_at is None:
        # Default expiration: token's own expiration or 24 hours
        try:
            payload = jwt.decode(
                token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
                options={"verify_exp": False}
            )
            exp = payload.get("exp")
            if exp:
                expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)
            else:
                expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        except JWTError:
            expires_at = datetime.now(timezone.utc) + timedelta(hours=24)

    _token_blacklist[token_hash] = expires_at

    # Periodic cleanup
    now = datetime.now(timezone.utc)
    if (now - _last_blacklist_cleanup).total_seconds() > _blacklist_cleanup_interval:
        _cleanup_blacklist()
        _last_blacklist_cleanup = now


def is_token_blacklisted(token: str) -> bool:
    """Check if a token is blacklisted."""
    token_hash = _get_token_hash(token)

    if token_hash not in _token_blacklist:
        return False

    expires_at = _token_blacklist[token_hash]
    if datetime.now(timezone.utc) > expires_at:
        # Token blacklist entry expired, remove it
        del _token_blacklist[token_hash]
        return False

    return True


def _cleanup_blacklist() -> None:
    """Remove expired entries from blacklist."""
    now = datetime.now(timezone.utc)
    expired = [h for h, exp in _token_blacklist.items() if now > exp]
    for h in expired:
        del _token_blacklist[h]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    password_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hashed_bytes)


def get_password_hash(password: str) -> str:
    """Hash a password."""
    password_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password_bytes, salt)
    return hashed.decode('utf-8')


def create_access_token(
    subject: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"sub": subject, "exp": expire, "type": "access"}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def create_refresh_token(
    subject: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create a JWT refresh token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    to_encode = {"sub": subject, "exp": expire, "type": "refresh"}
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT token."""
    from fastapi import HTTPException, status

    # Check blacklist first
    if is_token_blacklisted(token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_token(token: str, token_type: str = "access") -> Optional[str]:
    """Verify a token and return the user ID if valid."""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        if payload.get("type") != token_type:
            return None
        user_id: str = payload.get("sub")
        return user_id
    except JWTError:
        return None
