import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';

// Utility to convert BigInt fields so JSON serialization works
function serializeBigInts(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object' && typeof value.toJSON === 'function') {
    const jsonValue = value.toJSON();
    return serializeBigInts(jsonValue);
  }
  if (Array.isArray(value)) return value.map(serializeBigInts);
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, serializeBigInts(val)])
    );
  }
  return value;
}

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [
      user,
      todos,
      purchases,
      interestedFaculties,
      portfolioUploads,
      gpaxEntries,
    ] = await Promise.all([
      prisma.users.findUnique({ where: { id: userId } }),
      prisma.user_todos.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      }),
      prisma.portfolio_purchases.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      }),
      prisma.$queryRaw`
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
          p.logo_url,
          p.major_acceptance_number as program_total_seats,
          p.number_acceptance_mko2 as r1_admission_quota
        FROM user_interested_programs uip
        LEFT JOIN programs p ON uip.program_id = p.id
        WHERE uip.user_id = ${userId}
        ORDER BY uip.priority ASC
      `,
      prisma.portfolio_uploads.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
      }),
      prisma.user_gpax_entries.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'asc' },
      }),
    ]);

    // Calculate GPAX from entries
    let totalPoints = 0;
    let totalCredits = 0;
    gpaxEntries.forEach((entry) => {
      const gpa = Number(entry.gpa) || 0;
      const credits = Number(entry.credits) || 0;
      totalPoints += gpa * credits;
      totalCredits += credits;
    });
    const gpax = totalCredits > 0 ? totalPoints / totalCredits : null;

    return NextResponse.json(
      serializeBigInts({
        user,
        todos,
        purchases,
        interestedFaculties,
        portfolioUploads,
        gpax,
      })
    );
  } catch (error) {
    console.error('Error fetching profile overview:', error);
    return NextResponse.json({ error: 'Failed to fetch profile overview' }, { status: 500 });
  }
}
