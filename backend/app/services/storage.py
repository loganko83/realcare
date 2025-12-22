"""
File Storage Service
S3-compatible storage with local fallback.
"""

import os
import uuid
import hashlib
import mimetypes
from typing import Optional, BinaryIO
from datetime import datetime, timedelta
from pathlib import Path
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class StorageService:
    """
    File storage service supporting S3 and local filesystem.
    """

    # Allowed file types and size limits (in bytes)
    ALLOWED_TYPES = {
        "image/jpeg": 5 * 1024 * 1024,    # 5MB
        "image/png": 5 * 1024 * 1024,      # 5MB
        "image/gif": 2 * 1024 * 1024,      # 2MB
        "image/webp": 5 * 1024 * 1024,     # 5MB
        "application/pdf": 10 * 1024 * 1024,  # 10MB
        "application/msword": 10 * 1024 * 1024,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": 10 * 1024 * 1024,
    }

    def __init__(self):
        self.use_s3 = bool(getattr(settings, 'AWS_ACCESS_KEY_ID', None))

        if self.use_s3:
            try:
                import boto3
                self.s3 = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=getattr(settings, 'AWS_REGION', 'ap-northeast-2')
                )
                self.bucket = getattr(settings, 'S3_BUCKET', 'realcare-uploads')
                logger.info("S3 storage initialized", bucket=self.bucket)
            except ImportError:
                logger.warning("boto3 not installed, using local storage")
                self.use_s3 = False

        if not self.use_s3:
            self.upload_dir = Path(getattr(settings, 'UPLOAD_DIR', '/tmp/realcare-uploads'))
            self.upload_dir.mkdir(parents=True, exist_ok=True)
            logger.info("Local storage initialized", path=str(self.upload_dir))

    def validate_file(self, content: bytes, content_type: str, filename: str) -> tuple[bool, str]:
        """
        Validate file for upload.

        Returns:
            (is_valid, error_message)
        """
        # Check content type
        if content_type not in self.ALLOWED_TYPES:
            return False, f"File type not allowed: {content_type}"

        # Check file size
        max_size = self.ALLOWED_TYPES[content_type]
        if len(content) > max_size:
            max_mb = max_size // (1024 * 1024)
            return False, f"File too large. Maximum size: {max_mb}MB"

        # Check for empty file
        if len(content) == 0:
            return False, "Empty file not allowed"

        return True, ""

    def _generate_key(self, filename: str, folder: str, user_id: Optional[str] = None) -> str:
        """Generate unique storage key for file."""
        ext = Path(filename).suffix.lower()
        file_hash = hashlib.sha256(f"{filename}{datetime.utcnow().isoformat()}".encode()).hexdigest()[:12]
        unique_id = uuid.uuid4().hex[:8]

        date_path = datetime.utcnow().strftime("%Y/%m/%d")

        if user_id:
            return f"{folder}/{user_id}/{date_path}/{file_hash}_{unique_id}{ext}"
        return f"{folder}/{date_path}/{file_hash}_{unique_id}{ext}"

    async def upload_file(
        self,
        content: bytes,
        filename: str,
        content_type: str,
        folder: str = "uploads",
        user_id: Optional[str] = None
    ) -> str:
        """
        Upload a file and return its URL.

        Args:
            content: File bytes
            filename: Original filename
            content_type: MIME type
            folder: Storage folder/prefix
            user_id: Optional user ID for organization

        Returns:
            Public URL or path to the file
        """
        # Validate
        is_valid, error = self.validate_file(content, content_type, filename)
        if not is_valid:
            raise ValueError(error)

        # Generate key
        key = self._generate_key(filename, folder, user_id)

        if self.use_s3:
            return await self._upload_to_s3(content, key, content_type)
        else:
            return await self._upload_local(content, key)

    async def _upload_to_s3(self, content: bytes, key: str, content_type: str) -> str:
        """Upload file to S3."""
        try:
            self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=content,
                ContentType=content_type,
                # Make publicly readable
                ACL='public-read'
            )

            url = f"https://{self.bucket}.s3.amazonaws.com/{key}"
            logger.info("File uploaded to S3", key=key)
            return url

        except Exception as e:
            logger.error("S3 upload failed", error=str(e), key=key)
            raise

    async def _upload_local(self, content: bytes, key: str) -> str:
        """Upload file to local filesystem."""
        file_path = self.upload_dir / key
        file_path.parent.mkdir(parents=True, exist_ok=True)

        with open(file_path, 'wb') as f:
            f.write(content)

        logger.info("File uploaded locally", path=str(file_path))
        return f"/uploads/{key}"

    async def delete_file(self, url_or_key: str) -> bool:
        """
        Delete a file.

        Args:
            url_or_key: File URL or storage key

        Returns:
            True if deleted successfully
        """
        if self.use_s3:
            # Extract key from URL
            if '.amazonaws.com/' in url_or_key:
                key = url_or_key.split('.amazonaws.com/')[-1]
            else:
                key = url_or_key

            try:
                self.s3.delete_object(Bucket=self.bucket, Key=key)
                logger.info("File deleted from S3", key=key)
                return True
            except Exception as e:
                logger.error("S3 delete failed", error=str(e))
                return False
        else:
            # Local storage
            if url_or_key.startswith('/uploads/'):
                key = url_or_key[9:]  # Remove '/uploads/'
            else:
                key = url_or_key

            file_path = self.upload_dir / key
            if file_path.exists():
                file_path.unlink()
                logger.info("File deleted locally", path=str(file_path))
                return True

            return False

    def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """
        Generate presigned URL for private file access.

        Args:
            key: Storage key
            expires_in: URL expiration in seconds

        Returns:
            Presigned URL
        """
        if not self.use_s3:
            return f"/uploads/{key}"

        try:
            url = self.s3.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expires_in
            )
            return url
        except Exception as e:
            logger.error("Presigned URL generation failed", error=str(e))
            raise

    async def get_file_info(self, key: str) -> Optional[dict]:
        """Get file metadata."""
        if self.use_s3:
            try:
                response = self.s3.head_object(Bucket=self.bucket, Key=key)
                return {
                    "size": response['ContentLength'],
                    "content_type": response['ContentType'],
                    "last_modified": response['LastModified'].isoformat(),
                    "key": key
                }
            except Exception:
                return None
        else:
            file_path = self.upload_dir / key
            if file_path.exists():
                stat = file_path.stat()
                content_type, _ = mimetypes.guess_type(str(file_path))
                return {
                    "size": stat.st_size,
                    "content_type": content_type,
                    "last_modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    "key": key
                }
            return None


# Global service instance
storage_service = StorageService()
