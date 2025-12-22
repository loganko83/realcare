"""
DID BaaS Integration Service
Connects to the DID BaaS service for identity verification
"""

import httpx
from typing import Optional, Dict, Any

from app.core.config import settings


class DIDService:
    """Service for DID BaaS integration."""

    def __init__(self):
        self.base_url = settings.DID_BAAS_URL
        self.client = httpx.AsyncClient(timeout=30.0)

    async def create_did(self, user_id: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new DID for a user.

        Args:
            user_id: Internal user ID
            user_data: User information for DID creation

        Returns:
            DID creation response including did_id and wallet_address
        """
        try:
            response = await self.client.post(
                f"{self.base_url}/did/create",
                json={
                    "user_id": user_id,
                    "name": user_data.get("name"),
                    "email": user_data.get("email"),
                    "phone": user_data.get("phone"),
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise DIDServiceError(f"Failed to create DID: {str(e)}")

    async def verify_did(self, did_id: str) -> Dict[str, Any]:
        """
        Verify a DID exists and is valid.

        Args:
            did_id: The DID to verify

        Returns:
            DID verification response
        """
        try:
            response = await self.client.get(
                f"{self.base_url}/did/{did_id}/verify"
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise DIDServiceError(f"Failed to verify DID: {str(e)}")

    async def issue_credential(
        self,
        did_id: str,
        credential_type: str,
        claims: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Issue a verifiable credential.

        Args:
            did_id: The DID to issue credential to
            credential_type: Type of credential (e.g., "agent_license", "property_ownership")
            claims: The claims to include in the credential

        Returns:
            Credential issuance response
        """
        try:
            response = await self.client.post(
                f"{self.base_url}/credentials/issue",
                json={
                    "did": did_id,
                    "type": credential_type,
                    "claims": claims,
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise DIDServiceError(f"Failed to issue credential: {str(e)}")

    async def verify_credential(self, credential_jwt: str) -> Dict[str, Any]:
        """
        Verify a verifiable credential.

        Args:
            credential_jwt: The JWT credential to verify

        Returns:
            Credential verification response
        """
        try:
            response = await self.client.post(
                f"{self.base_url}/credentials/verify",
                json={"credential": credential_jwt}
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise DIDServiceError(f"Failed to verify credential: {str(e)}")

    async def create_presentation(
        self,
        did_id: str,
        credentials: list,
        challenge: str
    ) -> Dict[str, Any]:
        """
        Create a verifiable presentation.

        Args:
            did_id: The DID creating the presentation
            credentials: List of credentials to include
            challenge: Challenge for the presentation

        Returns:
            Presentation creation response
        """
        try:
            response = await self.client.post(
                f"{self.base_url}/presentations/create",
                json={
                    "did": did_id,
                    "credentials": credentials,
                    "challenge": challenge,
                }
            )
            response.raise_for_status()
            return response.json()
        except httpx.HTTPError as e:
            raise DIDServiceError(f"Failed to create presentation: {str(e)}")

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


class DIDServiceError(Exception):
    """Exception for DID service errors."""
    pass


# Singleton instance
did_service = DIDService()
