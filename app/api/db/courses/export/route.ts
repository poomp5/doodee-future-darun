import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function isAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "admin" || user?.role === "superadmin";
}

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: "Unauthorized - Admin only" },
        { status: 403 },
      );
    }

    const courses = await prisma.courses.findMany({
      orderBy: [{ display_order: "asc" }, { created_at: "desc" }],
    });

    const headers = [
      "id",
      "title",
      "description",
      "image_url",
      "price",
      "category",
      "subcategory",
      "duration",
      "instructor",
      "source",
      "link_url",
      "is_active",
      "display_order",
      "deadline",
      "max_participants",
      "created_at",
      "updated_at",
    ];

    const rows = courses.map((c) =>
      headers.map((h) => escapeCsv(c[h as keyof typeof c])).join(","),
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new Response("\uFEFF" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="courses_${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export courses error:", error);
    return NextResponse.json(
      { error: "Failed to export courses" },
      { status: 500 },
    );
  }
}
