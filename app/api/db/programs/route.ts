import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/db/programs - Get all programs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('university_id');
    const search = searchParams.get('search');
    const limit = searchParams.get('limit');
    const offset = searchParams.get('offset');

    const where: Record<string, unknown> = {};

    if (universityId) {
      where.university_id = universityId;
    }

    if (search) {
      where.OR = [
        { university_name_th: { contains: search, mode: 'insensitive' } },
        { university_name_en: { contains: search, mode: 'insensitive' } },
        { faculty_name_th: { contains: search, mode: 'insensitive' } },
        { faculty_name_en: { contains: search, mode: 'insensitive' } },
        { field_name_th: { contains: search, mode: 'insensitive' } },
        { field_name_en: { contains: search, mode: 'insensitive' } },
        { program_name_th: { contains: search, mode: 'insensitive' } },
      ];
    }

    const programs = await prisma.programs.findMany({
      where,
      select: {
        id: true,
        university_id: true,
        university_type_name_th: true,
        university_name_th: true,
        university_name_en: true,
        campus_id: true,
        campus_name_th: true,
        campus_name_en: true,
        faculty_id: true,
        faculty_name_th: true,
        faculty_name_en: true,
        group_field_id: true,
        group_field_th: true,
        field_id: true,
        field_name_th: true,
        field_name_en: true,
        program_name_th: true,
        program_name_en: true,
        program_type_name_th: true,
        program_id: true,
        program_partners_inter_name: true,
        country_partners_name: true,
        major_acceptance_number: true,
        number_acceptance_mko2: true,
        graduate_rate: true,
        employment_rate: true,
        median_salary: true,
        logo_url: true,
      },
      orderBy: [
        { university_name_th: 'asc' },
        { faculty_name_th: 'asc' },
        { field_name_th: 'asc' },
      ],
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) }),
    });

    // Map field names for compatibility
    const mappedPrograms = programs.map(p => ({
      ...p,
      program_total_seats: p.major_acceptance_number,
      r1_admission_quota: p.number_acceptance_mko2,
    }));

    return NextResponse.json(mappedPrograms);
  } catch (error: any) {
    console.error('Error fetching programs:', error);
    return NextResponse.json({ error: 'Failed to fetch programs', details: error?.message }, { status: 500 });
  }
}

// POST - Get universities list (distinct)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'get_universities') {
      const universities = await prisma.$queryRaw`
        SELECT DISTINCT
          university_id,
          university_name_th,
          university_name_en,
          logo_url
        FROM programs
        ORDER BY university_name_th
      `;

      return NextResponse.json(universities);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Failed to process request', details: error?.message }, { status: 500 });
  }
}
