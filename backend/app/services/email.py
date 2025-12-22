"""
Email Service
Email notifications using SendGrid API.
"""

import httpx
from typing import Optional, Dict, Any
from datetime import datetime
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class EmailService:
    """Email sending service using SendGrid."""

    SENDGRID_URL = "https://api.sendgrid.com/v3/mail/send"

    def __init__(self):
        self.api_key = getattr(settings, 'SENDGRID_API_KEY', None)
        self.from_email = getattr(settings, 'FROM_EMAIL', 'noreply@realcare.kr')
        self.from_name = "RealCare"
        self.enabled = bool(self.api_key)

    async def send_email(
        self,
        to: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        template_data: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        Send an email via SendGrid.

        Args:
            to: Recipient email
            subject: Email subject
            html_content: HTML body
            text_content: Plain text body (optional)
            template_data: Dynamic template data (optional)

        Returns:
            True if sent successfully
        """
        if not self.enabled:
            logger.warning("Email service disabled - no API key", to=to, subject=subject)
            return False

        payload = {
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": self.from_email, "name": self.from_name},
            "subject": subject,
            "content": [{"type": "text/html", "value": html_content}]
        }

        if text_content:
            payload["content"].insert(0, {"type": "text/plain", "value": text_content})

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.SENDGRID_URL,
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    timeout=30.0
                )

                if response.status_code in (200, 202):
                    logger.info("Email sent", to=to, subject=subject)
                    return True
                else:
                    logger.error(
                        "Email failed",
                        status=response.status_code,
                        response=response.text
                    )
                    return False

        except Exception as e:
            logger.error("Email error", error=str(e), to=to)
            return False

    # Template Methods
    async def send_welcome_email(self, email: str, name: str) -> bool:
        """Send welcome email to new user."""
        html = self._render_template("welcome", {
            "name": name,
            "app_url": "https://trendy.storydot.kr/real"
        })
        return await self.send_email(
            to=email,
            subject="RealCare에 오신 것을 환영합니다!",
            html_content=html
        )

    async def send_password_reset_email(self, email: str, reset_token: str) -> bool:
        """Send password reset email."""
        reset_url = f"https://trendy.storydot.kr/real/reset-password?token={reset_token}"
        html = self._render_template("password_reset", {
            "reset_url": reset_url
        })
        return await self.send_email(
            to=email,
            subject="[RealCare] 비밀번호 재설정",
            html_content=html
        )

    async def send_payment_confirmation(
        self,
        email: str,
        amount: int,
        plan_name: str,
        next_billing_date: str
    ) -> bool:
        """Send payment confirmation email."""
        html = self._render_template("payment_confirmation", {
            "amount": f"{amount:,}",
            "plan_name": plan_name,
            "next_billing_date": next_billing_date
        })
        return await self.send_email(
            to=email,
            subject=f"[RealCare] 결제 완료 - {plan_name}",
            html_content=html
        )

    async def send_payment_failed_email(
        self,
        email: str,
        plan_name: str,
        reason: str
    ) -> bool:
        """Send payment failure notification."""
        html = self._render_template("payment_failed", {
            "plan_name": plan_name,
            "reason": reason,
            "retry_url": "https://trendy.storydot.kr/real/plans"
        })
        return await self.send_email(
            to=email,
            subject="[RealCare] 결제 실패 알림",
            html_content=html
        )

    async def send_contract_reminder(
        self,
        email: str,
        task_title: str,
        due_date: str,
        d_day: int
    ) -> bool:
        """Send contract task reminder."""
        urgency = "urgent" if d_day <= 3 else "normal"
        html = self._render_template("contract_reminder", {
            "task_title": task_title,
            "due_date": due_date,
            "d_day": d_day,
            "urgency": urgency,
            "timeline_url": "https://trendy.storydot.kr/real/timeline"
        })
        return await self.send_email(
            to=email,
            subject=f"[RealCare] D-{d_day}: {task_title}",
            html_content=html
        )

    async def send_agent_verification_result(
        self,
        email: str,
        company_name: str,
        approved: bool,
        rejection_reason: Optional[str] = None
    ) -> bool:
        """Send agent verification result notification."""
        if approved:
            html = self._render_template("agent_verified", {
                "company_name": company_name,
                "dashboard_url": "https://trendy.storydot.kr/real/agent/dashboard"
            })
            subject = "[RealCare] 에이전트 인증 완료"
        else:
            html = self._render_template("agent_rejected", {
                "company_name": company_name,
                "rejection_reason": rejection_reason or "서류 검토 중 문제가 발견되었습니다."
            })
            subject = "[RealCare] 에이전트 인증 반려"

        return await self.send_email(to=email, subject=subject, html_content=html)

    async def send_signal_match_notification(
        self,
        email: str,
        property_address: str,
        agent_count: int
    ) -> bool:
        """Notify owner that agents are interested in their signal."""
        html = self._render_template("signal_match", {
            "property_address": property_address,
            "agent_count": agent_count,
            "signals_url": "https://trendy.storydot.kr/real/signals"
        })
        return await self.send_email(
            to=email,
            subject=f"[RealCare] {agent_count}명의 에이전트가 관심을 보였습니다",
            html_content=html
        )

    def _render_template(self, template_name: str, data: Dict[str, Any]) -> str:
        """Render email template with data."""
        templates = {
            "welcome": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }}
        .button {{ display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>RealCare에 오신 것을 환영합니다!</h1>
        </div>
        <div class="content">
            <p>안녕하세요, {name}님!</p>
            <p>RealCare - 당신의 부동산 거래를 안전하게 도와드리는 서비스에 가입해 주셔서 감사합니다.</p>
            <p>RealCare에서 제공하는 서비스:</p>
            <ul>
                <li><strong>Reality Check</strong> - 매물 구매 가능성 분석</li>
                <li><strong>Contract Care</strong> - AI 계약서 위험 분석</li>
                <li><strong>Smart Move-in</strong> - 입주 일정 관리</li>
                <li><strong>Owner Signal</strong> - 익명 매도 의향 등록</li>
            </ul>
            <a href="{app_url}" class="button">시작하기</a>
        </div>
        <div class="footer">
            <p>&copy; 2024 RealCare. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
""",
            "password_reset": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; }}
        .button {{ display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
        .warning {{ background: #fef3c7; border: 1px solid #f59e0b; padding: 12px; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>비밀번호 재설정</h2>
        </div>
        <div class="content">
            <p>비밀번호 재설정을 요청하셨습니다.</p>
            <p>아래 버튼을 클릭하여 새 비밀번호를 설정하세요:</p>
            <a href="{reset_url}" class="button">비밀번호 재설정</a>
            <div class="warning">
                <p><strong>주의:</strong> 이 링크는 1시간 동안만 유효합니다.</p>
                <p>본인이 요청하지 않으셨다면 이 이메일을 무시하세요.</p>
            </div>
        </div>
    </div>
</body>
</html>
""",
            "payment_confirmation": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; }}
        .receipt {{ background: #f9fafb; padding: 20px; border-radius: 6px; margin: 20px 0; }}
        .receipt-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>결제 완료</h2>
        </div>
        <div class="content">
            <p>결제가 성공적으로 완료되었습니다.</p>
            <div class="receipt">
                <div class="receipt-row">
                    <span>플랜</span>
                    <strong>{plan_name}</strong>
                </div>
                <div class="receipt-row">
                    <span>결제 금액</span>
                    <strong>{amount}원</strong>
                </div>
                <div class="receipt-row">
                    <span>다음 결제일</span>
                    <span>{next_billing_date}</span>
                </div>
            </div>
            <p>RealCare를 이용해 주셔서 감사합니다.</p>
        </div>
    </div>
</body>
</html>
""",
            "payment_failed": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; }}
        .button {{ display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>결제 실패</h2>
        </div>
        <div class="content">
            <p>{plan_name} 구독 결제가 실패했습니다.</p>
            <p><strong>실패 사유:</strong> {reason}</p>
            <p>결제 수단을 확인하시고 다시 시도해 주세요.</p>
            <a href="{retry_url}" class="button">다시 결제하기</a>
        </div>
    </div>
</body>
</html>
""",
            "contract_reminder": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: {header_bg}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; }}
        .d-day {{ font-size: 48px; font-weight: bold; color: {d_day_color}; text-align: center; }}
        .button {{ display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>계약 일정 알림</h2>
        </div>
        <div class="content">
            <div class="d-day">D-{d_day}</div>
            <h3 style="text-align: center;">{task_title}</h3>
            <p style="text-align: center;">기한: {due_date}</p>
            <div style="text-align: center;">
                <a href="{timeline_url}" class="button">타임라인 확인하기</a>
            </div>
        </div>
    </div>
</body>
</html>
""".replace("{header_bg}", "#ef4444" if "{urgency}" == "urgent" else "#2563eb")
   .replace("{d_day_color}", "#ef4444" if "{urgency}" == "urgent" else "#2563eb"),

            "agent_verified": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; }}
        .button {{ display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>에이전트 인증 완료</h2>
        </div>
        <div class="content">
            <p><strong>{company_name}</strong> 에이전트 인증이 승인되었습니다!</p>
            <p>이제 RealCare 에이전트 대시보드를 이용하실 수 있습니다:</p>
            <ul>
                <li>Owner Signal 조회 및 응답</li>
                <li>매물 등록 및 관리</li>
                <li>고객 문의 관리</li>
            </ul>
            <a href="{dashboard_url}" class="button">대시보드 바로가기</a>
        </div>
    </div>
</body>
</html>
""",
            "agent_rejected": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>에이전트 인증 반려</h2>
        </div>
        <div class="content">
            <p><strong>{company_name}</strong> 에이전트 인증 신청이 반려되었습니다.</p>
            <p><strong>사유:</strong> {rejection_reason}</p>
            <p>서류를 다시 확인하시고 재신청해 주세요.</p>
            <p>문의사항이 있으시면 고객센터로 연락 주세요.</p>
        </div>
    </div>
</body>
</html>
""",
            "signal_match": """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Apple SD Gothic Neo', sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #8b5cf6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background: #fff; padding: 30px; border: 1px solid #e5e7eb; }}
        .count {{ font-size: 48px; font-weight: bold; color: #8b5cf6; text-align: center; }}
        .button {{ display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>매물에 관심있는 에이전트</h2>
        </div>
        <div class="content">
            <div class="count">{agent_count}명</div>
            <p style="text-align: center;">
                <strong>{property_address}</strong> 매물에<br>
                {agent_count}명의 에이전트가 관심을 보였습니다.
            </p>
            <div style="text-align: center;">
                <a href="{signals_url}" class="button">자세히 보기</a>
            </div>
        </div>
    </div>
</body>
</html>
"""
        }

        template = templates.get(template_name, "")
        return template.format(**data)


# Global service instance
email_service = EmailService()
