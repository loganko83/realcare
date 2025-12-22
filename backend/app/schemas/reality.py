"""Reality check schemas."""
from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field


class RealityCheckInput(BaseModel):
    """Input for reality check analysis."""
    property_price: int = Field(..., gt=0, description="Property price in KRW")
    transaction_type: str = Field(..., description="sale, jeonse, or monthly_rent")
    region: str = Field(..., description="Region code or name")
    annual_income: int = Field(..., ge=0, description="Annual income in KRW")
    available_cash: int = Field(..., ge=0, description="Available cash in KRW")
    existing_debt: int = Field(0, ge=0, description="Existing debt in KRW")
    monthly_expenses: int = Field(0, ge=0, description="Monthly fixed expenses")
    house_count: int = Field(0, ge=0, description="Number of houses owned")
    property_name: Optional[str] = None
    property_address: Optional[str] = None


class ScoreBreakdown(BaseModel):
    """Breakdown of reality score components."""
    ltv_score: int = Field(..., ge=0, le=30)
    dsr_score: int = Field(..., ge=0, le=30)
    cash_score: int = Field(..., ge=0, le=25)
    stability_score: int = Field(..., ge=0, le=15)


class RealityCheckResult(BaseModel):
    """Result of reality check analysis."""
    reality_score: int = Field(..., ge=0, le=100)
    ltv_ratio: float
    dsr_ratio: float
    max_loan: int
    required_cash: int
    cash_gap: int
    monthly_payment: int
    score_breakdown: ScoreBreakdown
    recommendations: List[str]
    verdict: str
    verdict_detail: str


class RealityReportCreate(RealityCheckInput):
    """Schema for creating a reality report."""
    pass


class RealityReportResponse(BaseModel):
    """Reality report response."""
    id: str
    user_id: str
    property_name: Optional[str]
    property_address: Optional[str]
    property_price: int
    transaction_type: str
    region: str
    reality_score: int
    ltv_ratio: float
    dsr_ratio: float
    max_loan: int
    required_cash: int
    cash_gap: int
    monthly_payment: int
    score_breakdown: Optional[dict]
    recommendations: Optional[List[str]]
    created_at: datetime

    class Config:
        from_attributes = True


class CompareScenario(BaseModel):
    """Single scenario for comparison."""
    name: str
    property_price: int
    available_cash: int
    region: Optional[str] = None


class CompareRequest(BaseModel):
    """Request for comparing multiple scenarios."""
    base_input: RealityCheckInput
    scenarios: List[CompareScenario] = Field(..., min_length=2, max_length=4)


class CompareResult(BaseModel):
    """Result of scenario comparison."""
    scenario_name: str
    result: RealityCheckResult
    rank: int
