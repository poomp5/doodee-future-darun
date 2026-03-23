import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { auth } from '@/auth';

// GET /api/db/faculties - Get user's faculty access
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    // Validate user_id - must be a valid UUID, not "undefined"
    if (!userId || userId === 'undefined' || userId === 'null') {
      return NextResponse.json({ error: 'Valid user_id is required' }, { status: 400 });
    }

    // Get user's faculty access
    const facultyAccess = await prisma.user_faculty_access.findMany({
      where: { user_id: userId },
    });

    return NextResponse.json(facultyAccess);
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return NextResponse.json({ error: 'Failed to fetch faculties' }, { status: 500 });
  }
}

// POST /api/db/faculties - Add faculty to user's access list
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { faculty_id } = body;

    if (!faculty_id) {
      return NextResponse.json({ error: 'faculty_id is required' }, { status: 400 });
    }

    const result = await prisma.user_faculty_access.upsert({
      where: {
        user_id_faculty_id: {
          user_id: session.user.id,
          faculty_id: faculty_id,
        },
      },
      update: {},
      create: {
        user_id: session.user.id,
        faculty_id: faculty_id,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error adding faculty access:', error);
    return NextResponse.json({ error: 'Failed to add faculty access' }, { status: 500 });
  }
}

// DELETE /api/db/faculties?faculty_id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get('faculty_id');

    if (!facultyId) {
      return NextResponse.json({ error: 'faculty_id is required' }, { status: 400 });
    }

    await prisma.user_faculty_access.delete({
      where: {
        user_id_faculty_id: {
          user_id: session.user.id,
          faculty_id: facultyId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing faculty access:', error);
    return NextResponse.json({ error: 'Failed to remove faculty access' }, { status: 500 });
  }
}
