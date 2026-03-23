import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mock-exam/pdfs - List all active PDF exams
export async function GET() {
  try {
    const pdfs = await prisma.mock_exam_pdfs.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
      select: {
        id: true,
        title: true,
        filename: true,
        r2_url: true,
        subject_code: true,
        exam_type: true,
        display_order: true,
        created_at: true,
      },
    });

    return NextResponse.json({ data: pdfs });
  } catch (error) {
    console.error("Error fetching PDF exams:", error);
    return NextResponse.json({ error: "Failed to fetch PDF exams" }, { status: 500 });
  }
}
