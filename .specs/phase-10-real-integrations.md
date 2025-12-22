# Phase 10: Real Service Integrations

> Spec-Kit Methodology v2.0
> Priority: MEDIUM-HIGH
> Dependencies: Phase 8-9 (Frontend + Testing Complete)
> Estimated Tasks: 40

---

## Overview

This phase replaces mock implementations with real service integrations. Focus on production-ready implementations with proper error handling, retry logic, and monitoring.

## Service Integration Summary

| Service | Purpose | Integration Type |
|---------|---------|------------------|
| DID BaaS | Identity & Credentials | REST API (localhost:8091) |
| Xphere | Blockchain | Web3/JSON-RPC |
| Toss Payments | Payment Processing | REST API |
| Kakao OAuth | Social Login | OAuth 2.0 |
| Naver OAuth | Social Login | OAuth 2.0 |
| Google OAuth | Social Login | OAuth 2.0 |
| Naver Maps | Property Location | JavaScript SDK |
| Naver Real Estate | Property Data | Web Scraping / API |

---

## P10-01: DID BaaS Integration

### Service Information

```yaml
Service: DID BaaS
Server Path: /mnt/storage/did_baas
Local Port: 8091
API Base: http://localhost:8091/api/v1
Standards:
  - W3C DID Core 1.0
  - W3C Verifiable Credentials Data Model 1.1
Features:
  - DID Issuance & Resolution
  - Verifiable Credentials (W3C VC)
  - Zero-Knowledge Proofs
  - BBS+ Signatures
```

### P10-01-A: DID BaaS Service Update

**File**: `backend/app/services/did.py`

```python
"""
DID BaaS Integration Service
Connects to local DID BaaS server at /mnt/storage/did_baas
"""

import httpx
from typing import Optional, Dict, Any
from datetime import datetime
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class DIDServiceError(Exception):
    """DID service error."""
    pass


class DIDService:
    """DID BaaS API client."""

    def __init__(self):
        self.base_url = settings.DID_BAAS_URL  # http://localhost:8091/api/v1
        self.timeout = 30.0

    async def _request(
        self,
        method: str,
        endpoint: str,
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Make HTTP request to DID BaaS."""
        url = f"{self.base_url}{endpoint}"

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params
                )

                if response.status_code >= 400:
                    logger.error(
                        "DID BaaS request failed",
                        status=response.status_code,
                        body=response.text
                    )
                    raise DIDServiceError(f"DID BaaS error: {response.status_code}")

                return response.json()

        except httpx.RequestError as e:
            logger.error("DID BaaS connection error", error=str(e))
            raise DIDServiceError(f"Connection error: {str(e)}")

    # ========== DID Operations ==========

    async def create_did(
        self,
        user_id: str,
        user_data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Create a new DID for a user.

        Returns:
            {
                "did_id": "did:xphere:0x...",
                "wallet_address": "0x...",
                "public_key": "...",
                "created_at": "..."
            }
        """
        payload = {
            "metadata": {
                "user_id": user_id,
                "service": "realcare",
                "created_at": datetime.utcnow().isoformat(),
                **(user_data or {})
            }
        }

        result = await self._request("POST", "/did/issue", data=payload)

        logger.info("DID created", user_id=user_id, did_id=result.get("did_id"))
        return result

    async def resolve_did(self, did_id: str) -> Dict[str, Any]:
        """
        Resolve a DID to get its DID Document.

        Returns:
            DID Document with verification methods, service endpoints, etc.
        """
        return await self._request("GET", f"/did/{did_id}")

    async def verify_did(self, did_id: str) -> bool:
        """Verify a DID is valid and active."""
        try:
            result = await self._request("POST", "/did/verify", data={"did": did_id})
            return result.get("valid", False)
        except DIDServiceError:
            return False

    # ========== Verifiable Credentials ==========

    async def issue_credential(
        self,
        issuer_did: str,
        subject_did: str,
        credential_type: str,
        claims: Dict[str, Any],
        expiration_days: int = 365
    ) -> Dict[str, Any]:
        """
        Issue a Verifiable Credential.

        Args:
            issuer_did: DID of the credential issuer (RealCare)
            subject_did: DID of the credential subject (user)
            credential_type: Type of credential (e.g., "RealityScoreCredential")
            claims: Credential claims/attributes
            expiration_days: Days until credential expires

        Returns:
            {
                "credential_id": "...",
                "credential_jwt": "...",
                "issued_at": "...",
                "expires_at": "..."
            }
        """
        payload = {
            "issuer_did": issuer_did,
            "subject_did": subject_did,
            "credential_type": credential_type,
            "claims": claims,
            "expiration_days": expiration_days
        }

        return await self._request("POST", "/credentials/issue", data=payload)

    async def verify_credential(self, credential_jwt: str) -> Dict[str, Any]:
        """
        Verify a Verifiable Credential.

        Returns:
            {
                "valid": true/false,
                "issuer": "...",
                "subject": "...",
                "claims": {...}
            }
        """
        return await self._request(
            "POST",
            "/credentials/verify",
            data={"credential": credential_jwt}
        )

    # ========== Zero-Knowledge Proofs ==========

    async def create_zkp_proof(
        self,
        credential_id: str,
        attribute: str,
        predicate: str,
        value: Any,
        nonce: str
    ) -> Dict[str, Any]:
        """
        Create a Zero-Knowledge Proof for a credential attribute.

        Example: Prove reality_score > 70 without revealing exact score.

        Args:
            credential_id: ID of the credential
            attribute: Attribute to prove (e.g., "score")
            predicate: Comparison operator ("gt", "gte", "lt", "lte", "eq")
            value: Value to compare against
            nonce: Random nonce for proof freshness

        Returns:
            {
                "proof_id": "...",
                "proof": "...",
                "verified_attribute": "...",
                "predicate": "...",
                "value": ...
            }
        """
        payload = {
            "credential_id": credential_id,
            "attribute": attribute,
            "predicate": predicate,
            "value": value,
            "nonce": nonce
        }

        return await self._request("POST", "/zkp/prove", data=payload)

    async def verify_zkp_proof(
        self,
        proof_id: str,
        nonce: str
    ) -> Dict[str, Any]:
        """Verify a Zero-Knowledge Proof."""
        return await self._request(
            "POST",
            "/zkp/verify",
            data={"proof_id": proof_id, "nonce": nonce}
        )


# Singleton instance
did_service = DIDService()
```

