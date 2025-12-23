"""
Unit tests for notification service.
Tests all notification event handlers and preference management.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timedelta

from app.services.notifications import NotificationService, NotificationPreferences


class TestNotificationPreferences:
    """Test notification preferences management."""

    def test_default_preferences(self):
        """Test that default preferences are created correctly."""
        prefs = NotificationPreferences()
        user_prefs = prefs.get_preferences("user_123")

        assert user_prefs["email_enabled"] is True
        assert user_prefs["push_enabled"] is True
        assert user_prefs["email_marketing"] is False
        assert user_prefs["email_task_reminders"] is True

    def test_update_preferences(self):
        """Test updating user preferences."""
        prefs = NotificationPreferences()

        prefs.update_preferences("user_123", {"email_enabled": False})

        user_prefs = prefs.get_preferences("user_123")
        assert user_prefs["email_enabled"] is False
        assert user_prefs["push_enabled"] is True  # Unchanged

    def test_can_send_email_global_disabled(self):
        """Test email sending when globally disabled."""
        prefs = NotificationPreferences()
        prefs.update_preferences("user_123", {"email_enabled": False})

        assert prefs.can_send_email("user_123", "payments") is False

    def test_can_send_email_category_disabled(self):
        """Test email sending when category disabled."""
        prefs = NotificationPreferences()
        prefs.update_preferences("user_123", {"email_payments": False})

        assert prefs.can_send_email("user_123", "payments") is False

    def test_can_send_push_enabled(self):
        """Test push sending when enabled."""
        prefs = NotificationPreferences()

        assert prefs.can_send_push("user_123", "task_reminders") is True


class TestNotificationService:
    """Test notification service event handlers."""

    @pytest.fixture
    def service(self):
        """Create notification service instance."""
        return NotificationService()

    @pytest.mark.asyncio
    async def test_on_user_registered(self, service):
        """Test welcome notification on user registration."""
        with patch.object(
            service.email_service, "send_welcome_email", new_callable=AsyncMock
        ) as mock_email:
            mock_email.return_value = True

            results = await service.on_user_registered(
                user_id="user_123", email="test@example.com", name="John Doe"
            )

            mock_email.assert_called_once_with(email="test@example.com", name="John Doe")
            assert results["email"] is True

    @pytest.mark.asyncio
    async def test_on_payment_completed(self, service):
        """Test payment confirmation notifications."""
        with patch.object(
            service.email_service, "send_payment_confirmation", new_callable=AsyncMock
        ) as mock_email, patch.object(
            service.push_service, "send_payment_notification", new_callable=AsyncMock
        ) as mock_push:
            mock_email.return_value = True
            mock_push.return_value = True

            results = await service.on_payment_completed(
                user_id="user_123",
                email="test@example.com",
                amount=29000,
                plan="Premium",
                next_billing="2024-02-15",
            )

            mock_email.assert_called_once()
            mock_push.assert_called_once_with(
                user_id="user_123", amount=29000, success=True
            )
            assert results["email"] is True
            assert results["push"] is True

    @pytest.mark.asyncio
    async def test_on_payment_failed(self, service):
        """Test payment failure notifications."""
        with patch.object(
            service.email_service, "send_payment_failed_email", new_callable=AsyncMock
        ) as mock_email, patch.object(
            service.push_service, "send_payment_notification", new_callable=AsyncMock
        ) as mock_push:
            mock_email.return_value = True
            mock_push.return_value = True

            results = await service.on_payment_failed(
                user_id="user_123",
                email="test@example.com",
                plan="Premium",
                reason="Insufficient funds",
            )

            mock_email.assert_called_once()
            mock_push.assert_called_once_with(
                user_id="user_123", amount=0, success=False
            )
            assert results["email"] is True
            assert results["push"] is True

    @pytest.mark.asyncio
    async def test_on_contract_task_due(self, service):
        """Test contract task reminder notifications."""
        with patch.object(
            service.email_service, "send_contract_reminder", new_callable=AsyncMock
        ) as mock_email, patch.object(
            service.push_service, "send_task_reminder", new_callable=AsyncMock
        ) as mock_push:
            mock_email.return_value = True
            mock_push.return_value = True

            results = await service.on_contract_task_due(
                user_id="user_123",
                email="test@example.com",
                task_title="Initial payment due",
                due_date="2024-01-20",
                d_day=3,
            )

            mock_email.assert_called_once()
            mock_push.assert_called_once()
            assert results["email"] is True
            assert results["push"] is True

    @pytest.mark.asyncio
    async def test_on_agent_verified_approved(self, service):
        """Test agent verification approval notification."""
        with patch.object(
            service.email_service,
            "send_agent_verification_result",
            new_callable=AsyncMock,
        ) as mock_email, patch.object(
            service.push_service,
            "send_agent_verification_notification",
            new_callable=AsyncMock,
        ) as mock_push:
            mock_email.return_value = True
            mock_push.return_value = True

            results = await service.on_agent_verified(
                agent_id="agent_456",
                email="agent@example.com",
                company_name="Best Real Estate",
                approved=True,
            )

            mock_email.assert_called_once()
            assert mock_email.call_args.kwargs["approved"] is True
            assert results["email"] is True
            assert results["push"] is True

    @pytest.mark.asyncio
    async def test_on_agent_verified_rejected(self, service):
        """Test agent verification rejection notification."""
        with patch.object(
            service.email_service,
            "send_agent_verification_result",
            new_callable=AsyncMock,
        ) as mock_email:
            mock_email.return_value = True

            results = await service.on_agent_verified(
                agent_id="agent_456",
                email="agent@example.com",
                company_name="Real Estate Co",
                approved=False,
                rejection_reason="Documents unclear",
            )

            mock_email.assert_called_once()
            assert mock_email.call_args.kwargs["approved"] is False
            assert (
                mock_email.call_args.kwargs["rejection_reason"] == "Documents unclear"
            )

    @pytest.mark.asyncio
    async def test_on_signal_matched(self, service):
        """Test signal match notification."""
        with patch.object(
            service.email_service,
            "send_signal_match_notification",
            new_callable=AsyncMock,
        ) as mock_email, patch.object(
            service.push_service,
            "send_signal_match_notification",
            new_callable=AsyncMock,
        ) as mock_push:
            mock_email.return_value = True
            mock_push.return_value = True

            results = await service.on_signal_matched(
                owner_id="user_123",
                email="owner@example.com",
                property_address="Seoul Gangnam-gu",
                agent_count=5,
            )

            mock_email.assert_called_once()
            mock_push.assert_called_once()
            assert results["email"] is True
            assert results["push"] is True

    @pytest.mark.asyncio
    async def test_preferences_respected_email_disabled(self, service):
        """Test that email notifications are skipped when disabled."""
        service.preferences.update_preferences("user_123", {"email_payments": False})

        with patch.object(
            service.email_service, "send_payment_confirmation", new_callable=AsyncMock
        ) as mock_email:
            results = await service.on_payment_completed(
                user_id="user_123",
                email="test@example.com",
                amount=29000,
                plan="Premium",
                next_billing="2024-02-15",
            )

            mock_email.assert_not_called()
            assert results["email"] is False

    @pytest.mark.asyncio
    async def test_preferences_respected_push_disabled(self, service):
        """Test that push notifications are skipped when disabled."""
        service.preferences.update_preferences("user_123", {"push_payments": False})

        with patch.object(
            service.push_service, "send_payment_notification", new_callable=AsyncMock
        ) as mock_push:
            results = await service.on_payment_completed(
                user_id="user_123",
                email="test@example.com",
                amount=29000,
                plan="Premium",
                next_billing="2024-02-15",
            )

            mock_push.assert_not_called()
            assert results["push"] is False

    @pytest.mark.asyncio
    async def test_error_handling_email_failure(self, service):
        """Test that email errors are handled gracefully."""
        with patch.object(
            service.email_service, "send_payment_confirmation", new_callable=AsyncMock
        ) as mock_email:
            mock_email.side_effect = Exception("SendGrid error")

            results = await service.on_payment_completed(
                user_id="user_123",
                email="test@example.com",
                amount=29000,
                plan="Premium",
                next_billing="2024-02-15",
            )

            # Should not raise exception
            assert results["email"] is False

    @pytest.mark.asyncio
    async def test_custom_notification(self, service):
        """Test sending custom notification."""
        with patch.object(
            service.email_service, "send_email", new_callable=AsyncMock
        ) as mock_email, patch.object(
            service.push_service, "send_notification", new_callable=AsyncMock
        ) as mock_push:
            mock_email.return_value = True
            mock_push.return_value = True

            results = await service.send_custom_notification(
                user_id="user_123",
                email="test@example.com",
                subject="Test Subject",
                html_content="<h1>Test</h1>",
                push_title="Test Push",
                push_body="Test Body",
                category="general",
            )

            mock_email.assert_called_once()
            mock_push.assert_called_once()
            assert results["email"] is True
            assert results["push"] is True

    def test_get_user_preferences(self, service):
        """Test retrieving user preferences."""
        prefs = service.get_user_preferences("user_123")

        assert isinstance(prefs, dict)
        assert "email_enabled" in prefs
        assert "push_enabled" in prefs

    def test_update_user_preferences(self, service):
        """Test updating user preferences."""
        service.update_user_preferences(
            "user_123", {"email_marketing": False, "push_payments": True}
        )

        prefs = service.get_user_preferences("user_123")
        assert prefs["email_marketing"] is False
        assert prefs["push_payments"] is True
