"use client";

import useSWR from "swr";
import { Link } from "@/routing";
import Image from "next/image";
import {
  ChevronLeft,
  GraduationCap,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  User,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DreamReportPage() {
  const { data, isLoading, error } = useSWR(
    "/api/admin/act/dream-summary",
    fetcher
  );

  const d = data?.data;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-7 h-7 animate-spin mr-2" /> กำลังโหลด...
      </div>
    );
  }

  if (error || !d) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <AlertCircle className="w-10 h-10" />
        <p>โหลดข้อมูลไม่สำเร็จ</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-5">
      {/* Back */}
      <Link href="/act-admin">
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-700 transition">
          <ChevronLeft className="w-4 h-4" /> กลับหน้าหลัก
        </button>
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-red-600" />
          รายงานคณะในฝัน
        </h1>
        <p className="text-sm text-gray-500">สรุปภาพรวมการเลือกคณะของนักเรียน ACT</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          color="bg-gray-500"
          label="นักเรียนทั้งหมด"
          value={d.totalStudents}
        />
        <StatCard
          icon={CheckCircle2}
          color="bg-green-500"
          label="ลงทะเบียนใน Doodee"
          value={d.registeredCount}
        />
        <StatCard
          icon={GraduationCap}
          color="bg-red-600"
          label="เลือกคณะในฝันแล้ว"
          value={d.withDreamsCount}
        />
        <StatCard
          icon={XCircle}
          color="bg-amber-500"
          label="ยังไม่ได้เลือก"
          value={d.withoutDreamsCount + d.notRegisteredCount}
        />
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h2 className="font-semibold text-gray-900 mb-4">ภาพรวม</h2>
        <div className="space-y-3">
          <ProgressRow
            label="ลงทะเบียนใน Doodee"
            value={d.registeredCount}
            total={d.totalStudents}
            color="bg-green-500"
          />
          <ProgressRow
            label="เลือกคณะในฝันแล้ว"
            value={d.withDreamsCount}
            total={d.totalStudents}
            color="bg-red-600"
          />
          <ProgressRow
            label="ยังไม่ได้ลงทะเบียน"
            value={d.notRegisteredCount}
            total={d.totalStudents}
            color="bg-gray-300"
          />
        </div>
      </div>

      {/* Top programs */}
      {d.topPrograms.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">
            คณะ/สาขายอดนิยม (Top {d.topPrograms.length})
          </h2>
          <div className="space-y-3">
            {d.topPrograms.map((p: any, i: number) => (
              <div
                key={p.program_id ?? i}
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-red-100 hover:bg-red-50/30 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-red-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                {p.logo_url ? (
                  <Image
                    src={p.logo_url}
                    alt={p.university_name_th ?? ""}
                    width={36}
                    height={36}
                    className="w-9 h-9 object-contain rounded shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 bg-gray-100 rounded flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 leading-tight text-sm">
                    {p.program_name_th || p.field_name_th || p.faculty_name_th || "-"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {p.faculty_name_th && p.program_name_th
                      ? `${p.faculty_name_th} · `
                      : ""}
                    {p.university_name_th ?? ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-red-700">{p.first_choice_count} คน</p>
                  <p className="text-xs text-gray-400">อันดับ 1</p>
                  {p.pick_count > p.first_choice_count && (
                    <p className="text-xs text-gray-400">{p.pick_count} คนรวม</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students without dream selection */}
      {d.studentsWithoutDreams.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-1">
            นักเรียนที่ยังไม่ได้เลือกคณะในฝัน
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            ลงทะเบียนใน Doodee แล้ว แต่ยังไม่ได้เลือก ({d.studentsWithoutDreams.length} คน)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">นักเรียน</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">รหัส</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">ห้อง</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {d.studentsWithoutDreams.map((s: any) => (
                  <tr key={s.student_id} className="hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {s.prefix} {s.first_name} {s.last_name}
                          </p>
                          {s.nickname && (
                            <p className="text-xs text-gray-400">"{s.nickname}"</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-500 text-xs">{s.student_id}</td>
                    <td className="px-3 py-2.5 text-gray-600">{s.classroom ?? "-"}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/act-admin/students/${s.student_id}`}>
                        <button className="text-xs text-red-600 hover:text-red-800 border border-red-200 hover:border-red-400 px-2.5 py-1 rounded-lg transition">
                          ดูประวัติ
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Users;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value.toLocaleString()}</p>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700">{label}</span>
        <span className="font-semibold text-gray-900">
          {value.toLocaleString()} ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
