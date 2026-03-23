"use client";

import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Loader2, ExternalLink, ImageIcon, Eye, EyeOff, ArrowUpDown, Calendar as CalendarIcon } from "lucide-react";
import Swal from "@/lib/swal-toast";
import { Link } from "@/routing";
import { useTranslations } from "next-intl";
import BannerUploader from "@/components/admin/BannerUploader";

type Banner = {
  id: number;
  title?: string | null;
  image_url: string;
  link_url?: string | null;
  is_active: boolean;
  display_order: number;
  start_date?: string | null;
  end_date?: string | null;
};

const emptyForm: Omit<Banner, "id"> = {
  title: "",
  image_url: "",
  link_url: "",
  is_active: true,
  display_order: 0,
  start_date: "",
  end_date: "",
};

export default function AdminBannersPage() {
  const t = useTranslations("admin");
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Omit<Banner, "id">>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/db/banners");
      const data = await res.json();
      setBanners(data.data || []);
    } catch (error) {
      console.error("Error fetching banners:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleSubmit = async () => {
    if (!form.image_url) {
      Swal.fire({ icon: "warning", title: "ต้องใส่รูปภาพ (image_url)" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      };
      const res = await fetch("/api/db/banners", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error saving");
      }
      await fetchBanners();
      setForm(emptyForm);
      setEditingId(null);
      Swal.fire({ icon: "success", title: "บันทึกสำเร็จ" });
    } catch (error) {
      console.error("Error saving banner:", error);
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ" });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setForm({
      title: banner.title || "",
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      is_active: banner.is_active,
      display_order: banner.display_order,
      start_date: banner.start_date ? banner.start_date.slice(0, 10) : "",
      end_date: banner.end_date ? banner.end_date.slice(0, 10) : "",
    });
  };

  const handleDelete = async (id: number) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "ลบแบนเนอร์นี้?",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonText: "ยกเลิก",
      confirmButtonText: "ลบ",
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`/api/db/banners?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      await fetchBanners();
      Swal.fire({ icon: "success", title: "ลบแล้ว" });
    } catch (error) {
      console.error("Error deleting banner:", error);
      Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ" });
    }
  };

  const handleDuplicate = (banner: Banner) => {
    setEditingId(null);
    setForm({
      title: banner.title || "",
      image_url: banner.image_url,
      link_url: banner.link_url || "",
      is_active: banner.is_active,
      display_order: banner.display_order + 1,
      start_date: banner.start_date ? banner.start_date.slice(0, 10) : "",
      end_date: banner.end_date ? banner.end_date.slice(0, 10) : "",
    });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">ประกาศ / Banners</h1>
          <p className="text-gray-500">แสดงในหน้า Home เป็นแบนเนอร์ 16:9 แนวนอน</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setForm(emptyForm);
          }}
          className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-lg shadow hover:bg-pink-700"
        >
          <Plus className="w-4 h-4" />
          เพิ่มใหม่
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <BannerUploader
            onUploaded={(url) => setForm((prev) => ({ ...prev, image_url: url }))}
          />
          <div className="space-y-2">
            <label className="text-sm text-gray-600">หัวข้อ</label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="เช่น TCAS รอบ Portfolio เปิดแล้ว"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Image URL</label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-xs text-gray-500">แนะนำอัตราส่วน 16:9 (ไม่ครอป)</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-gray-600">Link URL (ถ้ามี)</label>
            <input
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
              value={form.link_url || ""}
              onChange={(e) => setForm({ ...form, link_url: e.target.value })}
              placeholder="https:// หรือ /analyse"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-gray-600 flex items-center gap-1">
                <ArrowUpDown className="w-4 h-4" /> ลำดับ
              </label>
              <input
                type="number"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600 flex items-center gap-1">
                {form.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} สถานะ
              </label>
              <button
                onClick={() => setForm({ ...form, is_active: !form.is_active })}
                className={`w-full px-3 py-2 rounded-lg border ${form.is_active ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-600"}`}
              >
                {form.is_active ? "เปิด" : "ปิด"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <label className="text-sm text-gray-600 flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" /> เริ่มแสดง
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
                value={form.start_date || ""}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-600 flex items-center gap-1">
                <CalendarIcon className="w-4 h-4" /> สิ้นสุด
              </label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
                value={form.end_date || ""}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-pink-600 text-white py-2 rounded-lg shadow hover:bg-pink-700 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {editingId ? "บันทึกการแก้ไข" : "เพิ่มแบนเนอร์"}
          </button>
        </div>

        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">รายการแบนเนอร์</h2>
            <p className="text-sm text-gray-500">{banners.length} รายการ</p>
          </div>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              ยังไม่มีแบนเนอร์
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {banners.map((banner) => (
                <div key={banner.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
                  <div className="relative w-full aspect-[16/9] bg-gray-900">
                    <img
                      src={banner.image_url}
                      alt={banner.title || "banner"}
                      className="w-full h-full object-contain bg-black"
                    />
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold bg-black/60 text-white flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" /> {banner.display_order}
                    </div>
                    {banner.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white px-3 py-2">
                        <p className="text-sm font-semibold line-clamp-2">{banner.title}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className={`px-2 py-0.5 rounded-full ${banner.is_active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                        {banner.is_active ? "เปิด" : "ปิด"}
                      </span>
                      {banner.link_url && (
                        <a
                          href={banner.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-pink-600 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> Link
                        </a>
                      )}
                    </div>
                    {(banner.start_date || banner.end_date) && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <CalendarIcon className="w-4 h-4" />
                        {banner.start_date ? banner.start_date.slice(0, 10) : "-"} - {banner.end_date ? banner.end_date.slice(0, 10) : "-"}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-lg py-2 hover:bg-gray-50"
                      >
                        <Edit className="w-4 h-4" /> แก้ไข
                      </button>
                      <button
                        onClick={() => handleDuplicate(banner)}
                        className="flex-1 flex items-center justify-center gap-1 border border-gray-200 rounded-lg py-2 hover:bg-gray-50"
                      >
                        คัดลอก
                      </button>
                      <button
                        onClick={() => handleDelete(banner.id)}
                        className="flex-1 flex items-center justify-center gap-1 border border-red-200 text-red-600 rounded-lg py-2 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" /> ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
