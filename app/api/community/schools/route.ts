import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Returns distinct school names of users who have at least one open community post
export async function GET() {
  try {
    const postOwners = await prisma.community_posts.findMany({
      where: { status: "open" },
      select: { user_id: true },
      distinct: ["user_id"],
    });

    const ownerIds = postOwners.map((r) => r.user_id).filter(Boolean);

    if (ownerIds.length === 0) {
      return NextResponse.json({ schools: [] });
    }

    const rows = await prisma.user_education_history.findMany({
      where: {
        user_id: { in: ownerIds },
        school_name: { not: "" },
      },
      select: { school_name: true },
      distinct: ["school_name"],
      orderBy: { school_name: "asc" },
    });

    const schools = rows.map((r) => r.school_name).filter(Boolean).sort((a, b) =>
      a.localeCompare(b, "th")
    );

    return NextResponse.json({ schools });
  } catch (error) {
    console.error("Community schools error:", error);
    return NextResponse.json({ schools: [] });
  }
}
