import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calculateGpax } from "@/lib/profile-data";

// ── Subject code normalizer ───────────────────────────────────────────────────
// user_scores stores subjects in various capitalizations; normalize to upper
const SCORE_KEY_MAP: Record<string, string> = {
  TGAT1: "TGAT1", TGAT2: "TGAT2", TGAT3: "TGAT3",
  TPAT1: "TPAT1", TPAT2: "TPAT2", TPAT3: "TPAT3", TPAT4: "TPAT4", TPAT5: "TPAT5",
  A_MATH1: "A_MATH1", A_MATH2: "A_MATH2",
  A_PHY: "A_PHY", A_CHEM: "A_CHEM", A_BIO: "A_BIO", A_SCI: "A_SCI",
  A_ENG: "A_ENG", A_THAI: "A_THAI", A_SOC: "A_SOC", A_FRLANG: "A_FRLANG",
};

const SCORE_LABELS: Record<string, string> = {
  TGAT1: "TGAT1 การสื่อสารภาษาอังกฤษ",
  TGAT2: "TGAT2 การคิดอย่างมีเหตุผล",
  TGAT3: "TGAT3 สมรรถนะการทำงาน",
  TPAT1: "TPAT1 กสพท",
  TPAT2: "TPAT2 วิศวกรรมศาสตร์",
  TPAT3: "TPAT3 วิทยาศาสตร์เทคโนโลยี",
  TPAT4: "TPAT4 สถาปัตยกรรม",
  TPAT5: "TPAT5 ครุศาสตร์",
  A_MATH1: "A-Level คณิตศาสตร์ 1",
  A_MATH2: "A-Level คณิตศาสตร์ 2",
  A_PHY: "A-Level ฟิสิกส์",
  A_CHEM: "A-Level เคมี",
  A_BIO: "A-Level ชีววิทยา",
  A_SCI: "A-Level วิทยาศาสตร์ประยุกต์",
  A_ENG: "A-Level ภาษาอังกฤษ",
  A_THAI: "A-Level ภาษาไทย",
  A_SOC: "A-Level สังคมศึกษา",
  A_FRLANG: "A-Level ภาษาต่างประเทศ",
};

export type PortfolioQuality = "excellent" | "good" | "basic" | "none";

export interface ProfileSummary {
  gpax: number | null;
  schoolType: string | null;
  schoolName: string | null;
  scores: Record<string, number>;
  scoreLabels: Record<string, string>;
  achievements: string[];
  extracurricular: string[];
  portfolioQuality: PortfolioQuality;
  portfolioCount: number;
  careerGoalField: string | null;
  careerGoalUniversities: string[];
  interestedFaculties: string[];
  hasEnoughData: boolean;
  missingItems: string[];
}

// ── Fetch & assemble profile summary from DB ─────────────────────────────────

