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

// GET /api/db/activities - Get all activities with optional pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const activities = await prisma.activities.findMany({
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

    return NextResponse.json({ data: activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// POST /api/db/activities - Create a new activity (Admin only)
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
      location,
      start_date,
      end_date,
      category,
      subcategory,
      max_participants,
      price,
      source,
      link_url,
      is_active,
      display_order,
      deadline
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const activity = await prisma.activities.create({
      data: {
        title,
        description: description || '',
        image_url: image_url || '',
        location: location || '',
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        category: category || 'general',
        subcategory: subcategory || '',
        max_participants: max_participants || null,
        price: price || 0,
        source: source || 'other',
        link_url: link_url || '',
        is_active: is_active !== false,
        display_order: display_order || 0,
        deadline: deadline ? new Date(deadline) : null,
      },
    });

    return NextResponse.json({ data: activity });
  } catch (error) {
    console.error('Error creating activity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create activity', details: errorMessage }, { status: 500 });
  }
}

// PUT /api/db/activities - Update an activity (Admin only)
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const {
      id,
      start_date,
      end_date,
      deadline,
      price,
      // Handle array fields from client - convert to single values
      categories,
      subcategories,
      // Exclude fields that don't exist in schema
      created_at,
      ...restData
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const activityId = typeof id === 'string' ? parseInt(id) : id;

    // Convert arrays to single values if provided
    const category = categories?.[0] || restData.category;
    const subcategory = subcategories?.[0] || restData.subcategory;

    // Remove category/subcategory from restData to avoid duplication
    delete restData.category;
    delete restData.subcategory;

    const activity = await prisma.activities.update({
      where: { id: activityId },
      data: {
        ...restData,
        ...(category !== undefined && { category }),
        ...(subcategory !== undefined && { subcategory }),
        ...(start_date !== undefined && { start_date: start_date ? new Date(start_date) : null }),
        ...(end_date !== undefined && { end_date: end_date ? new Date(end_date) : null }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(price !== undefined && { price: price }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({ data: activity });
  } catch (error) {
    console.error('Error updating activity:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to update activity', details: errorMessage }, { status: 500 });
  }
}

// DELETE /api/db/activities?id=xxx (Admin only)
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

    await prisma.activities.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity:', error);
    return NextResponse.json({ error: 'Failed to delete activity' }, { status: 500 });
  }
}
