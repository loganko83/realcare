# File Upload API Documentation

## Overview

The File Upload API provides endpoints for uploading, managing, and deleting files in the RealCare application. It supports general file uploads (images, PDFs) and specialized contract document uploads with association to contracts.

## Base URL

```
/api/v1/files
```

## Authentication

All endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Upload File

Upload a general file (images or PDF).

**Endpoint:** `POST /upload`

**Content-Type:** `multipart/form-data`

**Request Parameters:**
- `file` (file, required): The file to upload

**Supported File Types:**
- Images: JPEG, PNG, GIF, WebP (max 5MB)
- PDF: application/pdf (max 10MB)
- Documents: DOC, DOCX (max 10MB)

**Response:** `201 Created`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "contract.pdf",
  "original_filename": "contract.pdf",
  "storage_url": "/uploads/2025/12/23/abc123_def456.pdf",
  "content_type": "application/pdf",
  "file_size": 1048576,
  "created_at": "2025-12-23T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid file type or size exceeds limit
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Upload failed

**Example (cURL):**

```bash
curl -X POST "http://localhost:8000/api/v1/files/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/file.pdf"
```

**Example (JavaScript/Fetch):**

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const response = await fetch('/api/v1/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: formData
});

const result = await response.json();
```

---

### 2. Upload Contract Document

Upload a contract document (PDF only) with optional contract association.

**Endpoint:** `POST /upload/contract-document`

**Content-Type:** `multipart/form-data`

**Request Parameters:**
- `file` (file, required): PDF file to upload
- `contract_id` (string, optional): ID of the contract to associate with
- `file_purpose` (string, optional): Purpose of the file (e.g., "contract_document", "addendum", "inspection_report")

**File Restrictions:**
- Type: PDF only
- Size: Maximum 10MB

**Response:** `201 Created`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "filename": "contract.pdf",
  "original_filename": "rental_contract_2025.pdf",
  "storage_url": "/uploads/contracts/2025/12/23/xyz789_abc123.pdf",
  "content_type": "application/pdf",
  "file_size": 2097152,
  "contract_id": "contract-uuid-here",
  "file_purpose": "contract_document",
  "created_at": "2025-12-23T10:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Not a PDF file or size exceeds 10MB
- `404 Not Found`: Contract not found or access denied
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Upload failed

**Example (cURL):**

```bash
curl -X POST "http://localhost:8000/api/v1/files/upload/contract-document" \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/contract.pdf" \
  -F "contract_id=123e4567-e89b-12d3-a456-426614174000" \
  -F "file_purpose=contract_document"
```

---

### 3. List Files

Retrieve a paginated list of uploaded files for the authenticated user.

**Endpoint:** `GET /list`

**Query Parameters:**
- `page` (integer, optional, default: 1): Page number (min: 1)
- `page_size` (integer, optional, default: 20): Items per page (min: 1, max: 100)
- `contract_id` (string, optional): Filter by contract ID
- `file_purpose` (string, optional): Filter by file purpose

**Response:** `200 OK`

```json
{
  "files": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "filename": "contract.pdf",
      "original_filename": "contract.pdf",
      "storage_url": "/uploads/2025/12/23/abc123.pdf",
      "content_type": "application/pdf",
      "file_size": 1048576,
      "created_at": "2025-12-23T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3
}
```

**Example (cURL):**

```bash
curl -X GET "http://localhost:8000/api/v1/files/list?page=1&page_size=20" \
  -H "Authorization: Bearer <token>"
```

**Example with filters:**

```bash
curl -X GET "http://localhost:8000/api/v1/files/list?contract_id=contract-uuid&file_purpose=contract_document" \
  -H "Authorization: Bearer <token>"
```

---

### 4. Get File Info

Retrieve detailed information about a specific file.

**Endpoint:** `GET /{file_id}`

**Path Parameters:**
- `file_id` (string, required): ID of the file

**Response:** `200 OK`

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "filename": "contract.pdf",
  "original_filename": "rental_contract.pdf",
  "storage_url": "/uploads/2025/12/23/abc123.pdf",
  "content_type": "application/pdf",
  "file_size": 1048576,
  "file_purpose": "contract_document",
  "contract_id": "contract-uuid-here",
  "user_id": "user-uuid-here",
  "created_at": "2025-12-23T10:00:00Z",
  "updated_at": "2025-12-23T10:00:00Z"
}
```

**Error Responses:**
- `404 Not Found`: File not found or access denied
- `401 Unauthorized`: Missing or invalid authentication token

**Example (cURL):**

```bash
curl -X GET "http://localhost:8000/api/v1/files/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <token>"
```

---

### 5. Delete File

Delete a file from storage and database.

**Endpoint:** `DELETE /{file_id}`

**Path Parameters:**
- `file_id` (string, required): ID of the file to delete

**Response:** `200 OK`

```json
{
  "message": "File deleted successfully",
  "deleted_file_id": "123e4567-e89b-12d3-a456-426614174000"
}
```

**Error Responses:**
- `404 Not Found`: File not found or access denied
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Deletion failed

**Example (cURL):**