async function fetchProfileSummary(userId: string): Promise<ProfileSummary> {
  const [
    gpaxEntries,
    educationRows,
    achievementRows,
    extracurricularRows,
    careerGoalRows,
    portfolioUploads,
    scoreRows,
    interestedFacultiesRaw,
  ] = await Promise.all([
    prisma.user_gpax_entries.findMany({ where: { user_id: userId } }),
    prisma.user_education_history.findMany({
      where: { user_id: userId },
      orderBy: [{ is_current: "desc" }, { end_year: "desc" }],
    }),
    prisma.user_achievements.findMany({ where: { user_id: userId } }),
    prisma.user_extracurricular.findMany({ where: { user_id: userId } }),
    prisma.user_career_goals.findMany({ where: { user_id: userId } }),
    prisma.portfolio_uploads.findMany({ where: { user_id: userId } }),
    prisma.user_scores.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    }),
    prisma.$queryRaw<{ field_name_th: string | null; university_name_th: string | null }[]>`
      SELECT p.field_name_th, p.university_name_th
      FROM user_interested_programs uip
      LEFT JOIN programs p ON uip.program_id = p.id
      WHERE uip.user_id = ${userId}
      LIMIT 10
    `,
  ]);

  // GPAX
  const gpax = calculateGpax(gpaxEntries.map((e) => ({ gpa: e.gpa, credits: e.credits })));

  // School info – most recent / current education
  const currentSchool = educationRows[0];
  const schoolType = currentSchool?.school_type ?? null;
  const schoolName = currentSchool?.school_name ?? null;

  // Scores – latest per subject
  const scores: Record<string, number> = {};
  const scoreLabels: Record<string, string> = {};
  for (const row of scoreRows) {
    const key = SCORE_KEY_MAP[row.subject.toUpperCase()];
    if (key && scores[key] === undefined) {
      scores[key] = Number(row.score);
      scoreLabels[key] = SCORE_LABELS[key] ?? key;
    }
  }

  // Achievements
  const achievements = achievementRows.map(
    (a) => `${a.title}${a.organization ? ` (${a.organization})` : ""}${a.achievement_level ? ` - ${a.achievement_level}` : ""}`
  );

  // Extracurricular
  const extracurricular = extracurricularRows.map(
    (e) => `${e.activity_name}${e.organization ? ` (${e.organization})` : ""}${e.role ? ` – ${e.role}` : ""}`
  );

  // Portfolio quality
  let portfolioQuality: PortfolioQuality = "none";
  const portfolioCount = portfolioUploads.length;
  if (portfolioCount > 0) {
    // Check if there's an AI analysis on any portfolio
    const analysisCount = await prisma.portfolio_analysis.count({ where: { user_id: userId } });
    if (analysisCount > 0) {
      portfolioQuality = portfolioCount >= 2 ? "excellent" : "good";
    } else {
      portfolioQuality = "basic";
    }
  }

  // Career goals
  const latestGoal = careerGoalRows[0];
  let careerGoalField: string | null = null;
  let careerGoalUniversities: string[] = [];
  if (latestGoal) {
    careerGoalField =
      (latestGoal.target_industry as string | null) ??
      ((latestGoal.target_programs as string[] | null)?.[0] ?? null);
    const rawUnis = latestGoal.target_universities;
    if (Array.isArray(rawUnis)) careerGoalUniversities = rawUnis as string[];
  }

  // Interested faculties
  const interestedFaculties = interestedFacultiesRaw
    .filter((f) => f.field_name_th || f.university_name_th)
    .map((f) => [f.field_name_th, f.university_name_th].filter(Boolean).join(" – "));

  // Missing data hints
  const missingItems: string[] = [];
  if (gpax === null) missingItems.push("GPAX (กรอกในหน้า GPAX)");
  if (!careerGoalField) missingItems.push("เป้าหมายคณะ/สาขา");

  const hasEnoughData = gpax !== null;

  return {
    gpax,
    schoolType,
    schoolName,
    scores,
    scoreLabels,
    achievements,
    extracurricular,
    portfolioQuality,
    portfolioCount,
    careerGoalField,
    careerGoalUniversities,
    interestedFaculties,
    hasEnoughData,
    missingItems,
  };
}

// ── Build AI prompt ───────────────────────────────────────────────────────────

