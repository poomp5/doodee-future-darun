import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blog/posts - List published posts (public)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const locale = searchParams.get("locale") || "th";
    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const featured = searchParams.get("featured");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "12", 10);

    const where: Record<string, unknown> = {
      status: "published",
    };

    // Filter by category slug
    if (category) {
      where.categories = {
        some: {
          category: {
            slug: category,
          },
        },
      };
    }

    // Filter by tag slug
    if (tag) {
      where.tags = {
        some: {
          tag: {
            slug: tag,
          },
        },
      };
    }

    // Filter by featured
    if (featured === "true") {
      where.is_featured = true;
    }

    const [posts, total] = await Promise.all([
      prisma.blog_posts.findMany({
        where,
        orderBy: { published_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          author: {
            select: { id: true, full_name: true, profile_image_url: true },
          },
          translations: {
            where: { locale },
          },
          categories: {
            include: {
              category: {
                include: {
                  translations: {
                    where: { locale },
                  },
                },
              },
            },
          },
          tags: {
            include: {
              tag: {
                include: {
                  translations: {
                    where: { locale },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.blog_posts.count({ where }),
    ]);

    // Transform posts to include only the relevant locale translation
    const transformedPosts = posts.map((post) => ({
      id: post.id,
      slug: post.slug,
      featured_image: post.featured_image,
      view_count: post.view_count,
      is_featured: post.is_featured,
      published_at: post.published_at,
      created_at: post.created_at,
      author: post.author,
      // Get the first translation (should be only one due to where clause)
      title: post.translations[0]?.title || "",
      excerpt: post.translations[0]?.excerpt || "",
      meta_title: post.translations[0]?.meta_title || "",
      meta_description: post.translations[0]?.meta_description || "",
      categories: post.categories.map((pc) => ({
        id: pc.category.id,
        slug: pc.category.slug,
        icon: pc.category.icon,
        color: pc.category.color,
        name: pc.category.translations[0]?.name || pc.category.slug,
      })),
      tags: post.tags.map((pt) => ({
        id: pt.tag.id,
        slug: pt.tag.slug,
        name: pt.tag.translations[0]?.name || pt.tag.slug,
      })),
    }));

    return NextResponse.json({
      data: transformedPosts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Blog posts GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}
