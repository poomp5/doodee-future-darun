"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  AlertTriangle,
  RefreshCw,
  Send,
  BookOpen,
  Menu,
  X,
  Grid3x3,
  Home,
} from "lucide-react";
import Link from "next/link";

interface Passage {
  id: number;
  title: string | null;
  content: string;
  passage_type: string;
  passage_order: number;
}

interface Question {
  id: number;
  section_id: number;
  passage_id: number | null;
  question_text: string;
  question_type: string;
  choices: string[];
  question_order: number;
  score: number;
}

interface Section {
  id: number;
  title: string;
  description: string | null;
  section_order: number;
  score_weight: number;
  passages: Passage[];
  questions: Question[];
}

interface ExamData {
  id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  total_score: number;
  sections: Section[];
}

export default function TakeExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("mockExam");

  const attemptId = searchParams.get("attemptId");
  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resolvedExamId, setResolvedExamId] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);

  const startTimeRef = useRef(Date.now());

  // Resolve params
  useEffect(() => {
    params.then((p) => setResolvedExamId(p.examId));
  }, [params]);

  // Auth check
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  // Fetch exam data
  useEffect(() => {
    if (!resolvedExamId || authLoading || !user) return;

    const fetchExam = async () => {
      try {
        const res = await fetch(`/api/mock-exam/exams/${resolvedExamId}`);
        if (!res.ok) throw new Error("Failed to fetch exam");
        const data = await res.json();
        setExam(data.data);
        setTimeLeft(data.data.duration_minutes * 60);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchExam();
  }, [resolvedExamId, user, authLoading]);

  // Timer countdown
  useEffect(() => {
    if (!exam || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, timeLeft]);

  // Flatten all questions across sections
  const allQuestions: (Question & {
    sectionTitle: string;
    passage?: Passage;
  })[] =
    exam?.sections.flatMap((section) =>
      section.questions.map((q) => ({
        ...q,
        sectionTitle: section.title,
        passage:
          section.passages.find((p) => p.id === q.passage_id) || undefined,
      })),
    ) || [];

  const currentQuestion = allQuestions[currentQuestionIdx];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = allQuestions.length;

  const handleAnswer = useCallback((questionId: number, choice: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choice }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!attemptId) return;
    setSubmitting(true);
    const timeSpentSec = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await fetch("/api/mock-exam/attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit",
          attemptId: parseInt(attemptId, 10),
          answers,
          timeSpentSec,
        }),
      });

      if (!res.ok) throw new Error("Failed to submit");
      const data = await res.json();
      router.push(`/mock-exam/${resolvedExamId}/result/${data.attemptId}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  }, [attemptId, answers, resolvedExamId, router]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const goToQuestion = (idx: number) => {
    setCurrentQuestionIdx(idx);
    setShowSidebar(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 md:w-10 md:h-10 animate-spin text-pink-500 mx-auto mb-3" />
          <p className="text-gray-600 text-sm md:text-base">{t("loading")}</p>
        </div>
      </div>
    );
  }

  if (!exam || !currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 md:w-12 md:h-12 text-orange-500 mx-auto mb-3" />
          <p className="text-gray-600 text-sm md:text-base">
            {t("examNotFound")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 pt-4 pb-24 flex flex-col gap-4">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400">
        <Link href="/" className="flex items-center hover:text-gray-600 transition-colors">
          <Home className="w-3.5 h-3.5" />
        </Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <Link href="/mock-exam" className="hover:text-gray-600 transition-colors">
          {t("title")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-gray-700 font-medium truncate">{exam.title}</span>
      </nav>

      {/* Top Bar */}
      <div className="bg-white border border-gray-200 shadow-sm w-full rounded-xl">
        <div className="px-3 sm:px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2 md:gap-4">
            {/* Left: Title & Progress */}
            <div className="flex-1 min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate">
                {exam.title}
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600 mt-0.5">
                <span className="whitespace-nowrap">
                  {t("questionOf", {
                    current: currentQuestionIdx + 1,
                    total: totalQuestions,
                  })}
                </span>
                <span className="hidden sm:inline">|</span>
                <span className="whitespace-nowrap">
                  {t("answered", {
                    count: answeredCount,
                    total: totalQuestions,
                  })}
                </span>
              </div>
            </div>

            {/* Right: Timer & Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Timer */}
              <div
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm md:text-base ${
                  timeLeft < 300
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="tabular-nums">{formatTime(timeLeft)}</span>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setShowSidebar(true)}
                className="lg:hidden p-2 sm:p-2.5 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Open question navigator"
              >
                <Grid3x3 className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-73px)] w-full">
        {/* Question Area - Scrollable */}
        <div className="flex-1 overflow">
          <div className="w-full py-4 sm:py-6">
            {/* Section Label */}
            <div className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 bg-purple-100 text-purple-700 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium mb-4 sm:mb-6">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>{currentQuestion.sectionTitle}</span>
            </div>

            {/* Passage (if any) */}
            {currentQuestion.passage && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6">
                {currentQuestion.passage.title && (
                  <div className="flex items-start gap-2 mb-3 sm:mb-4">
                    <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <h3 className="font-bold text-sm sm:text-base md:text-lg text-blue-900">
                      {currentQuestion.passage.title}
                    </h3>
                  </div>
                )}
                <div className="text-xs sm:text-sm md:text-base text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.passage.content}
                </div>
              </div>
            )}

            {/* Question */}
            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-6 shadow-sm">
              <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-pink-500 text-white flex items-center justify-center text-xs sm:text-sm md:text-base font-bold">
                  {currentQuestionIdx + 1}
                </div>
                <p className="flex-1 text-sm sm:text-base md:text-lg text-gray-900 font-medium leading-relaxed pt-0.5">
                  {currentQuestion.question_text}
                </p>
              </div>

              {/* Choices */}
              <div className="space-y-2 sm:space-y-3">
                {(currentQuestion.choices as string[]).map((choice, idx) => {
                  const letter = choice.substring(0, 1);
                  const isSelected = answers[currentQuestion.id] === letter;
                  return (
                    <button
                      key={idx}
                      onDoubleClick={() => {
                        handleAnswer(currentQuestion.id, letter);
                        setCurrentQuestionIdx((prev) =>
                          Math.min(allQuestions.length - 1, prev + 1),
                        );
                      }}
                      onClick={() => handleAnswer(currentQuestion.id, letter)}
                      className={`w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 rounded-lg sm:rounded-xl border-2 transition-all text-xs sm:text-sm md:text-base ${
                        isSelected
                          ? "border-pink-500 bg-pink-50 text-pink-900 font-medium shadow-sm"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
                      }`}
                    >
                      {choice}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Navigation - Bottom for mobile, inline for desktop */}
            <div className="flex items-center justify-between gap-2 sm:gap-3 pb-4 sm:pb-0">
              <button
                onClick={() =>
                  setCurrentQuestionIdx((prev) => Math.max(0, prev - 1))
                }
                disabled={currentQuestionIdx === 0}
                className="flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{t("prevQuestion")}</span>
                <span className="sm:hidden">Prev</span>
              </button>

              {currentQuestionIdx < totalQuestions - 1 ? (
                <button
                  onClick={() =>
                    setCurrentQuestionIdx((prev) =>
                      Math.min(totalQuestions - 1, prev + 1),
                    )
                  }
                  className="flex items-center gap-1 sm:gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-colors"
                >
                  <span className="hidden sm:inline">{t("nextQuestion")}</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              ) : (
                <button
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-1 sm:gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{t("submitExam")}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Overlay */}
        {showSidebar && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Question Navigator Sidebar */}
        {/* Mobile: fixed slide-in drawer from right */}
        {/* Desktop: floating card with gap from question area */}
        <div
          className={`
            fixed right-0 top-14 bottom-16
            lg:sticky lg:top-[73px] lg:bottom-auto lg:h-[calc(100vh-73px)]
            z-50 lg:z-auto
            w-80 sm:w-96 lg:w-72 xl:w-80
            bg-white lg:bg-transparent
            border-l border-gray-200 lg:border-l-0
            transform transition-transform duration-300 ease-in-out
            lg:transform-none lg:shrink-0
            ${showSidebar ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
            flex flex-col
          `}
        >
          {/* Desktop: card wrapper with margin */}
          <div className="flex flex-col h-full lg:p-4">
            <div className="flex flex-col h-full overflow-hidden lg:bg-white lg:rounded-2xl lg:border lg:border-gray-200 lg:shadow-sm">
              {/* Sidebar Header - mobile only shows close button */}
              <div className="px-4 sm:px-5 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <h3 className="font-bold text-sm sm:text-base text-gray-900">
                  {t("questionStatus")}
                </h3>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Question Grid - scrollable */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5">
                <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2 sm:gap-2.5">
                  {allQuestions.map((q, idx) => {
                    const isAnswered = answers[q.id] !== undefined;
                    const isCurrent = idx === currentQuestionIdx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => goToQuestion(idx)}
                        className={`aspect-square rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium flex items-center justify-center transition-all ${
                          isCurrent
                            ? "bg-pink-500 text-white ring-2 ring-pink-300 shadow-md scale-105"
                            : isAnswered
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Footer */}
              <div className="px-4 sm:px-5 py-4 border-t border-gray-200 space-y-3 flex-shrink-0">
                {/* Legend */}
                <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-gray-600">
                      {t("answeredLabel", { count: answeredCount })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Circle className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">
                      {t("unansweredLabel", {
                        count: totalQuestions - answeredCount,
                      })}
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={() => {
                    setShowSidebar(false);
                    setShowConfirm(true);
                  }}
                  disabled={submitting}
                  className="w-full py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white text-sm sm:text-base font-semibold rounded-lg sm:rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>{t("submitExam")}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-5 sm:p-6 md:p-8 mx-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">
              {t("confirmSubmitTitle")}
            </h2>

            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5">
              {t("answeredCount", {
                count: answeredCount,
                total: totalQuestions,
              })}
            </p>

            {answeredCount < totalQuestions && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-5 flex gap-2 sm:gap-3">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-orange-800">
                  {t("unansweredWarning", {
                    count: totalQuestions - answeredCount,
                  })}
                </p>
              </div>
            )}

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 sm:py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm sm:text-base transition-colors"
              >
                {t("goBack")}
              </button>
              <button
                onClick={() => {
                  setShowConfirm(false);
                  handleSubmit();
                }}
                disabled={submitting}
                className="flex-1 py-2.5 sm:py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 text-white font-semibold rounded-xl text-sm sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-colors"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
                <span>{submitting ? t("submitting") : t("confirmSubmit")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