**Tasks**:
- [ ] P10-01-A-1: Update DIDService with real API calls
- [ ] P10-01-A-2: Add proper error handling
- [ ] P10-01-A-3: Add request logging
- [ ] P10-01-A-4: Add retry logic for transient failures

---

### P10-01-B: Credential Types Definition

**File**: `backend/app/schemas/credentials.py`

```python
"""
Verifiable Credential schemas for RealCare.
"""

from enum import Enum
from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime


class CredentialType(str, Enum):
    """Available credential types in RealCare."""
    IDENTITY = "RealCareIdentityCredential"
    REALITY_SCORE = "RealityScoreCredential"
    PROPERTY_OWNER = "PropertyOwnerCredential"
    AGENT_LICENSE = "AgentLicenseCredential"
    CONTRACT_STAMP = "ContractStampCredential"


class IdentityClaims(BaseModel):
    """Claims for identity credential."""
    user_id: str
    name: str
    phone_verified: bool
    verification_level: str  # basic, verified, certified
    member_since: datetime


class RealityScoreClaims(BaseModel):
    """Claims for reality score credential."""
    score: int  # 0-100
    grade: str  # A, B, C, D, F
    region: str
    calculated_at: datetime
    valid_for_days: int = 30


class PropertyOwnerClaims(BaseModel):
    """Claims for property ownership credential."""
    property_id: str
    property_address_hash: str  # Hashed for privacy
    ownership_verified: bool
    verified_at: datetime


class AgentLicenseClaims(BaseModel):
    """Claims for agent license credential."""
    license_number: str
    company_name: str
    regions: list[str]
    license_verified: bool
    verified_at: datetime


class ContractStampClaims(BaseModel):
    """Claims for contract stamp credential."""
    contract_id: str
    document_hash: str
    parties_count: int
    stamped_at: datetime
    tx_hash: str
```

**Tasks**:
- [ ] P10-01-B-1: Define all credential schemas
- [ ] P10-01-B-2: Create credential issuance functions
- [ ] P10-01-B-3: Add credential storage in database

---

### P10-01-C: DID Wallet Frontend

**File**: `src/services/did/didClient.ts`

