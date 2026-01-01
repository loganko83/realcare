"""
Contract Endpoints
Contract management and timeline tracking with full DB integration
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.schemas.user import UserResponse
from app.schemas.contract import (
    ContractCreate,
    ContractUpdate,
    ContractResponse,
    ContractDetailResponse,
    ContractListResponse,
    TimelineTaskResponse,
    TimelineTaskUpdate,
    ContractAnalysisRequest,
    ContractAnalysisResult,
)
from app.services.contract import ContractService

router = APIRouter()


async def get_contract_service(db: AsyncSession = Depends(get_db)) -> ContractService:
    """Get contract service instance."""
    return ContractService(db)


@router.get("", response_model=ContractListResponse)
async def list_contracts(
    contract_status: Optional[str] = Query(None, alias="status"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: UserResponse = Depends(get_current_user),
    service: ContractService = Depends(get_contract_service),
):
    """
    List all user's contracts.

    Requires authentication.
    """
    contracts, total = await service.list_contracts(
        user_id=current_user.id,
        contract_status=contract_status,
        page=page,
        page_size=page_size,
    )

    return ContractListResponse(
        items=[ContractResponse.model_validate(c) for c in contracts],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("", response_model=ContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(
    data: ContractCreate,
    current_user: UserResponse = Depends(get_current_user),
    service: ContractService = Depends(get_contract_service),
):
    """
    Create a new contract with auto-generated timeline.

    Requires authentication. Timeline tasks are automatically created
    based on contract type and move-in date.
    """
    contract = await service.create_contract(current_user.id, data)
    return ContractResponse.model_validate(contract)


@router.get("/{contract_id}", response_model=ContractDetailResponse)
async def get_contract(
    contract_id: str,
    current_user: UserResponse = Depends(get_current_user),
    service: ContractService = Depends(get_contract_service),
):
    """
    Get a specific contract with timeline tasks.

    Requires authentication. Only owner can view.
    """
    contract = await service.get_contract(contract_id, current_user.id)

    # Build response with timeline tasks
    response_data = ContractResponse.model_validate(contract).model_dump()
    response_data["analysis_result"] = contract.analysis_result
    response_data["identified_risks"] = contract.identified_risks
    response_data["recommendations"] = contract.recommendations
    response_data["timeline_tasks"] = [
        TimelineTaskResponse.model_validate(t) for t in contract.timeline_tasks
    ]

    return ContractDetailResponse(**response_data)


@router.put("/{contract_id}", response_model=ContractResponse)
async def update_contract(
    contract_id: str,
    data: ContractUpdate,
    current_user: UserResponse = Depends(get_current_user),
    service: ContractService = Depends(get_contract_service),
):
    """
    Update a contract.

    Requires authentication. Only owner can update.
    """
    contract = await service.update_contract(contract_id, current_user.id, data)
    return ContractResponse.model_validate(contract)


@router.delete("/{contract_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(
    contract_id: str,
    current_user: UserResponse = Depends(get_current_user),
    service: ContractService = Depends(get_contract_service),
):
    """
    Delete a contract.

    Requires authentication. Only owner can delete.
    """
    await service.delete_contract(contract_id, current_user.id)


@router.get("/{contract_id}/timeline", response_model=List[TimelineTaskResponse])
async def get_timeline(
    contract_id: str,
    current_user: UserResponse = Depends(get_current_user),
    service: ContractService = Depends(get_contract_service),
):
    """
    Get contract timeline tasks.

    Requires authentication. Only owner can view.
    """
    tasks = await service.get_timeline_tasks(contract_id, current_user.id)
    return [TimelineTaskResponse.model_validate(t) for t in tasks]


@router.patch("/{contract_id}/timeline/{task_id}", response_model=TimelineTaskResponse)
async def update_task(
    contract_id: str,
    task_id: str,
    data: TimelineTaskUpdate,
    current_user: UserResponse = Depends(get_current_user),
    service: ContractService = Depends(get_contract_service),
):
    """
    Update a timeline task.

    Requires authentication. Only contract owner can update.
    """
    task = await service.update_task(task_id, current_user.id, data)
    return TimelineTaskResponse.model_validate(task)


@router.post("/{contract_id}/analyze", response_model=ContractAnalysisResult)
async def analyze_contract(
    contract_id: str,
    request: ContractAnalysisRequest,
    current_user: UserResponse = Depends(get_current_user),
    service: ContractService = Depends(get_contract_service),
):
    """
    AI-powered contract analysis using Gemini.

    Requires authentication. Analyzes contract text or file for risks.
    """
    from app.services.gemini import gemini_service

    # Verify ownership
    contract = await service.get_contract(contract_id, current_user.id)

    # Get contract text from request or placeholder
    contract_text = request.contract_text
    if not contract_text and request.contract_file_url:
        # TODO: Fetch and extract text from file URL
        contract_text = f"Contract for property at {contract.property_address}"

    if not contract_text:
        contract_text = f"""
        Contract Type: {contract.contract_type}
        Property Address: {contract.property_address}
        Total Price: {contract.total_price:,} KRW
        Deposit: {contract.deposit or 0:,} KRW
        Has Loan: {contract.has_loan}
        """

    # Analyze with Gemini
    analysis = await gemini_service.analyze_contract(
        contract_text=contract_text,
        contract_type=contract.contract_type
    )

    risk_score = analysis.get("risk_score", 50)
    identified_risks = analysis.get("identified_risks", [])
    recommendations = analysis.get("recommendations", [])
    summary = analysis.get("summary", "Analysis complete")

    # Save analysis result
    await service.set_analysis_result(
        contract_id,
        current_user.id,
        risk_score,
        analysis,
        identified_risks,
        recommendations,
    )

    return ContractAnalysisResult(
        risk_score=risk_score,
        identified_risks=identified_risks,
        recommendations=recommendations,
        summary=summary,
    )
