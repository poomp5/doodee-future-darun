import {
  S3Client,
  PutObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const R2_KEY_PREFIX = 'doodee-future-darun';

// Explicit type to satisfy getSignedUrl generic
const s3Client: S3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}

export async function uploadToR2(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<UploadResult> {
  try {
    // Validate environment variables
    if (!process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
      throw new Error('R2 configuration missing');
    }

    const fileExtension = fileName.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = `${R2_KEY_PREFIX}/${uniqueFileName}`;

    console.log(`Uploading ${fileName} (${file.length} bytes) to R2 as ${key}`);

    // Note: R2 doesn't support ACL parameter, objects are public by default via custom domain
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: contentType,
    });

    const uploadResult = await s3Client.send(command);
    console.log('R2 upload successful:', uploadResult);

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    return {
      success: true,
      url: publicUrl,
      key: key,
    };
  } catch (error) {
    console.error('R2 Upload Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    console.error('Error details:', errorMessage);

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function uploadMultipleToR2(
  files: Array<{ buffer: Buffer; fileName: string; contentType: string }>
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file =>
    uploadToR2(file.buffer, file.fileName, file.contentType)
  );

  return Promise.all(uploadPromises);
}

// Multipart upload for large files (> 25MB)
export interface MultipartUploadSession {
  uploadId: string;
  key: string;
  parts: { ETag: string; PartNumber: number }[];
}

export async function createMultipartUpload(
  fileName: string,
  contentType: string
): Promise<{ uploadId: string; key: string } | null> {
  try {
    const fileExtension = fileName.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = `${R2_KEY_PREFIX}/${uniqueFileName}`;

    const command = new CreateMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const result = await s3Client.send(command);
    console.log(`Multipart upload created: ${result.UploadId}`);

    return {
      uploadId: result.UploadId!,
      key,
    };
  } catch (error) {
    console.error('Create multipart upload error:', error);
    return null;
  }
}

export async function uploadPart(
  key: string,
  uploadId: string,
  partNumber: number,
  body: Buffer
): Promise<{ ETag: string; PartNumber: number } | null> {
  try {
    const command = new UploadPartCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
      Body: body,
    });

    const result = await s3Client.send(command);
    console.log(`Part ${partNumber} uploaded, ETag: ${result.ETag}`);

    return {
      ETag: result.ETag!,
      PartNumber: partNumber,
    };
  } catch (error) {
    console.error(`Upload part ${partNumber} error:`, error);
    return null;
  }
}

export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
): Promise<UploadResult> {
  try {
    const command = new CompleteMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    });

    await s3Client.send(command);
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    console.log(`Multipart upload completed: ${publicUrl}`);

    return {
      success: true,
      url: publicUrl,
      key,
    };
  } catch (error) {
    console.error('Complete multipart upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Complete upload failed',
    };
  }
}

export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  try {
    const command = new AbortMultipartUploadCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
    });

    await s3Client.send(command);
    console.log(`Multipart upload aborted: ${uploadId}`);
  } catch (error) {
    console.error('Abort multipart upload error:', error);
  }
}

// Generate presigned URL for direct client-side upload to R2
// This bypasses Vercel's body size limit completely
export interface PresignedUrlResult {
  success: boolean;
  uploadUrl?: string;
  publicUrl?: string;
  key?: string;
  error?: string;
}

export async function generatePresignedUploadUrl(
  fileName: string,
  contentType: string,
  fileSize: number
): Promise<PresignedUrlResult> {
  try {
    if (!process.env.R2_BUCKET_NAME || !process.env.R2_PUBLIC_URL) {
      throw new Error('R2 configuration missing');
    }

    const fileExtension = fileName.split('.').pop() || '';
    const uniqueFileName = `${uuidv4()}.${fileExtension}`;
    const key = `${R2_KEY_PREFIX}/${uniqueFileName}`;

    console.log(`Generating presigned URL for ${fileName} (${fileSize} bytes) -> ${key}`);

    // Note: Do NOT include ContentLength in presigned URL - it causes issues
    // when file size changes (e.g., after client-side compression)
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    // Generate presigned URL valid for 10 minutes
    // Cast because @aws-sdk versions of client-s3 and presigner may mismatch in TS declarations,
    // but runtime is compatible.
    const uploadUrl = await getSignedUrl(s3Client as any, command as any, { expiresIn: 600 });
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    console.log(`Presigned URL generated for ${key}`);

    return {
      success: true,
      uploadUrl,
      publicUrl,
      key,
    };
  } catch (error) {
    console.error('Generate presigned URL error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate upload URL',
    };
  }
}
