"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/routing";
import Image from "next/image";
import {
  ArrowLeft,
  Save,
  Upload,
  Link as LinkIcon,
  Loader2,
  Gift,
  FileText,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import Swal from "@/lib/swal-toast";

interface FormData {
  title: string;
  description: string;
  image_url: string;
  icon: string;
  points_cost: number;
  reward_type: "link" | "pdf" | "message";
  reward_value: string;
  stock: number | null;
  is_active: boolean;
  display_order: number;
}

const REWARD_TYPES = [
  { value: "link", label: "ลิงก์", icon: ExternalLink, description: "ส่งลิงก์ให้ผู้ใช้" },
  { value: "pdf", label: "PDF", icon: FileText, description: "ส่งไฟล์ PDF" },
  { value: "message", label: "ข้อความ", icon: MessageSquare, description: "ส่งข้อความ/โค้ด" },
];

export default function EditPointsRewardPage() {
  const router = useRouter();
  const params = useParams();
  const rewardId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageInputMode, setImageInputMode] = useState<"upload" | "url">("url");

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
    image_url: "",
    icon: "Gift",
    points_cost: 10,
    reward_type: "link",
    reward_value: "",
    stock: null,
    is_active: true,
    display_order: 0,
  });

  useEffect(() => {
    const fetchReward = async () => {
      try {
        const res = await fetch("/api/db/points-rewards");
        const data = await res.json();
        const reward = data.data?.find((r: any) => r.id === parseInt(rewardId));

        if (reward) {
          setForm({
            title: reward.title || "",
            description: reward.description || "",
            image_url: reward.image_url || "",
            icon: reward.icon || "Gift",
            points_cost: reward.points_cost || 0,
            reward_type: reward.reward_type || "link",
            reward_value: reward.reward_value || "",
            stock: reward.stock,
            is_active: reward.is_active ?? true,
            display_order: reward.display_order || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching reward:", error);
        Swal.fire({ icon: "error", title: "ไม่พบข้อมูล" });
      } finally {
        setLoading(false);
      }
    };

    if (rewardId) {
      fetchReward();
    }
  }, [rewardId]);

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
      Swal.fire({ icon: "error", title: "กรุณากรอกชื่อของรางวัล" });
      return;
    }

    if (!form.reward_value.trim()) {
      Swal.fire({ icon: "error", title: "กรุณากรอกค่าของรางวัล (ลิงก์/ข้อความ)" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/db/points-rewards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: parseInt(rewardId),
          ...form,
        }),
      });

      if (!res.ok) throw new Error("Failed to save reward");

      Swal.fire({
        icon: "success",
        title: "บันทึกสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });

      router.push("/admin/points-rewards");
    } catch (error) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/points-rewards"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับ</span>
        </Link>
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Gift className="w-7 h-7 text-pink-500" />
          แก้ไขของรางวัล
        </h1>
        <p className="text-gray-500">แก้ไขข้อมูลของรางวัล</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            ข้อมูลของรางวัล
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อของรางวัล <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="เช่น Canva Pro 1 เดือน"
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
                placeholder="อธิบายรายละเอียดของรางวัล"
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
                  min={0}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  จำนวน Stock (เว้นว่างถ้าไม่จำกัด)
                </label>
                <input
                  type="number"
                  value={form.stock ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stock: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                  placeholder="ไม่จำกัด"
                  min={0}
                />
              </div>
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
        </div>

        {/* Reward Type */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            ประเภทของรางวัล
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {REWARD_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, reward_type: type.value as any })}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors text-left ${
                    form.reward_type === type.value
                      ? "border-pink-500 bg-pink-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${form.reward_type === type.value ? "bg-pink-100" : "bg-gray-100"}`}>
                    <Icon className={`w-5 h-5 ${form.reward_type === type.value ? "text-pink-500" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{type.label}</p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {form.reward_type === "link" && "ลิงก์ที่จะส่งให้ผู้ใช้"}
              {form.reward_type === "pdf" && "URL ไฟล์ PDF"}
              {form.reward_type === "message" && "ข้อความ/โค้ดที่จะส่งให้ผู้ใช้"}
              <span className="text-red-500">*</span>
            </label>
            {form.reward_type === "message" ? (
              <textarea
                value={form.reward_value}
                onChange={(e) => setForm({ ...form, reward_value: e.target.value })}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder="ข้อความหรือโค้ดที่จะส่งให้ผู้ใช้เมื่อแลกสำเร็จ"
              />
            ) : (
              <input
                type="text"
                value={form.reward_value}
                onChange={(e) => setForm({ ...form, reward_value: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:border-pink-500"
                placeholder={form.reward_type === "pdf" ? "https://example.com/file.pdf" : "https://..."}
              />
            )}
          </div>
        </div>

        {/* Image */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">รูปภาพ (ไม่บังคับ)</h2>

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
              <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
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
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
