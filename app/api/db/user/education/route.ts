import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper to convert BigInt fields to string for JSON serialization
const serializeEducation = (education: any) => ({
  ...education,
  id: education.id.toString(),
  // Ensure JSON arrays are properly serialized
  honors_awards: Array.isArray(education.honors_awards) ? education.honors_awards : (education.honors_awards || []),
});

// GET /api/db/user/education?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const education = await prisma.user_education_history.findMany({
      where: { user_id: userId },
      orderBy: [
        { is_current: 'desc' },
        { end_year: 'desc' },
        { start_year: 'desc' },
      ],
    });

    return NextResponse.json({ data: education.map(serializeEducation) });
  } catch (error) {
    console.error('Error fetching education history:', error);
    return NextResponse.json({ error: 'Failed to fetch education history' }, { status: 500 });
  }
}

// POST /api/db/user/education - Create education entry
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      school_name,
      school_type,
      start_year,
      end_year,
      is_current,
      location,
      school_logo_url,
      major,
      honors_awards,
    } = body;

    if (!school_name) {
      return NextResponse.json({ error: 'school_name is required' }, { status: 400 });
    }

    const education = await prisma.user_education_history.create({
      data: {
        user_id: session.user.id,
        school_name,
        school_type,
        start_year,
        end_year: is_current ? null : end_year,
        is_current: is_current || false,
        location,
        school_logo_url,
        major,
        honors_awards,
      },
    });

    return NextResponse.json({ data: serializeEducation(education) });
  } catch (error) {
    console.error('Error creating education entry:', error);
    return NextResponse.json({ error: 'Failed to create education entry' }, { status: 500 });
  }
}

// PUT /api/db/user/education - Update education entry
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      school_name,
      school_type,
      start_year,
      end_year,
      is_current,
      location,
      school_logo_url,
      major,
      honors_awards,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.user_education_history.findFirst({
      where: { id: BigInt(id), user_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Education entry not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (school_name !== undefined) updateData.school_name = school_name;
    if (school_type !== undefined) updateData.school_type = school_type;
    if (start_year !== undefined) updateData.start_year = start_year;
    if (end_year !== undefined) updateData.end_year = is_current ? null : end_year;
    if (is_current !== undefined) updateData.is_current = is_current;
    if (location !== undefined) updateData.location = location;
    if (school_logo_url !== undefined) updateData.school_logo_url = school_logo_url;
    if (major !== undefined) updateData.major = major;
    if (honors_awards !== undefined) updateData.honors_awards = honors_awards;
    updateData.updated_at = new Date();

    const education = await prisma.user_education_history.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return NextResponse.json({ data: serializeEducation(education) });
  } catch (error) {
    console.error('Error updating education entry:', error);
    return NextResponse.json({ error: 'Failed to update education entry' }, { status: 500 });
  }
}

// DELETE /api/db/user/education?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.user_education_history.deleteMany({
      where: { id: BigInt(idParam), user_id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting education entry:', error);
    return NextResponse.json({ error: 'Failed to delete education entry' }, { status: 500 });
  }
}
