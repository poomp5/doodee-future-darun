import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// POST /api/mock-exam/attempts - Start a new attempt or submit answers
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { action, examId, attemptId, answers, timeSpentSec } = body;

    // ── Start new attempt ──
    if (action === "start") {
      if (!examId) {
        return NextResponse.json({ error: "examId required" }, { status: 400 });
      }

      const exam = await prisma.mock_exams.findUnique({
        where: { id: examId },
        include: {
          sections: {
            include: { _count: { select: { questions: true } } },
          },
        },
      });

      if (!exam) {
        return NextResponse.json({ error: "Exam not found" }, { status: 404 });
      }

      const totalQuestions = exam.sections.reduce((sum, s) => sum + s._count.questions, 0);

      const attempt = await prisma.mock_exam_attempts.create({
        data: {
          user_id: userId,
          exam_id: examId,
          status: "in_progress",
          total_questions: totalQuestions,
        },
      });

      return NextResponse.json({
        attemptId: attempt.id,
        status: "in_progress",
        totalQuestions,
      });
    }

    // ── Submit attempt ──
    if (action === "submit") {
      if (!attemptId || !answers) {
        return NextResponse.json({ error: "attemptId and answers required" }, { status: 400 });
      }

      // Verify attempt belongs to user
      const attempt = await prisma.mock_exam_attempts.findFirst({
        where: { id: attemptId, user_id: userId, status: "in_progress" },
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

      if (!attempt) {
        return NextResponse.json({ error: "Attempt not found or already submitted" }, { status: 404 });
      }

      // Build correct answer map
      const correctAnswerMap = new Map<number, { answer: string; score: number }>();
      for (const section of attempt.exam.sections) {
        for (const q of section.questions) {
          correctAnswerMap.set(q.id, { answer: q.correct_answer, score: q.score });
        }
      }

      // Grade answers
      let correctCount = 0;
      let totalScore = 0;
      const answerRecords: { question_id: number; selected_answer: string | null; is_correct: boolean }[] = [];

      for (const [questionIdStr, selectedAnswer] of Object.entries(answers as Record<string, string | null>)) {
        const questionId = parseInt(questionIdStr, 10);
        const correct = correctAnswerMap.get(questionId);
        const isCorrect = correct ? selectedAnswer === correct.answer : false;

        if (isCorrect && correct) {
          correctCount++;
          totalScore += correct.score;
        }

        answerRecords.push({
          question_id: questionId,
          selected_answer: selectedAnswer || null,
          is_correct: isCorrect,
        });
      }

      // Save answers + update attempt
      await prisma.$transaction([
        ...answerRecords.map((a) =>
          prisma.mock_exam_attempt_answers.upsert({
            where: {
              attempt_id_question_id: {
                attempt_id: attemptId,
                question_id: a.question_id,
              },
            },
            create: {
              attempt_id: attemptId,
              question_id: a.question_id,
              selected_answer: a.selected_answer,
              is_correct: a.is_correct,
            },
            update: {
              selected_answer: a.selected_answer,
              is_correct: a.is_correct,
            },
          })
        ),
        prisma.mock_exam_attempts.update({
          where: { id: attemptId },
          data: {
            status: "completed",
            score: totalScore,
            correct_count: correctCount,
            time_spent_sec: timeSpentSec || 0,
            completed_at: new Date(),
          },
        }),
      ]);

      return NextResponse.json({
        attemptId,
        status: "completed",
        score: totalScore,
        correctCount,
        totalQuestions: correctAnswerMap.size,
        percentage: Math.round((totalScore / attempt.exam.total_score) * 100),
        passed: totalScore >= attempt.exam.pass_score,
      });
    }

    return NextResponse.json({ error: "Invalid action. Use 'start' or 'submit'" }, { status: 400 });
  } catch (error) {
    console.error("Error with attempt:", error);
    return NextResponse.json({ error: "Failed to process attempt" }, { status: 500 });
  }
}
