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

// POST /api/admin/mock-exam/sections - Create or update a section
export async function POST(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, exam_id, title, description, section_order, score_weight } = body;

    if (!title) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    if (id) {
      const section = await prisma.mock_exam_sections.update({
        where: { id },
        data: {
          title,
          description: description || null,
          section_order: section_order ?? 0,
          score_weight: score_weight ?? 50,
        },
      });
      return NextResponse.json({ data: section });
    } else {
      if (!exam_id) {
        return NextResponse.json({ error: "exam_id is required for new sections" }, { status: 400 });
      }
      const section = await prisma.mock_exam_sections.create({
        data: {
          exam_id,
          title,
          description: description || null,
          section_order: section_order ?? 0,
          score_weight: score_weight ?? 50,
        },
      });
      return NextResponse.json({ data: section });
    }
  } catch (error) {
    console.error("Admin section POST error:", error);
    return NextResponse.json({ error: "Failed to save section" }, { status: 500 });
  }
}

// DELETE /api/admin/mock-exam/sections?id=X
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = parseInt(request.nextUrl.searchParams.get("id") || "", 10);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.mock_exam_sections.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin section DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete section" }, { status: 500 });
  }
}
