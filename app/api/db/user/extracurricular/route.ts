import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const serializeExtracurricular = (item: any) => ({
  ...item,
  id: item.id.toString(),
  // Ensure JSON arrays are properly serialized
  achievements: Array.isArray(item.achievements) ? item.achievements : (item.achievements || []),
});

// GET /api/db/user/extracurricular?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const activities = await prisma.user_extracurricular.findMany({
      where: { user_id: userId },
      orderBy: [
        { is_ongoing: 'desc' },
        { start_date: 'desc' },
      ],
    });

    return NextResponse.json({ data: activities.map(serializeExtracurricular) });
  } catch (error) {
    console.error('Error fetching extracurricular activities:', error);
    return NextResponse.json({ error: 'Failed to fetch extracurricular activities' }, { status: 500 });
  }
}

// POST /api/db/user/extracurricular
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      activity_name,
      activity_type,
      role,
      organization,
      start_date,
      end_date,
      is_ongoing,
      hours_committed,
      description,
      impact_description,
      achievements,
    } = body;

    if (!activity_name) {
      return NextResponse.json({ error: 'activity_name is required' }, { status: 400 });
    }

    const activity = await prisma.user_extracurricular.create({
      data: {
        user_id: session.user.id,
        activity_name,
        activity_type,
        role,
        organization,
        start_date: start_date ? new Date(start_date) : null,
        end_date: is_ongoing ? null : (end_date ? new Date(end_date) : null),
        is_ongoing: is_ongoing || false,
        hours_committed,
        description,
        impact_description,
        achievements,
      },
    });

    return NextResponse.json({ data: serializeExtracurricular(activity) });
  } catch (error) {
    console.error('Error creating extracurricular activity:', error);
    return NextResponse.json({ error: 'Failed to create extracurricular activity' }, { status: 500 });
  }
}

// PUT /api/db/user/extracurricular
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      activity_name,
      activity_type,
      role,
      organization,
      start_date,
      end_date,
      is_ongoing,
      hours_committed,
      description,
      impact_description,
      achievements,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await prisma.user_extracurricular.findFirst({
      where: { id: BigInt(id), user_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Extracurricular activity not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = { updated_at: new Date() };
    if (activity_name !== undefined) updateData.activity_name = activity_name;
    if (activity_type !== undefined) updateData.activity_type = activity_type;
    if (role !== undefined) updateData.role = role;
    if (organization !== undefined) updateData.organization = organization;
    if (start_date !== undefined) updateData.start_date = start_date ? new Date(start_date) : null;
    if (end_date !== undefined) updateData.end_date = is_ongoing ? null : (end_date ? new Date(end_date) : null);
    if (is_ongoing !== undefined) updateData.is_ongoing = is_ongoing;
    if (hours_committed !== undefined) updateData.hours_committed = hours_committed;
    if (description !== undefined) updateData.description = description;
    if (impact_description !== undefined) updateData.impact_description = impact_description;
    if (achievements !== undefined) updateData.achievements = achievements;

    const activity = await prisma.user_extracurricular.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return NextResponse.json({ data: serializeExtracurricular(activity) });
  } catch (error) {
    console.error('Error updating extracurricular activity:', error);
    return NextResponse.json({ error: 'Failed to update extracurricular activity' }, { status: 500 });
  }
}

// DELETE /api/db/user/extracurricular?id=xxx
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

    await prisma.user_extracurricular.deleteMany({
      where: { id: BigInt(idParam), user_id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting extracurricular activity:', error);
    return NextResponse.json({ error: 'Failed to delete extracurricular activity' }, { status: 500 });
  }
}
