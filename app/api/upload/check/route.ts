import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    env: {
      hasR2Bucket: !!process.env.R2_BUCKET_NAME,
      hasR2AccessKey: !!process.env.R2_ACCESS_KEY_ID,
      hasR2SecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
      hasR2Endpoint: !!process.env.R2_ENDPOINT,
      hasR2PublicUrl: !!process.env.R2_PUBLIC_URL,
      bucketName: process.env.R2_BUCKET_NAME || 'missing',
      endpoint: process.env.R2_ENDPOINT || 'missing',
      publicUrl: process.env.R2_PUBLIC_URL || 'missing',
    },
    nodeVersion: process.version,
  });
}
