"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";
import {
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  Brain,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  BarChart3,
  Check,
} from "lucide-react";

interface SectionStat {
  sectionId: number;
  title: string;
  correct: number;
  total: number;
  percentage: number;
}

interface QuestionResult {
  id: number;
  question_text: string;
  choices: string[];
  correct_answer: string;
  explanation: string | null;
  userAnswer: string | null;
  isCorrect: boolean;
  passage_id: number | null;
}

interface PassageData {
  id: number;
  title: string | null;
  content: string;
}

interface SectionData {
  id: number;
  title: string;
  passages: PassageData[];
  questions: QuestionResult[];
}

interface AttemptData {
  id: number;
  status: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  timeSpentSec: number;
  aiAnalysis: string | null;
  startedAt: string;
  completedAt: string | null;
}

interface ExamResultData {
  id: number;
  title: string;
  totalScore: number;
  passScore: number;
  sections: SectionData[];
}

export default function ExamResultPage({
  params,
}: {
  params: Promise<{ examId: string; attemptId: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const t = useTranslations("mockExam");

  const [attempt, setAttempt] = useState<AttemptData | null>(null);
  const [exam, setExam] = useState<ExamResultData | null>(null);
  const [sectionStats, setSectionStats] = useState<SectionStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [expandedSections, setExpandedSections] = useState<
    Record<number, boolean>
  >({});
  const [resolvedParams, setResolvedParams] = useState<{
    examId: string;
    attemptId: string;
  } | null>(null);

  useEffect(() => {
    params.then((p) => setResolvedParams(p));
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!resolvedParams || authLoading || !user) return;

    const fetchResult = async () => {
      try {
        const res = await fetch(
          `/api/mock-exam/attempts/${resolvedParams.attemptId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch result");
        const data = await res.json();
        setAttempt(data.attempt);
        setExam(data.exam);
        setSectionStats(data.sectionStats);
        if (data.attempt.aiAnalysis) {
          setAiAnalysis(data.attempt.aiAnalysis);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [resolvedParams, user, authLoading]);

  const handleRequestAnalysis = useCallback(async () => {
    if (!resolvedParams) return;
    setAiLoading(true);
    try {
      const res = await fetch(
        `/api/mock-exam/attempts/${resolvedParams.attemptId}/analyze`,
        { method: "POST" },
      );
      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      setAiAnalysis(data.analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }, [resolvedParams]);

  const toggleSection = (sectionId: number) => {
    setExpandedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} นาที ${s} วินาที`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-pink-500 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t("loadingResult")}</p>
        </div>
      </div>
    );
  }

  if (!attempt || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">{t("resultNotFound")}</p>
      </div>
    );
  }

  const percentage =
    attempt.totalQuestions > 0
      ? Math.round((attempt.correctCount / attempt.totalQuestions) * 100)
      : 0;
  const passed = attempt.score >= exam.passScore;

  return (
    <div className=" items-center justify-center gap-6 px-4 pt-12 pb-24 md:max-w-screen-xl mx-auto">
      {/* Header */}
      <div
        className={`${passed ? "bg-emerald-500" : "bg-red-500"} text-white max-w-4xl mx-auto rounded-lg`}
      >
        <div className=" px-4 py-8">
          <button
            onClick={() => router.push("/mock-exam")}
            className="flex items-center gap-1 text-white/80 hover:text-white text-sm mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("backToExams")}
          </button>

          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-2xl ${passed ? "bg-emerald-400" : "bg-red-400"} flex items-center justify-center`}
            >
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{exam.title}</h1>
              <p className="text-white/80 text-sm mt-0.5">
                {passed ? t("passed") : t("notPassed")} (
                {t("passCriteria", { score: exam.passScore })})
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4">
        {/* Score Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{percentage}%</p>
            <p className="text-xs text-gray-500 mt-1">{t("overallScore")}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-emerald-600">
              {attempt.correctCount}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t("correctAnswers", { total: attempt.totalQuestions })}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-3xl font-bold text-gray-900">{attempt.score}</p>
            <p className="text-xs text-gray-500 mt-1">
              {t("scoreOf", { total: exam.totalScore })}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <p className="text-lg font-bold text-gray-900">
                {Math.round(attempt.timeSpentSec / 60)}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-1">{t("timeMinutes")}</p>
          </div>
        </div>

        {/* Section Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-pink-500" />
            <h2 className="text-lg font-bold text-gray-900">
              {t("sectionScores")}
            </h2>
          </div>
          <div className="space-y-3">
            {sectionStats.map((stat) => (
              <div key={stat.sectionId}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700">{stat.title}</span>
                  <span className="text-sm font-bold text-gray-900">
                    {stat.correct}/{stat.total} ({stat.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      stat.percentage >= 70
                        ? "bg-emerald-500"
                        : stat.percentage >= 50
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${stat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Analysis */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-bold text-gray-900">
                {t("aiAnalysis")}
              </h2>
            </div>
            {!aiAnalysis && !aiLoading && (
              <button
                onClick={handleRequestAnalysis}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Brain className="w-4 h-4" />
                {t("analyzeResult")}
              </button>
            )}
          </div>

          {aiLoading && (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 text-purple-500 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-500">{t("analyzingResult")}</p>
              <p className="text-xs text-gray-400 mt-1">{t("analyzingWait")}</p>
            </div>
          )}

          {aiAnalysis && (
            <div className="prose prose-sm max-w-none text-gray-700">
              <div
                dangerouslySetInnerHTML={{
                  __html: aiAnalysis
                    .replace(/\n/g, "<br/>")
                    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                    .replace(
                      /### (.*?)(<br\/>|$)/g,
                      "<h3 class='text-base font-bold text-gray-900 mt-4 mb-2'>$1</h3>",
                    )
                    .replace(
                      /## (.*?)(<br\/>|$)/g,
                      "<h2 class='text-lg font-bold text-gray-900 mt-4 mb-2'>$1</h2>",
                    )
                    .replace(
                      /# (.*?)(<br\/>|$)/g,
                      "<h1 class='text-xl font-bold text-gray-900 mt-4 mb-2'>$1</h1>",
                    )
                    .replace(/- (.*?)(<br\/>|$)/g, "<li class='ml-4'>$1</li>")
                    .replace(
                      /(\d+)\. (.*?)(<br\/>|$)/g,
                      "<li class='ml-4'><strong>$1.</strong> $2</li>",
                    ),
                }}
              />
            </div>
          )}

          {!aiAnalysis && !aiLoading && (
            <p className="text-sm text-gray-400 text-center py-4">
              {t("aiHint")}
            </p>
          )}
        </div>

        {/* Detailed Answers per Section */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">{t("answerKey")}</h2>
          {exam.sections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between p-5"
              >
                <h3 className="text-sm font-bold text-gray-900">
                  {section.title}
                </h3>
                {expandedSections[section.id] ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>

              {expandedSections[section.id] && (
                <div className="border-t border-gray-100 px-5 pb-5 space-y-4">
                  {section.questions.map((q, idx) => {
                    const passage = section.passages.find(
                      (p) => p.id === q.passage_id,
                    );

                    return (
                      <div
                        key={q.id}
                        className={`rounded-lg p-4 border ${
                          q.isCorrect
                            ? "border-emerald-200 bg-emerald-50/50"
                            : "border-red-200 bg-red-50/50"
                        }`}
                      >
                        <div className="flex items-start gap-2 mb-3">
                          {q.isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                          )}
                          <p className="text-sm text-gray-900 font-medium">
                            {q.question_text}
                          </p>
                        </div>

                        <div className="ml-7 space-y-1.5">
                          {(q.choices as string[]).map((choice, cIdx) => {
                            const letter = choice.substring(0, 1);
                            const isCorrectChoice = letter === q.correct_answer;
                            const isUserChoice = letter === q.userAnswer;

                            return (
                              <div
                                key={cIdx}
                                className={`text-xs px-3 py-2 rounded-lg ${
                                  isCorrectChoice
                                    ? "bg-emerald-100 text-emerald-800 font-medium"
                                    : isUserChoice && !q.isCorrect
                                      ? "bg-red-100 text-red-800 line-through"
                                      : "text-gray-600"
                                }`}
                              >
                                {choice}
                                {isCorrectChoice && (
                                  <Check className="inline-block w-3.5 h-3.5 ml-1 align-text-bottom" />
                                )}
                                {isUserChoice &&
                                  !q.isCorrect &&
                                  ` (${t("yourAnswer")})`}
                              </div>
                            );
                          })}
                        </div>

                        {!q.userAnswer && (
                          <p className="ml-7 mt-2 text-xs text-gray-400 italic">
                            {t("notAnswered")}
                          </p>
                        )}

                        {q.explanation && (
                          <div className="ml-7 mt-3 px-3 py-2 bg-blue-50 rounded-lg">
                            <p className="text-xs text-blue-800">
                              <span className="font-semibold">
                                {t("explanation")}
                              </span>{" "}
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
