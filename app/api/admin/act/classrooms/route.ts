import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ACT_ALLOWED_ROLES = ["admin", "superadmin", "act_admin"];

// GET /api/admin/act/classrooms
// Returns distinct classrooms grouped by grade
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUser = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!dbUser || !ACT_ALLOWED_ROLES.includes(dbUser.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await prisma.act_students.findMany({
    where: { classroom: { not: null } },
    select: { grade: true, classroom: true },
    distinct: ["grade", "classroom"],
    orderBy: [{ grade: "asc" }, { classroom: "asc" }],
  });

  // Group by grade: { "4": ["ม.4/1","ม.4/2",...], "5": [...], "6": [...] }
  const grouped: Record<string, string[]> = {};
  for (const row of rows) {
    if (!row.grade || !row.classroom) continue;
    if (!grouped[row.grade]) grouped[row.grade] = [];
    grouped[row.grade].push(row.classroom);
  }

  return NextResponse.json({ data: grouped });
}
