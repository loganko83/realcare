"""
Toss Payments Integration
Korean payment gateway for subscriptions and one-time payments.
"""

import httpx
import base64
from typing import Dict, Any, Optional, List
from datetime import datetime
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class TossPaymentError(Exception):
    """Toss payment error."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(f"{code}: {message}")


class TossPaymentsService:
    """Toss Payments API client."""

    BASE_URL = "https://api.tosspayments.com/v1"

    def __init__(self):
        self.secret_key = getattr(settings, 'TOSS_SECRET_KEY', 'test_sk_xxx')
        self.client_key = getattr(settings, 'TOSS_CLIENT_KEY', 'test_ck_xxx')
        self.timeout = 30.0

    def _get_auth_header(self) -> str:
        """Get Basic Auth header."""
        credentials = f"{self.secret_key}:"
        encoded = base64.b64encode(credentials.encode()).decode()
        return f"Basic {encoded}"

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        idempotency_key: Optional[str] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to Toss Payments API."""
        url = f"{self.BASE_URL}{endpoint}"

        headers = {
            "Authorization": self._get_auth_header(),
            "Content-Type": "application/json"
        }

        if idempotency_key:
            headers["Idempotency-Key"] = idempotency_key

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    json=data,
                    headers=headers
                )

                result = response.json()

                if response.status_code >= 400:
                    raise TossPaymentError(
                        result.get("code", "UNKNOWN"),
                        result.get("message", "Unknown error")
                    )

                return result

        except httpx.RequestError as e:
            logger.error("Toss Payments connection error", error=str(e))
            raise TossPaymentError("CONNECTION_ERROR", str(e))

    # ========== Payment Operations ==========

    async def confirm_payment(
        self,
        payment_key: str,
        order_id: str,
        amount: int
    ) -> Dict[str, Any]:
        """
        Confirm a payment after user authorization.

        Args:
            payment_key: Payment key from Toss widget
            order_id: Merchant order ID
            amount: Payment amount in KRW

        Returns:
            Payment confirmation result
        """
        logger.info(
            "Confirming Toss payment",
            order_id=order_id,
            amount=amount
        )

        return await self._request(
            "POST",
            "/payments/confirm",
            data={
                "paymentKey": payment_key,
                "orderId": order_id,
                "amount": amount
            },
            idempotency_key=order_id
        )

    async def get_payment(self, payment_key: str) -> Dict[str, Any]:
        """Get payment details by payment key."""
        return await self._request("GET", f"/payments/{payment_key}")

    async def get_payment_by_order_id(self, order_id: str) -> Dict[str, Any]:
        """Get payment details by order ID."""
        return await self._request("GET", f"/payments/orders/{order_id}")

    async def cancel_payment(
        self,
        payment_key: str,
        cancel_reason: str,
        cancel_amount: Optional[int] = None,
        refund_receive_account: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Cancel a payment (full or partial refund).

        Args:
            payment_key: Payment key to cancel
            cancel_reason: Reason for cancellation
            cancel_amount: Amount to refund (None for full refund)
            refund_receive_account: Bank account for virtual account refund
        """
        data: Dict[str, Any] = {"cancelReason": cancel_reason}

        if cancel_amount:
            data["cancelAmount"] = cancel_amount

        if refund_receive_account:
            data["refundReceiveAccount"] = refund_receive_account

        logger.info(
            "Canceling Toss payment",
            payment_key=payment_key,
            reason=cancel_reason
        )

        return await self._request(
            "POST",
            f"/payments/{payment_key}/cancel",
            data=data
        )

    # ========== Billing (Subscription) ==========

    async def issue_billing_key(
        self,
        customer_key: str,
        auth_key: str
    ) -> Dict[str, Any]:
        """
        Issue a billing key for recurring payments.

        Args:
            customer_key: Unique customer identifier
            auth_key: Authorization key from card registration

        Returns:
            {
                "billingKey": "...",
                "customerKey": "...",
                "cardCompany": "...",
                "cardNumber": "****1234"
            }
        """
        logger.info(
            "Issuing billing key",
            customer_key=customer_key
        )

        return await self._request(
            "POST",
            "/billing/authorizations/issue",
            data={
                "customerKey": customer_key,
                "authKey": auth_key
            }
        )

    async def charge_billing(
        self,
        billing_key: str,
        customer_key: str,
        amount: int,
        order_id: str,
        order_name: str,
        tax_free_amount: int = 0
    ) -> Dict[str, Any]:
        """
        Charge a subscription using billing key.

        Args:
            billing_key: Billing key for customer
            customer_key: Customer identifier
            amount: Amount to charge in KRW
            order_id: Unique order ID
            order_name: Order description
            tax_free_amount: Tax-free amount
        """
        logger.info(
            "Charging billing",
            customer_key=customer_key,
            amount=amount
        )

        return await self._request(
            "POST",
            f"/billing/{billing_key}",
            data={
                "customerKey": customer_key,
                "amount": amount,
                "orderId": order_id,
                "orderName": order_name,
                "taxFreeAmount": tax_free_amount
            },
            idempotency_key=order_id
        )

    async def delete_billing_key(self, billing_key: str) -> Dict[str, Any]:
        """Delete a billing key."""
        logger.info("Deleting billing key", billing_key=billing_key[:8] + "...")
        return await self._request("DELETE", f"/billing/{billing_key}")

    # ========== Virtual Account ==========

    async def create_virtual_account(
        self,
        order_id: str,
        amount: int,
        order_name: str,
        customer_name: str,
        bank: str = "HANA",
        valid_hours: int = 24
    ) -> Dict[str, Any]:
        """
        Create a virtual account for payment.

        Args:
            order_id: Unique order ID
            amount: Amount in KRW
            order_name: Order description
            customer_name: Customer name for account
            bank: Bank code (HANA, KOOKMIN, SHINHAN, etc.)
            valid_hours: Hours until expiration
        """
        return await self._request(
            "POST",
            "/virtual-accounts",
            data={
                "orderId": order_id,
                "amount": amount,
                "orderName": order_name,
                "customerName": customer_name,
                "bank": bank,
                "validHours": valid_hours
            }
        )

    # ========== Transactions ==========

    async def get_transactions(
        self,
        start_date: str,
        end_date: str,
        starting_after: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        Get transaction list for date range.

        Args:
            start_date: Start date (YYYY-MM-DD)
            end_date: End date (YYYY-MM-DD)
            starting_after: Cursor for pagination
            limit: Number of transactions to fetch
        """
        params = {
            "startDate": start_date,
            "endDate": end_date,
            "limit": limit
        }

        if starting_after:
            params["startingAfter"] = starting_after

        return await self._request("GET", "/transactions", data=params)

    # ========== Webhooks ==========

    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str
    ) -> bool:
        """
        Verify webhook signature from Toss.

        Args:
            payload: Raw request body
            signature: Signature header value

        Returns:
            True if signature is valid
        """
        import hmac
        import hashlib

        expected = hmac.new(
            self.secret_key.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(expected, signature)

    def get_client_key(self) -> str:
        """Get client key for frontend widget."""
        return self.client_key


# Singleton instance
toss_payments = TossPaymentsService()
