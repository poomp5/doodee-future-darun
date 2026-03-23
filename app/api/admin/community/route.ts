import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

async function isAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  const role = user?.role;
  return role === "admin" || role === "superadmin" || role === "moderator";
}

// GET /api/admin/community - list all community posts (all statuses) with user + school info
export async function GET(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "50", 10), 1), 100);
  const search = searchParams.get("search") || "";

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { university_name: { contains: search, mode: "insensitive" } },
      { users: { full_name: { contains: search, mode: "insensitive" } } },
      { users: { username: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [total, posts] = await prisma.$transaction([
    prisma.community_posts.count({ where }),
    prisma.community_posts.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        community_pages: {
          where: { page_number: 1 },
          take: 1,
        },
        users: {
          select: {
            id: true,
            full_name: true,
            username: true,
            profile_image_url: true,
            user_education_history: {
              select: { school_name: true },
              orderBy: { created_at: "desc" },
              take: 1,
            },
          },
        },
      },
    }),
  ]);

  const data = posts.map((post) => ({
    id: post.id,
    title: post.title,
    status: post.status,
    university_name: post.university_name,
    faculty_name: post.faculty_name,
    field_name: post.field_name,
    cover_image_url: post.cover_image_url || post.community_pages[0]?.image_url || null,
    created_at: post.created_at,
    user: post.users
      ? {
          id: post.users.id,
          name: post.users.full_name || post.users.username,
          username: post.users.username,
          image: post.users.profile_image_url,
          school_name: post.users.user_education_history[0]?.school_name ?? null,
        }
      : null,
  }));

  return NextResponse.json({ data, total, page, limit });
}