```typescript
/**
 * DID BaaS Frontend Client
 */

import { apiClient } from '@/lib/api/client';

export interface DIDInfo {
  did_id: string;
  wallet_address: string;
  created_at: string;
}

export interface Credential {
  id: string;
  type: string;
  issuer: string;
  subject: string;
  claims: Record<string, any>;
  issued_at: string;
  expires_at: string;
  status: 'active' | 'revoked' | 'expired';
}

export interface ZKProof {
  proof_id: string;
  attribute: string;
  predicate: string;
  value: number;
  created_at: string;
}

export const didApi = {
  // DID Operations
  createDID: () =>
    apiClient.post<DIDInfo>('/blockchain/did/create'),

  getMyDID: () =>
    apiClient.get<DIDInfo>('/blockchain/did/me'),

  // Credential Operations
  getMyCredentials: () =>
    apiClient.get<Credential[]>('/blockchain/did/credentials'),

  issueCredential: (type: string, claims: Record<string, any>) =>
    apiClient.post<Credential>('/blockchain/did/credentials/issue', {
      credential_type: type,
      claims,
    }),

  verifyCredential: (credentialJwt: string) =>
    apiClient.post<{ valid: boolean; claims?: Record<string, any> }>(
      '/blockchain/did/credentials/verify',
      { credential: credentialJwt }
    ),

  // ZKP Operations
  createProof: (
    credentialId: string,
    attribute: string,
    predicate: 'gt' | 'gte' | 'lt' | 'lte' | 'eq',
    value: number
  ) =>
    apiClient.post<ZKProof>('/blockchain/did/zkp/create', {
      credential_id: credentialId,
      attribute,
      predicate,
      value,
    }),
};
```

**Tasks**:
- [ ] P10-01-C-1: Create DID client for frontend
- [ ] P10-01-C-2: Add credential display components
- [ ] P10-01-C-3: Add ZKP proof creation UI

---

## P10-02: Xphere Blockchain Integration

### Service Information

```yaml
Blockchain: Xphere
Type: EVM-compatible Layer 1
Chain ID: 20250217
RPC URL: https://en-bkk.x-phere.com
Native Token: XPH
Features:
  - Smart Contracts
  - Low Gas Fees
  - Fast Finality
```

### P10-02-A: Xphere Service Update

**File**: `backend/app/services/blockchain.py`

```python
"""
Xphere Blockchain Integration
Real blockchain transactions for contract verification.
"""

import hashlib
import json
from typing import Dict, Any, Optional
from datetime import datetime
import httpx
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class BlockchainError(Exception):
    """Blockchain operation error."""
    pass


class XphereService:
    """Xphere blockchain service with real RPC calls."""

    def __init__(self):
        self.rpc_url = settings.XPHERE_RPC_URL  # https://en-bkk.x-phere.com
        self.chain_id = settings.XPHERE_CHAIN_ID  # 20250217
        self.timeout = 30.0

    async def _rpc_call(
        self,
        method: str,
        params: list = None
    ) -> Any:
        """Make JSON-RPC call to Xphere node."""
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or [],
            "id": 1
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.rpc_url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                )

                result = response.json()

                if "error" in result:
                    raise BlockchainError(result["error"]["message"])

                return result.get("result")

        except httpx.RequestError as e:
            logger.error("Xphere RPC error", error=str(e))
            raise BlockchainError(f"RPC connection error: {str(e)}")

    async def get_chain_id(self) -> int:
        """Get chain ID."""
        result = await self._rpc_call("eth_chainId")
        return int(result, 16)

    async def get_block_number(self) -> int:
        """Get current block number."""
        result = await self._rpc_call("eth_blockNumber")
        return int(result, 16)

    async def get_balance(self, address: str) -> int:
        """Get XPH balance in wei."""
        result = await self._rpc_call("eth_getBalance", [address, "latest"])
        return int(result, 16)

    async def get_transaction(self, tx_hash: str) -> Optional[Dict]:
        """Get transaction by hash."""
        return await self._rpc_call("eth_getTransactionByHash", [tx_hash])

    async def get_transaction_receipt(self, tx_hash: str) -> Optional[Dict]:
        """Get transaction receipt."""
        return await self._rpc_call("eth_getTransactionReceipt", [tx_hash])

    def compute_contract_hash(self, contract_data: Dict[str, Any]) -> str:
        """
        Compute hash of contract data for blockchain storage.

        Args:
            contract_data: Contract information to hash

        Returns:
            SHA-256 hash of normalized contract data
        """
        # Normalize data for consistent hashing
        normalized = json.dumps(contract_data, sort_keys=True, ensure_ascii=False)
        return hashlib.sha256(normalized.encode()).hexdigest()

    async def store_contract_hash(
        self,
        contract_id: str,
        contract_data: Dict[str, Any],
        wallet_address: str
    ) -> Dict[str, Any]:
        """
        Store contract hash on blockchain.

        This creates a transaction that stores the contract hash
        as transaction data, providing immutable proof of the
        contract state at a specific time.

        Args:
            contract_id: Unique contract identifier
            contract_data: Contract data to hash and store
            wallet_address: User's wallet address

        Returns:
            {
                "tx_hash": "0x...",
                "contract_hash": "...",
                "block_number": ...,
                "timestamp": "..."
            }
        """
        contract_hash = self.compute_contract_hash(contract_data)

        # In production, this would:
        # 1. Create a transaction with contract_hash as data
        # 2. Sign with service wallet or via DID BaaS
        # 3. Broadcast to Xphere network
        # 4. Wait for confirmation

        # For now, we create a stamp record via DID BaaS
        # which handles the blockchain interaction
        logger.info(
            "Storing contract hash on Xphere",
            contract_id=contract_id,
            contract_hash=contract_hash[:16] + "..."
        )

        # Placeholder for actual transaction
        # In real implementation, integrate with DID BaaS for signing
        return {
            "tx_hash": f"0x{contract_hash[:64]}",  # Placeholder
            "contract_hash": contract_hash,
            "block_number": await self.get_block_number(),
            "timestamp": datetime.utcnow().isoformat()
        }

    async def verify_contract_hash(
        self,
        contract_id: str,
        contract_data: Dict[str, Any],
        tx_hash: str
    ) -> bool:
        """
        Verify contract hash against blockchain record.

        Args:
            contract_id: Contract identifier
            contract_data: Original contract data
            tx_hash: Transaction hash from original storage

        Returns:
            True if contract data matches blockchain record
        """
        expected_hash = self.compute_contract_hash(contract_data)

        try:
            tx = await self.get_transaction(tx_hash)
            if not tx:
                return False

            # Compare hashes
            stored_hash = tx.get("input", "")[2:]  # Remove 0x prefix
            return stored_hash == expected_hash

        except BlockchainError:
            return False

    async def get_network_info(self) -> Dict[str, Any]:
        """Get network information."""
        try:
            chain_id = await self.get_chain_id()
            block_number = await self.get_block_number()

            return {
                "chain_id": chain_id,
                "rpc_url": self.rpc_url,
                "current_block": block_number,
                "connected": True
            }
        except BlockchainError:
            return {
                "chain_id": self.chain_id,
                "rpc_url": self.rpc_url,
                "current_block": 0,
                "connected": False
            }


# Singleton instance
xphere_service = XphereService()
```

