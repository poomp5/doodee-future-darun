"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { Link } from "@/routing";
import { Search, Download, ChevronLeft, ChevronRight, User, ArrowRight, Loader2 } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

type Student = {
  id: number;
  student_id: string;
  prefix: string | null;
  first_name: string;
  last_name: string;
  nickname: string | null;
  grade: string | null;
  classroom: string | null;
  study_plan: string | null;
  academic_year: number | null;
};

export default function ACTStudentsPage() {
  const [grade, setGrade] = useState("");
  const [classroom, setClassroom] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 50;

  // Fetch classroom options grouped by grade
  const { data: classroomData } = useSWR("/api/admin/act/classrooms", fetcher);
  const classroomMap: Record<string, string[]> = classroomData?.data ?? {};
  const classroomOptions: string[] = grade ? (classroomMap[grade] ?? []) : [];

  const query = new URLSearchParams({
    ...(grade && { grade }),
    ...(classroom && { classroom }),
    ...(search && { search }),
    page: String(page),
    limit: String(limit),
  }).toString();

  const { data, isLoading } = useSWR(`/api/admin/act/students?${query}`, fetcher);
  const students: Student[] = data?.data ?? [];
  const pagination = data?.pagination ?? { page: 1, pages: 1, total: 0 };

  const handleSearch = useCallback(() => {
    setSearch(searchInput);
    setPage(1);
  }, [searchInput]);

  const handleExportCSV = () => {
    if (!students.length) return;
    const headers = ["รหัสนักเรียน", "คำนำหน้า", "ชื่อ", "นามสกุล", "ชื่อเล่น", "ระดับ", "ห้อง", "แผนการเรียน"];
    const rows = students.map((s) => [
      s.student_id, s.prefix ?? "", s.first_name, s.last_name,
      s.nickname ?? "", s.grade ? `ม.${s.grade}` : "", s.classroom ?? "", s.study_plan ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const a = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob),
      download: `act_students_${classroom || grade || "all"}.csv`,
    });
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="p-8 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">รายชื่อนักเรียน</h1>
        <p className="text-sm text-gray-500">Assumption College Thonburi · ปีการศึกษา 2568</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap gap-3 items-end">
        {/* Grade */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">ระดับชั้น</label>
          <select
            value={grade}
            onChange={(e) => { setGrade(e.target.value); setClassroom(""); setPage(1); }}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 min-w-[110px]"
          >
            <option value="">ทั้งหมด</option>
            {["4", "5", "6"].map((g) => <option key={g} value={g}>ม.{g}</option>)}
          </select>
        </div>

        {/* Classroom - cascading select, only show when grade selected */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500 font-medium">ห้อง</label>
          <select
            value={classroom}
            onChange={(e) => { setClassroom(e.target.value); setPage(1); }}
            disabled={!grade || classroomOptions.length === 0}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 min-w-[130px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <option value="">ทุกห้อง</option>
            {classroomOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
          <label className="text-xs text-gray-500 font-medium">ค้นหา</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="ชื่อ / นามสกุล / รหัส"
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-red-400"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-red-700 text-white rounded-lg text-sm hover:bg-red-800 transition"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <button
          onClick={handleExportCSV}
          disabled={!students.length}
          className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition flex items-center gap-1.5 disabled:opacity-40 self-end"
        >
          <Download className="w-4 h-4" /> Export
        </button>
      </div>

      {!isLoading && (
        <p className="text-sm text-gray-500">
          พบ <span className="font-semibold text-gray-800">{pagination.total}</span> คน
          {(grade || classroom || search) && " (กรองแล้ว)"}
        </p>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-7 h-7 animate-spin mr-2" /> กำลังโหลด...
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 text-gray-400">ไม่พบข้อมูลนักเรียน</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["นักเรียน", "รหัส", "ห้อง", "แผนการเรียน", ""].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-red-50/40 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{s.prefix} {s.first_name} {s.last_name}</p>
                          {s.nickname && <p className="text-xs text-gray-400">"{s.nickname}"</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600">{s.student_id}</td>
                    <td className="px-4 py-3 text-gray-700">{s.classroom ?? "-"}</td>
                    <td className="px-4 py-3 text-gray-500 max-w-[180px] truncate">{s.study_plan ?? "-"}</td>
                    <td className="px-4 py-3">
                      <Link href={`/act-admin/students/${s.student_id}`}>
                        <button className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-400 transition opacity-0 group-hover:opacity-100">
                          ดูประวัติ <ArrowRight className="w-3 h-3" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-500">หน้า {pagination.page}/{pagination.pages} · รวม {pagination.total} คน</p>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-100 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
