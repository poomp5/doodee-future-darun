import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/db/profile?username=xxx - Get public profile with stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }

    // Get user profile
    const user = await prisma.users.findFirst({
      where: { username, is_public: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get stats and interested faculties
    const [todosCount, portfoliosCount, viewsCount, interestedFaculties] = await Promise.all([
      prisma.user_todos.count({
        where: { user_id: user.id, is_completed: true },
      }),
      prisma.portfolio_uploads.count({
        where: { user_id: user.id },
      }),
      prisma.profile_views.count({
        where: { profile_user_id: user.id },
      }),
      prisma.$queryRaw`
        SELECT uip.*, p.program_name_th, p.program_name_en, p.faculty_name_th, p.faculty_name_en,
            p.university_name_th, p.university_name_en, p.logo_url as university_logo_url
            FROM user_interested_programs uip
            JOIN programs p ON uip.program_id = p.id
            WHERE uip.user_id = ${user.id}
            ORDER BY uip.priority ASC
      `,
    ]);

    return NextResponse.json({
      user,
      stats: {
        totalPoints: user.total_points || 0,
        completedTodos: todosCount,
        portfolios: portfoliosCount,
        views: viewsCount,
      },
      interestedFaculties: interestedFaculties || [],
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// POST /api/db/profile/view - Track profile view
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profile_user_id, viewer_user_id, user_agent, referer } = body;

    if (!profile_user_id) {
      return NextResponse.json({ error: 'profile_user_id is required' }, { status: 400 });
    }

    await prisma.profile_views.create({
      data: {
        profile_user_id,
        viewer_user_id: viewer_user_id || null,
        ip_address: 'unknown',
        user_agent: user_agent || 'unknown',
        referer: referer || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking profile view:', error);
    return NextResponse.json({ error: 'Failed to track profile view' }, { status: 500 });
  }
}
