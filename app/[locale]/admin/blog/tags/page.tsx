"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash, X, Save, Tag } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Swal from "@/lib/swal-toast";

interface BlogTag {
  id: number;
  slug: string;
  is_active: boolean;
  translations: { locale: string; name: string }[];
  _count: { posts: number };
}

interface TagFormData {
  id?: number;
  slug: string;
  is_active: boolean;
  translations: {
    th: { name: string };
    en: { name: string };
  };
}

const defaultFormData: TagFormData = {
  slug: "",
  is_active: true,
  translations: {
    th: { name: "" },
    en: { name: "" },
  },
};

export default function BlogTagsPage() {
  const t = useTranslations();
  const currentLocale = useLocale();
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<TagFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      const res = await fetch("/api/admin/blog/tags");
      const data = await res.json();
      setTags(data.data || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData(defaultFormData);
    setEditing(false);
    setShowModal(true);
  };

  const handleEdit = (tag: BlogTag) => {
    setFormData({
      id: tag.id,
      slug: tag.slug,
      is_active: tag.is_active !== false,
      translations: {
        th: {
          name: tag.translations.find((t) => t.locale === "th")?.name || "",
        },
        en: {
          name: tag.translations.find((t) => t.locale === "en")?.name || "",
        },
      },
    });
    setEditing(true);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.slug || (!formData.translations.th.name && !formData.translations.en.name)) {
      Swal.fire({
        icon: "error",
        title: t("blog.admin.requiredFields"),
      });
      return;
    }

    setSaving(true);

    try {
      const translations = [];
      if (formData.translations.th.name) {
        translations.push({
          locale: "th",
          name: formData.translations.th.name,
        });
      }
      if (formData.translations.en.name) {
        translations.push({
          locale: "en",
          name: formData.translations.en.name,
        });
      }

      const payload = {
        id: formData.id,
        slug: formData.slug,
        is_active: formData.is_active,
        translations,
      };

      const res = await fetch("/api/admin/blog/tags", {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      Swal.fire({
        icon: "success",
        title: t("common.success"),
        timer: 1500,
        showConfirmButton: false,
      });

      setShowModal(false);
      fetchTags();
    } catch (error) {
      console.error("Save error:", error);
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: t("blog.admin.deleteTagConfirm"),
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t("common.delete"),
      cancelButtonText: t("common.cancel"),
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/admin/blog/tags?id=${id}`, { method: "DELETE" });
        setTags(tags.filter((t) => t.id !== id));
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

  const getTagName = (tag: BlogTag) => {
    const translation = tag.translations.find((t) => t.locale === currentLocale);
    return translation?.name || tag.slug;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 bg-gray-100 rounded-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            {t("blog.admin.tagsTitle")}
          </h1>
          <p className="text-gray-500">
            {t("blog.admin.totalTags", { count: tags.length })}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>{t("blog.admin.addTag")}</span>
        </button>
      </div>

      {/* Tags Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        {tags.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>{t("blog.admin.noTags")}</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className={`group relative flex items-center gap-2 px-4 py-2 rounded-full border transition-colors ${
                  tag.is_active
                    ? "bg-pink-50 border-pink-200 text-pink-700"
                    : "bg-gray-50 border-gray-200 text-gray-500"
                }`}
              >
                <span className="font-medium">{getTagName(tag)}</span>
                <span className="text-xs opacity-60">({tag._count.posts})</span>
                <div className="absolute -top-1 -right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(tag)}
                    className="p-1 bg-blue-500 text-white rounded-full hover:bg-blue-600"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleDelete(tag.id)}
                    className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <Trash className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editing ? t("blog.admin.editTag") : t("blog.admin.addTag")}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="tag-slug"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อแท็ก (ไทย)
                </label>
                <input
                  type="text"
                  value={formData.translations.th.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      translations: {
                        ...formData.translations,
                        th: { name: e.target.value },
                      },
                    })
                  }
                  placeholder="ชื่อแท็กภาษาไทย"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tag Name (English)
                </label>
                <input
                  type="text"
                  value={formData.translations.en.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      translations: {
                        ...formData.translations,
                        en: { name: e.target.value },
                      },
                    })
                  }
                  placeholder="English tag name"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  {t("blog.admin.active")}
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
