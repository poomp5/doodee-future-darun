import { NextRequest, NextResponse } from 'next/server';
import { uploadToR2, uploadMultipleToR2 } from '@/lib/r2-upload';

// Route Segment Config for Next.js App Router
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds timeout
// Note: In App Router, body size is not configurable via route config.
// Next.js handles formData parsing automatically.

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    // Validate file sizes (10MB per file for normal upload - larger files should use chunked)
    // Files are compressed client-side before upload, so 10MB is reasonable
    const maxSize = 10 * 1024 * 1024; // 10MB
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit for normal upload. Please use chunked upload.` },
          { status: 413 }
        );
      }
    }

    const uploadPromises = files.map(async (file) => {
      try {
        console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);

        // Read file with better error handling
        let bytes: ArrayBuffer;
        try {
          bytes = await file.arrayBuffer();
        } catch (readError) {
          console.error(`Failed to read file ${file.name}:`, readError);
          throw new Error(`Cannot read file: ${file.name} - File may be corrupted`);
        }

        // Convert to Buffer
        const buffer = Buffer.from(bytes);

        // Validate buffer
        if (!buffer || buffer.length === 0) {
          throw new Error(`Empty file: ${file.name}`);
        }

        // Validate buffer matches file size
        if (Math.abs(buffer.length - file.size) > 100) {
          console.warn(`Buffer size mismatch: expected ${file.size}, got ${buffer.length}`);
        }

        // Set correct content type for PDFs
        let contentType = file.type;
        if (file.name.toLowerCase().endsWith('.pdf')) {
          if (!contentType || contentType === 'application/octet-stream') {
            contentType = 'application/pdf';
          }
        }

        // Validate PDF magic number if it's supposed to be a PDF
        if (contentType === 'application/pdf' && buffer.length > 4) {
          const pdfMagic = buffer.toString('utf8', 0, 4);
          if (pdfMagic !== '%PDF') {
            console.warn(`File ${file.name} claims to be PDF but doesn't start with %PDF`);
          }
        }

        console.log(`Successfully processed ${file.name}: ${buffer.length} bytes, type: ${contentType}`);

        return {
          buffer,
          fileName: file.name,
          contentType: contentType || 'application/octet-stream',
        };
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        throw new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    });

    console.log(`Processing ${uploadPromises.length} file(s)`);
    const fileData = await Promise.all(uploadPromises);
    console.log(`All files processed successfully`);

    if (fileData.length === 1) {
      console.log(`Uploading single file to R2: ${fileData[0].fileName}`);
      const result = await uploadToR2(
        fileData[0].buffer,
        fileData[0].fileName,
        fileData[0].contentType
      );

      if (!result.success) {
        console.error(`R2 upload failed:`, result.error);
        return NextResponse.json(
          { error: result.error || 'Upload to R2 failed' },
          { status: 500 }
        );
      }

      console.log(`Single file uploaded successfully: ${result.url}`);
      return NextResponse.json({
        success: true,
        file: {
          url: result.url,
          key: result.key,
          originalName: fileData[0].fileName,
        },
      });
    } else {
      console.log(`Uploading ${fileData.length} files to R2`);
      const results = await uploadMultipleToR2(fileData);

      const failedUploads = results.filter(result => !result.success);
      if (failedUploads.length > 0) {
        console.error(`${failedUploads.length} upload(s) failed:`, failedUploads);
        return NextResponse.json(
          {
            error: 'Some uploads failed',
            failedUploads: failedUploads.map(f => f.error),
          },
          { status: 500 }
        );
      }

      console.log(`All ${results.length} files uploaded successfully`);
      return NextResponse.json({
        success: true,
        files: results.map((result, index) => ({
          url: result.url,
          key: result.key,
          originalName: fileData[index].fileName,
        })),
      });
    }
  } catch (error) {
    console.error('Upload API Error:', error);

    // Provide more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  }
}