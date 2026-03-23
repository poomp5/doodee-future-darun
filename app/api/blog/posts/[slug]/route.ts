import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/blog/posts/[slug] - Get single published post by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = request.nextUrl;
    const locale = searchParams.get("locale") || "th";

    const post = await prisma.blog_posts.findUnique({
      where: { slug },
      include: {
        author: {
          select: { id: true, full_name: true, profile_image_url: true },
        },
        translations: true, // Get all translations for the post
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
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Only allow viewing published posts publicly
    if (post.status !== "published") {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Increment view count
    await prisma.blog_posts.update({
      where: { id: post.id },
      data: { view_count: (post.view_count || 0) + 1 },
    });

    // Get translation for the requested locale, fallback to first available
    const translation =
      post.translations.find((t) => t.locale === locale) ||
      post.translations[0];

    // Transform post
    const transformedPost = {
      id: post.id,
      slug: post.slug,
      featured_image: post.featured_image,
      view_count: (post.view_count || 0) + 1, // Include the just-incremented count
      is_featured: post.is_featured,
      published_at: post.published_at,
      created_at: post.created_at,
      author: post.author,
      // Main translation
      title: translation?.title || "",
      excerpt: translation?.excerpt || "",
      content: translation?.content || "",
      meta_title: translation?.meta_title || "",
      meta_description: translation?.meta_description || "",
      // All available translations (for language switcher)
      available_locales: post.translations.map((t) => t.locale),
      // Categories
      categories: post.categories.map((pc) => {
        const catTranslation =
          pc.category.translations.find((t) => t.locale === locale) ||
          pc.category.translations[0];
        return {
          id: pc.category.id,
          slug: pc.category.slug,
          icon: pc.category.icon,
          color: pc.category.color,
          name: catTranslation?.name || pc.category.slug,
        };
      }),
      // Tags
      tags: post.tags.map((pt) => {
        const tagTranslation =
          pt.tag.translations.find((t) => t.locale === locale) ||
          pt.tag.translations[0];
        return {
          id: pt.tag.id,
          slug: pt.tag.slug,
          name: tagTranslation?.name || pt.tag.slug,
        };
      }),
    };

    // Fetch related posts (same category, exclude current)
    const relatedPosts = await prisma.blog_posts.findMany({
      where: {
        status: "published",
        id: { not: post.id },
        categories: {
          some: {
            category_id: {
              in: post.categories.map((pc) => pc.category_id),
            },
          },
        },
      },
      orderBy: { published_at: "desc" },
      take: 3,
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
      },
    });

    const transformedRelated = relatedPosts.map((rp) => ({
      id: rp.id,
      slug: rp.slug,
      featured_image: rp.featured_image,
      published_at: rp.published_at,
      author: rp.author,
      title: rp.translations[0]?.title || "",
      excerpt: rp.translations[0]?.excerpt || "",
      categories: rp.categories.map((pc) => ({
        id: pc.category.id,
        slug: pc.category.slug,
        name: pc.category.translations[0]?.name || pc.category.slug,
      })),
    }));

    return NextResponse.json({
      data: transformedPost,
      related: transformedRelated,
    });
  } catch (error) {
    console.error("Blog post GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}
