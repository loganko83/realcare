"""
Push Notification Service
Web Push using Firebase Cloud Messaging (FCM).
"""

import json
from typing import Optional, Dict, Any, List
from datetime import datetime
import httpx
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class PushService:
    """Firebase Cloud Messaging push notification service."""

    FCM_URL = "https://fcm.googleapis.com/fcm/send"

    def __init__(self):
        self.server_key = getattr(settings, 'FCM_SERVER_KEY', None)
        self.enabled = bool(self.server_key)
        # In-memory token storage (use Redis/DB in production)
        self._user_tokens: Dict[str, List[str]] = {}

    async def register_token(self, user_id: str, fcm_token: str) -> bool:
        """
        Register FCM token for a user.

        Args:
            user_id: User identifier
            fcm_token: FCM device token

        Returns:
            True if registered
        """
        if user_id not in self._user_tokens:
            self._user_tokens[user_id] = []

        if fcm_token not in self._user_tokens[user_id]:
            self._user_tokens[user_id].append(fcm_token)
            logger.info("FCM token registered", user_id=user_id)

        return True

    async def unregister_token(self, user_id: str, fcm_token: str) -> bool:
        """Remove FCM token for a user."""
        if user_id in self._user_tokens:
            if fcm_token in self._user_tokens[user_id]:
                self._user_tokens[user_id].remove(fcm_token)
                return True
        return False

    async def send_notification(
        self,
        user_id: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        link: Optional[str] = None,
        icon: Optional[str] = None
    ) -> bool:
        """
        Send push notification to a user.

        Args:
            user_id: Target user ID
            title: Notification title
            body: Notification body
            data: Custom data payload
            link: Click action URL
            icon: Notification icon URL

        Returns:
            True if sent successfully
        """
        if not self.enabled:
            logger.warning("Push service disabled - no FCM key")
            return False

        tokens = self._user_tokens.get(user_id, [])
        if not tokens:
            logger.debug("No FCM tokens for user", user_id=user_id)
            return False

        message = {
            "notification": {
                "title": title,
                "body": body,
                "icon": icon or "/icons/notification-icon.png",
                "click_action": link or "https://trendy.storydot.kr/real"
            }
        }

        if data:
            message["data"] = {k: str(v) for k, v in data.items()}

        success_count = 0
        for token in tokens:
            message["to"] = token

            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        self.FCM_URL,
                        json=message,
                        headers={
                            "Authorization": f"key={self.server_key}",
                            "Content-Type": "application/json"
                        },
                        timeout=30.0
                    )

                    if response.status_code == 200:
                        result = response.json()
                        if result.get("success", 0) > 0:
                            success_count += 1
                        else:
                            # Token might be invalid, remove it
                            await self.unregister_token(user_id, token)
                    else:
                        logger.error("FCM request failed", status=response.status_code)

            except Exception as e:
                logger.error("Push notification error", error=str(e))

        if success_count > 0:
            logger.info("Push sent", user_id=user_id, title=title)
            return True

        return False

    async def send_to_multiple(
        self,
        user_ids: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Send notification to multiple users.

        Returns:
            Number of successful sends
        """
        success_count = 0
        for user_id in user_ids:
            if await self.send_notification(user_id, title, body, data):
                success_count += 1
        return success_count

    # Pre-defined notification methods
    async def send_task_reminder(
        self,
        user_id: str,
        task_title: str,
        d_day: int
    ) -> bool:
        """Send contract task reminder."""
        urgency = "urgent" if d_day <= 3 else ""
        return await self.send_notification(
            user_id=user_id,
            title=f"D-{d_day}: {task_title}",
            body="계약 일정을 확인하세요",
            link="https://trendy.storydot.kr/real/timeline",
            data={"type": "task_reminder", "d_day": d_day, "urgency": urgency}
        )

    async def send_payment_notification(
        self,
        user_id: str,
        amount: int,
        success: bool
    ) -> bool:
        """Send payment status notification."""
        if success:
            title = "결제 완료"
            body = f"{amount:,}원 결제가 완료되었습니다"
        else:
            title = "결제 실패"
            body = "결제에 실패했습니다. 다시 시도해 주세요."

        return await self.send_notification(
            user_id=user_id,
            title=title,
            body=body,
            link="https://trendy.storydot.kr/real/subscription",
            data={"type": "payment", "success": success}
        )

    async def send_signal_match_notification(
        self,
        user_id: str,
        property_address: str,
        agent_count: int
    ) -> bool:
        """Notify owner of agent interest."""
        return await self.send_notification(
            user_id=user_id,
            title=f"{agent_count}명의 에이전트가 관심을 보였습니다",
            body=f"{property_address} 매물",
            link="https://trendy.storydot.kr/real/signals",
            data={"type": "signal_match", "agent_count": agent_count}
        )

    async def send_agent_verification_notification(
        self,
        user_id: str,
        approved: bool
    ) -> bool:
        """Notify agent of verification result."""
        if approved:
            title = "에이전트 인증 완료"
            body = "축하합니다! 에이전트 인증이 승인되었습니다."
            link = "https://trendy.storydot.kr/real/agent/dashboard"
        else:
            title = "에이전트 인증 반려"
            body = "에이전트 인증이 반려되었습니다. 자세한 내용을 확인하세요."
            link = "https://trendy.storydot.kr/real/agent/register"

        return await self.send_notification(
            user_id=user_id,
            title=title,
            body=body,
            link=link,
            data={"type": "agent_verification", "approved": approved}
        )


# Global service instance
push_service = PushService()
