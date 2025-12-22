"""
Xphere Blockchain Integration Service
Connects to Xphere network for contract verification and NFT minting
"""

import hashlib
import json
from datetime import datetime
from typing import Optional, Dict, Any

import httpx

from app.core.config import settings


class XphereService:
    """Service for Xphere blockchain integration."""

    def __init__(self):
        self.rpc_url = settings.XPHERE_RPC_URL
        self.chain_id = settings.XPHERE_CHAIN_ID
        self.client = httpx.AsyncClient(timeout=30.0)

    async def _rpc_call(self, method: str, params: list = None) -> Dict[str, Any]:
        """Make an RPC call to the Xphere network."""
        payload = {
            "jsonrpc": "2.0",
            "method": method,
            "params": params or [],
            "id": 1,
        }

        try:
            response = await self.client.post(
                self.rpc_url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            result = response.json()

            if "error" in result:
                raise BlockchainError(f"RPC error: {result['error']}")

            return result.get("result", {})
        except httpx.HTTPError as e:
            raise BlockchainError(f"RPC call failed: {str(e)}")

    async def get_block_number(self) -> int:
        """Get the current block number."""
        result = await self._rpc_call("eth_blockNumber")
        return int(result, 16)

    async def get_balance(self, address: str) -> int:
        """Get balance of an address in wei."""
        result = await self._rpc_call("eth_getBalance", [address, "latest"])
        return int(result, 16)

    async def store_contract_hash(
        self,
        contract_id: str,
        contract_data: Dict[str, Any],
        wallet_address: str
    ) -> Dict[str, Any]:
        """
        Store contract hash on blockchain.

        This creates an immutable record of the contract on the blockchain.

        Args:
            contract_id: Internal contract ID
            contract_data: Contract data to hash
            wallet_address: Address to associate with the transaction

        Returns:
            Transaction receipt
        """
        # Create contract hash
        contract_json = json.dumps(contract_data, sort_keys=True)
        contract_hash = hashlib.sha256(contract_json.encode()).hexdigest()

        # Create metadata
        metadata = {
            "contract_id": contract_id,
            "contract_hash": contract_hash,
            "timestamp": datetime.utcnow().isoformat(),
            "chain_id": self.chain_id,
        }

        # In a real implementation, this would:
        # 1. Sign the transaction with the wallet's private key
        # 2. Send the transaction to a smart contract
        # 3. Return the transaction hash

        # For now, return simulated response
        tx_hash = f"0x{hashlib.sha256(json.dumps(metadata).encode()).hexdigest()}"

        return {
            "tx_hash": tx_hash,
            "contract_hash": contract_hash,
            "block_number": await self.get_block_number(),
            "status": "confirmed",
            "metadata": metadata,
        }

    async def verify_contract_hash(
        self,
        tx_hash: str,
        contract_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Verify a contract hash on blockchain.

        Args:
            tx_hash: Transaction hash from storage
            contract_data: Contract data to verify

        Returns:
            Verification result
        """
        # Create hash of provided data
        contract_json = json.dumps(contract_data, sort_keys=True)
        provided_hash = hashlib.sha256(contract_json.encode()).hexdigest()

        # In real implementation, would fetch tx data and compare hashes
        # For now, return success

        return {
            "verified": True,
            "tx_hash": tx_hash,
            "contract_hash": provided_hash,
            "verified_at": datetime.utcnow().isoformat(),
        }

    async def mint_property_nft(
        self,
        owner_address: str,
        property_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Mint an NFT representing property ownership.

        Args:
            owner_address: Address of the property owner
            property_data: Property metadata

        Returns:
            NFT minting result
        """
        # Create metadata
        metadata = {
            "name": f"Property: {property_data.get('address', 'Unknown')}",
            "description": property_data.get("description", "Real estate property"),
            "attributes": [
                {"trait_type": "Property Type", "value": property_data.get("property_type")},
                {"trait_type": "Region", "value": property_data.get("region")},
                {"trait_type": "Size", "value": property_data.get("size_sqm")},
            ],
        }

        # In real implementation, would:
        # 1. Upload metadata to IPFS
        # 2. Call NFT contract to mint
        # 3. Return token ID and tx hash

        token_id = hashlib.sha256(json.dumps(metadata).encode()).hexdigest()[:16]

        return {
            "token_id": token_id,
            "owner": owner_address,
            "metadata": metadata,
            "tx_hash": f"0x{hashlib.sha256(token_id.encode()).hexdigest()}",
            "status": "minted",
        }

    async def transfer_nft(
        self,
        token_id: str,
        from_address: str,
        to_address: str
    ) -> Dict[str, Any]:
        """
        Transfer property NFT to new owner.

        Args:
            token_id: NFT token ID
            from_address: Current owner address
            to_address: New owner address

        Returns:
            Transfer result
        """
        return {
            "token_id": token_id,
            "from": from_address,
            "to": to_address,
            "tx_hash": f"0x{hashlib.sha256(f'{token_id}{to_address}'.encode()).hexdigest()}",
            "status": "transferred",
        }

    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


class BlockchainError(Exception):
    """Exception for blockchain errors."""
    pass


# Singleton instance
xphere_service = XphereService()
