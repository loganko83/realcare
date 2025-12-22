"""Contract schemas."""
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class ContractCreate(BaseModel):
    """Schema for creating a contract."""
    contract_type: str = Field(..., description="sale, jeonse, or monthly_rent")
    property_address: str = Field(..., min_length=5, max_length=500)
    property_description: Optional[str] = Field(None, max_length=1000)
    contract_date: Optional[date] = None
    move_in_date: Optional[date] = None
    move_out_date: Optional[date] = None
    total_price: int = Field(..., gt=0)
    deposit: Optional[int] = Field(None, ge=0)
    monthly_rent: Optional[int] = Field(None, ge=0)
    loan_amount: Optional[int] = Field(None, ge=0)
    has_loan: bool = False
    has_interior_work: bool = False


class ContractUpdate(BaseModel):
    """Schema for updating a contract."""
    status: Optional[str] = None
    contract_date: Optional[date] = None
    move_in_date: Optional[date] = None
    move_out_date: Optional[date] = None
    total_price: Optional[int] = Field(None, gt=0)
    deposit: Optional[int] = Field(None, ge=0)
    monthly_rent: Optional[int] = Field(None, ge=0)
    loan_amount: Optional[int] = Field(None, ge=0)
    has_loan: Optional[bool] = None
    has_interior_work: Optional[bool] = None


class TimelineTaskResponse(BaseModel):
    """Timeline task response."""
    id: str
    title: str
    description: Optional[str]
    category: str
    priority: str
    due_date: Optional[date]
    d_day_offset: Optional[int]
    is_completed: bool
    is_optional: bool
    completed_at: Optional[datetime]
    sort_order: int

    class Config:
        from_attributes = True


class TimelineTaskUpdate(BaseModel):
    """Schema for updating a timeline task."""
    is_completed: Optional[bool] = None
    due_date: Optional[date] = None


class ContractResponse(BaseModel):
    """Contract response."""
    id: str
    user_id: str
    contract_type: str
    status: str
    property_address: str
    property_description: Optional[str]
    contract_date: Optional[date]
    move_in_date: Optional[date]
    move_out_date: Optional[date]
    total_price: int
    deposit: Optional[int]
    monthly_rent: Optional[int]
    loan_amount: Optional[int]
    risk_score: Optional[int]
    has_loan: bool
    has_interior_work: bool
    is_verified: bool
    blockchain_tx_hash: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ContractDetailResponse(ContractResponse):
    """Contract detail response with timeline."""
    analysis_result: Optional[dict]
    identified_risks: Optional[List[dict]]
    recommendations: Optional[List[str]]
    timeline_tasks: List[TimelineTaskResponse] = []


class ContractListResponse(BaseModel):
    """Paginated list of contracts."""
    items: List[ContractResponse]
    total: int
    page: int
    page_size: int


class ContractAnalysisRequest(BaseModel):
    """Request for contract analysis."""
    contract_text: Optional[str] = None
    contract_file_url: Optional[str] = None


class ContractAnalysisResult(BaseModel):
    """Result of contract analysis."""
    risk_score: int = Field(..., ge=0, le=100)
    identified_risks: List[dict]
    recommendations: List[str]
    summary: str
