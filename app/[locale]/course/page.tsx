"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "@/routing";
import { Loader2, BookOpen, CalendarDays, Users, ExternalLink, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { getCategoryGroupLabel, getCategoryLabel, getCategoryGroupIcon, CATEGORY_GROUPS } from "@/lib/categories";

// Database course/activity interfaces
interface DBCourse {
  id: number;
  title: string;
  description: string;
  image_url: string;
  price: number;
  category: string;
  subcategory: string;
  duration: string;
  instructor: string;
  source: string;
  link_url: string;
  is_active: boolean;
  deadline: string | null;
  max_participants: number | null;
}

interface DBActivity {
  id: number;
  title: string;
  description: string;
  image_url: string;
  location: string;
  start_date: string;
  end_date: string;
  category: string;
  subcategory: string;
  max_participants: number;
  source: string;
  link_url: string;
  is_active: boolean;
  deadline: string | null;
}

// Module-level cache — survives client-side navigation within the session
const _camphubCache: {
  posts: DBCourse[];
  done: boolean;
} = { posts: [], done: false };

// Helper function to check if deadline has passed (deadline is end of day)
const isExpired = (deadline: string | null): boolean => {
  if (!deadline) return false;
  const deadlineDate = new Date(deadline);
  // Set to end of day (23:59:59.999)
  deadlineDate.setHours(23, 59, 59, 999);
  return new Date() > deadlineDate;
};

// Sort so that upcoming deadlines appear first, no-deadline next, expired last
const sortByDeadline = <T extends { deadline: string | null }>(items: T[]) => {
  return [...items].sort((a, b) => {
    const aExpired = isExpired(a.deadline);
    const bExpired = isExpired(b.deadline);
    if (aExpired !== bExpired) return aExpired ? 1 : -1; // expired go to the right

    const aHasDeadline = !!a.deadline;
    const bHasDeadline = !!b.deadline;
    if (aHasDeadline && bHasDeadline) {
      return new Date(a.deadline as string).getTime() - new Date(b.deadline as string).getTime();
    }
    if (aHasDeadline !== bHasDeadline) return aHasDeadline ? -1 : 1; // items with deadline first
    return 0;
  });
};

// ── Mini Calendar Sidebar ──────────────────────────────────────────────────
interface CalendarEvent {
  date: string; // YYYY-MM-DD
  title: string;
  link_url: string;
  type: 'deadline' | 'start' | 'end';
  source: string;
  id: number;
}

interface CalendarSidebarProps {
  dbCourses: DBCourse[];
  dbActivities: DBActivity[];
  camphubPosts: DBCourse[];
  loadingCamphub: boolean;
}

const CalendarSidebar = ({ dbCourses, dbActivities, camphubPosts, loadingCamphub }: CalendarSidebarProps) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Build event map: date string → events[]
  const eventMap = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    const addEvent = (date: string | null, title: string, link_url: string, type: CalendarEvent['type'], source: string, id: number) => {
      if (!date) return;
      const d = date.slice(0, 10); // YYYY-MM-DD
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push({ date: d, title, link_url, type, source, id });
    };

    for (const c of dbCourses) {
      if (c.deadline) addEvent(c.deadline, c.title, c.link_url, 'deadline', c.source, c.id);
    }
    for (const a of dbActivities) {
      if (a.deadline) addEvent(a.deadline, a.title, a.link_url, 'deadline', a.source, a.id);
      if (a.start_date) addEvent(a.start_date, a.title, a.link_url, 'start', a.source, a.id);
      if (a.end_date) addEvent(a.end_date, a.title, a.link_url, 'end', a.source, a.id);
    }
    for (const c of camphubPosts) {
      if (c.deadline) addEvent(c.deadline, c.title, c.link_url, 'deadline', c.source, c.id);
    }
    return map;
  }, [dbCourses, dbActivities, camphubPosts]);

  // Days grid for current view month
  const { days, firstWeekday } = useMemo(() => {
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    return { days: daysInMonth, firstWeekday };
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const selectedEvents = selectedDay ? (eventMap.get(selectedDay) ?? []) : [];

  // Upcoming deadlines (not expired, all sorted)
  const upcomingDeadlines = useMemo(() => {
    const all = [
      ...dbCourses.map(c => ({ title: c.title, link_url: c.link_url, deadline: c.deadline, source: c.source, id: c.id })),
      ...dbActivities.map(a => ({ title: a.title, link_url: a.link_url, deadline: a.deadline, source: a.source, id: a.id })),
      ...camphubPosts.map(c => ({ title: c.title, link_url: c.link_url, deadline: c.deadline, source: c.source, id: c.id })),
    ].filter(i => i.deadline && !isExpired(i.deadline));
    all.sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());
    return all;
  }, [dbCourses, dbActivities, camphubPosts]);

  const dotColor = (types: CalendarEvent['type'][]) => {
    if (types.includes('deadline')) return 'bg-orange-400';
    if (types.includes('start')) return 'bg-green-400';
    return 'bg-blue-400';
  };

  return (
    <div className="hidden lg:block w-72 flex-shrink-0">
      <div className="sticky top-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-pink-500" />
          <span className="font-semibold text-gray-700 text-sm">ปฏิทินกิจกรรม</span>
          {loadingCamphub && <Loader2 className="w-3 h-3 text-gray-400 animate-spin ml-auto" />}
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </button>
          <span className="text-xs font-semibold text-gray-700">{monthLabel}</span>
          <button onClick={nextMonth} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <ChevronRight className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Weekday labels */}
        <div className="grid grid-cols-7 text-center">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(d => (
            <span key={d} className="text-[10px] font-medium text-gray-400 pb-1">{d}</span>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1 text-center">
          {/* Leading empty cells */}
          {[...Array(firstWeekday)].map((_, i) => <div key={`empty-${i}`} />)}

          {[...Array(days)].map((_, i) => {
            const day = i + 1;
            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const events = eventMap.get(dateStr) ?? [];
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDay;
            const types = events.map(e => e.type);

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                className={`relative flex flex-col items-center justify-center w-7 h-7 mx-auto rounded-full text-xs font-medium transition-colors
                  ${isSelected ? 'bg-pink-500 text-white' : isToday ? 'bg-pink-100 text-pink-700' : events.length > 0 ? 'hover:bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-100'}`}
              >
                {day}
                {events.length > 0 && !isSelected && (
                  <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${dotColor(types)}`} />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-3 text-[10px] text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />ปิดรับ</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-400 inline-block" />เริ่ม</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />สิ้นสุด</span>
        </div>

        {/* Selected day events */}
        {selectedDay && (
          <div className="space-y-2 border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500">
              {new Date(selectedDay + 'T00:00:00').toLocaleDateString('th-TH', { day: 'numeric', month: 'long' })}
            </p>
            {selectedEvents.length === 0 ? (
              <p className="text-xs text-gray-400">ไม่มีกิจกรรม</p>
            ) : (
              selectedEvents.map((ev, i) => (
                <a
                  key={i}
                  href={ev.link_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group"
                >
                  <span className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${dotColor([ev.type])}`} />
                  <p className="text-xs text-gray-600 group-hover:text-pink-600 line-clamp-2 leading-snug">{ev.title}</p>
                </a>
              ))
            )}
          </div>
        )}

        {/* Upcoming deadlines */}
        {!selectedDay && upcomingDeadlines.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              ใกล้ปิดรับสมัคร ({upcomingDeadlines.length})
            </p>
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {upcomingDeadlines.map((item) => (
                <a
                  key={`cal-${item.source}-${item.id}`}
                  href={item.link_url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 group"
                >
                  <div className="flex-shrink-0 bg-orange-100 text-orange-600 rounded-lg px-2 py-1 text-xs font-semibold text-center min-w-[40px]">
                    {new Date(item.deadline!).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
                  </div>
                  <p className="text-xs text-gray-600 group-hover:text-pink-600 line-clamp-2 leading-snug">{item.title}</p>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StudyPlanPage = () => {
  const t = useTranslations('plan');
  const tNav = useTranslations('nav');
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);

  const [dbCourses, setDbCourses] = useState<DBCourse[]>([]);
  const [dbActivities, setDbActivities] = useState<DBActivity[]>([]);

  // CampHub RSS — stream all pages, hydrate from module cache
  const [camphubPosts, setCamphubPostsRaw] = useState<DBCourse[]>(_camphubCache.posts);
  const [loadingCamphub, setLoadingCamphub] = useState(!_camphubCache.done);
  const streamAbortRef = useRef<AbortController | null>(null);

  const setCamphubPosts = useCallback((updater: DBCourse[] | ((prev: DBCourse[]) => DBCourse[])) => {
    setCamphubPostsRaw((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      _camphubCache.posts = next;
      return next;
    });
  }, []);

  // Unified filter state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (authLoading) return;

      setLoading(true);
      try {
        const [coursesRes, activitiesRes] = await Promise.all([
          fetch('/api/db/courses?is_active=true'),
          fetch('/api/db/activities?is_active=true')
        ]);

        const [coursesData, activitiesData] = await Promise.all([
          coursesRes.json(),
          activitiesRes.json()
        ]);

        setDbCourses(coursesData.data || []);
        setDbActivities(activitiesData.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [authLoading]);

  // Stream all CampHub feed pages — runs once on mount (or when cache is empty)
  useEffect(() => {
    if (_camphubCache.done && _camphubCache.posts.length > 0) {
      // Already have full data from previous navigation
      setLoadingCamphub(false);
      return;
    }

    // Abort any previous stream
    streamAbortRef.current?.abort();
    const abort = new AbortController();
    streamAbortRef.current = abort;

    setCamphubPosts([]);
    _camphubCache.done = false;
    setLoadingCamphub(true);

    (async () => {
      try {
        const res = await fetch('/api/rss/camphub/stream', { signal: abort.signal });
        if (!res.body) return;
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const { items } = JSON.parse(line) as { items: DBCourse[] };
              setCamphubPosts((prev) => {
                const seen = new Set(prev.map((p) => p.link_url));
                return [...prev, ...items.filter((i) => !seen.has(i.link_url))];
              });
            } catch { /* skip malformed line */ }
          }
        }
        _camphubCache.done = true;
      } catch (e: unknown) {
        if (e instanceof Error && e.name !== 'AbortError') {
          console.error('CampHub stream error:', e);
        }
      } finally {
        setLoadingCamphub(false);
      }
    })();

    return () => abort.abort();
  }, [setCamphubPosts]);

  const PlanSkeleton = () => (
    <div className="container mx-auto px-4 pb-24 pt-12">
      {/* Search bar skeleton */}
      <div className="mb-4 h-11 bg-gray-200 rounded-xl animate-pulse" />
      {/* Category pills skeleton */}
      <div className="mb-6 flex flex-wrap gap-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-8 w-24 bg-gray-200 rounded-full animate-pulse" />
        ))}
      </div>
      {/* Card grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
            <div className="w-full h-40 bg-gray-200" />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-gray-200 rounded w-20" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading || authLoading || (loadingCamphub && camphubPosts.length === 0)) {
    return <PlanSkeleton />;
  }

  return (
    <div className="container mx-auto px-4 pb-24 pt-12">
      {/* Activities + CampHub Grid */}
      <section>
        {!authLoading && !user && (
          <div className="mb-6 flex flex-col gap-2 rounded-xl border border-dashed border-pink-200 bg-gradient-to-r from-pink-50 to-purple-50 px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-pink-900">
              <p className="font-semibold">{t('loginForPersonalizedTitle')}</p>
              <p className="text-pink-700/80">{t('loginForPersonalizedSubtitle')}</p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-pink-700"
            >
              {tNav('signIn')}
            </Link>
          </div>
        )}


        {/* Search + Filter bar */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchAll')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-pink-500 transition-colors"
            />
          </div>
        </div>

        {/* Category filter — only show categories that have actual items */}
        {(() => {
          const allItemsForFilter = [
            ...dbCourses,
            ...dbActivities.map((a): DBCourse => ({
              id: a.id, title: a.title, description: a.description, image_url: a.image_url,
              price: 0, category: a.category, subcategory: a.subcategory, duration: '',
              instructor: '', source: a.source, link_url: a.link_url, is_active: a.is_active,
              deadline: a.deadline, max_participants: a.max_participants,
            })),
            ...camphubPosts,
          ];
          const availableCategories = Object.keys(CATEGORY_GROUPS).filter((cat) =>
            allItemsForFilter.some((item) => item.category === cat)
          );
          return (
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${!selectedCategory ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {t('all')}
            </button>
            {availableCategories.map((cat) => {
              const CategoryIcon = getCategoryGroupIcon(cat);
              return (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setSelectedSubcategory(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {CategoryIcon && <CategoryIcon className="w-4 h-4" />}
                  {getCategoryGroupLabel(cat)}
                </button>
              );
            })}
          </div>
          {selectedCategory && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${!selectedSubcategory ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
              >
                {t('all')}
              </button>
              {CATEGORY_GROUPS[selectedCategory]?.items.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setSelectedSubcategory(item.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedSubcategory === item.value ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-600 hover:bg-purple-200'}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
          );
        })()}

        {/* 3-col grid + calendar sidebar */}
        <div className="flex gap-6">
          {/* Cards grid — takes up remaining space */}
          <div className="flex-1 min-w-0">
            {(() => {
              // Build unified filtered list: DB courses → DB activities → CampHub
              const query = searchQuery.toLowerCase();
              const allItems: DBCourse[] = [
                ...dbCourses,
                // map DBActivity → DBCourse shape for unified rendering
                ...dbActivities.map((a): DBCourse => ({
                  id: a.id,
                  title: a.title,
                  description: a.description,
                  image_url: a.image_url,
                  price: 0,
                  category: a.category,
                  subcategory: a.subcategory,
                  duration: '',
                  instructor: '',
                  source: a.source,
                  link_url: a.link_url,
                  is_active: a.is_active,
                  deadline: a.deadline,
                  max_participants: a.max_participants,
                })),
                ...camphubPosts,
              ].filter((item) => {
                if (selectedCategory && item.category !== selectedCategory) return false;
                if (selectedSubcategory && item.subcategory !== selectedSubcategory) return false;
                if (query) {
                  return (
                    item.title.toLowerCase().includes(query) ||
                    item.description.toLowerCase().includes(query)
                  );
                }
                return true;
              });

              if (allItems.length === 0 && loadingCamphub) {
                // Show skeleton grid while initial load
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={`init-sk-${i}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                        <div className="w-full h-40 bg-gray-200" />
                        <div className="p-3 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-20" />
                          <div className="h-4 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              }

              if (allItems.length === 0) {
                return (
                  <div className="bg-gray-50 rounded-xl p-12 text-center text-gray-400">
                    <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p>{searchQuery ? t('noSearchResults') : t('noCoursesYet')}</p>
                  </div>
                );
              }

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {sortByDeadline(allItems).map((item) => {
                      const CategoryIcon = getCategoryGroupIcon(item.category);
                      const expired = isExpired(item.deadline);
                      return (
                        <a
                          key={`${item.source}-${item.id}`}
                          href={item.link_url || '#'}
                          target={item.link_url ? '_blank' : undefined}
                          rel={item.link_url ? 'noopener noreferrer' : undefined}
                          className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer block relative overflow-hidden ${expired ? 'opacity-50' : ''}`}
                        >
                          {expired && (
                            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full z-10">
                              {t('closed')}
                            </div>
                          )}
                          {item.image_url ? (
                            <Image
                              src={item.image_url}
                              alt={item.title}
                              className={`w-full h-40 object-cover ${expired ? 'grayscale' : ''}`}
                              width={400}
                              height={160}
                            />
                          ) : (
                            <div className={`w-full h-40 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center ${expired ? 'grayscale' : ''}`}>
                              <BookOpen className="w-12 h-12 text-pink-300" />
                            </div>
                          )}
                          <div className="p-3 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                                {CategoryIcon && <CategoryIcon className="w-3 h-3" />}
                                {getCategoryGroupLabel(item.category)}
                              </span>
                              {item.source === 'camphub' && (
                                <Image src="/camphub.png" alt="CampHub" width={50} height={16} className="w-auto h-4" />
                              )}
                              {item.source === 'contester' && (
                                <Image src="/contester.svg" alt="Contester" width={50} height={16} className="w-auto h-4" />
                              )}
                            </div>
                            {item.subcategory && (
                              <p className="text-xs text-purple-600">{getCategoryLabel(item.subcategory)}</p>
                            )}
                            <h3 className="font-semibold text-gray-800 line-clamp-2 text-sm leading-snug">{item.title}</h3>
                            <p className="text-xs text-gray-500 line-clamp-2">{item.description}</p>
                            {item.deadline && (
                              <p className={`text-xs flex items-center gap-1 ${expired ? 'text-red-500' : 'text-orange-500'}`}>
                                <CalendarDays className="w-3 h-3" />
                                {t('deadline')}: {new Date(item.deadline).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            )}
                            {item.max_participants && (
                              <p className="text-xs text-orange-500 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {t('limitedTo')} {item.max_participants} {t('people')}
                              </p>
                            )}
                            <div className="flex items-center justify-between pt-1">
                              <p className="text-pink-600 font-bold">
                                {Number(item.price) === 0 ? t('free') : `฿${Number(item.price).toLocaleString()}`}
                              </p>
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <ExternalLink className="w-3 h-3" />
                                {t('viewMore')}
                              </span>
                            </div>
                          </div>
                        </a>
                      );
                    })}

                    {/* Skeleton placeholders appended while stream is still coming in */}
                    {loadingCamphub && [...Array(4)].map((_, i) => (
                      <div key={`sk-${i}`} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
                        <div className="w-full h-40 bg-gray-200" />
                        <div className="p-3 space-y-2">
                          <div className="h-3 bg-gray-200 rounded w-20" />
                          <div className="h-4 bg-gray-200 rounded w-full" />
                          <div className="h-3 bg-gray-200 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {loadingCamphub && (
                    <div className="flex items-center justify-center gap-2 py-4 text-sm text-gray-400">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังโหลดกิจกรรมทั้งหมด...
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Calendar sidebar */}
          <CalendarSidebar
            dbCourses={dbCourses}
            dbActivities={dbActivities}
            camphubPosts={camphubPosts}
            loadingCamphub={loadingCamphub}
          />
        </div>

      </section>
      </div>

  );
};

export default StudyPlanPage;
