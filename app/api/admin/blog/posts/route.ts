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

// GET /api/admin/blog/posts - List all posts with filters
export async function GET(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const where: Record<string, unknown> = {};
    if (status && status !== "all") {
      where.status = status;
    }
    if (search) {
      where.translations = {
        some: {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
          ],
        },
      };
    }

    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: { id: true, full_name: true, profile_image_url: true },
          },
          translations: true,
          categories: {
            include: {
              category: {
                include: { translations: true },
              },
            },
          },
          tags: {
            include: {
              tag: {
                include: { translations: true },
              },
            },
          },
        },
      }),
      prisma.blog_posts.count({ where }),
    ]);

    return NextResponse.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin blog posts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST /api/admin/blog/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const {
      slug,
      status = "draft",
      featured_image,
      is_featured = false,
      translations, // Array of { locale, title, excerpt, content, meta_title, meta_description }
      category_ids = [], // Array of category IDs
      tag_ids = [], // Array of tag IDs
    } = body;

    if (!slug || !translations || translations.length === 0) {
      return NextResponse.json(
        { error: "slug and at least one translation required" },
        { status: 400 }
      );
    }

    // Check for valid translation
    const validTranslation = translations.find(
      (t: { locale: string; title: string }) => t.locale && t.title
    );
    if (!validTranslation) {
      return NextResponse.json(
        { error: "At least one translation with locale and title required" },
        { status: 400 }
      );
    }

    // Check slug uniqueness
    const existingPost = await prisma.blog_posts.findUnique({
      where: { slug },
    });
    if (existingPost) {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 400 }
      );
    }

    const post = await prisma.blog_posts.create({
      data: {
        slug,
        author_id: adminId,
        status,
        featured_image: featured_image || null,
        is_featured,
        published_at: status === "published" ? new Date() : null,
        translations: {
          create: translations.map(
            (t: {
              locale: string;
              title: string;
              excerpt?: string;
              content?: string;
              meta_title?: string;
              meta_description?: string;
            }) => ({
              locale: t.locale,
              title: t.title,
              excerpt: t.excerpt || null,
              content: t.content || "",
              meta_title: t.meta_title || null,
              meta_description: t.meta_description || null,
            })
          ),
        },
        categories: {
          create: category_ids.map((categoryId: number) => ({
            category_id: categoryId,
          })),
        },
        tags: {
          create: tag_ids.map((tagId: number) => ({
            tag_id: tagId,
          })),
        },
      },
      include: {
        author: {
          select: { id: true, full_name: true, profile_image_url: true },
        },
        translations: true,
        categories: { include: { category: { include: { translations: true } } } },
        tags: { include: { tag: { include: { translations: true } } } },
      },
    });

    return NextResponse.json({ data: post });
  } catch (error) {
    console.error("Admin blog posts POST error:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/blog/posts - Update a post
export async function PUT(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const {
      id,
      slug,
      status,
      featured_image,
      is_featured,
      translations,
      category_ids,
      tag_ids,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    // Check existing post
    const existingPost = await prisma.blog_posts.findUnique({
      where: { id },
    });
    if (!existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Check slug uniqueness if changed
    if (slug && slug !== existingPost.slug) {
      const slugExists = await prisma.blog_posts.findUnique({
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
    const data: Record<string, unknown> = {
      updated_at: new Date(),
    };
    if (slug !== undefined) data.slug = slug;
    if (status !== undefined) {
      data.status = status;
      // Set published_at when publishing for the first time
      if (status === "published" && existingPost.status !== "published") {
        data.published_at = new Date();
      }
    }
    if (featured_image !== undefined) data.featured_image = featured_image || null;
    if (is_featured !== undefined) data.is_featured = is_featured;

    // Update post
    await prisma.blog_posts.update({
      where: { id },
      data,
    });

    // Update translations if provided
    if (translations && Array.isArray(translations)) {
      for (const t of translations) {
        await prisma.blog_post_translations.upsert({
          where: {
            post_id_locale: { post_id: id, locale: t.locale },
          },
          update: {
            title: t.title,
            excerpt: t.excerpt || null,
            content: t.content || "",
            meta_title: t.meta_title || null,
            meta_description: t.meta_description || null,
          },
          create: {
            post_id: id,
            locale: t.locale,
            title: t.title,
            excerpt: t.excerpt || null,
            content: t.content || "",
            meta_title: t.meta_title || null,
            meta_description: t.meta_description || null,
          },
        });
      }
    }

    // Update categories if provided
    if (category_ids !== undefined && Array.isArray(category_ids)) {
      // Remove existing and add new
      await prisma.blog_post_categories.deleteMany({
        where: { post_id: id },
      });
      if (category_ids.length > 0) {
        await prisma.blog_post_categories.createMany({
          data: category_ids.map((categoryId: number) => ({
            post_id: id,
            category_id: categoryId,
          })),
        });
      }
    }

    // Update tags if provided
    if (tag_ids !== undefined && Array.isArray(tag_ids)) {
      // Remove existing and add new
      await prisma.blog_post_tags.deleteMany({
        where: { post_id: id },
      });
      if (tag_ids.length > 0) {
        await prisma.blog_post_tags.createMany({
          data: tag_ids.map((tagId: number) => ({
            post_id: id,
            tag_id: tagId,
          })),
        });
      }
    }

    // Fetch updated post
    const updatedPost = await prisma.blog_posts.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, full_name: true, profile_image_url: true },
        },
        translations: true,
        categories: { include: { category: { include: { translations: true } } } },
        tags: { include: { tag: { include: { translations: true } } } },
      },
    });

    return NextResponse.json({ data: updatedPost });
  } catch (error) {
    console.error("Admin blog posts PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/posts?id=X - Delete a post
export async function DELETE(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const id = parseInt(request.nextUrl.searchParams.get("id") || "", 10);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    await prisma.blog_posts.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin blog posts DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