```bash
curl -X DELETE "http://localhost:8000/api/v1/files/123e4567-e89b-12d3-a456-426614174000" \
  -H "Authorization: Bearer <token>"
```

---

## Storage Backend

The API supports two storage backends:

### 1. AWS S3 (Production)

When AWS credentials are configured, files are uploaded to S3 with public-read ACL.

**Configuration (environment variables):**
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-northeast-2
S3_BUCKET=realcare-uploads
```

**URL format:** `https://realcare-uploads.s3.amazonaws.com/uploads/2025/12/23/abc123.pdf`

### 2. Local Filesystem (Development)

When AWS credentials are not configured, files are stored locally.

**Configuration (environment variable):**
```
UPLOAD_DIR=/tmp/realcare-uploads
```

**URL format:** `/uploads/2025/12/23/abc123.pdf`

---

## File Organization

Files are organized by folder, user ID, and date:

```
{folder}/{user_id}/{YYYY/MM/DD}/{hash}_{unique_id}.{ext}
```

**Examples:**
- General uploads: `uploads/user-uuid/2025/12/23/abc123def456_xyz789.pdf`
- Contract documents: `contracts/user-uuid/2025/12/23/abc123def456_xyz789.pdf`

---

## Security Considerations

1. **Authentication Required**: All endpoints require valid authentication
2. **User Isolation**: Users can only access their own files
3. **File Type Validation**: Only allowed MIME types are accepted
4. **Size Limits**: Enforced at 5MB for images, 10MB for documents
5. **Unique Storage Keys**: SHA-256 hash + UUID prevents collisions
6. **Contract Ownership**: Contract document uploads verify contract ownership

---

## Database Schema

### Table: `uploaded_files`

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to users table |
| filename | VARCHAR(255) | Display filename |
| original_filename | VARCHAR(255) | Original upload filename |
| storage_key | VARCHAR(512) | Unique storage key |
| storage_url | TEXT | Full URL or path to file |
| content_type | VARCHAR(100) | MIME type |
| file_size | BIGINT | Size in bytes |
| contract_id | UUID | Optional foreign key to contracts |
| file_purpose | VARCHAR(50) | Optional purpose tag |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

**Indexes:**
- `ix_uploaded_files_user_id` on `user_id`
- `ix_uploaded_files_contract_id` on `contract_id`
- `ix_uploaded_files_file_purpose` on `file_purpose`
- `ix_uploaded_files_created_at` on `created_at`

**Constraints:**
- Unique constraint on `storage_key`
- Foreign key `user_id` → `users.id` (CASCADE delete)
- Foreign key `contract_id` → `contracts.id` (SET NULL delete)

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "detail": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Successful GET/DELETE request
- `201 Created`: Successful file upload
- `400 Bad Request`: Invalid input (file type, size, missing parameters)
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Resource not found or access denied
- `500 Internal Server Error`: Server-side error

---

## Migration

To apply the database migration:

```bash
cd backend
alembic upgrade head
```

The migration file is located at:
```
backend/alembic/versions/20251223_100000_add_uploaded_files_table.py
```

---

## Integration Example (React/TypeScript)

```typescript
import axios from 'axios';

// Upload file
export const uploadFile = async (file: File, accessToken: string) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await axios.post('/api/v1/files/upload', formData, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

// Upload contract document
export const uploadContractDocument = async (
  file: File,
  contractId: string,
  accessToken: string
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('contract_id', contractId);
  formData.append('file_purpose', 'contract_document');

  const response = await axios.post('/api/v1/files/upload/contract-document', formData, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'multipart/form-data'
    }
  });

  return response.data;
};

// List files
export const listFiles = async (
  page: number,
  pageSize: number,
  contractId?: string,
  accessToken: string
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    page_size: pageSize.toString()
  });

  if (contractId) {
    params.append('contract_id', contractId);
  }

  const response = await axios.get(`/api/v1/files/list?${params}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  return response.data;
};

// Delete file
export const deleteFile = async (fileId: string, accessToken: string) => {
  const response = await axios.delete(`/api/v1/files/${fileId}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  return response.data;
};
```

---

## Testing

### Manual Testing with cURL

1. **Get access token:**
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

2. **Upload a file:**
```bash
curl -X POST "http://localhost:8000/api/v1/files/upload" \
  -H "Authorization: Bearer <token>" \
  -F "file=@test.pdf"
```

3. **List files:**
```bash
curl -X GET "http://localhost:8000/api/v1/files/list" \
  -H "Authorization: Bearer <token>"
```

4. **Delete file:**
```bash
curl -X DELETE "http://localhost:8000/api/v1/files/<file_id>" \
  -H "Authorization: Bearer <token>"
```

### Automated Testing (pytest)

See `backend/tests/test_files.py` for comprehensive test coverage.

---

## Changelog

### Version 1.0.0 (2025-12-23)
- Initial implementation of file upload API
- Support for general file uploads (images, PDFs, documents)
- Specialized contract document upload endpoint
- File listing with pagination and filtering
- File deletion endpoint
- S3 and local filesystem storage support
- Database migration for uploaded_files table
