"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "@/routing";
import Breadcrumbs from "@/components/Breadcrumbs";
import {
  Sparkles,
  Zap,
  Trophy,
  Globe,
  BookOpen,
  Star,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  RefreshCw,
  User,
  ArrowRight,
  MapPin,
  Medal,
  Activity,
  Brain,
} from "lucide-react";

type MatchType = "quota" | "scholarship" | "exchange" | "competition";

type Match = {
  id: string;
  type: MatchType;
  title: string;
  organization: string;
  description: string;
  matchScore: number;
  matchReasons: string[];
  requirements: string[];
  howToApply: string;
  deadline: string;
  tags: string[];
  difficulty: "low" | "medium" | "high";
};

type ActionStep = {
  step: number;
  action: string;
  timeframe: string;
  priority: "high" | "medium" | "low";
};

type PipelineResult = {
  summary: string;
  talentStrengths: string[];
  matches: Match[];
  actionPlan: ActionStep[];
  profileGaps: string[];
  profileCompleteness: {
    hasSkills: boolean;
    hasAchievements: boolean;
    hasExtracurricular: boolean;
    hasInterests: boolean;
    hasCareerGoals: boolean;
    hasEducation: boolean;
  };
};

const TYPE_CONFIG: Record<
  MatchType,
  { label: string; icon: React.ElementType; color: string; bg: string; border: string; dot: string }
> = {
  quota: {
    label: "โควตา",
    icon: Trophy,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    dot: "bg-amber-400",
  },
  scholarship: {
    label: "ทุนการศึกษา",
    icon: Star,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    dot: "bg-purple-400",
  },
  exchange: {
    label: "แลกเปลี่ยน",
    icon: Globe,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    dot: "bg-blue-400",
  },
  competition: {
    label: "การแข่งขัน",
    icon: Zap,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
    dot: "bg-green-400",
  },
};

const DIFFICULTY_CONFIG = {
  low: { label: "ง่าย", color: "text-green-600", bg: "bg-green-100" },
  medium: { label: "ปานกลาง", color: "text-amber-600", bg: "bg-amber-100" },
  high: { label: "ท้าทาย", color: "text-red-600", bg: "bg-red-100" },
};

const PRIORITY_CONFIG = {
  high: { label: "สำคัญมาก", color: "bg-red-50 text-red-600 border border-red-200" },
  medium: { label: "สำคัญ", color: "bg-amber-50 text-amber-600 border border-amber-200" },
  low: { label: "เพิ่มเติม", color: "bg-gray-50 text-gray-500 border border-gray-200" },
};

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-pink-500" : score >= 60 ? "bg-amber-400" : "bg-gray-300";
  const textColor = score >= 80 ? "text-pink-600" : score >= 60 ? "text-amber-600" : "text-gray-500";
  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className={`text-xs font-bold shrink-0 ${textColor}`}>{score}%</span>
    </div>
  );
}