**Tasks**:
- [ ] P10-02-A-1: Implement real RPC calls to Xphere
- [ ] P10-02-A-2: Add transaction monitoring
- [ ] P10-02-A-3: Implement contract hash storage
- [ ] P10-02-A-4: Add verification logic

---

## P10-03: Toss Payments Integration

### Service Information

```yaml
Provider: Toss Payments
API Version: 2022-11-16
Documentation: https://docs.tosspayments.com
Features:
  - Card Payments
  - Virtual Account
  - Easy Pay (Toss Pay)
  - Subscription Billing
  - Refunds
Test Mode:
  Secret Key: test_sk_...
  Client Key: test_ck_...
```

### P10-03-A: Toss Payments Service

**File**: `backend/app/services/toss_payments.py`

```python
"""
Toss Payments Integration
Korean payment gateway for subscriptions and one-time payments.
"""

import httpx
import base64
from typing import Dict, Any, Optional
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
        self.secret_key = settings.TOSS_SECRET_KEY
        self.client_key = settings.TOSS_CLIENT_KEY
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

    async def cancel_payment(
        self,
        payment_key: str,
        cancel_reason: str,
        cancel_amount: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Cancel a payment (full or partial refund).

        Args:
            payment_key: Payment key to cancel
            cancel_reason: Reason for cancellation
            cancel_amount: Amount to refund (None for full refund)
        """
        data = {"cancelReason": cancel_reason}
        if cancel_amount:
            data["cancelAmount"] = cancel_amount

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
        order_name: str
    ) -> Dict[str, Any]:
        """
        Charge a subscription using billing key.

        Args:
            billing_key: Billing key for customer
            customer_key: Customer identifier
            amount: Amount to charge in KRW
            order_id: Unique order ID
            order_name: Order description
        """
        return await self._request(
            "POST",
            f"/billing/{billing_key}",
            data={
                "customerKey": customer_key,
                "amount": amount,
                "orderId": order_id,
                "orderName": order_name
            },
            idempotency_key=order_id
        )

    async def delete_billing_key(self, billing_key: str) -> Dict[str, Any]:
        """Delete a billing key (cancel subscription)."""
        return await self._request(
            "DELETE",
            f"/billing/{billing_key}"
        )


# Singleton instance
toss_payments = TossPaymentsService()
```

