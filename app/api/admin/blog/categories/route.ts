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

// GET /api/admin/blog/categories - List all categories
export async function GET() {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const categories = await prisma.blog_categories.findMany({
      orderBy: { display_order: "asc" },
      include: {
        translations: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ data: categories });
  } catch (error) {
    console.error("Admin blog categories GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/admin/blog/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const {
      slug,
      icon = "Folder",
      color,
      display_order = 0,
      is_active = true,
      translations, // Array of { locale, name, description }
    } = body;

    if (!slug || !translations || translations.length === 0) {
      return NextResponse.json(
        { error: "slug and at least one translation required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingCategory = await prisma.blog_categories.findUnique({
      where: { slug },
    });
    if (existingCategory) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.blog_categories.create({
      data: {
        slug,
        icon,
        color: color || null,
        display_order,
        is_active,
        translations: {
          create: translations.map(
            (t: { locale: string; name: string; description?: string }) => ({
              locale: t.locale,
              name: t.name,
              description: t.description || null,
            })
          ),
        },
      },
      include: {
        translations: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ data: category });
  } catch (error) {
    console.error("Admin blog categories POST error:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/blog/categories - Update a category
export async function PUT(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { id, slug, icon, color, display_order, is_active, translations } =
      body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Check existing category
    const existingCategory = await prisma.blog_categories.findUnique({
      where: { id },
    });
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingCategory.slug) {
      const slugExists = await prisma.blog_categories.findUnique({
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
    if (icon !== undefined) data.icon = icon;
    if (color !== undefined) data.color = color || null;
    if (display_order !== undefined) data.display_order = display_order;
    if (is_active !== undefined) data.is_active = is_active;

    // Update category
    await prisma.blog_categories.update({
      where: { id },
      data,
    });

    // Update translations if provided
    if (translations && Array.isArray(translations)) {
      for (const t of translations) {
        await prisma.blog_category_translations.upsert({
          where: {
            category_id_locale: { category_id: id, locale: t.locale },
          },
          update: {
            name: t.name,
            description: t.description || null,
          },
          create: {
            category_id: id,
            locale: t.locale,
            name: t.name,
            description: t.description || null,
          },
        });
      }
    }

    // Fetch updated category
    const updatedCategory = await prisma.blog_categories.findUnique({
      where: { id },
      include: {
        translations: true,
        _count: { select: { posts: true } },
      },
    });

    return NextResponse.json({ data: updatedCategory });
  } catch (error) {
    console.error("Admin blog categories PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/categories?id=X - Delete a category
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = parseInt(request.nextUrl.searchParams.get("id") || "", 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.blog_categories.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin blog categories DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