function buildPrompt(
  profile: ProfileSummary,
  targetField: string,
  targetUniversity?: string,
  quizInsights?: string[],
  quizSummary?: string[],
  internationalFit?: "high" | "medium" | "low",
  deepQuizInsights?: string[],
  deepQuizSummary?: string[],
  isDeepAnalysis?: boolean
): string {
  const scoreLines = Object.entries(profile.scores).map(
    ([key, val]) => `  - ${profile.scoreLabels[key] ?? key}: ${val}/100`
  );

  const portfolioLabel: Record<PortfolioQuality, string> = {
    excellent: "ดีเยี่ยม (มีผลงานโดดเด่น อัปโหลดแล้ว วิเคราะห์แล้วด้วย AI)",
    good: "ดี (มีพอร์ตที่อัปโหลดแล้ว)",
    basic: "พื้นฐาน (มีไฟล์พอร์ตแต่ยังไม่ได้วิเคราะห์)",
    none: "ยังไม่มีพอร์ต",
  };

  const quizSection = quizInsights && quizInsights.length > 0
    ? "\n\nผลแบบสอบถามบุคลิกภาพและสไตล์การเรียน (โปรดนำมาประกอบการวิเคราะห์):\n" + quizInsights.map((h) => `  - ${h}`).join("\n")
    : "";

  const quizSummarySection = quizSummary && quizSummary.length > 0
    ? "\n\nสรุปคำตอบแบบสอบถาม (ใช้เพื่อเขียนคำแนะนำให้สอดคล้องกับนิสัยผู้เรียน):\n" + quizSummary.map((h) => `  - ${h}`).join("\n")
    : "";

  const internationalFitSection = internationalFit
    ? `\n\nสัญญาณความเหมาะสมภาคนานาชาติ: ${internationalFit}`
    : "";

  const deepSection = deepQuizInsights && deepQuizInsights.length > 0
    ? "\n\nแบบสอบถามเชิงลึก (วิเคราะห์ให้ละเอียดมากขึ้น ข้อมูลนี้มีน้ำหนักมากที่สุด):\n" + deepQuizInsights.map((h) => `  - ${h}`).join("\n")
    : "";

  const deepSummarySection = deepQuizSummary && deepQuizSummary.length > 0
    ? "\n\nคำตอบแบบสอบถามเชิงลึก (ใช้เขียนคำแนะนำที่เชื่อมโยงกับสไตล์การเรียนอย่างลึกซึ้ง):\n" + deepQuizSummary.map((h) => `  - ${h}`).join("\n")
    : "";

  const deepInstruction = isDeepAnalysis
    ? "\n\nคำสั่งเพิ่มเติมสำหรับการวิเคราะห์เชิงลึก: \n- ใช้ข้อมูลจากแบบสอบถามเชิงลึกเพื่อระบุสาขา/คณะที่เหมาะสมแนะนำอย่างเจาะจง (2-3 สาขา/คณะ ไม่ใช่แค่สาขาทั่วไป)\n- ระบุข้อควรระวังที่สอดคล้องกับบุคลิกภาพจากแบบสอบถามเชิงลึก (tips อย่างน้อย 2 ข้อ)\n- nextSteps ต้องมีอย่างน้อย 1 ข้อที่อ้างอิงจากสไตล์การเรียนหรือการตัดสินใจจากแบบสอบถามเชิงลึก"
    : "";

  return `คุณเป็นที่ปรึกษาการศึกษาไทยที่เชี่ยวชาญระบบ TCAS (Thai University Central Admission System) อย่างลึกซึ้ง
วิเคราะห์ข้อมูลนักเรียนต่อไปนี้และให้คำแนะนำว่าควรสมัครรอบใดใน TCAS

ข้อมูลนักเรียน:
- GPAX: ${profile.gpax != null ? profile.gpax.toFixed(2) : "ไม่ระบุ"}
- ประเภทโรงเรียน: ${profile.schoolType ?? "ไม่ระบุ"}${profile.schoolName ? ` (${profile.schoolName})` : ""}
- สาขา/คณะที่สนใจ: ${targetField}
${targetUniversity ? `- มหาวิทยาลัยเป้าหมาย: ${targetUniversity}` : ""}
${profile.interestedFaculties.length > 0 ? `- คณะที่บันทึกไว้: ${profile.interestedFaculties.slice(0, 5).join(", ")}` : ""}

คะแนนสอบ:
${scoreLines.length > 0 ? scoreLines.join("\n") : "  - ยังไม่มีคะแนนสอบในระบบ"}

พอร์ตโฟลิโอ: ${portfolioLabel[profile.portfolioQuality]} (${profile.portfolioCount} ไฟล์)
กิจกรรม/ค่าย: ${profile.extracurricular.length > 0 ? profile.extracurricular.slice(0, 5).join(", ") : "ไม่ระบุ"}
รางวัล/เกียรติบัตร: ${profile.achievements.length > 0 ? profile.achievements.slice(0, 5).join(", ") : "ไม่ระบุ"}${quizSection}${quizSummarySection}${internationalFitSection}${deepSection}${deepSummarySection}${deepInstruction}

ระบบ TCAS มี 4 รอบ:
รอบ 1 Portfolio (มกราคม–กุมภาพันธ์): สมัครด้วยพอร์ตโฟลิโอ ผลงาน กิจกรรม ความสามารถพิเศษ ไม่ต้องใช้คะแนนสอบ เหมาะกับนักเรียนที่มีผลงานโดดเด่น มีพอร์ตที่ดี มีกิจกรรมหรือรางวัลมากมาย มี GPAX สูง
รอบ 2 Quota (มีนาคม–เมษายน): โควตาพื้นที่ โรงเรียน และเครือข่าย ใช้เกณฑ์คะแนน TGAT/TPAT/A-Level ขั้นต่ำ บวกกับคุณสมบัติของโรงเรียน เหมาะกับนักเรียนที่อยู่ในโควตาพื้นที่ มี GPAX ดี หรือเรียนอยู่โรงเรียนในเครือข่าย
รอบ 3 Admission (พฤษภาคม): ใช้คะแนน TGAT/TPAT/A-Level เต็มรูปแบบ มีการแข่งขันสูงที่สุด เหมาะกับนักเรียนที่มีคะแนนสอบดีมาก
รอบ 4 Direct Admission (มิถุนายน): แต่ละมหาวิทยาลัยจัดเอง มักต้องสอบตรงหรือสัมภาษณ์ โอกาสสุดท้าย เหมาะกับผู้ที่ยังไม่ได้ที่นั่ง

ข้อกำหนดสำคัญในการให้คำแนะนำ:
- ใน "tips" และ "nextSteps" ต้องมีอย่างน้อย 1 ข้อที่อ้างอิงจากข้อมูลแบบสอบถาม
- ถ้าสัญญาณภาคนานาชาติเป็น high หรือ medium ให้ระบุคำแนะนำเกี่ยวกับหลักสูตรภาคนานาชาติอย่างชัดเจน
- ถ้าสัญญาณภาคนานาชาติเป็น low ให้ระบุขั้นตอนเตรียมความพร้อมก่อนสมัครภาคนานาชาติ

ตอบกลับในรูปแบบ JSON เท่านั้น ห้ามใส่ markdown code block (ห้ามใส่ \`\`\`json) โดยมีโครงสร้างดังนี้:
{
  "summary": "สรุปโปรไฟล์นักเรียนโดยรวม 2-3 ประโยค",
  "rounds": [
    {
      "round": 1,
      "name": "รอบ 1 Portfolio",
      "suitability": "high|medium|low",
      "score": <คะแนนความเหมาะสม 0-100>,
      "reasons": ["เหตุผลที่เหมาะหรือไม่เหมาะ 1", "เหตุผล 2"],
      "tips": ["เคล็ดลับ/สิ่งที่ควรทำ 1", "เคล็ดลับ 2"],
      "requiredItems": ["สิ่งที่ต้องเตรียม 1", "สิ่งที่ต้องเตรียม 2"]
    },
    { "round": 2, "name": "รอบ 2 Quota", "suitability": "...", "score": 0, "reasons": [], "tips": [], "requiredItems": [] },
    { "round": 3, "name": "รอบ 3 Admission", "suitability": "...", "score": 0, "reasons": [], "tips": [], "requiredItems": [] },
    { "round": 4, "name": "รอบ 4 Direct Admission", "suitability": "...", "score": 0, "reasons": [], "tips": [], "requiredItems": [] }
  ],
  "topRecommendation": <รอบที่แนะนำมากที่สุด เลข 1-4>,
  "personalMessage": "ข้อความให้กำลังใจและแนะนำส่วนตัวถึงนักเรียน 2-3 ประโยค",
  "nextSteps": ["ขั้นตอนถัดไปที่ควรทำ 1", "ขั้นตอนถัดไป 2", "ขั้นตอนถัดไป 3"]
}`;
}

