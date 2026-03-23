import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

const serializeCareerGoal = (goal: any) => ({
  ...goal,
  id: goal.id.toString(),
  // Ensure JSON arrays are properly serialized
  backup_goals: Array.isArray(goal.backup_goals) ? goal.backup_goals : (goal.backup_goals || []),
  target_universities: Array.isArray(goal.target_universities) ? goal.target_universities : (goal.target_universities || []),
  target_programs: Array.isArray(goal.target_programs) ? goal.target_programs : (goal.target_programs || []),
  steps_taken: Array.isArray(goal.steps_taken) ? goal.steps_taken : (goal.steps_taken || []),
});

// GET /api/db/user/career-goals?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const goals = await prisma.user_career_goals.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ data: goals.map(serializeCareerGoal) });
  } catch (error) {
    console.error('Error fetching career goals:', error);
    return NextResponse.json({ error: 'Failed to fetch career goals' }, { status: 500 });
  }
}

// POST /api/db/user/career-goals
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      primary_goal,
      backup_goals,
      target_universities,
      target_programs,
      target_industry,
      timeline,
      motivation,
      steps_taken,
    } = body;

    if (!primary_goal) {
      return NextResponse.json({ error: 'primary_goal is required' }, { status: 400 });
    }

    const goal = await prisma.user_career_goals.create({
      data: {
        user_id: session.user.id,
        primary_goal,
        backup_goals,
        target_universities,
        target_programs,
        target_industry,
        timeline,
        motivation,
        steps_taken,
      },
    });

    return NextResponse.json({ data: serializeCareerGoal(goal) });
  } catch (error) {
    console.error('Error creating career goal:', error);
    return NextResponse.json({ error: 'Failed to create career goal' }, { status: 500 });
  }
}

// PUT /api/db/user/career-goals
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      primary_goal,
      backup_goals,
      target_universities,
      target_programs,
      target_industry,
      timeline,
      motivation,
      steps_taken,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const existing = await prisma.user_career_goals.findFirst({
      where: { id: BigInt(id), user_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Career goal not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = { updated_at: new Date() };
    if (primary_goal !== undefined) updateData.primary_goal = primary_goal;
    if (backup_goals !== undefined) updateData.backup_goals = backup_goals;
    if (target_universities !== undefined) updateData.target_universities = target_universities;
    if (target_programs !== undefined) updateData.target_programs = target_programs;
    if (target_industry !== undefined) updateData.target_industry = target_industry;
    if (timeline !== undefined) updateData.timeline = timeline;
    if (motivation !== undefined) updateData.motivation = motivation;
    if (steps_taken !== undefined) updateData.steps_taken = steps_taken;

    const goal = await prisma.user_career_goals.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return NextResponse.json({ data: serializeCareerGoal(goal) });
  } catch (error) {
    console.error('Error updating career goal:', error);
    return NextResponse.json({ error: 'Failed to update career goal' }, { status: 500 });
  }
}

// DELETE /api/db/user/career-goals?id=xxx
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

    await prisma.user_career_goals.deleteMany({
      where: { id: BigInt(idParam), user_id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting career goal:', error);
    return NextResponse.json({ error: 'Failed to delete career goal' }, { status: 500 });
  }
}
