"""File upload model for tracking uploaded files."""
from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDMixin


class UploadedFile(Base, UUIDMixin, TimestampMixin):
    """Model for tracking uploaded files."""

    __tablename__ = "uploaded_files"

    user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    # File information
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    storage_url: Mapped[str] = mapped_column(Text, nullable=False)

    # File metadata
    content_type: Mapped[str] = mapped_column(String(100), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)

    # Optional associations
    contract_id: Mapped[Optional[str]] = mapped_column(
        ForeignKey("contracts.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # File purpose/type
    file_purpose: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="uploaded_files")
    contract: Mapped[Optional["Contract"]] = relationship("Contract", back_populates="documents")

    def __repr__(self) -> str:
        return f"<UploadedFile(id={self.id}, filename={self.filename}, user_id={self.user_id})>"
