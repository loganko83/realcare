# Phase 11: Operations & Management Features

> Spec-Kit Methodology v2.0
> Priority: MEDIUM
> Dependencies: Phase 8-10 Complete
> Estimated Tasks: 28

---

## Overview

This phase adds operational features for platform management: admin dashboard, notifications (email/push), file uploads, and analytics. Focus on tools needed to operate the platform at scale.

---

## P11-01: Admin Dashboard

### P11-01-A: Admin Authentication

**File**: `backend/app/api/v1/endpoints/admin.py`

```python
"""
Admin endpoints with role-based access control.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.user import User, UserRole
from app.services.auth import AuthService

router = APIRouter()


async def require_admin(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Dependency that requires admin role."""
    auth_service = AuthService(db)
    user = await auth_service.get_current_user(token)

    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


@router.get("/stats")
async def get_admin_stats(
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db)
):
    """Get platform statistics."""
    # User stats
    user_count = await db.scalar(select(func.count(User.id)))
    agent_count = await db.scalar(
        select(func.count(User.id)).where(User.role == UserRole.AGENT)
    )

    # Payment stats
    from app.models.payment import Payment, PaymentStatus
    total_revenue = await db.scalar(
        select(func.sum(Payment.amount))
        .where(Payment.status == PaymentStatus.COMPLETED)
    )

    # Signal stats
    from app.models.owner_signal import OwnerSignal
    active_signals = await db.scalar(
        select(func.count(OwnerSignal.id))
        .where(OwnerSignal.status == 'active')
    )

    return {
        "users": {
            "total": user_count,
            "agents": agent_count,
            "regular": user_count - agent_count
        },
        "payments": {
            "total_revenue": total_revenue or 0,
            "currency": "KRW"
        },
        "signals": {
            "active": active_signals
        }
    }
```

**Tasks**:
- [ ] P11-01-A-1: Create admin dependency
- [ ] P11-01-A-2: Implement stats endpoint
- [ ] P11-01-A-3: Add user management endpoints
- [ ] P11-01-A-4: Add agent verification endpoints

---

### P11-01-B: Admin Dashboard Frontend

**Route**: `/admin`
**File**: `src/routes/admin/index.tsx`

```typescript
// Admin dashboard structure
// - Overview stats cards
// - Recent activity timeline
// - Quick actions panel
// - Charts for key metrics
```

**Components**:
```
src/components/admin/
├── StatsCards.tsx         # Key metrics cards
├── UserManagement.tsx     # User list with actions
├── AgentVerification.tsx  # Pending agent approvals
├── PaymentDashboard.tsx   # Revenue charts
├── SignalMonitor.tsx      # Active signals overview
└── ActivityTimeline.tsx   # Recent platform activity
```

**Tasks**:
- [ ] P11-01-B-1: Create admin layout with sidebar
- [ ] P11-01-B-2: Implement stats overview cards
- [ ] P11-01-B-3: Create user management table
- [ ] P11-01-B-4: Add agent verification queue
- [ ] P11-01-B-5: Create revenue charts

---

### P11-01-C: User Management

**Endpoints**:
```yaml
GET  /api/v1/admin/users          # List all users
GET  /api/v1/admin/users/{id}     # Get user details
PUT  /api/v1/admin/users/{id}     # Update user
POST /api/v1/admin/users/{id}/ban # Ban user
DELETE /api/v1/admin/users/{id}   # Delete user
```

**Tasks**:
- [ ] P11-01-C-1: Implement user listing with pagination
- [ ] P11-01-C-2: Add user detail view
- [ ] P11-01-C-3: Implement user ban functionality
- [ ] P11-01-C-4: Add user search and filters

---

### P11-01-D: Agent Verification

**Endpoints**:
```yaml
GET  /api/v1/admin/agents/pending           # Pending verifications
POST /api/v1/admin/agents/{id}/verify       # Approve agent
POST /api/v1/admin/agents/{id}/reject       # Reject agent
GET  /api/v1/admin/agents/{id}/documents    # View uploaded docs
```

**Tasks**:
- [ ] P11-01-D-1: Create pending agents list
- [ ] P11-01-D-2: Implement verification workflow
- [ ] P11-01-D-3: Add document viewer
- [ ] P11-01-D-4: Create rejection with reason

---

## P11-02: Email Notifications

### P11-02-A: Email Service Setup

**File**: `backend/app/services/email.py`

