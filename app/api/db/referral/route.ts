import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const REFERRAL_POINTS_REWARD = 10; // Points awarded for successful referral

// Helper to convert BigInt fields to string for JSON serialization
const serializeTracking = (tracking: any) => ({
  ...tracking,
  id: tracking.id.toString(),
});

// GET /api/db/referral?username=xxx - Get referrer info by username
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }

    const user = await prisma.users.findFirst({
      where: { username },
      select: {
        id: true,
        username: true,
        first_name: true,
        last_name: true,
        full_name: true,
        profile_image_url: true,
        referral_code: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching referrer:', error);
    return NextResponse.json({ error: 'Failed to fetch referrer' }, { status: 500 });
  }
}

// POST /api/db/referral/track - Track referral click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { referrer_user_id, referral_code, user_agent } = body;

    if (!referrer_user_id || !referral_code) {
      return NextResponse.json({ error: 'referrer_user_id and referral_code are required' }, { status: 400 });
    }

    const tracking = await prisma.referral_tracking.create({
      data: {
        referrer_user_id,
        referral_code,
        ip_address: 'unknown',
        user_agent: user_agent || 'unknown',
      },
    });

    return NextResponse.json(serializeTracking(tracking));
  } catch (error) {
    console.error('Error tracking referral:', error);
    return NextResponse.json({ error: 'Failed to track referral' }, { status: 500 });
  }
}

// PUT /api/db/referral/signup - Update referral with signed up user and award points
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { referrer_id } = body;

    if (!referrer_id) {
      return NextResponse.json({ error: 'referrer_id is required' }, { status: 400 });
    }

    // Check if this user already used a referral (prevent duplicate rewards)
    const existingReferral = await prisma.referral_tracking.findFirst({
      where: { referred_user_id: session.user.id },
    });

    if (existingReferral) {
      return NextResponse.json({
        success: false,
        error: 'User has already used a referral link',
        already_referred: true
      }, { status: 400 });
    }

    // Update the most recent referral tracking entry using raw query for RETURNING clause
    const updateResult = await prisma.$queryRaw<{ id: number }[]>`
      UPDATE referral_tracking
      SET referred_user_id = ${session.user.id},
          signed_up_at = ${new Date().toISOString()}
      WHERE referrer_user_id = ${referrer_id}
        AND referred_user_id IS NULL
      RETURNING id
    `;

    if (!updateResult || updateResult.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No pending referral found'
      }, { status: 400 });
    }

    // Award points to the REFERRER (the person who invited)
    const referrerUser = await prisma.users.findUnique({
      where: { id: referrer_id },
      select: { current_points: true, total_points: true },
    });

    if (referrerUser) {
      const currentPoints = referrerUser.current_points || 0;
      const totalPoints = referrerUser.total_points || 0;

      // Update referrer's points
      await prisma.users.update({
        where: { id: referrer_id },
        data: {
          current_points: currentPoints + REFERRAL_POINTS_REWARD,
          total_points: totalPoints + REFERRAL_POINTS_REWARD,
        },
      });

      // Record in point history for referrer
      await prisma.point_history.create({
        data: {
          user_id: referrer_id,
          action_type: 'referral',
          action_description: `ได้รับแต้มจากการเชิญเพื่อน (${session.user.email || 'ผู้ใช้ใหม่'})`,
          points_changed: REFERRAL_POINTS_REWARD,
          balance_before: currentPoints,
          balance_after: currentPoints + REFERRAL_POINTS_REWARD,
        },
      });

      console.log(`Awarded ${REFERRAL_POINTS_REWARD} points to referrer ${referrer_id}`);
    }

    // Also award points to the NEW USER who signed up
    const newUser = await prisma.users.findUnique({
      where: { id: session.user.id },
      select: { current_points: true, total_points: true },
    });

    if (newUser) {
      const newUserCurrentPoints = newUser.current_points || 0;
      const newUserTotalPoints = newUser.total_points || 0;

      await prisma.users.update({
        where: { id: session.user.id },
        data: {
          current_points: newUserCurrentPoints + REFERRAL_POINTS_REWARD,
          total_points: newUserTotalPoints + REFERRAL_POINTS_REWARD,
        },
      });

      // Record in point history for new user
      await prisma.point_history.create({
        data: {
          user_id: session.user.id,
          action_type: 'referral',
          action_description: 'ได้รับแต้มจากการสมัครผ่านลิงก์เชิญ',
          points_changed: REFERRAL_POINTS_REWARD,
          balance_before: newUserCurrentPoints,
          balance_after: newUserCurrentPoints + REFERRAL_POINTS_REWARD,
        },
      });

      console.log(`Awarded ${REFERRAL_POINTS_REWARD} points to new user ${session.user.id}`);
    }

    return NextResponse.json({
      success: true,
      points_awarded: REFERRAL_POINTS_REWARD,
      message: `ได้รับ ${REFERRAL_POINTS_REWARD} แต้มเรียบร้อย!`
    });
  } catch (error) {
    console.error('Error updating referral:', error);
    return NextResponse.json({ error: 'Failed to update referral' }, { status: 500 });
  }
}
