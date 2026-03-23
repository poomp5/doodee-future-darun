"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from "@/routing";
import Swal from "@/lib/swal-toast";
import {
  GraduationCap,
  Search,
  Download,
  Edit,
  Trash,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  Upload,
  FileText,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface Program {
  id: number;
  university_name_th?: string;
  university_name_en?: string;
  faculty_name_th?: string;
  faculty_name_en?: string;
  program_name_th?: string;
  program_name_en?: string;
  program_id?: string;
  academic_years: string[];
  logo_url?: string;
  university_id?: string;
  file_path_1?: string;
  file_path_2?: string;
  file_path_3?: string;
  file_path_4?: string;
  created_at?: string;
  updated_at?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  });

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importStep, setImportStep] = useState<"configure" | "preview" | "importing" | "complete">("configure");
  const [importYear, setImportYear] = useState("");
  const [universitiesUrl, setUniversitiesUrl] = useState(
    "https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/universities.json"
  );
  const [coursesUrl, setCoursesUrl] = useState(
    "https://my-tcas.s3.ap-southeast-1.amazonaws.com/mytcas/courses.json"
  );
  const [skipExistingLogos, setSkipExistingLogos] = useState(true);
  const [previewData, setPreviewData] = useState<any>(null);
  const [previewTab, setPreviewTab] = useState<"universities" | "courses">("universities");
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [importProgress, setImportProgress] = useState<{
    progress: number;
    processed: number;
    total: number;
    stats: any;
  } | null>(null);
  const [importLogs, setImportLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // File viewer dialog state
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  useEffect(() => {
    fetchPrograms();
  }, [pagination.page, searchTerm, academicYear]);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [importLogs]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchTerm) params.append("search", searchTerm);
      if (academicYear) params.append("academic_year", academicYear);

      const res = await fetch(`/api/admin/programs?${params}`);
      const data = await res.json();

      if (data.programs) {
        setPrograms(data.programs);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Error fetching programs:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถโหลดข้อมูลหลักสูตรได้",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!importYear || !/^\d{4}$/.test(importYear)) {
      Swal.fire({
        icon: "error",
        title: "ข้อมูลไม่ถูกต้อง",
        text: "กรุณาระบุปีการศึกษา 4 หลัก เช่น 2568",
      });
      return;
    }

    if (!universitiesUrl || !coursesUrl) {
      Swal.fire({
        icon: "error",
        title: "ข้อมูลไม่ครบ",
        text: "กรุณาระบุ URL ทั้ง 2 รายการ",
      });
      return;
    }

    setImportLoading(true);
    setImportStep("preview");

    try {
      const res = await fetch("/api/admin/programs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academic_year: importYear,
          universities_url: universitiesUrl,
          courses_url: coursesUrl,
          preview: true,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Preview failed");
      }

      setPreviewData(data);
    } catch (error: any) {
      console.error("Preview error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถแสดงตัวอย่างข้อมูลได้",
      });
      setImportStep("configure");
    } finally {
      setImportLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setImportLoading(true);
    setImportStep("importing");
    setImportProgress({ progress: 0, processed: 0, total: 0, stats: {} });
    setImportLogs([]);

    try {
      const res = await fetch("/api/admin/programs/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          academic_year: importYear,
          universities_url: universitiesUrl,
          courses_url: coursesUrl,
          skip_existing_logos: skipExistingLogos,
          preview: false,
        }),
      });

      if (!res.ok) {
        throw new Error("Import request failed");
      }

      // Read streaming response
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // Decode chunk
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.stage === "processing") {
                // Update progress
                setImportProgress({
                  progress: data.progress || 0,
                  processed: data.processed || 0,
                  total: data.total || 0,
                  stats: data.stats || {},
                });
                // Add log message
                if (data.message) {
                  setImportLogs((prev) => [...prev, data.message]);
                }
              } else if (data.stage === "complete") {
                // Import complete
                setImportResult(data.stats);
                setImportStep("complete");
                setImportLoading(false);

                // Show success message
                Swal.fire({
                  icon: "success",
                  title: "นำเข้าข้อมูลสำเร็จ!",
                  html: `
                    <div class="text-left">
                      <p><strong>ปีการศึกษา:</strong> ${importYear}</p>
                      <p><strong>จำนวนทั้งหมด:</strong> ${data.stats.total.toLocaleString()} รายการ</p>
                      <p><strong>สร้างใหม่:</strong> ${data.stats.created.toLocaleString()} รายการ</p>
                      <p><strong>อัปเดต:</strong> ${data.stats.updated.toLocaleString()} รายการ</p>
                      <p><strong>อัปโหลดโลโก้:</strong> ${data.stats.logosUploaded.toLocaleString()} รายการ${skipExistingLogos ? ' (ข้ามที่มีแล้ว)' : ' (บังคับอัปโหลดใหม่)'}</p>
                      ${data.stats.errors.length > 0 ? `<p class="text-red-600"><strong>ข้อผิดพลาด:</strong> ${data.stats.errors.length} รายการ</p>` : ""}
                    </div>
                  `,
                  confirmButtonText: "ตกลง",
                });

                // Refresh list
                fetchPrograms();
              } else if (data.stage === "error") {
                throw new Error(data.error || "Import failed");
              }
            } catch (parseError) {
              console.error("Error parsing progress data:", parseError);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("Import error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: error.message || "ไม่สามารถนำเข้าข้อมูลได้",
      });
      setImportStep("preview");
      setImportLoading(false);
    }
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setImportStep("configure");
    setPreviewData(null);
    setPreviewTab("universities");
    setImportResult(null);
    setImportProgress(null);
    setImportLogs([]);
    setImportYear("");
  };

  const handleViewFiles = (program: Program) => {
    setSelectedProgram(program);
    setFileViewerOpen(true);
  };

  const handleDelete = async (id: number, programName: string) => {
    const result = await Swal.fire({
      title: "ยืนยันลบหลักสูตร?",
      text: `ต้องการลบ "${programName}" หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/admin/programs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "ลบสำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchPrograms();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถลบหลักสูตรได้",
      });
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-pink-500 to-purple-500 rounded-xl text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">จัดการหลักสูตร</h1>
            <p className="text-sm text-gray-600">
              จัดการข้อมูลหลักสูตรมหาวิทยาลัย
            </p>
          </div>
        </div>

        <button
          onClick={() => setImportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition"
        >
          <Download className="w-5 h-5" />
          นำเข้าข้อมูลล่าสุด
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหา มหาวิทยาลัย คณะ หลักสูตร..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>

          {/* Academic Year Filter */}
          <input
            type="text"
            placeholder="ปีการศึกษา เช่น 2568"
            value={academicYear}
            onChange={(e) => {
              setAcademicYear(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl p-4 shadow-sm border mb-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            แสดง {programs.length} จาก {pagination.total.toLocaleString()} รายการ
          </p>
          <p className="text-sm text-gray-600">
            หน้า {pagination.page} / {pagination.totalPages}
          </p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500" />
        </div>
      )}

      {/* Programs Table (Desktop) */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    โลโก้
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    มหาวิทยาลัย
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    คณะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    หลักสูตร
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    ปีการศึกษา
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {programs.map((program) => (
                  <tr key={program.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {program.logo_url ? (
                        <img
                          src={program.logo_url}
                          alt="Logo"
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {program.university_name_th}
                      </div>
                      <div className="text-xs text-gray-500">
                        {program.university_name_en}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {program.faculty_name_th}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {program.program_name_th}
                      </div>
                      <div className="text-xs text-gray-500">
                        {program.program_id}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {program.academic_years.map((year) => (
                          <span
                            key={year}
                            className="inline-block px-2 py-1 text-xs bg-pink-100 text-pink-700 rounded"
                          >
                            {year}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewFiles(program)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="ดูไฟล์ Portfolio"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(program.id, program.program_name_th || "")
                          }
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ก่อนหน้า
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .filter(
                      (page) =>
                        page === 1 ||
                        page === pagination.totalPages ||
                        Math.abs(page - pagination.page) <= 2
                    )
                    .map((page, idx, arr) => (
                      <>
                        {idx > 0 && arr[idx - 1] !== page - 1 && (
                          <span key={`ellipsis-${page}`} className="px-2">
                            ...
                          </span>
                        )}
                        <button
                          key={page}
                          onClick={() => setPagination({ ...pagination, page })}
                          className={`px-3 py-1 text-sm rounded-lg ${
                            pagination.page === page
                              ? "bg-pink-500 text-white"
                              : "hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      </>
                    ))}
                </div>

                <button
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 text-sm border rounded-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">นำเข้าข้อมูลหลักสูตร</h2>

            {/* Step 1: Configure */}
            {importStep === "configure" && (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      ปีการศึกษา (ค.ศ.) *
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น 2568"
                      value={importYear}
                      onChange={(e) => setImportYear(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500"
                      maxLength={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      URL ข้อมูลมหาวิทยาลัย *
                    </label>
                    <input
                      type="text"
                      value={universitiesUrl}
                      onChange={(e) => setUniversitiesUrl(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 font-mono text-sm"
                      placeholder="https://..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      URL ข้อมูลหลักสูตร *
                    </label>
                    <input
                      type="text"
                      value={coursesUrl}
                      onChange={(e) => setCoursesUrl(e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 font-mono text-sm"
                      placeholder="https://..."
                    />
                  </div>

                  {/* Logo Upload Toggle */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="skipExistingLogos"
                        checked={skipExistingLogos}
                        onChange={(e) => setSkipExistingLogos(e.target.checked)}
                        className="w-5 h-5 text-pink-600 rounded mt-0.5"
                      />
                      <div className="flex-1">
                        <label htmlFor="skipExistingLogos" className="text-sm font-medium cursor-pointer">
                          ข้ามโลโก้ที่อัปโหลดไปยัง R2 แล้ว (Smart Mode)
                        </label>
                        <p className="text-xs text-gray-600 mt-1">
                          {skipExistingLogos ? (
                            <span className="inline-flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                              <span>
                                ข้ามโลโก้ที่มีอยู่แล้วใน R2 - อัปโหลดเฉพาะโลโก้ใหม่
                                <span className="text-green-600 font-medium"> (เร็วกว่า, แนะนำ)</span>
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                              <span>
                                บังคับอัปโหลดโลโก้ทั้งหมดใหม่ - เขียนทับโลโก้เก่า
                                <span className="text-orange-600 font-medium"> (ช้ากว่า)</span>
                              </span>
                            </span>
                          )}
                        </p>
                        {!skipExistingLogos && (
                          <p className="text-xs text-orange-600 mt-1 italic font-medium inline-flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            หมายเหตุ: จะอัปโหลดโลโก้ทั้งหมดใหม่แม้ว่าจะมีอยู่แล้วใน R2
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={closeImportModal}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handlePreview}
                    disabled={importLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {importLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        กำลังโหลด...
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5" />
                        ดูตัวอย่างข้อมูล
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Step 2: Preview */}
            {importStep === "preview" && previewData && (
              <>
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-blue-900 mb-2">สรุปข้อมูล</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">จำนวนทั้งหมด:</span>
                        <span className="font-semibold ml-2">
                          {previewData.stats.total.toLocaleString()} รายการ
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">มหาวิทยาลัย:</span>
                        <span className="font-semibold ml-2">
                          {previewData.stats.universities_count.toLocaleString()} รายการ
                        </span>
                      </div>
                      <div>
                        <span className="text-blue-700">หลักสูตร:</span>
                        <span className="font-semibold ml-2">
                          {previewData.stats.courses_count.toLocaleString()} รายการ
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-gray-200 mb-4">
                    <div className="flex gap-4">
                      <button
                        onClick={() => setPreviewTab("universities")}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                          previewTab === "universities"
                            ? "border-pink-500 text-pink-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        ข้อมูลมหาวิทยาลัย ({previewData.stats.universities_count.toLocaleString()})
                      </button>
                      <button
                        onClick={() => setPreviewTab("courses")}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                          previewTab === "courses"
                            ? "border-pink-500 text-pink-600"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        ข้อมูลหลักสูตร ({previewData.stats.courses_count.toLocaleString()})
                      </button>
                    </div>
                  </div>

                  {/* Table Content */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto max-h-[500px]">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                          <tr>
                            <th className="px-3 py-2 text-left whitespace-nowrap">ID</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">มหาวิทยาลัย (TH)</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">มหาวิทยาลัย (EN)</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">คณะ (TH)</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">คณะ (EN)</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">หลักสูตร (TH)</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">Program ID</th>
                            <th className="px-3 py-2 text-left whitespace-nowrap">ประเภท</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {previewTab === "universities" &&
                            previewData.universities?.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.university_name_th || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-xs">
                                  {item.university_name_en || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.faculty_name_th || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-xs">
                                  {item.faculty_name_en || "-"}
                                </td>
                                <td className="px-3 py-2 max-w-xs truncate" title={item.program_name_th}>
                                  {item.program_name_th || "-"}
                                </td>
                                <td className="px-3 py-2 font-mono text-xs">
                                  {item.program_id || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                  {item.program_type_name_th || "-"}
                                </td>
                              </tr>
                            ))}
                          {previewTab === "courses" &&
                            previewData.courses?.map((item: any, idx: number) => (
                              <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-3 py-2 text-gray-500">{idx + 1}</td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.university_name_th || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-xs">
                                  {item.university_name_en || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  {item.faculty_name_th || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-gray-600 text-xs">
                                  {item.faculty_name_en || "-"}
                                </td>
                                <td className="px-3 py-2 max-w-xs truncate" title={item.program_name_th}>
                                  {item.program_name_th || "-"}
                                </td>
                                <td className="px-3 py-2 font-mono text-xs">
                                  {item.program_id || "-"}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs">
                                  {item.program_type_name_th || "-"}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    แสดงข้อมูลทั้งหมด - เลื่อนดูได้
                  </p>
                </div>

                {/* Logo Upload Quick Toggle */}
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="skipExistingLogosPreview"
                      checked={skipExistingLogos}
                      onChange={(e) => setSkipExistingLogos(e.target.checked)}
                      className="w-4 h-4 text-pink-600 rounded"
                    />
                    <label htmlFor="skipExistingLogosPreview" className="text-xs cursor-pointer flex-1">
                      {skipExistingLogos ? (
                        <span className="inline-flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          ข้ามโลโก้ที่มีแล้ว <span className="text-green-600">(เร็วกว่า)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                          อัปโหลดใหม่ทั้งหมด <span className="text-orange-600">(ช้ากว่า)</span>
                        </span>
                      )}
                    </label>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setImportStep("configure")}
                    className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                  >
                    แก้ไข
                  </button>
                  <button
                    onClick={handleConfirmImport}
                    disabled={importLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {importLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        กำลังนำเข้า...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5" />
                        ยืนยันนำเข้าข้อมูล
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {/* Step 3: Importing */}
            {importStep === "importing" && (
              <div className="py-8">
                <div className="text-center mb-6">
                  <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">กำลังนำเข้าข้อมูล...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    กรุณารอสักครู่ อาจใช้เวลาหลายนาที
                  </p>
                </div>

                {/* Progress Bar */}
                {importProgress && (
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">ความคืบหน้า</span>
                        <span className="font-semibold text-pink-600">
                          {importProgress.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300 ease-out"
                          style={{ width: `${importProgress.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <span>
                          {importProgress.processed.toLocaleString()} / {importProgress.total.toLocaleString()} รายการ
                        </span>
                      </div>
                    </div>

                    {/* Stats */}
                    {importProgress.stats && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">สร้างใหม่:</span>
                            <span className="font-semibold text-green-600">
                              {importProgress.stats.created?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">อัปเดต:</span>
                            <span className="font-semibold text-blue-600">
                              {importProgress.stats.updated?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">โลโก้:</span>
                            <span className="font-semibold text-purple-600">
                              {importProgress.stats.logosUploaded?.toLocaleString() || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">ข้อผิดพลาด:</span>
                            <span className="font-semibold text-red-600">
                              {importProgress.stats.errors || 0}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Import Logs */}
                    {importLogs.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Import Logs</h4>
                        <div className="bg-gray-900 rounded-lg p-3 max-h-[300px] overflow-y-auto">
                          <div className="font-mono text-xs space-y-1">
                            {importLogs.map((log, idx) => {
                              const isError = log.includes('ERROR:') || log.includes('Error');
                              const isSuccess = log.includes('SUCCESS:') || log.includes('completed');
                              const isWarning = log.includes('WARNING:');

                              return (
                                <div
                                  key={idx}
                                  className={
                                    isError
                                      ? "text-red-400"
                                      : isWarning
                                      ? "text-yellow-400"
                                      : isSuccess
                                      ? "text-green-400"
                                      : "text-blue-400"
                                  }
                                >
                                  <span className="text-gray-500">[{new Date().toLocaleTimeString()}]</span> {log}
                                </div>
                              );
                            })}
                            <div ref={logsEndRef} />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Complete */}
            {importStep === "complete" && importResult && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-900 font-medium mb-4">นำเข้าข้อมูลสำเร็จ!</p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">ทั้งหมด:</span>
                      <span className="font-semibold ml-2">
                        {importResult.total.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">สร้างใหม่:</span>
                      <span className="font-semibold ml-2 text-green-600">
                        {importResult.created.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">อัปเดต:</span>
                      <span className="font-semibold ml-2 text-blue-600">
                        {importResult.updated.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">โลโก้:</span>
                      <span className="font-semibold ml-2 text-purple-600">
                        {importResult.logosUploaded.toLocaleString()} อัปโหลด
                        {skipExistingLogos && <span className="text-xs text-gray-500"> (ข้ามที่มีแล้ว)</span>}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">ข้อผิดพลาด:</span>
                      <span className="font-semibold ml-2 text-red-600">
                        {importResult.errors?.length || 0}
                      </span>
                    </div>
                  </div>

                  {/* Show errors if any */}
                  {importResult.errors?.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <details className="text-left">
                        <summary className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-700">
                          ดูรายละเอียดข้อผิดพลาด ({importResult.errors.length} รายการ)
                        </summary>
                        <div className="mt-3 bg-red-50 rounded-lg p-3 max-h-[200px] overflow-y-auto">
                          <div className="space-y-2 text-xs">
                            {importResult.errors.map((err: any, idx: number) => (
                              <div key={idx} className="flex gap-2 text-red-800">
                                <span className="font-mono font-semibold">{err.program_id}:</span>
                                <span>{err.error}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </details>
                    </div>
                  )}
                </div>

                <button
                  onClick={closeImportModal}
                  className="px-6 py-2 bg-pink-500 text-white rounded-lg hover:opacity-90"
                >
                  ปิด
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* File Viewer Dialog */}
      <Dialog open={fileViewerOpen} onOpenChange={setFileViewerOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-500" />
              ไฟล์ Portfolio ที่อัปโหลด
            </DialogTitle>
            <DialogDescription>
              {selectedProgram?.university_name_th && (
                <div className="mt-2 text-left">
                  <p className="font-medium text-gray-900">
                    {selectedProgram.university_name_th}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedProgram.program_name_th}
                  </p>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-3">
            {[
              { label: "Portfolio Round 1", path: selectedProgram?.file_path_1 },
              { label: "Portfolio Round 2", path: selectedProgram?.file_path_2 },
              { label: "Portfolio Round 3", path: selectedProgram?.file_path_3 },
              { label: "Portfolio Round 4", path: selectedProgram?.file_path_4 },
            ].map((file, idx) => (
              <div
                key={idx}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-100 rounded-lg">
                      <FileText className="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{file.label}</p>
                      {file.path ? (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {file.path}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          ไม่มีไฟล์
                        </p>
                      )}
                    </div>
                  </div>
                  {file.path && (
                    <a
                      href={file.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      เปิด
                    </a>
                  )}
                </div>
              </div>
            ))}

            {!selectedProgram?.file_path_1 &&
              !selectedProgram?.file_path_2 &&
              !selectedProgram?.file_path_3 &&
              !selectedProgram?.file_path_4 && (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">ไม่มีไฟล์ Portfolio</p>
                </div>
              )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
