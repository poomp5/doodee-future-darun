"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ExternalLink,
  Eye,
  FileImage,
  FileText,
  Search,
  Upload,
} from "lucide-react";
import R2Image from "@/components/R2Image";

type UploadLog = {
  id: string;
  user_id: string;
  portfolio_name: string;
  template_type: string | null;
  file_url: string;
  file_key: string | null;
  file_size: number | null;
  file_type: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  status: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  updated_at: string | null;
  analysis_count: number;
  latest_analysis_at: string | null;
  users: {
    id: string;
    email: string | null;
    username: string | null;
    full_name: string | null;
    profile_image_url: string | null;
  };
};

function formatBytes(value: number | null) {
  if (!value || value <= 0) return "-";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function AdminPortfolioUploadsPage() {
  const [logs, setLogs] = useState<UploadLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `/api/admin/portfolio-uploads?limit=150${
            search ? `&search=${encodeURIComponent(search)}` : ""
          }`,
          { signal: controller.signal },
        );
        const data = await res.json();
        setLogs(data.data || []);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          console.error("Error fetching portfolio upload logs:", error);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [search]);

  const stats = useMemo(() => {
    const imageCount = logs.filter((item) => item.file_type?.startsWith("image/")).length;
    const pdfCount = logs.filter(
      (item) =>
        item.file_type?.includes("pdf") ||
        item.file_url.toLowerCase().endsWith(".pdf"),
    ).length;

    return {
      total: logs.length,
      withPreview: logs.filter((item) => !!item.preview_url).length,
      imageCount,
      pdfCount,
    };
  }, [logs]);

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio Upload Logs</h1>
          <p className="text-sm text-gray-500">
            ดูรายการอัปโหลดพอร์ตทั้งหมด พร้อมลิงก์ CDN สำหรับ preview ในหลังบ้าน
          </p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาจากชื่อไฟล์ ผู้ใช้ อีเมล หรือลิงก์ CDN"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-50"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-pink-100 p-3 text-pink-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">อัปโหลดทั้งหมด</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">มี Preview</p>
              <p className="text-2xl font-bold text-gray-900">{stats.withPreview}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <FileImage className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">ไฟล์รูป</p>
              <p className="text-2xl font-bold text-gray-900">{stats.imageCount}</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-100 p-3 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">ไฟล์ PDF</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pdfCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">Preview</th>
                <th className="px-4 py-3">ไฟล์</th>
                <th className="px-4 py-3">ผู้ใช้</th>
                <th className="px-4 py-3">ประเภท</th>
                <th className="px-4 py-3">Analysis</th>
                <th className="px-4 py-3">เวลา</th>
                <th className="px-4 py-3">ลิงก์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    <td className="px-4 py-4">
                      <div className="h-16 w-16 animate-pulse rounded-xl bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-48 animate-pulse rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-36 animate-pulse rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-20 animate-pulse rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-28 animate-pulse rounded bg-gray-100" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 w-32 animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-500">
                    ไม่พบรายการอัปโหลด
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-4">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                        {item.preview_url ? (
                          <R2Image
                            src={item.preview_url}
                            alt={item.portfolio_name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-400">
                            <FileText className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="max-w-xs truncate font-medium text-gray-900">
                        {item.portfolio_name}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{item.file_type || "-"}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatBytes(item.file_size)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">
                        {item.users.full_name || item.users.username || "-"}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">{item.users.email || "-"}</p>
                      {item.users.username && (
                        <Link
                          href={`/th/u/${item.users.username}`}
                          target="_blank"
                          className="mt-2 inline-flex text-xs text-pink-600 hover:underline"
                        >
                          @{item.users.username}
                        </Link>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                        {item.template_type || "general"}
                      </span>
                      <p className="mt-2 text-xs text-gray-500">status: {item.status || "-"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-gray-900">{item.analysis_count}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        ล่าสุด: {formatDate(item.latest_analysis_at)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-gray-900">{formatDate(item.created_at)}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        updated: {formatDate(item.updated_at)}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col items-start gap-2">
                        {item.preview_url && (
                          <a
                            href={item.preview_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg bg-pink-50 px-2.5 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-100"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Preview CDN
                          </a>
                        )}
                        <a
                          href={item.file_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Original File
                        </a>
                        <p className="max-w-[220px] break-all text-[11px] text-gray-400">
                          {item.preview_url || item.file_url}
                        </p>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