export default function TalentPipelinePage() {
  const { user } = useAuth();
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState<MatchType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/talent-pipeline", { method: "POST" });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  };

  const filteredMatches =
    result?.matches.filter((m) => activeFilter === "all" || m.type === activeFilter) ?? [];

  const completenessItems = result
    ? [
        { label: "ทักษะ", ok: result.profileCompleteness.hasSkills, icon: Brain },
        { label: "ผลงาน/รางวัล", ok: result.profileCompleteness.hasAchievements, icon: Medal },
        { label: "กิจกรรม", ok: result.profileCompleteness.hasExtracurricular, icon: Activity },
        { label: "ความสนใจ", ok: result.profileCompleteness.hasInterests, icon: Star },
        { label: "เป้าหมาย", ok: result.profileCompleteness.hasCareerGoals, icon: Target },
        { label: "ประวัติการศึกษา", ok: result.profileCompleteness.hasEducation, icon: MapPin },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#f7f7fb]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Breadcrumbs items={[{ label: "Talent Pipeline Matching" }]} />

        <div className="flex gap-5">
          {/* ── Left Sidebar ── */}
          <aside className="hidden md:flex flex-col gap-3 w-52 lg:w-60 flex-shrink-0">
            {/* Info card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-pink-600 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-white" />
                  <p className="text-xs font-semibold text-white uppercase tracking-wider">
                    Talent Pipeline
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-gray-600 leading-relaxed">
                  AI วิเคราะห์โปรไฟล์ของคุณและจับคู่กับโอกาสที่เหมาะสม
                </p>
                <div className="space-y-1.5">
                  {[
                    { icon: Trophy, label: "โควตาพื้นที่/ความสามารถ", color: "text-amber-500" },
                    { icon: Star, label: "ทุนการศึกษา", color: "text-purple-500" },
                    { icon: Globe, label: "โครงการแลกเปลี่ยน", color: "text-blue-500" },
                    { icon: Zap, label: "การแข่งขันพิเศษ", color: "text-green-500" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <item.icon className={`w-3.5 h-3.5 shrink-0 ${item.color}`} />
                      <span className="text-xs text-gray-600">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Profile completeness (after result) */}
            {result && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ข้อมูลที่ใช้วิเคราะห์
                  </p>
                </div>
                <div className="p-3 space-y-2">
                  {completenessItems.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      {item.ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                      )}
                      <span className={`text-xs ${item.ok ? "text-gray-700" : "text-gray-400"}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                  <Link
                    href="/profile"
                    className="flex items-center gap-1 text-xs text-pink-600 hover:text-pink-700 font-medium pt-1"
                  >
                    อัปเดตโปรไฟล์ <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}

            {/* Filter (after result) */}
            {result && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    กรองประเภท
                  </p>
                </div>
                <nav className="py-1">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      activeFilter === "all"
                        ? "bg-pink-50 text-pink-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span>ทั้งหมด</span>
                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                      {result.matches.length}
                    </span>
                  </button>
                  {(Object.keys(TYPE_CONFIG) as MatchType[]).map((type) => {
                    const cfg = TYPE_CONFIG[type];
                    const count = result.matches.filter((m) => m.type === type).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={type}
                        onClick={() => setActiveFilter(type)}
                        className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                          activeFilter === type
                            ? "bg-pink-50 text-pink-700 font-semibold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </div>
                        <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              </div>
            )}
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Header */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="bg-pink-600 px-5 py-4 sm:py-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-white">
                      Talent Pipeline Matching
                    </h1>
                    <p className="text-pink-200 text-xs sm:text-sm mt-0.5">
                      AI จับคู่โอกาสที่เหมาะกับทักษะและประวัติของคุณ
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
              </div>

              {/* Not logged in */}
              {!user && (
                <div className="p-8 text-center space-y-4">
                  <User className="w-10 h-10 text-gray-300 mx-auto" />
                  <p className="text-gray-600 font-medium">กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 bg-pink-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-pink-700 transition text-sm"
                  >
                    เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}

              {/* Start panel */}
              {user && !result && (
                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-3">AI จะวิเคราะห์จาก:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { icon: BookOpen, label: "ประวัติการศึกษา" },
                        { icon: Trophy, label: "ผลงาน / รางวัล" },
                        { icon: Activity, label: "กิจกรรมนอกหลักสูตร" },
                        { icon: Brain, label: "ทักษะ / ความเชี่ยวชาญ" },
                        { icon: Star, label: "ความสนใจ" },
                        { icon: Target, label: "เป้าหมายการศึกษา" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-lg text-xs text-gray-600 border border-gray-100"
                        >
                          <item.icon className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                          {item.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-pink-50 border border-pink-100 rounded-xl p-3 text-xs text-pink-800 flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-pink-500" />
                    <span>
                      เพื่อผลลัพธ์ที่แม่นยำ ควรกรอกข้อมูลโปรไฟล์ให้ครบก่อน{" "}
                      <Link href="/profile" className="underline font-semibold">
                        ไปที่โปรไฟล์ →
                      </Link>
                    </span>
                  </div>

                  <button
                    onClick={run}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white py-3 rounded-xl font-semibold transition disabled:opacity-60 shadow-sm"
                  >
                    {loading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        AI กำลังวิเคราะห์โปรไฟล์...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        เริ่มวิเคราะห์และจับคู่โอกาส
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Summary after result */}
              {result && (
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{result.summary}</p>
                    <button
                      onClick={run}
                      disabled={loading}
                      className="shrink-0 flex items-center gap-1.5 text-xs text-gray-500 hover:text-pink-600 border border-gray-200 hover:border-pink-300 px-3 py-1.5 rounded-lg transition"
                    >
                      <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                      วิเคราะห์ใหม่
                    </button>
                  </div>
                  {result.talentStrengths?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {result.talentStrengths.map((s, i) => (
                        <span
                          key={i}
                          className="px-2.5 py-1 bg-pink-50 border border-pink-200 text-pink-700 text-xs font-semibold rounded-full"
                        >
                          ✦ {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Mobile filter tabs */}
            {result && (
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 md:hidden">
                {(["all", "quota", "scholarship", "exchange", "competition"] as const).map((f) => {
                  const count =
                    f === "all"
                      ? result.matches.length
                      : result.matches.filter((m) => m.type === f).length;
                  if (f !== "all" && count === 0) return null;
                  return (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                        activeFilter === f
                          ? "bg-pink-600 text-white border-pink-600"
                          : "bg-white border-gray-200 text-gray-600"
                      }`}
                    >
                      {f === "all" ? `ทั้งหมด (${count})` : `${TYPE_CONFIG[f].label} (${count})`}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Match cards */}
            {result && filteredMatches.length > 0 && (
              <div className="space-y-2">
                {filteredMatches.map((match) => {
                  const cfg = TYPE_CONFIG[match.type] ?? TYPE_CONFIG.quota;
                  const Icon = cfg.icon;
                  const diffCfg = DIFFICULTY_CONFIG[match.difficulty] ?? DIFFICULTY_CONFIG.medium;
                  const isExpanded = expandedId === match.id;

                  return (
                    <div
                      key={match.id}
                      className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : match.id)}
                        className="w-full text-left px-4 py-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          {/* Score indicator */}
                          <div className="shrink-0 w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center">
                            <span className={`text-sm font-bold leading-none ${match.matchScore >= 80 ? "text-pink-600" : match.matchScore >= 60 ? "text-amber-500" : "text-gray-400"}`}>
                              {match.matchScore}
                            </span>
                            <span className="text-[9px] text-gray-400 leading-none mt-0.5">%</span>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1">
                              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                <Icon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${diffCfg.bg} ${diffCfg.color}`}>
                                {diffCfg.label}
                              </span>
                            </div>
                            <h3 className="font-semibold text-gray-900 text-sm leading-snug">
                              {match.title}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5">{match.organization}</p>
                            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{match.description}</p>
                            <ScoreBar score={match.matchScore} />
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 text-gray-300 shrink-0 transition-transform mt-1 ${isExpanded ? "rotate-90" : ""}`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 px-4 py-4 space-y-4 bg-gray-50">
                          {match.matchReasons?.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                เหตุผลที่เหมาะสม
                              </p>
                              <div className="space-y-1.5">
                                {match.matchReasons.map((r, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                                    {r}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {match.requirements?.length > 0 && (
                            <div>
                              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                คุณสมบัติที่ต้องการ
                              </p>
                              <div className="space-y-1">
                                {match.requirements.map((r, i) => (
                                  <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                                    <span className="text-gray-300 shrink-0 mt-0.5">•</span>
                                    {r}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="grid sm:grid-cols-2 gap-2">
                            {match.howToApply && (
                              <div className="bg-white border border-gray-200 rounded-xl p-3">
                                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                                  วิธีสมัคร
                                </p>
                                <p className="text-xs text-gray-700">{match.howToApply}</p>
                              </div>
                            )}
                            {match.deadline && (
                              <div className="bg-white border border-amber-100 rounded-xl p-3">
                                <p className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> กำหนดการ
                                </p>
                                <p className="text-xs text-gray-700">{match.deadline}</p>
                              </div>
                            )}
                          </div>

                          {match.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {match.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] bg-white border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Plan */}
            {result?.actionPlan?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-pink-500" />
                  <p className="text-sm font-semibold text-gray-800">แผนการดำเนินการ</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {result.actionPlan.map((step) => {
                    const pc = PRIORITY_CONFIG[step.priority];
                    return (
                      <div key={step.step} className="px-4 py-3 flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {step.step}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{step.action}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">{step.timeframe}</span>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${pc.color}`}>
                              {pc.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Profile gaps */}
            {result?.profileGaps?.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <p className="text-sm font-semibold text-amber-800">สิ่งที่ควรเพิ่มเพื่อเพิ่มโอกาส</p>
                </div>
                <div className="p-4 space-y-2">
                  {result.profileGaps.map((gap, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-amber-700">
                      <ChevronRight className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                      {gap}
                    </div>
                  ))}
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-pink-600 hover:text-pink-700 mt-2"
                  >
                    อัปเดตโปรไฟล์ <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
