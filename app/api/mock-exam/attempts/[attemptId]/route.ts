import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/mock-exam/attempts/[attemptId] - Get attempt result with all answers + correct answers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attemptId } = await params;
    const id = parseInt(attemptId, 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid attempt ID" }, { status: 400 });
    }

    const attempt = await prisma.mock_exam_attempts.findFirst({
      where: { id, user_id: session.user.id },
      include: {
        exam: {
          include: {
            sections: {
              orderBy: { section_order: "asc" },
              include: {
                passages: { orderBy: { passage_order: "asc" } },
                questions: {
                  orderBy: { question_order: "asc" },
                  select: {
                    id: true,
                    section_id: true,
                    passage_id: true,
                    question_text: true,
                    question_type: true,
                    choices: true,
                    correct_answer: true,
                    explanation: true,
                    question_order: true,
                    score: true,
                  },
                },
              },
            },
          },
        },
        answers: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // Build answer map for quick lookup
    const answerMap = new Map(
      attempt.answers.map((a) => [a.question_id, { selected: a.selected_answer, correct: a.is_correct }])
    );

    // Build section-level stats
    const sectionStats = attempt.exam.sections.map((section) => {
      let correct = 0;
      let total = section.questions.length;
      for (const q of section.questions) {
        const ans = answerMap.get(q.id);
        if (ans?.correct) correct++;
      }
      return {
        sectionId: section.id,
        title: section.title,
        correct,
        total,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      };
    });

    return NextResponse.json({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        score: attempt.score,
        correctCount: attempt.correct_count,
        totalQuestions: attempt.total_questions,
        timeSpentSec: attempt.time_spent_sec,
        aiAnalysis: attempt.ai_analysis,
        startedAt: attempt.started_at,
        completedAt: attempt.completed_at,
      },
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        totalScore: attempt.exam.total_score,
        passScore: attempt.exam.pass_score,
        sections: attempt.exam.sections.map((section) => ({
          ...section,
          questions: section.questions.map((q) => ({
            ...q,
            userAnswer: answerMap.get(q.id)?.selected || null,
            isCorrect: answerMap.get(q.id)?.correct || false,
          })),
        })),
      },
      sectionStats,
    });
  } catch (error) {
    console.error("Error fetching attempt:", error);
    return NextResponse.json({ error: "Failed to fetch attempt" }, { status: 500 });
  }
}
