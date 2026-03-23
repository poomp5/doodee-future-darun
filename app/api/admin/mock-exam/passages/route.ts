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

// POST /api/admin/mock-exam/passages - Create or update a passage
export async function POST(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, section_id, title, content, passage_type, passage_order } = body;

    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    if (id) {
      const passage = await prisma.mock_exam_passages.update({
        where: { id },
        data: {
          title: title || null,
          content,
          passage_type: passage_type || "text",
          passage_order: passage_order ?? 0,
        },
      });
      return NextResponse.json({ data: passage });
    } else {
      if (!section_id) {
        return NextResponse.json({ error: "section_id is required for new passages" }, { status: 400 });
      }
      const passage = await prisma.mock_exam_passages.create({
        data: {
          section_id,
          title: title || null,
          content,
          passage_type: passage_type || "text",
          passage_order: passage_order ?? 0,
        },
      });
      return NextResponse.json({ data: passage });
    }
  } catch (error) {
    console.error("Admin passage POST error:", error);
    return NextResponse.json({ error: "Failed to save passage" }, { status: 500 });
  }
}

// DELETE /api/admin/mock-exam/passages?id=X
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = parseInt(request.nextUrl.searchParams.get("id") || "", 10);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    await prisma.mock_exam_passages.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin passage DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete passage" }, { status: 500 });
  }
}
