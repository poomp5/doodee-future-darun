"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Eye,
  Trash,
  Plus,
  X,
  Sparkles,
  Loader2,
  Globe,
  FileText,
} from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/routing";
import Swal from "@/lib/swal-toast";
import dynamic from "next/dynamic";
import AIGenerationProgress, {
  GenerationStep,
  LogEntry,
} from "./AIGenerationProgress";

// Dynamically import markdown editor to avoid SSR issues
const MDEditor = dynamic(
  () => import("@uiw/react-md-editor").then((mod) => mod.default),
  { ssr: false }
);

interface Translation {
  locale: string;
  title: string;
  excerpt: string;
  content: string;
  meta_title: string;
  meta_description: string;
}

interface Category {
  id: number;
  slug: string;
  translations: { locale: string; name: string }[];
}

interface Tag {
  id: number;
  slug: string;
  translations: { locale: string; name: string }[];
}

interface BlogPostFormProps {
  postId?: number;
  initialData?: {
    id: number;
    slug: string;
    status: string;
    featured_image: string | null;
    is_featured: boolean;
    translations: Translation[];
    categories: { category: Category }[];
    tags: { tag: Tag }[];
  };
}

export default function BlogPostForm({ postId, initialData }: BlogPostFormProps) {
  const router = useRouter();
  const t = useTranslations();
  const currentLocale = useLocale();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [status, setStatus] = useState(initialData?.status || "draft");
  const [featuredImage, setFeaturedImage] = useState(initialData?.featured_image || "");
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured || false);
  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    initialData?.categories.map((c) => c.category.id) || []
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    initialData?.tags.map((t) => t.tag.id) || []
  );

  // Translations state
  const [activeTab, setActiveTab] = useState<"th" | "en">("th");
  const [translations, setTranslations] = useState<{ th: Translation; en: Translation }>({
    th: {
      locale: "th",
      title: initialData?.translations.find((t) => t.locale === "th")?.title || "",
      excerpt: initialData?.translations.find((t) => t.locale === "th")?.excerpt || "",
      content: initialData?.translations.find((t) => t.locale === "th")?.content || "",
      meta_title: initialData?.translations.find((t) => t.locale === "th")?.meta_title || "",
      meta_description: initialData?.translations.find((t) => t.locale === "th")?.meta_description || "",
    },
    en: {
      locale: "en",
      title: initialData?.translations.find((t) => t.locale === "en")?.title || "",
      excerpt: initialData?.translations.find((t) => t.locale === "en")?.excerpt || "",
      content: initialData?.translations.find((t) => t.locale === "en")?.content || "",
      meta_title: initialData?.translations.find((t) => t.locale === "en")?.meta_title || "",
      meta_description: initialData?.translations.find((t) => t.locale === "en")?.meta_description || "",
    },
  });

  // Editor mode
  const [editorMode, setEditorMode] = useState<"markdown" | "wysiwyg">("markdown");

  // AI Generation state
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiContent, setAiContent] = useState("");
  const [aiUrl, setAiUrl] = useState("");
  const [aiCustomPrompt, setAiCustomPrompt] = useState("");
  const [aiInputMode, setAiInputMode] = useState<"paste" | "url">("paste");
  const [aiTone, setAiTone] = useState<"informative" | "casual" | "professional" | "motivational">("informative");
  const [aiAudience, setAiAudience] = useState<"students" | "parents" | "general">("students");
  const [aiGenerating, setAiGenerating] = useState(false);

  // AI Progress tracking state
  const [aiProgress, setAiProgress] = useState(0);
  const [aiCurrentStep, setAiCurrentStep] = useState<GenerationStep>("scraping");
  const [aiLogs, setAiLogs] = useState<LogEntry[]>([]);
  const [aiError, setAiError] = useState<string | undefined>();

  // Available categories and tags
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Fetch categories and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, tagRes] = await Promise.all([
          fetch("/api/admin/blog/categories"),
          fetch("/api/admin/blog/tags"),
        ]);
        const catData = await catRes.json();
        const tagData = await tagRes.json();
        setCategories(catData.data || []);
        setTags(tagData.data || []);
      } catch (error) {
        console.error("Error fetching categories/tags:", error);
      }
    };
    fetchData();
  }, []);

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\sก-๙]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [activeTab]: { ...prev[activeTab], title: value },
    }));
    // Auto-generate slug if creating new post and slug is empty
    if (!postId && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleSave = async (saveStatus?: string) => {
    const finalStatus = saveStatus || status;

    // Validate
    if (!slug) {
      Swal.fire({ icon: "error", title: t("blog.admin.slugRequired") });
      return;
    }
    if (!translations.th.title && !translations.en.title) {
      Swal.fire({ icon: "error", title: t("blog.admin.titleRequired") });
      return;
    }

    setSaving(true);

    try {
      const payload = {
        id: postId,
        slug,
        status: finalStatus,
        featured_image: featuredImage || null,
        is_featured: isFeatured,
        translations: [
          translations.th.title ? translations.th : null,
          translations.en.title ? translations.en : null,
        ].filter(Boolean),
        category_ids: selectedCategories,
        tag_ids: selectedTags,
      };

      const url = "/api/admin/blog/posts";
      const method = postId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      Swal.fire({
        icon: "success",
        title: t("common.success"),
        timer: 1500,
        showConfirmButton: false,
      });

      router.push(`/${currentLocale}/admin/blog`);
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      Swal.fire({
        icon: "error",
        title: t("common.error"),
        text: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSaving(false);
    }
  };

  const getCategoryName = (category: Category) => {
    const translation = category.translations.find((t) => t.locale === currentLocale);
    return translation?.name || category.slug;
  };

  const getTagName = (tag: Tag) => {
    const translation = tag.translations.find((t) => t.locale === currentLocale);
    return translation?.name || tag.slug;
  };

  // Add log entry helper
  const addLog = useCallback((message: string, type: "info" | "success" | "error" = "info") => {
    setAiLogs((prev) => [...prev, { timestamp: new Date(), message, type }]);
  }, []);

  // Reset AI progress state
  const resetAiProgress = useCallback(() => {
    setAiProgress(0);
    setAiCurrentStep("scraping");
    setAiLogs([]);
    setAiError(undefined);
  }, []);

  // AI Generation handler with SSE streaming via POST
  const handleAiGenerate = async () => {
    // Validate input based on mode
    if (aiInputMode === "paste" && (!aiContent || aiContent.trim().length < 50)) {
      Swal.fire({
        icon: "warning",
        title: t("blog.admin.ai.contentTooShort"),
        text: t("blog.admin.ai.contentTooShortDesc"),
      });
      return;
    }

    if (aiInputMode === "url" && (!aiUrl || !aiUrl.trim().startsWith("http"))) {
      Swal.fire({
        icon: "warning",
        title: t("blog.admin.ai.invalidUrl"),
        text: t("blog.admin.ai.invalidUrlDesc"),
      });
      return;
    }

    // Reset and start generating
    resetAiProgress();
    setAiGenerating(true);
    addLog("Starting AI generation...", "info");

    try {
      // Use fetch with POST for SSE streaming (avoids URL length limits)
      const response = await fetch("/api/admin/blog/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: aiInputMode === "paste" ? aiContent : undefined,
          url: aiInputMode === "url" ? aiUrl : undefined,
          customPrompt: aiCustomPrompt || undefined,
          tone: aiTone,
          targetAudience: aiAudience,
          stream: true, // Enable SSE streaming
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              // Update progress
              if (typeof data.progress === "number") {
                setAiProgress(data.progress);
              }

              // Update current step
              if (data.step) {
                setAiCurrentStep(data.step);
              }

              // Add log message
              if (data.message) {
                const logType = data.step === "error" ? "error" : data.step === "complete" ? "success" : "info";
                addLog(data.message, logType);
              }

              // Handle error
              if (data.step === "error") {
                setAiError(data.error || data.message);
                setAiGenerating(false);
                return;
              }

              // Handle completion
              if (data.step === "complete" && data.data) {
                const { translations: aiTranslations, suggested_slug } = data.data;
                const enTitle = aiTranslations.en.title || "";

                setTranslations({
                  th: {
                    locale: "th",
                    title: aiTranslations.th.title || "",
                    excerpt: aiTranslations.th.excerpt || "",
                    content: aiTranslations.th.content || "",
                    meta_title: aiTranslations.th.title || "",
                    meta_description: aiTranslations.th.excerpt || "",
                  },
                  en: {
                    locale: "en",
                    title: enTitle,
                    excerpt: aiTranslations.en.excerpt || "",
                    content: aiTranslations.en.content || "",
                    meta_title: enTitle,
                    meta_description: aiTranslations.en.excerpt || "",
                  },
                });

                // Auto-generate slug from AI suggestion or from English title
                const generatedSlug = suggested_slug || generateSlug(enTitle);
                if (generatedSlug) {
                  setSlug(generatedSlug);
                }

                // Wait a bit to show completion state, then close modal
                setTimeout(() => {
                  setAiModalOpen(false);
                  setAiContent("");
                  setAiUrl("");
                  setAiCustomPrompt("");
                  setAiGenerating(false);

                  Swal.fire({
                    icon: "success",
                    title: t("blog.admin.ai.success"),
                    text: t("blog.admin.ai.successDesc"),
                    timer: 2500,
                    showConfirmButton: false,
                  });
                }, 1500);
                return;
              }
            } catch (parseError) {
              console.error("Error parsing SSE data:", parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error("AI generation error:", error);
      setAiCurrentStep("error");
      setAiError("Connection error. Please try again.");
      addLog("Connection error", "error");
      setAiGenerating(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blog"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
              {postId ? t("blog.admin.editPost") : t("blog.admin.newPost")}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAiModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-purple-700 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">{t("blog.admin.ai.generate")}</span>
          </button>
          <button
            onClick={() => handleSave("draft")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{t("blog.admin.saveDraft")}</span>
          </button>
          <button
            onClick={() => handleSave("published")}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">{t("blog.admin.publish")}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Language Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("th")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "th"
                    ? "text-pink-600 border-b-2 border-pink-500 bg-pink-50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                ภาษาไทย
              </button>
              <button
                onClick={() => setActiveTab("en")}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === "en"
                    ? "text-pink-600 border-b-2 border-pink-500 bg-pink-50"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                English
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("blog.admin.title")} *
                </label>
                <input
                  type="text"
                  value={translations[activeTab].title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder={activeTab === "th" ? "หัวข้อบทความ" : "Article title"}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("blog.admin.excerpt")}
                </label>
                <textarea
                  value={translations[activeTab].excerpt}
                  onChange={(e) =>
                    setTranslations((prev) => ({
                      ...prev,
                      [activeTab]: { ...prev[activeTab], excerpt: e.target.value },
                    }))
                  }
                  placeholder={activeTab === "th" ? "คำอธิบายสั้นๆ" : "Short description"}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>

              {/* Content Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    {t("blog.admin.content")}
                  </label>
                  <div className="flex items-center gap-2 text-sm">
                    <button
                      onClick={() => setEditorMode("markdown")}
                      className={`px-3 py-1 rounded ${
                        editorMode === "markdown"
                          ? "bg-pink-100 text-pink-600"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      Markdown
                    </button>
                    <button
                      onClick={() => setEditorMode("wysiwyg")}
                      className={`px-3 py-1 rounded ${
                        editorMode === "wysiwyg"
                          ? "bg-pink-100 text-pink-600"
                          : "text-gray-500 hover:bg-gray-100"
                      }`}
                    >
                      WYSIWYG
                    </button>
                  </div>
                </div>
                <div data-color-mode="light">
                  <MDEditor
                    value={translations[activeTab].content}
                    onChange={(val) =>
                      setTranslations((prev) => ({
                        ...prev,
                        [activeTab]: { ...prev[activeTab], content: val || "" },
                      }))
                    }
                    preview={editorMode === "wysiwyg" ? "live" : "edit"}
                    height={400}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEO Fields */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-medium text-gray-800 mb-4">{t("blog.admin.seo")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("blog.admin.metaTitle")}
                </label>
                <input
                  type="text"
                  value={translations[activeTab].meta_title}
                  onChange={(e) =>
                    setTranslations((prev) => ({
                      ...prev,
                      [activeTab]: { ...prev[activeTab], meta_title: e.target.value },
                    }))
                  }
                  placeholder="SEO Title"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("blog.admin.metaDescription")}
                </label>
                <textarea
                  value={translations[activeTab].meta_description}
                  onChange={(e) =>
                    setTranslations((prev) => ({
                      ...prev,
                      [activeTab]: { ...prev[activeTab], meta_description: e.target.value },
                    }))
                  }
                  placeholder="SEO Description"
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Slug & Status */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-medium text-gray-800 mb-4">{t("blog.admin.settings")}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("blog.admin.slug")} *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="article-url-slug"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t("blog.admin.status")}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
                >
                  <option value="draft">{t("blog.status.draft")}</option>
                  <option value="published">{t("blog.status.published")}</option>
                  <option value="archived">{t("blog.status.archived")}</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                />
                <label htmlFor="is_featured" className="text-sm text-gray-700">
                  {t("blog.admin.featured")}
                </label>
              </div>
            </div>
          </div>

          {/* Featured Image */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-medium text-gray-800 mb-4">{t("blog.admin.featuredImage")}</h3>
            <div>
              <input
                type="text"
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                placeholder="Image URL"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500 mb-2"
              />
              {featuredImage && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={featuredImage}
                    alt="Featured"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setFeaturedImage("")}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-medium text-gray-800 mb-4">{t("blog.admin.categories")}</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((category) => (
                <label key={category.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCategories([...selectedCategories, category.id]);
                      } else {
                        setSelectedCategories(
                          selectedCategories.filter((id) => id !== category.id)
                        );
                      }
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                  />
                  <span className="text-sm text-gray-700">{getCategoryName(category)}</span>
                </label>
              ))}
              {categories.length === 0 && (
                <p className="text-sm text-gray-400">{t("blog.admin.noCategories")}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-medium text-gray-800 mb-4">{t("blog.admin.tags")}</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => {
                    if (selectedTags.includes(tag.id)) {
                      setSelectedTags(selectedTags.filter((id) => id !== tag.id));
                    } else {
                      setSelectedTags([...selectedTags, tag.id]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTags.includes(tag.id)
                      ? "bg-pink-100 text-pink-600 border border-pink-300"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {getTagName(tag)}
                </button>
              ))}
              {tags.length === 0 && (
                <p className="text-sm text-gray-400">{t("blog.admin.noTags")}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Generation Modal */}
      {aiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{t("blog.admin.ai.title")}</h3>
                  <p className="text-sm text-gray-500">{t("blog.admin.ai.subtitle")}</p>
                </div>
              </div>
              <button
                onClick={() => setAiModalOpen(false)}
                disabled={aiGenerating}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
              {/* Show Progress UI when generating */}
              {aiGenerating ? (
                <AIGenerationProgress
                  currentStep={aiCurrentStep}
                  progress={aiProgress}
                  logs={aiLogs}
                  error={aiError}
                />
              ) : (
                <>
                  {/* Input Mode Tabs */}
                  <div className="flex border-b border-gray-200">
                    <button
                      onClick={() => setAiInputMode("paste")}
                      disabled={aiGenerating}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                        aiInputMode === "paste"
                          ? "text-purple-600 border-b-2 border-purple-500"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      {t("blog.admin.ai.modePaste")}
                    </button>
                    <button
                      onClick={() => setAiInputMode("url")}
                      disabled={aiGenerating}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                        aiInputMode === "url"
                          ? "text-purple-600 border-b-2 border-purple-500"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      <Globe className="w-4 h-4" />
                      {t("blog.admin.ai.modeUrl")}
                    </button>
                  </div>

                  {/* Content Input - Paste Mode */}
                  {aiInputMode === "paste" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("blog.admin.ai.pasteContent")}
                      </label>
                      <textarea
                        value={aiContent}
                        onChange={(e) => setAiContent(e.target.value)}
                        placeholder={t("blog.admin.ai.pasteContentPlaceholder")}
                        rows={6}
                        disabled={aiGenerating}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 resize-none disabled:bg-gray-50"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        {aiContent.length} {t("blog.admin.ai.characters")} (min 50)
                      </p>
                    </div>
                  )}

                  {/* URL Input - URL Mode */}
                  {aiInputMode === "url" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("blog.admin.ai.urlInput")}
                      </label>
                      <input
                        type="url"
                        value={aiUrl}
                        onChange={(e) => setAiUrl(e.target.value)}
                        placeholder={t("blog.admin.ai.urlPlaceholder")}
                        disabled={aiGenerating}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 disabled:bg-gray-50"
                      />
                      <p className="mt-1 text-xs text-gray-400">
                        {t("blog.admin.ai.urlHint")}
                      </p>
                    </div>
                  )}

                  {/* Custom Prompt / Instructions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("blog.admin.ai.customPrompt")}
                      <span className="text-gray-400 font-normal ml-1">({t("blog.admin.ai.optional")})</span>
                    </label>
                    <textarea
                      value={aiCustomPrompt}
                      onChange={(e) => setAiCustomPrompt(e.target.value)}
                      placeholder={t("blog.admin.ai.customPromptPlaceholder")}
                      rows={3}
                      disabled={aiGenerating}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 resize-none disabled:bg-gray-50"
                    />
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tone */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("blog.admin.ai.tone")}
                      </label>
                      <select
                        value={aiTone}
                        onChange={(e) => setAiTone(e.target.value as typeof aiTone)}
                        disabled={aiGenerating}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 disabled:bg-gray-50"
                      >
                        <option value="informative">{t("blog.admin.ai.toneInformative")}</option>
                        <option value="casual">{t("blog.admin.ai.toneCasual")}</option>
                        <option value="professional">{t("blog.admin.ai.toneProfessional")}</option>
                        <option value="motivational">{t("blog.admin.ai.toneMotivational")}</option>
                      </select>
                    </div>

                    {/* Target Audience */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t("blog.admin.ai.audience")}
                      </label>
                      <select
                        value={aiAudience}
                        onChange={(e) => setAiAudience(e.target.value as typeof aiAudience)}
                        disabled={aiGenerating}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-purple-500 disabled:bg-gray-50"
                      >
                        <option value="students">{t("blog.admin.ai.audienceStudents")}</option>
                        <option value="parents">{t("blog.admin.ai.audienceParents")}</option>
                        <option value="general">{t("blog.admin.ai.audienceGeneral")}</option>
                      </select>
                    </div>
                  </div>

                  {/* Info Box */}
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <p className="text-sm text-purple-700">
                      {t("blog.admin.ai.info")}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
              {aiGenerating ? (
                <button
                  onClick={() => {
                    setAiGenerating(false);
                    resetAiProgress();
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  {t("common.cancel")}
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setAiModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    onClick={handleAiGenerate}
                    disabled={aiInputMode === "paste" ? aiContent.length < 50 : !aiUrl.trim().startsWith("http")}
                    className="flex items-center gap-2 px-6 py-2 text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4" />
                    {t("blog.admin.ai.generateButton")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