```python
"""
Email notification service using SendGrid or AWS SES.
"""

import httpx
from typing import List, Optional
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class EmailService:
    """Email sending service."""

    def __init__(self):
        self.api_key = settings.SENDGRID_API_KEY
        self.from_email = settings.FROM_EMAIL
        self.from_name = "RealCare"

    async def send_email(
        self,
        to: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Send an email."""
        payload = {
            "personalizations": [{"to": [{"email": to}]}],
            "from": {"email": self.from_email, "name": self.from_name},
            "subject": subject,
            "content": [
                {"type": "text/html", "value": html_content}
            ]
        }

        if text_content:
            payload["content"].insert(0, {
                "type": "text/plain",
                "value": text_content
            })

        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    "https://api.sendgrid.com/v3/mail/send",
                    json=payload,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    }
                )

                if response.status_code in (200, 202):
                    logger.info("Email sent", to=to, subject=subject)
                    return True
                else:
                    logger.error("Email failed", status=response.status_code)
                    return False

        except Exception as e:
            logger.error("Email error", error=str(e))
            return False

    # Template methods
    async def send_welcome_email(self, user_email: str, user_name: str) -> bool:
        """Send welcome email to new user."""
        html = f"""
        <h1>Welcome to RealCare, {user_name}!</h1>
        <p>Thank you for joining RealCare - your trusted partner for
        Korean real estate transactions.</p>
        <p>Get started by:</p>
        <ul>
            <li>Running a Reality Check on your dream property</li>
            <li>Analyzing your contract for risks</li>
            <li>Setting up your move-in timeline</li>
        </ul>
        <a href="https://trendy.storydot.kr/real">Go to RealCare</a>
        """
        return await self.send_email(
            to=user_email,
            subject="Welcome to RealCare!",
            html_content=html
        )

    async def send_payment_confirmation(
        self,
        user_email: str,
        amount: int,
        plan: str,
        next_billing: str
    ) -> bool:
        """Send payment confirmation email."""
        html = f"""
        <h1>Payment Confirmed</h1>
        <p>Thank you for your subscription to RealCare {plan}!</p>
        <table>
            <tr><td>Amount:</td><td>{amount:,} KRW</td></tr>
            <tr><td>Plan:</td><td>{plan}</td></tr>
            <tr><td>Next billing:</td><td>{next_billing}</td></tr>
        </table>
        """
        return await self.send_email(
            to=user_email,
            subject="RealCare Payment Confirmation",
            html_content=html
        )

    async def send_contract_reminder(
        self,
        user_email: str,
        task_title: str,
        due_date: str,
        d_day: int
    ) -> bool:
        """Send contract task reminder."""
        urgency = "urgent" if d_day <= 3 else "reminder"
        html = f"""
        <h1>Contract Reminder: {task_title}</h1>
        <p>You have an upcoming task for your contract.</p>
        <p><strong>Due: {due_date} (D-{d_day})</strong></p>
        <a href="https://trendy.storydot.kr/real/timeline">View Timeline</a>
        """
        return await self.send_email(
            to=user_email,
            subject=f"[RealCare] Task Due: {task_title}",
            html_content=html
        )


email_service = EmailService()
```

**Tasks**:
- [ ] P11-02-A-1: Setup email service
- [ ] P11-02-A-2: Create email templates
- [ ] P11-02-A-3: Add welcome email trigger
- [ ] P11-02-A-4: Add payment confirmation email

---

### P11-02-B: Email Templates

**Directory**: `backend/app/templates/email/`

```
templates/email/
├── base.html              # Base template with branding
├── welcome.html           # Welcome email
├── payment_confirmed.html # Payment confirmation
├── payment_failed.html    # Payment failure
├── contract_reminder.html # Contract task reminder
├── signal_match.html      # Owner signal matched
├── agent_verified.html    # Agent verification approved
└── password_reset.html    # Password reset
```

**Tasks**:
- [ ] P11-02-B-1: Create base email template
- [ ] P11-02-B-2: Create transactional templates
- [ ] P11-02-B-3: Create reminder templates
- [ ] P11-02-B-4: Add Korean/English versions

---

### P11-02-C: Email Triggers

**File**: `backend/app/services/notifications.py`

