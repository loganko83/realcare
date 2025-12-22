/**
 * File Upload Component
 * Drag & drop file upload with preview
 */

import { useState, useRef, useCallback } from 'react';
import { Upload, X, File as FileIcon, Image, Loader2 } from 'lucide-react';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // MB
  onUpload: (url: string, filename: string) => void;
  onError?: (error: string) => void;
  folder?: string;
  className?: string;
}

export function FileUpload({
  accept = '.pdf,.jpg,.jpeg,.png,.webp',
  maxSize = 10,
  onUpload,
  onError,
  folder = 'uploads',
  className = '',
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<{ url: string; filename: string; type: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    // Check size
    if (file.size > maxSize * 1024 * 1024) {
      return `파일 크기가 너무 큽니다. 최대: ${maxSize}MB`;
    }

    // Check type
    const allowedTypes = accept.split(',').map(t => t.trim().toLowerCase());
    const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const mimeType = file.type.toLowerCase();

    const isAllowed = allowedTypes.some(allowed => {
      if (allowed.startsWith('.')) {
        return fileExt === allowed;
      }
      return mimeType.includes(allowed.replace('*', ''));
    });

    if (!isAllowed) {
      return `허용되지 않는 파일 형식입니다: ${fileExt}`;
    }

    return null;
  }, [accept, maxSize]);

  const handleFile = useCallback(async (file: File) => {
    const error = validateFile(file);
    if (error) {
      onError?.(error);
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const token = localStorage.getItem('realcare_access_token');
      const response = await fetch('/real/api/v1/files/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Upload failed');
      }

      const data = await response.json();
      setProgress(100);

      // Set preview
      const isImage = file.type.startsWith('image/');
      setPreview({
        url: data.url,
        filename: data.filename || file.name,
        type: isImage ? 'image' : 'file',
      });

      onUpload(data.url, data.filename || file.name);
    } catch (err) {
      onError?.(err instanceof Error ? err.message : '업로드에 실패했습니다');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [folder, onUpload, onError, validateFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, []);

  const handleClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className={className}>
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center
          transition-all duration-200 cursor-pointer
          ${isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${uploading ? 'pointer-events-none opacity-70' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!uploading && !preview ? handleClick : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="hidden"
          onChange={handleInputChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="py-4">
            <Loader2 className="w-10 h-10 text-blue-500 mx-auto animate-spin" />
            <p className="mt-3 text-sm text-gray-600">업로드 중...</p>
            <div className="mt-2 w-full max-w-xs mx-auto bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : preview ? (
          <div className="py-4">
            <div className="flex items-center justify-center gap-3">
              {preview.type === 'image' ? (
                <div className="relative">
                  <img
                    src={preview.url}
                    alt={preview.filename}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                </div>
              ) : (
                <FileIcon className="w-12 h-12 text-blue-500" />
              )}
            </div>
            <p className="mt-2 text-sm font-medium text-gray-700 truncate max-w-[200px] mx-auto">
              {preview.filename}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="mt-2 inline-flex items-center gap-1 text-sm text-red-500 hover:text-red-600"
            >
              <X className="w-4 h-4" />
              삭제
            </button>
          </div>
        ) : (
          <div className="py-4">
            <div className="w-14 h-14 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Upload className="w-7 h-7 text-gray-400" />
            </div>
            <p className="mt-3 text-sm text-gray-600">
              파일을 끌어다 놓거나 클릭하여 업로드
            </p>
            <p className="mt-1 text-xs text-gray-400">
              최대 {maxSize}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default FileUpload;
