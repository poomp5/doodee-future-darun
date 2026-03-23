import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/calculator/faculties - Get unique faculties, optionally filtered by university
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId');
    const search = searchParams.get('search');

    const where: any = {};

    if (universityId) {
      where.university_id = universityId;
    }

    if (search) {
      where.OR = [
        { faculty_name_th: { contains: search, mode: 'insensitive' } },
        { faculty_name_en: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get distinct faculties from programs table
    const faculties = await prisma.programs.findMany({
      where,
      select: {
        faculty_id: true,
        faculty_name_th: true,
        faculty_name_en: true,
        university_id: true,
        university_name_th: true,
      },
      distinct: ['faculty_id', 'university_id'],
      orderBy: { faculty_name_th: 'asc' },
    });

    // Filter out nulls and format
    const data = faculties
      .filter(f => f.faculty_id && f.faculty_name_th)
      .map(f => ({
        id: f.faculty_id,
        nameTh: f.faculty_name_th,
        nameEn: f.faculty_name_en,
        universityId: f.university_id,
        universityNameTh: f.university_name_th,
      }));

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch faculties' },
      { status: 500 }
    );
  }
}
