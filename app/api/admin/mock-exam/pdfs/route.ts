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

// GET /api/admin/mock-exam/pdfs - List all PDF exams
export async function GET() {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const pdfs = await prisma.mock_exam_pdfs.findMany({
      orderBy: { display_order: "asc" },
    });

    return NextResponse.json({ data: pdfs });
  } catch (error) {
    console.error("Admin mock-exam pdfs GET error:", error);
    return NextResponse.json({ error: "Failed to fetch PDF exams" }, { status: 500 });
  }
}

// POST /api/admin/mock-exam/pdfs - Create a new PDF exam
export async function POST(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { title, filename, r2_url, subject_code, exam_type, is_active, display_order } = body;

    if (!title || !filename || !r2_url) {
      return NextResponse.json(
        { error: "title, filename, r2_url required" },
        { status: 400 },
      );
    }

    const pdf = await prisma.mock_exam_pdfs.create({
      data: {
        title,
        filename,
        r2_url,
        subject_code: subject_code || null,
        exam_type: exam_type || null,
        is_active: is_active ?? true,
        display_order: display_order ?? 0,
      },
    });

    return NextResponse.json({ data: pdf });
  } catch (error) {
    console.error("Admin mock-exam pdfs POST error:", error);
    return NextResponse.json({ error: "Failed to create PDF exam" }, { status: 500 });
  }
}

// PUT /api/admin/mock-exam/pdfs - Update a PDF exam
export async function PUT(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, title, filename, r2_url, subject_code, exam_type, is_active, display_order } = body;

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (filename !== undefined) data.filename = filename;
    if (r2_url !== undefined) data.r2_url = r2_url;
    if (subject_code !== undefined) data.subject_code = subject_code || null;
    if (exam_type !== undefined) data.exam_type = exam_type || null;
    if (is_active !== undefined) data.is_active = is_active;
    if (display_order !== undefined) data.display_order = display_order;
    data.updated_at = new Date();

    const pdf = await prisma.mock_exam_pdfs.update({ where: { id }, data });
    return NextResponse.json({ data: pdf });
  } catch (error) {
    console.error("Admin mock-exam pdfs PUT error:", error);
    return NextResponse.json({ error: "Failed to update PDF exam" }, { status: 500 });
  }
}

// DELETE /api/admin/mock-exam/pdfs?id=X - Delete a PDF exam
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = parseInt(request.nextUrl.searchParams.get("id") || "", 10);
    if (isNaN(id))
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.mock_exam_pdfs.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin mock-exam pdfs DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
