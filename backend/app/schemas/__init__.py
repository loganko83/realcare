"""Pydantic schemas."""
from app.schemas.user import (
    UserBase,
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    Token,
    TokenPayload,
)
from app.schemas.reality import (
    RealityCheckInput,
    RealityCheckResult,
    RealityReportCreate,
    RealityReportResponse,
    ScoreBreakdown,
    CompareRequest,
    CompareResult,
    CompareScenario,
)
from app.schemas.signal import (
    SignalCreate,
    SignalUpdate,
    SignalResponse,
    SignalListResponse,
    SignalFilterParams,
    InterestCreate,
    InterestResponse,
)
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
from app.schemas.file import (
    FileUploadResponse,
    ContractDocumentUploadResponse,
    FileListResponse,
    FileDeleteResponse,
    FileInfoResponse,
)

__all__ = [
    # User
    "UserBase",
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "Token",
    "TokenPayload",
    # Reality
    "RealityCheckInput",
    "RealityCheckResult",
    "RealityReportCreate",
    "RealityReportResponse",
    "ScoreBreakdown",
    "CompareRequest",
    "CompareResult",
    "CompareScenario",
    # Signal
    "SignalCreate",
    "SignalUpdate",
    "SignalResponse",
    "SignalListResponse",
    "SignalFilterParams",
    "InterestCreate",
    "InterestResponse",
    # Contract
    "ContractCreate",
    "ContractUpdate",
    "ContractResponse",
    "ContractDetailResponse",
    "ContractListResponse",
    "TimelineTaskResponse",
    "TimelineTaskUpdate",
    "ContractAnalysisRequest",
    "ContractAnalysisResult",
    # File
    "FileUploadResponse",
    "ContractDocumentUploadResponse",
    "FileListResponse",
    "FileDeleteResponse",
    "FileInfoResponse",
]
