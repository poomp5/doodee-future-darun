import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/db/points?user_id=xxx - Get user points and history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Get user's current points
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { current_points: true, total_points: true },
    });

    // Get point history
    const history = await prisma.point_history.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      current_points: user?.current_points || 0,
      total_points: user?.total_points || 0,
      history,
    });
  } catch (error) {
    console.error('Error fetching points:', error);
    return NextResponse.json({ error: 'Failed to fetch points' }, { status: 500 });
  }
}

// POST /api/db/points - Spend points (redeem rewards)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { points_amount, description } = body;

    if (!points_amount || points_amount <= 0) {
      return NextResponse.json({ error: 'Invalid points amount' }, { status: 400 });
    }

    // Check if user has enough points
    const user = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { current_points: true },
    });

    const currentPoints = user?.current_points || 0;

    if (currentPoints < points_amount) {
      return NextResponse.json({ error: 'Not enough points', success: false }, { status: 400 });
    }

    const newBalance = currentPoints - points_amount;

    // Use transaction to ensure atomicity
    await prisma.$transaction([
      // Deduct points
      prisma.users.update({
        where: { id: session.user.id },
        data: { current_points: newBalance },
      }),
      // Record in history
      prisma.point_history.create({
        data: {
          user_id: session.user.id,
          action_type: 'redeem',
          action_description: description || 'Redeemed reward',
          points_changed: -points_amount,
          balance_before: currentPoints,
          balance_after: newBalance,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      new_balance: newBalance,
    });
  } catch (error) {
    console.error('Error spending points:', error);
    return NextResponse.json({ error: 'Failed to spend points' }, { status: 500 });
  }
}
