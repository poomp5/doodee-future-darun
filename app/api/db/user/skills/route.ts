import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper to convert BigInt fields to string for JSON serialization
const serializeSkill = (skill: any) => ({
  ...skill,
  id: skill.id.toString(),
});

// GET /api/db/user/skills?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const category = searchParams.get('category'); // Optional filter

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const whereClause: any = { user_id: userId };
    if (category) {
      whereClause.skill_category = category;
    }

    const skills = await prisma.user_skills.findMany({
      where: whereClause,
      orderBy: [
        { proficiency_level: 'desc' },
        { created_at: 'desc' },
      ],
    });

    return NextResponse.json({ data: skills.map(serializeSkill) });
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

// POST /api/db/user/skills - Create skill
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      skill_name,
      skill_category,
      proficiency_level,
      verified_by,
      evidence_url,
      years_of_experience,
    } = body;

    if (!skill_name) {
      return NextResponse.json({ error: 'skill_name is required' }, { status: 400 });
    }

    const skill = await prisma.user_skills.create({
      data: {
        user_id: session.user.id,
        skill_name,
        skill_category,
        proficiency_level,
        verified_by: verified_by || 'self',
        evidence_url,
        years_of_experience,
      },
    });

    return NextResponse.json({ data: serializeSkill(skill) });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}

// PUT /api/db/user/skills - Update skill
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      skill_name,
      skill_category,
      proficiency_level,
      verified_by,
      evidence_url,
      years_of_experience,
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await prisma.user_skills.findFirst({
      where: { id: BigInt(id), user_id: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};
    if (skill_name !== undefined) updateData.skill_name = skill_name;
    if (skill_category !== undefined) updateData.skill_category = skill_category;
    if (proficiency_level !== undefined) updateData.proficiency_level = proficiency_level;
    if (verified_by !== undefined) updateData.verified_by = verified_by;
    if (evidence_url !== undefined) updateData.evidence_url = evidence_url;
    if (years_of_experience !== undefined) updateData.years_of_experience = years_of_experience;
    updateData.updated_at = new Date();

    const skill = await prisma.user_skills.update({
      where: { id: BigInt(id) },
      data: updateData,
    });

    return NextResponse.json({ data: serializeSkill(skill) });
  } catch (error) {
    console.error('Error updating skill:', error);
    return NextResponse.json({ error: 'Failed to update skill' }, { status: 500 });
  }
}

// DELETE /api/db/user/skills?id=xxx
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

    await prisma.user_skills.deleteMany({
      where: { id: BigInt(idParam), user_id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting skill:', error);
    return NextResponse.json({ error: 'Failed to delete skill' }, { status: 500 });
  }
}
