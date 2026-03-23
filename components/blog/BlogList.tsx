"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileText, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import BlogCard from "./BlogCard";

interface BlogPost {
  id: number;
  slug: string;
  featured_image: string | null;
  view_count: number;
  is_featured: boolean;
  published_at: string | null;
  author: {
    id: string;
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
  tags: {
    id: number;
    slug: string;
    name: string;
  }[];
}

interface Category {
  id: number;
  slug: string;
  name: string;
  color?: string | null;
}

interface BlogListProps {
  initialPosts?: BlogPost[];
  initialCategories?: Category[];
  categorySlug?: string;
}

export default function BlogList({
  initialPosts = [],
  initialCategories = [],
  categorySlug,
}: BlogListProps) {
  const locale = useLocale();
  const t = useTranslations();
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(!initialPosts.length);
  const [selectedCategory, setSelectedCategory] = useState(categorySlug || "");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    if (!initialCategories.length) {
      fetchCategories();
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, pagination.page, locale]);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/admin/blog/categories`);
      const data = await res.json();
      if (data.data) {
        setCategories(
          data.data.map((cat: { id: number; slug: string; color?: string; translations: { locale: string; name: string }[] }) => ({
            id: cat.id,
            slug: cat.slug,
            color: cat.color,
            name:
              cat.translations.find((t: { locale: string }) => t.locale === locale)?.name ||
              cat.slug,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        locale,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (selectedCategory) {
        params.append("category", selectedCategory);
      }

      const res = await fetch(`/api/blog/posts?${params}`);
      const data = await res.json();

      if (data.data) {
        setPosts(data.data);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div>
      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">{t("blog.filterByCategory")}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleCategoryChange("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !selectedCategory
                  ? "bg-pink-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {t("blog.allPosts")}
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryChange(category.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.slug
                    ? "bg-pink-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
                style={
                  selectedCategory === category.slug && category.color
                    ? { backgroundColor: category.color }
                    : undefined
                }
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-[16/9] bg-gray-200" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-5 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Posts Grid */}
      {!loading && posts.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-600 mb-2">
            {t("blog.noPosts")}
          </h3>
          <p className="text-gray-400">{t("blog.noPostsDescription")}</p>
        </div>
      ) : (
        !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-12">
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                  disabled={pagination.page === 1}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>{t("common.previous")}</span>
                </button>
                <span className="text-gray-500">
                  {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPagination((prev) => ({
                      ...prev,
                      page: Math.min(prev.totalPages, prev.page + 1),
                    }))
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <span>{t("common.next")}</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )
      )}
    </div>
  );
}
