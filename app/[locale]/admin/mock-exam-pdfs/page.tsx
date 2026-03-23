"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit,
  FileText,
  Upload,
  RefreshCw,
  Save,
  X,
  Eye,
  EyeOff,
  ExternalLink,
  File,
} from "lucide-react";

interface PdfExam {
  id: number;
  title: string;
  filename: string;
  r2_url: string;
  subject_code: string | null;
  exam_type: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export default function AdminMockExamPdfsPage() {
  const [pdfs, setPdfs] = useState<PdfExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<PdfExam | null>(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    filename: "",
    subject_code: "",
    exam_type: "",
    is_active: true,
    display_order: 0,
  });
  const [file, setFile] = useState<File | null>(null);

  const fetchPdfs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/mock-exam/pdfs");
      const data = await res.json();
      if (res.ok) setPdfs(data.data || []);
    } catch (err) {
      console.error("Error fetching PDF exams:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPdfs();
  }, [fetchPdfs]);

  const resetForm = () => {
    setForm({
      title: "",
      filename: "",
      subject_code: "",
      exam_type: "",
      is_active: true,
      display_order: 0,
    });
    setFile(null);
  };

  const handleCreate = async () => {
    if (!form.title || !form.filename) return alert("กรุณาใส่ชื่อและชื่อไฟล์");

    setUploading(true);
    try {
      let r2_url = "";

      // Upload file to R2 if provided
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", form.filename);

        const uploadRes = await fetch("/api/admin/mock-exam/pdfs/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "Upload failed");
        }

        const uploadData = await uploadRes.json();
        r2_url = uploadData.url;
      } else {
        // If no file, construct URL from filename
        r2_url = `/answers/${form.filename}`;
      }

      // Create record in DB
      const res = await fetch("/api/admin/mock-exam/pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          filename: form.filename,
          r2_url,
          subject_code: form.subject_code || null,
          exam_type: form.exam_type || null,
          is_active: form.is_active,
          display_order: form.display_order,
        }),
      });

      if (!res.ok) throw new Error("Failed to create");

      setShowCreate(false);
      resetForm();
      fetchPdfs();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error creating PDF exam");
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editing) return;
    setUploading(true);
    try {
      let r2_url = editing.r2_url;

      // Upload new file if provided
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("filename", form.filename);

        const uploadRes = await fetch("/api/admin/mock-exam/pdfs/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json();
          throw new Error(err.error || "Upload failed");
        }

        const uploadData = await uploadRes.json();
        r2_url = uploadData.url;
      }

      const res = await fetch("/api/admin/mock-exam/pdfs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editing.id,
          title: form.title,
          filename: form.filename,
          r2_url,
          subject_code: form.subject_code || null,
          exam_type: form.exam_type || null,
          is_active: form.is_active,
          display_order: form.display_order,
        }),
      });

      if (!res.ok) throw new Error("Failed to update");

      setEditing(null);
      resetForm();
      fetchPdfs();
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Error updating PDF exam");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("ยืนยันลบไฟล์ PDF นี้?")) return;
    try {
      await fetch(`/api/admin/mock-exam/pdfs?id=${id}`, { method: "DELETE" });
      fetchPdfs();
    } catch (err) {
      console.error(err);
    }
  };

  const openEdit = (pdf: PdfExam) => {
    setEditing(pdf);
    setForm({
      title: pdf.title,
      filename: pdf.filename,
      subject_code: pdf.subject_code || "",
      exam_type: pdf.exam_type || "",
      is_active: pdf.is_active,
      display_order: pdf.display_order,
    });
    setFile(null);
  };

  const EXAM_TYPES = ["TGAT", "TPAT", "A-LEVEL", "PAT", "GAT", ""];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-pink-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              จัดการข้อสอบ PDF
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              อัปโหลดและจัดการไฟล์ PDF ข้อสอบ / เฉลย
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreate(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl font-medium transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            เพิ่ม PDF ใหม่
          </button>
        </div>

        {/* PDF List */}
        {pdfs.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">ยังไม่มีไฟล์ PDF ข้อสอบ</p>
            <p className="text-sm text-gray-400 mt-1">
              กดปุ่ม "เพิ่ม PDF ใหม่" เพื่อเริ่มต้น
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pdfs.map((pdf) => (
              <div
                key={pdf.id}
                className={`bg-white rounded-xl border transition-all hover:shadow-md overflow-hidden ${
                  pdf.is_active
                    ? "border-gray-200"
                    : "border-red-200 opacity-60"
                }`}
              >
                {/* PDF Thumbnail */}
                <div className="relative aspect-[4/5] bg-gray-50 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/pdf-thumbnail?url=${encodeURIComponent(pdf.r2_url)}`}
                    alt={pdf.title}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = "none";
                      target.parentElement
                        ?.querySelector("[data-fallback]")
                        ?.classList.remove("hidden");
                    }}
                  />
                  <div
                    data-fallback
                    className="hidden absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100"
                  >
                    <File className="w-12 h-12 text-gray-300 mb-2" />
                    <span className="text-xs text-gray-400">PDF</span>
                  </div>
                  {/* Badges overlay */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    {pdf.exam_type && (
                      <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-blue-500 shadow-sm">
                        {pdf.exam_type}
                      </span>
                    )}
                    {!pdf.is_active && (
                      <span className="text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-red-500 shadow-sm">
                        ซ่อน
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 text-sm">
                    {pdf.title}
                  </h3>

                  {/* Filename */}
                  <p className="text-[11px] text-gray-400 font-mono mb-3 truncate">
                    /answers/{pdf.filename}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <a
                      href={pdf.r2_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      ดู PDF
                    </a>
                    <button
                      onClick={() => openEdit(pdf)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      แก้ไข
                    </button>
                    <button
                      onClick={() => handleDelete(pdf.id)}
                      className="flex items-center justify-center p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editing) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">
                {editing ? "แก้ไข PDF" : "เพิ่ม PDF ใหม่"}
              </h2>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setEditing(null);
                  resetForm();
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ชื่อที่แสดง *
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="เช่น เฉลย TCAS68 คณิตศาสตร์ A-Level"
                  className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Filename */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  ชื่อไฟล์ *{" "}
                  <span className="text-gray-400 font-normal">
                    (ไม่ต้องใส่ /answers/)
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400 shrink-0">
                    /answers/
                  </span>
                  <input
                    type="text"
                    value={form.filename}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, filename: e.target.value }))
                    }
                    placeholder="tcas68-math1-a-level.pdf"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  อัปโหลดไฟล์ PDF {!editing && "*"}
                </label>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl hover:border-pink-400 hover:bg-pink-50/30 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={(e) => {
                      const f = e.target.files?.[0] || null;
                      setFile(f);
                      // Auto-fill filename if empty
                      if (f && !form.filename) {
                        setForm((p) => ({ ...p, filename: f.name }));
                      }
                    }}
                    className="hidden"
                  />
                  {file ? (
                    <div className="text-center">
                      <FileText className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        คลิกเพื่อเลือกไฟล์ PDF
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        สูงสุด 50MB
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Exam Type + Subject Code */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ประเภทข้อสอบ
                  </label>
                  <select
                    value={form.exam_type}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, exam_type: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  >
                    <option value="">ไม่ระบุ</option>
                    {EXAM_TYPES.filter(Boolean).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    รหัสวิชา
                  </label>
                  <input
                    type="text"
                    value={form.subject_code}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, subject_code: e.target.value }))
                    }
                    placeholder="เช่น MATH, TGAT3"
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Display order + Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    ลำดับแสดง
                  </label>
                  <input
                    type="number"
                    value={form.display_order}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        display_order: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    สถานะ
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((p) => ({ ...p, is_active: !p.is_active }))
                    }
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                      form.is_active
                        ? "bg-green-50 border-green-300 text-green-700"
                        : "bg-red-50 border-red-300 text-red-700"
                    }`}
                  >
                    {form.is_active ? (
                      <>
                        <Eye className="w-4 h-4" />
                        แสดง
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        ซ่อน
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowCreate(false);
                  setEditing(null);
                  resetForm();
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={editing ? handleUpdate : handleCreate}
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 bg-pink-500 hover:bg-pink-600 disabled:bg-gray-300 text-white rounded-xl text-sm font-medium transition-colors"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    กำลังอัปโหลด...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editing ? "บันทึก" : "สร้าง"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
