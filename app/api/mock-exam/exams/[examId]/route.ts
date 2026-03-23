import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mock-exam/exams/[examId] - Get full exam with all questions (for taking)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params;
    const id = parseInt(examId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid exam ID" }, { status: 400 });
    }

    const exam = await prisma.mock_exams.findUnique({
      where: { id, is_active: true },
      include: {
        sections: {
          orderBy: { section_order: "asc" },
          include: {
            passages: {
              orderBy: { passage_order: "asc" },
            },
            questions: {
              orderBy: { question_order: "asc" },
              select: {
                id: true,
                section_id: true,
                passage_id: true,
                question_text: true,
                question_type: true,
                choices: true,
                question_order: true,
                score: true,
                // NOTE: correct_answer and explanation are NOT included (hidden during exam)
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ error: "Exam not found" }, { status: 404 });
    }

    return NextResponse.json({ data: exam });
  } catch (error) {
    console.error("Error fetching exam:", error);
    return NextResponse.json({ error: "Failed to fetch exam" }, { status: 500 });
  }
}
