import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ACT_ALLOWED_ROLES = ["admin", "superadmin", "act_admin"];

async function getAuthorizedUser(session: any) {
  if (!session?.user?.id) return null;
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user;
}

// GET /api/admin/act/students
// Query params: grade, classroom, search, page, limit
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await getAuthorizedUser(session);
  if (!dbUser || !ACT_ALLOWED_ROLES.includes(dbUser.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const grade = searchParams.get("grade");
  const classroom = searchParams.get("classroom");
  const search = searchParams.get("search") || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50")));
  const skip = (page - 1) * limit;

  try {
    const where: any = {};
    if (grade) where.grade = grade;
    if (classroom) where.classroom = classroom;
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: "insensitive" } },
        { last_name: { contains: search, mode: "insensitive" } },
        { nickname: { contains: search, mode: "insensitive" } },
        { student_id: { contains: search } },
      ];
    }

    const [students, total] = await Promise.all([
      prisma.act_students.findMany({
        where,
        orderBy: [{ grade: "asc" }, { classroom: "asc" }, { student_id: "asc" }],
        skip,
        take: limit,
        select: {
          id: true,
          student_id: true,
          prefix: true,
          first_name: true,
          last_name: true,
          nickname: true,
          grade: true,
          classroom: true,
          study_plan: true,
          academic_year: true,
          email: true,
        },
      }),
      prisma.act_students.count({ where }),
    ]);

    return NextResponse.json({
      data: students,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching ACT students:", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}
