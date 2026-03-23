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

// GET /api/v1/mock-exams/:examId
// Scope: read:exams
// ดึงข้อมูลข้อสอบพร้อม passage + คำถาม (ไม่รวม correct_answer และ explanation)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ examId: string }> },
) {
  const auth = await validateApiKey(req);
  if (authError(auth)) return withCors(auth.response);

  const scopeErr = requireScope(auth, "read:exams");
  if (scopeErr) return withCors(scopeErr);

  const { examId } = await params;
  const id = parseInt(examId, 10);
  if (isNaN(id)) return corsError("Invalid exam ID", 400);

  try {
    const exam = await prisma.mock_exams.findUnique({
      where: { id, is_active: true },
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
                question_order: true,
                score: true,
                // correct_answer และ explanation ถูกซ่อนไว้
              },
            },
          },
        },
      },
    });

    if (!exam) return corsError("Exam not found", 404);

    logUsage(
      auth.keyId,
      `/api/v1/mock-exams/${id}`,
      "GET",
      200,
      req.headers.get("x-forwarded-for"),
    );
    return corsOk({ data: exam });
  } catch {
    return corsError("Failed to fetch exam", 500);
  }
}
