"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "@/routing";
import {
  Map,
  Sparkles,
  Star,
  Trophy,
  Target,
  FileText,
  GraduationCap,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Loader2,
  BookOpen,
  Medal,
  Pencil,
  TrendingUp,
  AlertCircle,
  UserCircle2,
  ChevronDown,
  Circle,
  RefreshCw,
  ExternalLink,
  ThumbsUp,
  Minus,
} from "lucide-react";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { ProfileSummary, PortfolioQuality } from "@/app/api/pathfinding/route";

// Types

interface TCASRound {
  round: 1 | 2 | 3 | 4;
  name: string;
  suitability: "high" | "medium" | "low";
  score: number;
  reasons: string[];
  tips: string[];
  requiredItems: string[];
}

interface PathfindingResult {
  summary: string;
  rounds: TCASRound[];
  topRecommendation: 1 | 2 | 3 | 4;
  personalMessage: string;
  nextSteps: string[];
}

// Constants

const ROUND_COLORS: Record<number, { bg: string; border: string; icon: string }> = {
  1: { bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-600" },
  2: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
  3: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-600" },
  4: { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-600" },
};

const SUITABILITY_LABEL: Record<string, { label: string; color: string }> = {
  high: { label: "เหมาะสมมาก", color: "text-green-600" },
  medium: { label: "เหมาะสมปานกลาง", color: "text-yellow-600" },
  low: { label: "เหมาะสมน้อย", color: "text-red-500" },
};

const PORTFOLIO_LABEL: Record<PortfolioQuality, { label: string; color: string; icon: React.ElementType }> = {
  excellent: { label: "ดีเยี่ยม", color: "text-green-600", icon: Trophy },
  good: { label: "ดี", color: "text-blue-600", icon: ThumbsUp },
  basic: { label: "พื้นฐาน", color: "text-yellow-600", icon: FileText },
  none: { label: "ยังไม่มี", color: "text-gray-400", icon: Minus },
};

const FIELDS = [
  "วิศวกรรมศาสตร์",
  "แพทยศาสตร์ / สาธารณสุข",
  "วิทยาศาสตร์ / เทคโนโลยี",
  "บริหารธุรกิจ / เศรษฐศาสตร์",
  "นิติศาสตร์ / รัฐศาสตร์",
  "ครุศาสตร์ / ศึกษาศาสตร์",
  "สถาปัตยกรรมศาสตร์ / ออกแบบ",
  "นิเทศศาสตร์ / สื่อสารมวลชน",
  "อักษรศาสตร์ / มนุษยศาสตร์",
  "สังคมศาสตร์",
  "เกษตรศาสตร์",
  "สัตวแพทยศาสตร์",
  "เภสัชศาสตร์",
  "ทันตแพทยศาสตร์",
  "พยาบาลศาสตร์",
  "อื่นๆ",
];

// Main

export default function PathfindingPage() {
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PathfindingResult | null>(null);

  // Optional overrides
  const [targetField, setTargetField] = useState("");
  const [targetUniversity, setTargetUniversity] = useState("");

  useEffect(() => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }
    fetch("/api/pathfinding")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProfile(d.data as ProfileSummary);
          if (d.data.careerGoalField) setTargetField(d.data.careerGoalField);
          if (d.data.careerGoalUniversities?.[0]) setTargetUniversity(d.data.careerGoalUniversities[0]);
        } else {
          toast.error(d.error || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
        }
      })
      .catch(() => toast.error("ไม่สามารถเชื่อมต่อได้"))
      .finally(() => setLoadingProfile(false));
  }, [user]);

  async function handleAnalyze() {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
      return;
    }
    if (!targetField) {
      toast.error("กรุณาเลือกสาขา/คณะที่สนใจก่อน");
      return;
    }
    setAnalyzing(true);
    try {
      const res = await fetch("/api/pathfinding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetField, targetUniversity: targetUniversity || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        return;
      }
      setResult(data.data as PathfindingResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่");
    } finally {
      setAnalyzing(false);
    }
  }

  if (authLoading || (user && loadingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-pink-500 w-10 h-10 mx-auto" />
          <p className="text-gray-500 text-sm">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "หน้าหลัก", href: "/" },
            { label: "ค้นเส้นทาง TCAS", href: "/pathfinding" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center gap-3 mt-4 mb-8">
          <div className="p-3 bg-pink-100 rounded-2xl">
            <Map className="w-8 h-8 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ระบบค้นเส้นทาง TCAS</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              AI วิเคราะห์โปรไฟล์ของคุณเพื่อแนะนำรอบสมัครที่เหมาะสมที่สุด
            </p>
          </div>
        </div>

        {!user ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
            <UserCircle2 className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-700 font-semibold">กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
            <p className="text-sm text-gray-500">ระบบต้องการข้อมูลโปรไฟล์ของคุณเพื่อวิเคราะห์เส้นทาง TCAS</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-700 transition"
            >
              เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : result ? (
          <ResultView
            result={result}
            profile={profile}
            onReset={() => setResult(null)}
          />
        ) : (
          <div className="space-y-5">
            {/* Profile data card */}
            {profile && <ProfileCard profile={profile} />}

            {/* Missing data warning */}
            {profile && profile.missingItems.length > 0 && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">ข้อมูลโปรไฟล์ยังไม่ครบ</p>
                  <ul className="mt-1 space-y-0.5">
                    {profile.missingItems.map((item, i) => (
                      <li key={i} className="text-xs text-amber-600">- {item}</li>
                    ))}
                  </ul>
                  <Link href="/profile" className="inline-flex items-center gap-1 mt-2 text-xs text-amber-700 font-medium underline underline-offset-2">
                    <ExternalLink className="w-3 h-3" /> ไปกรอกข้อมูลโปรไฟล์
                  </Link>
                </div>
              </div>
            )}

            {/* Target field & university */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h2 className="font-semibold text-gray-800">เป้าหมาย</h2>
                {profile?.careerGoalField && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ดึงจากโปรไฟล์
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สาขา / คณะที่สนใจ <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetField}
                  onChange={(e) => setTargetField(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                >
                  <option value="">-- เลือกสาขา --</option>
                  {FIELDS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  มหาวิทยาลัยเป้าหมาย{" "}
                  <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                  {profile?.careerGoalUniversities?.[0] && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      ดึงจากโปรไฟล์
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="เช่น จุฬาลงกรณ์มหาวิทยาลัย, มหาวิทยาลัยมหิดล"
                  value={targetUniversity}
                  onChange={(e) => setTargetUniversity(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>

            {/* Analyze button */}
            <button
              onClick={handleAnalyze}
              disabled={!targetField || analyzing || !profile?.hasEnoughData}
              className="w-full py-4 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI กำลังวิเคราะห์โปรไฟล์ของคุณ...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  วิเคราะห์เส้นทาง TCAS ด้วย AI
                </>
              )}
            </button>

            {!profile?.hasEnoughData && (
              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                กรุณากรอก GPAX ในโปรไฟล์ก่อนวิเคราะห์
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Profile preview card

function ProfileCard({ profile }: { profile: ProfileSummary }) {
  const gpaxColor =
    profile.gpax == null
      ? "text-gray-400"
      : profile.gpax >= 3.5
      ? "text-green-600"
      : profile.gpax >= 3.0
      ? "text-yellow-600"
      : "text-orange-500";

  const scoreCount = Object.keys(profile.scores).length;
  const portInfo = PORTFOLIO_LABEL[profile.portfolioQuality];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserCircle2 className="w-5 h-5 text-pink-500" />
          <h2 className="font-semibold text-gray-800">สรุปข้อมูลโปรไฟล์</h2>
        </div>
        <Link
          href="/profile"
          className="text-xs text-pink-600 hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> อัปเดตโปรไฟล์
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* GPAX */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className={`text-2xl font-bold ${gpaxColor}`}>
            {profile.gpax != null ? profile.gpax.toFixed(2) : "-"}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <GraduationCap className="w-3 h-3" /> GPAX
          </div>
        </div>

        {/* Scores */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className={`text-2xl font-bold ${scoreCount > 0 ? "text-blue-600" : "text-gray-400"}`}>
            {scoreCount}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <BookOpen className="w-3 h-3" /> คะแนนสอบ
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className={`flex items-center justify-center ${portInfo.color}`}>
            <portInfo.icon className="w-6 h-6" />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            พอร์ต ({profile.portfolioCount})
          </div>
          <div className={`text-xs font-medium ${portInfo.color}`}>{portInfo.label}</div>
        </div>

        {/* Activities */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className={`text-2xl font-bold ${profile.extracurricular.length > 0 ? "text-purple-600" : "text-gray-400"}`}>
            {profile.extracurricular.length}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Target className="w-3 h-3" /> กิจกรรม
          </div>
        </div>
      </div>

      {/* Score details */}
      {scoreCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            คะแนนที่บันทึกไว้
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(profile.scores).map(([key, val]) => (
              <span key={key} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                {profile.scoreLabels[key] ?? key}: {val}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {profile.achievements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Medal className="w-3 h-3 text-yellow-500" /> รางวัล / เกียรติบัตร
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.achievements.slice(0, 4).map((a, i) => (
              <span key={i} className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full">
                {a}
              </span>
            ))}
            {profile.achievements.length > 4 && (
              <span className="text-xs text-gray-400">+{profile.achievements.length - 4} รายการ</span>
            )}
          </div>
        </div>
      )}

      {/* School info */}
      {(profile.schoolName || profile.schoolType) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-medium">โรงเรียน:</span>{" "}
            {[profile.schoolName, profile.schoolType].filter(Boolean).join(" / ")}
          </p>
        </div>
      )}
    </div>
  );
}

// Result view

function ResultView({
  result,
  profile,
  onReset,
}: {
  result: PathfindingResult;
  profile: ProfileSummary | null;
  onReset: () => void;
}) {
  const sortedRounds = [...result.rounds].sort((a, b) => b.score - a.score);
  const topRound = result.rounds.find((r) => r.round === result.topRecommendation);

  return (
    <div className="space-y-6">
      {/* Personal message card */}
      <div className="bg-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">ผลการวิเคราะห์จาก AI</span>
        </div>
        <p className="text-base leading-relaxed">{result.summary}</p>
        <div className="mt-4 bg-white/20 rounded-xl p-4">
          <p className="text-sm leading-relaxed italic">&ldquo;{result.personalMessage}&rdquo;</p>
        </div>
      </div>

      {/* Top recommendation highlight */}
      {topRound && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="font-bold text-yellow-700">รอบที่แนะนำมากที่สุด</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{topRound.name}</p>
          <p className="text-sm text-gray-600 mt-1">
            คะแนนความเหมาะสม:{" "}
            <span className="font-bold text-yellow-600">{topRound.score}/100</span>
          </p>
        </div>
      )}

      {/* All rounds */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-pink-500" />
          ความเหมาะสมในแต่ละรอบ
        </h2>
        <div className="space-y-4">
          {sortedRounds.map((round) => (
            <RoundCard key={round.round} round={round} isTop={round.round === result.topRecommendation} />
          ))}
        </div>
      </div>

      {/* Next steps */}
      {result.nextSteps?.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            ขั้นตอนถัดไปที่ควรทำ
          </h3>
          <ol className="space-y-2">
            {result.nextSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-blue-700">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Profile used */}
      {profile && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">ข้อมูลที่ใช้วิเคราะห์</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {profile.gpax != null && (
              <span className="bg-white border rounded-full px-2.5 py-1 text-gray-600">GPAX {profile.gpax.toFixed(2)}</span>
            )}
            {Object.entries(profile.scores).map(([k, v]) => (
              <span key={k} className="bg-white border rounded-full px-2.5 py-1 text-gray-600">{k} {v}</span>
            ))}
            <span className="bg-white border rounded-full px-2.5 py-1 text-gray-600">
              พอร์ต: {PORTFOLIO_LABEL[profile.portfolioQuality].label}
            </span>
            {profile.achievements.length > 0 && (
              <span className="bg-white border rounded-full px-2.5 py-1 text-gray-600">
                รางวัล {profile.achievements.length} รายการ
              </span>
            )}
          </div>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={onReset}
        className="w-full py-3 border-2 border-pink-200 text-pink-600 rounded-xl font-semibold text-sm hover:bg-pink-50 transition-all flex items-center justify-center gap-2"
      >
        <Pencil className="w-4 h-4" />
        วิเคราะห์ใหม่อีกครั้ง
      </button>
    </div>
  );
}

// Round card

function RoundCard({ round, isTop }: { round: TCASRound; isTop: boolean }) {
  const [open, setOpen] = useState(false);
  const colors = ROUND_COLORS[round.round];
  const suit = SUITABILITY_LABEL[round.suitability];

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all ${colors.bg} ${
        isTop ? "border-yellow-400 shadow-md" : colors.border
      }`}
    >
      <button className="w-full text-left" onClick={() => setOpen((o) => !o)}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isTop && <Trophy className="w-4 h-4 text-yellow-500" />}
              <div>
                <p className="font-bold text-gray-900 text-sm">{round.name}</p>
                <p className={`text-xs font-medium ${suit.color}`}>{suit.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ScoreBar score={round.score} />
              {open ? (
                <ChevronDown className={`w-4 h-4 ${colors.icon} rotate-180`} />
              ) : (
                <ChevronDown className={`w-4 h-4 ${colors.icon}`} />
              )}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-current/10 px-4 pb-4 pt-3 space-y-3">
          {round.reasons?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">เหตุผล</p>
              <ul className="space-y-1">
                {round.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {round.tips?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">คำแนะนำ</p>
              <ul className="space-y-1">
                {round.tips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {round.requiredItems?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">สิ่งที่ต้องเตรียม</p>
              <ul className="space-y-1">
                {round.requiredItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}
