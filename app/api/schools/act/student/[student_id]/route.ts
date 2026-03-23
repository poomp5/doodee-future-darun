import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// PATCH /api/schools/act/student/[student_id]
// Allows authenticated ACT students to update their own nickname and email.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ student_id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only allow ACT users to update their own record
  const userEmail = session.user.email;
  const isACTUser = userEmail.includes("act.ac.th");
  if (!isACTUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { student_id } = await params;
  const ownStudentId = userEmail.split("@")[0];

  // Students can only edit their own record
  if (student_id !== ownStudentId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { nickname, email } = body;

  try {
    const updated = await prisma.act_students.update({
      where: { student_id },
      data: {
        ...(nickname !== undefined && { nickname: nickname || null }),
        ...(email !== undefined && { email: email || null }),
        updated_at: new Date(),
      },
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

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error("Error updating ACT student:", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}
