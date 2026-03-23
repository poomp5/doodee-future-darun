"use client";
import { useState, useEffect, Suspense, useMemo, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, Link } from "@/routing";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Upload,
  BarChart3,
  Clock,
  Trash2,
  Sparkles,
  Lightbulb,
  GraduationCap,
  Palette,
  Building2,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  Zap,
  Eye,
  AlertTriangle,
  Brain,
  Flame,
  Shield,
  Star,
  ChevronRight,
  ChevronDown,
  Layers,
  ArrowRight,
  Rocket,
  Plus,
  Edit2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import dynamic from "next/dynamic";
import Image from "next/image";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
);

const SkillsRadarChart = dynamic(
  () => import("@/components/SkillsRadarChart"),
  { ssr: false },
);

const ProgramRecommendationCard = dynamic(
  () => import("@/components/ProgramRecommendationCard"),
  { ssr: false },
);

type SkillScores = Record<string, number>;

interface ProgramRecommendation {
  id: number;
  university_id: string | null;
  university_name_th: string | null;
  university_name_en: string | null;
  faculty_name_th: string | null;
  faculty_name_en: string | null;
  field_name_th: string | null;
  field_name_en: string | null;
  program_name_th: string | null;
  program_name_en: string | null;
  logo_url: string | null;
  required_skills: string[];
  matched_skills: Array<{ skill: string; score: number }>;
  match_percentage: number;
}

interface AnalysisMetadata {
  text_length?: number;
  confidence_score?: number;
  processing_time?: number;
}

interface AnalysisHistoryItem {
  id: string;
  analyzed_at: string;
  file_url?: string | null;
  overview?: string | null;
  strengths?: unknown;
  weaknesses?: unknown;
  recommendations?: unknown;
  detected_interests?: unknown;
  portfolio_text_excerpt?: string | null;
  subject_scores?: unknown;
  recommended_faculties?: unknown;
  analysis_metadata?: AnalysisMetadata | null;
  version?: number;
  version_label?: string;
  status?: string;
  portfolio_name?: string | null;
  submission_university_name?: string | null;
  submission_program_name?: string | null;
  submission_logo_url?: string | null;
}

interface CompletenessBreakdown {
  contentDepth: number;
  skillDiversity: number;
  evidenceQuality: number;
  professionalPresentation: number;
  uniqueness: number;
}

interface CompletenessAnalysis {
  score: number;
  breakdown: CompletenessBreakdown;
  criticalIssues: string[];
  strengths: string[];
  nextSteps: string[];
}

function ScrollSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.08 });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 36 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const Shimmer = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-gray-200/60 ${className}`} />
);

const AnalyseSkeleton = () => (
  <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50/40 to-blue-50/30 px-4 py-10 pb-28">
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="flex flex-col items-center gap-4">
        <Shimmer className="h-10 w-72" />
        <Shimmer className="h-12 w-48 !rounded-2xl" />
      </div>
      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <div className="space-y-4">
          <Shimmer className="h-52 !rounded-2xl" />
          <Shimmer className="h-64 !rounded-2xl" />
        </div>
        <div className="space-y-6">
          <Shimmer className="h-40 !rounded-2xl" />
          <div className="grid gap-6 md:grid-cols-2">
            <Shimmer className="h-56 !rounded-2xl" />
            <Shimmer className="h-56 !rounded-2xl" />
          </div>
          <Shimmer className="h-64 !rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

const RecommendationSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <Shimmer key={i} className="h-28" />
    ))}
  </div>
);

function calculatePortfolioCompleteness(
  data: AnalysisHistoryItem | null,
): CompletenessAnalysis {
  const empty: CompletenessAnalysis = {
    score: 0,
    breakdown: {
      contentDepth: 0,
      skillDiversity: 0,
      evidenceQuality: 0,
      professionalPresentation: 0,
      uniqueness: 0,
    },
    criticalIssues: [],
    strengths: [],
    nextSteps: [],
  };
  if (!data)
    return {
      ...empty,
      criticalIssues: ["ไม่มีข้อมูลพอร์ตโฟลิโอ"],
      nextSteps: ["อัปโหลดพอร์ตโฟลิโอของคุณ"],
    };
  const bd: CompletenessBreakdown = {
    contentDepth: 0,
    skillDiversity: 0,
    evidenceQuality: 0,
    professionalPresentation: 0,
    uniqueness: 0,
  };
  const issues: string[] = [];
  const good: string[] = [];
  const next: string[] = [];
  const tLen =
    data.analysis_metadata?.text_length ||
    data.portfolio_text_excerpt?.length ||
    0;
  const oLen = data.overview?.length || 0;
  if (tLen > 3000 && oLen > 200) {
    bd.contentDepth = 25;
    good.push("เนื้อหาละเอียดครอบคลุม");
  } else if (tLen > 1500 && oLen > 100) {
    bd.contentDepth = 18;
    next.push("เพิ่มรายละเอียดโปรเจกต์และผลงาน");
  } else if (tLen > 500) {
    bd.contentDepth = 10;
    issues.push("เนื้อหาน้อยเกินไป ต้องการอย่างน้อย 1,500 ตัวอักษร");
  } else {
    bd.contentDepth = 3;
    issues.push("เนื้อหาน้อยมาก ไม่สามารถประเมินได้ถูกต้อง");
  }
  const sKeys =
    data.subject_scores && typeof data.subject_scores === "object"
      ? Object.keys(data.subject_scores)
      : [];
  const sVals =
    data.subject_scores && typeof data.subject_scores === "object"
      ? Object.values(data.subject_scores as Record<string, number>)
      : [];
  const avg =
    sVals.length > 0 ? sVals.reduce((a, b) => a + b, 0) / sVals.length : 0;
  if (sKeys.length >= 6 && avg >= 70) {
    bd.skillDiversity = 25;
    good.push("ทักษะหลากหลายและแข็งแกร่ง");
  } else if (sKeys.length >= 4 && avg >= 60) {
    bd.skillDiversity = 18;
    next.push("พัฒนาทักษะเพิ่มเติมในสาขาที่เกี่ยวข้อง");
  } else if (sKeys.length >= 2) {
    bd.skillDiversity = 10;
    issues.push("ทักษะยังไม่หลากหลายพอ ควรมี 4-6 ทักษะหลัก");
  } else {
    bd.skillDiversity = 3;
    issues.push("ไม่มีข้อมูลทักษะที่ชัดเจน");
  }
  const strC = Array.isArray(data.strengths) ? data.strengths.length : 0;
  const wkC = Array.isArray(data.weaknesses) ? data.weaknesses.length : 0;
  if (strC >= 5 && wkC >= 3) {
    bd.evidenceQuality = 20;
    good.push("มีหลักฐานและตัวอย่างชัดเจน");
  } else if (strC >= 3 && wkC >= 2) {
    bd.evidenceQuality = 14;
    next.push("เพิ่มตัวอย่างผลงานที่เป็นรูปธรรม");
  } else if (strC >= 1) {
    bd.evidenceQuality = 7;
    issues.push("ขาดหลักฐานสนับสนุน ต้องมีตัวอย่างผลงานจริง");
  } else {
    bd.evidenceQuality = 0;
    issues.push("ไม่มีหลักฐานหรือตัวอย่างผลงาน");
  }
  let pp = 0;
  if (Array.isArray(data.recommendations) && data.recommendations.length >= 3)
    pp += 6;
  if (
    Array.isArray(data.detected_interests) &&
    data.detected_interests.length >= 2
  )
    pp += 5;
  if (
    data.analysis_metadata?.confidence_score &&
    data.analysis_metadata.confidence_score >= 70
  )
    pp += 4;
  bd.professionalPresentation = pp;
  if (pp >= 12) good.push("การนำเสนอมืออาชีพครบถ้วน");
  else if (pp < 8) issues.push("การนำเสนอยังไม่เป็นมืออาชีพ");
  const iC = Array.isArray(data.detected_interests)
    ? data.detected_interests.length
    : 0;
  if (iC >= 3 && oLen > 150) {
    bd.uniqueness = 15;
    good.push("มีจุดเด่นและเอกลักษณ์โดดเด่น");
  } else if (iC >= 3 || oLen > 150) {
    bd.uniqueness = 9;
    next.push("เน้นจุดเด่นของคุณให้ชัดเจนขึ้น");
  } else {
    bd.uniqueness = 3;
    issues.push("ยังไม่มีจุดเด่นที่โดดเด่น");
  }
  const total = Object.values(bd).reduce((a, b) => a + b, 0);
  if (total < 40) next.unshift("พอร์ตโฟลิโอต้องการการปรับปรุงอย่างมาก");
  else if (total < 70) next.unshift("ปรับปรุงจุดอ่อนสำคัญก่อนส่งสมัคร");
  return {
    score: Math.round(total),
    breakdown: bd,
    criticalIssues: issues,
    strengths: good,
    nextSteps: next.slice(0, 5),
  };
}

function normalizeSkillScores(raw: unknown): SkillScores {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  const s: SkillScores = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const n = Number(v);
    if (Number.isFinite(n)) s[k] = Math.max(0, Math.min(100, n));
  }
  return s;
}

function normalizeStringArray(raw: unknown): string[] {
  return Array.isArray(raw)
    ? raw.filter(
        (i): i is string => typeof i === "string" && i.trim().length > 0,
      )
    : [];
}

function getStatusStyle(status: string): string {
  if (status === "pending") return "bg-amber-100 text-amber-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  return "bg-emerald-100 text-emerald-700";
}

const bdMeta = (th: boolean) => [
  {
    key: "contentDepth" as const,
    label: th ? "ความลึกของเนื้อหา" : "Content Depth",
    max: 25,
    icon: Layers,
    color: "from-violet-500 to-purple-600",
  },
  {
    key: "skillDiversity" as const,
    label: th ? "ความหลากหลายของทักษะ" : "Skill Diversity",
    max: 25,
    icon: Star,
    color: "from-blue-500 to-cyan-600",
  },
  {
    key: "evidenceQuality" as const,
    label: th ? "คุณภาพหลักฐาน" : "Evidence Quality",
    max: 20,
    icon: Shield,
    color: "from-emerald-500 to-green-600",
  },
  {
    key: "professionalPresentation" as const,
    label: th ? "การนำเสนอมืออาชีพ" : "Professional Presentation",
    max: 15,
    icon: Award,
    color: "from-amber-500 to-orange-600",
  },
  {
    key: "uniqueness" as const,
    label: th ? "เอกลักษณ์เฉพาะตัว" : "Uniqueness & Impact",
    max: 15,
    icon: Flame,
    color: "from-pink-500 to-rose-600",
  },
];

const AnalysePage = () => {
  const t = useTranslations("analyse");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const isTh = locale === "th";
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileParam = searchParams?.get("file");
  const dateLocale = isTh ? "th-TH" : "en-US";
  const [analysisData, setAnalysisData] = useState<AnalysisHistoryItem | null>(
    null,
  );
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>(
    [],
  );
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string | null>(
    null,
  );
  const [programRecommendations, setProgramRecommendations] = useState<
    ProgramRecommendation[]
  >([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState<string | null>(
    null,
  );
  const [showAllPrograms, setShowAllPrograms] = useState(false);
  const [addingToList, setAddingToList] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [addedToList, setAddedToList] = useState<{ [key: number]: boolean }>(
    {},
  );
  const processingRef = useRef<{ [key: number]: boolean }>({});
  const [editingUniversity, setEditingUniversity] = useState<string | null>(
    null,
  );
  const queryClient = useQueryClient();
  const [universities, setUniversities] = useState<
    Array<{
      id: string;
      name_th: string;
      name_en: string;
      logo_url: string | null;
    }>
  >([]);
  const skillScores = useMemo(
    () => normalizeSkillScores(analysisData?.subject_scores),
    [analysisData?.subject_scores],
  );
  const strengths = useMemo(
    () => normalizeStringArray(analysisData?.strengths),
    [analysisData?.strengths],
  );
  const weaknesses = useMemo(
    () => normalizeStringArray(analysisData?.weaknesses),
    [analysisData?.weaknesses],
  );
  const suggestions = useMemo(
    () => normalizeStringArray(analysisData?.recommendations),
    [analysisData?.recommendations],
  );
  const interests = useMemo(
    () => normalizeStringArray(analysisData?.detected_interests),
    [analysisData?.detected_interests],
  );
  const completeness = useMemo(
    () => calculatePortfolioCompleteness(analysisData),
    [analysisData],
  );

  const visiblePrograms = useMemo(() => {
    if (showAllPrograms) return programRecommendations;
    return programRecommendations.slice(0, 3);
  }, [programRecommendations, showAllPrograms]);

  const enabled = !authLoading && !!user?.id;

  const latestQuery = useQuery({
    queryKey: ["analysis", user?.id, "latest"],
    queryFn: async () => {
      const res = await fetch(`/api/db/analysis?user_id=${user?.id}`);
      return res.ok ? await res.json() : null;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 500,
  });

  const historyQuery = useQuery({
    queryKey: ["analysis", user?.id, "history"],
    queryFn: async () => {
      const res = await fetch(
        `/api/db/analysis?user_id=${user?.id}&all=true&limit=10&light=true`,
      );
      return res.ok ? await res.json() : { data: [] };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 500,
  });

  const uploadsQuery = useQuery({
    queryKey: ["portfolio-uploads", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/upload-record`);
      return res.ok ? await res.json() : { data: [] };
    },
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 1,
    retryDelay: 500,
  });

  const isAnalysisStateLoading =
    latestQuery.isLoading || historyQuery.isLoading || uploadsQuery.isLoading;
  const latestAnalysis = latestQuery.data ?? null;
  const historyResult = historyQuery.data ?? null;
  const history = useMemo(
    () => (Array.isArray(historyResult?.data) ? historyResult.data : []),
    [historyResult?.data],
  );
  const uploadsResult = uploadsQuery.data ?? null;
  const uploads = useMemo(
    () => (Array.isArray(uploadsResult?.data) ? uploadsResult.data : []),
    [uploadsResult?.data],
  );
  const hasUploads = uploads.length > 0;
  const shouldRedirectToLogin = !authLoading && !user;
  const shouldRedirectToUpload =
    !!user?.id &&
    !isAnalysisStateLoading &&
    (!hasUploads || (!latestAnalysis?.id && history.length === 0));

  const universitiesQuery = useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const res = await fetch("/api/db/universities");
      if (res.ok) {
        const data = await res.json();
        return data.universities || [];
      }
      return [];
    },
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour (universities rarely change)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (universitiesQuery.data) {
      setUniversities(universitiesQuery.data);
    }
  }, [universitiesQuery.data]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (isAnalysisStateLoading) {
      return;
    }

    if (latestAnalysis) {
      setAnalysisData(latestAnalysis);
      setSelectedAnalysisId(latestAnalysis.id);
    }

    if (historyResult?.data) {
      setAnalysisHistory(historyResult.data);
    }
  }, [
    user,
    authLoading,
    router,
    latestAnalysis,
    historyResult,
    isAnalysisStateLoading,
  ]);

  useEffect(() => {
    if (!user?.id) return;
    if (isAnalysisStateLoading) {
      return;
    }

    if (!hasUploads) {
      router.replace("/analyse/upload");
      return;
    }

    if (latestAnalysis && latestAnalysis.id) {
      setAnalysisData(latestAnalysis);
      setSelectedAnalysisId(latestAnalysis.id);
      if (!history.find((h: AnalysisHistoryItem) => h.id === latestAnalysis.id)) {
        setAnalysisHistory([latestAnalysis, ...history]);
      } else {
        setAnalysisHistory(history);
      }
      if (fileParam) {
        router.replace("/analyse");
      }
    } else if (history.length > 0) {
      setAnalysisHistory(history);
      setAnalysisData(history[0]);
      setSelectedAnalysisId(history[0].id);
      if (fileParam) {
        router.replace("/analyse");
      }
    } else {
      const uploadRedirect = fileParam
        ? `/analyse/upload?uploadId=${encodeURIComponent(fileParam)}`
        : "/analyse/upload?from=latest";
      router.replace(uploadRedirect);
    }
  }, [
    authLoading,
    router,
    user?.id,
    fileParam,
    isAnalysisStateLoading,
    latestAnalysis,
    history,
    hasUploads,
  ]);

  useEffect(() => {
    const hasSkillScores = Object.keys(skillScores).length > 0;
    const hasFacultyHints =
      Array.isArray(analysisData?.recommended_faculties) &&
      analysisData.recommended_faculties.length > 0;
    const hasInterestHints = interests.length > 0;
    if (
      !analysisData ||
      (!hasSkillScores && !hasFacultyHints && !hasInterestHints)
    ) {
      setProgramRecommendations([]);
      setRecommendationError(null);
      return;
    }
    let isMounted = true;

    // Defer program recommendations to not block initial render
    const timeoutId = setTimeout(() => {
      const fetchRecs = async () => {
        try {
          setRecommendationsLoading(true);
          setRecommendationError(null);
          const response = await fetch("/api/db/program-recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              skill_scores: skillScores,
              recommended_faculties: analysisData.recommended_faculties ?? [],
              detected_interests: interests,
              overview: analysisData.overview ?? "",
              portfolio_text: analysisData.portfolio_text_excerpt ?? "",
              strict_portfolio_hint: true,
              limit: 8,
            }),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result?.error || "Failed");
          if (isMounted)
            setProgramRecommendations(
              Array.isArray(result?.data) ? result.data : [],
            );
        } catch (error) {
          console.error("Error:", error);
          if (isMounted) {
            setProgramRecommendations([]);
            setRecommendationError(t("recommendationFetchError"));
          }
        } finally {
          if (isMounted) setRecommendationsLoading(false);
        }
      };
      fetchRecs();
    }, 100); // Defer by 100ms to allow page to render first

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [analysisData?.id, skillScores, analysisData, interests, t]);

  const handleAnalysisChange = async (id: string) => {
    setSelectedAnalysisId(id);
    const s = analysisHistory.find((a) => a.id === id);
    if (s) setAnalysisData(s);
    if (!user?.id) return;
    try {
      const res = await fetch(`/api/db/analysis?user_id=${user.id}&id=${id}`);
      if (!res.ok) return;
      const full = await res.json();
      if (full && full.id) setAnalysisData(full);
    } catch (e) {
      console.error("Error loading analysis details:", e);
    }
  };
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(dateLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const handleAddToList = async (suggestion: string, index: number) => {
    if (!user?.id) return;
    if (processingRef.current[index] || addedToList[index]) return;

    processingRef.current[index] = true;
    setAddingToList((prev) => ({ ...prev, [index]: true }));

    try {
      const res = await fetch("/api/db/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          title: suggestion,
          description: "Added from Portfolio Analysis",
          priority: "medium",
          status: "pending",
        }),
      });

      if (!res.ok) throw new Error("Failed to add to list");

      setAddedToList((prev) => ({ ...prev, [index]: true }));
      toast.success(isTh ? "เพิ่มในรายการสำเร็จ" : "Added to your list");
    } catch (error) {
      console.error("Error adding to list:", error);
      toast.error(isTh ? "เกิดข้อผิดพลาด" : "Failed to add");
    } finally {
      processingRef.current[index] = false;
      setAddingToList((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleUpdateUniversity = async (
    analysisId: string,
    universityId: string,
  ) => {
    try {
      const university = universities.find((u) => u.id === universityId);
      if (!university) return;

      const res = await fetch(`/api/db/analysis/update-university`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis_id: analysisId,
          university_id: universityId,
          university_name_th: university.name_th,
          university_name_en: university.name_en,
          logo_url: university.logo_url,
        }),
      });

      if (!res.ok) throw new Error("Failed to update university");

      // Update local state
      setAnalysisHistory((prev) =>
        prev.map((a) =>
          a.id === analysisId
            ? {
                ...a,
                submission_university_name:
                  university.name_th || university.name_en,
                submission_logo_url: university.logo_url,
              }
            : a,
        ),
      );

      if (analysisData?.id === analysisId) {
        setAnalysisData((prev) =>
          prev
            ? {
                ...prev,
                submission_university_name:
                  university.name_th || university.name_en,
                submission_logo_url: university.logo_url,
              }
            : prev,
        );
      }

      setEditingUniversity(null);

      // Invalidate queries to refetch updated data
      await queryClient.invalidateQueries({
        queryKey: ["analysis", user?.id, "history"],
      });
      await queryClient.invalidateQueries({
        queryKey: ["analysis", user?.id, "latest"],
      });

      toast.success(
        isTh ? "อัปเดตมหาวิทยาลัยสำเร็จ" : "University updated successfully",
      );
    } catch (error) {
      console.error("Error updating university:", error);
      toast.error(isTh ? "เกิดข้อผิดพลาด" : "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    const r = await Swal.fire({
      title: t("deleteConfirmTitle"),
      text: t("deleteConfirmText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: tCommon("delete"),
      cancelButtonText: tCommon("cancel"),
    });
    if (!r.isConfirmed) return;
    try {
      const res = await fetch(`/api/db/analysis?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed");
      const upd = analysisHistory.filter((a) => a.id !== id);
      setAnalysisHistory(upd);
      if (selectedAnalysisId === id) {
        if (upd.length > 0) {
          setAnalysisData(upd[0]);
          setSelectedAnalysisId(upd[0].id);
        } else {
          setAnalysisData(null);
          setSelectedAnalysisId(null);
        }
      }
      Swal.fire({
        title: t("deleteSuccessTitle"),
        text: t("deleteSuccessText"),
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: t("deleteErrorTitle"),
        text: t("deleteErrorText"),
        icon: "error",
      });
    }
  };

  const isPageLoading =
    authLoading ||
    shouldRedirectToLogin ||
    isAnalysisStateLoading ||
    shouldRedirectToUpload;

  if (isPageLoading) return <AnalyseSkeleton />;
  const hasData = !!analysisData;

  if (!hasData) {
    return (
      <div className="flex min-h-screen max-w-7xl items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50/40 to-blue-50/30 px-4 py-16 pb-28">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="relative overflow-hidden rounded-3xl border-2 border-dashed border-pink-200/60 bg-gradient-to-br from-pink-400/8 to-transparent p-12 text-center shadow-2xl">
            <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-pink-200/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-purple-200/20 blur-3xl" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 180 }}
            >
              <div className="mx-auto mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-xl">
                <Rocket className="h-14 w-14 text-white" />
              </div>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-3 text-3xl font-extrabold text-gray-900"
            >
              {isTh ? "เริ่มต้นกันเลย!" : "Let's get started!"}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mx-auto mb-10 max-w-sm text-base leading-relaxed text-gray-600"
            >
              {isTh
                ? "อัปโหลดพอร์ตโฟลิโอแล้ว AI จะวิเคราะห์แบบโหดๆ ตรงไปตรงมา"
                : "Upload your portfolio and our AI will give you brutally honest feedback."}
            </motion.p>
            <Link href="/analyse/upload">
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{
                  scale: 1.04,
                  boxShadow: "0 20px 50px rgba(236,72,153,0.25)",
                }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 px-10 py-5 text-lg font-bold text-white shadow-xl"
              >
                <Upload className="h-6 w-6" />
                {isTh ? "อัปโหลดพอร์ตโฟลิโอ" : "Upload Your Portfolio"}
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const barData = {
    labels: Object.keys(skillScores),
    datasets: [
      {
        label: t("skillScoreLabel"),
        data: Object.values(skillScores),
        backgroundColor: "rgba(168,85,247,0.35)",
        borderColor: "rgba(168,85,247,1)",
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };
  const barOpts = {
    responsive: true,
    plugins: { legend: { display: false }, title: { display: false } },
    scales: { y: { beginAtZero: true, max: 100 } },
  };
  const sc =
    completeness.score >= 80
      ? "green"
      : completeness.score >= 50
        ? "amber"
        : "red";
  const sText =
    sc === "green"
      ? "text-green-700"
      : sc === "amber"
        ? "text-amber-700"
        : "text-red-700";
  const sBadge =
    sc === "green"
      ? "bg-green-100 text-green-700"
      : sc === "amber"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  const sStroke =
    sc === "green" ? "#22c55e" : sc === "amber" ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden px-3 py-6 pb-24 sm:px-4 sm:py-8 sm:pb-28">
      <div className="mx-auto w-full max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center sm:mb-10"
        >
          <h1 className="mb-3 flex flex-col items-center justify-center gap-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:flex-row sm:gap-3 sm:text-4xl">
            <div className="rounded-xl bg-pink-500 p-2 shadow-sm sm:p-2.5">
              <Brain className="h-7 w-7 text-white sm:h-8 sm:w-8" />
            </div>
            <span className="break-words">{t("pageTitle")}</span>
          </h1>
          <p className="mb-5 px-4 text-sm text-gray-600 sm:text-base">
            {isTh
              ? "AI วิเคราะห์ตรง ชี้จุดแข็ง และจุดที่ควรพัฒนา"
              : "AI that tells you what others won't - so you can actually improve"}
          </p>
          <Link href="/analyse/upload">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 rounded-xl bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-pink-700 hover:shadow-md sm:px-7 sm:py-3.5 sm:text-base"
            >
              <Upload className="h-4 w-4 sm:h-5 sm:w-5" />
              {t("uploadNew")}
            </motion.button>
          </Link>
        </motion.div>

        <div className="grid w-full gap-6 sm:gap-8 lg:grid-cols-[340px_1fr] xl:grid-cols-[360px_1fr]">
          {/* LEFT SIDEBAR */}
          <div className="w-full space-y-4 sm:space-y-6">
            <ScrollSection>
              <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
                <div className="mb-4 flex items-center gap-2 sm:mb-5 sm:gap-2.5">
                  <div className="rounded-lg bg-pink-100 p-1.5 sm:rounded-xl sm:p-2">
                    <Target className="h-4 w-4 text-pink-600 sm:h-5 sm:w-5" />
                  </div>
                  <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                    {isTh ? "คะแนนพอร์ตโฟลิโอ" : "Portfolio Score"}
                  </h2>
                </div>
                <div className="mb-6 flex justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 160 }}
                    className="relative"
                  >
                    <svg
                      className="w-32 h-32 sm:w-40 sm:h-40"
                      viewBox="0 0 160 160"
                    >
                      <circle
                        cx="80"
                        cy="80"
                        r="68"
                        fill="none"
                        stroke="#f3f4f6"
                        strokeWidth="12"
                      />
                      <motion.circle
                        cx="80"
                        cy="80"
                        r="68"
                        fill="none"
                        stroke={sStroke}
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 68}`}
                        initial={{ strokeDashoffset: 2 * Math.PI * 68 }}
                        animate={{
                          strokeDashoffset:
                            2 * Math.PI * 68 * (1 - completeness.score / 100),
                        }}
                        transition={{
                          duration: 1.2,
                          delay: 0.4,
                          ease: "easeOut",
                        }}
                        transform="rotate(-90 80 80)"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-4xl font-black ${sText}`}>
                        {completeness.score}
                      </span>
                      <span className="text-xs font-semibold text-gray-500">
                        / 100
                      </span>
                    </div>
                  </motion.div>
                </div>
                <div className="mb-5 text-center">
                  <span
                    className={`inline-block rounded-full px-4 py-1.5 text-sm font-bold ${sBadge}`}
                  >
                    {completeness.score >= 80
                      ? isTh
                        ? "ยอดเยี่ยม"
                        : "Excellent"
                      : completeness.score >= 50
                        ? isTh
                          ? "ปานกลาง"
                          : "Fair"
                        : isTh
                          ? "ต้องปรับปรุง"
                          : "Needs Work"}
                  </span>
                </div>
                <div className="w-full space-y-2.5 sm:space-y-3">
                  {bdMeta(isTh).map((item, i) => {
                    const val = completeness.breakdown[item.key];
                    const pct = Math.round((val / item.max) * 100);
                    const Icon = item.icon;
                    return (
                      <motion.div
                        key={item.key}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className="w-full"
                      >
                        <div className="mb-1 flex w-full items-center justify-between">
                          <div className="flex items-center gap-1 text-xs font-semibold text-gray-600 sm:gap-1.5">
                            <Icon className="h-3 w-3 shrink-0 sm:h-3.5 sm:w-3.5" />
                            <span className="truncate">{item.label}</span>
                          </div>
                          <span className="ml-2 shrink-0 text-xs font-bold text-gray-800">
                            {val}/{item.max}
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{
                              duration: 0.8,
                              delay: 0.5 + i * 0.08,
                            }}
                            className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                            style={{ maxWidth: "100%" }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                {completeness.criticalIssues.length > 0 && (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50/80 p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-red-800">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {isTh ? "ปัญหาที่ต้องแก้" : "Issues to Fix"}
                    </div>
                    <ul className="space-y-1">
                      {completeness.criticalIssues.map((issue, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 text-xs text-red-700"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-500" />
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {completeness.nextSteps.length > 0 && (
                  <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5">
                    <div className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-blue-800">
                      <ChevronRight className="h-3.5 w-3.5" />
                      {isTh ? "สิ่งที่ควรทำ" : "Next Steps"}
                    </div>
                    <ul className="space-y-1">
                      {completeness.nextSteps.map((step, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-1.5 text-xs text-blue-700"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-blue-500" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </ScrollSection>
            {analysisHistory.length > 0 && (
              <ScrollSection delay={0.1}>
                <div className="overflow-hidden rounded-3xl border border-gray-200/60 bg-white p-4 sm:p-5 shadow-xl">
                  <div className="mb-4 flex items-center gap-2.5">
                    <div className="rounded-xl bg-gray-100 p-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                    <h2 className="text-base font-bold text-gray-900">
                      {t("versionHistoryTitle")}
                    </h2>
                  </div>
                  <div className="max-h-[340px] space-y-2 overflow-y-auto overflow-x-hidden pr-1 w-full">
                    {analysisHistory.map((a, i) => {
                      const sel = a.id === selectedAnalysisId;
                      const st = a.status || "completed";
                      const stT =
                        st === "pending"
                          ? t("statusPending")
                          : st === "failed"
                            ? t("statusFailed")
                            : t("statusCompleted");
                      return (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`group flex items-center gap-2 rounded-xl border p-3 transition-all overflow-hidden ${sel ? "border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50 shadow-md" : "border-gray-100 bg-gray-50/50 hover:border-pink-200 hover:bg-pink-50/30"}`}
                        >
                          <button
                            type="button"
                            onClick={() => handleAnalysisChange(a.id)}
                            className="flex flex-1 items-center gap-3 text-left"
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-100 bg-pink-50">
                              {a.submission_logo_url ||
                              programRecommendations[0]?.logo_url ? (
                                <Image
                                  src={
                                    a.submission_logo_url ||
                                    programRecommendations[0]?.logo_url ||
                                    ""
                                  }
                                  alt={
                                    a.submission_university_name ||
                                    programRecommendations[0]
                                      ?.university_name_th ||
                                    "U"
                                  }
                                  width={36}
                                  height={36}
                                  className="object-contain"
                                />
                              ) : (
                                <Building2 className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              {editingUniversity === a.id ? (
                                <select
                                  value={
                                    programRecommendations[0]?.university_id ||
                                    ""
                                  }
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleUpdateUniversity(
                                        a.id,
                                        e.target.value,
                                      );
                                    }
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full rounded-lg border border-pink-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800 focus:border-pink-500 focus:outline-none focus:ring-2 focus:ring-pink-200"
                                >
                                  <option value="">
                                    {isTh
                                      ? "เลือกมหาวิทยาลัย..."
                                      : "Select university..."}
                                  </option>
                                  {universities.map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name_th || u.name_en}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <span className="truncate text-xs max-w-[100px] font-semibold text-gray-800">
                                      {a.submission_university_name ||
                                        programRecommendations[0]
                                          ?.university_name_th ||
                                        programRecommendations[0]
                                          ?.university_name_en ||
                                        t("unknownUniversity")}
                                    </span>
                                    <span
                                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${getStatusStyle(st)}`}
                                    >
                                      {stT}
                                    </span>
                                  </div>
                                  <p className="truncate text-[10px] text-gray-500">
                                    {formatDate(a.analyzed_at)}
                                  </p>
                                </>
                              )}
                            </div>
                          </button>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingUniversity(
                                  editingUniversity === a.id ? null : a.id,
                                );
                              }}
                              className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-pink-50 hover:text-pink-600 group-hover:opacity-100"
                              title={
                                isTh ? "แก้ไขมหาวิทยาลัย" : "Edit university"
                              }
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(a.id)}
                              className="rounded-lg p-1.5 text-gray-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                              title={t("deleteTooltip")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </ScrollSection>
            )}
          </div>

          {/* RIGHT CONTENT */}
          <div className="w-full space-y-4 sm:space-y-6">
            <ScrollSection>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 rounded-2xl border border-gray-200/60 bg-gradient-to-br from-pink-500/8 to-transparent px-4 sm:px-5 py-3 shadow-sm">
                <p className="text-sm text-gray-500">
                  {analysisData?.analyzed_at
                    ? t("analyzedAt", {
                        date: new Date(
                          analysisData.analyzed_at,
                        ).toLocaleDateString(dateLocale, {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }),
                      })
                    : t("analyzedAt", { date: "-" })}
                </p>
                {analysisData?.analysis_metadata?.confidence_score != null && (
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                    {isTh ? "ความมั่นใจ" : "Confidence"}:{" "}
                    {analysisData.analysis_metadata.confidence_score.toFixed(0)}
                    %
                  </span>
                )}
              </div>
            </ScrollSection>

            {analysisData?.overview && (
              <ScrollSection delay={0.05}>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:rounded-2xl sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-pink-100 p-2">
                      <Eye className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                        {isTh ? "ภาพรวมแรกเห็น" : "First Impressions"}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {isTh
                          ? "สิ่งที่ AI เห็นตั้งแต่แรกพบ"
                          : "What AI noticed right away"}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-gray-700 sm:text-base">
                    {analysisData.overview}
                  </p>
                </div>
              </ScrollSection>
            )}

            {interests.length > 0 && (
              <ScrollSection delay={0.1}>
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-pink-100 p-2">
                      <Palette className="h-5 w-5 text-pink-600" />
                    </div>
                    <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                      {isTh ? "ความสนใจที่ตรวจพบ" : "Detected Interests"}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((int, i) => (
                      <motion.span
                        key={`${int}-${i}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.04 }}
                        whileHover={{ scale: 1.05 }}
                        className="cursor-default rounded-full bg-pink-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-pink-600 hover:shadow-md"
                      >
                        {int}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </ScrollSection>
            )}

            {(strengths.length > 0 || weaknesses.length > 0) && (
              <ScrollSection delay={0.12}>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {strengths.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
                      <div className="mb-4 flex items-center gap-2.5">
                        <div className="rounded-xl bg-green-100 p-2">
                          <TrendingUp className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                            {isTh ? "จุดแข็ง" : "What's Working"}
                          </h2>
                          <p className="text-xs text-gray-500">
                            {isTh
                              ? "สิ่งที่ AI เห็นว่าดีจริงๆ"
                              : "Real strengths we spotted"}
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {strengths.map((s, i) => (
                          <motion.li
                            key={`str-${i}`}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.06 }}
                            className="group flex items-start gap-2.5 rounded-lg border border-green-100 bg-green-50 p-3 transition-all hover:border-green-200 hover:bg-green-100"
                          >
                            <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                            <span className="text-sm leading-relaxed text-gray-800">
                              {s}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {weaknesses.length > 0 && (
                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5">
                      <div className="mb-4 flex items-center gap-2.5">
                        <div className="rounded-xl bg-orange-100 p-2">
                          <AlertTriangle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h2 className="text-base font-bold text-gray-900 sm:text-lg">
                            {isTh ? "จุดอ่อน" : "Brutal Truth"}
                          </h2>
                          <p className="text-xs text-gray-500">
                            {isTh
                              ? "ไม่มีอ้อมค้อม ตรงไปตรงมา"
                              : "No sugarcoating"}
                          </p>
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {weaknesses.map((w, i) => (
                          <motion.li
                            key={`wk-${i}`}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.15 + i * 0.06 }}
                            className="group flex items-start gap-2.5 rounded-lg border border-orange-100 bg-orange-50 p-3 transition-all hover:border-orange-200 hover:bg-orange-100"
                          >
                            <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                            <span className="text-sm leading-relaxed text-gray-800">
                              {w}
                            </span>
                          </motion.li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollSection>
            )}

            {Object.keys(skillScores).length > 0 && (
              <ScrollSection delay={0.15}>
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2 max-w-full">
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 max-w-full">
                    <Suspense fallback={<Shimmer className="h-64" />}>
                      <SkillsRadarChart
                        skills={skillScores}
                        title={t("skillsRadarTitle")}
                      />
                    </Suspense>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 max-w-full">
                    <div className="mb-3 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-pink-600" />
                      <h2 className="text-base font-bold text-gray-900">
                        {t("skillsBarTitle")}
                      </h2>
                    </div>
                    <div className="w-full max-w-full overflow-hidden">
                      <Bar data={barData} options={barOpts} />
                    </div>
                  </div>
                </div>
              </ScrollSection>
            )}

            <ScrollSection delay={0.18}>
              <div className="w-full max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:rounded-2xl sm:p-5 lg:p-6">
                <div className="mb-5 flex items-center gap-3">
                  <div className="rounded-xl bg-pink-100 p-2">
                    <GraduationCap className="h-5 w-5 text-pink-600" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                      {isTh ? "สาขาที่เหมาะกับคุณ" : "Programs That Fit You"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {isTh
                        ? "จากทักษะและความสนใจของคุณ"
                        : "Based on your skills & interests"}
                    </p>
                  </div>
                </div>
                {recommendationsLoading ? (
                  <RecommendationSkeleton />
                ) : recommendationError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {recommendationError}
                  </div>
                ) : programRecommendations.length > 0 ? (
                  <>
                    <div className="w-full max-w-full space-y-3 overflow-hidden">
                      {visiblePrograms.map((p, idx) => (
                        <ProgramRecommendationCard
                          key={p.id}
                          program={p}
                          index={idx}
                          isTh={isTh}
                          requiredSkillsLabel={t("requiredSkillsLabel")}
                          unknownUniversity={t("unknownUniversity")}
                        />
                      ))}
                    </div>
                    {programRecommendations.length > 3 && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setShowAllPrograms(!showAllPrograms)}
                        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-pink-600 transition-all hover:border-pink-300 hover:bg-pink-50"
                      >
                        {showAllPrograms ? (
                          <>
                            <ChevronDown className="h-4 w-4 rotate-180" />
                            {isTh ? "แสดงน้อยลง" : "Show less"}
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            {isTh
                              ? `แสดงเพิ่มเติม (${programRecommendations.length - 3})`
                              : `Show more (${programRecommendations.length - 3})`}
                          </>
                        )}
                      </motion.button>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-500/8 to-transparent p-4 text-sm text-indigo-700">
                    {t("noProgramRecommendations")}
                  </div>
                )}
              </div>
            </ScrollSection>

            {suggestions.length > 0 && (
              <ScrollSection delay={0.2}>
                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="rounded-xl bg-pink-100 p-2">
                      <Lightbulb className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                        {isTh ? "สิ่งที่ควรทำ" : "Action Steps"}
                      </h2>
                      <p className="text-xs text-gray-500">
                        {isTh
                          ? "คำแนะนำเฉพาะเจาะจงจาก AI"
                          : "Specific AI recommendations"}
                      </p>
                    </div>
                  </div>
                  <ul className="space-y-2.5">
                    {suggestions.map((sg, i) => (
                      <motion.li
                        key={`sug-${i}`}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 + i * 0.06 }}
                        className="group flex items-start justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 transition-all hover:border-pink-200 hover:bg-pink-50/50"
                      >
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-pink-500" />
                          <span className="text-sm font-medium leading-relaxed text-gray-800">
                            {sg}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAddToList(sg, i)}
                          disabled={addingToList[i] || addedToList[i]}
                          className="shrink-0 flex items-center gap-1.5 rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {addingToList[i] ? (
                            <>
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              {isTh ? "กำลังเพิ่ม..." : "Adding..."}
                            </>
                          ) : addedToList[i] ? (
                            <>
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              {isTh ? "เพิ่มแล้ว" : "Added"}
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              {isTh ? "เพิ่มในรายการ" : "Add to list"}
                            </>
                          )}
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </ScrollSection>
            )}

            {analysisData?.analysis_metadata && (
              <ScrollSection delay={0.22}>
                <div className="overflow-hidden rounded-2xl border border-gray-200/60 bg-gradient-to-br from-pink-500/5 to-transparent p-4 sm:p-5 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    <h2 className="text-sm font-bold text-gray-700">
                      {t("analysisInfoTitle")}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm text-gray-600 sm:grid-cols-2 md:grid-cols-3">
                    {analysisData.analysis_metadata.text_length != null && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {t("textLengthLabel")}:
                        </span>
                        <br />
                        {analysisData.analysis_metadata.text_length.toLocaleString(
                          dateLocale,
                        )}{" "}
                        {t("charactersUnit")}
                      </div>
                    )}
                    {analysisData.analysis_metadata.confidence_score !=
                      null && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {t("confidenceLabel")}:
                        </span>
                        <br />
                        {analysisData.analysis_metadata.confidence_score.toFixed(
                          1,
                        )}
                        %
                      </div>
                    )}
                    {analysisData.analysis_metadata.processing_time != null && (
                      <div>
                        <span className="font-medium text-gray-700">
                          {t("processingTimeLabel")}:
                        </span>
                        <br />
                        {analysisData.analysis_metadata.processing_time}ms
                      </div>
                    )}
                  </div>
                </div>
              </ScrollSection>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysePage;
