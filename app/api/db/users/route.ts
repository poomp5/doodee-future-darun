import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/db/users?id=xxx or ?username=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const username = searchParams.get('username');
    const isPublic = searchParams.get('is_public');

    if (!id && !username) {
      return NextResponse.json({ error: 'id or username is required' }, { status: 400 });
    }

    const user = await prisma.users.findFirst({
      where: {
        ...(id && { id }),
        ...(username && { username }),
        ...(isPublic === 'true' && { is_public: true }),
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PUT /api/db/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { username, bio, is_public, first_name, last_name } = body;

    const updateData: Record<string, any> = {};
    if (username !== undefined) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;

    // username uniqueness check
    if (username !== undefined && username !== null && username !== '') {
      const existing = await prisma.users.findFirst({
        where: { username, id: { not: session.user.id } },
      });
      if (existing) {
        return NextResponse.json({ error: 'username_taken' }, { status: 409 });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    const updatedUser = await prisma.users.update({
      where: { id: session.user.id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// POST /api/db/users - Upsert user (for auth callback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, full_name, first_name, last_name, profile_image_url } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const user = await prisma.users.upsert({
      where: { id },
      update: {
        email,
        full_name,
        first_name,
        last_name,
        profile_image_url,
        updated_at: new Date(),
      },
      create: {
        id,
        email,
        full_name,
        first_name,
        last_name,
        profile_image_url,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error upserting user:', error);
    return NextResponse.json({ error: 'Failed to upsert user' }, { status: 500 });
  }
}
