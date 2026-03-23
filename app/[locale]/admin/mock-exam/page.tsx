"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Trophy,
  BookOpen,
  RefreshCw,
  Save,
  X,
  Users,
  Eye,
  EyeOff,
  AlignLeft,
  Link2,
  FileEdit,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────
interface Question {
  id: number;
  section_id: number;
  passage_id: number | null;
  question_text: string;
  question_type: string;
  choices: string[];
  correct_answer: string;
  explanation: string | null;
  question_order: number;
  score: number;
}

interface Passage {
  id: number;
  section_id: number;
  title: string | null;
  content: string;
  passage_type: string;
  passage_order: number;
}

interface Section {
  id: number;
  exam_id: number;
  title: string;
  description: string | null;
  section_order: number;
  score_weight: number;
  passages: Passage[];
  questions: Question[];
}

interface Exam {
  id: number;
  title: string;
  description: string | null;
  detail_content: string | null;
  subject_code: string;
  exam_type: string;
  duration_minutes: number;
  total_score: number;
  pass_score: number;
  is_active: boolean;
  display_order: number;
  sections: Section[];
  _count: { attempts: number };
}

// ─── Main Page ──────────────────────────────────────
export default function AdminMockExamPage() {
  const t = useTranslations("mockExam.admin");
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedExams, setExpandedExams] = useState<Record<number, boolean>>(
    {},
  );
  const [expandedSections, setExpandedSections] = useState<
    Record<number, boolean>
  >({});
  const [showPassages, setShowPassages] = useState<Record<number, boolean>>({});

  // Modals
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [editingSection, setEditingSection] = useState<{
    section: Section | null;
    examId: number;
  } | null>(null);
  const [editingPassage, setEditingPassage] = useState<{
    passage: Passage | null;
    sectionId: number;
  } | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<{
    question: Question | null;
    sectionId: number;
    passages: Passage[];
  } | null>(null);


  const fetchExams = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/mock-exam");
      const data = await res.json();
      if (res.ok) setExams(data.data || []);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  // ─── API helpers ──────────────────────────────────
  const apiCall = async (url: string, method: string, body?: unknown) => {
    const res = await fetch(url, {
      method,
      ...(body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
    });
    return res.ok;
  };

  // Exam CRUD
  const handleSaveExam = async (data: Record<string, unknown>) => {
    const isNew = !data.id;
    const ok = await apiCall(
      "/api/admin/mock-exam",
      isNew ? "POST" : "PUT",
      data,
    );
    if (ok) {
      setShowCreateExam(false);
      setEditingExam(null);
      fetchExams();
    }
  };
  const handleDeleteExam = async (id: number) => {
    if (!confirm(t("deleteExamConfirm"))) return;
    if (await apiCall(`/api/admin/mock-exam?id=${id}`, "DELETE")) fetchExams();
  };
  const handleToggleActive = async (exam: Exam) => {
    await apiCall("/api/admin/mock-exam", "PUT", {
      id: exam.id,
      is_active: !exam.is_active,
    });
    fetchExams();
  };

  // Section CRUD
  const handleSaveSection = async (data: Record<string, unknown>) => {
    if (await apiCall("/api/admin/mock-exam/sections", "POST", data)) {
      setEditingSection(null);
      fetchExams();
    }
  };
  const handleDeleteSection = async (id: number) => {
    if (!confirm(t("deleteSectionConfirm"))) return;
    if (await apiCall(`/api/admin/mock-exam/sections?id=${id}`, "DELETE"))
      fetchExams();
  };

  // Passage CRUD
  const handleSavePassage = async (data: Record<string, unknown>) => {
    if (await apiCall("/api/admin/mock-exam/passages", "POST", data)) {
      setEditingPassage(null);
      fetchExams();
    }
  };
  const handleDeletePassage = async (id: number) => {
    if (!confirm(t("deletePassageConfirm"))) return;
    if (await apiCall(`/api/admin/mock-exam/passages?id=${id}`, "DELETE"))
      fetchExams();
  };

  // Question CRUD
  const handleSaveQuestion = async (data: Record<string, unknown>) => {
    if (await apiCall("/api/admin/mock-exam/questions", "POST", data)) {
      setEditingQuestion(null);
      fetchExams();
    }
  };
  const handleDeleteQuestion = async (id: number) => {
    if (!confirm(t("deleteQuestionConfirm"))) return;
    if (await apiCall(`/api/admin/mock-exam/questions?id=${id}`, "DELETE"))
      fetchExams();
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-6 h-6 text-pink-500 animate-spin" />
      </div>
    );
  }

  const totalQuestions = exams.reduce(
    (sum, e) =>
      sum + e.sections.reduce((s, sec) => s + sec.questions.length, 0),
    0,
  );
  const totalPassages = exams.reduce(
    (sum, e) => sum + e.sections.reduce((s, sec) => s + sec.passages.length, 0),
    0,
  );
  const totalAttempts = exams.reduce((sum, e) => sum + e._count.attempts, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t("title")}</h1>
          <p className="text-gray-500 text-sm">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => setShowCreateExam(true)}
          className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("createExam")}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          {
            label: t("exams"),
            value: exams.length,
            icon: BookOpen,
            bg: "bg-blue-100",
            fg: "text-blue-600",
          },
          {
            label: t("passages"),
            value: totalPassages,
            icon: AlignLeft,
            bg: "bg-amber-100",
            fg: "text-amber-600",
          },
          {
            label: t("questionsLabel"),
            value: totalQuestions,
            icon: FileText,
            bg: "bg-purple-100",
            fg: "text-purple-600",
          },
          {
            label: t("totalAttempts"),
            value: totalAttempts,
            icon: Users,
            bg: "bg-emerald-100",
            fg: "text-emerald-600",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 ${s.bg} rounded-lg`}>
                <s.icon className={`w-5 h-5 ${s.fg}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Exam List */}
      <div className="space-y-4">
        {exams.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t("noExams")}</p>
          </div>
        ) : (
          exams.map((exam) => {
            const totalQ = exam.sections.reduce(
              (s, sec) => s + sec.questions.length,
              0,
            );
            const totalP = exam.sections.reduce(
              (s, sec) => s + sec.passages.length,
              0,
            );
            const isExpanded = expandedExams[exam.id];

            return (
              <div
                key={exam.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
              >
                {/* ── Exam Header ── */}
                <div className="p-5 flex items-center justify-between">
                  <button
                    onClick={() =>
                      setExpandedExams((prev) => ({
                        ...prev,
                        [exam.id]: !prev[exam.id],
                      }))
                    }
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white px-2 py-0.5 rounded bg-blue-500">
                        {exam.exam_type}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {exam.subject_code}
                      </span>
                      {exam.is_active ? (
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                          {t("active")}
                        </span>
                      ) : (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                          {t("inactive")}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mt-1">
                      {exam.title}
                    </h3>
                    {exam.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {exam.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" /> {totalQ} Q
                      </span>
                      <span className="flex items-center gap-1">
                        <AlignLeft className="w-3.5 h-3.5" /> {totalP}{" "}
                        {t("articles")}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />{" "}
                        {exam.duration_minutes} min
                      </span>
                      <span className="flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" /> {exam.total_score}{" "}
                        pts
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {exam._count.attempts}
                      </span>
                      <span>
                        {exam.sections.length} {t("sections")}
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center gap-1 ml-4">
                    <button
                      onClick={() => handleToggleActive(exam)}
                      className="p-2 text-gray-400 hover:text-blue-500"
                      title={exam.is_active ? t("inactive") : t("active")}
                    >
                      {exam.is_active ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>

                    <button
                      onClick={() => setEditingExam(exam)}
                      className="p-2 text-gray-400 hover:text-blue-500"
                      title={t("editExam")}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteExam(exam.id)}
                      className="p-2 text-gray-400 hover:text-red-500"
                      title={t("deleteExamConfirm")}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {isExpanded ? (
                      <ChevronUp
                        onClick={() =>
                          setExpandedExams((prev) => ({
                            ...prev,
                            [exam.id]: !prev[exam.id],
                          }))
                        }
                        className="w-5 h-5 text-gray-400 hover:cursor-pointer"
                      />
                    ) : (
                      <ChevronDown
                        onClick={() => setExpandedExams((prev) => ({
                          ...prev,
                          [exam.id]: !prev[exam.id],
                        }))}
                        className="w-5 h-5 text-gray-400 hover:cursor-pointer"
                      />
                    )}
                  </div>
                </div>

                {/* ── Expanded: Sections ── */}
                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {exam.sections.map((section) => {
                      const isSectionExpanded = expandedSections[section.id];
                      const isPassageVisible = showPassages[section.id];
                      const linkedQCount = (passageId: number) =>
                        section.questions.filter(
                          (q) => q.passage_id === passageId,
                        ).length;

                      return (
                        <div
                          key={section.id}
                          className="border-b border-gray-50 last:border-b-0"
                        >
                          {/* Section Header */}
                          <div className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                            <button
                              onClick={() =>
                                setExpandedSections((prev) => ({
                                  ...prev,
                                  [section.id]: !prev[section.id],
                                }))
                              }
                              className="flex-1 flex items-center gap-2 text-left"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-700">
                                {section.title}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({section.questions.length} Q,{" "}
                                {section.passages.length} {t("articles")},{" "}
                                {section.score_weight} pts)
                              </span>
                            </button>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() =>
                                  setEditingSection({
                                    section,
                                    examId: exam.id,
                                  })
                                }
                                className="p-1.5 text-gray-400 hover:text-blue-500"
                                title={t("editSection")}
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteSection(section.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500"
                                title={t("deleteSectionConfirm")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              {isSectionExpanded ? (
                                <ChevronUp
                                  onClick={() =>
                                    setExpandedSections((prev) => ({
                                      ...prev,
                                      [section.id]: false,
                                    }))
                                  }
                                  className="w-4 h-4 text-gray-400 hover:cursor-pointer"
                                />
                              ) : (
                                <ChevronDown
                                  onClick={() =>
                                    setExpandedSections((prev) => ({
                                      ...prev,
                                      [section.id]: true,
                                    }))
                                  }
                                  className="w-4 h-4 text-gray-400 hover:cursor-pointer"
                                />
                              )}
                            </div>
                          </div>

                          {isSectionExpanded && (
                            <div className="px-5 pb-4 space-y-3">
                              {/* ── Passages Toggle ── */}
                              {section.passages.length > 0 && (
                                <button
                                  onClick={() =>
                                    setShowPassages((prev) => ({
                                      ...prev,
                                      [section.id]: !prev[section.id],
                                    }))
                                  }
                                  className="flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700"
                                >
                                  <AlignLeft className="w-3.5 h-3.5" />
                                  {isPassageVisible
                                    ? t("hidePassages")
                                    : t("showPassages", {
                                        count: section.passages.length,
                                      })}
                                  {isPassageVisible ? (
                                    <ChevronUp className="w-3 h-3" />
                                  ) : (
                                    <ChevronDown className="w-3 h-3" />
                                  )}
                                </button>
                              )}

                              {/* ── Passages List ── */}
                              {isPassageVisible && (
                                <div className="space-y-2">
                                  {section.passages.map((passage) => (
                                    <div
                                      key={passage.id}
                                      className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                                    >
                                      <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-amber-700">
                                              #{passage.passage_order}{" "}
                                              {passage.title ||
                                                `(ID ${passage.id})`}
                                            </span>
                                            <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">
                                              {passage.passage_type}
                                            </span>
                                            <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
                                              <Link2 className="w-3 h-3" />
                                              {linkedQCount(passage.id)}{" "}
                                              {t("linkedQuestions")}
                                            </span>
                                          </div>
                                          <p className="text-xs text-amber-900 whitespace-pre-line line-clamp-3">
                                            {passage.content}
                                          </p>
                                        </div>
                                        <div className="flex items-center gap-1 ml-2">
                                          <button
                                            onClick={() =>
                                              setEditingPassage({
                                                passage,
                                                sectionId: section.id,
                                              })
                                            }
                                            className="p-1.5 text-amber-400 hover:text-blue-500"
                                          >
                                            <Edit className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleDeletePassage(passage.id)
                                            }
                                            className="p-1.5 text-amber-400 hover:text-red-500"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Add Passage Button */}
                              <button
                                onClick={() =>
                                  setEditingPassage({
                                    passage: null,
                                    sectionId: section.id,
                                  })
                                }
                                className="w-full py-1.5 border-2 border-dashed border-amber-200 rounded-lg text-xs text-amber-400 hover:text-amber-600 hover:border-amber-400 transition-colors flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {t("addPassage")}
                              </button>

                              {/* ── Questions List ── */}
                              <div className="space-y-2">
                                {section.questions.map((q) => {
                                  const linkedPassage = section.passages.find(
                                    (p) => p.id === q.passage_id,
                                  );
                                  return (
                                    <div
                                      key={q.id}
                                      className="flex items-start justify-between bg-gray-50 rounded-lg p-3"
                                    >
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm text-gray-800 font-medium truncate">
                                          <span className="text-gray-400 mr-2">
                                            #{q.question_order}
                                          </span>
                                          {q.question_text}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
                                          <span>
                                            {t("correctAnswer")}:{" "}
                                            <span className="font-bold text-emerald-600">
                                              {q.correct_answer}
                                            </span>
                                          </span>
                                          <span>
                                            {(q.choices as string[]).length}{" "}
                                            {t("choices")}
                                          </span>
                                          <span>{q.score} pts</span>
                                          {linkedPassage && (
                                            <span className="flex items-center gap-0.5 text-amber-600">
                                              <Link2 className="w-3 h-3" />
                                              {linkedPassage.title ||
                                                `Passage #${linkedPassage.passage_order}`}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1 ml-2">
                                        <button
                                          onClick={() =>
                                            setEditingQuestion({
                                              question: q,
                                              sectionId: section.id,
                                              passages: section.passages,
                                            })
                                          }
                                          className="p-1.5 text-gray-400 hover:text-blue-500"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleDeleteQuestion(q.id)
                                          }
                                          className="p-1.5 text-gray-400 hover:text-red-500"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Add Question Button */}
                              <button
                                onClick={() =>
                                  setEditingQuestion({
                                    question: null,
                                    sectionId: section.id,
                                    passages: section.passages,
                                  })
                                }
                                className="w-full py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs text-gray-400 hover:text-pink-500 hover:border-pink-300 transition-colors flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {t("addQuestion")}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Section Button */}
                    <div className="px-5 py-3">
                      <button
                        onClick={() =>
                          setEditingSection({ section: null, examId: exam.id })
                        }
                        className="w-full py-2 border-2 border-dashed border-blue-200 rounded-lg text-xs text-blue-400 hover:text-blue-600 hover:border-blue-400 transition-colors flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t("addSection")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── Modals ── */}
      {(showCreateExam || editingExam) && (
        <ExamEditor
          exam={editingExam}
          onSave={handleSaveExam}
          onClose={() => {
            setShowCreateExam(false);
            setEditingExam(null);
          }}
        />
      )}
      {editingSection && (
        <SectionEditor
          section={editingSection.section}
          examId={editingSection.examId}
          onSave={handleSaveSection}
          onClose={() => setEditingSection(null)}
        />
      )}
      {editingPassage && (
        <PassageEditor
          passage={editingPassage.passage}
          sectionId={editingPassage.sectionId}
          onSave={handleSavePassage}
          onClose={() => setEditingPassage(null)}
        />
      )}
      {editingQuestion && (
        <QuestionEditor
          question={editingQuestion.question}
          sectionId={editingQuestion.sectionId}
          passages={editingQuestion.passages}
          onSave={handleSaveQuestion}
          onClose={() => setEditingQuestion(null)}
        />
      )}

    </div>
  );
}

// ─── Exam Editor Modal ────────────────────────────────
function ExamEditor({
  exam,
  onSave,
  onClose,
}: {
  exam: Exam | null;
  onSave: (d: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const t = useTranslations("mockExam.admin");
  const tc = useTranslations("common");
  const [form, setForm] = useState({
    id: exam?.id,
    title: exam?.title || "",
    description: exam?.description || "",
    detail_content: exam?.detail_content || "",
    subject_code: exam?.subject_code || "",
    exam_type: exam?.exam_type || "TGAT",
    duration_minutes: exam?.duration_minutes ?? 60,
    total_score: exam?.total_score ?? 100,
    pass_score: exam?.pass_score ?? 50,
    is_active: exam?.is_active ?? true,
    display_order: exam?.display_order ?? 0,
  });
  const isNew = !form.id;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {isNew ? t("newExam") : t("editExam")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <Field
            label={t("examName")}
            value={form.title}
            onChange={(v) => setForm((p) => ({ ...p, title: v }))}
            placeholder="TGAT1"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("description")}
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label={t("subjectCode")}
              value={form.subject_code}
              onChange={(v) => setForm((p) => ({ ...p, subject_code: v }))}
              placeholder="TGAT1"
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("type")}
              </label>
              <select
                value={form.exam_type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, exam_type: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
              >
                <option value="TGAT">TGAT</option>
                <option value="TPAT">TPAT</option>
                <option value="A-LEVEL">A-LEVEL</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <NumField
              label={t("duration")}
              value={form.duration_minutes}
              onChange={(v) => setForm((p) => ({ ...p, duration_minutes: v }))}
            />
            <NumField
              label={t("totalScore")}
              value={form.total_score}
              onChange={(v) => setForm((p) => ({ ...p, total_score: v }))}
            />
            <NumField
              label={t("passScore")}
              value={form.pass_score}
              onChange={(v) => setForm((p) => ({ ...p, pass_score: v }))}
            />
          </div>
          {!isNew && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">
                {t("status")}:
              </label>
              <button
                onClick={() =>
                  setForm((p) => ({ ...p, is_active: !p.is_active }))
                }
                className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${form.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
              >
                {form.is_active ? t("active") : t("inactive")}
              </button>
            </div>
          )}
        </div>
        <ModalFooter
          onClose={onClose}
          onSave={() => onSave(form)}
          label={isNew ? tc("add") : tc("save")}
        />
      </div>
    </div>
  );
}

// ─── Section Editor Modal ─────────────────────────────
function SectionEditor({
  section,
  examId,
  onSave,
  onClose,
}: {
  section: Section | null;
  examId: number;
  onSave: (d: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const t = useTranslations("mockExam.admin");
  const tc = useTranslations("common");
  const [form, setForm] = useState({
    id: section?.id,
    exam_id: examId,
    title: section?.title || "",
    description: section?.description || "",
    section_order: section?.section_order ?? 0,
    score_weight: section?.score_weight ?? 50,
  });
  const isNew = !form.id;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {isNew ? t("newSection") : t("editSection")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <Field
            label={t("sectionName")}
            value={form.title}
            onChange={(v) => setForm((p) => ({ ...p, title: v }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("description")}
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((p) => ({ ...p, description: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <NumField
              label={t("order")}
              value={form.section_order}
              onChange={(v) => setForm((p) => ({ ...p, section_order: v }))}
            />
            <NumField
              label={t("scoreWeight")}
              value={form.score_weight}
              onChange={(v) => setForm((p) => ({ ...p, score_weight: v }))}
            />
          </div>
        </div>
        <ModalFooter
          onClose={onClose}
          onSave={() => onSave(form)}
          label={isNew ? tc("add") : tc("save")}
        />
      </div>
    </div>
  );
}

// ─── Passage Editor Modal ─────────────────────────────
function PassageEditor({
  passage,
  sectionId,
  onSave,
  onClose,
}: {
  passage: Passage | null;
  sectionId: number;
  onSave: (d: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const t = useTranslations("mockExam.admin");
  const tc = useTranslations("common");
  const [form, setForm] = useState({
    id: passage?.id,
    section_id: sectionId,
    title: passage?.title || "",
    content: passage?.content || "",
    passage_type: passage?.passage_type || "text",
    passage_order: passage?.passage_order ?? 0,
  });
  const isNew = !form.id;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {isNew ? t("newPassage") : t("editPassage")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <Field
            label={t("passageTitle")}
            value={form.title}
            onChange={(v) => setForm((p) => ({ ...p, title: v }))}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("passageContent")} *
            </label>
            <textarea
              value={form.content}
              onChange={(e) =>
                setForm((p) => ({ ...p, content: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 font-mono"
              rows={10}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("passageType")}
              </label>
              <select
                value={form.passage_type}
                onChange={(e) =>
                  setForm((p) => ({ ...p, passage_type: e.target.value }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="text">text</option>
                <option value="conversation">conversation</option>
                <option value="article">article</option>
                <option value="letter">letter</option>
                <option value="email">email</option>
                <option value="advertisement">advertisement</option>
              </select>
            </div>
            <NumField
              label={t("order")}
              value={form.passage_order}
              onChange={(v) => setForm((p) => ({ ...p, passage_order: v }))}
            />
          </div>
        </div>
        <ModalFooter
          onClose={onClose}
          onSave={() => onSave(form)}
          label={isNew ? tc("add") : tc("save")}
        />
      </div>
    </div>
  );
}

// ─── Question Editor Modal ────────────────────────────
function QuestionEditor({
  question,
  sectionId,
  passages,
  onSave,
  onClose,
}: {
  question: Question | null;
  sectionId: number;
  passages: Passage[];
  onSave: (d: Record<string, unknown>) => void;
  onClose: () => void;
}) {
  const t = useTranslations("mockExam.admin");
  const tc = useTranslations("common");
  const [form, setForm] = useState({
    id: question?.id,
    section_id: sectionId,
    passage_id: question?.passage_id ?? (null as number | null),
    question_text: question?.question_text || "",
    choices: (question?.choices as string[]) || ["A) ", "B) ", "C) ", "D) "],
    correct_answer: question?.correct_answer || "A",
    explanation: question?.explanation || "",
    question_order: question?.question_order ?? 0,
    score: question?.score ?? 1,
  });
  const isNew = !form.id;

  const updateChoice = (idx: number, value: string) => {
    setForm((prev) => {
      const c = [...prev.choices];
      c[idx] = value;
      return { ...prev, choices: c };
    });
  };

  const addChoice = () => {
    const letters = "ABCDEFGH";
    const next = letters[form.choices.length] || "?";
    setForm((prev) => ({ ...prev, choices: [...prev.choices, `${next}) `] }));
  };

  const removeChoice = (idx: number) => {
    if (form.choices.length <= 2) return;
    setForm((prev) => ({
      ...prev,
      choices: prev.choices.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            {isNew ? t("newQuestion") : t("editQuestion")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Passage Link */}
          {passages.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("linkPassage")}
              </label>
              <select
                value={form.passage_id ?? ""}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    passage_id: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">{t("noPassageLink")}</option>
                {passages.map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.passage_order} {p.title || `(Passage ID ${p.id})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("questionText")} *
            </label>
            <textarea
              value={form.question_text}
              onChange={(e) =>
                setForm((p) => ({ ...p, question_text: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("choices")}
            </label>
            <div className="space-y-2">
              {form.choices.map((choice, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="correct"
                    checked={form.correct_answer === choice.substring(0, 1)}
                    onChange={() =>
                      setForm((p) => ({
                        ...p,
                        correct_answer: choice.substring(0, 1),
                      }))
                    }
                    className="w-4 h-4 text-emerald-500"
                  />
                  <input
                    type="text"
                    value={choice}
                    onChange={(e) => updateChoice(idx, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                  {form.choices.length > 2 && (
                    <button
                      onClick={() => removeChoice(idx)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xs text-gray-400">{t("choiceHint")}</p>
              {form.choices.length < 8 && (
                <button
                  onClick={addChoice}
                  className="text-xs text-pink-500 hover:text-pink-600 font-medium"
                >
                  {t("addChoice")}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("explanationLabel")}
            </label>
            <textarea
              value={form.explanation}
              onChange={(e) =>
                setForm((p) => ({ ...p, explanation: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <NumField
              label={t("questionOrder")}
              value={form.question_order}
              onChange={(v) => setForm((p) => ({ ...p, question_order: v }))}
            />
            <NumField
              label={t("questionScore")}
              value={form.score}
              onChange={(v) => setForm((p) => ({ ...p, score: v }))}
            />
          </div>
        </div>

        <ModalFooter
          onClose={onClose}
          onSave={() =>
            onSave({
              ...(form.id ? { id: form.id } : {}),
              section_id: form.section_id,
              passage_id: form.passage_id,
              question_text: form.question_text,
              choices: form.choices,
              correct_answer: form.correct_answer,
              explanation: form.explanation || null,
              question_order: form.question_order,
              score: form.score,
            })
          }
          label={isNew ? tc("add") : tc("save")}
        />
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────
function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
      />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
      />
    </div>
  );
}


function ModalFooter({
  onClose,
  onSave,
  label,
}: {
  onClose: () => void;
  onSave: () => void;
  label: string;
}) {
  const tc = useTranslations("common");
  return (
    <div className="flex gap-3 mt-6">
      <button
        onClick={onClose}
        className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 text-sm"
      >
        {tc("cancel")}
      </button>
      <button
        onClick={onSave}
        className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5"
      >
        <Save className="w-4 h-4" />
        {label}
      </button>
    </div>
  );
}
