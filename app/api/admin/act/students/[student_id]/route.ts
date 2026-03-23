import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ACT_ROLES = ["admin", "superadmin", "act_admin"];

function serializeForJson<T>(value: T): T {
  if (typeof value === "bigint") {
    return Number(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => serializeForJson(item)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nestedValue]) => [
        key,
        serializeForJson(nestedValue),
      ]),
    ) as T;
  }

  return value;
}

function splitNameParts(user: {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;
}) {
  const firstName = user.first_name?.trim();
  const lastName = user.last_name?.trim();

  if (firstName || lastName) {
    return {
      first_name: firstName || "-",
      last_name: lastName || "",
    };
  }

  const parts = user.full_name?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    first_name: parts[0] || "-",
    last_name: parts.slice(1).join(" "),
  };
}

// GET /api/admin/act/students/[student_id]
// Returns full student profile: act_students record + linked doodee user (dream faculties, portfolio)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ student_id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!dbUser || !ACT_ROLES.includes(dbUser.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { student_id } = await params;

  // 1. ACT student record
  const studentRecord = await prisma.act_students.findUnique({
    where: { student_id },
  });

  // 2. Linked doodee user (support both student and staff ACT domains)
  const candidateEmails = [
    `${student_id}@student.act.ac.th`,
    `${student_id}@act.ac.th`,
  ];
  const doodeeUser = await prisma.users.findFirst({
    where: { email: { in: candidateEmails } },
    select: {
      id: true,
      email: true,
      full_name: true,
      first_name: true,
      last_name: true,
      profile_image_url: true,
      username: true,
      created_at: true,
    },
  });

  if (!studentRecord && !doodeeUser) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const fallbackName = doodeeUser ? splitNameParts(doodeeUser) : null;
  const student =
    studentRecord ??
    {
      id: null,
      student_id,
      prefix: null,
      first_name: fallbackName?.first_name || "-",
      last_name: fallbackName?.last_name || "",
      nickname: null,
      grade: null,
      classroom: null,
      study_plan: null,
      academic_year: null,
      email: doodeeUser?.email || null,
      created_at: doodeeUser?.created_at || null,
      updated_at: doodeeUser?.created_at || null,
    };

  // 3. Dream faculties (top 3 by priority) - only if user exists
  let dreamFaculties: any[] = [];
  if (doodeeUser) {
    dreamFaculties = await prisma.$queryRaw`
      SELECT
        uip.id,
        uip.priority,
        p.university_name_th,
        p.university_name_en,
        p.faculty_name_th,
        p.faculty_name_en,
        p.field_name_th,
        p.field_name_en,
        p.program_name_th,
        p.program_name_en,
        p.logo_url,
        p.major_acceptance_number as program_total_seats,
        p.number_acceptance_mko2 as r1_admission_quota
      FROM user_interested_programs uip
      LEFT JOIN programs p ON uip.program_id = p.id
      WHERE uip.user_id = ${doodeeUser.id}::text
      ORDER BY uip.priority ASC
      LIMIT 3
    `;
  }

  // 4. Portfolio uploads - latest 5
  let portfolios: any[] = [];
  if (doodeeUser) {
    portfolios = await prisma.portfolio_uploads.findMany({
      where: { user_id: doodeeUser.id },
      orderBy: { created_at: "desc" },
      take: 5,
      select: {
        id: true,
        portfolio_name: true,
        file_url: true,
        thumbnail_url: true,
        template_type: true,
        file_size: true,
        status: true,
        created_at: true,
      },
    });
  }

  // 5. Portfolio analyses - latest 3
  let analyses: any[] = [];
  if (doodeeUser) {
    analyses = await prisma.portfolio_analysis.findMany({
      where: { user_id: doodeeUser.id },
      orderBy: { analyzed_at: "desc" },
      take: 3,
      select: {
        id: true,
        strengths: true,
        weaknesses: true,
        subject_scores: true,
        recommended_faculties: true,
        recommended_courses: true,
        advice: true,
        analyzed_at: true,
        file_url: true,
      },
    });
  }

  return NextResponse.json(
    serializeForJson({
      data: {
        student,
        doodeeUser,
        dreamFaculties,
        portfolios,
        analyses,
      },
    }),
  );
}