// ── Shared AI caller ──────────────────────────────────────────────────────────

async function callAI(prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  const systemMsg = "คุณเป็นผู้เชี่ยวชาญระบบ TCAS และที่ปรึกษาการศึกษาไทย ตอบเป็นภาษาไทยในรูปแบบ JSON เท่านั้น ห้ามใส่ markdown code block";

  try {
    const typhoonRes = await fetch("https://api.opentyphoon.ai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.TYPHOON_API_KEY}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: "typhoon-v2.5-30b-a3b-instruct",
        messages: [{ role: "system", content: systemMsg }, { role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.4,
      }),
    });
    const d = await typhoonRes.json();
    if (typhoonRes.ok && d?.choices?.[0]?.message?.content) {
      clearTimeout(timeoutId);
      return d.choices[0].message.content as string;
    }
    throw new Error("Typhoon empty");
  } catch {
    // Fallback DeepSeek
    const deepseekRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
      signal: controller.signal,
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: systemMsg }, { role: "user", content: prompt }],
        max_tokens: 3000,
        temperature: 0.4,
      }),
    });
    clearTimeout(timeoutId);
    const d = await deepseekRes.json();
    if (deepseekRes.ok && d?.choices?.[0]?.message?.content) {
      return d.choices[0].message.content as string;
    }
    throw new Error("Both AI providers failed");
  }
}