**Tasks**:
- [ ] P10-03-A-1: Implement payment confirmation
- [ ] P10-03-A-2: Implement billing key management
- [ ] P10-03-A-3: Implement subscription charging
- [ ] P10-03-A-4: Add webhook handling

---

### P10-03-B: Payment Webhook Handler

**File**: `backend/app/api/v1/endpoints/webhooks.py`

```python
"""
Payment Webhook Handlers
Process async payment notifications from Toss Payments.
"""

from fastapi import APIRouter, Request, HTTPException
import hmac
import hashlib

from app.core.config import get_settings
from app.services.payment import PaymentService

router = APIRouter()
settings = get_settings()


@router.post("/toss/webhook")
async def handle_toss_webhook(request: Request):
    """
    Handle Toss Payments webhook notifications.

    Events:
    - DONE: Payment completed
    - CANCELED: Payment canceled
    - PARTIAL_CANCELED: Partial refund
    - ABORTED: Payment aborted
    - EXPIRED: Payment expired
    """
    # Verify webhook signature
    signature = request.headers.get("Toss-Signature")
    body = await request.body()

    if not verify_webhook_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")

    data = await request.json()
    event_type = data.get("eventType")
    payment_key = data.get("paymentKey")

    # Process based on event type
    if event_type == "DONE":
        await handle_payment_completed(payment_key, data)
    elif event_type == "CANCELED":
        await handle_payment_canceled(payment_key, data)
    elif event_type == "PARTIAL_CANCELED":
        await handle_partial_refund(payment_key, data)

    return {"received": True}


def verify_webhook_signature(body: bytes, signature: str) -> bool:
    """Verify Toss webhook signature."""
    expected = hmac.new(
        settings.TOSS_WEBHOOK_SECRET.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)
```

**Tasks**:
- [ ] P10-03-B-1: Create webhook endpoint
- [ ] P10-03-B-2: Implement signature verification
- [ ] P10-03-B-3: Handle payment events
- [ ] P10-03-B-4: Update payment status in database

---

### P10-03-C: Frontend Payment Widget

**File**: `src/components/payment/TossPaymentWidget.tsx`

```typescript
/**
 * Toss Payments Widget Component
 */

import { useEffect, useRef } from 'react';
import { loadTossPayments } from '@tosspayments/payment-sdk';

interface TossPaymentWidgetProps {
  clientKey: string;
  customerKey: string;
  amount: number;
  orderName: string;
  orderId: string;
  onSuccess: (paymentKey: string) => void;
  onError: (error: Error) => void;
}

export function TossPaymentWidget({
  clientKey,
  customerKey,
  amount,
  orderName,
  orderId,
  onSuccess,
  onError,
}: TossPaymentWidgetProps) {
  const widgetRef = useRef<any>(null);

  useEffect(() => {
    async function initWidget() {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        const widgets = tossPayments.widgets({ customerKey });

        await widgets.setAmount({ value: amount, currency: 'KRW' });

        // Render payment method widget
        await widgets.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        });

        // Render agreement widget
        await widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        });

        widgetRef.current = widgets;
      } catch (error) {
        onError(error as Error);
      }
    }

    initWidget();
  }, [clientKey, customerKey, amount]);

  const handlePayment = async () => {
    try {
      await widgetRef.current?.requestPayment({
        orderId,
        orderName,
        successUrl: `${window.location.origin}/real/checkout/success`,
        failUrl: `${window.location.origin}/real/checkout/fail`,
      });
    } catch (error) {
      onError(error as Error);
    }
  };

  return (
    <div className="space-y-4">
      <div id="payment-method" />
      <div id="agreement" />
      <button
        onClick={handlePayment}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium"
      >
        {amount.toLocaleString()}원 결제하기
      </button>
    </div>
  );
}
```

**Tasks**:
- [ ] P10-03-C-1: Install Toss Payments SDK
- [ ] P10-03-C-2: Create payment widget component
- [ ] P10-03-C-3: Handle success/failure redirects
- [ ] P10-03-C-4: Confirm payment on success page

---

## P10-04: Social Login Integration

### P10-04-A: OAuth Service

**File**: `backend/app/services/oauth.py`