```python
"""
Notification orchestration service.
Triggers emails and push notifications based on events.
"""

from typing import Optional
from datetime import datetime, timedelta
import structlog

from app.services.email import email_service
from app.services.push import push_service

logger = structlog.get_logger()


class NotificationService:
    """Centralized notification service."""

    # User lifecycle
    async def on_user_registered(
        self,
        user_id: str,
        email: str,
        name: str
    ):
        """Trigger welcome notifications."""
        await email_service.send_welcome_email(email, name)

    # Payment events
    async def on_payment_completed(
        self,
        user_id: str,
        email: str,
        amount: int,
        plan: str,
        next_billing: datetime
    ):
        """Trigger payment confirmation notifications."""
        await email_service.send_payment_confirmation(
            email, amount, plan, next_billing.strftime("%Y-%m-%d")
        )

    async def on_payment_failed(
        self,
        user_id: str,
        email: str,
        reason: str
    ):
        """Trigger payment failure notifications."""
        # Send email with retry instructions
        pass

    # Contract events
    async def on_contract_task_due(
        self,
        user_id: str,
        email: str,
        task_title: str,
        due_date: datetime,
        d_day: int
    ):
        """Trigger task reminder notifications."""
        await email_service.send_contract_reminder(
            email, task_title, due_date.strftime("%Y-%m-%d"), d_day
        )

        # Also send push if enabled
        await push_service.send_task_reminder(user_id, task_title, d_day)

    # Agent events
    async def on_agent_verified(
        self,
        agent_id: str,
        email: str,
        company_name: str
    ):
        """Notify agent of verification approval."""
        pass

    # Signal events
    async def on_signal_matched(
        self,
        owner_id: str,
        agent_id: str,
        signal_id: str
    ):
        """Notify owner of new agent interest."""
        pass


notification_service = NotificationService()
```

**Tasks**:
- [ ] P11-02-C-1: Create notification orchestrator
- [ ] P11-02-C-2: Add event triggers
- [ ] P11-02-C-3: Integrate with user actions
- [ ] P11-02-C-4: Add notification preferences

---

## P11-03: Push Notifications

### P11-03-A: Web Push Setup

**File**: `backend/app/services/push.py`

```python
"""
Web Push notification service using Firebase Cloud Messaging.
"""

import httpx
from typing import Optional, Dict, Any
import structlog

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class PushService:
    """Firebase Cloud Messaging service."""

    FCM_URL = "https://fcm.googleapis.com/v1/projects/{project}/messages:send"

    def __init__(self):
        self.project_id = settings.FIREBASE_PROJECT_ID
        self.service_account = settings.FIREBASE_SERVICE_ACCOUNT

    async def send_notification(
        self,
        user_id: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        link: Optional[str] = None
    ) -> bool:
        """Send push notification to user."""
        # Get user's FCM token from database
        fcm_token = await self._get_user_token(user_id)
        if not fcm_token:
            return False

        message = {
            "message": {
                "token": fcm_token,
                "notification": {
                    "title": title,
                    "body": body
                },
                "webpush": {
                    "fcm_options": {
                        "link": link or "https://trendy.storydot.kr/real"
                    }
                }
            }
        }

        if data:
            message["message"]["data"] = data

        try:
            access_token = await self._get_access_token()
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.FCM_URL.format(project=self.project_id),
                    json=message,
                    headers={
                        "Authorization": f"Bearer {access_token}",
                        "Content-Type": "application/json"
                    }
                )

                if response.status_code == 200:
                    logger.info("Push sent", user_id=user_id, title=title)
                    return True

                logger.error("Push failed", status=response.status_code)
                return False

        except Exception as e:
            logger.error("Push error", error=str(e))
            return False

    async def send_task_reminder(
        self,
        user_id: str,
        task_title: str,
        d_day: int
    ) -> bool:
        """Send contract task reminder."""
        return await self.send_notification(
            user_id=user_id,
            title=f"D-{d_day}: {task_title}",
            body="You have an upcoming task for your contract",
            link="https://trendy.storydot.kr/real/timeline"
        )

    async def _get_user_token(self, user_id: str) -> Optional[str]:
        """Get FCM token for user from database."""
        # Implementation: query user's FCM token
        pass

    async def _get_access_token(self) -> str:
        """Get OAuth access token for FCM."""
        # Implementation: use service account to get token
        pass


push_service = PushService()
```

**Tasks**:
- [ ] P11-03-A-1: Setup Firebase project
- [ ] P11-03-A-2: Implement FCM service
- [ ] P11-03-A-3: Add token storage
- [ ] P11-03-A-4: Create notification handlers

---

### P11-03-B: Frontend Push Integration

**File**: `src/lib/push/pushManager.ts`

