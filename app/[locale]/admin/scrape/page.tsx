"use client";
import { useState } from "react";
import { Link } from "@/routing";
import Image from "next/image";
import Swal from "@/lib/swal-toast";
import {
  ArrowLeft,
  Globe,
  Search,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
} from "lucide-react";

interface ScrapedResult {
  url: string;
  success: boolean;
  data?: {
    id?: number;
    table?: string;
    title: string;
    description: string;
    image_url: string;
    location: string;
    start_date: string | null;
    end_date: string | null;
    deadline: string | null;
    category: string;
    subcategory: string;
    max_participants: number | null;
    source: string;
    link_url: string;
    price: number;
    content_type: "course" | "activity";
  };
  error?: string;
}

export default function AdminScrapePage() {
  const [urlText, setUrlText] = useState("");
  const [previewing, setPreviewing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<ScrapedResult[]>([]);
  const [mode, setMode] = useState<"input" | "preview" | "saved">("input");

  const validUrls = urlText
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u.length > 0);

  const handlePreview = async () => {
    if (validUrls.length === 0) {
      Swal.fire({ icon: "warning", title: "กรุณาใส่ URL อย่างน้อย 1 รายการ" });
      return;
    }

    setPreviewing(true);
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: validUrls, preview: true }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results);
      setMode("preview");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err instanceof Error ? err.message : "ไม่สามารถดึงข้อมูลได้",
      });
    } finally {
      setPreviewing(false);
    }
  };

  const handleSave = async () => {
    const successUrls = results.filter((r) => r.success).map((r) => r.url);
    if (successUrls.length === 0) {
      Swal.fire({ icon: "warning", title: "ไม่มีรายการที่สามารถบันทึกได้" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: successUrls, preview: false }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results);
      setMode("saved");

      const savedCount = data.results.filter((r: ScrapedResult) => r.success).length;
      Swal.fire({
        icon: "success",
        title: `บันทึกสำเร็จ ${savedCount} รายการ`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: err instanceof Error ? err.message : "ไม่สามารถบันทึกได้",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setUrlText("");
    setResults([]);
    setMode("input");
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/activities"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กิจกรรม</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Web Scraping</h1>
            <p className="text-gray-500">ดึงข้อมูลค่าย/คอร์สจาก CampHub อัตโนมัติ</p>
          </div>
        </div>
      </div>

      {/* URL Input Section */}
      {mode === "input" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-800">
                URL กิจกรรม ({validUrls.length} รายการ)
              </h2>
            </div>

            <textarea
              value={urlText}
              onChange={(e) => setUrlText(e.target.value)}
              rows={8}
              placeholder={"วาง URL แต่ละบรรทัด เช่น\nhttps://www.camphub.in.th/example-camp-1/\nhttps://www.camphub.in.th/example-camp-2/"}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:border-pink-500 text-sm font-mono leading-relaxed resize-y"
            />

            <div className="mt-3 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-xs text-blue-700">
                1 บรรทัด = 1 URL, สูงสุด 20 รายการ
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handlePreview}
              disabled={previewing || validUrls.length === 0}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {previewing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              <span>{previewing ? "กำลังดึงข้อมูล..." : "ดึงข้อมูล & ดูตัวอย่าง"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Preview / Saved Results */}
      {(mode === "preview" || mode === "saved") && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {results.filter((r) => r.success).length} สำเร็จ
                </span>
              </div>
              {results.some((r) => !r.success) && (
                <div className="flex items-center gap-1.5 text-red-500">
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {results.filter((r) => !r.success).length} ล้มเหลว
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                เริ่มใหม่
              </button>
              {mode === "preview" && results.some((r) => r.success) && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-5 py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? "กำลังบันทึก..." : "บันทึกลง Database"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Result Cards */}
          <div className="space-y-4">
            {results.map((result, index) => (
              <div
                key={index}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  result.success ? "border-gray-100" : "border-red-200"
                }`}
              >
                {result.success && result.data ? (
                  <div className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image */}
                      {result.data.image_url && (
                        <div className="relative w-full md:w-48 h-32 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                          <Image
                            src={result.data.image_url}
                            alt={result.data.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-2">
                            {result.data.title}
                          </h3>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              result.data.content_type === "course"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-orange-100 text-orange-700"
                            }`}>
                              {result.data.content_type === "course" ? "คอร์ส" : "ค่าย"}
                            </span>
                            {mode === "saved" && result.data.id && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                {result.data.table === "courses" ? "courses" : "activities"} #{result.data.id}
                              </span>
                            )}
                          </div>
                        </div>

                        {result.data.description && (
                          <p className="text-sm text-gray-500 line-clamp-2">
                            {result.data.description}
                          </p>
                        )}

                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="bg-pink-50 text-pink-600 px-2 py-0.5 rounded-full">
                            {result.data.category}
                          </span>
                          <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                            {result.data.subcategory}
                          </span>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {result.data.location}
                          </span>
                          {result.data.start_date && (
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                              {result.data.start_date}
                            </span>
                          )}
                          {result.data.price > 0 && (
                            <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">
                              {result.data.price.toLocaleString()} บาท
                            </span>
                          )}
                          {result.data.max_participants && (
                            <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full">
                              {result.data.max_participants} คน
                            </span>
                          )}
                        </div>

                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {result.url}
                        </a>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-red-700 font-medium">{result.error}</p>
                      <p className="text-xs text-gray-500 truncate">{result.url}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
