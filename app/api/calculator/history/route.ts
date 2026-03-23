import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/calculator/history - Get cutoff history data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const programId = searchParams.get('programId');
    const year = searchParams.get('year');
    const round = searchParams.get('round');

    // Build where clause
    const where: any = {};

    if (programId) {
      where.program_id = parseInt(programId);
    }

    if (year) {
      where.year = parseInt(year);
    }

    if (round) {
      where.round = parseInt(round);
    }

    const history = await prisma.tcas_cutoff_history.findMany({
      where,
      include: {
        programs: {
          select: {
            id: true,
            program_id: true,
            university_name_th: true,
            faculty_name_th: true,
            field_name_th: true,
            program_name_th: true,
          },
        },
      },
      orderBy: [
        { year: 'desc' },
        { round: 'desc' },
      ],
    });

    const data = history.map(h => ({
      id: h.id,
      programId: h.program_id,
      year: h.year,
      round: h.round,
      minScore: parseFloat(h.min_score.toString()),
      maxScore: h.max_score ? parseFloat(h.max_score.toString()) : null,
      avgScore: h.avg_score ? parseFloat(h.avg_score.toString()) : null,
      seats: h.seats,
      applicants: h.applicants,
      program: h.programs ? {
        id: h.programs.id,
        programId: h.programs.program_id,
        universityNameTh: h.programs.university_name_th,
        facultyNameTh: h.programs.faculty_name_th,
        fieldNameTh: h.programs.field_name_th,
        programNameTh: h.programs.program_name_th,
      } : null,
    }));

    // Get available years for filtering
    const availableYears = await prisma.tcas_cutoff_history.findMany({
      distinct: ['year'],
      select: { year: true },
      orderBy: { year: 'desc' },
    });

    return NextResponse.json({
      success: true,
      data,
      availableYears: availableYears.map(y => y.year),
    });
  } catch (error) {
    console.error('Error fetching cutoff history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
