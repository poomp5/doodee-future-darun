"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "@/routing";
import { ArrowLeft, Save, Upload, Link as LinkIcon, Loader2, Trash, Layers } from "lucide-react";
import { Link } from "@/routing";
import Image from "next/image";
import Swal from "@/lib/swal-toast";
import { SOURCE_OPTIONS } from "@/lib/categories";
import * as LucideIcons from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface CategoryItem {
  id: number;
  group_key: string;
  value: string;
  label: string;
}

interface CategoryGroup {
  id: number;
  key: string;
  label: string;
  icon: string;
  items: CategoryItem[];
}

interface ActivityForm {
  id: number;
  title: string;
  description: string;
  image_url: string;
  location: string;
  start_date: string;
  end_date: string;
  categories: string[];
  subcategories: string[];
  max_participants: number | null;
  price: number;
  source: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
  deadline: string;
}

export default function EditActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("url");
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Helper to get icon component
  const getIconComponent = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || Layers;
    return IconComponent;
  };

  const [form, setForm] = useState<ActivityForm>({
    id: 0,
    title: "",
    description: "",
    image_url: "",
    location: "",
    start_date: "",
    end_date: "",
    categories: [],
    subcategories: [],
    max_participants: null,
    price: 0,
    source: "other",
    link_url: "",
    is_active: true,
    display_order: 0,
    deadline: "",
  });

  // Toggle category selection
  const toggleCategory = (categoryKey: string) => {
    setForm(prev => {
      const isSelected = prev.categories.includes(categoryKey);
      if (isSelected) {
        // Remove category and its subcategories
        const group = categoryGroups.find(g => g.key === categoryKey);
        const subcatValues = group?.items.map(i => i.value) || [];
        return {
          ...prev,
          categories: prev.categories.filter(c => c !== categoryKey),
          subcategories: prev.subcategories.filter(s => !subcatValues.includes(s))
        };
      } else {
        return {
          ...prev,
          categories: [...prev.categories, categoryKey]
        };
      }
    });
  };

  // Toggle subcategory selection
  const toggleSubcategory = (subcategoryValue: string) => {
    setForm(prev => {
      const isSelected = prev.subcategories.includes(subcategoryValue);
      if (isSelected) {
        return {
          ...prev,
          subcategories: prev.subcategories.filter(s => s !== subcategoryValue)
        };
      } else {
        return {
          ...prev,
          subcategories: [...prev.subcategories, subcategoryValue]
        };
      }
    });
  };

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/db/categories");
        const data = await res.json();
        setCategoryGroups(data.data || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch("/api/db/activities");
        const data = await res.json();
        const activity = (data.data || []).find((a: any) => a.id === Number(id));

        if (activity) {
          // Handle both old single category format and new array format
          const categories = activity.categories
            ? (Array.isArray(activity.categories) ? activity.categories : JSON.parse(activity.categories))
            : (activity.category ? [activity.category] : []);
          const subcategories = activity.subcategories
            ? (Array.isArray(activity.subcategories) ? activity.subcategories : JSON.parse(activity.subcategories))
            : (activity.subcategory ? [activity.subcategory] : []);

          setForm({
            ...activity,
            start_date: activity.start_date?.split("T")[0] || "",
            end_date: activity.end_date?.split("T")[0] || "",
            deadline: activity.deadline?.split("T")[0] || "",
            categories,
            subcategories,
          });
        } else {
          Swal.fire({ icon: "error", title: "ไม่พบกิจกรรม" });
          router.push("/admin/activities");
        }
      } catch (error) {
        console.error("Error fetching activity:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [id, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({ icon: "error", title: "กรุณาเลือกไฟล์รูปภาพ" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: "error", title: "ไฟล์ต้องมีขนาดไม่เกิน 5MB" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.file?.url) {
        setForm({ ...form, image_url: data.file.url });
        Swal.fire({
          icon: "success",
          title: "อัปโหลดสำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({ icon: "error", title: "อัปโหลดไม่สำเร็จ" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      Swal.fire({ icon: "error", title: "กรุณากรอกชื่อกิจกรรม" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/db/activities", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save activity");

      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });

      router.push("/admin/activities");
    } catch (error) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ?",
      text: "คุณต้องการลบกิจกรรมนี้หรือไม่?",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/db/activities?id=${form.id}`, { method: "DELETE" });
        Swal.fire({
          icon: "success",
          title: "ลบสำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });
        router.push("/admin/activities");
      } catch (error) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    
      <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/activities"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับ</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">แก้ไขกิจกรรม</h1>
            <p className="text-gray-500">แก้ไขข้อมูลกิจกรรม</p>
          </div>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
          >
            <Trash className="w-5 h-5" />
            <span>ลบกิจกรรม</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ข้อมูลพื้นฐาน</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อกิจกรรม <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="ระบุชื่อกิจกรรม"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียด
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="ระบุรายละเอียดกิจกรรม"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สถานที่
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="เช่น ออนไลน์ (Zoom), มหาวิทยาลัย..."
              />
            </div>
          </div>
        </div>

        {/* Date & Participants */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">วันที่และผู้เข้าร่วม</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่เริ่ม
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                วันปิดรับสมัคร
              </label>
              <input
                type="date"
                value={form.deadline || ""}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนผู้เข้าร่วมสูงสุด
              </label>
              <input
                type="number"
                value={form.max_participants || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    max_participants: e.target.value ? Number(e.target.value) : null,
                  })
                }
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="ไม่จำกัด"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Image */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">รูปภาพ</h2>

          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setImageInputMode("upload")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                imageInputMode === "upload"
                  ? "border-pink-500 bg-pink-50 text-pink-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>อัปโหลด</span>
            </button>
            <button
              type="button"
              onClick={() => setImageInputMode("url")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                imageInputMode === "url"
                  ? "border-pink-500 bg-pink-50 text-pink-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>URL</span>
            </button>
          </div>

          {imageInputMode === "upload" ? (
            <label className="block">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center hover:border-pink-300 transition-colors cursor-pointer">
                {uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
                    <p className="text-gray-500">กำลังอัปโหลด...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <p className="text-gray-600">คลิกเพื่อเลือกไฟล์</p>
                    <p className="text-sm text-gray-400">PNG, JPG, WEBP (สูงสุด 5MB)</p>
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploading}
              />
            </label>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL รูปภาพ
              </label>
              <input
                type="text"
                value={form.image_url}
                onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="https://..."
              />
            </div>
          )}

          {form.image_url && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-gray-200">
                <Image src={form.image_url} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_url: "" })}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <span className="sr-only">Remove</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">หมวดหมู่ (เลือกได้หลายอัน)</h2>
          {loadingCategories ? (
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  หมวดหมู่หลัก
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                  {categoryGroups.map((group) => {
                    const Icon = getIconComponent(group.icon);
                    const isSelected = form.categories.includes(group.key);
                    return (
                      <button
                        key={group.key}
                        type="button"
                        onClick={() => toggleCategory(group.key)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-colors text-sm ${
                          isSelected
                            ? "border-pink-500 bg-pink-50 text-pink-600"
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{group.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.categories.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    หมวดหมู่ย่อย
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {form.categories.map(catKey => {
                      const group = categoryGroups.find(g => g.key === catKey);
                      return group?.items.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => toggleSubcategory(item.value)}
                          className={`px-3 py-1.5 rounded-full border-2 transition-colors text-sm ${
                            form.subcategories.includes(item.value)
                              ? "border-pink-500 bg-pink-50 text-pink-600"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                        >
                          {item.label}
                        </button>
                      ));
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Price & Order */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">ราคาและการจัดเรียง</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ค่าสมัคร (บาท)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="0 = ฟรี"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ลำดับการแสดง
              </label>
              <input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                min={0}
              />
            </div>
          </div>
        </div>

        {/* Source & Link */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">แหล่งที่มาและลิงก์</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                แหล่งที่มา
              </label>
              <div className="flex gap-2">
                {SOURCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm({ ...form, source: opt.value })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-colors ${
                      form.source === opt.value
                        ? "border-pink-500 bg-pink-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {opt.icon && (
                      <Image src={opt.icon} alt={opt.label} width={60} height={60} className="w-auto h-5" />
                    )}
                    <span className="text-sm">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ลิงก์ URL (กดแล้วไปหน้านี้)
              </label>
              <input
                type="text"
                value={form.link_url}
                onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="https://..."
              />
            </div>
          </div>
        </div>

        {/* Status & Submit */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="w-5 h-5 text-pink-500 rounded"
              />
              <span className="font-medium text-gray-700">เปิดใช้งาน</span>
            </label>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              <span>บันทึก</span>
            </button>
          </div>
        </div>
      </form>
      </div>
    
  );
}
