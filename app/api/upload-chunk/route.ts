import { NextRequest, NextResponse } from 'next/server';
import {
  createMultipartUpload,
  uploadPart,
  completeMultipartUpload,
} from '@/lib/r2-upload';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface ChunkMetadata {
  fileName: string;
  chunkIndex: number;
  totalChunks: number;
  contentType: string;
  uploadId?: string;  // R2 multipart upload ID
  key?: string;       // R2 key
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chunkFile = formData.get('chunk') as File;
    const metadata = JSON.parse(formData.get('metadata') as string) as ChunkMetadata;

    if (!chunkFile) {
      return NextResponse.json(
        { error: 'No chunk provided' },
        { status: 400 }
      );
    }

    console.log(`Receiving chunk ${metadata.chunkIndex + 1}/${metadata.totalChunks} for ${metadata.fileName}`);

    const bytes = await chunkFile.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // First chunk: Create multipart upload
    if (metadata.chunkIndex === 0) {
      const session = await createMultipartUpload(metadata.fileName, metadata.contentType);

      if (!session) {
        return NextResponse.json(
          { error: 'Failed to create multipart upload' },
          { status: 500 }
        );
      }

      // Upload first part (partNumber starts at 1)
      const partResult = await uploadPart(session.key, session.uploadId, 1, buffer);

      if (!partResult) {
        return NextResponse.json(
          { error: 'Failed to upload first part' },
          { status: 500 }
        );
      }

      // If only one chunk, complete immediately
      if (metadata.totalChunks === 1) {
        const result = await completeMultipartUpload(session.key, session.uploadId, [partResult]);

        if (!result.success) {
          return NextResponse.json(
            { error: result.error || 'Failed to complete upload' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          complete: true,
          file: {
            url: result.url,
            key: result.key,
            originalName: metadata.fileName,
          },
        });
      }

      // More chunks to come - return session info
      return NextResponse.json({
        success: true,
        complete: false,
        uploadId: session.uploadId,
        key: session.key,
        parts: [partResult],
        received: 1,
        total: metadata.totalChunks,
      });
    }

    // Subsequent chunks: Upload part
    if (!metadata.uploadId || !metadata.key) {
      return NextResponse.json(
        { error: 'Missing uploadId or key for subsequent chunk' },
        { status: 400 }
      );
    }

    // Get existing parts from request
    const existingParts = JSON.parse(formData.get('parts') as string || '[]');

    // Upload this part (partNumber = chunkIndex + 1)
    const partResult = await uploadPart(
      metadata.key,
      metadata.uploadId,
      metadata.chunkIndex + 1,
      buffer
    );

    if (!partResult) {
      return NextResponse.json(
        { error: `Failed to upload part ${metadata.chunkIndex + 1}` },
        { status: 500 }
      );
    }

    const allParts = [...existingParts, partResult];

    // Check if this is the last chunk
    if (metadata.chunkIndex === metadata.totalChunks - 1) {
      console.log(`All ${metadata.totalChunks} chunks received, completing upload...`);

      const result = await completeMultipartUpload(metadata.key, metadata.uploadId, allParts);

      if (!result.success) {
        return NextResponse.json(
          { error: result.error || 'Failed to complete upload' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        complete: true,
        file: {
          url: result.url,
          key: result.key,
          originalName: metadata.fileName,
        },
      });
    }

    // More chunks to come
    return NextResponse.json({
      success: true,
      complete: false,
      uploadId: metadata.uploadId,
      key: metadata.key,
      parts: allParts,
      received: metadata.chunkIndex + 1,
      total: metadata.totalChunks,
    });

  } catch (error) {
    console.error('Upload chunk error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
