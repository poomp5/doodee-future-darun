import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper to convert BigInt fields to string for JSON serialization
const serializeScore = (score: any) => ({
  ...score,
  id: score.id.toString(),
});

// GET /api/db/scores?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const scores = await prisma.user_scores.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json(scores.map(serializeScore));
  } catch (error) {
    console.error('Error fetching scores:', error);
    return NextResponse.json({ error: 'Failed to fetch scores' }, { status: 500 });
  }
}

// POST /api/db/scores - Add score
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, score } = body;

    if (!subject || score === undefined) {
      return NextResponse.json({ error: 'subject and score are required' }, { status: 400 });
    }

    const newScore = await prisma.user_scores.create({
      data: {
        user_id: session.user.id,
        subject,
        score: Number(score),
      },
    });

    return NextResponse.json(serializeScore(newScore));
  } catch (error) {
    console.error('Error adding score:', error);
    return NextResponse.json({ error: 'Failed to add score' }, { status: 500 });
  }
}

// DELETE /api/db/scores?id=xxx
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.user_scores.deleteMany({
      where: { id: BigInt(id), user_id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting score:', error);
    return NextResponse.json({ error: 'Failed to delete score' }, { status: 500 });
  }
}
