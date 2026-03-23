import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// Helper to convert BigInt fields to string for JSON serialization
const serializePurchase = (purchase: any) => ({
  ...purchase,
  id: purchase.id.toString(),
});

// GET /api/db/purchases?user_id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const purchases = await prisma.portfolio_purchases.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ data: purchases.map(serializePurchase) });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 });
  }
}

// POST /api/db/purchases - Create purchase
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { template_name, template_type, price, canva_link, download_link } = body;

    const purchase = await prisma.portfolio_purchases.create({
      data: {
        user_id: session.user.id,
        template_name,
        template_type,
        price,
        canva_link,
        download_link,
      },
    });

    return NextResponse.json({ data: serializePurchase(purchase) });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ error: 'Failed to create purchase' }, { status: 500 });
  }
}
