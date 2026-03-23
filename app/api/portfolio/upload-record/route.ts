import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * API endpoint to record portfolio file upload
 * Called when user uploads a portfolio file
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    console.log('Upload record - Session:', JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.log('Upload record - No user ID in session');
      return NextResponse.json(
        { error: 'Unauthorized', session_exists: !!session, user_exists: !!session?.user },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const {
      portfolio_name,
      template_type,
      file_url,
      file_key,
      file_size,
      file_type,
      thumbnail_url,
      metadata,
    } = body;

    // Validate input
    if (!portfolio_name || !file_url) {
      return NextResponse.json(
        { error: 'Missing required fields: portfolio_name, file_url' },
        { status: 400 }
      );
    }

    console.log('Inserting upload record for user:', session.user.id);
    console.log('Data:', { portfolio_name, template_type, file_url, file_key, file_size, file_type });

    // Insert into database
    const data = await prisma.portfolio_uploads.create({
      data: {
        user_id: session.user.id,
        portfolio_name,
        template_type: template_type || 'general',
        file_url,
        file_key: file_key || null,
        file_size: file_size ? parseInt(String(file_size)) : null,
        file_type: file_type || null,
        thumbnail_url: thumbnail_url || null,
        metadata: metadata ?? {},
        status: 'completed',
      },
    });

    console.log('Insert result:', data);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to fetch user's portfolio uploads
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch user's uploads
    const data = await prisma.portfolio_uploads.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to remove a portfolio upload and related analysis
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const fileUrl = searchParams.get('file_url');

    if (!id && !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required field: id or file_url' },
        { status: 400 }
      );
    }

    // Delete portfolio upload by id
    if (id) {
      // First get the upload to find file_url
      const upload = await prisma.portfolio_uploads.findFirst({
        where: { id, user_id: session.user.id },
      });

      if (upload?.file_url) {
        // Delete related analysis by file_url
        try {
          await prisma.portfolio_analysis.deleteMany({
            where: { user_id: session.user.id, file_url: upload.file_url },
          });
        } catch (e) {
          // Ignore if no analysis exists
        }
      }

      // Delete the upload
      await prisma.portfolio_uploads.deleteMany({
        where: { id, user_id: session.user.id },
      });
    }

    // Delete by file_url (for analysis page)
    if (fileUrl) {
      // Delete analysis
      try {
        await prisma.portfolio_analysis.deleteMany({
          where: { user_id: session.user.id, file_url: fileUrl },
        });
      } catch (e) {
        // Ignore if no analysis exists
      }

      // Delete upload with matching file_url
      try {
        await prisma.portfolio_uploads.deleteMany({
          where: { user_id: session.user.id, file_url: fileUrl },
        });
      } catch (e) {
        // Ignore if no upload exists
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
