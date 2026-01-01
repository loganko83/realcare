"""
Gemini AI Service for contract analysis and action plans.
Uses Google's Gemini API for intelligent document analysis.
"""

import json
from typing import Dict, List, Optional, Any
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class GeminiService:
    """Service for Gemini AI operations."""

    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = "gemini-1.5-flash"  # Fast model for analysis
        self._client = None

    def _get_client(self):
        """Get or create Gemini client."""
        if self._client is None:
            if not self.api_key:
                raise ValueError("GEMINI_API_KEY not configured")

            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self._client = genai.GenerativeModel(self.model_name)
            except ImportError:
                raise ImportError(
                    "google-generativeai package not installed. "
                    "Run: pip install google-generativeai"
                )

        return self._client

    async def analyze_contract(
        self,
        contract_text: str,
        contract_type: str = "sale"
    ) -> Dict[str, Any]:
        """
        Analyze a real estate contract for risks.

        Args:
            contract_text: The contract text to analyze
            contract_type: Type of contract (sale, jeonse, monthly_rent)

        Returns:
            Analysis result with risk score, identified risks, and recommendations
        """
        if not self.api_key:
            return self._get_mock_analysis(contract_type)

        try:
            client = self._get_client()

            prompt = f"""You are a Korean real estate contract expert. Analyze the following {contract_type} contract and provide:

1. A risk score from 0-100 (0 = very safe, 100 = very risky)
2. List of identified risks with severity (low/medium/high)
3. Specific recommendations for the buyer/tenant
4. A brief summary

Contract text:
{contract_text}

Respond in JSON format:
{{
    "risk_score": <number>,
    "identified_risks": [
        {{"type": "<risk type>", "description": "<description>", "severity": "<low/medium/high>"}}
    ],
    "recommendations": ["<recommendation 1>", "<recommendation 2>"],
    "summary": "<brief summary>",
    "key_terms": ["<important term 1>", "<important term 2>"],
    "unusual_clauses": ["<unusual clause 1>"]
}}

Respond ONLY with valid JSON, no additional text."""

            response = client.generate_content(prompt)
            result = self._parse_json_response(response.text)

            logger.info(
                "Contract analysis completed",
                risk_score=result.get("risk_score"),
                num_risks=len(result.get("identified_risks", []))
            )

            return result

        except Exception as e:
            logger.error("Gemini contract analysis failed", error=str(e))
            return self._get_mock_analysis(contract_type)

    async def generate_action_plan(
        self,
        reality_score: int,
        ltv_ratio: float,
        dsr_ratio: float,
        cash_gap: int,
        property_price: int,
        user_profile: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Generate an action plan based on Reality Check results.

        Args:
            reality_score: The Reality Check score (0-100)
            ltv_ratio: Loan-to-Value ratio
            dsr_ratio: Debt Service Ratio
            cash_gap: Cash shortfall amount
            property_price: Property price
            user_profile: Optional user profile info

        Returns:
            Action plan with steps and recommendations
        """
        if not self.api_key:
            return self._get_mock_action_plan(reality_score, cash_gap)

        try:
            client = self._get_client()

            prompt = f"""You are a Korean real estate financial advisor. Create an action plan for a buyer with:

Reality Check Score: {reality_score}/100
LTV Ratio: {ltv_ratio:.1f}%
DSR Ratio: {dsr_ratio:.1f}%
Property Price: {property_price:,} KRW
Cash Gap (shortage): {cash_gap:,} KRW

{'User profile: ' + json.dumps(user_profile) if user_profile else ''}

Provide personalized advice in Korean for:
1. Immediate actions to take
2. Ways to improve their financial position
3. Alternative strategies if current approach is too risky
4. Timeline recommendations

Respond in JSON format:
{{
    "overall_assessment": "<brief assessment in Korean>",
    "immediate_actions": [
        {{"action": "<action>", "priority": "<high/medium/low>", "impact": "<expected impact>"}}
    ],
    "improvement_strategies": [
        {{"strategy": "<strategy>", "description": "<description>", "potential_savings": "<amount>"}}
    ],
    "alternatives": ["<alternative 1>", "<alternative 2>"],
    "timeline": "<recommended timeline>",
    "warnings": ["<warning 1>"]
}}

Respond ONLY with valid JSON, no additional text."""

            response = client.generate_content(prompt)
            result = self._parse_json_response(response.text)

            logger.info(
                "Action plan generated",
                reality_score=reality_score,
                num_actions=len(result.get("immediate_actions", []))
            )

            return result

        except Exception as e:
            logger.error("Gemini action plan generation failed", error=str(e))
            return self._get_mock_action_plan(reality_score, cash_gap)

    async def analyze_property_risk(
        self,
        property_address: str,
        property_type: str,
        asking_price: int,
        region: str
    ) -> Dict[str, Any]:
        """
        Analyze property-specific risks for Owner Signal.

        Args:
            property_address: Property address
            property_type: Type of property
            asking_price: Asking price
            region: Region/district

        Returns:
            Property risk analysis
        """
        if not self.api_key:
            return {
                "market_assessment": "Market analysis pending",
                "price_evaluation": "competitive",
                "risks": [],
                "recommendations": ["Enable Gemini API for full analysis"]
            }

        try:
            client = self._get_client()

            prompt = f"""You are a Korean real estate market expert. Analyze this property listing:

Property Type: {property_type}
Address: {property_address}
Region: {region}
Asking Price: {asking_price:,} KRW

Provide analysis in Korean:
1. Market assessment for this region
2. Price evaluation (underpriced/competitive/overpriced)
3. Potential risks for sellers
4. Recommendations for listing optimization

Respond in JSON format:
{{
    "market_assessment": "<assessment>",
    "price_evaluation": "<underpriced/competitive/overpriced>",
    "estimated_market_value_range": {{"min": <number>, "max": <number>}},
    "risks": [{{"type": "<type>", "description": "<desc>"}}],
    "recommendations": ["<rec 1>"],
    "expected_time_to_sell": "<estimate>"
}}

Respond ONLY with valid JSON, no additional text."""

            response = client.generate_content(prompt)
            return self._parse_json_response(response.text)

        except Exception as e:
            logger.error("Gemini property analysis failed", error=str(e))
            return {
                "market_assessment": "Analysis unavailable",
                "price_evaluation": "unknown",
                "risks": [],
                "recommendations": []
            }

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parse JSON from Gemini response."""
        try:
            # Try to extract JSON from response
            text = response_text.strip()

            # Remove markdown code blocks if present
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]

            return json.loads(text.strip())

        except json.JSONDecodeError as e:
            logger.warning("Failed to parse Gemini JSON response", error=str(e))
            return {
                "error": "Failed to parse response",
                "raw_response": response_text[:500]
            }

    def _get_mock_analysis(self, contract_type: str) -> Dict[str, Any]:
        """Return mock analysis when API is unavailable."""
        return {
            "risk_score": 45,
            "identified_risks": [
                {
                    "type": "standard_clause",
                    "description": "Standard contract terms detected",
                    "severity": "low"
                },
                {
                    "type": "api_unavailable",
                    "description": "Full AI analysis requires GEMINI_API_KEY configuration",
                    "severity": "medium"
                }
            ],
            "recommendations": [
                "Configure GEMINI_API_KEY for detailed analysis",
                "Review contract with a licensed real estate attorney",
                "Verify all property registration documents"
            ],
            "summary": f"Basic {contract_type} contract analysis. Enable Gemini API for comprehensive risk assessment.",
            "key_terms": ["standard terms"],
            "unusual_clauses": []
        }

    def _get_mock_action_plan(self, reality_score: int, cash_gap: int) -> Dict[str, Any]:
        """Return mock action plan when API is unavailable."""
        actions = []

        if cash_gap > 0:
            actions.append({
                "action": "Secure additional funding to cover cash gap",
                "priority": "high",
                "impact": f"Cover {cash_gap:,} KRW shortage"
            })

        if reality_score < 50:
            actions.append({
                "action": "Consider lower-priced properties",
                "priority": "high",
                "impact": "Improve financial feasibility"
            })

        actions.append({
            "action": "Review and reduce monthly expenses",
            "priority": "medium",
            "impact": "Improve DSR ratio"
        })

        return {
            "overall_assessment": "Basic assessment. Configure GEMINI_API_KEY for personalized advice.",
            "immediate_actions": actions,
            "improvement_strategies": [
                {
                    "strategy": "Increase down payment",
                    "description": "Save additional funds for down payment",
                    "potential_savings": "Reduced monthly payments"
                }
            ],
            "alternatives": [
                "Consider different regions with better LTV limits",
                "Explore first-time homebuyer programs"
            ],
            "timeline": "3-6 months recommended for preparation",
            "warnings": ["Enable Gemini API for personalized recommendations"]
        }


# Singleton instance
gemini_service = GeminiService()
