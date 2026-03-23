import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Get current user's role
async function getCurrentUserRole() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role || null;
}

// Check if user can access admin panel (admin, superadmin, moderator)
async function canAccessAdmin() {
  const role = await getCurrentUserRole();
  return role === 'admin' || role === 'superadmin' || role === 'moderator';
}

// Check if user can change roles (admin, superadmin only)
async function canChangeRoles() {
  const role = await getCurrentUserRole();
  return role === 'admin' || role === 'superadmin';
}

// GET /api/admin/users - Get all users (Admin, Superadmin, Moderator can view)
export async function GET(request: NextRequest) {
  try {
    if (!await canAccessAdmin()) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Return current user's role for frontend permission check
    const currentRole = await getCurrentUserRole();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    let users;
    if (search) {
      users = await prisma.users.findMany({
        where: {
          OR: [
            { email: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
            { full_name: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          email: true,
          username: true,
          full_name: true,
          profile_image_url: true,
          role: true,
          current_points: true,
          total_points: true,
          referral_code: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'desc' },
      });
    } else {
      users = await prisma.users.findMany({
        select: {
          id: true,
          email: true,
          username: true,
          full_name: true,
          profile_image_url: true,
          role: true,
          current_points: true,
          total_points: true,
          referral_code: true,
          created_at: true,
          updated_at: true,
        },
        orderBy: { created_at: 'desc' },
      });
    }

    return NextResponse.json({ data: users, currentRole });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

// PUT /api/admin/users - Update user role (Admin/Superadmin only)
export async function PUT(request: NextRequest) {
  try {
    const requesterRole = await getCurrentUserRole();
    if (requesterRole !== 'admin' && requesterRole !== 'superadmin') {
      return NextResponse.json({ error: 'Unauthorized - Only Admin/Superadmin can change roles' }, { status: 403 });
    }

    const body = await request.json();
    const { id, role, current_points, total_points } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Permission matrix check for role changes
    if (role !== undefined) {
      const targetUser = await prisma.users.findUnique({
        where: { id },
        select: { role: true },
      });
      const targetRole = targetUser?.role || 'user';

      if (requesterRole === 'superadmin') {
        // superadmin cannot touch other superadmins
        if (targetRole === 'superadmin') {
          return NextResponse.json({ error: 'ไม่สามารถเปลี่ยน role ของ Superadmin ได้' }, { status: 403 });
        }
        // superadmin cannot assign superadmin role
        if (role === 'superadmin') {
          return NextResponse.json({ error: 'ไม่สามารถแต่งตั้ง Superadmin ได้' }, { status: 403 });
        }
      } else if (requesterRole === 'admin') {
        // admin cannot touch superadmin or other admins
        if (targetRole === 'superadmin' || targetRole === 'admin') {
          return NextResponse.json({ error: 'Admin ไม่สามารถเปลี่ยน role ของ Admin หรือ Superadmin ได้' }, { status: 403 });
        }
        // admin cannot assign admin or superadmin role
        if (role === 'admin' || role === 'superadmin') {
          return NextResponse.json({ error: 'Admin ไม่สามารถแต่งตั้ง Admin หรือ Superadmin ได้' }, { status: 403 });
        }
      }
    }

    const updateData: Record<string, any> = {};
    if (role !== undefined) updateData.role = role;
    if (current_points !== undefined) updateData.current_points = current_points;
    if (total_points !== undefined) updateData.total_points = total_points;
    updateData.updated_at = new Date();

    if (Object.keys(updateData).length === 1) {
      return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
