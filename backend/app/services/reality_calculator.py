"""
Reality Check Calculator Service
Calculates financial feasibility based on Korean real estate regulations
"""

from datetime import datetime
from typing import Dict, Any, List

from app.api.v1.endpoints.reality import (
    RealityCheckInput,
    RealityCheckResult,
    ScoreBreakdown,
    FinancialAnalysis,
    RegionInfo,
    RiskItem,
    ScenarioCompareInput,
)


# Korean real estate regulation zones
REGION_CONFIG: Dict[str, Dict[str, Any]] = {
    # Seoul Speculative Overheated Zones
    "gangnam": {"name": "Gangnam-gu", "speculative": True, "adjusted": True},
    "seocho": {"name": "Seocho-gu", "speculative": True, "adjusted": True},
    "songpa": {"name": "Songpa-gu", "speculative": True, "adjusted": True},
    "yongsan": {"name": "Yongsan-gu", "speculative": True, "adjusted": True},
    # Seoul Adjusted Zones
    "mapo": {"name": "Mapo-gu", "speculative": False, "adjusted": True},
    "seongdong": {"name": "Seongdong-gu", "speculative": False, "adjusted": True},
    "gwangjin": {"name": "Gwangjin-gu", "speculative": False, "adjusted": True},
    "dongdaemun": {"name": "Dongdaemun-gu", "speculative": False, "adjusted": True},
    "junggu": {"name": "Jung-gu", "speculative": False, "adjusted": True},
    "jongrogu": {"name": "Jongro-gu", "speculative": False, "adjusted": True},
    # Non-regulated areas (example)
    "nowon": {"name": "Nowon-gu", "speculative": False, "adjusted": False},
    "dobong": {"name": "Dobong-gu", "speculative": False, "adjusted": False},
    "gangbuk": {"name": "Gangbuk-gu", "speculative": False, "adjusted": False},
}

# Default values for unknown regions
DEFAULT_REGION = {"name": "Other", "speculative": False, "adjusted": False}


def get_ltv_limit(region_config: Dict, is_first_home: bool, house_count: int) -> int:
    """Get LTV limit based on regulation zone and ownership status."""
    if region_config.get("speculative"):
        if is_first_home:
            return 50
        elif house_count == 1:
            return 30
        else:
            return 0
    elif region_config.get("adjusted"):
        if is_first_home:
            return 70
        elif house_count == 1:
            return 60
        else:
            return 30
    else:
        return 70  # Non-regulated


def calculate_dsr(annual_income: int, monthly_debt: int, interest_rate: float = 4.5) -> float:
    """Calculate DSR percentage."""
    monthly_income = annual_income / 12
    if monthly_income == 0:
        return 100.0
    dsr = (monthly_debt / monthly_income) * 100
    return min(dsr, 100.0)


def calculate_monthly_payment(
    loan_amount: int,
    interest_rate: float = 4.5,
    years: int = 30
) -> int:
    """Calculate monthly mortgage payment (amortizing loan)."""
    if loan_amount <= 0:
        return 0
    monthly_rate = interest_rate / 100 / 12
    n_payments = years * 12
    if monthly_rate == 0:
        return int(loan_amount / n_payments)
    payment = loan_amount * (monthly_rate * (1 + monthly_rate) ** n_payments) / (
        (1 + monthly_rate) ** n_payments - 1
    )
    return int(payment)


def get_grade(score: int) -> str:
    """Get grade from score."""
    if score >= 80:
        return "A"
    elif score >= 60:
        return "B"
    elif score >= 40:
        return "C"
    elif score >= 20:
        return "D"
    else:
        return "F"


