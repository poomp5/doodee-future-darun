import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper to convert BigInt fields to string for JSON serialization
const serializeAchievement = (achievement: any) => ({
  ...achievement,
  id: achievement.id.toString(),
  // Ensure JSON arrays are properly serialized
  evidence_urls: Array.isArray(achievement.evidence_urls) ? achievement.evidence_urls : (achievement.evidence_urls || []),
  skills_gained: Array.isArray(achievement.skills_gained) ? achievement.skills_gained : (achievement.skills_gained || []),
});

// GET /api/db/user/achievements?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type'); // Optional filter by achievement_type

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const whereClause: any = { user_id: userId };
    if (type) {
      whereClause.achievement_type = type;
    }

    const achievements = await prisma.user_achievements.findMany({
      where: whereClause,
      orderBy: [
        { date_achieved: 'desc' },
        { created_at: 'desc' },
      ],
    });

    return NextResponse.json({ data: achievements.map(serializeAchievement) });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json({ error: 'Failed to fetch achievements' }, { status: 500 });
  }
}

// POST /api/db/user/achievements - Create achievement
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      achievement_type,
      title,
      description,
      organization,
      date_achieved,
      achievement_level,
      certificate_url,
      evidence_urls,
      skills_gained,
    } = body;

    if (!title || !achievement_type) {
      return NextResponse.json({ error: 'title and achievement_type are required' }, { status: 400 });
    }

    const achievement = await prisma.user_achievements.create({
      data: {
        user_id: session.user.id,
        achievement_type,
        title,
        description,
        organization,
        date_achieved: date_achieved ? new Date(date_achieved) : null,
        achievement_level,
        certificate_url,
        evidence_urls,
        skills_gained,
      },
    });

    return NextResponse.json({ data: serializeAchievement(achievement) });
  } catch (error) {
    console.error('Error creating achievement:', error);
    return NextResponse.json({ error: 'Failed to create achievement' }, { status: 500 });
  }
}

// PUT /api/db/user/achievements - Update achievement
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      achievement_type,
      title,
      description,
      organization,
      date_achieved,
      achievement_level,
      certificate_url,
      evidence_urls,
      skills_gained,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.user_achievements.findFirst({
      where: { id: BigInt(id), user_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Achievement not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (achievement_type !== undefined) updateData.achievement_type = achievement_type;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (organization !== undefined) updateData.organization = organization;
    if (date_achieved !== undefined) updateData.date_achieved = date_achieved ? new Date(date_achieved) : null;
    if (achievement_level !== undefined) updateData.achievement_level = achievement_level;
    if (certificate_url !== undefined) updateData.certificate_url = certificate_url;
    if (evidence_urls !== undefined) updateData.evidence_urls = evidence_urls;
    if (skills_gained !== undefined) updateData.skills_gained = skills_gained;
    updateData.updated_at = new Date();

    const achievement = await prisma.user_achievements.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return NextResponse.json({ data: serializeAchievement(achievement) });
  } catch (error) {
    console.error('Error updating achievement:', error);
    return NextResponse.json({ error: 'Failed to update achievement' }, { status: 500 });
  }
}

// DELETE /api/db/user/achievements?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get('id');

    if (!idParam) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.user_achievements.deleteMany({
      where: { id: BigInt(idParam), user_id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    return NextResponse.json({ error: 'Failed to delete achievement' }, { status: 500 });
  }
}
