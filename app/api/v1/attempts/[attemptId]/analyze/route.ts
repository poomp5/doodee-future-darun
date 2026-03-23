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

// POST /api/v1/attempts/:attemptId/analyze
// Scope: read:attempts
// Header: X-Doodee-User-Id: <uuid>
// วิเคราะห์ผลสอบด้วย AI (ใช้ Typhoon → fallback DeepSeek เหมือนเดิม)
export async function POST(
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
      where: { id, user_id: userId, status: "completed" },
      include: {
        exam: true,
        answers: {
          include: {
            question: {
              select: {
                id: true,
                question_text: true,
                choices: true,
                correct_answer: true,
                explanation: true,
                section: { select: { title: true } },
              },
            },
          },
        },
      },
    });

    if (!attempt) return corsError("Attempt not found or not completed", 404);

    // ส่ง cache กลับทันทีถ้ามีแล้ว
    if (attempt.ai_analysis) {
      logUsage(
        auth.keyId,
        `/api/v1/attempts/${id}/analyze`,
        "POST",
        200,
        req.headers.get("x-forwarded-for"),
      );
      return corsOk({ analysis: attempt.ai_analysis, cached: true });
    }

    const wrongAnswers = attempt.answers
      .filter((a) => !a.is_correct)
      .slice(0, 15)
      .map((a) => ({
        section: a.question.section.title,
        question: a.question.question_text,
        user_answer: a.selected_answer ?? "ไม่ได้ตอบ",
        correct_answer: a.question.correct_answer,
        explanation: a.question.explanation ?? "-",
      }));

    const rightCount = attempt.correct_count ?? 0;
    const totalQ = attempt.total_questions ?? 0;
    const pct = totalQ > 0 ? Math.round((rightCount / totalQ) * 100) : 0;

    const prompt = `วิเคราะห์ผลสอบ Mock Exam ของนักเรียนตามข้อมูลนี้:

ข้อสอบ: ${attempt.exam.title}
คะแนน: ${attempt.score}/${attempt.exam.total_score} (${pct}%)
ตอบถูก: ${rightCount}/${totalQ} ข้อ
เวลาที่ใช้: ${Math.round((attempt.time_spent_sec ?? 0) / 60)} นาที

ข้อที่ตอบผิด (${wrongAnswers.length} ข้อ):
${wrongAnswers
  .map(
    (w, i) => `${i + 1}. [${w.section}] ${w.question}
   คำตอบนักเรียน: ${w.user_answer} | เฉลย: ${w.correct_answer}
   อธิบาย: ${w.explanation}`,
  )
  .join("\n")}

กรุณาวิเคราะห์โดย:
1. สรุปภาพรวมผลสอบ (2-3 ประโยค)
2. จุดแข็ง - ทักษะที่ทำได้ดี
3. จุดอ่อน - ทักษะที่ต้องปรับปรุง พร้อมระบุหัวข้อเฉพาะ
4. คำแนะนำในการเตรียมตัวสอบ (3-5 ข้อ) เจาะจงและนำไปปฏิบัติได้จริง
5. ประเมินโอกาสสอบผ่านจริง (สูง/กลาง/ต่ำ) พร้อมเหตุผล

ตอบเป็นภาษาไทย ให้เป็น Markdown format`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    let analysis: string;
    try {
      // ลอง Typhoon ก่อน
      const res = await fetch(
        "https://api.opentyphoon.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.TYPHOON_API_KEY}`,
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: "typhoon-v2.5-30b-a3b-instruct",
            messages: [
              {
                role: "system",
                content:
                  "คุณเป็นผู้เชี่ยวชาญด้านการศึกษาและการสอบเข้ามหาวิทยาลัย (TCAS) ในประเทศไทย",
              },
              { role: "user", content: prompt },
            ],
            max_tokens: 4000,
            temperature: 0.7,
          }),
        },
      );
      if (!res.ok) throw new Error("Typhoon failed");
      const data = await res.json();
      analysis = data?.choices?.[0]?.message?.content;
      if (!analysis) throw new Error("Empty response");
    } catch {
      // fallback DeepSeek
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "คุณเป็นผู้เชี่ยวชาญด้านการศึกษาและการสอบเข้ามหาวิทยาลัย (TCAS) ในประเทศไทย",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      });
      if (!res.ok) throw new Error(`DeepSeek failed: ${res.status}`);
      const data = await res.json();
      analysis =
        data?.choices?.[0]?.message?.content ?? "ไม่สามารถวิเคราะห์ได้";
    } finally {
      clearTimeout(timeout);
    }

    await prisma.mock_exam_attempts.update({
      where: { id },
      data: { ai_analysis: analysis },
    });

    logUsage(
      auth.keyId,
      `/api/v1/attempts/${id}/analyze`,
      "POST",
      200,
      req.headers.get("x-forwarded-for"),
    );
    return corsOk({ analysis, cached: false });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError")
      return corsError("Analysis timed out", 408);
    return corsError("Failed to analyze", 500);
  }
}