async def calculate_reality_score(input_data: RealityCheckInput) -> RealityCheckResult:
    """Calculate comprehensive Reality Check score."""

    # Get region configuration
    region_config = REGION_CONFIG.get(input_data.region, DEFAULT_REGION)

    # Get LTV limit
    max_ltv = get_ltv_limit(
        region_config,
        input_data.is_first_home,
        input_data.house_count
    )

    # Calculate max loan by LTV
    max_loan_ltv = int(input_data.target_price * max_ltv / 100)

    # Calculate DSR-limited loan
    dsr_limit = 40  # Standard DSR limit
    max_monthly_for_dsr = (input_data.annual_income / 12) * (dsr_limit / 100) - input_data.existing_debt
    max_loan_dsr = int(max_monthly_for_dsr / 0.005) if max_monthly_for_dsr > 0 else 0  # Rough estimate

    # Actual max loan is the lower of LTV and DSR limits
    max_loan = min(max_loan_ltv, max_loan_dsr)
    max_loan = max(0, max_loan)

    # Required cash
    required_cash = input_data.target_price - max_loan

    # Cash gap
    cash_gap = max(0, required_cash - input_data.cash_available)

    # Monthly repayment
    monthly_repayment = calculate_monthly_payment(max_loan)

    # DSR percentage
    total_monthly_debt = monthly_repayment + input_data.existing_debt
    dsr_percentage = calculate_dsr(input_data.annual_income, total_monthly_debt)

    # Calculate score breakdown
    # LTV Score (0-25): How much headroom in LTV
    ltv_utilization = (max_loan_ltv / input_data.target_price * 100) if input_data.target_price > 0 else 0
    ltv_score = min(25, int(ltv_utilization / 4))

    # DSR Score (0-25): How much DSR headroom
    dsr_headroom = max(0, 40 - dsr_percentage)
    dsr_score = min(25, int(dsr_headroom))

    # Cash Gap Score (0-25): Ability to cover gap
    if cash_gap == 0:
        cash_gap_score = 25
    else:
        coverage = input_data.cash_available / required_cash if required_cash > 0 else 1
        cash_gap_score = min(25, int(coverage * 25))

    # Stability Score (0-25): Based on income ratio
    price_to_income = input_data.target_price / input_data.annual_income if input_data.annual_income > 0 else 20
    if price_to_income <= 5:
        stability_score = 25
    elif price_to_income <= 10:
        stability_score = int(25 - (price_to_income - 5) * 3)
    else:
        stability_score = max(0, int(25 - (price_to_income - 5) * 3))

    # Total score
    total_score = ltv_score + dsr_score + cash_gap_score + stability_score

    # Generate risks
    risks: List[RiskItem] = []

    if dsr_percentage > 40:
        risks.append(RiskItem(
            type="critical",
            title="DSR Limit Exceeded",
            message=f"Your DSR of {dsr_percentage:.1f}% exceeds the 40% limit. Loan approval may be difficult.",
            suggestion="Consider reducing existing debt or increasing income before applying.",
        ))
    elif dsr_percentage > 35:
        risks.append(RiskItem(
            type="warning",
            title="DSR Near Limit",
            message=f"Your DSR of {dsr_percentage:.1f}% is approaching the 40% limit.",
            suggestion="Build a larger down payment to reduce the loan amount needed.",
        ))

    if cash_gap > 0:
        risks.append(RiskItem(
            type="critical",
            title="Cash Shortfall",
            message=f"You are short by {cash_gap:,} KRW for the down payment.",
            suggestion="Save more or consider a less expensive property.",
        ))

    if max_ltv == 0:
        risks.append(RiskItem(
            type="critical",
            title="No Loan Available",
            message="Multi-home owners cannot get loans in speculative zones.",
            suggestion="Consider selling existing property first or looking in non-regulated areas.",
        ))

    if region_config.get("speculative"):
        risks.append(RiskItem(
            type="info",
            title="Speculative Overheated Zone",
            message="This area has strict lending regulations with lower LTV limits.",
            suggestion="Be prepared for stricter scrutiny during loan approval.",
        ))

    if total_score >= 70:
        risks.append(RiskItem(
            type="success",
            title="Good Financial Position",
            message="Your financial situation looks favorable for this purchase.",
            suggestion=None,
        ))

    return RealityCheckResult(
        score=total_score,
        grade=get_grade(total_score),
        breakdown=ScoreBreakdown(
            ltv_score=ltv_score,
            dsr_score=dsr_score,
            cash_gap_score=cash_gap_score,
            stability_score=stability_score,
        ),
        analysis=FinancialAnalysis(
            target_price=input_data.target_price,
            max_loan_by_ltv=max_loan_ltv,
            max_loan_by_dsr=max_loan_dsr,
            max_loan_amount=max_loan,
            required_cash=required_cash,
            gap_amount=cash_gap,
            monthly_repayment=monthly_repayment,
            dsr_percentage=round(dsr_percentage, 2),
            applicable_ltv=max_ltv,
        ),
        risks=risks,
        region=RegionInfo(
            name=region_config.get("name", "Unknown"),
            is_speculative_zone=region_config.get("speculative", False),
            is_adjusted_zone=region_config.get("adjusted", False),
            max_ltv=max_ltv,
        ),
        created_at=datetime.utcnow(),
    )


async def compare_scenarios(input_data: ScenarioCompareInput) -> Dict[str, Any]:
    """Compare buy now vs buy later scenarios."""

    base = input_data.base
    wait_years = input_data.wait_years

    # Calculate "buy now" scenario
    buy_now = await calculate_reality_score(base)

    # Project future values
    future_price = int(base.target_price * (1 + input_data.price_appreciation / 100) ** wait_years)
    future_income = int(base.annual_income * (1 + input_data.income_growth / 100) ** wait_years)
    monthly_savings = int((base.annual_income / 12) * (input_data.savings_rate / 100))
    additional_savings = monthly_savings * 12 * wait_years
    future_cash = base.cash_available + additional_savings

    # Calculate "buy later" scenario
    later_input = RealityCheckInput(
        region=base.region,
        target_price=future_price,
        annual_income=future_income,
        cash_available=future_cash,
        existing_debt=base.existing_debt,
        is_first_home=base.is_first_home,
        house_count=base.house_count,
    )
    buy_later = await calculate_reality_score(later_input)

    return {
        "buy_now": {
            "score": buy_now.score,
            "grade": buy_now.grade,
            "target_price": base.target_price,
            "max_loan": buy_now.analysis.max_loan_amount,
            "monthly_payment": buy_now.analysis.monthly_repayment,
            "cash_gap": buy_now.analysis.gap_amount,
        },
        "buy_later": {
            "score": buy_later.score,
            "grade": buy_later.grade,
            "target_price": future_price,
            "max_loan": buy_later.analysis.max_loan_amount,
            "monthly_payment": buy_later.analysis.monthly_repayment,
            "cash_gap": buy_later.analysis.gap_amount,
            "projected_savings": additional_savings,
        },
        "projection": {
            "wait_years": wait_years,
            "price_change": future_price - base.target_price,
            "income_change": future_income - base.annual_income,
            "savings_gained": additional_savings,
            "recommendation": "buy_now" if buy_now.score >= buy_later.score else "wait",
        },
    }
