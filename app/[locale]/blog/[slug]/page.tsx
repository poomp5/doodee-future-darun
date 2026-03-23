import { notFound } from "next/navigation";
import { Metadata } from "next";
import BlogPost from "@/components/blog/BlogPost";

interface PageProps {
  params: Promise<{ locale: string; slug: string }>;
}

async function getPost(slug: string, locale: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/blog/posts/${slug}?locale=${locale}`, {
    next: { revalidate: 60 }, // Cache for 60 seconds
  });

  if (!res.ok) {
    return null;
  }

  const data = await res.json();
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getPost(slug, locale);

  if (!data?.data) {
    return {
      title: "Post Not Found",
    };
  }

  const post = data.data;

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      type: "article",
      images: post.featured_image ? [post.featured_image] : undefined,
      publishedTime: post.published_at,
      authors: post.author?.full_name ? [post.author.full_name] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image ? [post.featured_image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { locale, slug } = await params;
  const data = await getPost(slug, locale);

  if (!data?.data) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <BlogPost post={data.data} relatedPosts={data.related || []} />
      </div>
    </div>
  );
}
