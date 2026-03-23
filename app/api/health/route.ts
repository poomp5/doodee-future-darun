import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

/**
 * Health check endpoint - Check Prisma DB connection
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify secret token to prevent abuse
    const authToken = request.headers.get('authorization');
    const expectedToken = process.env.HEALTH_CHECK_TOKEN;

    if (!expectedToken) {
      console.error('HEALTH_CHECK_TOKEN not configured');
      return NextResponse.json(
        { error: 'Health check not configured' },
        { status: 500 }
      );
    }

    if (!authToken || authToken !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Perform minimal DB query using Prisma
    const result = await prisma.$queryRaw<{ current_time: Date }[]>`SELECT NOW() as current_time`;

    const duration = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      duration_ms: duration,
      provider: 'prisma',
      db_time: result[0]?.current_time,
    });
  } catch (error) {
    console.error('Health check failed:', error);

    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        duration_ms: duration,
      },
      { status: 500 }
    );
  }
}
