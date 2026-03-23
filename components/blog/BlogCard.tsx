"use client";

import Image from "next/image";
import { Link } from "@/routing";
import { Clock, Eye, Tag } from "lucide-react";
import { useLocale } from "next-intl";

interface BlogCardProps {
  post: {
    id: number;
    slug: string;
    featured_image: string | null;
    view_count: number;
    is_featured: boolean;
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
      color?: string | null;
    }[];
  };
}

export default function BlogCard({ post }: BlogCardProps) {
  const locale = useLocale();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(locale === "th" ? "th-TH" : "en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Featured Image */}
      <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
        {post.featured_image ? (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <span className="text-4xl text-pink-300">D</span>
          </div>
        )}
        {post.is_featured && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-yellow-400 text-yellow-900 text-xs font-medium rounded">
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Categories */}
        {post.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {post.categories.slice(0, 2).map((category) => (
              <span
                key={category.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                style={{
                  backgroundColor: category.color ? `${category.color}20` : "#fce7f3",
                  color: category.color || "#be185d",
                }}
              >
                <Tag className="w-3 h-3" />
                {category.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-800 line-clamp-2 group-hover:text-pink-600 transition-colors">
          {post.title}
        </h3>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="mt-2 text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {post.author.profile_image_url ? (
              <Image
                src={post.author.profile_image_url}
                alt={post.author.full_name || "Author"}
                width={24}
                height={24}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-pink-400 to-purple-400" />
            )}
            <span className="text-sm text-gray-600 truncate max-w-[100px]">
              {post.author.full_name || "Anonymous"}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDate(post.published_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{post.view_count || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
