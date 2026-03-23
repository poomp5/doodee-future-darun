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
  if (!user || !["admin", "superadmin", "moderator"].includes(user.role || ""))
    return null;
  return session.user.id;
}

// GET /api/admin/mock-exam - List all exams with full details
export async function GET() {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const exams = await prisma.mock_exams.findMany({
      orderBy: { display_order: "asc" },
      include: {
        sections: {
          orderBy: { section_order: "asc" },
          include: {
            passages: { orderBy: { passage_order: "asc" } },
            questions: { orderBy: { question_order: "asc" } },
          },
        },
        _count: { select: { attempts: true } },
      },
    });

    return NextResponse.json({ data: exams });
  } catch (error) {
    console.error("Admin mock-exam GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 },
    );
  }
}

// POST /api/admin/mock-exam - Create a new exam
export async function POST(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const {
      title,
      description,
      detail_content,
      subject_code,
      exam_type,
      duration_minutes,
      total_score,
      pass_score,
    } = body;

    if (!title || !subject_code || !exam_type) {
      return NextResponse.json(
        { error: "title, subject_code, exam_type required" },
        { status: 400 },
      );
    }

    const exam = await prisma.mock_exams.create({
      data: {
        title,
        description: description || null,
        detail_content: detail_content || null,
        subject_code,
        exam_type,
        duration_minutes: duration_minutes || 60,
        total_score: total_score || 100,
        pass_score: pass_score || 50,
      },
    });

    return NextResponse.json({ data: exam });
  } catch (error) {
    console.error("Admin mock-exam POST error:", error);
    return NextResponse.json(
      { error: "Failed to create exam" },
      { status: 500 },
    );
  }
}

// PUT /api/admin/mock-exam - Update an exam
export async function PUT(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const {
      id,
      title,
      description,
      detail_content,
      subject_code,
      exam_type,
      duration_minutes,
      total_score,
      pass_score,
      is_active,
      display_order,
    } = body;

    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description || null;
    if (detail_content !== undefined)
      data.detail_content = detail_content || null;
    if (subject_code !== undefined) data.subject_code = subject_code;
    if (exam_type !== undefined) data.exam_type = exam_type;
    if (duration_minutes !== undefined)
      data.duration_minutes = duration_minutes;
    if (total_score !== undefined) data.total_score = total_score;
    if (pass_score !== undefined) data.pass_score = pass_score;
    if (is_active !== undefined) data.is_active = is_active;
    if (display_order !== undefined) data.display_order = display_order;

    const exam = await prisma.mock_exams.update({ where: { id }, data });
    return NextResponse.json({ data: exam });
  } catch (error) {
    console.error("Admin mock-exam PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update exam" },
      { status: 500 },
    );
  }
}

// DELETE /api/admin/mock-exam?id=X - Delete an exam
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = parseInt(request.nextUrl.searchParams.get("id") || "", 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.mock_exams.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin mock-exam DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
