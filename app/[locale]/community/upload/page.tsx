"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Image from "next/image";
import R2Image from "@/components/R2Image";
import { useRouter } from "@/routing";
import { useAuth } from "@/components/AuthProvider";
import SearchSelect from "@/components/SearchSelect";
import Swal from "@/lib/swal-toast";
import { ArrowLeft, Upload, FileText, Eye, EyeOff, Sparkles, ImageIcon, Check, Loader2, GraduationCap, Plus, X } from "lucide-react";

type PreparedPage = {
  pageNumber: number;
  imageUrl: string;
  key?: string;
  aspectRatio?: number;
  isVisible: boolean;
};

type Target = {
  universityName: string;
  facultyName: string;
  programName: string;
  programId: string | null;
};

// cache key: "uni" → faculties[]
type FilterCache = Record<string, string[]>;
type ProgramOption = { id: string; name: string };
type ProgramCache = Record<string, ProgramOption[]>;

export default function CommunityUploadPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [universities, setUniversities] = useState<string[]>([]);
  const [filterCache, setFilterCache] = useState<FilterCache>({});
  const [programCache, setProgramCache] = useState<ProgramCache>({});

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targets, setTargets] = useState<Target[]>([
    { universityName: "", facultyName: "", programName: "", programId: null },
  ]);

  const [watermark, setWatermark] = useState<"1" | "2" | "3" | "4">("1");
  const [preparedPages, setPreparedPages] = useState<PreparedPage[]>([]);
  const [originalFile, setOriginalFile] = useState<{ url?: string | null; key?: string | null } | null>(null);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [prepareProgress, setPrepareProgress] = useState(0);
  const [schoolName, setSchoolName] = useState("");
  const [savedSchoolName, setSavedSchoolName] = useState("");
  const [schoolEntryId, setSchoolEntryId] = useState<string | null>(null);
  const [schoolLoading, setSchoolLoading] = useState(true);
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileSizeError, setFileSizeError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const MAX_SIZE = 20 * 1024 * 1024;
  const MAX_SIZE_LABEL = "20MB";

  // Load universities list
  useEffect(() => {
    fetch("/api/community/filters")
      .then((r) => r.json())
      .then((data) => {
        if (data.universities) {
          setUniversities(data.universities.map((u: any) => u.th || u.en || "").filter(Boolean));
        }
      })
      .catch(console.error);
  }, []);

  // Load faculties for a university (cache key = uni)
  const loadFaculties = async (uni: string) => {
    if (!uni || filterCache[uni]) return;
    try {
      const res = await fetch(`/api/community/filters?university=${encodeURIComponent(uni)}`);
      const data = await res.json();
      setFilterCache((prev) => ({
        ...prev,
        [uni]: (data.faculties || []).map((f: any) => f.th || f.en || "").filter(Boolean),
      }));
    } catch (e) {
      console.error(e);
    }
  };

  const loadPrograms = async (uni: string, fac: string) => {
    const key = `${uni}|||${fac}`;
    if (!uni || !fac || programCache[key]) return;
    try {
      const res = await fetch(
        `/api/community/filters?university=${encodeURIComponent(uni)}&faculty=${encodeURIComponent(fac)}`
      );
      const data = await res.json();
      setProgramCache((prev) => ({
        ...prev,
        [key]: (data.programs || [])
          .map((program: any) => ({
            id: String(program.id || ""),
            name: program.th || program.en || "",
          }))
          .filter((program: ProgramOption) => program.id && program.name),
      }));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const loadSchoolOptions = async () => {
      try {
        const data = await import("@/School.json");
        const names = (data.default || [])
          .map((s: any) => s?.name)
          .filter((n: any): n is string => typeof n === "string" && n.trim().length > 0);
        setSchoolOptions(Array.from(new Set(names)));
      } catch (err) {
        console.error(err);
      }
    };
    loadSchoolOptions();
  }, []);

  useEffect(() => {
    const loadSchoolFromProfile = async () => {
      if (!user?.id) { setSchoolLoading(false); return; }
      try {
        const res = await fetch(`/api/db/user/education?user_id=${user.id}`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        const list = Array.isArray(data?.data) ? data.data : [];
        const current =
          list.find((e: any) => e?.is_current && e?.school_type === "high_school") ||
          list.find((e: any) => e?.school_type === "high_school") ||
          list[0];
        if (current?.school_name) {
          setSchoolName(current.school_name);
          setSavedSchoolName(current.school_name);
          setSchoolEntryId(current.id || null);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSchoolLoading(false);
      }
    };
    loadSchoolFromProfile();
  }, [user?.id]);

  const saveSchoolIfNeeded = async () => {
    const trimmed = schoolName.trim();
    if (!trimmed || trimmed === savedSchoolName) return;
    try {
      const payload = { school_name: trimmed, school_type: "high_school", is_current: true };
      const res = await fetch("/api/db/user/education", {
        method: schoolEntryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(schoolEntryId ? { id: schoolEntryId, ...payload } : payload),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.data?.id) setSchoolEntryId(data.data.id);
      setSavedSchoolName(trimmed);
    } catch (err) {
      console.error(err);
    }
  };

  // Target management
  const updateTarget = (idx: number, field: keyof Target, value: string) => {
    setTargets((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "universityName") {
        next[idx].facultyName = "";
        next[idx].programName = "";
        next[idx].programId = null;
        if (value) loadFaculties(value);
      }
      if (field === "facultyName") {
        next[idx].programName = "";
        next[idx].programId = null;
        if (value) loadPrograms(next[idx].universityName, value);
      }
      return next;
    });
  };

  const addTarget = () => {
    setTargets((prev) => [
      ...prev,
      { universityName: "", facultyName: "", programName: "", programId: null },
    ]);
  };

  const removeTarget = (idx: number) => {
    setTargets((prev) => prev.filter((_, i) => i !== idx));
  };

  const getFacultiesForTarget = (t: Target): string[] => filterCache[t.universityName] || [];

  const getProgramsForTarget = (t: Target): ProgramOption[] => {
    if (!t.universityName || !t.facultyName) return [];
    return programCache[`${t.universityName}|||${t.facultyName}`] || [];
  };

  const handleProgramChange = (idx: number, value: string) => {
    setTargets((prev) => {
      const next = [...prev];
      const options = getProgramsForTarget(next[idx]);
      const selected = options.find((program) => program.name === value);
      next[idx] = {
        ...next[idx],
        programName: value,
        programId: selected?.id || null,
      };
      return next;
    });
  };

  const handlePrepare = async () => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      Swal.fire({ icon: "warning", title: "กรุณาอัปโหลดไฟล์ PDF", confirmButtonColor: "#db2777" });
      return;
    }
    if (file.size > MAX_SIZE) {
      Swal.fire({ icon: "warning", title: "ขนาดไฟล์ใหญ่เกินไป", text: `กรุณาอัปโหลดไฟล์ขนาดไม่เกิน ${MAX_SIZE_LABEL}`, confirmButtonColor: "#db2777" });
      return;
    }

    setIsPreparing(true);
    setPrepareProgress(0);
    setPreparedPages([]);
    setOriginalFile(null);

    try {
      setPrepareProgress(5);
      const urlRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name || "portfolio.pdf", contentType: "application/pdf", fileSize: file.size }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok || !urlData.success) throw new Error(urlData.error || "ไม่สามารถสร้างลิงก์อัปโหลดได้");

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", urlData.uploadUrl);
        xhr.setRequestHeader("Content-Type", "application/pdf");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setPrepareProgress(5 + Math.round((e.loaded / e.total) * 45));
        };
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? (setPrepareProgress(50), resolve()) : reject(new Error("อัปโหลดไฟล์ไม่สำเร็จ"));
        xhr.onerror = () => reject(new Error("เกิดข้อผิดพลาดในการเชื่อมต่อ"));
        xhr.send(file);
      });

      let progress = 50;
      const interval = setInterval(() => {
        progress = Math.min(progress + 2, 90);
        setPrepareProgress(progress);
        if (progress >= 90) clearInterval(interval);
      }, 500);

      const prepareRes = await fetch("/api/community/prepare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl: urlData.publicUrl, pdfKey: urlData.key, watermark }),
      });

      clearInterval(interval);
      setPrepareProgress(100);

      const data = await prepareRes.json();
      if (!prepareRes.ok || data.error) throw new Error(data.error || "ไม่สามารถประมวลผลไฟล์ได้");

      setPreparedPages((data.pages || []).map((p: any) => ({
        pageNumber: p.pageNumber,
        imageUrl: p.imageUrl,
        key: p.key,
        aspectRatio: p.aspectRatio,
        isVisible: true,
      })));
      setOriginalFile(data.originalFile || null);
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err?.message || "ไม่สามารถประมวลผลได้", confirmButtonColor: "#db2777" });
    } finally {
      setIsPreparing(false);
      setPrepareProgress(0);
    }
  };

  const handlePublish = async () => {
    if (authLoading) return;
    if (!user) { router.push("/login"); return; }
    if (!title.trim()) {
      Swal.fire({ icon: "warning", title: "กรอกชื่อผลงานก่อนเผยแพร่", confirmButtonColor: "#db2777" });
      return;
    }
    if (!schoolName.trim()) {
      Swal.fire({ icon: "warning", title: "กรอกชื่อโรงเรียนก่อนเผยแพร่", confirmButtonColor: "#db2777" });
      return;
    }
    if (preparedPages.length === 0) {
      Swal.fire({ icon: "warning", title: "กรุณาอัปโหลดและเลือกหน้าที่จะแสดง", confirmButtonColor: "#db2777" });
      return;
    }

    setIsPublishing(true);
    try {
      await saveSchoolIfNeeded();
      const validTargets = targets.filter(
        (t) => t.universityName || t.facultyName || t.programName
      );
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description,
          targets: validTargets,
          watermark,
          status: "open",
          originalFile,
          pages: preparedPages,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "เผยแพร่ไม่สำเร็จ");
      await Swal.fire({ icon: "success", title: "เผยแพร่สำเร็จ!", timer: 1500, showConfirmButton: false });
      router.push("/community");
    } catch (err: any) {
      Swal.fire({ icon: "error", title: "เผยแพร่ไม่สำเร็จ", text: err?.message || "เกิดข้อผิดพลาด", confirmButtonColor: "#db2777" });
    } finally {
      setIsPublishing(false);
    }
  };

  const visiblePageCount = useMemo(() => preparedPages.filter((p) => p.isVisible).length, [preparedPages]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === "application/pdf" && fileInputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputRef.current.files = dt.files;
      setSelectedFileName(file.name);
      setFileSizeError(file.size > MAX_SIZE ? `ขนาดไฟล์ใหญ่เกิน ${MAX_SIZE_LABEL}` : null);
    }
  };
  const handleFileChange = () => {
    const file = fileInputRef.current?.files?.[0];
    setSelectedFileName(file?.name || null);
    setFileSizeError(!file ? null : file.size > MAX_SIZE ? `ขนาดไฟล์ใหญ่เกิน ${MAX_SIZE_LABEL}` : null);
  };

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-4 py-6 md:py-8 pb-24 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-50 to-white border border-pink-100 rounded-2xl shadow-sm p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/community")}
              className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-pink-600 hover:border-pink-200 transition shadow-sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">อัปโหลดพอร์ต</h1>
              <p className="text-sm text-gray-500 mt-0.5">ระบบจะใส่ลายน้ำเต็มหน้า เลือกซ่อนหน้าที่ไม่ต้องการเผยแพร่ได้</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center shadow-sm">
              <Upload className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
        {/* Left column */}
        <div className="bg-white border rounded-2xl shadow-sm p-5 md:p-6 space-y-5">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-pink-600" />
              </div>
              <h2 className="font-bold text-gray-900">ข้อมูลผลงาน</h2>
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-gray-800">ชื่อผลงาน *</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                placeholder="เช่น Portfolio TCAS รอบ 1"
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-800">รายละเอียด</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 h-24 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                placeholder="บอกจุดเด่นสั้นๆ"
              />
            </label>
          </div>

          <hr className="border-gray-100" />

          {/* University targets - multi */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="font-bold text-gray-900">สถาบันและหลักสูตร</h2>
              </div>
              <button
                type="button"
                onClick={addTarget}
                className="flex items-center gap-1 text-xs font-semibold text-pink-600 hover:text-pink-700 px-2 py-1 rounded-lg hover:bg-pink-50 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มสถาบัน
              </button>
            </div>

            <div className="space-y-4">
              {targets.map((target, idx) => (
                <div key={idx} className="relative bg-gray-50 rounded-xl p-3 space-y-2.5 border border-gray-100">
                  {targets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTarget(idx)}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <p className="text-xs font-semibold text-gray-500">
                    {targets.length > 1 ? `สถาบันที่ ${idx + 1}` : "สถาบัน"}
                  </p>

                  {/* University */}
                  <div>
                    <span className="text-xs font-medium text-gray-600">มหาวิทยาลัย</span>
                    <div className="mt-1">
                      <SearchSelect
                        value={target.universityName}
                        onChange={(v) => updateTarget(idx, "universityName", v)}
                        options={universities}
                        placeholder="ไม่ระบุ"
                      />
                    </div>
                  </div>

                  {/* Faculty - only show when university selected */}
                  {target.universityName && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">คณะ</span>
                      <div className="mt-1">
                        <SearchSelect
                          value={target.facultyName}
                          onChange={(v) => updateTarget(idx, "facultyName", v)}
                          options={getFacultiesForTarget(target)}
                          placeholder="ไม่ระบุ"
                        />
                      </div>
                    </div>
                  )}

                  {target.universityName && target.facultyName && (
                    <div>
                      <span className="text-xs font-medium text-gray-600">หลักสูตร</span>
                      <div className="mt-1">
                        <SearchSelect
                          value={target.programName}
                          onChange={(v) => handleProgramChange(idx, v)}
                          options={getProgramsForTarget(target).map((program) => program.name)}
                          placeholder="ไม่ระบุ"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Watermark */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
                <ImageIcon className="w-4 h-4 text-purple-600" />
              </div>
              <h2 className="font-bold text-gray-900">เลือกลายน้ำ</h2>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">A4 แนวตั้ง</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["1", "2"] as const).map((option) => (
                    <button key={option} onClick={() => setWatermark(option)} className={`relative rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-all ${watermark === option ? "border-pink-500 bg-pink-50 shadow-sm" : "border-gray-200 bg-white hover:border-pink-200 hover:shadow-sm"}`}>
                      {watermark === option && <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>}
                      <div className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden">
                        <Image src={`/watermark/${option}.png`} alt={`ลายน้ำแบบ ${option}`} fill className="object-contain" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">ลายน้ำ (แนวตั้ง) {option}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-2">A4 แนวนอน</p>
                <div className="grid grid-cols-2 gap-3">
                  {(["3", "4"] as const).map((option) => (
                    <button key={option} onClick={() => setWatermark(option)} className={`relative rounded-xl border-2 p-3 flex flex-col items-center gap-2 transition-all ${watermark === option ? "border-pink-500 bg-pink-50 shadow-sm" : "border-gray-200 bg-white hover:border-pink-200 hover:shadow-sm"}`}>
                      {watermark === option && <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-pink-500 flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>}
                      <div className="relative w-20 h-20 bg-gray-50 rounded-lg overflow-hidden">
                        <Image src={`/watermark/${option}.png`} alt={`ลายน้ำแบบ ${option}`} fill className="object-contain" />
                      </div>
                      <span className="text-sm font-semibold text-gray-700">ลายน้ำ (แนวนอน) {option}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* School */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="font-bold text-gray-900">โรงเรียน</h2>
            </div>
            <div className="space-y-1.5">
              <SearchSelect value={schoolName} onChange={setSchoolName} options={schoolOptions} placeholder="เลือกโรงเรียน" />
              <p className="text-xs text-gray-400">
                {schoolLoading ? "กำลังดึงข้อมูลโรงเรียนจากโปรไฟล์..." : savedSchoolName ? "ระบบดึงจากโปรไฟล์ให้อัตโนมัติ แก้ไขได้" : "ถ้ายังไม่เคยตั้งค่าในโปรไฟล์ กรุณาเลือกที่นี่"}
              </p>
            </div>
          </div>

          {/* Upload PDF */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center">
                <Upload className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="font-bold text-gray-900">อัปโหลด PDF</h2>
            </div>

            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`w-full rounded-xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-all ${fileSizeError ? "border-red-300 bg-red-50" : isDragging ? "border-pink-400 bg-pink-50" : selectedFileName ? "border-green-300 bg-green-50" : "border-gray-200 bg-gray-50 hover:border-pink-300 hover:bg-pink-50/50"}`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${fileSizeError ? "bg-red-100" : selectedFileName ? "bg-green-100" : "bg-pink-100"}`}>
                {selectedFileName ? <Check className={`w-7 h-7 ${fileSizeError ? "text-red-600" : "text-green-600"}`} /> : <Upload className="w-7 h-7 text-pink-600" />}
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">{selectedFileName || "เลือกไฟล์ หรือ ลากมาวางที่นี่"}</p>
                <p className={`text-xs mt-1 ${fileSizeError ? "text-red-600" : "text-gray-400"}`}>{fileSizeError || `รองรับไฟล์ PDF ขนาดไม่เกิน ${MAX_SIZE_LABEL}`}</p>
              </div>
            </button>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handlePrepare}
                disabled={isPreparing}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl font-semibold hover:border-pink-200 hover:bg-pink-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPreparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isPreparing ? "กำลังประมวลผล..." : "สร้างภาพตัวอย่าง"}
              </button>
              <button
                onClick={handlePublish}
                disabled={isPublishing || preparedPages.length === 0 || !title.trim() || !schoolName.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
              >
                {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {isPublishing ? "กำลังเผยแพร่..." : "เผยแพร่"}
              </button>
            </div>
          </div>
        </div>

        {/* Right column - Preview */}
        <div className="bg-white border rounded-2xl shadow-sm p-5 md:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center">
                <Eye className="w-4 h-4 text-orange-600" />
              </div>
              <h2 className="font-bold text-gray-900">ตัวอย่างหน้าพอร์ต</h2>
            </div>
            {preparedPages.length > 0 && (
              <button onClick={() => setPreparedPages((prev) => prev.map((p) => ({ ...p, isVisible: true })))} className="text-xs text-pink-600 font-semibold hover:text-pink-700 transition">
                แสดงทุกหน้า
              </button>
            )}
          </div>

          {preparedPages.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-50 text-pink-600 text-xs font-semibold rounded-full">
                <Eye className="w-3 h-3" />
                แสดง {visiblePageCount} จาก {preparedPages.length} หน้า
              </span>
            </div>
          )}

          {isPreparing && (
            <div className="rounded-xl border border-pink-100 bg-pink-50/50 p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 font-medium">
                  {prepareProgress < 50 ? "กำลังอัปโหลดไฟล์..." : prepareProgress < 100 ? "กำลังประมวลผลและใส่ลายน้ำ..." : "เสร็จสิ้น!"}
                </span>
                <span className="font-bold text-pink-600">{prepareProgress}%</span>
              </div>
              <div className="w-full bg-pink-100 rounded-full h-2.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-pink-500 to-pink-600 rounded-full transition-all duration-300" style={{ width: `${prepareProgress}%` }} />
              </div>
              <div className="flex gap-3 text-xs text-gray-500">
                <span className={prepareProgress >= 0 ? "text-pink-600 font-semibold" : ""}>อัปโหลด</span>
                <span className="text-gray-300">&gt;</span>
                <span className={prepareProgress >= 50 ? "text-pink-600 font-semibold" : ""}>ประมวลผล</span>
                <span className="text-gray-300">&gt;</span>
                <span className={prepareProgress >= 100 ? "text-pink-600 font-semibold" : ""}>เสร็จสิ้น</span>
              </div>
            </div>
          )}

          {!isPreparing && preparedPages.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-7 h-7 text-gray-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-500">ยังไม่มีตัวอย่าง</p>
                <p className="text-xs text-gray-400 mt-1">อัปโหลดไฟล์ PDF แล้วกด &quot;สร้างภาพตัวอย่าง&quot; เพื่อดูผลลัพธ์</p>
              </div>
            </div>
          )}

          {!isPreparing && preparedPages.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[540px] overflow-y-auto pr-1">
              {preparedPages.map((page) => (
                <label key={page.pageNumber} className={`relative rounded-xl overflow-hidden cursor-pointer group transition-all ${page.isVisible ? "ring-2 ring-pink-500 shadow-sm" : "ring-1 ring-gray-200 opacity-60"}`}>
                  <input
                    type="checkbox"
                    checked={page.isVisible}
                    onChange={(e) => setPreparedPages((prev) => prev.map((p) => p.pageNumber === page.pageNumber ? { ...p, isVisible: e.target.checked } : p))}
                    className="hidden"
                  />
                  <div className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition ${page.isVisible ? "bg-pink-500 text-white" : "bg-white/80 border border-gray-300 text-gray-400"}`}>
                    {page.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </div>
                  <div className="relative w-full bg-gray-50" style={{ aspectRatio: page.aspectRatio ? `${page.aspectRatio}` : "3/4" }}>
                    <R2Image src={page.imageUrl} alt={`หน้า ${page.pageNumber}`} fill className="object-contain transition group-hover:scale-[1.02]" />
                    <span className="absolute bottom-1.5 right-1.5 text-[11px] bg-black/60 text-white px-2 py-0.5 rounded-full">หน้า {page.pageNumber}</span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
