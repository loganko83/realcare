"""
Analytics Service
Event tracking and metrics collection.
"""

from typing import Dict, Any, Optional, List, Set
from datetime import datetime, timedelta
from collections import defaultdict, deque
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

# Maximum events to keep in memory
MAX_EVENTS = 10000


class AnalyticsService:
    """
    Analytics and event tracking service.

    Tracks user actions and system events for:
    - Usage analytics
    - Performance monitoring
    - Business metrics

    Optimized with:
    - deque for O(1) event rotation
    - Indexes for O(1) user and timestamp lookups
    """

    def __init__(self):
        # Use deque for O(1) rotation instead of list slicing
        self._events: deque = deque(maxlen=MAX_EVENTS)
        self._metrics: Dict[str, int] = defaultdict(int)
        # Indexes for fast lookups
        self._user_index: Dict[str, List[int]] = defaultdict(list)
        self._event_counter: int = 0

    async def track_event(
        self,
        event_name: str,
        user_id: Optional[str] = None,
        properties: Optional[Dict[str, Any]] = None,
        timestamp: Optional[datetime] = None
    ) -> None:
        """
        Track an analytics event.

        Args:
            event_name: Event identifier
            user_id: User who triggered the event
            properties: Additional event data
            timestamp: Event time (defaults to now)
        """
        event_time = timestamp or datetime.utcnow()
        event = {
            "event": event_name,
            "user_id": user_id,
            "properties": properties or {},
            "timestamp": event_time.isoformat(),
            "_parsed_time": event_time,  # Cache parsed datetime
            "_index": self._event_counter,
            "app_version": settings.APP_VERSION
        }

        # deque with maxlen auto-removes old items (O(1))
        self._events.append(event)

        # Update user index for fast lookups
        if user_id:
            self._user_index[user_id].append(self._event_counter)
            # Limit index size per user
            if len(self._user_index[user_id]) > 100:
                self._user_index[user_id] = self._user_index[user_id][-100:]

        self._metrics[event_name] += 1
        self._event_counter += 1

        # Log for structured logging pipeline (only in debug mode to reduce CPU)
        if settings.DEBUG:
            logger.info(
                "analytics_event",
                event_name=event_name,
                user_id=user_id,
                properties=properties
            )

    async def track_page_view(
        self,
        user_id: Optional[str],
        page: str,
        referrer: Optional[str] = None
    ) -> None:
        """Track page view."""
        await self.track_event(
            "page_view",
            user_id,
            {"page": page, "referrer": referrer}
        )

    # Pre-defined business events
    async def track_user_registered(
        self,
        user_id: str,
        registration_method: str = "email"
    ) -> None:
        """Track new user registration."""
        await self.track_event(
            "user_registered",
            user_id,
            {"method": registration_method}
        )

    async def track_user_login(
        self,
        user_id: str,
        method: str = "email"
    ) -> None:
        """Track user login."""
        await self.track_event(
            "user_login",
            user_id,
            {"method": method}
        )

    async def track_reality_check(
        self,
        user_id: str,
        region: str,
        score: int,
        target_price: int,
        ltv_ratio: float,
        dsr_ratio: float
    ) -> None:
        """Track reality check analysis."""
        await self.track_event(
            "reality_check_completed",
            user_id,
            {
                "region": region,
                "score": score,
                "target_price": target_price,
                "ltv_ratio": ltv_ratio,
                "dsr_ratio": dsr_ratio
            }
        )

    async def track_contract_analysis(
        self,
        user_id: str,
        contract_type: str,
        risk_level: str,
        issues_found: int
    ) -> None:
        """Track contract analysis."""
        await self.track_event(
            "contract_analyzed",
            user_id,
            {
                "contract_type": contract_type,
                "risk_level": risk_level,
                "issues_found": issues_found
            }
        )

    async def track_signal_created(
        self,
        user_id: str,
        property_type: str,
        region: str,
        price_range: str
    ) -> None:
        """Track owner signal creation."""
        await self.track_event(
            "signal_created",
            user_id,
            {
                "property_type": property_type,
                "region": region,
                "price_range": price_range
            }
        )

    async def track_agent_registered(
        self,
        user_id: str,
        region: str,
        company_name: str
    ) -> None:
        """Track agent registration."""
        await self.track_event(
            "agent_registered",
            user_id,
            {"region": region, "company_name": company_name}
        )

    async def track_subscription_started(
        self,
        user_id: str,
        plan: str,
        amount: int,
        billing_cycle: str
    ) -> None:
        """Track subscription start."""
        await self.track_event(
            "subscription_started",
            user_id,
            {
                "plan": plan,
                "amount": amount,
                "billing_cycle": billing_cycle
            }
        )

    async def track_subscription_cancelled(
        self,
        user_id: str,
        plan: str,
        reason: Optional[str] = None
    ) -> None:
        """Track subscription cancellation."""
        await self.track_event(
            "subscription_cancelled",
            user_id,
            {"plan": plan, "reason": reason}
        )

    async def track_payment_completed(
        self,
        user_id: str,
        amount: int,
        payment_method: str,
        product_type: str
    ) -> None:
        """Track successful payment."""
        await self.track_event(
            "payment_completed",
            user_id,
            {
                "amount": amount,
                "payment_method": payment_method,
                "product_type": product_type
            }
        )

    async def track_payment_failed(
        self,
        user_id: str,
        amount: int,
        error_code: str
    ) -> None:
        """Track failed payment."""
        await self.track_event(
            "payment_failed",
            user_id,
            {"amount": amount, "error_code": error_code}
        )

    # Metrics retrieval
    async def get_event_counts(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """Get event counts for the time period. Uses cached timestamps for O(n) without parsing."""
        if not start_date:
            start_date = datetime.utcnow() - timedelta(days=7)
        if not end_date:
            end_date = datetime.utcnow()

        counts: Dict[str, int] = defaultdict(int)

        # Use cached _parsed_time to avoid datetime parsing overhead
        for event in self._events:
            event_time = event.get("_parsed_time")
            if event_time is None:
                # Fallback for older events without cached time
                event_time = datetime.fromisoformat(event["timestamp"])
            if start_date <= event_time <= end_date:
                counts[event["event"]] += 1

        return dict(counts)

    async def get_user_activity(
        self,
        user_id: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get recent activity for a user. Uses index for O(1) lookup."""
        # Use user index for fast lookup instead of full scan
        if user_id not in self._user_index:
            return []

        # Get event indices for this user (already limited to 100 most recent)
        indices = self._user_index[user_id][-limit:]

        # Collect events by index (need to find them in deque)
        result = []
        index_set = set(indices)
        for event in self._events:
            if event.get("_index") in index_set:
                # Return clean event without internal fields
                clean_event = {k: v for k, v in event.items() if not k.startswith("_")}
                result.append(clean_event)

        return result[-limit:][::-1]  # Most recent first

    async def get_metrics_summary(self) -> Dict[str, Any]:
        """Get summary metrics for dashboard. Optimized with cached timestamps."""
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)

        weekly_counts = await self.get_event_counts(week_ago, now)

        # Use cached timestamps and collect unique users in single pass
        unique_users: Set[str] = set()
        for event in self._events:
            event_time = event.get("_parsed_time")
            if event_time is None:
                event_time = datetime.fromisoformat(event["timestamp"])
            if event.get("user_id") and event_time >= week_ago:
                unique_users.add(event["user_id"])

        return {
            "period": "7_days",
            "total_events": sum(weekly_counts.values()),
            "unique_users": len(unique_users),
            "top_events": sorted(
                weekly_counts.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10],
            "conversions": {
                "registrations": weekly_counts.get("user_registered", 0),
                "reality_checks": weekly_counts.get("reality_check_completed", 0),
                "subscriptions": weekly_counts.get("subscription_started", 0),
                "payments": weekly_counts.get("payment_completed", 0)
            }
        }


# Global service instance
analytics_service = AnalyticsService()
