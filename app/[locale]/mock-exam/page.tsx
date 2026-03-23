"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  ClipboardCheck,
  Clock,
  FileText,
  ChevronRight,
  RefreshCw,
  BookOpen,
  Trophy,
  Users,
  File,
  ExternalLink,
  Layers,
  Search,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";

interface ExamData {
  id: number;
  title: string;
  description: string | null;
  detail_content: string | null;
  subject_code: string;
  exam_type: string;
  duration_minutes: number;
  total_score: number;
  pass_score: number;
  total_questions: number;
  sections: {
    id: number;
    title: string;
    description: string | null;
    score_weight: number;
    question_count: number;
  }[];
  attempt_count: number;
}

interface PdfExam {
  id: number;
  title: string;
  filename: string;
  r2_url: string;
  subject_code: string | null;
  exam_type: string | null;
}

const EXAM_TYPE_CONFIG: Record<string, { gradient: string; light: string; text: string }> = {
  TGAT:    { gradient: "from-blue-500 to-blue-600",    light: "bg-blue-50 text-blue-700 border-blue-200",    text: "text-blue-600" },
  TPAT:    { gradient: "from-violet-500 to-purple-600", light: "bg-violet-50 text-violet-700 border-violet-200", text: "text-violet-600" },
  "A-LEVEL": { gradient: "from-pink-500 to-rose-600",  light: "bg-pink-50 text-pink-700 border-pink-200",    text: "text-pink-600" },
  PAT:     { gradient: "from-orange-500 to-amber-600",  light: "bg-orange-50 text-orange-700 border-orange-200", text: "text-orange-600" },
  GAT:     { gradient: "from-teal-500 to-emerald-600",  light: "bg-teal-50 text-teal-700 border-teal-200",    text: "text-teal-600" },
  POSN:    { gradient: "from-indigo-500 to-blue-600",   light: "bg-indigo-50 text-indigo-700 border-indigo-200", text: "text-indigo-600" },
};

const DEFAULT_CONFIG = { gradient: "from-gray-400 to-gray-500", light: "bg-gray-50 text-gray-700 border-gray-200", text: "text-gray-600" };

function getConfig(type: string | null | undefined) {
  if (!type) return DEFAULT_CONFIG;
  const upper = type.toUpperCase();
  return EXAM_TYPE_CONFIG[upper] ?? DEFAULT_CONFIG;
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  TGAT: "TGAT",
  TPAT: "TPAT",
  "A-LEVEL": "A-Level",
  PAT: "PAT",
  GAT: "GAT",
  POSN: "POSN",
};

