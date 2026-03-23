import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Check if user has admin or superadmin role
async function isAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role === 'admin' || user?.role === 'superadmin';
}

// GET /api/db/points-courses - Get all points courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const courseType = searchParams.get('course_type');

    const courses = await prisma.points_courses.findMany({
      where: {
        ...(isActive === 'true' && { is_active: true }),
        ...(courseType && { course_type: courseType }),
      },
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' },
      ],
    });

    return NextResponse.json({ data: courses });
  } catch (error) {
    console.error('Error fetching points courses:', error);
    return NextResponse.json({ error: 'Failed to fetch points courses' }, { status: 500 });
  }
}

// POST /api/db/points-courses - Create a new points course (Admin only)
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      image_url,
      points_cost,
      link_url,
      course_id,
      course_type,
      is_active,
      display_order
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const course = await prisma.points_courses.create({
      data: {
        title,
        description: description || '',
        image_url: image_url || '',
        points_cost: points_cost || 0,
        link_url: link_url || '',
        course_id: course_id || null,
        course_type: course_type || 'custom',
        is_active: is_active !== false,
        display_order: display_order || 0,
      },
    });

    return NextResponse.json({ data: course });
  } catch (error) {
    console.error('Error creating points course:', error);
    return NextResponse.json({ error: 'Failed to create points course' }, { status: 500 });
  }
}

// PUT /api/db/points-courses - Update a points course (Admin only)
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const course = await prisma.points_courses.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ data: course });
  } catch (error) {
    console.error('Error updating points course:', error);
    return NextResponse.json({ error: 'Failed to update points course' }, { status: 500 });
  }
}

// DELETE /api/db/points-courses?id=xxx (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.points_courses.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting points course:', error);
    return NextResponse.json({ error: 'Failed to delete points course' }, { status: 500 });
  }
}
