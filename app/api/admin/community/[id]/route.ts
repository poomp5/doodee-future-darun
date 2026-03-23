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

// PATCH /api/admin/community/[id] - update school_name (via user_education_history) or post fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { school_name, university_name, faculty_name, field_name } = body;

  const post = await prisma.community_posts.findUnique({
    where: { id },
    select: { user_id: true },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Update post fields if provided
  const postUpdate: any = {};
  if (university_name !== undefined) postUpdate.university_name = university_name || null;
  if (faculty_name !== undefined) postUpdate.faculty_name = faculty_name || null;
  if (field_name !== undefined) postUpdate.field_name = field_name || null;

  if (Object.keys(postUpdate).length > 0) {
    await prisma.community_posts.update({
      where: { id },
      data: postUpdate,
    });
  }

  // Update school: upsert into user_education_history
  if (school_name !== undefined) {
    if (school_name) {
      // Check if user already has a high school entry
      const existing = await prisma.user_education_history.findFirst({
        where: { user_id: post.user_id, school_type: "high_school" },
        orderBy: { created_at: "desc" },
      });

      if (existing) {
        await prisma.user_education_history.update({
          where: { id: existing.id },
          data: { school_name, data_source: "admin_entered" },
        });
      } else {
        await prisma.user_education_history.create({
          data: {
            user_id: post.user_id,
            school_name,
            school_type: "high_school",
            data_source: "admin_entered",
          },
        });
      }
    }
  }

  return NextResponse.json({ success: true });
}
