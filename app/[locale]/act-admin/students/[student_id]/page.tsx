"use client";

import { use } from "react";
import useSWR from "swr";
import { Link } from "@/routing";
import Image from "next/image";
import {
  ChevronLeft,
  User,
  GraduationCap,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  Star,
  Brain,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ACTStudentDetailPage({
  params,
}: {
  params: Promise<{ student_id: string }>;
}) {
  const { student_id } = use(params);
  const { data, isLoading, error } = useSWR(
    `/api/admin/act/students/${student_id}`,
    fetcher
  );

  const student = data?.data?.student;
  const doodeeUser = data?.data?.doodeeUser;
  const dreamFaculties: any[] = data?.data?.dreamFaculties ?? [];
  const portfolios: any[] = data?.data?.portfolios ?? [];
  const analyses: any[] = data?.data?.analyses ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-gray-400">
        <Loader2 className="w-7 h-7 animate-spin mr-2" /> กำลังโหลด...
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-gray-400">
        <AlertCircle className="w-10 h-10" />
        <p>ไม่พบข้อมูลนักเรียน</p>
        <Link href="/act-admin/students">
          <button className="text-sm text-red-600 hover:underline">← กลับรายชื่อ</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-5">
      {/* Back */}
      <Link href="/act-admin/students">
        <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-700 transition">
          <ChevronLeft className="w-4 h-4" /> กลับรายชื่อนักเรียน
        </button>
      </Link>

      {/* ── Student profile card ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-red-700 to-red-500" />
        <div className="p-6">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full border-2 border-red-100 overflow-hidden bg-red-50 flex items-center justify-center shrink-0">
                {doodeeUser?.profile_image_url ? (
                  <Image src={doodeeUser.profile_image_url} alt={student.first_name} width={64} height={64} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-red-400" />
                )}
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900">
                  {student.prefix} {student.first_name} {student.last_name}
                </p>
                {student.nickname && <p className="text-sm text-gray-500">"{student.nickname}"</p>}
                {doodeeUser ? (
                  <span className="inline-block mt-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">ลงทะเบียนใน Doodee แล้ว</span>
                ) : (
                  <span className="inline-block mt-1 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">ยังไม่ได้ลงทะเบียน</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            <InfoRow label="รหัสนักเรียน" value={student.student_id} />
            <InfoRow label="ระดับชั้น" value={student.grade ? `ม.${student.grade}` : "-"} />
            <InfoRow label="ห้อง" value={student.classroom ?? "-"} />
            <InfoRow label="ปีการศึกษา" value={student.academic_year?.toString() ?? "-"} />
            {student.study_plan && (
              <div className="col-span-2 sm:col-span-3">
                <InfoRow label="แผนการเรียน" value={student.study_plan} />
              </div>
            )}
            {doodeeUser && (
              <div className="col-span-2 sm:col-span-3">
                <InfoRow label="อีเมล" value={doodeeUser.email ?? "-"} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dream Faculties ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <GraduationCap className="w-5 h-5 text-red-600" />
          <h2 className="font-semibold text-gray-900">คณะในฝัน (Top 3)</h2>
        </div>

        {!doodeeUser ? (
          <EmptyNote text="นักเรียนยังไม่ได้ลงทะเบียนใน Doodee" />
        ) : dreamFaculties.length === 0 ? (
          <EmptyNote text="ยังไม่มีคณะในฝัน" />
        ) : (
          <div className="space-y-3">
            {dreamFaculties.map((f: any, i: number) => (
              <div key={f.id} className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br from-red-50 to-white border border-red-100">
                <div className="w-7 h-7 rounded-full bg-red-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-white fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">อันดับ {i + 1}</p>
                  <p className="font-semibold text-gray-900 leading-tight">
                    {f.program_name_th || f.field_name_th || f.faculty_name_th || "-"}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {f.faculty_name_th && f.program_name_th ? `${f.faculty_name_th} · ` : ""}
                    {f.university_name_th ?? ""}
                  </p>
                  <div className="flex gap-2 mt-1.5 flex-wrap">
                    {f.r1_admission_quota > 0 && (
                      <span className="text-xs bg-white border border-red-200 text-red-700 px-2 py-0.5 rounded-full">รอบ 1: {f.r1_admission_quota} คน</span>
                    )}
                    {f.program_total_seats > 0 && (
                      <span className="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">รวม: {f.program_total_seats} คน</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Portfolio uploads ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-red-600" />
          <h2 className="font-semibold text-gray-900">Portfolio ที่อัปโหลด</h2>
        </div>

        {!doodeeUser ? (
          <EmptyNote text="นักเรียนยังไม่ได้ลงทะเบียนใน Doodee" />
        ) : portfolios.length === 0 ? (
          <EmptyNote text="ยังไม่มีการอัปโหลด Portfolio" />
        ) : (
          <div className="space-y-3">
            {portfolios.map((p: any) => (
              <div key={p.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-colors group">
                <div className="w-14 h-14 rounded-lg bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {p.thumbnail_url ? (
                    <Image src={p.thumbnail_url} alt={p.portfolio_name} width={56} height={56} className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{p.portfolio_name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.template_type ?? "ไม่ระบุ template"} ·{" "}
                    {p.created_at ? new Date(p.created_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                  </p>
                </div>
                <a
                  href={p.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 font-medium px-3 py-1.5 rounded-lg border border-red-200 hover:border-red-400 transition opacity-0 group-hover:opacity-100"
                >
                  ดู Port <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Portfolio Analysis ── */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-red-600" />
          <h2 className="font-semibold text-gray-900">ผลการวิเคราะห์ Portfolio</h2>
        </div>

        {!doodeeUser ? (
          <EmptyNote text="นักเรียนยังไม่ได้ลงทะเบียนใน Doodee" />
        ) : analyses.length === 0 ? (
          <EmptyNote text="ยังไม่มีผลการวิเคราะห์" />
        ) : (
          <div className="space-y-5">
            {analyses.map((a: any, idx: number) => {
              const strengths: string[] = Array.isArray(a.strengths) ? a.strengths : [];
              const weaknesses: string[] = Array.isArray(a.weaknesses) ? a.weaknesses : [];
              const scores: Record<string, number> = a.subject_scores && typeof a.subject_scores === "object" ? a.subject_scores : {};
              const recFaculties: any[] = Array.isArray(a.recommended_faculties) ? a.recommended_faculties.slice(0, 3) : [];
              const scoreEntries = Object.entries(scores).sort((x, y) => y[1] - x[1]);

              return (
                <div key={String(a.id)} className={`rounded-xl border ${idx === 0 ? "border-red-200 bg-red-50/30" : "border-gray-100"} p-5 space-y-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">
                      {idx === 0 ? "ล่าสุด" : `ครั้งที่ ${analyses.length - idx}`} ·{" "}
                      {a.analyzed_at ? new Date(a.analyzed_at).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </span>
                    {a.file_url && (
                      <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-600 hover:underline flex items-center gap-1">
                        ดูไฟล์ <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  {/* Advice */}
                  {a.advice && (
                    <p className="text-sm text-gray-700 leading-relaxed">{a.advice}</p>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Strengths */}
                    {strengths.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-green-700 flex items-center gap-1 mb-2">
                          <TrendingUp className="w-3.5 h-3.5" /> จุดแข็ง
                        </p>
                        <ul className="space-y-1">
                          {strengths.map((s, i) => (
                            <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Weaknesses */}
                    {weaknesses.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-2">
                          <TrendingDown className="w-3.5 h-3.5" /> จุดที่ควรพัฒนา
                        </p>
                        <ul className="space-y-1">
                          {weaknesses.map((w, i) => (
                            <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Subject scores */}
                  {scoreEntries.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">คะแนนทักษะ</p>
                      <div className="space-y-1.5">
                        {scoreEntries.map(([key, val]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="text-xs text-gray-600 w-32 shrink-0 truncate">{key}</span>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-red-500 rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, val))}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended faculties from analysis */}
                  {recFaculties.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-2">คณะที่ AI แนะนำ</p>
                      <div className="flex flex-wrap gap-2">
                        {recFaculties.map((f: any, i: number) => (
                          <span key={i} className="text-xs bg-white border border-red-200 text-red-700 px-2.5 py-1 rounded-full">
                            {f.program_name_th || f.faculty_name_th || f.university_name_th || "-"}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="font-medium text-gray-800">{value}</p>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-sm text-gray-400">
      {text}
    </div>
  );
}
