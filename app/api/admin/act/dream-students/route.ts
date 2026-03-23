import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma";

const ACT_ROLES = ["admin", "superadmin", "act_admin"];
const ACT_EMAIL_SUFFIX = "@student.act.ac.th";

// GET /api/admin/act/dream-students
// Returns registered ACT students with their dream faculty status
// Query params: grade, classroom, search, status (selected|not_selected), page, limit
export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const grade = searchParams.get("grade") || "";
  const classroom = searchParams.get("classroom") || "";
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") || "50"));
  const offset = (page - 1) * limit;

  // Build WHERE clauses dynamically
  const conditions: Prisma.Sql[] = [
    Prisma.sql`u.email LIKE ${"%" + ACT_EMAIL_SUFFIX}`,
  ];

  if (grade) conditions.push(Prisma.sql`s.grade = ${grade}`);
  if (classroom) conditions.push(Prisma.sql`s.classroom ILIKE ${"%" + classroom + "%"}`);
  if (search) {
    const q = "%" + search + "%";
    conditions.push(
      Prisma.sql`(s.first_name ILIKE ${q} OR s.last_name ILIKE ${q} OR s.student_id ILIKE ${q} OR s.nickname ILIKE ${q})`
    );
  }

  const whereClause = Prisma.join(conditions, " AND ");

  const havingClause =
    status === "selected"
      ? Prisma.sql`HAVING COUNT(uip.id) > 0`
      : status === "not_selected"
      ? Prisma.sql`HAVING COUNT(uip.id) = 0`
      : Prisma.sql``;

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw`
      SELECT
        u.id::text AS user_id,
        u.email,
        u.full_name,
        u.profile_image_url,
        s.student_id,
        s.prefix,
        s.first_name,
        s.last_name,
        s.nickname,
        s.grade,
        s.classroom,
        s.study_plan,
        COUNT(uip.id)::int AS dream_count
      FROM users u
      INNER JOIN act_students s ON s.student_id = SPLIT_PART(u.email, '@', 1)
      LEFT JOIN user_interested_programs uip ON uip.user_id = u.id::text
      WHERE ${whereClause}
      GROUP BY u.id, u.email, u.full_name, u.profile_image_url,
               s.student_id, s.prefix, s.first_name, s.last_name,
               s.nickname, s.grade, s.classroom, s.study_plan
      ${havingClause}
      ORDER BY s.grade ASC, s.classroom ASC, s.first_name ASC
      LIMIT ${limit} OFFSET ${offset}
    `,
    prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM (
        SELECT u.id
        FROM users u
        INNER JOIN act_students s ON s.student_id = SPLIT_PART(u.email, '@', 1)
        LEFT JOIN user_interested_programs uip ON uip.user_id = u.id::text
        WHERE ${whereClause}
        GROUP BY u.id
        ${havingClause}
      ) sub
    `,
  ]);

  const total: number = countRows[0]?.total ?? 0;
  const pages = Math.ceil(total / limit);

  return NextResponse.json({
    data: rows,
    pagination: { page, pages, total, limit },
  });
}
