import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

async function callTyphoon(prompt: string, signal: AbortSignal) {
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
        {
          role: "system",
          content:
            "You are a Thai education advisor specializing in student talent matching for scholarships, exchange programs, and quota admissions. Always respond in Thai with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 6000,
      temperature: 0.6,
    }),
  });
  if (!response.ok) throw new Error(`Typhoon ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Typhoon empty");
  return content;
}

async function callDeepSeek(prompt: string, signal: AbortSignal) {
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
        {
          role: "system",
          content:
            "You are a Thai education advisor specializing in student talent matching for scholarships, exchange programs, and quota admissions. Always respond in Thai with valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 6000,
      temperature: 0.6,
    }),
  });
  if (!response.ok) throw new Error(`DeepSeek ${response.status}`);
  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("DeepSeek empty");
  return content;
}

function buildPrompt(profile: any): string {
  const {
    user,
    skills,
    achievements,
    extracurricular,
    interests,
    careerGoals,
    education,
  } = profile;

  return `คุณคือที่ปรึกษาด้านการศึกษาไทยที่เชี่ยวชาญการจับคู่โอกาส (Talent Pipeline Matching)

## ข้อมูลนักเรียน
- ชื่อ: ${user.full_name || user.first_name || "ไม่ระบุ"}
- GPAX: ${user.gpax || "ไม่ระบุ"}
- จังหวัด/สถานที่: ${education?.[0]?.location || "ไม่ระบุ"}
- โรงเรียน: ${education?.map((e: any) => e.school_name).join(", ") || "ไม่ระบุ"}

## ทักษะ
${skills?.length > 0 ? skills.map((s: any) => `- ${s.skill_name} (${s.skill_category || "ทั่วไป"}) ระดับ: ${s.proficiency_level || "ไม่ระบุ"}`).join("\n") : "ไม่มีข้อมูลทักษะ"}

## ผลงานและรางวัล
${achievements?.length > 0 ? achievements.map((a: any) => `- ${a.title} (${a.achievement_type}) ระดับ: ${a.achievement_level || "ไม่ระบุ"} จากองค์กร: ${a.organization || "ไม่ระบุ"}`).join("\n") : "ไม่มีข้อมูลผลงาน"}

## กิจกรรมนอกหลักสูตร
${extracurricular?.length > 0 ? extracurricular.map((e: any) => `- ${e.activity_name} (${e.activity_type || "ไม่ระบุประเภท"}) บทบาท: ${e.role || "ไม่ระบุ"}`).join("\n") : "ไม่มีข้อมูลกิจกรรม"}

## ความสนใจ
${interests?.length > 0 ? interests.map((i: any) => `- ${i.interest_name} (${i.interest_category}) ระดับ: ${i.intensity_level || 5}/10`).join("\n") : "ไม่มีข้อมูลความสนใจ"}

## เป้าหมายการศึกษา
${careerGoals?.length > 0 ? careerGoals.map((g: any) => `- เป้าหมาย: ${g.primary_goal}, อุตสาหกรรม: ${g.target_industry || "ไม่ระบุ"}`).join("\n") : "ไม่มีข้อมูลเป้าหมาย"}

## คำสั่ง
จากข้อมูลนักเรียนข้างต้น ให้วิเคราะห์และจับคู่โอกาสที่เหมาะสม โดยเน้น:
1. **โควตา** - โควตาพื้นที่/จังหวัด, โควตาความสามารถพิเศษ (ดนตรี, กีฬา, ศิลปะ, วิชาการ)
2. **ทุนแลกเปลี่ยน** - ทุนรัฐบาล, ทุนเอกชน, โครงการแลกเปลี่ยนนักเรียน
3. **โครงการพิเศษ** - โครงการส่งเสริมความสามารถพิเศษ, โอลิมปิก, การแข่งขันระดับชาติ/นานาชาติ

ตอบในรูปแบบ JSON เท่านั้น ดังนี้:
{
  "summary": "สรุปโปรไฟล์นักเรียน 2-3 ประโยค",
  "talentStrengths": ["จุดแข็งหลักที่โดดเด่น 1", "จุดแข็ง 2", "จุดแข็ง 3"],
  "matches": [
    {
      "id": "1",
      "type": "quota|scholarship|exchange|competition",
      "title": "ชื่อโอกาส/โครงการ",
      "organization": "หน่วยงานหรือมหาวิทยาลัย",
      "description": "รายละเอียดโอกาสนี้ 2-3 ประโยค",
      "matchScore": 85,
      "matchReasons": ["เหตุผลที่ 1 ที่เหมาะสม", "เหตุผลที่ 2"],
      "requirements": ["คุณสมบัติที่ต้องการ 1", "คุณสมบัติ 2"],
      "howToApply": "วิธีการสมัครโดยสังเขป",
      "deadline": "ช่วงเวลาการสมัคร (เช่น ต.ค.-พ.ย. ของทุกปี)",
      "tags": ["tag1", "tag2"],
      "difficulty": "low|medium|high"
    }
  ],
  "actionPlan": [
    {
      "step": 1,
      "action": "สิ่งที่ควรทำ",
      "timeframe": "ระยะเวลา",
      "priority": "high|medium|low"
    }
  ],
  "profileGaps": ["สิ่งที่ควรเพิ่มเติมในโปรไฟล์เพื่อเพิ่มโอกาส"]
}

ให้ matches อย่างน้อย 5 รายการที่เป็นจริงและมีอยู่จริงในประเทศไทยหรือนานาชาติ`;
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, skills, achievements, extracurricular, interests, careerGoals, education] =
      await Promise.all([
        prisma.users.findUnique({ where: { id: userId } }),
        prisma.user_skills.findMany({ where: { user_id: userId } }),
        prisma.user_achievements.findMany({ where: { user_id: userId } }),
        prisma.user_extracurricular.findMany({ where: { user_id: userId } }),
        prisma.user_interests.findMany({ where: { user_id: userId } }),
        prisma.user_career_goals.findMany({ where: { user_id: userId } }),
        prisma.user_education_history.findMany({ where: { user_id: userId } }),
      ]);

    const profile = { user, skills, achievements, extracurricular, interests, careerGoals, education };
    const prompt = buildPrompt(profile);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    let rawContent = "";
    let provider = "";

    try {
      rawContent = await callTyphoon(prompt, controller.signal);
      provider = "typhoon";
    } catch {
      try {
        rawContent = await callDeepSeek(prompt, controller.signal);
        provider = "deepseek";
      } catch (err) {
        clearTimeout(timeoutId);
        return NextResponse.json({ error: "AI providers unavailable" }, { status: 503 });
      }
    }

    clearTimeout(timeoutId);

    // Extract JSON from response
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 });
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      ...result,
      provider,
      profileCompleteness: {
        hasSkills: skills.length > 0,
        hasAchievements: achievements.length > 0,
        hasExtracurricular: extracurricular.length > 0,
        hasInterests: interests.length > 0,
        hasCareerGoals: careerGoals.length > 0,
        hasEducation: education.length > 0,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timed out" }, { status: 408 });
    }
    console.error("Talent pipeline error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
