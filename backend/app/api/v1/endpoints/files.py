"""
File Upload Endpoints
Handles file uploads, deletions, and listing for user files and contract documents.
"""

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import structlog

from app.core.database import get_db
from app.api.v1.endpoints.auth import get_current_user
from app.models.file import UploadedFile
from app.models.contract import Contract
from app.schemas.user import UserResponse
from app.schemas.file import (
    FileUploadResponse,
    ContractDocumentUploadResponse,
    FileListResponse,
    FileDeleteResponse,
    FileInfoResponse
)
from app.services.storage import storage_service

logger = structlog.get_logger()
router = APIRouter()


@router.post("/upload", response_model=FileUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a file.

    Accepts image files (JPEG, PNG, GIF, WebP) up to 5MB and PDF files up to 10MB.
    Returns the uploaded file's URL and metadata.
    """
    try:
        # Read file content
        content = await file.read()

        # Determine content type
        content_type = file.content_type or "application/octet-stream"

        # Validate and upload to storage
        try:
            storage_url = await storage_service.upload_file(
                content=content,
                filename=file.filename or "unnamed",
                content_type=content_type,
                folder="uploads",
                user_id=current_user.id
            )
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

        # Extract storage key from URL
        if storage_url.startswith('/uploads/'):
            storage_key = storage_url[9:]  # Remove '/uploads/' prefix
        elif '.amazonaws.com/' in storage_url:
            storage_key = storage_url.split('.amazonaws.com/')[-1]
        else:
            storage_key = storage_url

        # Save file record to database
        uploaded_file = UploadedFile(
            user_id=current_user.id,
            filename=file.filename or "unnamed",
            original_filename=file.filename or "unnamed",
            storage_key=storage_key,
            storage_url=storage_url,
            content_type=content_type,
            file_size=len(content)
        )

        db.add(uploaded_file)
        await db.commit()
        await db.refresh(uploaded_file)

        logger.info(
            "File uploaded successfully",
            user_id=current_user.id,
            file_id=uploaded_file.id,
            filename=file.filename,
            size=len(content)
        )

        return FileUploadResponse.model_validate(uploaded_file)

    except Exception as e:
        logger.error("File upload failed", error=str(e), user_id=current_user.id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File upload failed: {str(e)}"
        )


@router.post(
    "/upload/contract-document",
    response_model=ContractDocumentUploadResponse,
    status_code=status.HTTP_201_CREATED
)
async def upload_contract_document(
    file: UploadFile = File(...),
    contract_id: Optional[str] = Form(None),
    file_purpose: Optional[str] = Form(None),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Upload a contract document (PDF only).

    Maximum file size: 10MB.
    Optionally associate the document with a contract by providing contract_id.
    """
    # Validate PDF content type
    if file.content_type not in ["application/pdf"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are allowed for contract documents"
        )

    # Read file content
    content = await file.read()

    # Validate file size (10MB limit for PDFs)
    max_size = 10 * 1024 * 1024  # 10MB
    if len(content) > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds 10MB limit"
        )

    # If contract_id provided, verify contract exists and belongs to user
    if contract_id:
        result = await db.execute(
            select(Contract).where(
                Contract.id == contract_id,
                Contract.user_id == current_user.id
            )
        )
        contract = result.scalar_one_or_none()

        if not contract:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contract not found or access denied"
            )

    try:
        # Upload to storage
        storage_url = await storage_service.upload_file(
            content=content,
            filename=file.filename or "contract.pdf",
            content_type="application/pdf",
            folder="contracts",
            user_id=current_user.id
        )

        # Extract storage key
        if storage_url.startswith('/uploads/'):
            storage_key = storage_url[9:]
        elif '.amazonaws.com/' in storage_url:
            storage_key = storage_url.split('.amazonaws.com/')[-1]
        else:
            storage_key = storage_url

        # Save file record
        uploaded_file = UploadedFile(
            user_id=current_user.id,
            filename=file.filename or "contract.pdf",
            original_filename=file.filename or "contract.pdf",
            storage_key=storage_key,
            storage_url=storage_url,
            content_type="application/pdf",
            file_size=len(content),
            contract_id=contract_id,
            file_purpose=file_purpose or "contract_document"
        )

        db.add(uploaded_file)
        await db.commit()
        await db.refresh(uploaded_file)

        logger.info(
            "Contract document uploaded",
            user_id=current_user.id,
            file_id=uploaded_file.id,
            contract_id=contract_id
        )

        return ContractDocumentUploadResponse.model_validate(uploaded_file)

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Contract document upload failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(e)}"
        )


@router.delete("/{file_id}", response_model=FileDeleteResponse)
async def delete_file(
    file_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a file.

    Deletes the file from storage and removes the database record.
    Only the file owner can delete their files.
    """
    # Find file in database
    result = await db.execute(
        select(UploadedFile).where(
            UploadedFile.id == file_id,
            UploadedFile.user_id == current_user.id
        )
    )
    uploaded_file = result.scalar_one_or_none()

    if not uploaded_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or access denied"
        )

    try:
        # Delete from storage
        deleted = await storage_service.delete_file(uploaded_file.storage_url)

        if not deleted:
            logger.warning(
                "Storage deletion failed but continuing",
                file_id=file_id,
                storage_url=uploaded_file.storage_url
            )

        # Delete from database
        await db.delete(uploaded_file)
        await db.commit()

        logger.info(
            "File deleted successfully",
            user_id=current_user.id,
            file_id=file_id
        )

        return FileDeleteResponse(
            message="File deleted successfully",
            deleted_file_id=file_id
        )

    except Exception as e:
        logger.error("File deletion failed", error=str(e), file_id=file_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"File deletion failed: {str(e)}"
        )


@router.get("/list", response_model=FileListResponse)
async def list_files(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    contract_id: Optional[str] = Query(None, description="Filter by contract ID"),
    file_purpose: Optional[str] = Query(None, description="Filter by file purpose"),
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List user's uploaded files.

    Supports pagination and filtering by contract_id or file_purpose.
    Returns files in descending order by creation date.
    """
    # Build query
    query = select(UploadedFile).where(UploadedFile.user_id == current_user.id)

    # Apply filters
    if contract_id:
        query = query.where(UploadedFile.contract_id == contract_id)

    if file_purpose:
        query = query.where(UploadedFile.file_purpose == file_purpose)

    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply pagination and ordering
    query = query.order_by(UploadedFile.created_at.desc())
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute query
    result = await db.execute(query)
    files = result.scalars().all()

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size if total > 0 else 0

    logger.info(
        "Files listed",
        user_id=current_user.id,
        total=total,
        page=page,
        page_size=page_size
    )

    return FileListResponse(
        files=[FileUploadResponse.model_validate(f) for f in files],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/{file_id}", response_model=FileInfoResponse)
async def get_file_info(
    file_id: str,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get detailed information about a file.

    Returns complete file metadata including associations.
    Only the file owner can access file information.
    """
    result = await db.execute(
        select(UploadedFile).where(
            UploadedFile.id == file_id,
            UploadedFile.user_id == current_user.id
        )
    )
    uploaded_file = result.scalar_one_or_none()

    if not uploaded_file:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or access denied"
        )

    return FileInfoResponse.model_validate(uploaded_file)