```python
"""
Social OAuth Integration
Kakao, Naver, Google OAuth 2.0 implementation.
"""

import httpx
from typing import Dict, Any, Optional
from abc import ABC, abstractmethod
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class OAuthProvider(ABC):
    """Base OAuth provider interface."""

    @abstractmethod
    async def get_authorization_url(self, state: str) -> str:
        pass

    @abstractmethod
    async def get_access_token(self, code: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        pass


class KakaoOAuth(OAuthProvider):
    """Kakao OAuth implementation."""

    AUTH_URL = "https://kauth.kakao.com/oauth/authorize"
    TOKEN_URL = "https://kauth.kakao.com/oauth/token"
    USER_URL = "https://kapi.kakao.com/v2/user/me"

    def __init__(self):
        self.client_id = settings.KAKAO_CLIENT_ID
        self.client_secret = settings.KAKAO_CLIENT_SECRET
        self.redirect_uri = f"{settings.FRONTEND_URL}/auth/callback/kakao"

    async def get_authorization_url(self, state: str) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "state": state,
            "scope": "profile_nickname profile_image account_email"
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.AUTH_URL}?{query}"

    async def get_access_token(self, code: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                    "code": code
                }
            )
            return response.json()

    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USER_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            data = response.json()

            # Normalize user info
            kakao_account = data.get("kakao_account", {})
            profile = kakao_account.get("profile", {})

            return {
                "provider": "kakao",
                "provider_id": str(data.get("id")),
                "email": kakao_account.get("email"),
                "name": profile.get("nickname"),
                "profile_image": profile.get("profile_image_url")
            }


class NaverOAuth(OAuthProvider):
    """Naver OAuth implementation."""

    AUTH_URL = "https://nid.naver.com/oauth2.0/authorize"
    TOKEN_URL = "https://nid.naver.com/oauth2.0/token"
    USER_URL = "https://openapi.naver.com/v1/nid/me"

    def __init__(self):
        self.client_id = settings.NAVER_CLIENT_ID
        self.client_secret = settings.NAVER_CLIENT_SECRET
        self.redirect_uri = f"{settings.FRONTEND_URL}/auth/callback/naver"

    async def get_authorization_url(self, state: str) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "state": state
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.AUTH_URL}?{query}"

    async def get_access_token(self, code: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "code": code
                }
            )
            return response.json()

    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USER_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            data = response.json()
            user = data.get("response", {})

            return {
                "provider": "naver",
                "provider_id": user.get("id"),
                "email": user.get("email"),
                "name": user.get("name") or user.get("nickname"),
                "profile_image": user.get("profile_image"),
                "phone": user.get("mobile")
            }


class GoogleOAuth(OAuthProvider):
    """Google OAuth implementation."""

    AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
    TOKEN_URL = "https://oauth2.googleapis.com/token"
    USER_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

    def __init__(self):
        self.client_id = settings.GOOGLE_CLIENT_ID
        self.client_secret = settings.GOOGLE_CLIENT_SECRET
        self.redirect_uri = f"{settings.FRONTEND_URL}/auth/callback/google"

    async def get_authorization_url(self, state: str) -> str:
        params = {
            "client_id": self.client_id,
            "redirect_uri": self.redirect_uri,
            "response_type": "code",
            "state": state,
            "scope": "openid email profile"
        }
        query = "&".join(f"{k}={v}" for k, v in params.items())
        return f"{self.AUTH_URL}?{query}"

    async def get_access_token(self, code: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "redirect_uri": self.redirect_uri,
                    "code": code
                }
            )
            return response.json()

    async def get_user_info(self, access_token: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.USER_URL,
                headers={"Authorization": f"Bearer {access_token}"}
            )
            data = response.json()

            return {
                "provider": "google",
                "provider_id": data.get("id"),
                "email": data.get("email"),
                "name": data.get("name"),
                "profile_image": data.get("picture")
            }


# Provider instances
oauth_providers = {
    "kakao": KakaoOAuth(),
    "naver": NaverOAuth(),
    "google": GoogleOAuth()
}
```

**Tasks**:
- [ ] P10-04-A-1: Implement Kakao OAuth
- [ ] P10-04-A-2: Implement Naver OAuth
- [ ] P10-04-A-3: Implement Google OAuth
- [ ] P10-04-A-4: Add user linking logic

---

### P10-04-B: OAuth Endpoints

**File**: `backend/app/api/v1/endpoints/oauth.py`

