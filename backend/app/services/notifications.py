"""
Unified Notification Service
Orchestrates email and push notifications for various application events.
"""

from typing import Optional, Dict, Any
from datetime import datetime
import structlog

from app.services.email import email_service
from app.services.push import push_service

logger = structlog.get_logger()


class NotificationPreferences:
    """
    User notification preferences.
    In production, this should be stored in database.
    Currently uses in-memory storage with default preferences.
    """

    def __init__(self):
        # In-memory storage: user_id -> preferences dict
        self._preferences: Dict[str, Dict[str, bool]] = {}

    def get_preferences(self, user_id: str) -> Dict[str, bool]:
        """
        Get notification preferences for a user.
        Returns default preferences if not set.
        """
        if user_id not in self._preferences:
            # Default: all notifications enabled
            self._preferences[user_id] = {
                "email_enabled": True,
                "push_enabled": True,
                "email_marketing": False,
                "email_task_reminders": True,
                "email_payments": True,
                "email_agent_updates": True,
                "email_signal_matches": True,
                "push_task_reminders": True,
                "push_payments": True,
                "push_agent_updates": True,
                "push_signal_matches": True,
            }
        return self._preferences[user_id]

    def update_preferences(
        self, user_id: str, preferences: Dict[str, bool]
    ) -> None:
        """Update user notification preferences."""
        if user_id not in self._preferences:
            self._preferences[user_id] = self.get_preferences(user_id)
        self._preferences[user_id].update(preferences)

    def can_send_email(self, user_id: str, category: str = "general") -> bool:
        """Check if email notifications are allowed for user and category."""
        prefs = self.get_preferences(user_id)
        if not prefs.get("email_enabled", True):
            return False
        category_key = f"email_{category}"
        return prefs.get(category_key, True)

    def can_send_push(self, user_id: str, category: str = "general") -> bool:
        """Check if push notifications are allowed for user and category."""
        prefs = self.get_preferences(user_id)
        if not prefs.get("push_enabled", True):
            return False
        category_key = f"push_{category}"
        return prefs.get(category_key, True)


