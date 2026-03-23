"use client";
import { useState, useEffect } from "react";
import { useRouter } from "@/routing";
import { Link } from "@/routing";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  Upload,
  Link as LinkIcon,
  Loader2,
  Star,
  BookOpen,
  Plus,
} from "lucide-react";
import Swal from "@/lib/swal-toast";

interface Course {
  id: number;
  title: string;
  description: string;
  image_url: string;
  price: number;
  link_url: string;
}

interface FormData {
  title: string;
  description: string;
  image_url: string;
  points_cost: number;
  link_url: string;
  course_id: number | null;
  course_type: "custom" | "from_courses";
  is_active: boolean;
  display_order: number;
}

export default function NewPointsCoursePage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("upload");
  const [inputMode, setInputMode] = useState<"custom" | "select">("custom");
  const [existingCourses, setExistingCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    image_url: "",
    points_cost: 0,
    link_url: "",
    course_id: null,
    course_type: "custom",
    is_active: true,
    display_order: 0,
  });

  // Fetch existing courses when switching to select mode
  useEffect(() => {
    if (inputMode === "select") {
      fetchExistingCourses();
    }
  }, [inputMode]);

  const fetchExistingCourses = async () => {
    setLoadingCourses(true);
    try {
      const res = await fetch("/api/db/courses?is_active=true");
      const data = await res.json();
      setExistingCourses(data.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleSelectCourse = (course: Course) => {
    setForm({
      ...form,
      title: course.title,
      description: course.description || "",
      image_url: course.image_url || "",
      link_url: course.link_url || "",
      course_id: course.id,
      course_type: "from_courses",
    });
  };

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
      Swal.fire({ icon: "error", title: "กรุณากรอกชื่อคอร์ส" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/db/points-courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to save course");

      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });

      router.push("/admin/points-courses");
    } catch (error) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
    } finally {
      setSaving(false);
    }
  };

  const filteredCourses = existingCourses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/points-courses"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับ</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Star className="w-7 h-7 text-pink-500" />
          เพิ่มคอร์สในหน้า Points
        </h1>
        <p className="text-gray-500">เลือกจากคอร์สที่มีในระบบ หรือเพิ่มเอง</p>
      </div>

      {/* Input Mode Selection */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          เลือกวิธีการเพิ่มคอร์ส
        </h2>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setInputMode("custom");
              setForm({
                ...form,
                course_id: null,
                course_type: "custom",
              });
            }}
            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-colors ${
              inputMode === "custom"
                ? "border-pink-500 bg-pink-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <Plus className="w-6 h-6 text-pink-500" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">เพิ่มเอง</p>
              <p className="text-sm text-gray-500">กรอกข้อมูลคอร์สใหม่</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setInputMode("select")}
            className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-colors ${
              inputMode === "select"
                ? "border-pink-500 bg-pink-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <BookOpen className="w-6 h-6 text-blue-500" />
            <div className="text-left">
              <p className="font-semibold text-gray-800">เลือกจากคอร์สในระบบ</p>
              <p className="text-sm text-gray-500">ใช้ข้อมูลจากคอร์สที่มี</p>
            </div>
          </button>
        </div>
      </div>

      {/* Course Selection (when in select mode) */}
      {inputMode === "select" && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            เลือกคอร์สจากระบบ
          </h2>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="ค้นหาคอร์ส..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Course List */}
          {loadingCourses ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            </div>
          ) : filteredCourses.length === 0 ? (
            <p className="text-center text-gray-500 py-8">ไม่พบคอร์ส</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
              {filteredCourses.map((course) => (
                <button
                  key={course.id}
                  type="button"
                  onClick={() => handleSelectCourse(course)}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors text-left ${
                    form.course_id === course.id
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="relative w-16 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    {course.image_url ? (
                      <Image
                        src={course.image_url}
                        alt={course.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <BookOpen className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 truncate">
                      {course.title}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {course.description || "ไม่มีคำอธิบาย"}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            ข้อมูลคอร์ส
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อคอร์ส <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="ระบุชื่อคอร์ส"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียด
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="ระบุรายละเอียดคอร์ส"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points ที่ต้องใช้ <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={form.points_cost}
                  onChange={(e) =>
                    setForm({ ...form, points_cost: Number(e.target.value) })
                  }
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
                  onChange={(e) =>
                    setForm({ ...form, display_order: Number(e.target.value) })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  min={0}
                />
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

        {/* Image */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">รูปภาพ</h2>

          {/* Image Input Mode Toggle */}
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
                    <p className="text-sm text-gray-400">
                      PNG, JPG, WEBP (สูงสุด 5MB)
                    </p>
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

          {/* Image Preview */}
          {form.image_url && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Preview</p>
              <div className="relative w-48 h-32 rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={form.image_url}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, image_url: "" })}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <span className="sr-only">Remove</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Status & Submit */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm({ ...form, is_active: e.target.checked })
                }
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