```typescript
/**
 * Web Push notification manager
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('Notifications not supported');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });

    // Send subscription to backend
    await fetch('/real/api/v1/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('realcare_access_token')}`,
      },
      body: JSON.stringify(subscription),
    });

    return subscription;
  } catch (error) {
    console.error('Push subscription failed:', error);
    return null;
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

**Tasks**:
- [ ] P11-03-B-1: Setup service worker
- [ ] P11-03-B-2: Implement push subscription
- [ ] P11-03-B-3: Create notification prompt UI
- [ ] P11-03-B-4: Add notification settings

---

## P11-04: File Upload

### P11-04-A: File Upload Service

**File**: `backend/app/services/storage.py`

```python
"""
File storage service using AWS S3 or local storage.
"""

import os
import uuid
import hashlib
from typing import Optional
from datetime import datetime
import structlog
import boto3
from botocore.exceptions import ClientError

from app.core.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class StorageService:
    """File storage service."""

    def __init__(self):
        self.use_s3 = bool(settings.AWS_ACCESS_KEY_ID)

        if self.use_s3:
            self.s3 = boto3.client(
                's3',
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_REGION
            )
            self.bucket = settings.S3_BUCKET
        else:
            self.upload_dir = settings.UPLOAD_DIR or "/tmp/uploads"
            os.makedirs(self.upload_dir, exist_ok=True)

    async def upload_file(
        self,
        file_content: bytes,
        filename: str,
        content_type: str,
        folder: str = "uploads"
    ) -> str:
        """
        Upload a file and return its URL.

        Args:
            file_content: File bytes
            filename: Original filename
            content_type: MIME type
            folder: Storage folder

        Returns:
            File URL or path
        """
        # Generate unique filename
        ext = os.path.splitext(filename)[1]
        file_hash = hashlib.sha256(file_content).hexdigest()[:12]
        unique_name = f"{folder}/{datetime.now():%Y%m%d}/{file_hash}{ext}"

        if self.use_s3:
            return await self._upload_to_s3(
                file_content, unique_name, content_type
            )
        else:
            return await self._upload_local(file_content, unique_name)

    async def _upload_to_s3(
        self,
        content: bytes,
        key: str,
        content_type: str
    ) -> str:
        """Upload to S3."""
        try:
            self.s3.put_object(
                Bucket=self.bucket,
                Key=key,
                Body=content,
                ContentType=content_type
            )
            return f"https://{self.bucket}.s3.amazonaws.com/{key}"
        except ClientError as e:
            logger.error("S3 upload failed", error=str(e))
            raise

    async def _upload_local(self, content: bytes, path: str) -> str:
        """Upload to local filesystem."""
        full_path = os.path.join(self.upload_dir, path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        with open(full_path, 'wb') as f:
            f.write(content)

        return f"/uploads/{path}"

    async def delete_file(self, url: str) -> bool:
        """Delete a file."""
        if self.use_s3:
            key = url.split('.amazonaws.com/')[-1]
            try:
                self.s3.delete_object(Bucket=self.bucket, Key=key)
                return True
            except ClientError:
                return False
        else:
            path = os.path.join(self.upload_dir, url.replace('/uploads/', ''))
            if os.path.exists(path):
                os.remove(path)
                return True
            return False

    def get_presigned_url(self, key: str, expires_in: int = 3600) -> str:
        """Get presigned URL for private file access."""
        if not self.use_s3:
            return f"/uploads/{key}"

        return self.s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': self.bucket, 'Key': key},
            ExpiresIn=expires_in
        )


storage_service = StorageService()
```

**Tasks**:
- [ ] P11-04-A-1: Implement S3 upload
- [ ] P11-04-A-2: Add local storage fallback
- [ ] P11-04-A-3: Implement file deletion
- [ ] P11-04-A-4: Add presigned URLs

---

### P11-04-B: Upload Endpoints

**File**: `backend/app/api/v1/endpoints/files.py`

```python
"""
File upload endpoints.
"""

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.services.storage import storage_service
from app.api.v1.endpoints.auth import get_current_user

router = APIRouter()

# Allowed file types
ALLOWED_TYPES = {
    'image/jpeg': 5 * 1024 * 1024,  # 5MB
    'image/png': 5 * 1024 * 1024,
    'application/pdf': 10 * 1024 * 1024,  # 10MB
}


@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "general",
    user=Depends(get_current_user)
):
    """Upload a file."""
    # Validate content type
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed: {file.content_type}"
        )

    # Read file
    content = await file.read()

    # Validate size
    max_size = ALLOWED_TYPES[file.content_type]
    if len(content) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Max: {max_size // 1024 // 1024}MB"
        )

    # Upload
    url = await storage_service.upload_file(
        file_content=content,
        filename=file.filename,
        content_type=file.content_type,
        folder=f"{folder}/{user.id}"
    )

    return {"url": url, "filename": file.filename}


@router.post("/upload/contract-document")
async def upload_contract_document(
    file: UploadFile = File(...),
    contract_id: str = None,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a contract document (PDF)."""
    if file.content_type != 'application/pdf':
        raise HTTPException(status_code=400, detail="PDF files only")

    content = await file.read()

    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    url = await storage_service.upload_file(
        file_content=content,
        filename=file.filename,
        content_type=file.content_type,
        folder=f"contracts/{user.id}"
    )

    # If contract_id provided, link to contract
    if contract_id:
        # Update contract with document URL
        pass

    return {"url": url, "filename": file.filename}
```

**Tasks**:
- [ ] P11-04-B-1: Create upload endpoint
- [ ] P11-04-B-2: Add file validation
- [ ] P11-04-B-3: Create contract document upload
- [ ] P11-04-B-4: Add file listing endpoint

---

### P11-04-C: Frontend Upload Component

**File**: `src/components/common/FileUpload.tsx`

```typescript
/**
 * File upload component with drag & drop
 */

import { useState, useRef } from 'react';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // MB
  onUpload: (url: string, filename: string) => void;
  onError?: (error: string) => void;
}

export function FileUpload({
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10,
  onUpload,
  onError,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    // Validate size
    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`File too large. Max: ${maxSize}MB`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/real/api/v1/files/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('realcare_access_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      onUpload(data.url, data.filename);
      setPreview(data.url);
    } catch (error) {
      onError?.('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-6 text-center ${
        isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
      }`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {uploading ? (
        <div className="animate-pulse">Uploading...</div>
      ) : preview ? (
        <div className="flex items-center justify-center gap-2">
          <FileIcon className="w-5 h-5 text-green-500" />
          <span>File uploaded</span>
          <button onClick={() => setPreview(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center gap-2"
        >
          <Upload className="w-8 h-8 text-gray-400" />
          <span>Drop file here or click to upload</span>
          <span className="text-xs text-gray-400">Max: {maxSize}MB</span>
        </button>
      )}
    </div>
  );
}
```

**Tasks**:
- [ ] P11-04-C-1: Create FileUpload component
- [ ] P11-04-C-2: Add drag & drop support
- [ ] P11-04-C-3: Add progress indicator
- [ ] P11-04-C-4: Add file preview

---

## P11-05: Analytics & Monitoring

### P11-05-A: Event Tracking

**File**: `backend/app/services/analytics.py`

```python
"""
Analytics and event tracking service.
"""

from typing import Dict, Any, Optional
from datetime import datetime
import structlog

logger = structlog.get_logger()


class AnalyticsService:
    """Analytics event tracking."""

    async def track_event(
        self,
        event_name: str,
        user_id: Optional[str] = None,
        properties: Optional[Dict[str, Any]] = None
    ):
        """Track an analytics event."""
        event = {
            "event": event_name,
            "user_id": user_id,
            "properties": properties or {},
            "timestamp": datetime.utcnow().isoformat()
        }

        # Log for now, can integrate with analytics platform
        logger.info("analytics_event", **event)

    # Pre-defined events
    async def track_reality_check(
        self,
        user_id: str,
        region: str,
        score: int,
        target_price: int
    ):
        await self.track_event(
            "reality_check_completed",
            user_id,
            {
                "region": region,
                "score": score,
                "target_price": target_price
            }
        )

    async def track_contract_created(
        self,
        user_id: str,
        contract_type: str,
        price: int
    ):
        await self.track_event(
            "contract_created",
            user_id,
            {"contract_type": contract_type, "price": price}
        )

    async def track_subscription(
        self,
        user_id: str,
        plan: str,
        action: str  # started, upgraded, cancelled
    ):
        await self.track_event(
            f"subscription_{action}",
            user_id,
            {"plan": plan}
        )


analytics_service = AnalyticsService()
```

**Tasks**:
- [ ] P11-05-A-1: Create analytics service
- [ ] P11-05-A-2: Add event tracking
- [ ] P11-05-A-3: Integrate with key actions
- [ ] P11-05-A-4: Add analytics dashboard

---

## Definition of Done

- [ ] Admin can manage users and agents
- [ ] Emails sent for key events
- [ ] Push notifications working
- [ ] File upload functioning
- [ ] Analytics events tracked
- [ ] All features tested

---

## Implementation Order

1. **Sprint 11.1**: Admin Dashboard
2. **Sprint 11.2**: Email Notifications
3. **Sprint 11.3**: Push Notifications
4. **Sprint 11.4**: File Upload
5. **Sprint 11.5**: Analytics
