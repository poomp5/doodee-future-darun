import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * Track User Views for Recommendation Engine
 * POST /api/tracking/view
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { itemId, itemType } = body;

    if (!itemId || !itemType) {
      return NextResponse.json(
        { error: 'itemId and itemType are required' },
        { status: 400 }
      );
    }

    if (itemType !== 'activity' && itemType !== 'course') {
      return NextResponse.json(
        { error: 'itemType must be either "activity" or "course"' },
        { status: 400 }
      );
    }

    // Track the view (upsert to handle duplicates)
    if (itemType === 'activity') {
      await prisma.user_viewed_activities.upsert({
        where: {
          user_id_activity_id: {
            user_id: session.user.id,
            activity_id: itemId,
          },
        },
        create: {
          user_id: session.user.id,
          activity_id: itemId,
        },
        update: {
          viewed_at: new Date(),
        },
      });
    } else {
      await prisma.user_viewed_courses.upsert({
        where: {
          user_id_course_id: {
            user_id: session.user.id,
            course_id: itemId,
          },
        },
        create: {
          user_id: session.user.id,
          course_id: itemId,
        },
        update: {
          viewed_at: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view' },
      { status: 500 }
    );
  }
}
