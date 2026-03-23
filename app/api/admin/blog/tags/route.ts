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

// GET /api/admin/blog/tags - List all tags
export async function GET() {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const tags = await prisma.blog_tags.findMany({
      orderBy: { created_at: "desc" },
      include: {
        translations: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ data: tags });
  } catch (error) {
    console.error("Admin blog tags GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}

// POST /api/admin/blog/tags - Create a new tag
export async function POST(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const {
      slug,
      is_active = true,
      translations, // Array of { locale, name }
    } = body;

    if (!slug || !translations || translations.length === 0) {
      return NextResponse.json(
        { error: "slug and at least one translation required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingTag = await prisma.blog_tags.findUnique({
      where: { slug },
    });
    if (existingTag) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const tag = await prisma.blog_tags.create({
      data: {
        slug,
        is_active,
        translations: {
          create: translations.map(
            (t: { locale: string; name: string }) => ({
              locale: t.locale,
              name: t.name,
            })
          ),
        },
      },
      include: {
        translations: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ data: tag });
  } catch (error) {
    console.error("Admin blog tags POST error:", error);
    return NextResponse.json(
      { error: "Failed to create tag" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/blog/tags - Update a tag
export async function PUT(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, slug, is_active, translations } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Check existing tag
    const existingTag = await prisma.blog_tags.findUnique({
      where: { id },
    });
    if (!existingTag) {
      return NextResponse.json({ error: "Tag not found" }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingTag.slug) {
      const slugExists = await prisma.blog_tags.findUnique({
        where: { slug },
      });
      if (slugExists) {
        return NextResponse.json(
          { error: "Slug already exists" },
          { status: 400 }
        );
      }
    }

    // Build update data
    const data: Record<string, unknown> = {};
    if (slug !== undefined) data.slug = slug;
    if (is_active !== undefined) data.is_active = is_active;

    // Update tag
    await prisma.blog_tags.update({
      where: { id },
      data,
    });

    // Update translations if provided
    if (translations && Array.isArray(translations)) {
      for (const t of translations) {
        await prisma.blog_tag_translations.upsert({
          where: {
            tag_id_locale: { tag_id: id, locale: t.locale },
          },
          update: {
            name: t.name,
          },
          create: {
            tag_id: id,
            locale: t.locale,
            name: t.name,
          },
        });
      }
    }

    // Fetch updated tag
    const updatedTag = await prisma.blog_tags.findUnique({
      where: { id },
      include: {
        translations: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ data: updatedTag });
  } catch (error) {
    console.error("Admin blog tags PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update tag" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/tags?id=X - Delete a tag
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = parseInt(request.nextUrl.searchParams.get("id") || "", 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.blog_tags.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin blog tags DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
