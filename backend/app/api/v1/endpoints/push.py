"""
Push Notification Endpoints
Handles FCM token registration and notification preferences
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.v1.endpoints.auth import get_current_user
from app.schemas.user import UserResponse
from app.services.push import push_service

router = APIRouter()


class PushSubscription(BaseModel):
    """FCM token subscription model."""
    fcm_token: str = Field(..., min_length=1, description="Firebase Cloud Messaging token")


class NotificationPreferences(BaseModel):
    """User notification preferences."""
    task_reminders: bool = Field(True, description="Enable contract task reminders")
    payment_notifications: bool = Field(True, description="Enable payment notifications")
    signal_matches: bool = Field(True, description="Enable owner signal match notifications")
    agent_updates: bool = Field(True, description="Enable agent verification updates")
    marketing: bool = Field(False, description="Enable marketing notifications")


class NotificationPreferencesResponse(NotificationPreferences):
    """Notification preferences response."""
    user_id: str


class TestNotificationRequest(BaseModel):
    """Test notification request."""
    title: Optional[str] = Field("Test Notification", description="Notification title")
    body: Optional[str] = Field("This is a test notification from RealCare", description="Notification body")


@router.post("/subscribe", status_code=status.HTTP_201_CREATED)
async def subscribe_push(
    subscription: PushSubscription,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Register FCM token for push notifications.

    Registers the provided FCM token for the authenticated user.
    Multiple tokens per user are supported for multiple devices.
    """
    success = await push_service.register_token(
        user_id=current_user.id,
        fcm_token=subscription.fcm_token
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register FCM token"
        )

    return {
        "message": "Push subscription registered successfully",
        "user_id": current_user.id
    }


@router.delete("/unsubscribe", status_code=status.HTTP_200_OK)
async def unsubscribe_push(
    subscription: PushSubscription,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Remove FCM token for push notifications.

    Unregisters the provided FCM token for the authenticated user.
    """
    success = await push_service.unregister_token(
        user_id=current_user.id,
        fcm_token=subscription.fcm_token
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="FCM token not found"
        )

    return {
        "message": "Push subscription removed successfully",
        "user_id": current_user.id
    }


@router.post("/test", status_code=status.HTTP_200_OK)
async def send_test_notification(
    request: TestNotificationRequest = TestNotificationRequest(),
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Send a test push notification to the current user.

    Sends a test notification to all registered devices for the authenticated user.
    Useful for verifying push notification setup.
    """
    success = await push_service.send_notification(
        user_id=current_user.id,
        title=request.title,
        body=request.body,
        data={"type": "test", "timestamp": str(current_user.created_at)}
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No registered devices found or push service unavailable"
        )

    return {
        "message": "Test notification sent successfully",
        "user_id": current_user.id
    }


@router.get("/settings", response_model=NotificationPreferencesResponse)
async def get_notification_settings(
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Get notification preferences for the current user.

    Returns the user's notification preferences for different notification types.
    """
    # TODO: Implement database storage for preferences
    # For now, return default preferences
    return NotificationPreferencesResponse(
        user_id=current_user.id,
        task_reminders=True,
        payment_notifications=True,
        signal_matches=True,
        agent_updates=True,
        marketing=False
    )


@router.put("/settings", response_model=NotificationPreferencesResponse)
async def update_notification_settings(
    preferences: NotificationPreferences,
    current_user: UserResponse = Depends(get_current_user),
):
    """
    Update notification preferences for the current user.

    Updates the user's notification preferences for different notification types.
    """
    # TODO: Implement database storage for preferences
    # For now, return the submitted preferences
    return NotificationPreferencesResponse(
        user_id=current_user.id,
        **preferences.model_dump()
    )
