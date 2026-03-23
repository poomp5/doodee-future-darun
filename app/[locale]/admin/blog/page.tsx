"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash, Search, Eye, FileText, Star } from "lucide-react";
import Image from "next/image";
import { Link } from "@/routing";
import { useTranslations, useLocale } from "next-intl";
import Swal from "@/lib/swal-toast";

interface BlogPost {
  id: number;
  slug: string;
  status: string;
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
  translations: {
    locale: string;
    title: string;
    excerpt: string | null;
  }[];
  categories: {
    category: {
      id: number;
      slug: string;
      translations: { locale: string; name: string }[];
    };
  }[];
}

export default function BlogPostsPage() {
  const t = useTranslations();
  const currentLocale = useLocale();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  useEffect(() => {
    fetchPosts();
  }, [pagination.page, statusFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }
      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const res = await fetch(`/api/admin/blog/posts?${params}`);
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

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchPosts();
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: t("blog.admin.deleteConfirm"),
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t("common.delete"),
      cancelButtonText: t("common.cancel"),
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/admin/blog/posts?id=${id}`, { method: "DELETE" });
        setPosts(posts.filter((p) => p.id !== id));
        Swal.fire({
          icon: "success",
          title: t("common.success"),
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({ icon: "error", title: t("common.error") });
      }
    }
  };

  const getPostTitle = (post: BlogPost) => {
    const translation = post.translations.find((t) => t.locale === currentLocale);
    return translation?.title || post.translations[0]?.title || post.slug;
  };

  const getCategoryNames = (post: BlogPost) => {
    return post.categories
      .map((c) => {
        const translation = c.category.translations.find(
          (t) => t.locale === currentLocale
        );
        return translation?.name || c.category.slug;
      })
      .join(", ");
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-yellow-100 text-yellow-700",
      published: "bg-green-100 text-green-700",
      archived: "bg-gray-100 text-gray-700",
    };
    const labels = {
      draft: t("blog.status.draft"),
      published: t("blog.status.published"),
      archived: t("blog.status.archived"),
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || styles.draft
        }`}
      >
        {labels[status as keyof typeof labels] || status}
      </span>
    );
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString(
      currentLocale === "th" ? "th-TH" : "en-US",
      {
        day: "numeric",
        month: "short",
        year: "numeric",
      }
    );
  };

  const TableSkeleton = () => (
    <div className="p-4 md:p-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-10 w-full bg-gray-100 rounded-lg mb-6" />
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="h-10 bg-gray-50" />
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 bg-white" />
          ))}
        </div>
      </div>
    </div>
  );

  if (loading && posts.length === 0) {
    return <TableSkeleton />;
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            {t("blog.admin.title")}
          </h1>
          <p className="text-gray-500">
            {t("blog.admin.totalPosts", { count: pagination.total })}
          </p>
        </div>
        <Link
          href="/admin/blog/new"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>{t("blog.admin.newPost")}</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder={t("blog.admin.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="px-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
        >
          <option value="all">{t("blog.admin.allStatus")}</option>
          <option value="draft">{t("blog.status.draft")}</option>
          <option value="published">{t("blog.status.published")}</option>
          <option value="archived">{t("blog.status.archived")}</option>
        </select>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  {t("blog.admin.post")}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden md:table-cell">
                  {t("blog.admin.categories")}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden sm:table-cell">
                  {t("blog.admin.status")}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden lg:table-cell">
                  {t("blog.admin.views")}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden lg:table-cell">
                  {t("blog.admin.date")}
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                  {t("blog.admin.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>{t("blog.admin.noPosts")}</p>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {post.featured_image ? (
                          <Image
                            src={post.featured_image}
                            alt={getPostTitle(post)}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-pink-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-800 truncate max-w-xs">
                              {getPostTitle(post)}
                            </p>
                            {post.is_featured && (
                              <Star className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate max-w-xs">
                            /{post.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {getCategoryNames(post) || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      {getStatusBadge(post.status)}
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="w-4 h-4" />
                        {post.view_count || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell text-sm text-gray-500">
                      {formatDate(post.published_at || post.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/blog/${post.id}`}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-5 h-5" />
                        </Link>
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100">
            <button
              onClick={() =>
                setPagination((prev) => ({
                  ...prev,
                  page: Math.max(1, prev.page - 1),
                }))
              }
              disabled={pagination.page === 1}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("common.previous")}
            </button>
            <span className="text-sm text-gray-500">
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
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t("common.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
