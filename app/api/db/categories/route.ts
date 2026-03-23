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

// GET /api/db/categories - Get all category groups with their categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'groups' | 'items' | null (both)
    const groupKey = searchParams.get('group_key');

    if (type === 'groups') {
      // Get only category groups
      const groups = await prisma.category_groups.findMany({
        where: { is_active: true },
        orderBy: { display_order: 'asc' },
      });
      return NextResponse.json({ data: groups });
    }

    if (type === 'items' && groupKey) {
      // Get categories for a specific group
      const categories = await prisma.categories.findMany({
        where: { group_key: groupKey, is_active: true },
        orderBy: { display_order: 'asc' },
      });
      return NextResponse.json({ data: categories });
    }

    // Get all groups with their categories
    const groups = await prisma.category_groups.findMany({
      orderBy: { display_order: 'asc' },
    });

    const categories = await prisma.categories.findMany({
      orderBy: { display_order: 'asc' },
    });

    // Organize categories by group
    const result = groups.map((group) => ({
      ...group,
      items: categories.filter((cat) => cat.group_key === group.key)
    }));

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST /api/db/categories - Create a new category group or category item (Admin only)
export async function POST(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { type } = body; // 'group' | 'item'

    if (type === 'group') {
      const { key, label, icon, display_order, is_active } = body;

      if (!key || !label) {
        return NextResponse.json({ error: 'key and label are required' }, { status: 400 });
      }

      const group = await prisma.category_groups.create({
        data: {
          key,
          label,
          icon: icon || 'Layers',
          display_order: display_order || 0,
          is_active: is_active !== false,
        },
      });

      return NextResponse.json({ data: group });
    }

    if (type === 'item') {
      const { group_key, value, label, display_order, is_active } = body;

      if (!group_key || !value || !label) {
        return NextResponse.json({ error: 'group_key, value, and label are required' }, { status: 400 });
      }

      const category = await prisma.categories.create({
        data: {
          group_key,
          value,
          label,
          display_order: display_order || 0,
          is_active: is_active !== false,
        },
      });

      return NextResponse.json({ data: category });
    }

    return NextResponse.json({ error: 'Invalid type. Use "group" or "item"' }, { status: 400 });
  } catch (error) {
    console.error('Error creating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to create category', details: errorMessage }, { status: 500 });
  }
}

// PUT /api/db/categories - Update a category group or category item (Admin only)
export async function PUT(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (type === 'group') {
      const group = await prisma.category_groups.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return NextResponse.json({ data: group });
    }

    if (type === 'item') {
      const category = await prisma.categories.update({
        where: { id },
        data: {
          ...updateData,
          updated_at: new Date(),
        },
      });
      return NextResponse.json({ data: category });
    }

    return NextResponse.json({ error: 'Invalid type. Use "group" or "item"' }, { status: 400 });
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/db/categories?type=group|item&id=xxx (Admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'type and id are required' }, { status: 400 });
    }

    if (type === 'group') {
      // First get the group key, then delete categories and group in a transaction
      const group = await prisma.category_groups.findUnique({
        where: { id: parseInt(id) },
        select: { key: true },
      });

      if (group) {
        await prisma.$transaction([
          prisma.categories.deleteMany({ where: { group_key: group.key } }),
          prisma.category_groups.delete({ where: { id: parseInt(id) } }),
        ]);
      }

      return NextResponse.json({ success: true });
    }

    if (type === 'item') {
      await prisma.categories.delete({
        where: { id: parseInt(id) },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid type. Use "group" or "item"' }, { status: 400 });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
