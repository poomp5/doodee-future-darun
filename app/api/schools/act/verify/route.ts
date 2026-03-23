import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/schools/act/verify?student_id=27200
// Verifies a student ID against the ACT students database.
// Returns student info if found, 404 if not found.
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("student_id");

  if (!studentId) {
    return NextResponse.json({ error: "student_id is required" }, { status: 400 });
  }

  try {
    const student = await prisma.act_students.findUnique({
      where: { student_id: studentId },
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
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({ data: student });
  } catch (error) {
    console.error("Error verifying ACT student:", error);
    return NextResponse.json({ error: "Failed to verify student" }, { status: 500 });
  }
}
