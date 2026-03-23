import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/calculator/programs - Get programs with their score weights
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const universityId = searchParams.get('universityId');
    const facultyId = searchParams.get('facultyId');
    const programIds = searchParams.get('programIds'); // comma-separated
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};

    if (universityId) {
      where.university_id = universityId;
    }

    if (facultyId) {
      where.faculty_id = facultyId;
    }

    if (programIds) {
      const ids = programIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      if (ids.length > 0) {
        where.id = { in: ids };
      }
    }

    if (search) {
      where.OR = [
        { university_name_th: { contains: search, mode: 'insensitive' } },
        { faculty_name_th: { contains: search, mode: 'insensitive' } },
        { field_name_th: { contains: search, mode: 'insensitive' } },
        { program_name_th: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [programs, total] = await Promise.all([
      prisma.programs.findMany({
        where,
        include: {
          tcas_score_weights: true,
          tcas_cutoff_history: {
            orderBy: [
              { year: 'desc' },
              { round: 'desc' },
            ],
          },
        },
        take: limit,
        skip: offset,
        orderBy: [
          { university_name_th: 'asc' },
          { faculty_name_th: 'asc' },
          { field_name_th: 'asc' },
        ],
      }),
      prisma.programs.count({ where }),
    ]);

    // Transform data for frontend
    const data = programs.map(program => ({
      id: program.id,
      programId: program.program_id,
      universityId: program.university_id,
      universityNameTh: program.university_name_th,
      universityNameEn: program.university_name_en,
      facultyId: program.faculty_id,
      facultyNameTh: program.faculty_name_th,
      facultyNameEn: program.faculty_name_en,
      fieldNameTh: program.field_name_th,
      fieldNameEn: program.field_name_en,
      programNameTh: program.program_name_th,
      programNameEn: program.program_name_en,
      logoUrl: program.logo_url,
      weights: program.tcas_score_weights.map(w => ({
        subjectCode: w.subject_code,
        weight: parseFloat(w.weight.toString()),
        minScore: w.min_score ? parseFloat(w.min_score.toString()) : undefined,
      })),
      cutoffHistory: program.tcas_cutoff_history.map(c => ({
        year: c.year,
        round: c.round,
        minScore: parseFloat(c.min_score.toString()),
        maxScore: c.max_score ? parseFloat(c.max_score.toString()) : undefined,
        avgScore: c.avg_score ? parseFloat(c.avg_score.toString()) : undefined,
        seats: c.seats,
        applicants: c.applicants,
      })),
    }));

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching calculator programs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch programs' },
      { status: 500 }
    );
  }
}
