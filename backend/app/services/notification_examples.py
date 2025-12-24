"""
Notification Service Usage Examples
Demonstrates how to use the unified notification service for various events.
"""

from datetime import datetime, timedelta
from app.services.notifications import notification_service


async def example_user_registration():
    """Example: Send welcome notification to new user."""
    user_id = "user_123"
    email = "newuser@example.com"
    name = "John Doe"

    results = await notification_service.on_user_registered(
        user_id=user_id, email=email, name=name
    )

    print(f"Welcome notification sent - Email: {results['email']}, Push: {results['push']}")


async def example_payment_success():
    """Example: Send payment confirmation notifications."""
    user_id = "user_123"
    email = "user@example.com"
    amount = 29000
    plan = "Premium Monthly"
    next_billing = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")

    results = await notification_service.on_payment_completed(
        user_id=user_id,
        email=email,
        amount=amount,
        plan=plan,
        next_billing=next_billing,
    )

    print(f"Payment confirmation sent - Email: {results['email']}, Push: {results['push']}")


async def example_payment_failure():
    """Example: Send payment failure notifications."""
    user_id = "user_123"
    email = "user@example.com"
    plan = "Premium Monthly"
    reason = "Insufficient funds"

    results = await notification_service.on_payment_failed(
        user_id=user_id, email=email, plan=plan, reason=reason
    )

    print(f"Payment failure notification sent - Email: {results['email']}, Push: {results['push']}")


async def example_contract_reminder():
    """Example: Send contract task reminder."""
    user_id = "user_123"
    email = "user@example.com"
    task_title = "Initial payment due"
    due_date = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
    d_day = 3

    results = await notification_service.on_contract_task_due(
        user_id=user_id,
        email=email,
        task_title=task_title,
        due_date=due_date,
        d_day=d_day,
    )

    print(f"Task reminder sent - Email: {results['email']}, Push: {results['push']}")


async def example_agent_verification_approved():
    """Example: Send agent verification approval notification."""
    agent_id = "agent_456"
    email = "agent@realestate.com"
    company_name = "Best Real Estate Co."
    approved = True

    results = await notification_service.on_agent_verified(
        agent_id=agent_id,
        email=email,
        company_name=company_name,
        approved=approved,
    )

    print(f"Agent approval notification sent - Email: {results['email']}, Push: {results['push']}")


async def example_agent_verification_rejected():
    """Example: Send agent verification rejection notification."""
    agent_id = "agent_789"
    email = "agent@realestate.com"
    company_name = "Real Estate Co."
    approved = False
    rejection_reason = "Business registration documents are unclear"

    results = await notification_service.on_agent_verified(
        agent_id=agent_id,
        email=email,
        company_name=company_name,
        approved=approved,
        rejection_reason=rejection_reason,
    )

    print(f"Agent rejection notification sent - Email: {results['email']}, Push: {results['push']}")


async def example_signal_match():
    """Example: Notify owner of agent interest in their signal."""
    owner_id = "user_123"
    email = "owner@example.com"
    property_address = "Seoul Gangnam-gu Apgujeong-dong 123-45"
    agent_count = 5

    results = await notification_service.on_signal_matched(
        owner_id=owner_id,
        email=email,
        property_address=property_address,
        agent_count=agent_count,
    )

    print(f"Signal match notification sent - Email: {results['email']}, Push: {results['push']}")


async def example_custom_notification():
    """Example: Send custom notification."""
    user_id = "user_123"
    email = "user@example.com"
    subject = "[RealCare] Special Promotion"
    html_content = """
    <html>
        <body>
            <h2>Special Promotion!</h2>
            <p>Get 20% off on Premium plan this month.</p>
        </body>
    </html>
    """
    push_title = "Special Promotion"
    push_body = "Get 20% off on Premium plan this month"

    results = await notification_service.send_custom_notification(
        user_id=user_id,
        email=email,
        subject=subject,
        html_content=html_content,
        push_title=push_title,
        push_body=push_body,
        category="marketing",
    )

    print(f"Custom notification sent - Email: {results['email']}, Push: {results['push']}")


async def example_update_preferences():
    """Example: Update user notification preferences."""
    user_id = "user_123"

    # Get current preferences
    current_prefs = notification_service.get_user_preferences(user_id)
    print(f"Current preferences: {current_prefs}")

    # Update preferences (disable email marketing, keep task reminders)
    new_prefs = {
        "email_marketing": False,
        "email_task_reminders": True,
        "push_task_reminders": True,
        "push_payments": False,
    }

    notification_service.update_user_preferences(user_id, new_prefs)

    # Verify updated preferences
    updated_prefs = notification_service.get_user_preferences(user_id)
    print(f"Updated preferences: {updated_prefs}")


async def main():
    """Run all examples."""
    print("=== User Registration ===")
    await example_user_registration()

    print("\n=== Payment Success ===")
    await example_payment_success()

    print("\n=== Payment Failure ===")
    await example_payment_failure()

    print("\n=== Contract Reminder ===")
    await example_contract_reminder()

    print("\n=== Agent Verification Approved ===")
    await example_agent_verification_approved()

    print("\n=== Agent Verification Rejected ===")
    await example_agent_verification_rejected()

    print("\n=== Signal Match ===")
    await example_signal_match()

    print("\n=== Custom Notification ===")
    await example_custom_notification()

    print("\n=== Update Preferences ===")
    await example_update_preferences()


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
