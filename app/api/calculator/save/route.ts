import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/auth';

// POST /api/calculator/save - Save user's calculation history
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user ID from email
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { scores, results, programType } = body;

    if (!scores || !results || !programType) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Save calculation history
    const saved = await prisma.user_calculator_history.create({
      data: {
        user_id: user.id,
        scores: scores,
        results: results,
        program_type: programType,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: saved.id,
        createdAt: saved.created_at,
      },
    });
  } catch (error) {
    console.error('Error saving calculation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save calculation' },
      { status: 500 }
    );
  }
}

// GET /api/calculator/save - Get user's calculation history
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    let history: Awaited<ReturnType<typeof prisma.user_calculator_history.findMany>> = [];
    try {
      history = await prisma.user_calculator_history.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        take: limit,
      });
    } catch {
      // Table not yet migrated — return empty history
      return NextResponse.json({ success: true, data: [] });
    }

    const data = history.map(h => ({
      id: h.id,
      scores: h.scores,
      results: h.results,
      programType: h.program_type,
      createdAt: h.created_at,
    }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching calculation history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
