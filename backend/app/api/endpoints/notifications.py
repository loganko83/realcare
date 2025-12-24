"""
Notification management endpoints.
API endpoints for managing user notification preferences.
"""

from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field

from app.services.notifications import notification_service
from app.api.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/notifications", tags=["notifications"])


class NotificationPreferencesUpdate(BaseModel):
    """Request model for updating notification preferences."""

    email_enabled: bool = Field(default=True, description="Enable all email notifications")
    push_enabled: bool = Field(default=True, description="Enable all push notifications")
    email_marketing: bool = Field(default=False, description="Receive marketing emails")
    email_task_reminders: bool = Field(default=True, description="Contract task reminders via email")
    email_payments: bool = Field(default=True, description="Payment notifications via email")
    email_agent_updates: bool = Field(default=True, description="Agent status updates via email")
    email_signal_matches: bool = Field(default=True, description="Signal match notifications via email")
    push_task_reminders: bool = Field(default=True, description="Contract task reminders via push")
    push_payments: bool = Field(default=True, description="Payment notifications via push")
    push_agent_updates: bool = Field(default=True, description="Agent status updates via push")
    push_signal_matches: bool = Field(default=True, description="Signal match notifications via push")


class NotificationPreferencesResponse(BaseModel):
    """Response model for notification preferences."""

    user_id: str
    preferences: Dict[str, bool]


class TestNotificationRequest(BaseModel):
    """Request model for sending test notification."""

    notification_type: str = Field(
        ...,
        description="Type of notification to test",
        examples=["payment_completed", "task_reminder", "signal_match"]
    )


@router.get("/preferences", response_model=NotificationPreferencesResponse)
async def get_notification_preferences(
    current_user: User = Depends(get_current_user)
) -> NotificationPreferencesResponse:
    """
    Get current user's notification preferences.

    Returns all notification preference settings for the authenticated user.
    """
    preferences = notification_service.get_user_preferences(str(current_user.id))

    return NotificationPreferencesResponse(
        user_id=str(current_user.id), preferences=preferences
    )


@router.put("/preferences", response_model=NotificationPreferencesResponse)
async def update_notification_preferences(
    preferences_update: NotificationPreferencesUpdate,
    current_user: User = Depends(get_current_user),
) -> NotificationPreferencesResponse:
    """
    Update user's notification preferences.

    Allows users to control which types of notifications they receive
    via email and push channels.
    """
    preferences_dict = preferences_update.model_dump()

    notification_service.update_user_preferences(
        str(current_user.id), preferences_dict
    )

    updated_preferences = notification_service.get_user_preferences(
        str(current_user.id)
    )

    return NotificationPreferencesResponse(
        user_id=str(current_user.id), preferences=updated_preferences
    )


@router.post("/test")
async def send_test_notification(
    test_request: TestNotificationRequest,
    current_user: User = Depends(get_current_user),
) -> Dict[str, Any]:
    """
    Send a test notification to the current user.

    Useful for testing notification delivery and previewing notification content.
    Only works in development/staging environments.
    """
    user_id = str(current_user.id)
    email = current_user.email
    name = current_user.name

    notification_type = test_request.notification_type

    if notification_type == "payment_completed":
        results = await notification_service.on_payment_completed(
            user_id=user_id,
            email=email,
            amount=29000,
            plan="Premium Monthly (TEST)",
            next_billing="2024-02-15",
        )
    elif notification_type == "payment_failed":
        results = await notification_service.on_payment_failed(
            user_id=user_id,
            email=email,
            plan="Premium Monthly (TEST)",
            reason="Test payment failure",
        )
    elif notification_type == "task_reminder":
        results = await notification_service.on_contract_task_due(
            user_id=user_id,
            email=email,
            task_title="Test Task (TEST)",
            due_date="2024-01-20",
            d_day=3,
        )
    elif notification_type == "signal_match":
        results = await notification_service.on_signal_matched(
            owner_id=user_id,
            email=email,
            property_address="Seoul Gangnam-gu Apgujeong-dong 123-45 (TEST)",
            agent_count=5,
        )
    elif notification_type == "agent_verified":
        results = await notification_service.on_agent_verified(
            agent_id=user_id,
            email=email,
            company_name="Test Real Estate Co.",
            approved=True,
        )
    elif notification_type == "welcome":
        results = await notification_service.on_user_registered(
            user_id=user_id, email=email, name=name
        )
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown notification type: {notification_type}",
        )

    return {
        "message": f"Test notification '{notification_type}' sent",
        "results": results,
        "user_id": user_id,
    }


@router.post("/preferences/disable-all")
async def disable_all_notifications(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Disable all notifications for the current user.

    Turns off both email and push notifications. User can re-enable later.
    """
    notification_service.update_user_preferences(
        str(current_user.id),
        {"email_enabled": False, "push_enabled": False},
    )

    return {
        "message": "All notifications disabled",
        "user_id": str(current_user.id),
    }


@router.post("/preferences/enable-all")
async def enable_all_notifications(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Enable all notifications for the current user.

    Turns on both email and push notifications with default preferences.
    """
    notification_service.update_user_preferences(
        str(current_user.id),
        {"email_enabled": True, "push_enabled": True},
    )

    return {
        "message": "All notifications enabled",
        "user_id": str(current_user.id),
    }
