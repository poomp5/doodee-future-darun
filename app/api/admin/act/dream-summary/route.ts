import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ACT_ROLES = ["admin", "superadmin", "act_admin"];

// GET /api/admin/act/dream-summary
// Returns summary: total students, registered count, dream faculty selection stats
export async function GET() {
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

  // Total ACT students
  const totalStudents = await prisma.act_students.count();

  // Students registered in Doodee (email matches student.act.ac.th pattern)
  const registeredUsers = await prisma.users.findMany({
    where: { email: { endsWith: "@student.act.ac.th" } },
    select: { id: true, email: true },
  });
  const registeredCount = registeredUsers.length;

  // Use subquery to avoid passing arrays to raw SQL
  const ACT_EMAIL_SUFFIX = "@student.act.ac.th";

  // Among registered ACT users, how many have selected at least 1 dream faculty
  const usersWithDreams: { user_id: string }[] = await prisma.$queryRaw`
    SELECT DISTINCT uip.user_id
    FROM user_interested_programs uip
    WHERE uip.user_id IN (
      SELECT id::text FROM users WHERE email LIKE ${"%" + ACT_EMAIL_SUFFIX}
    )
  `;
  const withDreamsCount = usersWithDreams.length;
  const withoutDreamsCount = registeredCount - withDreamsCount;

  // Top programs chosen by ACT students
  const topPrograms: any[] = await prisma.$queryRaw`
    SELECT
      p.id as program_id,
      p.university_name_th,
      p.faculty_name_th,
      p.field_name_th,
      p.program_name_th,
      p.logo_url,
      COUNT(*) as pick_count,
      COUNT(CASE WHEN uip.priority = 1 THEN 1 END) as first_choice_count
    FROM user_interested_programs uip
    LEFT JOIN programs p ON uip.program_id = p.id
    WHERE uip.user_id IN (
      SELECT id::text FROM users WHERE email LIKE ${"%" + ACT_EMAIL_SUFFIX}
    )
    GROUP BY p.id, p.university_name_th, p.faculty_name_th, p.field_name_th, p.program_name_th, p.logo_url
    ORDER BY first_choice_count DESC, pick_count DESC
    LIMIT 20
  `;

  // Students without dream faculty selection (registered but no picks)
  const userIdsWithDreams = new Set(usersWithDreams.map((u) => u.user_id));
  const registeredWithoutDreams = registeredUsers.filter(
    (u) => !userIdsWithDreams.has(u.id)
  );
  const studentIdsWithoutDreams = registeredWithoutDreams
    .map((u) => u.email?.split("@")[0])
    .filter(Boolean) as string[];

  const studentsWithoutDreams =
    studentIdsWithoutDreams.length > 0
      ? await prisma.act_students.findMany({
          where: { student_id: { in: studentIdsWithoutDreams } },
          select: {
            student_id: true,
            prefix: true,
            first_name: true,
            last_name: true,
            nickname: true,
            grade: true,
            classroom: true,
          },
          orderBy: [{ grade: "asc" }, { classroom: "asc" }, { first_name: "asc" }],
        })
      : [];

  return NextResponse.json({
    data: {
      totalStudents,
      registeredCount,
      withDreamsCount,
      withoutDreamsCount,
      notRegisteredCount: totalStudents - registeredCount,
      topPrograms: topPrograms.map((p) => ({
        ...p,
        pick_count: Number(p.pick_count),
        first_choice_count: Number(p.first_choice_count),
      })),
      studentsWithoutDreams,
    },
  });
}