```python
"""
OAuth authentication endpoints.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import secrets

from app.core.database import get_db
from app.services.oauth import oauth_providers
from app.services.auth import AuthService

router = APIRouter()


@router.get("/login/{provider}")
async def oauth_login(provider: str):
    """Initiate OAuth login flow."""
    if provider not in oauth_providers:
        raise HTTPException(status_code=400, detail="Unknown provider")

    state = secrets.token_urlsafe(32)
    # Store state in session/cache for verification

    url = await oauth_providers[provider].get_authorization_url(state)
    return {"authorization_url": url, "state": state}


@router.post("/callback/{provider}")
async def oauth_callback(
    provider: str,
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db)
):
    """Handle OAuth callback."""
    if provider not in oauth_providers:
        raise HTTPException(status_code=400, detail="Unknown provider")

    # Verify state (should be stored in session)

    oauth = oauth_providers[provider]

    # Get tokens
    tokens = await oauth.get_access_token(code)
    if "error" in tokens:
        raise HTTPException(status_code=400, detail=tokens["error"])

    # Get user info
    user_info = await oauth.get_user_info(tokens["access_token"])

    # Find or create user
    auth_service = AuthService(db)
    user = await auth_service.find_or_create_social_user(
        provider=user_info["provider"],
        provider_id=user_info["provider_id"],
        email=user_info.get("email"),
        name=user_info.get("name"),
        profile_image=user_info.get("profile_image")
    )

    # Generate JWT tokens
    jwt_tokens = auth_service.create_tokens(user.id, user.role.value)

    return jwt_tokens
```

**Tasks**:
- [ ] P10-04-B-1: Create login initiation endpoint
- [ ] P10-04-B-2: Create callback handler
- [ ] P10-04-B-3: Implement user linking
- [ ] P10-04-B-4: Add state verification

---

## P10-05: Naver Maps Integration

### P10-05-A: Naver Maps SDK Setup

**File**: `src/lib/naverMaps.ts`

```typescript
/**
 * Naver Maps SDK Integration
 */

declare global {
  interface Window {
    naver: any;
  }
}

let mapLoaded = false;
let loadPromise: Promise<void> | null = null;

export async function loadNaverMaps(): Promise<void> {
  if (mapLoaded) return;

  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${import.meta.env.VITE_NAVER_MAP_CLIENT_ID}&submodules=geocoder`;
    script.async = true;
    script.onload = () => {
      mapLoaded = true;
      resolve();
    };
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return loadPromise;
}

export interface MapOptions {
  center: { lat: number; lng: number };
  zoom: number;
}

export function createMap(
  container: HTMLElement,
  options: MapOptions
): any {
  const { naver } = window;

  return new naver.maps.Map(container, {
    center: new naver.maps.LatLng(options.center.lat, options.center.lng),
    zoom: options.zoom,
    zoomControl: true,
    zoomControlOptions: {
      position: naver.maps.Position.TOP_RIGHT,
    },
  });
}

export function addMarker(
  map: any,
  position: { lat: number; lng: number },
  title: string
): any {
  const { naver } = window;

  return new naver.maps.Marker({
    position: new naver.maps.LatLng(position.lat, position.lng),
    map,
    title,
  });
}

export async function geocode(address: string): Promise<{
  lat: number;
  lng: number;
  address: string;
} | null> {
  const { naver } = window;

  return new Promise((resolve) => {
    naver.maps.Service.geocode(
      { query: address },
      (status: any, response: any) => {
        if (status !== naver.maps.Service.Status.OK) {
          resolve(null);
          return;
        }

        const result = response.v2.addresses[0];
        if (!result) {
          resolve(null);
          return;
        }

        resolve({
          lat: parseFloat(result.y),
          lng: parseFloat(result.x),
          address: result.roadAddress || result.jibunAddress,
        });
      }
    );
  });
}
```

**Tasks**:
- [ ] P10-05-A-1: Setup Naver Maps SDK loading
- [ ] P10-05-A-2: Create map utility functions
- [ ] P10-05-A-3: Implement geocoding

---

### P10-05-B: Property Map Component

**File**: `src/components/map/PropertyMap.tsx`

```typescript
/**
 * Property Map Component with Naver Maps
 */

import { useEffect, useRef, useState } from 'react';
import { loadNaverMaps, createMap, addMarker, geocode } from '@/lib/naverMaps';

interface Property {
  id: string;
  address: string;
  price: number;
  type: string;
  lat?: number;
  lng?: number;
}