// ── GET /api/pathfinding – return profile preview ─────────────────────────────

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const profile = await fetchProfileSummary(session.user.id);
    return NextResponse.json({ success: true, data: profile });
  } catch (error) {
    console.error("Pathfinding GET error:", error);
    return NextResponse.json({ error: "ดึงข้อมูลโปรไฟล์ไม่สำเร็จ" }, { status: 500 });
  }
}

// ── POST /api/pathfinding – run AI analysis ───────────────────────────────────

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: {
      targetField?: string;
      targetUniversity?: string;
      quizInsights?: string[];
      quizSummary?: string[];
      internationalFit?: "high" | "medium" | "low";
      deepQuizInsights?: string[];
      deepQuizSummary?: string[];
      isDeepAnalysis?: boolean;
    } = await request.json().catch(() => ({}));

    // Fetch profile from DB
    const profile = await fetchProfileSummary(session.user.id);

    // Resolve target field: override > career goal > required
    const targetField = body.targetField?.trim() || profile.careerGoalField || null;
    if (!targetField) {
      return NextResponse.json({ error: "กรุณาระบุสาขา/คณะที่สนใจ" }, { status: 400 });
    }

    const targetUniversity =
      body.targetUniversity?.trim() ||
      profile.careerGoalUniversities[0] ||
      undefined;

    const prompt = buildPrompt(
      profile,
      targetField,
      targetUniversity,
      body.quizInsights,
      body.quizSummary,
      body.internationalFit,
      body.deepQuizInsights,
      body.deepQuizSummary,
      body.isDeepAnalysis
    );

    let aiResult: string;
    try {
      aiResult = await callAI(prompt);
    } catch {
      return NextResponse.json({ error: "ไม่สามารถเชื่อมต่อกับ AI ได้ กรุณาลองใหม่อีกครั้ง" }, { status: 503 });
    }

    // Strip accidental markdown fences
    const cleaned = aiResult
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", aiResult?.substring(0, 500));
      return NextResponse.json({ error: "AI ตอบกลับในรูปแบบที่ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: parsed, profile });
  } catch (error) {
    console.error("Pathfinding POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" }, { status: 500 });
  }
}
