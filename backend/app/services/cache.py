"""
Redis Cache Service
Provides caching functionality with Redis backend.
"""

import json
from typing import Any, Optional, Union
from datetime import timedelta
import structlog
import redis.asyncio as redis

from app.core.config import get_settings

settings = get_settings()
logger = structlog.get_logger()


class CacheService:
    """
    Redis-based caching service with support for:
    - Key-value caching with TTL
    - JSON serialization
    - Cache invalidation patterns
    - Distributed locking
    """

    def __init__(self):
        self._redis: Optional[redis.Redis] = None
        self._prefix = "realcare:"

    async def connect(self) -> None:
        """Initialize Redis connection."""
        try:
            self._redis = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
            # Test connection
            await self._redis.ping()
            logger.info("Redis cache connected", url=settings.REDIS_URL)
        except Exception as e:
            logger.error("Redis connection failed", error=str(e))
            self._redis = None

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            self._redis = None
            logger.info("Redis cache disconnected")

    def _make_key(self, key: str) -> str:
        """Create prefixed cache key."""
        return f"{self._prefix}{key}"

    async def get(self, key: str) -> Optional[Any]:
        """
        Get value from cache.

        Args:
            key: Cache key

        Returns:
            Cached value or None if not found
        """
        if not self._redis:
            return None

        try:
            full_key = self._make_key(key)
            value = await self._redis.get(full_key)

            if value is None:
                return None

            # Try to parse as JSON
            try:
                return json.loads(value)
            except json.JSONDecodeError:
                return value

        except Exception as e:
            logger.error("Cache get error", key=key, error=str(e))
            return None

    async def set(
        self,
        key: str,
        value: Any,
        ttl: Optional[Union[int, timedelta]] = None,
    ) -> bool:
        """
        Set value in cache.

        Args:
            key: Cache key
            value: Value to cache (will be JSON serialized if not string)
            ttl: Time-to-live in seconds or timedelta

        Returns:
            True if successful
        """
        if not self._redis:
            return False

        try:
            full_key = self._make_key(key)

            # Serialize value
            if isinstance(value, str):
                serialized = value
            else:
                serialized = json.dumps(value, default=str)

            # Set with optional TTL
            if ttl:
                if isinstance(ttl, timedelta):
                    ttl = int(ttl.total_seconds())
                await self._redis.setex(full_key, ttl, serialized)
            else:
                await self._redis.set(full_key, serialized)

            return True

        except Exception as e:
            logger.error("Cache set error", key=key, error=str(e))
            return False

    async def delete(self, key: str) -> bool:
        """
        Delete value from cache.

        Args:
            key: Cache key

        Returns:
            True if deleted
        """
        if not self._redis:
            return False

        try:
            full_key = self._make_key(key)
            result = await self._redis.delete(full_key)
            return result > 0
        except Exception as e:
            logger.error("Cache delete error", key=key, error=str(e))
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """
        Delete all keys matching pattern.

        Args:
            pattern: Key pattern (e.g., "user:*")

        Returns:
            Number of keys deleted
        """
        if not self._redis:
            return 0

        try:
            full_pattern = self._make_key(pattern)
            keys = []

            async for key in self._redis.scan_iter(match=full_pattern):
                keys.append(key)

            if keys:
                return await self._redis.delete(*keys)

            return 0

        except Exception as e:
            logger.error("Cache delete pattern error", pattern=pattern, error=str(e))
            return 0

    async def exists(self, key: str) -> bool:
        """
        Check if key exists in cache.

        Args:
            key: Cache key

        Returns:
            True if key exists
        """
        if not self._redis:
            return False

        try:
            full_key = self._make_key(key)
            return await self._redis.exists(full_key) > 0
        except Exception as e:
            logger.error("Cache exists error", key=key, error=str(e))
            return False

    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """
        Increment counter in cache.

        Args:
            key: Cache key
            amount: Amount to increment

        Returns:
            New value or None if error
        """
        if not self._redis:
            return None

        try:
            full_key = self._make_key(key)
            return await self._redis.incrby(full_key, amount)
        except Exception as e:
            logger.error("Cache increment error", key=key, error=str(e))
            return None

    async def set_hash(self, key: str, mapping: dict, ttl: Optional[int] = None) -> bool:
        """
        Set hash in cache.

        Args:
            key: Cache key
            mapping: Dictionary to store
            ttl: Time-to-live in seconds

        Returns:
            True if successful
        """
        if not self._redis:
            return False

        try:
            full_key = self._make_key(key)
            # Serialize values
            serialized = {k: json.dumps(v, default=str) if not isinstance(v, str) else v for k, v in mapping.items()}
            await self._redis.hset(full_key, mapping=serialized)

            if ttl:
                await self._redis.expire(full_key, ttl)

            return True

        except Exception as e:
            logger.error("Cache set_hash error", key=key, error=str(e))
            return False

    async def get_hash(self, key: str) -> Optional[dict]:
        """
        Get hash from cache.

        Args:
            key: Cache key

        Returns:
            Dictionary or None if not found
        """
        if not self._redis:
            return None

        try:
            full_key = self._make_key(key)
            result = await self._redis.hgetall(full_key)

            if not result:
                return None

            # Deserialize values
            deserialized = {}
            for k, v in result.items():
                try:
                    deserialized[k] = json.loads(v)
                except json.JSONDecodeError:
                    deserialized[k] = v

            return deserialized

        except Exception as e:
            logger.error("Cache get_hash error", key=key, error=str(e))
            return None

    async def acquire_lock(
        self,
        name: str,
        timeout: int = 10,
        blocking: bool = True,
        blocking_timeout: float = 5.0,
    ) -> Optional[str]:
        """
        Acquire distributed lock.

        Args:
            name: Lock name
            timeout: Lock timeout in seconds
            blocking: Wait for lock if taken
            blocking_timeout: Max time to wait for lock

        Returns:
            Lock token if acquired, None otherwise
        """
        if not self._redis:
            return None

        try:
            import uuid
            token = str(uuid.uuid4())
            lock_key = self._make_key(f"lock:{name}")

            if blocking:
                end_time = asyncio.get_event_loop().time() + blocking_timeout
                while asyncio.get_event_loop().time() < end_time:
                    if await self._redis.set(lock_key, token, nx=True, ex=timeout):
                        return token
                    await asyncio.sleep(0.1)
                return None
            else:
                if await self._redis.set(lock_key, token, nx=True, ex=timeout):
                    return token
                return None

        except Exception as e:
            logger.error("Lock acquire error", name=name, error=str(e))
            return None

    async def release_lock(self, name: str, token: str) -> bool:
        """
        Release distributed lock.

        Args:
            name: Lock name
            token: Lock token from acquire_lock

        Returns:
            True if released
        """
        if not self._redis:
            return False

        try:
            lock_key = self._make_key(f"lock:{name}")
            # Only release if token matches (Lua script for atomicity)
            script = """
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
            """
            result = await self._redis.eval(script, 1, lock_key, token)
            return result == 1

        except Exception as e:
            logger.error("Lock release error", name=name, error=str(e))
            return False


# Import asyncio for lock
import asyncio


# Global cache instance
cache_service = CacheService()


# Cache key builders
def user_cache_key(user_id: str) -> str:
    """Build cache key for user data."""
    return f"user:{user_id}"


def reality_check_cache_key(user_id: str, params_hash: str) -> str:
    """Build cache key for reality check results."""
    return f"reality:{user_id}:{params_hash}"


def signal_cache_key(signal_id: str) -> str:
    """Build cache key for owner signal."""
    return f"signal:{signal_id}"


def agent_cache_key(agent_id: str) -> str:
    """Build cache key for agent data."""
    return f"agent:{agent_id}"


# Cache TTL constants (in seconds)
class CacheTTL:
    """Cache TTL configurations."""
    SHORT = 60              # 1 minute
    MEDIUM = 300            # 5 minutes
    LONG = 3600             # 1 hour
    DAY = 86400             # 24 hours
    WEEK = 604800           # 7 days

    # Specific use cases
    USER_SESSION = 1800     # 30 minutes
    REALITY_CHECK = 600     # 10 minutes
    SIGNAL_LIST = 300       # 5 minutes
    AGENT_PROFILE = 3600    # 1 hour
    RATE_LIMIT = 60         # 1 minute
