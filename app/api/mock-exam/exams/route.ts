import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mock-exam/exams - List all active exams with section/question counts
export async function GET(request: NextRequest) {
  try {
    const exams = await prisma.mock_exams.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
      include: {
        sections: {
          orderBy: { section_order: "asc" },
          include: {
            _count: { select: { questions: true } },
          },
        },
        _count: { select: { attempts: true } },
      },
    });

    const data = exams.map((exam) => ({
      id: exam.id,
      title: exam.title,
      description: exam.description,
      detail_content: exam.detail_content,
      subject_code: exam.subject_code,
      exam_type: exam.exam_type,
      duration_minutes: exam.duration_minutes,
      total_score: exam.total_score,
      pass_score: exam.pass_score,
      total_questions: exam.sections.reduce(
        (sum, s) => sum + s._count.questions,
        0,
      ),
      sections: exam.sections.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        score_weight: s.score_weight,
        question_count: s._count.questions,
      })),
      attempt_count: exam._count.attempts,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 },
    );
  }
}
