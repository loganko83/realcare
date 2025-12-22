"""File upload schemas."""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    """Response schema for file upload."""
    id: str
    filename: str
    original_filename: str
    storage_url: str
    content_type: str
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True


class ContractDocumentUploadResponse(FileUploadResponse):
    """Response schema for contract document upload."""
    contract_id: Optional[str] = None
    file_purpose: Optional[str] = None


class FileListResponse(BaseModel):
    """Response schema for file listing."""
    files: list[FileUploadResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class FileDeleteResponse(BaseModel):
    """Response schema for file deletion."""
    message: str
    deleted_file_id: str


class FileInfoResponse(BaseModel):
    """Response schema for file info."""
    id: str
    filename: str
    original_filename: str
    storage_url: str
    content_type: str
    file_size: int
    file_purpose: Optional[str] = None
    contract_id: Optional[str] = None
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
