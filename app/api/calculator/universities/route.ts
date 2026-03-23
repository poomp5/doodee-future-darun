import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/calculator/universities - Get unique universities from programs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    // Get distinct universities from programs table
    const universities = await prisma.programs.findMany({
      where: search ? {
        OR: [
          { university_name_th: { contains: search, mode: 'insensitive' } },
          { university_name_en: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
      select: {
        university_id: true,
        university_name_th: true,
        university_name_en: true,
        logo_url: true,
      },
      distinct: ['university_id'],
      orderBy: { university_name_th: 'asc' },
    });

    // Filter out nulls and format
    const data = universities
      .filter(u => u.university_id && u.university_name_th)
      .map(u => ({
        id: u.university_id,
        nameTh: u.university_name_th,
        nameEn: u.university_name_en,
        logoUrl: u.logo_url,
      }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching universities:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch universities' },
      { status: 500 }
    );
  }
}
