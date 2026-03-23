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

// POST /api/v1/mock-exams/:examId/attempts
// Scope: write:attempts
// Header: X-Doodee-User-Id: <uuid ของ user บน doodee>
// Body: { action: "start" }   หรือ   { action: "submit", attempt_id, answers }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> },
) {
  const auth = await validateApiKey(req);
  if (authError(auth)) return withCors(auth.response);

  const scopeErr = requireScope(auth, "write:attempts");
  if (scopeErr) return withCors(scopeErr);

  const userId = extractUserId(req);
  if (!userId) return corsError("X-Doodee-User-Id header required", 400);

  const { examId } = await params;
  const id = parseInt(examId, 10);
  if (isNaN(id)) return corsError("Invalid exam ID", 400);

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  // ── Start ──
  if (action === "start") {
    const exam = await prisma.mock_exams.findUnique({
      where: { id, is_active: true },
      include: {
        sections: { include: { _count: { select: { questions: true } } } },
      },
    });
    if (!exam) return corsError("Exam not found", 404);

    const totalQuestions = exam.sections.reduce(
      (s, sec) => s + sec._count.questions,
      0,
    );
    const attempt = await prisma.mock_exam_attempts.create({
      data: {
        user_id: userId,
        exam_id: id,
        status: "in_progress",
        total_questions: totalQuestions,
      },
    });

    logUsage(
      auth.keyId,
      `/api/v1/mock-exams/${id}/attempts`,
      "POST",
      201,
      req.headers.get("x-forwarded-for"),
    );
    return corsOk(
      {
        attempt_id: attempt.id,
        status: "in_progress",
        total_questions: totalQuestions,
      },
      201,
    );
  }

  // ── Submit ──
  if (action === "submit") {
    const { attempt_id, answers, time_spent_sec } = body as {
      attempt_id: number;
      answers: Record<string, string | null>;
      time_spent_sec?: number;
    };
    if (!attempt_id || !answers)
      return corsError("attempt_id and answers required", 400);

    const attempt = await prisma.mock_exam_attempts.findFirst({
      where: {
        id: attempt_id,
        user_id: userId,
        exam_id: id,
        status: "in_progress",
      },
      include: {
        exam: {
          include: {
            sections: {
              include: {
                questions: {
                  select: { id: true, correct_answer: true, score: true },
                },
              },
            },
          },
        },
      },
    });
    if (!attempt)
      return corsError("Attempt not found or already submitted", 404);

    // ตรวจคำตอบ
    const correctMap = new Map<number, { answer: string; score: number }>();
    for (const sec of attempt.exam.sections) {
      for (const q of sec.questions) {
        correctMap.set(q.id, { answer: q.correct_answer, score: q.score });
      }
    }

    let correctCount = 0;
    let totalScore = 0;
    const answerRecords: {
      question_id: number;
      selected_answer: string | null;
      is_correct: boolean;
    }[] = [];

    for (const [qIdStr, selected] of Object.entries(answers)) {
      const qId = parseInt(qIdStr, 10);
      const correct = correctMap.get(qId);
      const isCorrect = correct ? selected === correct.answer : false;
      if (isCorrect && correct) {
        correctCount++;
        totalScore += correct.score;
      }
      answerRecords.push({
        question_id: qId,
        selected_answer: selected ?? null,
        is_correct: isCorrect,
      });
    }

    await prisma.$transaction([
      ...answerRecords.map((a) =>
        prisma.mock_exam_attempt_answers.upsert({
          where: {
            attempt_id_question_id: { attempt_id, question_id: a.question_id },
          },
          create: {
            attempt_id,
            question_id: a.question_id,
            selected_answer: a.selected_answer,
            is_correct: a.is_correct,
          },
          update: {
            selected_answer: a.selected_answer,
            is_correct: a.is_correct,
          },
        }),
      ),
      prisma.mock_exam_attempts.update({
        where: { id: attempt_id },
        data: {
          status: "completed",
          score: totalScore,
          correct_count: correctCount,
          time_spent_sec: time_spent_sec ?? 0,
          completed_at: new Date(),
        },
      }),
    ]);

    logUsage(
      auth.keyId,
      `/api/v1/mock-exams/${id}/attempts`,
      "POST",
      200,
      req.headers.get("x-forwarded-for"),
    );
    return corsOk({
      attempt_id,
      status: "completed",
      score: totalScore,
      correct_count: correctCount,
      total_questions: correctMap.size,
      percentage: Math.round((totalScore / attempt.exam.total_score) * 100),
      passed: totalScore >= attempt.exam.pass_score,
    });
  }

  return corsError("Invalid action. Use 'start' or 'submit'", 400);
}