export default function MockExamPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("mockExam");

  const [exams, setExams] = useState<ExamData[]>([]);
  const [pdfExams, setPdfExams] = useState<PdfExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"interactive" | "pdf">("interactive");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    const fetchData = async () => {
      try {
        const [examsRes, pdfsRes] = await Promise.all([
          fetch("/api/mock-exam/exams"),
          fetch("/api/mock-exam/pdfs"),
        ]);
        const [examsData, pdfsData] = await Promise.all([examsRes.json(), pdfsRes.json()]);
        if (examsRes.ok) setExams(examsData.data || []);
        if (pdfsRes.ok) setPdfExams(pdfsData.data || []);
      } catch (err) {
        console.error("Error fetching exams:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, authLoading]);

  const handleStartExam = async (examId: number) => {
    setStarting(examId);
    try {
      const res = await fetch("/api/mock-exam/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", examId }),
      });
      if (!res.ok) throw new Error("Failed to start exam");
      const data = await res.json();
      router.push(`/mock-exam/${examId}/take?attemptId=${data.attemptId}`);
    } catch (err) {
      console.error("Error starting exam:", err);
      setStarting(null);
    }
  };

  // Collect unique exam types
  const allTypes = useMemo(() => {
    const source = activeTab === "interactive" ? exams.map((e) => e.exam_type) : pdfExams.map((e) => e.exam_type ?? "");
    return Array.from(new Set(source.filter(Boolean)));
  }, [exams, pdfExams, activeTab]);

  // Filtered items
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const matchType = selectedType === "all" || e.exam_type === selectedType;
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.subject_code.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [exams, selectedType, search]);

  const filteredPdfs = useMemo(() => {
    return pdfExams.filter((p) => {
      const matchType = selectedType === "all" || p.exam_type === selectedType;
      const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase());
      return matchType && matchSearch;
    });
  }, [pdfExams, selectedType, search]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#f7f7fb] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      {/* Main Layout */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: t("title") }]} />
        <div className="flex gap-5">
          {/* ── Left Sidebar ── */}
          <aside className="hidden md:flex flex-col gap-3 w-52 lg:w-60 flex-shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาข้อสอบ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 focus:border-transparent shadow-sm"
              />
            </div>

            {/* Tab toggle */}
            <div className="bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex gap-1">
              <button
                onClick={() => { setActiveTab("interactive"); setSelectedType("all"); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "interactive" ? "bg-pink-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                ออนไลน์
              </button>
              <button
                onClick={() => { setActiveTab("pdf"); setSelectedType("all"); }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === "pdf" ? "bg-pink-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                PDF
              </button>
            </div>

            {/* Category list */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">ประเภทข้อสอบ</p>
              </div>
              <nav className="py-1">
                <button
                  onClick={() => setSelectedType("all")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    selectedType === "all"
                      ? "bg-pink-50 text-pink-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <LayoutGrid className="w-4 h-4 flex-shrink-0" />
                  <span>ทั้งหมด</span>
                  <span className="ml-auto text-xs font-medium text-gray-400">
                    {activeTab === "interactive" ? exams.length : pdfExams.length}
                  </span>
                </button>
                {allTypes.map((type) => {
                  const cfg = getConfig(type);
                  const count = activeTab === "interactive"
                    ? exams.filter((e) => e.exam_type === type).length
                    : pdfExams.filter((p) => p.exam_type === type).length;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                        selectedType === type
                          ? "bg-pink-50 text-pink-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br flex-shrink-0 ${cfg.gradient}`} />
                      <span>{EXAM_TYPE_LABELS[type] ?? type}</span>
                      <span className="ml-auto text-xs font-medium text-gray-400">{count}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <main className="flex-1 min-w-0">
            {/* Mobile search + tab */}
            <div className="flex md:hidden gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="ค้นหา..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-sm"
                />
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-1 shadow-sm flex gap-1">
                <button
                  onClick={() => { setActiveTab("interactive"); setSelectedType("all"); }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === "interactive" ? "bg-pink-500 text-white" : "text-gray-500"}`}
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  onClick={() => { setActiveTab("pdf"); setSelectedType("all"); }}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === "pdf" ? "bg-pink-500 text-white" : "text-gray-500"}`}
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mobile category chips */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {["all", ...allTypes].map((type) => {
                const cfg = getConfig(type === "all" ? null : type);
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selectedType === type
                        ? `bg-gradient-to-r ${cfg.gradient} text-white border-transparent shadow-sm`
                        : "bg-white text-gray-600 border-gray-200"
                    }`}
                  >
                    {type === "all" ? "ทั้งหมด" : (EXAM_TYPE_LABELS[type] ?? type)}
                  </button>
                );
              })}
            </div>

            {/* Section heading */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  {activeTab === "interactive" ? t("interactiveExam") : t("pdfExam")}
                  {selectedType !== "all" && (
                    <span className="ml-2 text-sm font-normal text-gray-400">· {selectedType}</span>
                  )}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {activeTab === "interactive" ? filteredExams.length : filteredPdfs.length} รายการ
                </p>
              </div>
            </div>

            {/* Interactive Exams */}
            {activeTab === "interactive" && (
              filteredExams.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">{t("noExams")}</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredExams.map((exam) => {
                    const cfg = getConfig(exam.exam_type);
                    return (
                      <div
                        key={exam.id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200 flex flex-col"
                      >
                        {/* Card header banner */}
                        <div className={`bg-gradient-to-br ${cfg.gradient} px-4 py-5 relative overflow-hidden`}>
                          <div className="absolute right-3 top-2 text-white/10 text-6xl font-black leading-none select-none">
                            {exam.exam_type}
                          </div>
                          <span className="relative text-[11px] font-semibold text-white/70 uppercase tracking-wider">
                            {exam.exam_type}
                          </span>
                          <h3 className="relative text-base font-bold text-white mt-1 leading-snug line-clamp-2">
                            {exam.title}
                          </h3>
                          <p className="relative text-xs text-white/70 mt-0.5">{exam.subject_code}</p>
                        </div>

                        {/* Card body */}
                        <div className="p-4 flex flex-col flex-1">
                          {exam.description && (
                            <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                              {exam.description}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2 mb-4">
                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                              <p className="text-[10px] text-gray-400 flex items-center gap-1"><FileText className="w-3 h-3" />{t("questions")}</p>
                              <p className="text-sm font-bold text-gray-800 mt-0.5">{exam.total_questions}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                              <p className="text-[10px] text-gray-400 flex items-center gap-1"><Clock className="w-3 h-3" />{t("minutes")}</p>
                              <p className="text-sm font-bold text-gray-800 mt-0.5">{exam.duration_minutes}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                              <p className="text-[10px] text-gray-400 flex items-center gap-1"><Trophy className="w-3 h-3" />{t("score")}</p>
                              <p className="text-sm font-bold text-gray-800 mt-0.5">{exam.total_score}</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl px-3 py-2">
                              <p className="text-[10px] text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" />{t("attempts")}</p>
                              <p className="text-sm font-bold text-gray-800 mt-0.5">{exam.attempt_count}</p>
                            </div>
                          </div>

                          <div className="mt-auto">
                            <button
                              onClick={() => handleStartExam(exam.id)}
                              disabled={starting === exam.id}
                              className={`w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r ${cfg.gradient} hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm`}
                            >
                              {starting === exam.id ? (
                                <><RefreshCw className="w-4 h-4 animate-spin" />{t("startingExam")}</>
                              ) : (
                                <>{t("startExam")}<ChevronRight className="w-4 h-4" /></>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* PDF Exams */}
            {activeTab === "pdf" && (
              filteredPdfs.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
                  <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">{t("noPdfExams")}</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredPdfs.map((pdf) => {
                    const cfg = getConfig(pdf.exam_type);
                    return (
                      <a
                        key={pdf.id}
                        href={pdf.r2_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all duration-200"
                      >
                        {/* Thumbnail */}
                        <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`/api/pdf-thumbnail?url=${encodeURIComponent(pdf.r2_url)}`}
                            alt={pdf.title}
                            className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget;
                              target.style.display = "none";
                              const fallback = target.parentElement?.querySelector<HTMLElement>(".fallback");
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <div className="fallback absolute inset-0 flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100" style={{ display: "none" }}>
                            <File className="w-12 h-12 text-gray-300 mb-2" />
                            <span className="text-xs text-gray-400">PDF</span>
                          </div>
                          {pdf.exam_type && (
                            <span className={`absolute top-3 right-3 text-[10px] font-bold text-white px-2 py-0.5 rounded-full bg-gradient-to-r shadow-sm ${cfg.gradient}`}>
                              {pdf.exam_type}
                            </span>
                          )}
                        </div>
                        {/* Card content */}
                        <div className="p-4">
                          <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-pink-600 transition-colors line-clamp-2 text-sm">
                            {pdf.title}
                          </h3>
                          <p className="text-[11px] text-gray-400 font-mono truncate mb-3">{pdf.filename}</p>
                          <div className={`flex items-center gap-1.5 text-sm font-medium ${cfg.text}`}>
                            <ExternalLink className="w-3.5 h-3.5" />
                            {t("viewPdf")}
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              )
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
