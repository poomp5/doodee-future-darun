import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateApiKey,
  requireScope,
  logUsage,
  authError,
} from "@/lib/api-key";
import { OPTIONS, corsOk, corsError, withCors } from "@/lib/cors";

export { OPTIONS };

// GET /api/v1/mock-exams
// Scope: read:exams
// ดึงรายการข้อสอบทั้งหมดที่ active (ไม่รวมเฉลย)
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (authError(auth)) return withCors(auth.response);

  const scopeErr = requireScope(auth, "read:exams");
  if (scopeErr) return withCors(scopeErr);

  try {
    const exams = await prisma.mock_exams.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
      include: {
        sections: {
          orderBy: { section_order: "asc" },
          include: { _count: { select: { questions: true } } },
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
        (s, sec) => s + sec._count.questions,
        0,
      ),
      attempt_count: exam._count.attempts,
      sections: exam.sections.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        section_order: s.section_order,
        score_weight: s.score_weight,
        question_count: s._count.questions,
      })),
    }));

    logUsage(
      auth.keyId,
      "/api/v1/mock-exams",
      "GET",
      200,
      req.headers.get("x-forwarded-for"),
    );
    return corsOk({ data });
  } catch {
    logUsage(
      auth.keyId,
      "/api/v1/mock-exams",
      "GET",
      500,
      req.headers.get("x-forwarded-for"),
    );
    return corsError("Failed to fetch exams", 500);
  }
}
