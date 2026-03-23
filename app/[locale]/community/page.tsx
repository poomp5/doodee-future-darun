"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import R2Image from "@/components/R2Image";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, Link } from "@/routing";
import SearchSelect from "@/components/SearchSelect";
import { School } from "lucide-react";

type FilterOption = { th?: string | null; en?: string | null };

type CommunityPost = {
  id: string;
  title: string;
  description?: string | null;
  university_name?: string | null;
  faculty_name?: string | null;
  program_name?: string | null;
  school_name?: string | null;
  cover_image_url?: string | null;
  pages?: { pageNumber: number; imageUrl: string; aspectRatio?: number | null; isVisible?: boolean }[];
  user?: { id: string; name?: string | null; username?: string | null; image?: string | null };
  rating?: { average: number; count: number };
};

type Template = {
  id: string;
  name: string;
  description?: string | null;
  image: string;
  price: number;
  badge: string[];
};

export default function CommunityPage() {
  const t = useTranslations('community');
  const locale = useLocale();
  const router = useRouter();
  const numberLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [activeTab, setActiveTab] = useState<"community" | "templates">("community");
  const [universities, setUniversities] = useState<FilterOption[]>([]);
  const [faculties, setFaculties] = useState<FilterOption[]>([]);
  const [schools, setSchools] = useState<string[]>([]);
  const [filters, setFilters] = useState<{ university: string; faculty: string; school: string }>({
    university: "",
    faculty: "",
    school: "",
  });

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [communityStats, setCommunityStats] = useState<{ total: number; schoolCount: number }>({
    total: 0,
    schoolCount: 0,
  });

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [filtersRes, schoolsRes] = await Promise.all([
          fetch("/api/community/filters"),
          fetch("/api/community/schools"),
        ]);
        const filtersData = await filtersRes.json();
        if (!filtersData.error) {
          setUniversities(filtersData.universities || []);
          setFaculties(filtersData.faculties || []);
        }
        const schoolsData = await schoolsRes.json();
        if (Array.isArray(schoolsData.schools)) {
          setSchools(schoolsData.schools);
        }
      } catch (err) {
        console.error("Load filters error", err);
      }
    };
    loadFilters();
  }, []);

  // Load community posts
  useEffect(() => {
    const loadPosts = async () => {
      setLoadingPosts(true);
      try {
        const params = new URLSearchParams();
        params.set("limit", "30");
        if (filters.university) params.set("university", filters.university);
        if (filters.faculty) params.set("faculty", filters.faculty);
        if (filters.school) params.set("school", filters.school);
        const res = await fetch(`/api/community?${params.toString()}`);
        const data = await res.json();
        if (!data.error) {
          setPosts(data.data || []);
          setCommunityStats({
            total: Number(data.total) || 0,
            schoolCount: Number(data.schoolCount) || 0,
          });
        }
      } catch (err) {
        console.error("Load community posts error", err);
      } finally {
        setLoadingPosts(false);
      }
    };
    loadPosts();
  }, [filters]);

  // Load templates for sale (when tab is opened)
  useEffect(() => {
    if (activeTab !== "templates" || templates.length > 0) return;
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const res = await fetch("/api/db/templates?is_active=true");
        const data = await res.json();
        if (Array.isArray(data)) {
          const mapped = data.map((template: any) => ({
            id: template.id,
            name: template.template_name,
            description: template.description,
            image: template.preview_image_url,
            price: Number(template.price) || 0,
            badge: template.template_type || [],
          }));
          setTemplates(mapped);
        }
      } catch (err) {
        console.error("Load templates error", err);
      } finally {
          setLoadingTemplates(false);
      }
    };
    loadTemplates();
  }, [activeTab, templates.length]);

  const renderPostCard = (post: CommunityPost) => {
    const firstVisiblePage = post.pages?.find((p) => p.isVisible !== false);
    const cover =
      post.cover_image_url ||
      firstVisiblePage?.imageUrl ||
      post.pages?.[0]?.imageUrl;
    return (
      <Link
        key={post.id}
        href={`/community/${post.id}` as any}
        className="bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
      >
        {cover ? (
          <div className="relative w-full aspect-[3/4] bg-gray-50">
            <R2Image
              src={cover}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          </div>
        ) : (
          <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
            {t('noImage')}
          </div>
        )}
        <div className="p-2.5 md:p-3 flex-1 flex flex-col gap-1">
          <h3 className="font-bold text-sm md:text-base text-gray-900 line-clamp-1">{post.title}</h3>
          <div className="text-[11px] md:text-xs text-pink-600 font-medium line-clamp-1">
            {post.university_name || t('unknownUniversity')} · {post.faculty_name || t('unknownFaculty')}
          </div>
          {post.program_name && (
            <div className="text-[11px] md:text-xs text-gray-500 line-clamp-1">
              {post.program_name}
            </div>
          )}
          <div className="flex items-center gap-1 text-[11px] md:text-xs text-gray-500 line-clamp-1">
            <School className="w-3 h-3 shrink-0" />
            <span>{post.school_name || (locale === 'th' ? 'ไม่ระบุโรงเรียน' : 'School not specified')}</span>
          </div>
          {post.description && (
            <p className="text-xs text-gray-500 line-clamp-3">{post.description}</p>
          )}
          <div className="flex items-center gap-2 mt-auto pt-1.5 text-xs text-gray-500">
            {post.user?.image ? (
              <Image
                src={post.user.image}
                alt={post.user.name || post.user.username || "user"}
                width={20}
                height={20}
                className="rounded-full"
              />
            ) : (
              <div className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                {(post.user?.username || post.user?.name || "U").slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="truncate">
              {post.user?.name || post.user?.username || t('unknownUser')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-400 pt-0.5">
            {post.pages && post.pages.length > 1 && (
              <span>{t('pageCount', { count: post.pages.length })}</span>
            )}
            {post.rating && post.rating.average > 0 && (
              <span className="flex items-center gap-0.5">
                <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                {post.rating.average}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  const renderTemplateCard = (template: Template) => (
    <div
      key={template.id}
      className="bg-white border rounded-xl shadow-sm hover:shadow-md transition p-4 flex flex-col gap-3"
    >
      <div className="relative w-full aspect-[4/3] bg-gray-50 rounded-lg overflow-hidden">
        <R2Image
          src={template.image || "/port/1.jpg"}
          alt={template.name}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">{template.name}</h3>
            {template.description && (
              <p className="text-sm text-gray-600 line-clamp-3">{template.description}</p>
            )}
          </div>
          <span className="text-pink-600 font-bold text-sm">
            {template.price === 0
              ? t('priceFree')
              : t('priceTHB', { price: template.price.toLocaleString(numberLocale) })}
          </span>
        </div>
        <div className="flex flex-wrap gap-2 mt-1">
          {template.badge.map((badge, index) => (
            <span
              key={index}
              className="text-white text-xs font-bold px-2 py-1 rounded bg-gray-600"
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
      <Link
        href={`/port/${template.id}`}
        className="w-full text-center bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-lg transition"
      >
        {t('viewTemplate')}
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-4 py-6 md:py-8 space-y-5 md:space-y-8">
      {/* Mobile tabs */}
      <div className="flex md:hidden rounded-full bg-gray-100 p-1">
        <button
          onClick={() => setActiveTab("community")}
          className={`flex-1 py-2 text-sm font-semibold rounded-full transition ${
            activeTab === "community" ? "bg-pink-600 text-white shadow" : "text-gray-600"
          }`}
        >
          {t('tabCommunity')}
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`flex-1 py-2 text-sm font-semibold rounded-full transition ${
            activeTab === "templates" ? "bg-pink-600 text-white shadow" : "text-gray-600"
          }`}
        >
          {t('tabTemplates')}
        </button>
      </div>

      {activeTab === "community" && (
        <div className="space-y-6">
          {/* Upload CTA */}
          <div className="bg-white border rounded-2xl shadow-sm p-4 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('ctaTitle')}</h2>
              <p className="text-gray-600 text-sm">
                {t('ctaSubtitle')}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link
                href={`/community/my-posts`}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-semibold"
              >
                {t('ctaMyPosts')}
              </Link>
              <button
                onClick={() => router.push(`/community/upload`)}
                className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm font-semibold"
              >
                {t('ctaUpload')}
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white border rounded-2xl shadow-sm p-3 md:p-4 flex flex-wrap gap-3 items-center">
            <div className="font-semibold text-gray-900 text-sm">{t('filtersLabel')}</div>
            <SearchSelect
              value={filters.university}
              onChange={(v) => setFilters((prev) => ({ ...prev, university: v }))}
              options={[...new Set(universities.map((u) => u.th || u.en || "").filter(Boolean))]}
              placeholder={t('filterUniversityPlaceholder')}
            />
            <SearchSelect
              value={filters.faculty}
              onChange={(v) => setFilters((prev) => ({ ...prev, faculty: v }))}
              options={[...new Set(faculties.map((f) => f.th || f.en || "").filter(Boolean))]}
              placeholder={t('filterFacultyPlaceholder')}
            />
            <SearchSelect
              value={filters.school}
              onChange={(v) => setFilters((prev) => ({ ...prev, school: v }))}
              options={schools}
              placeholder={locale === 'th' ? 'โรงเรียน' : 'School'}
            />
            {(filters.university || filters.faculty || filters.school) && (
              <button
                onClick={() => setFilters({ university: "", faculty: "", school: "" })}
                className="text-sm text-gray-500 underline"
              >
                {t('filtersClear')}
              </button>
            )}
          </div>

          {/* Community grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">{t('communityExamples')}</h2>
              <span className="text-xs md:text-sm text-gray-500">{posts.length > 0 ? t('postsCount', { count: posts.length }) : ""}</span>
            </div>
            {!loadingPosts && (
              <p className="text-sm text-gray-600">
                {t("systemSummary", {
                  portfolioCount: communityStats.total.toLocaleString(numberLocale),
                  schoolCount: communityStats.schoolCount.toLocaleString(numberLocale),
                })}
              </p>
            )}
            {loadingPosts ? (
              <div className="text-gray-600 text-sm">{t('loadingPosts')}</div>
            ) : posts.length === 0 ? (
              <div className="text-gray-600 text-sm">{t('noPosts')}</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {posts.map(renderPostCard)}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "templates" && (
        <div className="space-y-4">
          {loadingTemplates ? (
            <div className="text-gray-600">{t('loadingTemplates')}</div>
          ) : templates.length === 0 ? (
            <div className="text-gray-600">{t('noTemplates')}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {templates.map(renderTemplateCard)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
