"""
Reality Check Endpoints
Financial feasibility analysis
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

router = APIRouter()


class RealityCheckInput(BaseModel):
    """Reality check input parameters."""
    region: str
    target_price: int = Field(..., gt=0, description="Target property price in KRW")
    annual_income: int = Field(..., gt=0, description="Annual income in KRW")
    cash_available: int = Field(..., ge=0, description="Available cash in KRW")
    existing_debt: int = Field(0, ge=0, description="Monthly existing debt payment in KRW")
    is_first_home: bool = True
    house_count: int = Field(0, ge=0, le=10)


class RiskItem(BaseModel):
    """Risk item in analysis."""
    type: str  # critical, warning, info, success
    title: str
    message: str
    suggestion: Optional[str] = None


class ScoreBreakdown(BaseModel):
    """Score breakdown."""
    ltv_score: int
    dsr_score: int
    cash_gap_score: int
    stability_score: int


class FinancialAnalysis(BaseModel):
    """Financial analysis details."""
    target_price: int
    max_loan_by_ltv: int
    max_loan_by_dsr: int
    max_loan_amount: int
    required_cash: int
    gap_amount: int
    monthly_repayment: int
    dsr_percentage: float
    applicable_ltv: int


class RegionInfo(BaseModel):
    """Region regulatory information."""
    name: str
    is_speculative_zone: bool
    is_adjusted_zone: bool
    max_ltv: int


class RealityCheckResult(BaseModel):
    """Reality check result."""
    score: int = Field(..., ge=0, le=100)
    grade: str
    breakdown: ScoreBreakdown
    analysis: FinancialAnalysis
    risks: List[RiskItem]
    region: RegionInfo
    created_at: datetime


class ScenarioCompareInput(BaseModel):
    """Scenario comparison input."""
    base: RealityCheckInput
    wait_years: int = Field(1, ge=1, le=5)
    price_appreciation: float = Field(3.0, ge=-10, le=20)
    income_growth: float = Field(2.0, ge=-5, le=20)
    savings_rate: float = Field(30.0, ge=0, le=100)
    interest_rate_change: float = Field(0.0, ge=-3, le=3)


@router.post("/calculate", response_model=RealityCheckResult)
async def calculate_reality_check(input_data: RealityCheckInput):
    """
    Calculate Reality Check score.

    Returns comprehensive financial feasibility analysis.
    """
    # Import calculation logic (simplified for now)
    from app.services.reality_calculator import calculate_reality_score

    result = await calculate_reality_score(input_data)
    return result


@router.get("/reports")
async def get_reports(
    limit: int = 10,
    offset: int = 0,
):
    """
    Get user's saved reality check reports.

    TODO: Implement with database
    """
    # Placeholder
    return {
        "reports": [],
        "total": 0,
        "limit": limit,
        "offset": offset,
    }


@router.get("/reports/{report_id}")
async def get_report(report_id: str):
    """
    Get a specific reality check report.

    TODO: Implement with database
    """
    raise HTTPException(status_code=404, detail="Report not found")


@router.post("/compare")
async def compare_scenarios(input_data: ScenarioCompareInput):
    """
    Compare buy now vs buy later scenarios.

    Returns projection for both scenarios.
    """
    from app.services.reality_calculator import compare_scenarios

    result = await compare_scenarios(input_data)
    return result


@router.get("/action-plan/{report_id}")
async def get_action_plan(report_id: str):
    """
    Get AI-generated action plan for a report.

    TODO: Integrate with Gemini AI
    """
    # Placeholder
    return {
        "report_id": report_id,
        "recommendations": [
            {
                "priority": "high",
                "title": "Increase savings rate",
                "description": "Consider reducing discretionary spending to build down payment faster",
                "timeline": "3-6 months",
            },
            {
                "priority": "medium",
                "title": "Explore first-time buyer programs",
                "description": "Check eligibility for government-backed first-time buyer loans",
                "timeline": "1-2 weeks",
            },
        ],
    }
