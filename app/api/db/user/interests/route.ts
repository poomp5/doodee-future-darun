import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const serializeInterest = (interest: any) => ({
  ...interest,
  id: interest.id.toString(),
});

// GET /api/db/user/interests?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const interests = await prisma.user_interests.findMany({
      where: { user_id: userId },
      orderBy: [
        { intensity_level: 'desc' },
        { created_at: 'desc' },
      ],
    });

    return NextResponse.json({ data: interests.map(serializeInterest) });
  } catch (error) {
    console.error('Error fetching interests:', error);
    return NextResponse.json({ error: 'Failed to fetch interests' }, { status: 500 });
  }
}

// POST /api/db/user/interests
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { interest_category, interest_name, intensity_level, since_when, description } = body;

    if (!interest_name) {
      return NextResponse.json({ error: 'interest_name is required' }, { status: 400 });
    }

    const interest = await prisma.user_interests.create({
      data: {
        user_id: session.user.id,
        interest_category: interest_category || 'general',
        interest_name,
        intensity_level: intensity_level || 5,
        since_when,
        description,
      },
    });

    return NextResponse.json({ data: serializeInterest(interest) });
  } catch (error) {
    console.error('Error creating interest:', error);
    return NextResponse.json({ error: 'Failed to create interest' }, { status: 500 });
  }
}

// PUT /api/db/user/interests
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, interest_category, interest_name, intensity_level, since_when, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await prisma.user_interests.findFirst({
      where: { id: BigInt(id), user_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Interest not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = { updated_at: new Date() };
    if (interest_category !== undefined) updateData.interest_category = interest_category;
    if (interest_name !== undefined) updateData.interest_name = interest_name;
    if (intensity_level !== undefined) updateData.intensity_level = intensity_level;
    if (since_when !== undefined) updateData.since_when = since_when;
    if (description !== undefined) updateData.description = description;

    const interest = await prisma.user_interests.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return NextResponse.json({ data: serializeInterest(interest) });
  } catch (error) {
    console.error('Error updating interest:', error);
    return NextResponse.json({ error: 'Failed to update interest' }, { status: 500 });
  }
}

// DELETE /api/db/user/interests?id=xxx
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

    await prisma.user_interests.deleteMany({
      where: { id: BigInt(idParam), user_id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting interest:', error);
    return NextResponse.json({ error: 'Failed to delete interest' }, { status: 500 });
  }
}
