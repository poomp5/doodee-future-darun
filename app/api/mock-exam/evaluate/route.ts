import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { evaluateMockExam } from "@/lib/mock-exam";
import { DEFAULT_FACULTY_CRITERIA } from "@/lib/mock-exam-seed";
import type { MockExamInput, FacultyCriteria } from "@/types/mock-exam";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { examType, scores, facultyCriteria, saveScores } = body;

    if (!examType || !scores) {
      return NextResponse.json(
        { error: "examType and scores are required" },
        { status: 400 },
      );
    }

    const validExamTypes = ["TGAT", "TPAT", "A-LEVEL"];
    if (!validExamTypes.includes(examType)) {
      return NextResponse.json(
        { error: `examType must be one of: ${validExamTypes.join(", ")}` },
        { status: 400 },
      );
    }

    // Validate scores: all values must be 0-100
    for (const [subject, score] of Object.entries(scores)) {
      if (typeof score !== "number" || score < 0 || score > 100) {
        return NextResponse.json(
          {
            error: `Invalid score for ${subject}: must be a number between 0 and 100`,
          },
          { status: 400 },
        );
      }
    }

    // Resolve faculty criteria: client-provided > DB > hardcoded fallback
    let resolvedCriteria: FacultyCriteria[] = facultyCriteria;

    if (!resolvedCriteria || resolvedCriteria.length === 0) {
      const dbCriteria = await prisma.mock_exam_faculty_criteria.findMany({
        where: { is_active: true },
        orderBy: { display_order: "asc" },
      });

      if (dbCriteria.length > 0) {
        resolvedCriteria = dbCriteria.map((c) => ({
          faculty: c.faculty,
          university: c.university,
          requirements: c.requirements as any,
        }));
      } else {
        resolvedCriteria = DEFAULT_FACULTY_CRITERIA;
      }
    }

    const input: MockExamInput = {
      examType,
      scores,
      facultyCriteria: resolvedCriteria,
    };

    const result = evaluateMockExam(input);

    // Save scores to user_scores table if requested
    if (saveScores) {
      for (const [subject, score] of Object.entries(scores)) {
        await prisma.user_scores.create({
          data: {
            user_id: userId,
            subject: subject.toUpperCase(),
            score: Number(score),
            max_score: 100,
            exam_date: new Date(),
          },
        });
      }
    }

    // Persist evaluation result to mock_exam_results
    const savedResult = await prisma.mock_exam_results.create({
      data: {
        user_id: userId,
        exam_type: examType,
        scores: scores as any,
        overall_status: result.summary.overallStatus,
        analysis: result.analysis as any,
        recommendations: result.recommendations as any,
      },
    });

    return NextResponse.json({
      ...result,
      id: savedResult.id.toString(),
      saved: true,
    });
  } catch (error) {
    console.error("Mock exam evaluation error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate mock exam" },
      { status: 500 },
    );
  }
}
