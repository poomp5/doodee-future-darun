import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const posts = await prisma.community_posts.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: "desc" },
      include: {
        programs: {
          select: {
            program_name_th: true,
            program_name_en: true,
          },
        },
        community_pages: {
          where: { is_visible: true },
          orderBy: { page_number: "asc" },
          take: 1,
        },
        _count: {
          select: { community_pages: true },
        },
      },
    });

    const data = posts.map((post) => ({
      id: post.id.toString(),
      title: post.title,
      description: post.description,
      university_name: post.university_name,
      faculty_name: post.faculty_name,
      program_name: post.programs?.program_name_th || post.programs?.program_name_en || null,
      status: post.status,
      cover_image_url:
        post.cover_image_url ||
        post.community_pages[0]?.image_url ||
        null,
      created_at: post.created_at?.toISOString() || null,
      pageCount: post._count.community_pages,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("My posts error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
