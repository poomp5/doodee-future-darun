import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || !["admin", "superadmin", "moderator"].includes(user.role || "")) return null;
  return session.user.id;
}

// POST /api/admin/mock-exam/questions - Create/update question
export async function POST(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, section_id, passage_id, question_text, choices, correct_answer, explanation, question_order, score } = body;

    if (!section_id || !question_text || !choices || !correct_answer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (id) {
      // Update
      const question = await prisma.mock_exam_questions.update({
        where: { id },
        data: {
          section_id,
          passage_id: passage_id || null,
          question_text,
          choices,
          correct_answer,
          explanation: explanation || null,
          question_order: question_order || 0,
          score: score || 1,
        },
      });
      return NextResponse.json({ data: question });
    } else {
      // Create
      const question = await prisma.mock_exam_questions.create({
        data: {
          section_id,
          passage_id: passage_id || null,
          question_text,
          question_type: "multiple_choice",
          choices,
          correct_answer,
          explanation: explanation || null,
          question_order: question_order || 0,
          score: score || 1,
        },
      });
      return NextResponse.json({ data: question });
    }
  } catch (error) {
    console.error("Admin question POST error:", error);
    return NextResponse.json({ error: "Failed to save question" }, { status: 500 });
  }
}

// DELETE /api/admin/mock-exam/questions?id=X
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = parseInt(request.nextUrl.searchParams.get("id") || "", 10);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.mock_exam_questions.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin question DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
