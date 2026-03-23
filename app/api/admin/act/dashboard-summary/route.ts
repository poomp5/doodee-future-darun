import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

const ACT_ROLES = ["admin", "superadmin", "act_admin"];
const ACT_EMAIL_SUFFIX = "@student.act.ac.th";

function normalizeGrade(grade: string | null | undefined) {
  const trimmed = grade?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "ประถม";
}

function sortGrades(a: string, b: string) {
  const aNum = Number(a);
  const bNum = Number(b);

  if (Number.isFinite(aNum) && Number.isFinite(bNum)) {
    return aNum - bNum;
  }
  if (Number.isFinite(aNum)) return -1;
  if (Number.isFinite(bNum)) return 1;
  return a.localeCompare(b, "th");
}

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

  try {
    const [students, registeredUsers] = await Promise.all([
      prisma.act_students.findMany({
        select: {
          student_id: true,
          grade: true,
        },
      }),
      prisma.users.findMany({
        where: { email: { endsWith: ACT_EMAIL_SUFFIX } },
        select: { email: true },
      }),
    ]);

    const registeredStudentIds = new Set(
      registeredUsers
        .map((user) => user.email?.split("@")[0]?.trim())
        .filter((value): value is string => Boolean(value)),
    );

    const gradeMap = new Map<
      string,
      { grade: string; totalCount: number; registeredCount: number }
    >();

    for (const student of students) {
      const grade = normalizeGrade(student.grade);
      const existing = gradeMap.get(grade) ?? {
        grade,
        totalCount: 0,
        registeredCount: 0,
      };

      existing.totalCount += 1;
      if (registeredStudentIds.has(student.student_id)) {
        existing.registeredCount += 1;
      }

      gradeMap.set(grade, existing);
    }

    const gradeStats = Array.from(gradeMap.values()).sort((a, b) =>
      sortGrades(a.grade, b.grade),
    );

    const totalStudents = students.length;
    const registeredCount = students.filter((student) =>
      registeredStudentIds.has(student.student_id),
    ).length;

    return NextResponse.json({
      data: {
        totalStudents,
        registeredCount,
        notRegisteredCount: Math.max(totalStudents - registeredCount, 0),
        gradeStats,
      },
    });
  } catch (error) {
    console.error("Error fetching ACT dashboard summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard summary" },
      { status: 500 },
    );
  }
}
