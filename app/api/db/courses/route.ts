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

// GET /api/db/courses - Get all courses with optional pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const courses = await prisma.courses.findMany({
      where: {
        ...(isActive === 'true' && { is_active: true }),
        ...(category && { category }),
      },
      orderBy: [
        { display_order: 'asc' },
        { created_at: 'desc' },
      ],
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    return NextResponse.json({ data: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

// POST /api/db/courses - Create a new course (Admin only)
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
      price,
      category,
      subcategory,
      duration,
      instructor,
      source,
      link_url,
      is_active,
      display_order,
      deadline,
      max_participants
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const course = await prisma.courses.create({
      data: {
        title,
        description: description || '',
        image_url: image_url || '',
        price: price || 0,
        category: category || 'general',
        subcategory: subcategory || '',
        duration: duration || '',
        instructor: instructor || '',
        source: source || 'other',
        link_url: link_url || '',
        is_active: is_active !== false,
        display_order: display_order || 0,
        deadline: deadline ? new Date(deadline) : null,
        max_participants: max_participants || null,
      },
    });

    return NextResponse.json({ data: course });
  } catch (error) {
    console.error('Error creating course:', error);
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }
}

// PUT /api/db/courses - Update a course (Admin only)
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { id, deadline, categories, subcategories, ...restData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const course = await prisma.courses.update({
      where: { id },
      data: {
        ...restData,
        ...(categories !== undefined && { category: Array.isArray(categories) ? categories[0] || "general" : categories }),
        ...(subcategories !== undefined && { subcategory: Array.isArray(subcategories) ? subcategories[0] || "" : subcategories }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ data: course });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json({ error: 'Failed to update course' }, { status: 500 });
  }
}

// DELETE /api/db/courses?id=xxx (Admin only)
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

    await prisma.courses.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting course:', error);
    return NextResponse.json({ error: 'Failed to delete course' }, { status: 500 });
  }
}
