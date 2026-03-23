import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// POST /api/profile/upload?type=avatar|banner
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type');
    if (type !== 'avatar' && type !== 'banner') {
      return NextResponse.json({ error: 'type must be avatar or banner' }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size: avatar 5MB, banner 10MB
    const maxSize = type === 'banner' ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max ${type === 'banner' ? '10MB' : '5MB'}` },
        { status: 400 }
      );
    }

    const ext = file.name.split('.').pop() || 'jpg';
    const key = `profiles/${session.user.id}/${type}-${uuidv4()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME!,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

    // Update DB
    const updateField = type === 'avatar' ? 'profile_image_url' : 'banner_image_url';
    await prisma.users.update({
      where: { id: session.user.id },
      data: { [updateField]: publicUrl, updated_at: new Date() },
    });

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error('Profile upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
