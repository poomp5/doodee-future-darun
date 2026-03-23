"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import R2Image from "@/components/R2Image";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/routing";
import { useAuth } from "@/components/AuthProvider";
import Swal from "@/lib/swal-toast";

type EditPage = {
  id: string;
  pageNumber: number;
  imageUrl: string;
  isVisible: boolean;
};

type PostEdit = {
  id: string;
  title: string;
  description?: string | null;
  university_name?: string | null;
  faculty_name?: string | null;
  user?: { id: string } | null;
  pages: EditPage[];
};

export default function CommunityEditPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [post, setPost] = useState<PostEdit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [pages, setPages] = useState<EditPage[]>([]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/community/${id}?edit=true`);
        const data = await res.json();
        if (!res.ok || data.error) {
          await Swal.fire({ icon: "error", title: data.error || "ไม่พบโพสต์", confirmButtonColor: "#db2777" });
          router.push("/community");
          return;
        }
        setPost(data);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setPages(
          (data.pages || []).map((p: any) => ({
            id: p.id,
            pageNumber: p.pageNumber,
            imageUrl: p.imageUrl,
            isVisible: p.isVisible !== false,
          }))
        );
      } catch {
        await Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", confirmButtonColor: "#db2777" });
        router.push("/community");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  // Redirect if not owner
  useEffect(() => {
    if (!authLoading && !loading && post) {
      if (!user || user.id !== post.user?.id) {
        router.push(`/community/${id}`);
      }
    }
  }, [authLoading, loading, post, user, id, router]);

  const visibleCount = useMemo(
    () => pages.filter((p) => p.isVisible).length,
    [pages]
  );

  const handleSave = async () => {
    if (!title.trim()) {
      Swal.fire({ icon: "warning", title: "กรุณากรอกชื่อผลงาน", confirmButtonColor: "#db2777" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/community/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description || null,
          pages: pages.map((p) => ({
            id: p.id,
            imageUrl: p.imageUrl,
            isVisible: p.isVisible,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "บันทึกไม่สำเร็จ");
      }
      await Swal.fire({ icon: "success", title: "บันทึกสำเร็จ!", timer: 1500, showConfirmButton: false });
      router.push(`/community/${id}`);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", text: err?.message || "เกิดข้อผิดพลาด", confirmButtonColor: "#db2777" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-4 py-5 md:py-8 space-y-6">
      <Link
        href={`/community/${id}` as any}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600 transition"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        กลับหน้าดูโพสต์
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">แก้ไขโพสต์</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: form */}
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-800">ชื่อผลงาน *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-800">รายละเอียด</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 h-24 focus:ring-2 focus:ring-pink-500 focus:outline-none"
            />
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-5 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 disabled:opacity-60 text-sm font-semibold"
            >
              {saving ? "กำลังบันทึก..." : "บันทึก"}
            </button>
            <Link
              href={`/community/${id}` as any}
              className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-semibold"
            >
              ยกเลิก
            </Link>
          </div>

          {pages.length > 0 && (
            <p className="text-xs text-gray-500">
              แสดง {visibleCount} จาก {pages.length} หน้า
            </p>
          )}
        </div>

        {/* Right: pages */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">เลือกหน้าที่จะแสดง</h3>
            <button
              onClick={() => setPages((prev) => prev.map((p) => ({ ...p, isVisible: true })))}
              className="text-xs text-pink-600 underline"
            >
              แสดงทั้งหมด
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto pr-1">
            {pages.map((page) => (
              <label
                key={page.id}
                className={`relative border rounded-lg overflow-hidden cursor-pointer group ${
                  page.isVisible ? "border-pink-500" : "border-gray-200 opacity-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={page.isVisible}
                  onChange={(e) =>
                    setPages((prev) =>
                      prev.map((p) =>
                        p.id === page.id ? { ...p, isVisible: e.target.checked } : p
                      )
                    )
                  }
                  className="absolute top-2 left-2 z-10 h-4 w-4"
                />
                <div className="relative w-full aspect-[3/4] bg-gray-50">
                  <R2Image
                    src={page.imageUrl}
                    alt={`หน้า ${page.pageNumber}`}
                    fill
                    className="object-cover"
                  />
                  <span className="absolute bottom-1 right-1 text-[11px] bg-black/60 text-white px-1 rounded">
                    หน้า {page.pageNumber}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
