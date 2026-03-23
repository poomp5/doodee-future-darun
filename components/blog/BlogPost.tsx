"use client";

import Image from "next/image";
import { Link } from "@/routing";
import { useLocale, useTranslations } from "next-intl";
import { Clock, Eye, Tag, ArrowLeft, Share2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface BlogPostProps {
  post: {
    id: number;
    slug: string;
    featured_image: string | null;
    view_count: number;
    is_featured: boolean;
    published_at: string | null;
    created_at: string;
    author: {
      id: string;
      full_name: string | null;
      profile_image_url: string | null;
    };
    title: string;
    excerpt: string;
    content: string;
    meta_title: string;
    meta_description: string;
    categories: {
      id: number;
      slug: string;
      name: string;
      color?: string | null;
    }[];
    tags: {
      id: number;
      slug: string;
      name: string;
    }[];
  };
  relatedPosts?: {
    id: number;
    slug: string;
    featured_image: string | null;
    published_at: string | null;
    author: {
      full_name: string | null;
      profile_image_url: string | null;
    };
    title: string;
    excerpt: string;
    categories: {
      id: number;
      slug: string;
      name: string;
    }[];
  }[];
}

export default function BlogPost({ post, relatedPosts = [] }: BlogPostProps) {
  const locale = useLocale();
  const t = useTranslations();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  return (
    <article className="max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-pink-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t("blog.backToList")}</span>
      </Link>

      {/* Header */}
      <header className="mb-8">
        {/* Categories */}
        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {post.categories.map((category) => (
              <Link
                key={category.id}
                href={`/blog?category=${category.slug}`}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium rounded-full hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: category.color ? `${category.color}20` : "#fce7f3",
                  color: category.color || "#be185d",
                }}
              >
                <Tag className="w-3 h-3" />
                {category.name}
              </Link>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-gray-600 mb-6">{post.excerpt}</p>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-4 pb-6 border-b border-gray-200">
          {/* Author */}
          <div className="flex items-center gap-3">
            {post.author.profile_image_url ? (
              <Image
                src={post.author.profile_image_url}
                alt={post.author.full_name || "Author"}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-400" />
            )}
            <div>
              <p className="font-medium text-gray-800">
                {post.author.full_name || "Anonymous"}
              </p>
              <p className="text-sm text-gray-500">
                {formatDate(post.published_at || post.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* View count */}
            <div className="flex items-center gap-1 text-gray-400">
              <Eye className="w-4 h-4" />
              <span className="text-sm">{post.view_count}</span>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1 text-gray-400 hover:text-pink-600 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="text-sm">{t("blog.share")}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Featured Image */}
      {post.featured_image && (
        <div className="relative aspect-[2/1] rounded-xl overflow-hidden mb-8">
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      {/* Content */}
      <div className="prose prose-lg prose-pink max-w-none mb-12">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
      </div>

      {/* Tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pb-8 border-b border-gray-200">
          <span className="text-sm text-gray-500">{t("blog.tags")}:</span>
          {post.tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/blog?tag=${tag.slug}`}
              className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-pink-100 hover:text-pink-600 transition-colors"
            >
              #{tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            {t("blog.relatedPosts")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedPosts.map((relatedPost) => (
              <Link
                key={relatedPost.id}
                href={`/blog/${relatedPost.slug}`}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                  {relatedPost.featured_image ? (
                    <Image
                      src={relatedPost.featured_image}
                      alt={relatedPost.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-800 line-clamp-2 group-hover:text-pink-600 transition-colors">
                    {relatedPost.title}
                  </h3>
                  <p className="text-sm text-gray-400 mt-2">
                    {formatDate(relatedPost.published_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
