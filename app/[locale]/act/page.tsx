"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/routing";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";
import {
  User,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  Pencil,
  X,
  Save,
} from "lucide-react";

type ACTStudent = {
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
  email: string | null;
};

export default function ACTPortalPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [student, setStudent] = useState<ACTStudent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<ACTStudent>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const isACTUser = Boolean(user?.email && user.email.includes("act.ac.th"));
  const studentId = isACTUser ? user!.email!.split("@")[0] : null;

  // Debug: log email ที่ได้จาก session (ลบออกหลัง debug)
  if (typeof window !== "undefined" && user) {
    console.log("[ACT] user.email =", user.email, "| isACTUser =", isACTUser, "| studentId =", studentId);
  }

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    if (!isACTUser) { router.push("/"); return; }
  }, [user, authLoading, isACTUser, router]);

  useEffect(() => {
    if (!studentId) return;
    const fetchStudent = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/schools/act/verify?student_id=${studentId}`);
        if (res.status === 404) {
          setError("ไม่พบข้อมูลนักเรียนในระบบ กรุณาติดต่อเจ้าหน้าที่");
          return;
        }
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setStudent(json.data);
      } catch {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoading(false);
      }
    };
    fetchStudent();
  }, [studentId]);

  const startEdit = () => {
    if (!student) return;
    setEditForm({
      nickname: student.nickname ?? "",
      email: student.email ?? "",
    });
    setSaveError(null);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!student) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/schools/act/student/${student.student_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: editForm.nickname || null,
          email: editForm.email || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setSaveError(json.error || "บันทึกไม่สำเร็จ");
        return;
      }
      const json = await res.json();
      setStudent(json.data);
      setEditing(false);
    } catch {
      setSaveError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-white border border-red-100 shadow flex items-center justify-center shrink-0">
          <Image
            src="/act_logo.png"
            alt="Assumption College Thonburi"
            width={52}
            height={52}
            className="object-contain p-2"
          />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
            Assumption College Thonburi
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            ระบบนักเรียน · รหัส {studentId}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-red-200 p-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-gray-700 font-medium">{error}</p>
          <p className="text-sm text-gray-500">รหัสนักเรียน: {studentId}</p>
        </div>
      ) : student ? (
        <div className="space-y-4">
          {/* Student info card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Red top bar */}
            <div className="h-2 bg-gradient-to-r from-red-700 to-red-500" />

            <div className="p-6">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                  <span className="font-semibold text-green-700">ยืนยันตัวตนสำเร็จ</span>
                </div>
                {!editing && (
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-700 border border-gray-200 hover:border-red-300 px-3 py-1.5 rounded-lg transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    แก้ไขข้อมูล
                  </button>
                )}
              </div>

              {/* Avatar + name */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full border-2 border-red-100 overflow-hidden shrink-0 bg-red-50 flex items-center justify-center">
                  {user?.image ? (
                    <Image
                      src={user.image}
                      alt={student.first_name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-red-400" />
                  )}
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">
                    {student.prefix} {student.first_name} {student.last_name}
                  </p>
                  {!editing && student.nickname && (
                    <p className="text-sm text-gray-500">ชื่อเล่น: {student.nickname}</p>
                  )}
                </div>
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <InfoRow label="รหัสนักเรียน" value={student.student_id} />
                <InfoRow label="ปีการศึกษา" value={student.academic_year?.toString() ?? "-"} />
                <InfoRow label="ระดับชั้น" value={student.grade ? `ม.${student.grade}` : "-"} />
                <InfoRow label="ห้อง" value={student.classroom ?? "-"} />
                {student.study_plan && (
                  <div className="col-span-2">
                    <InfoRow label="แผนการเรียน" value={student.study_plan} />
                  </div>
                )}
              </div>

              {/* Edit form */}
              {editing && (
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                  <p className="text-sm font-medium text-gray-700">แก้ไขข้อมูลส่วนตัว</p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">ชื่อเล่น</label>
                      <input
                        type="text"
                        value={editForm.nickname ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, nickname: e.target.value }))}
                        placeholder="ชื่อเล่น"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">อีเมลสำรอง</label>
                      <input
                        type="email"
                        value={editForm.email ?? ""}
                        onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                        placeholder="example@gmail.com"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                      />
                    </div>
                  </div>

                  {saveError && (
                    <p className="text-xs text-red-500">{saveError}</p>
                  )}

                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setEditing(false)}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-800 transition disabled:opacity-60"
                    >
                      {saving ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      บันทึก
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Coming soon */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-red-500" />
              <h2 className="font-semibold text-gray-800">ฟีเจอร์สำหรับนักเรียน ACT</h2>
            </div>
            <p className="text-sm text-gray-400">
              เร็วๆ นี้: ดูผลการเรียน · แนะแนวการศึกษา · ติดตามพอร์ตโฟลิโอ
            </p>
          </div>
        </div>
      ) : null}
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
