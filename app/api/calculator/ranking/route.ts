import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { evaluateRanking } from '@/lib/tcas-calculator';
import type { ProgramInfo, UserScores } from '@/types/tcas-calculator';

// POST /api/calculator/ranking - Evaluate a ranked list of programs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      scores,
      rankedProgramIds,
      compareYear,
      compareRound,
    }: {
      scores: UserScores;
      rankedProgramIds: number[];
      compareYear?: number;
      compareRound?: number;
    } = body;

    if (!scores || typeof scores !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid scores format' },
        { status: 400 }
      );
    }

    if (!rankedProgramIds || !Array.isArray(rankedProgramIds) || rankedProgramIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Ranked program IDs are required' },
        { status: 400 }
      );
    }

    if (rankedProgramIds.length > 10) {
      return NextResponse.json(
        { success: false, error: 'Maximum 10 programs allowed' },
        { status: 400 }
      );
    }

    // Fetch programs with weights and cutoff history
    const programs = await prisma.programs.findMany({
      where: {
        id: { in: rankedProgramIds },
      },
      include: {
        tcas_score_weights: true,
        tcas_cutoff_history: {
          orderBy: [
            { year: 'desc' },
            { round: 'desc' },
          ],
        },
      },
    });

    // Transform to ProgramInfo format
    const programInfos: ProgramInfo[] = programs.map(program => ({
      id: program.id,
      programId: program.program_id || undefined,
      universityNameTh: program.university_name_th || undefined,
      universityNameEn: program.university_name_en || undefined,
      facultyNameTh: program.faculty_name_th || undefined,
      facultyNameEn: program.faculty_name_en || undefined,
      fieldNameTh: program.field_name_th || undefined,
      fieldNameEn: program.field_name_en || undefined,
      programNameTh: program.program_name_th || undefined,
      programNameEn: program.program_name_en || undefined,
      logoUrl: program.logo_url || undefined,
      weights: program.tcas_score_weights.map(w => ({
        subjectCode: w.subject_code as any,
        weight: parseFloat(w.weight.toString()),
        minScore: w.min_score ? parseFloat(w.min_score.toString()) : undefined,
      })),
      cutoffHistory: program.tcas_cutoff_history.map(c => ({
        year: c.year,
        round: c.round,
        minScore: parseFloat(c.min_score.toString()),
        maxScore: c.max_score ? parseFloat(c.max_score.toString()) : undefined,
        avgScore: c.avg_score ? parseFloat(c.avg_score.toString()) : undefined,
        seats: c.seats || undefined,
        applicants: c.applicants || undefined,
      })),
    }));

    // Evaluate the ranking
    const evaluation = evaluateRanking(
      scores,
      rankedProgramIds,
      programInfos,
      compareYear,
      compareRound
    );

    return NextResponse.json({
      success: true,
      data: evaluation,
    });
  } catch (error) {
    console.error('Error evaluating ranking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to evaluate ranking' },
      { status: 500 }
    );
  }
}
