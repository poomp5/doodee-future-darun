'use client';

import { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { PDFDocument } from 'pdf-lib';
import { useTranslations } from 'next-intl';
// PDF thumbnail generation using server-side API
async function generatePdfThumbnail(file: File): Promise<Blob | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/pdf-thumbnail', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error('Failed to generate PDF thumbnail');
      return null;
    }

    return await response.blob();
  } catch (error) {
    console.error('Error generating PDF thumbnail:', error);
    return null;
  }
}

interface UploadedFile {
  url: string;
  key: string;
  originalName: string;
  file: File; // Add original file object
}

interface FileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  multiple?: boolean;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in MB
  collapsible?: boolean; // Enable collapse/expand
  defaultExpanded?: boolean; // Default state for collapsible
  title?: string; // Title for the section
  saveToDatabase?: boolean; // Save upload record to database
  templateType?: string; // Template type for database record
}

export default function FileUpload({
  onUploadComplete,
  multiple = false,
  acceptedFileTypes = "*",
  maxFileSize = 10,
  collapsible = false,
  defaultExpanded = true,
  title,
  saveToDatabase = false,
  templateType = "general"
}: FileUploadProps) {
  const t = useTranslations('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const validateAndAddFiles = (newFiles: File[]) => {
    // Validate file size
    const oversizedFiles = newFiles.filter(file => file.size > maxFileSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(t('sizeExceeded', { maxSize: maxFileSize }));
      setError(`Some files exceed the ${maxFileSize}MB limit`);
      return;
    }

    // Validate empty files
    const emptyFiles = newFiles.filter(file => file.size === 0);
    if (emptyFiles.length > 0) {
      toast.error(t('emptyFiles'));
      setError(`Cannot upload empty files: ${emptyFiles.map(f => f.name).join(', ')}`);
      return;
    }

    // Check file types
    const invalidFiles = newFiles.filter(file => {
      const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      return !isPdf && !isImage;
    });

    if (invalidFiles.length > 0) {
      toast.error(t('unsupportedFormat'));
      setError(`Invalid file type: ${invalidFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setFiles((prev) => {
      const currentFiles = multiple ? prev : [];
      const dedupedFiles = multiple
        ? newFiles.filter((incoming) => {
            return !currentFiles.some(
              (existing) =>
                existing.name === incoming.name &&
                existing.size === incoming.size &&
                existing.lastModified === incoming.lastModified,
            );
          })
        : newFiles;

      console.log('Files validated:', dedupedFiles.map(f => `${f.name} (${f.size} bytes, ${f.type})`));
      return multiple ? [...currentFiles, ...dedupedFiles] : dedupedFiles;
    });
    setError('');
    setUploadStatus('idle');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    validateAndAddFiles(selectedFiles);
    // Allow selecting the same file again in the next attempt.
    e.target.value = '';
  };

  // Drag and Drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    validateAndAddFiles(droppedFiles);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Compress PDF to reduce file size
  const compressPDF = async (file: File): Promise<File> => {
    try {
      console.log(`Compressing PDF: ${file.name} (${file.size} bytes)`);

      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        updateMetadata: false
      });

      // Save with compression
      const compressedPdfBytes = await pdfDoc.save({
        useObjectStreams: false,
        addDefaultPage: false,
      });

      const compressedFile = new File(
        [compressedPdfBytes as BlobPart],
        file.name,
        { type: 'application/pdf' }
      );

      const compressionRatio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
      console.log(`PDF compressed: ${file.size} → ${compressedFile.size} bytes (${compressionRatio}% reduction)`);

      // Only use compressed version if it's actually smaller
      if (compressedFile.size < file.size) {
        toast.success(t('pdfCompressed', { filename: file.name, ratio: compressionRatio }));
        return compressedFile;
      }

      return file;
    } catch (error) {
      console.error('PDF compression error:', error);
      return file;
    }
  };

  // Compress image to reduce file size (for faster uploads)
  const compressImage = async (file: File, maxSizeMB: number = 2): Promise<File> => {
    if (!file.type.startsWith('image/') || file.type === 'image/gif') {
      return file;
    }

    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size <= maxSize) {
      return file;
    }

    console.log(`Compressing image: ${file.name} (${file.size} bytes)`);

    return new Promise((resolve) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        // Calculate new dimensions (max 2000px on longest side)
        let { width, height } = img;
        const maxDimension = 2000;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension;
            width = maxDimension;
          } else {
            width = (width / height) * maxDimension;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);

        // Start with quality 0.8, reduce if still too large
        let quality = 0.8;
        const tryCompress = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                resolve(file);
                return;
              }

              if (blob.size > maxSize && quality > 0.3) {
                quality -= 0.1;
                tryCompress();
                return;
              }

              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
              });

              const ratio = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
              console.log(`Image compressed: ${file.size} → ${compressedFile.size} bytes (${ratio}% reduction)`);

              resolve(compressedFile);
            },
            'image/jpeg',
            quality
          );
        };

        tryCompress();
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  // Direct upload to R2 using presigned URL
  // This bypasses Vercel's body size limit completely
  const uploadWithPresignedUrl = async (file: File): Promise<{ url: string; key: string; originalName: string }> => {
    console.log(`Getting presigned URL for ${file.name} (${file.size} bytes)`);

    // Step 1: Get presigned URL from our API
    const urlResponse = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        fileSize: file.size,
      }),
    });

    if (!urlResponse.ok) {
      const error = await urlResponse.json();
      throw new Error(error.error || 'Failed to get upload URL');
    }

    const { uploadUrl, publicUrl, key } = await urlResponse.json();
    console.log(`Got presigned URL, uploading directly to R2...`);

    // Step 2: Upload file directly to R2 using presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
    });

    if (!uploadResponse.ok) {
      console.error('R2 upload failed:', uploadResponse.status, uploadResponse.statusText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    console.log(`File uploaded successfully to R2: ${publicUrl}`);

    return {
      url: publicUrl,
      key: key,
      originalName: file.name,
    };
  };

  const uploadFiles = async (retryCount = 0) => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');
    setUploadProgress(0);

    try {
      console.log(`Starting upload (attempt ${retryCount + 1})...`);
      console.log('Files to upload:', files.map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })));

      const uploadedFiles: any[] = [];

      // Process and upload files one by one using presigned URL (direct to R2)
      // This bypasses Vercel's body size limit completely
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        const originalFile = file; // Keep reference for database record
        console.log(`Processing file ${i + 1}/${files.length}: ${file.name} (${file.size} bytes)`);

        // Compress large files client-side for faster uploads
        // Images: compress if > 5MB
        if (file.type.startsWith('image/') && file.size > 5 * 1024 * 1024) {
          console.log(`Compressing image ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
          file = await compressImage(file, 5);
          console.log(`After compression: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }

        // PDFs: compress if > 10MB
        if (file.type === 'application/pdf' && file.size > 10 * 1024 * 1024) {
          console.log(`Compressing PDF ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)...`);
          file = await compressPDF(file);
          console.log(`After compression: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
        }

        // Upload directly to R2 using presigned URL (bypasses Vercel limit)
        console.log(`Uploading ${file.name} directly to R2...`);
        const result = await uploadWithPresignedUrl(file);
        uploadedFiles.push({ ...result, file: originalFile });

        // Update progress per file
        const progress = Math.round(((i + 1) / files.length) * 100);
        setUploadProgress(progress);
      }

      // Save to database if enabled
      if (saveToDatabase) {
        console.log('Saving upload records to database, count:', uploadedFiles.length);
        for (const uploadedFile of uploadedFiles) {
          try {
            // Generate thumbnail for PDF files
            let thumbnailUrl = null;
            const isPdf = uploadedFile.file?.type === 'application/pdf' ||
                         uploadedFile.file?.name?.toLowerCase().endsWith('.pdf');

            if (isPdf && uploadedFile.file) {
              try {
                console.log('Generating PDF thumbnail...');
                const thumbnailBlob = await generatePdfThumbnail(uploadedFile.file);
                if (thumbnailBlob) {
                  // Upload thumbnail to R2
                  const thumbnailFormData = new FormData();
                  const thumbnailFile = new File(
                    [thumbnailBlob],
                    `thumb_${uploadedFile.file.name.replace('.pdf', '.svg')}`,
                    { type: 'image/svg+xml' }
                  );
                  thumbnailFormData.append('files', thumbnailFile);

                  const thumbResponse = await fetch('/api/upload', {
                    method: 'POST',
                    body: thumbnailFormData,
                  });

                  if (thumbResponse.ok) {
                    const thumbResult = await thumbResponse.json();
                    thumbnailUrl = thumbResult.files?.[0]?.url || thumbResult.file?.url;
                    console.log('Thumbnail uploaded:', thumbnailUrl);
                  }
                }
              } catch (thumbError) {
                console.error('Failed to generate/upload thumbnail:', thumbError);
              }
            } else if (uploadedFile.file?.type?.startsWith('image/')) {
              // For images, use the file itself as thumbnail
              thumbnailUrl = uploadedFile.url;
            }

            const recordData = {
              portfolio_name: uploadedFile.originalName || uploadedFile.file?.name || 'Untitled',
              template_type: templateType,
              file_url: uploadedFile.url,
              file_key: uploadedFile.key,
              file_size: uploadedFile.file?.size || null,
              file_type: uploadedFile.file?.type || null,
              thumbnail_url: thumbnailUrl,
            };
            console.log('Saving record:', recordData);

            const response = await fetch('/api/portfolio/upload-record', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(recordData),
            });

            const result = await response.json();
            if (response.ok) {
              console.log('Upload record saved:', result);
            } else {
              console.error('Failed to save upload record - API error:', result);
            }
          } catch (dbError) {
            console.error('Failed to save upload record - Network error:', dbError);
          }
        }
      }

      // Common success handling for both chunked and normal uploads
      setUploadedFiles(uploadedFiles);
      setUploadStatus('success');
      setFiles([]);

      if (onUploadComplete) {
        onUploadComplete(uploadedFiles);
      }

      console.log('Upload completed successfully');
      toast.success(t('uploadSuccess', { count: files.length }));
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      // Retry logic for transient errors (max 2 retries)
      if (retryCount < 2 && (
        errorMessage.includes('Server error') ||
        errorMessage.includes('500') ||
        errorMessage.includes('Network')
      )) {
        console.log(`Retrying upload... (attempt ${retryCount + 2})`);
        setUploading(false);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        return uploadFiles(retryCount + 1);
      }

      // Show detailed error
      setError(errorMessage);
      setUploadStatus('error');
      setUploadProgress(0);

      // More user-friendly error messages
      let friendlyMessage = errorMessage;
      if (errorMessage.includes('exceeds')) {
        friendlyMessage = t('fileTooLarge');
      } else if (errorMessage.includes('Content-Type')) {
        friendlyMessage = t('invalidFormat');
      } else if (errorMessage.includes('Server error')) {
        friendlyMessage = t('serverError');
      }

      toast.error(t('uploadFailed', { error: friendlyMessage }));
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFiles([]);
    setUploadedFiles([]);
    setUploadStatus('idle');
    setError('');
    setUploadProgress(0);
  };

  return (
    <div className="w-full">
      <div className="space-y-4">
        {/* Upload Area with Drag & Drop */}
        <div
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={`bg-white border-2 border-dashed rounded-lg p-6 text-center transition-all ${
            isDragging
              ? "border-pink-500 bg-pink-50 scale-105"
              : "border-gray-300 hover:border-pink-400"
          }`}
        >
          <input
            type="file"
            multiple={multiple}
            accept={acceptedFileTypes}
            onChange={handleFileSelect}
            onClick={(event) => {
              event.currentTarget.value = '';
            }}
            className="hidden"
            id="file-upload"
            disabled={uploading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <Upload
              className={`w-8 h-8 ${
                isDragging ? "text-pink-500" : "text-gray-400"
              }`}
            />
            <span className="text-sm text-gray-600">
              {isDragging
                ? t('dropFilesHere')
                : t('selectOrDrag', { type: multiple ? t('multiple') : t('single') })}
            </span>
            <span className="text-xs text-gray-400">
              {t('maxSize', { size: maxFileSize })}
            </span>
          </label>
        </div>

        {/* Selected Files */}
        {files.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">
              {t('selectedFiles')}
            </h3>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="text-sm text-gray-600 truncate">
                  {file.name}
                </span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700"
                  disabled={uploading}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Upload Button */}
        {files.length > 0 && (
          <div className="space-y-2">
            <button
              onClick={() => uploadFiles()}
              disabled={uploading}
              className="w-full py-2 px-4 bg-pink-600 text-white rounded hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>{t('uploading')}</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>{t('uploadFiles', { count: files.length })}</span>
                </>
              )}
            </button>

            {/* Progress Bar */}
            {uploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-pink-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            {uploading && (
              <p className="text-center text-sm text-gray-600">
                {t('processing', { percent: uploadProgress })}
              </p>
            )}
          </div>
        )}

        {/* Upload Status */}
        {uploadStatus === "success" && (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded">
            <CheckCircle className="w-5 h-5" />
            <span className="text-sm">{t('uploadSuccessful')}</span>
          </div>
        )}

        {uploadStatus === "error" && (
          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700">
                {t('uploadedFiles')}
              </h3>
              <button
                onClick={resetUpload}
                className="text-xs text-pink-600 hover:text-pink-800"
              >
                {t('uploadMore')}
              </button>
            </div>
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-green-50 rounded"
              >
                <span className="text-sm text-gray-600 truncate">
                  {file.originalName}
                </span>
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-800 text-xs"
                >
                  {t('viewFile')}
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