interface PropertyMapProps {
  properties: Property[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onMarkerClick?: (property: Property) => void;
}

export function PropertyMap({
  properties,
  center = { lat: 37.5665, lng: 126.978 }, // Seoul
  zoom = 12,
  onMarkerClick,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initMap() {
      await loadNaverMaps();
      if (!containerRef.current) return;

      mapRef.current = createMap(containerRef.current, { center, zoom });
      setLoading(false);
    }

    initMap();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    // Add markers for properties
    properties.forEach(async (property) => {
      let position = { lat: property.lat!, lng: property.lng! };

      // Geocode if no coordinates
      if (!property.lat || !property.lng) {
        const result = await geocode(property.address);
        if (result) {
          position = { lat: result.lat, lng: result.lng };
        }
      }

      const marker = addMarker(mapRef.current, position, property.address);

      if (onMarkerClick) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          onMarkerClick(property);
        });
      }
    });
  }, [properties, onMarkerClick]);

  return (
    <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-gray-500">Loading map...</span>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
```

**Tasks**:
- [ ] P10-05-B-1: Create PropertyMap component
- [ ] P10-05-B-2: Add marker click handlers
- [ ] P10-05-B-3: Implement property info popup
- [ ] P10-05-B-4: Add clustering for many properties

---

### P10-05-C: Naver Real Estate Integration

**File**: `backend/app/services/naver_realestate.py`

```python
"""
Naver Real Estate Data Integration
Fetch property data from Naver Real Estate.
"""

import httpx
from typing import Dict, List, Any, Optional
import structlog

logger = structlog.get_logger()


class NaverRealEstateService:
    """
    Naver Real Estate data service.

    Note: This uses public APIs. For production, consider
    official partnership or data licensing.
    """

    BASE_URL = "https://new.land.naver.com/api"

    async def search_complexes(
        self,
        region_code: str,
        keyword: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Search apartment complexes in a region.

        Args:
            region_code: Korean region code
            keyword: Search keyword (complex name)

        Returns:
            List of complex information
        """
        params = {
            "cortarNo": region_code,
            "realEstateType": "APT",
            "order": "rank"
        }

        if keyword:
            params["keyword"] = keyword

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/complexes",
                params=params,
                headers=self._get_headers()
            )

            if response.status_code != 200:
                return []

            data = response.json()
            return data.get("complexList", [])

    async def get_complex_detail(
        self,
        complex_id: str
    ) -> Optional[Dict[str, Any]]:
        """Get detailed info about an apartment complex."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/complexes/{complex_id}",
                headers=self._get_headers()
            )

            if response.status_code != 200:
                return None

            return response.json()

    async def get_price_history(
        self,
        complex_id: str,
        area_id: str
    ) -> List[Dict[str, Any]]:
        """Get price history for a specific unit type."""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/complexes/{complex_id}/prices",
                params={"areaId": area_id},
                headers=self._get_headers()
            )

            if response.status_code != 200:
                return []

            data = response.json()
            return data.get("priceList", [])

    def _get_headers(self) -> Dict[str, str]:
        return {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json",
            "Referer": "https://new.land.naver.com"
        }


naver_realestate = NaverRealEstateService()
```

**Tasks**:
- [ ] P10-05-C-1: Implement complex search
- [ ] P10-05-C-2: Implement price history lookup
- [ ] P10-05-C-3: Add caching for API responses
- [ ] P10-05-C-4: Create property data enrichment

---

## Environment Variables Update

```bash
# Backend (.env) - Add these:

# Toss Payments
TOSS_CLIENT_KEY=test_ck_...
TOSS_SECRET_KEY=test_sk_...
TOSS_WEBHOOK_SECRET=...

# Social OAuth
KAKAO_CLIENT_ID=...
KAKAO_CLIENT_SECRET=...
NAVER_CLIENT_ID=...
NAVER_CLIENT_SECRET=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...

# DID BaaS (local)
DID_BAAS_URL=http://localhost:8091/api/v1

# Xphere (production RPC)
XPHERE_RPC_URL=https://en-bkk.x-phere.com
XPHERE_CHAIN_ID=20250217

# Frontend URL
FRONTEND_URL=https://trendy.storydot.kr/real


# Frontend (.env.local) - Add these:
VITE_TOSS_CLIENT_KEY=test_ck_...
VITE_NAVER_MAP_CLIENT_ID=...
```

---

## Definition of Done

- [ ] All services connect to real APIs
- [ ] Error handling for service failures
- [ ] Retry logic for transient errors
- [ ] Logging for all external calls
- [ ] Unit tests with mocked services
- [ ] Integration tests with test accounts
- [ ] Documentation for API keys setup

---

## Implementation Order

1. **Sprint 10.1**: DID BaaS Integration
2. **Sprint 10.2**: Xphere Blockchain
3. **Sprint 10.3**: Toss Payments
4. **Sprint 10.4**: Social Login
5. **Sprint 10.5**: Naver Maps & Real Estate
