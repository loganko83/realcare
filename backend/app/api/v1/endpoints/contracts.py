"""
Contract Endpoints
Contract management and timeline tracking
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date
from enum import Enum

router = APIRouter()


class ContractType(str, Enum):
    SALE = "sale"
    JEONSE = "jeonse"
    MONTHLY = "monthly"


class ContractStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    MOVING = "moving"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class TaskStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    SKIPPED = "skipped"


class TaskPriority(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class TaskCategory(str, Enum):
    LOAN = "loan"
    INTERIOR = "interior"
    MOVING = "moving"
    CLEANING = "cleaning"
    FINANCE = "finance"
    DOCUMENTS = "documents"
    UTILITIES = "utilities"
    INSPECTION = "inspection"
    MOVE_IN = "move_in"


class PropertyInfo(BaseModel):
    """Property information."""
    address: str
    property_type: str
    area_sqm: float
    floor: Optional[int] = None
    unit: Optional[str] = None


class FinancialInfo(BaseModel):
    """Financial information."""
    total_price: int
    deposit: int
    interim_payment: Optional[int] = None
    balance: int
    monthly_rent: Optional[int] = None


class DateInfo(BaseModel):
    """Contract dates."""
    contract_date: date
    move_in_date: date
    contract_end_date: Optional[date] = None


class CounterpartyInfo(BaseModel):
    """Counterparty information."""
    name: str
    phone: Optional[str] = None
    role: str


class SubtaskInfo(BaseModel):
    """Subtask information."""
    id: str
    title: str
    completed: bool = False


class TimelineTask(BaseModel):
    """Timeline task."""
    id: str
    d_day: int
    date: date
    category: TaskCategory
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    subtasks: List[SubtaskInfo] = []
    partner_service: Optional[dict] = None
    notes: Optional[str] = None


class ContractCreate(BaseModel):
    """Create contract request."""
    property: PropertyInfo
    contract_type: ContractType
    dates: DateInfo
    financials: FinancialInfo
    counterparty: CounterpartyInfo
    requires_loan: bool = False
    has_interior: bool = False


class ContractResponse(BaseModel):
    """Contract response."""
    id: str
    user_id: str
    property: PropertyInfo
    contract_type: ContractType
    dates: DateInfo
    financials: FinancialInfo
    counterparty: CounterpartyInfo
    status: ContractStatus
    requires_loan: bool
    has_interior: bool
    timeline: List[TimelineTask]
    created_at: datetime
    updated_at: datetime


class TaskUpdate(BaseModel):
    """Task update request."""
    status: Optional[TaskStatus] = None
    notes: Optional[str] = None


class SubtaskUpdate(BaseModel):
    """Subtask update request."""
    completed: bool


@router.get("", response_model=List[ContractResponse])
async def list_contracts():
    """
    List all user's contracts.

    TODO: Implement with database
    """
    return []


@router.post("", response_model=ContractResponse)
async def create_contract(contract: ContractCreate):
    """
    Create a new contract with auto-generated timeline.

    TODO: Implement with database
    """
    # Generate timeline based on contract details
    from app.services.timeline_generator import generate_timeline

    timeline = generate_timeline(contract)

    return ContractResponse(
        id="contract_placeholder",
        user_id="user_placeholder",
        property=contract.property,
        contract_type=contract.contract_type,
        dates=contract.dates,
        financials=contract.financials,
        counterparty=contract.counterparty,
        status=ContractStatus.ACTIVE,
        requires_loan=contract.requires_loan,
        has_interior=contract.has_interior,
        timeline=timeline,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )


@router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: str):
    """
    Get a specific contract.

    TODO: Implement with database
    """
    raise HTTPException(status_code=404, detail="Contract not found")


@router.get("/{contract_id}/timeline", response_model=List[TimelineTask])
async def get_timeline(contract_id: str):
    """
    Get contract timeline tasks.

    TODO: Implement with database
    """
    return []


@router.put("/{contract_id}/timeline/{task_id}")
async def update_task(contract_id: str, task_id: str, update: TaskUpdate):
    """
    Update a timeline task.

    TODO: Implement with database
    """
    return {"message": "Task updated"}


@router.put("/{contract_id}/timeline/{task_id}/subtask/{subtask_id}")
async def update_subtask(
    contract_id: str,
    task_id: str,
    subtask_id: str,
    update: SubtaskUpdate
):
    """
    Update a subtask.

    TODO: Implement with database
    """
    return {"message": "Subtask updated"}


@router.post("/{contract_id}/analyze")
async def analyze_contract(contract_id: str):
    """
    AI-powered contract analysis.

    TODO: Integrate with Gemini AI
    """
    return {
        "contract_id": contract_id,
        "summary": "Contract analysis placeholder",
        "risks": [],
    }
