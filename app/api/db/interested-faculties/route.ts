import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/db/interested-faculties - Get user's interested programs with program details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json([]);
    }

    // Get user's interested programs with program details using raw query for complex join
    const interestedPrograms = await prisma.$queryRaw`
      SELECT
        uip.id,
        uip.user_id,
        uip.program_id,
        uip.priority,
        uip.created_at,
        p.university_name_th,
        p.university_name_en,
        p.faculty_name_th,
        p.faculty_name_en,
        p.field_name_th,
        p.field_name_en,
        p.program_name_th,
        p.program_name_en,
        p.logo_url,
        p.major_acceptance_number as program_total_seats,
        p.number_acceptance_mko2 as r1_admission_quota
      FROM user_interested_programs uip
      LEFT JOIN programs p ON uip.program_id = p.id
      WHERE uip.user_id = ${userId}
      ORDER BY uip.priority ASC
    `;

    return NextResponse.json(interestedPrograms);
  } catch (error) {
    console.error('Error fetching interested programs:', error);
    return NextResponse.json([], { status: 500 });
  }
}

// PUT /api/db/interested-faculties - Update program priorities
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json({ error: 'updates array is required' }, { status: 400 });
    }

    // Update each program's priority
    for (const update of updates) {
      await prisma.user_interested_programs.updateMany({
        where: { id: update.id, user_id: session.user.id },
        data: { priority: update.priority },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating program priorities:', error);
    return NextResponse.json({ error: 'Failed to update priorities' }, { status: 500 });
  }
}

// POST /api/db/interested-faculties - Add program to user's interested list
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { program_id, priority } = body;

    if (!program_id) {
      return NextResponse.json({ error: 'program_id is required' }, { status: 400 });
    }

    const result = await prisma.user_interested_programs.create({
      data: {
        user_id: session.user.id,
        program_id,
        priority: priority || 1,
      },
    });

    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error adding interested program:', error);
    // Handle duplicate key error
    if (error?.code === 'P2002' || error?.message?.includes('duplicate key')) {
      return NextResponse.json({ error: 'Already selected this program' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to add interested program' }, { status: 500 });
  }
}

// DELETE /api/db/interested-faculties?program_id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('program_id');
    const id = searchParams.get('id');

    if (!programId && !id) {
      return NextResponse.json({ error: 'program_id or id is required' }, { status: 400 });
    }

    if (programId) {
      await prisma.user_interested_programs.deleteMany({
        where: { program_id: parseInt(programId), user_id: session.user.id },
      });
    } else if (id) {
      await prisma.user_interested_programs.deleteMany({
        where: { id: parseInt(id), user_id: session.user.id },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing interested program:', error);
    return NextResponse.json({ error: 'Failed to remove interested program' }, { status: 500 });
  }
}