class NotificationService:
    """
    Unified notification service that orchestrates email and push notifications.
    Handles all application events with proper preference checking.
    """

    def __init__(self):
        self.email_service = email_service
        self.push_service = push_service
        self.preferences = NotificationPreferences()

    async def on_user_registered(
        self, user_id: str, email: str, name: str
    ) -> Dict[str, bool]:
        """
        Send welcome notification when user registers.

        Args:
            user_id: User identifier
            email: User email address
            name: User name

        Returns:
            Dict with email and push send status
        """
        logger.info(
            "User registered event",
            user_id=user_id,
            email=email,
            name=name
        )

        results = {"email": False, "push": False}

        # Send welcome email (always sent regardless of preferences)
        try:
            results["email"] = await self.email_service.send_welcome_email(
                email=email, name=name
            )
        except Exception as e:
            logger.error("Welcome email failed", error=str(e), user_id=user_id)

        return results

    async def on_payment_completed(
        self,
        user_id: str,
        email: str,
        amount: int,
        plan: str,
        next_billing: str,
    ) -> Dict[str, bool]:
        """
        Send payment confirmation notifications.

        Args:
            user_id: User identifier
            email: User email address
            amount: Payment amount in KRW
            plan: Plan name
            next_billing: Next billing date string

        Returns:
            Dict with email and push send status
        """
        logger.info(
            "Payment completed event",
            user_id=user_id,
            amount=amount,
            plan=plan
        )

        results = {"email": False, "push": False}

        # Send email if allowed
        if self.preferences.can_send_email(user_id, "payments"):
            try:
                results["email"] = (
                    await self.email_service.send_payment_confirmation(
                        email=email,
                        amount=amount,
                        plan_name=plan,
                        next_billing_date=next_billing,
                    )
                )
            except Exception as e:
                logger.error("Payment confirmation email failed", error=str(e))

        # Send push notification if allowed
        if self.preferences.can_send_push(user_id, "payments"):
            try:
                results["push"] = await self.push_service.send_payment_notification(
                    user_id=user_id, amount=amount, success=True
                )
            except Exception as e:
                logger.error("Payment confirmation push failed", error=str(e))

        return results

    async def on_payment_failed(
        self, user_id: str, email: str, plan: str, reason: str
    ) -> Dict[str, bool]:
        """
        Send payment failure notifications.

        Args:
            user_id: User identifier
            email: User email address
            plan: Plan name
            reason: Failure reason

        Returns:
            Dict with email and push send status
        """
        logger.warning(
            "Payment failed event",
            user_id=user_id,
            plan=plan,
            reason=reason
        )

        results = {"email": False, "push": False}

        # Send email if allowed (important notification)
        if self.preferences.can_send_email(user_id, "payments"):
            try:
                results["email"] = await self.email_service.send_payment_failed_email(
                    email=email, plan_name=plan, reason=reason
                )
            except Exception as e:
                logger.error("Payment failed email error", error=str(e))

        # Send push notification if allowed
        if self.preferences.can_send_push(user_id, "payments"):
            try:
                results["push"] = await self.push_service.send_payment_notification(
                    user_id=user_id, amount=0, success=False
                )
            except Exception as e:
                logger.error("Payment failed push error", error=str(e))

        return results

    async def on_contract_task_due(
        self,
        user_id: str,
        email: str,
        task_title: str,
        due_date: str,
        d_day: int,
    ) -> Dict[str, bool]:
        """
        Send contract task reminder notifications.

        Args:
            user_id: User identifier
            email: User email address
            task_title: Task title
            due_date: Due date string
            d_day: Days remaining until due date

        Returns:
            Dict with email and push send status
        """
        logger.info(
            "Contract task due event",
            user_id=user_id,
            task_title=task_title,
            d_day=d_day
        )

        results = {"email": False, "push": False}

        # Send email reminder if allowed
        if self.preferences.can_send_email(user_id, "task_reminders"):
            try:
                results["email"] = await self.email_service.send_contract_reminder(
                    email=email,
                    task_title=task_title,
                    due_date=due_date,
                    d_day=d_day,
                )
            except Exception as e:
                logger.error("Task reminder email failed", error=str(e))

        # Send push notification if allowed
        if self.preferences.can_send_push(user_id, "task_reminders"):
            try:
                results["push"] = await self.push_service.send_task_reminder(
                    user_id=user_id, task_title=task_title, d_day=d_day
                )
            except Exception as e:
                logger.error("Task reminder push failed", error=str(e))

        return results

    async def on_agent_verified(
        self,
        agent_id: str,
        email: str,
        company_name: str,
        approved: bool,
        rejection_reason: Optional[str] = None,
    ) -> Dict[str, bool]:
        """
        Send agent verification result notifications.

        Args:
            agent_id: Agent user identifier
            email: Agent email address
            company_name: Company name
            approved: Whether verification was approved
            rejection_reason: Reason for rejection (if not approved)

        Returns:
            Dict with email and push send status
        """
        logger.info(
            "Agent verification event",
            agent_id=agent_id,
            company_name=company_name,
            approved=approved
        )

        results = {"email": False, "push": False}

        # Send email if allowed
        if self.preferences.can_send_email(agent_id, "agent_updates"):
            try:
                results["email"] = (
                    await self.email_service.send_agent_verification_result(
                        email=email,
                        company_name=company_name,
                        approved=approved,
                        rejection_reason=rejection_reason,
                    )
                )
            except Exception as e:
                logger.error("Agent verification email failed", error=str(e))

        # Send push notification if allowed
        if self.preferences.can_send_push(agent_id, "agent_updates"):
            try:
                results["push"] = (
                    await self.push_service.send_agent_verification_notification(
                        user_id=agent_id, approved=approved
                    )
                )
            except Exception as e:
                logger.error("Agent verification push failed", error=str(e))

        return results

    async def on_signal_matched(
        self,
        owner_id: str,
        email: str,
        property_address: str,
        agent_count: int,
    ) -> Dict[str, bool]:
        """
        Send notification when agents show interest in owner's signal.

        Args:
            owner_id: Owner user identifier
            email: Owner email address
            property_address: Property address
            agent_count: Number of interested agents

        Returns:
            Dict with email and push send status
        """
        logger.info(
            "Signal matched event",
            owner_id=owner_id,
            property_address=property_address,
            agent_count=agent_count
        )

        results = {"email": False, "push": False}

        # Send email if allowed
        if self.preferences.can_send_email(owner_id, "signal_matches"):
            try:
                results["email"] = (
                    await self.email_service.send_signal_match_notification(
                        email=email,
                        property_address=property_address,
                        agent_count=agent_count,
                    )
                )
            except Exception as e:
                logger.error("Signal match email failed", error=str(e))

        # Send push notification if allowed
        if self.preferences.can_send_push(owner_id, "signal_matches"):
            try:
                results["push"] = (
                    await self.push_service.send_signal_match_notification(
                        user_id=owner_id,
                        property_address=property_address,
                        agent_count=agent_count,
                    )
                )
            except Exception as e:
                logger.error("Signal match push failed", error=str(e))

        return results

    async def send_custom_notification(
        self,
        user_id: str,
        email: str,
        subject: str,
        html_content: str,
        push_title: Optional[str] = None,
        push_body: Optional[str] = None,
        category: str = "general",
    ) -> Dict[str, bool]:
        """
        Send custom notification with both email and push.

        Args:
            user_id: User identifier
            email: User email address
            subject: Email subject
            html_content: Email HTML content
            push_title: Push notification title (optional)
            push_body: Push notification body (optional)
            category: Notification category for preference checking

        Returns:
            Dict with email and push send status
        """
        results = {"email": False, "push": False}

        # Send email if allowed
        if self.preferences.can_send_email(user_id, category):
            try:
                results["email"] = await self.email_service.send_email(
                    to=email, subject=subject, html_content=html_content
                )
            except Exception as e:
                logger.error("Custom email failed", error=str(e))

        # Send push if title and body provided and allowed
        if push_title and push_body:
            if self.preferences.can_send_push(user_id, category):
                try:
                    results["push"] = await self.push_service.send_notification(
                        user_id=user_id, title=push_title, body=push_body
                    )
                except Exception as e:
                    logger.error("Custom push failed", error=str(e))

        return results

    def get_user_preferences(self, user_id: str) -> Dict[str, bool]:
        """Get notification preferences for a user."""
        return self.preferences.get_preferences(user_id)

    def update_user_preferences(
        self, user_id: str, preferences: Dict[str, bool]
    ) -> None:
        """Update notification preferences for a user."""
        self.preferences.update_preferences(user_id, preferences)
        logger.info("Notification preferences updated", user_id=user_id)


# Global notification service instance
notification_service = NotificationService()
