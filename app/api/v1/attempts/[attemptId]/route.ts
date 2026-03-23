import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateApiKey,
  requireScope,
  extractUserId,
  logUsage,
  authError,
} from "@/lib/api-key";
import { OPTIONS, corsOk, corsError, withCors } from "@/lib/cors";

export { OPTIONS };

// GET /api/v1/attempts/:attemptId
// Scope: read:attempts
// Header: X-Doodee-User-Id: <uuid>
// ดึงผลสอบพร้อมเฉลย (หลัง submit แล้ว)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  const auth = await validateApiKey(req);
  if (authError(auth)) return withCors(auth.response);

  const scopeErr = requireScope(auth, "read:attempts");
  if (scopeErr) return withCors(scopeErr);

  const userId = extractUserId(req);
  if (!userId) return corsError("X-Doodee-User-Id header required", 400);

  const { attemptId } = await params;
  const id = parseInt(attemptId, 10);
  if (isNaN(id)) return corsError("Invalid attempt ID", 400);

  try {
    const attempt = await prisma.mock_exam_attempts.findFirst({
      where: { id, user_id: userId },
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

    if (!attempt) return corsError("Attempt not found", 404);

    const answerMap = new Map(
      attempt.answers.map((a) => [
        a.question_id,
        { selected: a.selected_answer, is_correct: a.is_correct },
      ]),
    );

    const sectionStats = attempt.exam.sections.map((sec) => {
      let correct = 0;
      const total = sec.questions.length;
      for (const q of sec.questions) {
        if (answerMap.get(q.id)?.is_correct) correct++;
      }
      return {
        section_id: sec.id,
        title: sec.title,
        correct,
        total,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
      };
    });

    logUsage(
      auth.keyId,
      `/api/v1/attempts/${id}`,
      "GET",
      200,
      req.headers.get("x-forwarded-for"),
    );
    return corsOk({
      attempt: {
        id: attempt.id,
        status: attempt.status,
        score: attempt.score,
        correct_count: attempt.correct_count,
        total_questions: attempt.total_questions,
        time_spent_sec: attempt.time_spent_sec,
        ai_analysis: attempt.ai_analysis,
        started_at: attempt.started_at,
        completed_at: attempt.completed_at,
      },
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        total_score: attempt.exam.total_score,
        pass_score: attempt.exam.pass_score,
        sections: attempt.exam.sections.map((sec) => ({
          ...sec,
          questions: sec.questions.map((q) => ({
            ...q,
            user_answer: answerMap.get(q.id)?.selected ?? null,
            is_correct: answerMap.get(q.id)?.is_correct ?? false,
          })),
        })),
      },
      section_stats: sectionStats,
    });
  } catch {
    return corsError("Failed to fetch attempt", 500);
  }
}
