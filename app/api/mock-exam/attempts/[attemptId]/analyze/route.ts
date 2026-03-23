import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function callAI(prompt: string, signal: AbortSignal) {
  // Try Typhoon first
  try {
    const response = await fetch("https://api.opentyphoon.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.TYPHOON_API_KEY}`,
      },
      signal,
      body: JSON.stringify({
        model: "typhoon-v2.5-30b-a3b-instruct",
        messages: [
          { role: "system", content: "คุณเป็นผู้เชี่ยวชาญด้านการศึกษาและการสอบเข้ามหาวิทยาลัย (TCAS) ในประเทศไทย ตอบเป็นภาษาไทย ให้คำแนะนำที่เป็นประโยชน์และเจาะจง" },
          { role: "user", content: prompt },
        ],
        max_tokens: 4000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) throw new Error(`Typhoon failed: ${response.status}`);
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty Typhoon response");
    return content;
  } catch (err) {
    console.warn("Typhoon failed, trying DeepSeek:", err);
  }

  // Fallback to DeepSeek
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    signal,
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "คุณเป็นผู้เชี่ยวชาญด้านการศึกษาและการสอบเข้ามหาวิทยาลัย (TCAS) ในประเทศไทย ตอบเป็นภาษาไทย ให้คำแนะนำที่เป็นประโยชน์และเจาะจง" },
        { role: "user", content: prompt },
      ],
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) throw new Error(`DeepSeek failed: ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "ไม่สามารถวิเคราะห์ได้";
}

// POST /api/mock-exam/attempts/[attemptId]/analyze - AI analysis of exam results
export async function POST(
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

    const attempt = await prisma.mock_exam_attempts.findFirst({
      where: { id, user_id: session.user.id, status: "completed" },
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

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // If already analyzed, return cached result
    if (attempt.ai_analysis) {
      return NextResponse.json({ analysis: attempt.ai_analysis, cached: true });
    }

    // Build prompt
    const wrongAnswers = attempt.answers
      .filter((a) => !a.is_correct)
      .map((a) => ({
        section: a.question.section.title,
        question: a.question.question_text,
        userAnswer: a.selected_answer,
        correctAnswer: a.question.correct_answer,
        explanation: a.question.explanation,
      }));

    const rightCount = attempt.correct_count || 0;
    const totalQ = attempt.total_questions || 0;
    const percentage = totalQ > 0 ? Math.round((rightCount / totalQ) * 100) : 0;

    const prompt = `วิเคราะห์ผลสอบ Mock Exam ของนักเรียนตามข้อมูลนี้:

ข้อสอบ: ${attempt.exam.title}
คะแนน: ${attempt.score}/${attempt.exam.total_score} (${percentage}%)
ตอบถูก: ${rightCount}/${totalQ} ข้อ
เวลาที่ใช้: ${Math.round((attempt.time_spent_sec || 0) / 60)} นาที

ข้อที่ตอบผิด (${wrongAnswers.length} ข้อ):
${wrongAnswers.slice(0, 15).map((w, i) => `${i + 1}. [${w.section}] ${w.question}
   คำตอบนักเรียน: ${w.userAnswer || 'ไม่ได้ตอบ'} | เฉลย: ${w.correctAnswer}
   อธิบาย: ${w.explanation || '-'}`).join('\n')}

กรุณาวิเคราะห์โดย:
1. สรุปภาพรวมผลสอบ (2-3 ประโยค)
2. จุดแข็ง - ทักษะที่ทำได้ดี
3. จุดอ่อน - ทักษะที่ต้องปรับปรุง พร้อมระบุหัวข้อเฉพาะ
4. คำแนะนำในการเตรียมตัวสอบ (3-5 ข้อ) เจาะจงและนำไปปฏิบัติได้จริง
5. ประเมินโอกาสสอบผ่านจริง (สูง/กลาง/ต่ำ) พร้อมเหตุผล

ตอบเป็นภาษาไทย ให้เป็น Markdown format`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const analysis = await callAI(prompt, controller.signal);
    clearTimeout(timeoutId);

    // Cache the analysis
    await prisma.mock_exam_attempts.update({
      where: { id },
      data: { ai_analysis: analysis },
    });

    return NextResponse.json({ analysis, cached: false });
  } catch (error) {
    console.error("AI analysis error:", error);
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Analysis timed out" }, { status: 408 });
    }
    return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
  }
}
