"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "@/routing";
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
  { label: string; icon: React.ElementType; color: string; bg: string; border: string }
> = {
  quota: {
    label: "โควตา",
    icon: Trophy,
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  scholarship: {
    label: "ทุนการศึกษา",
    icon: Star,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
  },
  exchange: {
    label: "แลกเปลี่ยน",
    icon: Globe,
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  competition: {
    label: "การแข่งขัน",
    icon: Zap,
    color: "text-green-700",
    bg: "bg-green-50",
    border: "border-green-200",
  },
};

const DIFFICULTY_CONFIG = {
  low: { label: "ง่าย", color: "text-green-600", bg: "bg-green-100" },
  medium: { label: "ปานกลาง", color: "text-amber-600", bg: "bg-amber-100" },
  high: { label: "ท้าทาย", color: "text-red-600", bg: "bg-red-100" },
};

const PRIORITY_COLOR = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 80 ? "text-green-500" : score >= 60 ? "text-amber-500" : "text-gray-400";
  return (
    <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-full border-4 ${score >= 80 ? "border-green-300" : score >= 60 ? "border-amber-300" : "border-gray-200"} shrink-0`}>
      <span className={`text-base font-bold leading-none ${color}`}>{score}</span>
      <span className="text-[9px] text-gray-400">%</span>
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
        { label: "ทักษะ", ok: result.profileCompleteness.hasSkills },
        { label: "ผลงาน/รางวัล", ok: result.profileCompleteness.hasAchievements },
        { label: "กิจกรรม", ok: result.profileCompleteness.hasExtracurricular },
        { label: "ความสนใจ", ok: result.profileCompleteness.hasInterests },
        { label: "เป้าหมาย", ok: result.profileCompleteness.hasCareerGoals },
        { label: "ประวัติการศึกษา", ok: result.profileCompleteness.hasEducation },
      ]
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              Talent Pipeline Matching
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            ค้นหาโอกาสที่ใช่สำหรับคุณ
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-xl">
            AI วิเคราะห์โปรไฟล์ของคุณ — ทักษะ ผลงาน กิจกรรม ความสนใจ —
            แล้วจับคู่กับโควตา ทุนแลกเปลี่ยน และโครงการพิเศษที่เหมาะสมที่สุด
          </p>
        </div>
      </div>

      {/* Not logged in */}
      {!user && (
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-4">
          <User className="w-12 h-12 text-gray-300 mx-auto" />
          <p className="text-gray-700 font-semibold">กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Start button */}
      {user && !result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-gray-900">AI จะวิเคราะห์อะไรบ้าง?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { icon: BookOpen, label: "ประวัติการศึกษา & โรงเรียน" },
                { icon: Trophy, label: "ผลงาน รางวัล เกียรติบัตร" },
                { icon: Target, label: "กิจกรรมนอกหลักสูตร" },
                { icon: Zap, label: "ทักษะและความเชี่ยวชาญ" },
                { icon: Star, label: "ความสนใจและความถนัด" },
                { icon: TrendingUp, label: "เป้าหมายการศึกษา" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl text-sm text-gray-700"
                >
                  <item.icon className="w-4 h-4 text-indigo-500 shrink-0" />
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
            <strong>เพื่อผลลัพธ์ที่ดีที่สุด</strong> ควรกรอกข้อมูลโปรไฟล์ให้ครบก่อน
            โดยเฉพาะทักษะ ผลงาน และกิจกรรม
            <Link href="/profile" className="ml-2 underline font-semibold">
              ไปที่โปรไฟล์ →
            </Link>
          </div>

          <button
            onClick={run}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                AI กำลังวิเคราะห์โปรไฟล์...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                เริ่มวิเคราะห์และจับคู่โอกาส
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Summary + strengths */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  สรุปโปรไฟล์
                </h2>
                <p className="text-sm text-gray-600">{result.summary}</p>
              </div>
              <button
                onClick={run}
                disabled={loading}
                className="shrink-0 flex items-center gap-1.5 text-xs text-gray-500 hover:text-indigo-600 border border-gray-200 px-3 py-1.5 rounded-lg hover:border-indigo-300 transition"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
                วิเคราะห์ใหม่
              </button>
            </div>

            {result.talentStrengths?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">จุดแข็งที่โดดเด่น</p>
                <div className="flex flex-wrap gap-2">
                  {result.talentStrengths.map((s, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 text-indigo-800 text-xs font-semibold rounded-full"
                    >
                      ✦ {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Profile completeness */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">ข้อมูลที่ใช้วิเคราะห์</p>
              <div className="flex flex-wrap gap-2">
                {completenessItems.map((item) => (
                  <span
                    key={item.label}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                      item.ok
                        ? "bg-green-50 border border-green-200 text-green-700"
                        : "bg-gray-50 border border-gray-200 text-gray-400"
                    }`}
                  >
                    {item.ok ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <AlertCircle className="w-3 h-3" />
                    )}
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {(["all", "quota", "scholarship", "exchange", "competition"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition ${
                  activeFilter === f
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-indigo-300"
                }`}
              >
                {f === "all"
                  ? `ทั้งหมด (${result.matches.length})`
                  : `${TYPE_CONFIG[f].label} (${result.matches.filter((m) => m.type === f).length})`}
              </button>
            ))}
          </div>

          {/* Match cards */}
          <div className="space-y-3">
            {filteredMatches.map((match) => {
              const cfg = TYPE_CONFIG[match.type] || TYPE_CONFIG.quota;
              const Icon = cfg.icon;
              const diffCfg = DIFFICULTY_CONFIG[match.difficulty] || DIFFICULTY_CONFIG.medium;
              const isExpanded = expandedId === match.id;

              return (
                <div
                  key={match.id}
                  className={`bg-white border ${cfg.border} rounded-2xl overflow-hidden transition-shadow hover:shadow-md`}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : match.id)}
                    className="w-full text-left p-4 sm:p-5"
                  >
                    <div className="flex items-start gap-4">
                      <ScoreRing score={match.matchScore} />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${diffCfg.bg} ${diffCfg.color}`}>
                            {diffCfg.label}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-snug">{match.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{match.organization}</p>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{match.description}</p>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {match.matchReasons?.slice(0, 2).map((r, i) => (
                            <span key={i} className="text-[11px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                              ✓ {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <ChevronRight
                        className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                      />
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0 space-y-4 border-t border-gray-100">
                      {match.matchReasons?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">เหตุผลที่เหมาะสม</p>
                          <ul className="space-y-1">
                            {match.matchReasons.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {match.requirements?.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-1.5">คุณสมบัติที่ต้องการ</p>
                          <ul className="space-y-1">
                            {match.requirements.map((r, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="text-gray-400 shrink-0">•</span>
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-3">
                        {match.howToApply && (
                          <div className="bg-blue-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-blue-700 mb-1">วิธีสมัคร</p>
                            <p className="text-sm text-blue-900">{match.howToApply}</p>
                          </div>
                        )}
                        {match.deadline && (
                          <div className="bg-amber-50 rounded-xl p-3">
                            <p className="text-xs font-semibold text-amber-700 mb-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" /> กำหนดการสมัคร
                            </p>
                            <p className="text-sm text-amber-900">{match.deadline}</p>
                          </div>
                        )}
                      </div>

                      {match.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {match.tags.map((tag, i) => (
                            <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
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

          {/* Action Plan */}
          {result.actionPlan?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-3">
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                แผนการดำเนินการ
              </h2>
              <div className="space-y-2">
                {result.actionPlan.map((step) => (
                  <div key={step.step} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {step.step}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 font-medium">{step.action}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-500">{step.timeframe}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${PRIORITY_COLOR[step.priority]}`}>
                          {step.priority === "high" ? "สำคัญมาก" : step.priority === "medium" ? "สำคัญ" : "เพิ่มเติม"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Profile gaps */}
          {result.profileGaps?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-2">
              <h2 className="font-bold text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                สิ่งที่ควรเพิ่มเพื่อเพิ่มโอกาส
              </h2>
              <ul className="space-y-1.5">
                {result.profileGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
                    <span className="text-amber-500 shrink-0 mt-0.5">→</span>
                    {gap}
                  </li>
                ))}
              </ul>
              <Link
                href="/profile"
                className="inline-flex items-center gap-1.5 mt-1 text-sm font-semibold text-amber-700 underline"
              >
                อัปเดตโปรไฟล์ <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
