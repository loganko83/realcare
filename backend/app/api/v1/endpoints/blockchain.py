"""
Blockchain Endpoints
DID and Xphere blockchain integration APIs
"""

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User
from app.models.contract import Contract
from app.schemas.user import UserResponse
from app.services.did import did_service, DIDServiceError
from app.services.blockchain import xphere_service, BlockchainError
from app.api.v1.endpoints.auth import get_current_user, oauth2_scheme
from app.services.auth import AuthService

router = APIRouter()


# Schemas
class DIDCreateResponse(BaseModel):
    """DID creation response."""
    did_id: str
    wallet_address: str
    created_at: str


class CredentialRequest(BaseModel):
    """Credential issuance request."""
    credential_type: str
    claims: dict


class CredentialResponse(BaseModel):
    """Credential response."""
    credential_jwt: str
    credential_type: str
    issued_at: str


class ContractVerifyRequest(BaseModel):
    """Contract verification request."""
    contract_id: str


class ContractVerifyResponse(BaseModel):
    """Contract verification response."""
    contract_id: str
    tx_hash: str
    contract_hash: str
    verified: bool
    verified_at: str


class BlockchainInfoResponse(BaseModel):
    """Blockchain info response."""
    chain_id: int
    rpc_url: str
    current_block: int
    connected: bool


# DID Endpoints
@router.post("/did/create", response_model=DIDCreateResponse)
async def create_user_did(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Create a DID for the current user.

    Creates a decentralized identity and wallet address.
    """
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    if user.did_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already has a DID"
        )

    try:
        result = await did_service.create_did(
            user_id=user.id,
            user_data={
                "name": user.name,
                "email": user.email,
                "phone": user.phone,
            }
        )

        # Update user with DID info
        await db.execute(
            update(User)
            .where(User.id == user.id)
            .values(
                did_id=result.get("did_id"),
                wallet_address=result.get("wallet_address")
            )
        )
        await db.commit()

        return DIDCreateResponse(
            did_id=result.get("did_id"),
            wallet_address=result.get("wallet_address"),
            created_at=datetime.utcnow().isoformat(),
        )

    except DIDServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )


@router.get("/did/me")
async def get_my_did(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Get current user's DID information."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    if not user.did_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User does not have a DID. Create one first."
        )

    return {
        "did_id": user.did_id,
        "wallet_address": user.wallet_address,
    }


@router.post("/did/credentials/issue", response_model=CredentialResponse)
async def issue_credential(
    request: CredentialRequest,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Issue a verifiable credential.

    Issues a credential to the user's DID.
    """
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    if not user.did_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User must have a DID to receive credentials"
        )

    try:
        result = await did_service.issue_credential(
            did_id=user.did_id,
            credential_type=request.credential_type,
            claims=request.claims,
        )

        return CredentialResponse(
            credential_jwt=result.get("credential_jwt", ""),
            credential_type=request.credential_type,
            issued_at=datetime.utcnow().isoformat(),
        )

    except DIDServiceError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e)
        )


# Blockchain Endpoints
@router.get("/chain/info", response_model=BlockchainInfoResponse)
async def get_blockchain_info():
    """Get Xphere blockchain information."""
    try:
        block_number = await xphere_service.get_block_number()
        return BlockchainInfoResponse(
            chain_id=xphere_service.chain_id,
            rpc_url=xphere_service.rpc_url,
            current_block=block_number,
            connected=True,
        )
    except BlockchainError:
        return BlockchainInfoResponse(
            chain_id=xphere_service.chain_id,
            rpc_url=xphere_service.rpc_url,
            current_block=0,
            connected=False,
        )


@router.post("/contracts/{contract_id}/verify", response_model=ContractVerifyResponse)
async def verify_contract_on_chain(
    contract_id: str,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """
    Verify a contract on blockchain.

    Stores the contract hash on Xphere blockchain for immutable verification.
    """
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    # Get contract
    result = await db.execute(
        select(Contract).where(
            Contract.id == contract_id,
            Contract.user_id == user.id
        )
    )
    contract = result.scalar_one_or_none()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    if contract.is_verified:
        return ContractVerifyResponse(
            contract_id=contract_id,
            tx_hash=contract.blockchain_tx_hash or "",
            contract_hash="",
            verified=True,
            verified_at=contract.verified_at.isoformat() if contract.verified_at else "",
        )

    try:
        # Prepare contract data for hashing
        contract_data = {
            "id": contract.id,
            "type": contract.contract_type.value,
            "address": contract.property_address,
            "price": contract.total_price,
            "contract_date": str(contract.contract_date) if contract.contract_date else None,
            "move_in_date": str(contract.move_in_date) if contract.move_in_date else None,
        }

        # Store on blockchain
        result = await xphere_service.store_contract_hash(
            contract_id=contract_id,
            contract_data=contract_data,
            wallet_address=user.wallet_address or "0x0",
        )

        # Update contract
        contract.is_verified = True
        contract.blockchain_tx_hash = result.get("tx_hash")
        contract.verified_at = datetime.utcnow()
        await db.commit()

        return ContractVerifyResponse(
            contract_id=contract_id,
            tx_hash=result.get("tx_hash"),
            contract_hash=result.get("contract_hash"),
            verified=True,
            verified_at=datetime.utcnow().isoformat(),
        )

    except BlockchainError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Blockchain error: {str(e)}"
        )


@router.get("/contracts/{contract_id}/verification")
async def get_contract_verification(
    contract_id: str,
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Get contract blockchain verification status."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    result = await db.execute(
        select(Contract).where(
            Contract.id == contract_id,
            Contract.user_id == user.id
        )
    )
    contract = result.scalar_one_or_none()

    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")

    return {
        "contract_id": contract_id,
        "is_verified": contract.is_verified,
        "tx_hash": contract.blockchain_tx_hash,
        "verified_at": contract.verified_at.isoformat() if contract.verified_at else None,
    }


@router.get("/wallet/balance")
async def get_wallet_balance(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Get user's wallet balance."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    if not user.wallet_address:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User does not have a wallet address"
        )

    try:
        balance_wei = await xphere_service.get_balance(user.wallet_address)
        balance_xph = balance_wei / (10 ** 18)

        return {
            "wallet_address": user.wallet_address,
            "balance_wei": balance_wei,
            "balance_xph": balance_xph,
        }
    except BlockchainError as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Blockchain error: {str(e)}"
        )
