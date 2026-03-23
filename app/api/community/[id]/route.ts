import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

// Get single community post
// ?edit=true returns all pages (including hidden) for the owner
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const editMode = request.nextUrl.searchParams.get("edit") === "true";

    // If edit mode, check ownership
    let sessionUserId: string | null = null;
    if (editMode) {
      const session = await auth();
      sessionUserId = session?.user?.id || null;
    }

    const post = await prisma.community_posts.findUnique({
      where: { id, status: "open" },
      include: {
        programs: {
          select: {
            program_name_th: true,
            program_name_en: true,
          },
        },
        community_pages: {
          // In edit mode for owner, return ALL pages
          ...(editMode ? {} : { where: { is_visible: true } }),
          orderBy: { page_number: "asc" },
        },
        users: {
          select: {
            id: true,
            full_name: true,
            username: true,
            profile_image_url: true,
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get rating aggregate (separate query to avoid breaking if table isn't ready)
    let rating = { average: 0, count: 0 };
    try {
      const ratingAgg = await prisma.community_ratings.aggregate({
        where: { post_id: id },
        _avg: { score: true },
        _count: { score: true },
      });
      rating = {
        average: ratingAgg._avg.score ? Math.round(ratingAgg._avg.score * 10) / 10 : 0,
        count: ratingAgg._count.score,
      };
    } catch {}

    // If edit mode but not owner, strip hidden pages
    const isOwner = sessionUserId === post.user_id;
    const pages = editMode && isOwner
      ? post.community_pages
      : post.community_pages.filter((p) => p.is_visible);

    return NextResponse.json({
      id: post.id,
      title: post.title,
      description: post.description,
      university_name: post.university_name,
      faculty_name: post.faculty_name,
      field_name: post.field_name,
      program_name: post.programs?.program_name_th || post.programs?.program_name_en || null,
      watermark: post.watermark,
      cover_image_url: post.cover_image_url,
      original_file_url: post.original_file_url,
      created_at: post.created_at,
      user: post.users
        ? {
            id: post.users.id,
            name: post.users.full_name || post.users.username,
            username: post.users.username,
            image: post.users.profile_image_url,
          }
        : null,
      pages: pages.map((p) => ({
        id: p.id,
        pageNumber: p.page_number,
        imageUrl: p.image_url,
        aspectRatio: p.aspect_ratio || null,
        isVisible: p.is_visible,
      })),
      rating,
    });
  } catch (error) {
    console.error("Community post detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// Update own community post (metadata + page visibility)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.community_posts.findUnique({
      where: { id },
      select: { user_id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, universityName, facultyName, pages } = body;

    await prisma.$transaction(async (tx) => {
      // Update post metadata
      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (universityName !== undefined)
        updateData.university_name = universityName || null;
      if (facultyName !== undefined)
        updateData.faculty_name = facultyName || null;

      // If pages visibility changed, update cover image
      if (Array.isArray(pages)) {
        for (const p of pages) {
          if (p.id && p.isVisible !== undefined) {
            await tx.community_pages.update({
              where: { id: p.id },
              data: { is_visible: p.isVisible },
            });
          }
        }
        const visiblePage = pages.find((p: any) => p.isVisible !== false);
        if (visiblePage?.imageUrl) {
          updateData.cover_image_url = visiblePage.imageUrl;
        }
      }

      if (Object.keys(updateData).length > 0) {
        await tx.community_posts.update({ where: { id }, data: updateData });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Community post update error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// Delete own community post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.community_posts.findUnique({
      where: { id },
      select: { user_id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.user_id !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.community_pages.deleteMany({ where: { post_id: id } });
      await tx.community_posts.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Community post delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}
