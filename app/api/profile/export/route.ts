import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

/**
 * Export Enhanced Profile Data
 * GET /api/profile/export?format=json
 *
 * Formats supported: json, pdf (future)
 */

// Helper to serialize data
function serializeData(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object' && typeof value.toJSON === 'function') {
    const jsonValue = value.toJSON();
    return serializeData(jsonValue);
  }
  if (Array.isArray(value)) return value.map(serializeData);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, serializeData(val)])
    );
  }
  return value;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Fetch all enhanced profile data
    const [
      user,
      educationHistory,
      achievements,
      skills,
      interests,
      extracurricular,
      careerGoals,
    ] = await Promise.all([
      prisma.users.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          full_name: true,
          profile_image_url: true,
          bio: true,
          gpax: true,
          profile_completeness_percentage: true,
          created_at: true,
        },
      }),
      prisma.user_education_history.findMany({
        where: { user_id: session.user.id },
        orderBy: [
          { is_current: 'desc' },
          { end_year: 'desc' },
          { start_year: 'desc' },
        ],
      }),
      prisma.user_achievements.findMany({
        where: { user_id: session.user.id },
        orderBy: { date_achieved: 'desc' },
      }),
      prisma.user_skills.findMany({
        where: { user_id: session.user.id },
        orderBy: { created_at: 'desc' },
      }),
      prisma.user_interests.findMany({
        where: { user_id: session.user.id },
        orderBy: { intensity_level: 'desc' },
      }),
      prisma.user_extracurricular.findMany({
        where: { user_id: session.user.id },
        orderBy: [
          { is_ongoing: 'desc' },
          { start_date: 'desc' },
        ],
      }),
      prisma.user_career_goals.findMany({
        where: { user_id: session.user.id },
        orderBy: { created_at: 'desc' },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const portfolioData = {
      exportDate: new Date().toISOString(),
      exportFormat: format,
      profile: serializeData({
        basicInfo: {
          name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          email: user.email,
          bio: user.bio,
          profileImage: user.profile_image_url,
          gpax: user.gpax ? Number(user.gpax) : null,
          completeness: user.profile_completeness_percentage,
          memberSince: user.created_at,
        },
        education: educationHistory,
        achievements: achievements,
        skills: skills,
        interests: interests,
        extracurricular: extracurricular,
        careerGoals: careerGoals,
      }),
      statistics: {
        totalEducationEntries: educationHistory.length,
        totalAchievements: achievements.length,
        totalSkills: skills.length,
        totalInterests: interests.length,
        totalExtracurricular: extracurricular.length,
        totalCareerGoals: careerGoals.length,
      },
    };

    if (format === 'json') {
      // Return JSON with download headers
      const fileName = `doodee-portfolio-${user.id}-${new Date().toISOString().split('T')[0]}.json`;

      return new NextResponse(JSON.stringify(portfolioData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Future: PDF format support
    if (format === 'pdf') {
      return NextResponse.json(
        { error: 'PDF export coming soon!' },
        { status: 501 }
      );
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting profile:', error);
    return NextResponse.json(
      { error: 'Failed to export profile' },
      { status: 500 }
    );
  }
}
