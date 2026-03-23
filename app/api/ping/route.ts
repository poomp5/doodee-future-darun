import { NextResponse } from 'next/server';

// Lightweight liveness probe that avoids touching external services/DBs
export const runtime = 'nodejs';

const headers = {
  'cache-control': 'no-store'
};

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      message: 'pong',
      timestamp: new Date().toISOString()
    },
    { status: 200, headers }
  );
}

export async function HEAD() {
  return new NextResponse(null, { status: 200, headers });
}
