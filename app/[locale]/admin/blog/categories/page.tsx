"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash, X, Save } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import Swal from "@/lib/swal-toast";

interface Category {
  id: number;
  slug: string;
  icon: string;
  color: string | null;
  display_order: number;
  is_active: boolean;
  translations: { locale: string; name: string; description: string | null }[];
  _count: { posts: number };
}

interface CategoryFormData {
  id?: number;
  slug: string;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
  translations: {
    th: { name: string; description: string };
    en: { name: string; description: string };
  };
}

const defaultFormData: CategoryFormData = {
  slug: "",
  icon: "Folder",
  color: "",
  display_order: 0,
  is_active: true,
  translations: {
    th: { name: "", description: "" },
    en: { name: "", description: "" },
  },
};

export default function BlogCategoriesPage() {
  const t = useTranslations();
  const currentLocale = useLocale();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/admin/blog/categories");
      const data = await res.json();
      setCategories(data.data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData(defaultFormData);
    setEditing(false);
    setShowModal(true);
  };

  const handleEdit = (category: Category) => {
    setFormData({
      id: category.id,
      slug: category.slug,
      icon: category.icon || "Folder",
      color: category.color || "",
      display_order: category.display_order || 0,
      is_active: category.is_active !== false,
      translations: {
        th: {
          name: category.translations.find((t) => t.locale === "th")?.name || "",
          description:
            category.translations.find((t) => t.locale === "th")?.description || "",
        },
        en: {
          name: category.translations.find((t) => t.locale === "en")?.name || "",
          description:
            category.translations.find((t) => t.locale === "en")?.description || "",
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
          description: formData.translations.th.description || null,
        });
      }
      if (formData.translations.en.name) {
        translations.push({
          locale: "en",
          name: formData.translations.en.name,
          description: formData.translations.en.description || null,
        });
      }

      const payload = {
        id: formData.id,
        slug: formData.slug,
        icon: formData.icon,
        color: formData.color || null,
        display_order: formData.display_order,
        is_active: formData.is_active,
        translations,
      };

      const res = await fetch("/api/admin/blog/categories", {
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
      fetchCategories();
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
      title: t("blog.admin.deleteCategoryConfirm"),
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t("common.delete"),
      cancelButtonText: t("common.cancel"),
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/admin/blog/categories?id=${id}`, { method: "DELETE" });
        setCategories(categories.filter((c) => c.id !== id));
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

  const getCategoryName = (category: Category) => {
    const translation = category.translations.find((t) => t.locale === currentLocale);
    return translation?.name || category.slug;
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 animate-pulse">
        <div className="h-8 w-48 bg-gray-200 rounded mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
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
            {t("blog.admin.categoriesTitle")}
          </h1>
          <p className="text-gray-500">
            {t("blog.admin.totalCategories", { count: categories.length })}
          </p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>{t("blog.admin.addCategory")}</span>
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {t("blog.admin.noCategories")}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">
                  {t("blog.admin.categoryName")}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden sm:table-cell">
                  Slug
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden md:table-cell">
                  {t("blog.admin.postCount")}
                </th>
                <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 hidden md:table-cell">
                  {t("blog.admin.status")}
                </th>
                <th className="text-right px-6 py-4 text-sm font-medium text-gray-500">
                  {t("blog.admin.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {category.color && (
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <span className="font-medium text-gray-800">
                        {getCategoryName(category)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden sm:table-cell">
                    {category.slug}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 hidden md:table-cell">
                    {category._count.posts}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        category.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {category.is_active ? t("blog.admin.active") : t("blog.admin.inactive")}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">
                {editing ? t("blog.admin.editCategory") : t("blog.admin.addCategory")}
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
                  placeholder="category-slug"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Folder"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t("blog.admin.color")}
                  </label>
                  <input
                    type="color"
                    value={formData.color || "#ec4899"}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 border border-gray-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">ภาษาไทย</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.translations.th.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          th: { ...formData.translations.th, name: e.target.value },
                        },
                      })
                    }
                    placeholder="ชื่อหมวดหมู่"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  />
                  <textarea
                    value={formData.translations.th.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          th: { ...formData.translations.th, description: e.target.value },
                        },
                      })
                    }
                    placeholder="คำอธิบาย (ไม่บังคับ)"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 resize-none"
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-medium mb-3">English</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.translations.en.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          en: { ...formData.translations.en, name: e.target.value },
                        },
                      })
                    }
                    placeholder="Category name"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                  />
                  <textarea
                    value={formData.translations.en.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        translations: {
                          ...formData.translations,
                          en: { ...formData.translations.en, description: e.target.value },
                        },
                      })
                    }
                    placeholder="Description (optional)"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 resize-none"
                  />
                </div>
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
