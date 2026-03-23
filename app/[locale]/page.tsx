"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/routing";
import { useTranslations, useLocale } from "next-intl";
import { examCountdowns, ExamCountdown } from "@/lib/exam-config";
import { CalendarRange, Brain, Palette, GraduationCap, FileText, Users, ArrowRight, Settings, ChevronRight, ChevronLeft } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import ForYouWidget from "@/components/recommendations/ForYouWidget";
import ACTBanner from "@/components/schools/ACTBanner";
import { parseISO, format } from "date-fns";

type Banner = {
  id: number;
  title?: string;
  image_url: string;
  link_url?: string;
};

export default function HomePage() {
  const t = useTranslations("home");
  const locale = useLocale();
  const isEn = locale === "en";
  const { user } = useAuth();
  const [now, setNow] = useState<number>(Date.now());
  const [banners, setBanners] = useState<Banner[]>([]);
  const bannersRowRef = useRef<HTMLDivElement>(null);
  const [userInterestedFaculties, setUserInterestedFaculties] = useState<any[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(true);
  const [trackedCalendarEvents, setTrackedCalendarEvents] = useState<string[]>([]);
  const countdownCarouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Load tracked calendar events from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("calendar_tracked_events");
    if (saved) {
      try { setTrackedCalendarEvents(JSON.parse(saved)); } catch {}
    }
    // Listen for changes (when calendar page updates)
    const onStorage = (e: StorageEvent) => {
      if (e.key === "calendar_tracked_events" && e.newValue) {
        try { setTrackedCalendarEvents(JSON.parse(e.newValue)); } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Fetch banners from API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await fetch("/api/db/banners?is_active=true");
        const data = await res.json();
        if (Array.isArray(data.data) && data.data.length > 0) {
          setBanners(data.data);
        }
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };
    fetchBanners();
  }, []);

  // Fetch user's interested faculties from database
  useEffect(() => {
    const fetchInterestedFaculties = async () => {
      if (!user) {
        setLoadingFaculties(false);
        return;
      }

      try {
        const res = await fetch(`/api/db/interested-faculties?user_id=${user.id}`);
        const data = await res.json();
        if (data && Array.isArray(data) && data.length > 0) {
          setUserInterestedFaculties(data);
        }
      } catch (error) {
        console.error("Error fetching interested faculties:", error);
      } finally {
        setLoadingFaculties(false);
      }
    };

    fetchInterestedFaculties();
  }, [user]);

  const bannerItems: Banner[] = banners;

  const scrollBanners = (direction: "left" | "right") => {
    if (!bannersRowRef.current) return;
    const width = bannersRowRef.current.clientWidth || 800;
    bannersRowRef.current.scrollBy({
      left: direction === "left" ? -width : width,
      behavior: "smooth",
    });
  };

  // TCAS_EVENTS data (mirrors Calendar.tsx - just the shape needed for countdown)
  const TCAS_EVENTS_MINI = [
    { id: "cu-portfolio", name: "จุฬาฯ Portfolio", startDate: "2026-11-03", endDate: "2026-11-17" },
    { id: "cu-quota", name: "จุฬาฯ Quota", startDate: "2027-02-12", endDate: "2027-02-23" },
    { id: "cu-admission", name: "จุฬาฯ Admission", startDate: "2027-05-06", endDate: "2027-05-12" },
    { id: "ku-portfolio-1", name: "เกษตร Portfolio รอบ 1", startDate: "2026-10-15", endDate: "2026-11-15" },
    { id: "ku-portfolio-2", name: "เกษตร Portfolio รอบ 2", startDate: "2026-12-19", endDate: "2027-01-15" },
    { id: "ku-quota", name: "เกษตร Quota", startDate: "2027-02-13", endDate: "2027-03-12" },
    { id: "ku-admission", name: "เกษตร Admission", startDate: "2027-05-06", endDate: "2027-05-12" },
    { id: "kku-portfolio-1", name: "ขอนแก่น Portfolio รอบ 1", startDate: "2026-10-01", endDate: "2026-10-10" },
    { id: "kku-quota", name: "ขอนแก่น Quota", startDate: "2027-03-02", endDate: "2027-03-11" },
    { id: "tu-portfolio", name: "ธรรมศาสตร์ Portfolio", startDate: "2026-10-15", endDate: "2026-11-17" },
    { id: "tu-quota-regular", name: "ธรรมศาสตร์ Quota", startDate: "2027-03-02", endDate: "2027-03-17" },
    { id: "tu-admission", name: "ธรรมศาสตร์ Admission", startDate: "2027-05-06", endDate: "2027-05-12" },
    { id: "mu-portfolio-1", name: "มหิดล Portfolio รอบ 1", startDate: "2026-10-01", endDate: "2026-10-16" },
    { id: "mu-quota", name: "มหิดล Quota", startDate: "2027-03-20", endDate: "2027-04-08" },
    { id: "mu-admission", name: "มหิดล Admission", startDate: "2027-05-06", endDate: "2027-05-12" },
    { id: "kmutt-portfolio", name: "มจธ. Portfolio", startDate: "2026-10-28", endDate: "2026-10-28" },
    { id: "kmutt-admission", name: "มจธ. Admission", startDate: "2027-05-06", endDate: "2027-05-12" },
    { id: "sut-quota", name: "มทส. Quota", startDate: "2027-03-02", endDate: "2027-04-07" },
    { id: "swu-portfolio", name: "มศว Portfolio", startDate: "2026-11-11", endDate: "2026-12-11" },
    { id: "psu-portfolio-1", name: "ม.อ. Portfolio รอบ 1", startDate: "2026-10-01", endDate: "2026-11-06" },
    { id: "mfu-portfolio-1", name: "มฟล. Portfolio รอบ 1", startDate: "2026-09-10", endDate: "2026-09-30" },
  ];

  // Build countdown cards: use tracked calendar events if any, otherwise fallback to examCountdowns
  const countdownCards = useMemo(() => {
    let items: { id: string; label: string; targetDate: string }[] = [];

    if (trackedCalendarEvents.length > 0) {
      // Show tracked TCAS events as countdowns (sorted by date, upcoming first)
      const today = new Date();
      const tracked = TCAS_EVENTS_MINI
        .filter((e) => trackedCalendarEvents.includes(e.id) && parseISO(e.endDate) >= today)
        .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());

      // Also include already-ended tracked ones as "completed"
      const completedTracked = TCAS_EVENTS_MINI
        .filter((e) => trackedCalendarEvents.includes(e.id) && parseISO(e.endDate) < today)
        .sort((a, b) => parseISO(b.endDate).getTime() - parseISO(a.endDate).getTime())
        .slice(0, 2);

      items = [
        ...tracked.map((e) => ({ id: e.id, label: e.name, targetDate: e.startDate })),
        ...completedTracked.map((e) => ({ id: e.id, label: e.name, targetDate: e.endDate })),
      ];
    }

    // Fallback to hardcoded examCountdowns if nothing tracked
    if (items.length === 0) {
      items = examCountdowns.map((e) => ({ id: e.id, label: e.label, targetDate: e.targetDate }));
    }

    return items.map((exam) => {
      const diff = Math.max(new Date(exam.targetDate).getTime() - now, 0);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const completed = diff <= 0;
      return { ...exam, days, hours, completed };
    });
  }, [trackedCalendarEvents, now]);

  const useCarousel = countdownCards.length > 4;
  const scrollCountdown = (dir: "left" | "right") => {
    if (!countdownCarouselRef.current) return;
    countdownCarouselRef.current.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  const getLocalizedValue = (item: any, thKey: string, enKey: string) => {
    const thValue = item?.[thKey];
    const enValue = item?.[enKey];
    return isEn ? (enValue || thValue || "") : (thValue || enValue || "");
  };

  const getProgramName = (item: any) =>
    getLocalizedValue(item, "program_name_th", "program_name_en")
    || getLocalizedValue(item, "field_name_th", "field_name_en")
    || getLocalizedValue(item, "faculty_name_th", "faculty_name_en");

  const getUniversityName = (item: any) =>
    getLocalizedValue(item, "university_name_th", "university_name_en");

  const topDreamPrograms = useMemo(
    () =>
      [...userInterestedFaculties]
        .sort((a, b) => (a.priority ?? Number.MAX_SAFE_INTEGER) - (b.priority ?? Number.MAX_SAFE_INTEGER))
        .slice(0, 3),
    [userInterestedFaculties]
  );

  // ACT school system: detect act.ac.th email and extract student ID
  const isACTUser = Boolean(user?.email && user.email.includes("act.ac.th"));
  const actStudentId = isACTUser
    ? user!.email!.split("@")[0]
    : undefined;

  return (
    <div className="flex flex-col items-center justify-center gap-6 px-4 pt-12 pb-24 md:max-w-screen-xl mx-auto">
      {/* ACT School System - ด้านบนสุด เห็นเฉพาะ act.ac.th */}
      {isACTUser && (
        <div className="w-full">
          <ACTBanner studentId={actStudentId} />
        </div>
      )}

      {/* Hero + Countdown CTA */}
      <div className="w-full rounded-3xl bg-[#f8fafc] border border-gray-200 shadow-sm px-5 sm:px-8 py-10 sm:py-14">
        <div className="mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-14">
          {/* LEFT */}
          <div className="w-full lg:w-1/2 text-center lg:text-left space-y-4 sm:space-y-5">
            <div className="inline-flex items-center gap-3 bg-white px-3 py-2 rounded-full shadow-sm border border-gray-100">
              <Image
                src="/doodee_logo.png"
                alt="Doodee Future"
                width={32}
                height={32}
                className="w-7 h-7 sm:w-8 sm:h-8"
              />
              <span className="text-xs sm:text-sm font-semibold text-gray-700">
                Doodee Future · Future Planning
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {t("heroTitle")}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-xl mx-auto lg:mx-0">
              {t("heroSubtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                href={"/analyse"}
                className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white px-7 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold shadow-lg hover:shadow-xl transition text-base sm:text-lg"
              >
                {t("heroPrimaryCta")}
              </Link>

              <Link
                href={"/faculty"}
                className="bg-white text-pink-600 px-6 py-3 rounded-xl font-semibold border-2 border-pink-200 hover:bg-pink-50 transition text-sm sm:text-base"
              >
                {t("heroSecondaryCta")}
              </Link>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex flex-col gap-2">
            {/* Header with edit link */}
            <div className="flex items-center justify-between px-0.5">
              <span className="text-xs text-gray-400 font-medium">
                {trackedCalendarEvents.length > 0
                  ? (isEn ? "From your calendar" : "จากปฏิทินที่ติดตาม")
                  : (isEn ? "TCAS Countdowns" : "นับถอยหลัง TCAS")}
              </span>
              <Link
                href="/calendar"
                className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-700 font-medium transition"
              >
                <Settings className="w-3 h-3" />
                {isEn ? "Edit" : "แก้ไข"}
              </Link>
            </div>

            {/* Cards - carousel if > 4, grid if ≤ 4 */}
            {useCarousel ? (
              <div className="relative">
                <button onClick={() => scrollCountdown("left")} className="absolute -left-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:bg-gray-50">
                  <ChevronLeft className="w-4 h-4 text-gray-500" />
                </button>
                <div ref={countdownCarouselRef} className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth px-0.5 pb-1">
                  {countdownCards.map((exam) => (
                    <div
                      key={exam.id}
                      className={`shrink-0 w-[130px] rounded-2xl border p-4 flex flex-col items-center justify-center text-center transition-shadow hover:shadow-md ${
                        exam.completed ? "bg-gray-50 border-gray-200" : "bg-gradient-to-br from-pink-50 to-white border-pink-200 shadow-sm"
                      }`}
                    >
                      {exam.completed ? (
                        <div className="text-sm font-semibold text-gray-400">{t("countdownDone")}</div>
                      ) : (
                        <>
                          <div className="text-3xl font-extrabold text-pink-500 leading-none">{exam.days}</div>
                          <div className="text-xs text-gray-500 mt-1">{t("countdownSub", { hours: exam.hours })}</div>
                        </>
                      )}
                      <span className={`mt-2 text-xs font-semibold leading-tight ${exam.completed ? "text-gray-400" : "text-gray-700"}`}>
                        {exam.label}
                      </span>
                    </div>
                  ))}
                </div>
                <button onClick={() => scrollCountdown("right")} className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:bg-gray-50">
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-3">
                {countdownCards.map((exam) => (
                  <div
                    key={exam.id}
                    className={`relative rounded-2xl border p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-shadow hover:shadow-md ${
                      exam.completed ? "bg-gray-50 border-gray-200" : "bg-gradient-to-br from-pink-50 to-white border-pink-200 shadow-sm"
                    }`}
                  >
                    {exam.completed ? (
                      <div className="text-sm font-semibold text-gray-400">{t("countdownDone")}</div>
                    ) : (
                      <>
                        <div className="text-3xl sm:text-4xl font-extrabold text-pink-500 leading-none">{exam.days}</div>
                        <div className="text-xs sm:text-sm text-gray-500 mt-1">{t("countdownSub", { hours: exam.hours })}</div>
                      </>
                    )}
                    <span className={`mt-2 text-xs sm:text-sm font-semibold leading-tight ${exam.completed ? "text-gray-400" : "text-gray-700"}`}>
                      {exam.label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mock Exam CTA - prominent */}
      <Link
        href="/mock-exam"
        className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {t("menuMockExam")}
            </h2>
            <p className="text-sm sm:text-base text-white/80 mt-1">
              {t("menuMockExamDesc")}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-5 py-3 rounded-xl text-white font-semibold transition shrink-0">
            {t("menuMockExamCta")}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>

      {/* Quick CTA menu */}
      <div className="w-full grid grid-cols-3 sm:grid-cols-6 gap-3">
        {[
          { label: t("menuAnalyse"), href: "/analyse", icon: Brain, color: "bg-pink-500", border: "hover:border-pink-300" },
          { label: t("menuCourseAndCamp"), href: "/course", icon: GraduationCap, color: "bg-amber-500", border: "hover:border-amber-300" },
          { label: t("menuMockExamShort"), href: "/mock-exam", icon: FileText, color: "bg-indigo-500", border: "hover:border-indigo-300" },
          { label: t("menuCommunity"), href: "/community", icon: Users, color: "bg-teal-500", border: "hover:border-teal-300" },
          { label: t("menuCalendar"), href: "/calendar", icon: CalendarRange, color: "bg-rose-500", border: "hover:border-rose-300" },
          { label: t("menuTemplates"), href: "/port", icon: Palette, color: "bg-purple-500", border: "hover:border-purple-300" },
        ].map((cta) => (
          <Link
            key={cta.href}
            href={cta.href}
            className={`w-full aspect-square bg-white border border-gray-200 shadow-sm rounded-2xl flex flex-col items-center justify-center gap-2 text-sm font-semibold text-gray-800 ${cta.border} hover:shadow-md hover:-translate-y-1 transition-all duration-200`}
          >
            <div className={`w-12 h-12 rounded-full ${cta.color} flex items-center justify-center shadow-sm`}>
              <cta.icon className="w-6 h-6 text-white" />
            </div>
            <span className="px-3 text-center leading-tight text-xs sm:text-sm">{cta.label}</span>
          </Link>
        ))}
      </div>

      {/* Announcements */}
      <div className="w-full mt-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold text-gray-900">
            {t("announcements")}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => scrollBanners("left")}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-100 shadow-sm"
              aria-label="Previous banner"
            >
              ←
            </button>
            <button
              onClick={() => scrollBanners("right")}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-100 shadow-sm"
              aria-label="Next banner"
            >
              →
            </button>
          </div>
        </div>

        <div className="relative w-full">
          {bannerItems.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-600">
              {t("noAnnouncements")}
            </div>
          ) : (
            <div
              ref={bannersRowRef}
              className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-2"
            >
              {bannerItems.map((banner) => (
                <a
                  key={banner.id}
                  href={banner.link_url || "#"}
                  target={banner.link_url ? "_blank" : undefined}
                  rel={banner.link_url ? "noopener noreferrer" : undefined}
                  className="snap-start flex-shrink-0 basis-[85%] sm:basis-[48%] lg:basis-[32%] xl:basis-[24%] max-w-[85%] sm:max-w-[48%] lg:max-w-[32%] xl:max-w-[24%]"
                >
                  <div className="relative w-full aspect-[16/9] bg-gray-900 rounded-2xl overflow-hidden shadow">
                    <Image
                      src={banner.image_url}
                      alt={banner.title || "banner"}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, (max-width: 1280px) 32vw, 24vw"
                      priority
                    />
                    {banner.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white px-3 py-2">
                        <p className="text-xs sm:text-sm font-semibold line-clamp-2">
                          {banner.title}
                        </p>
                      </div>
                    )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* For You Recommendations - Only show if user is logged in */}
      {user && (
        <div className="w-full">
          <ForYouWidget limit={6} type="both" />
        </div>
      )}

      {/* Dream Faculty / My Calendar */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {t("dreamTitle")}
            </h2>
            <p className="text-sm text-gray-500">
              {topDreamPrograms.length > 0
                ? t("dreamSubtitleWithCount", { count: topDreamPrograms.length })
                : t("dreamSubtitleEmpty")}
            </p>
          </div>
        </div>

        {loadingFaculties ? (
          <div className="text-center py-8 text-gray-500">
            <div className="animate-pulse">{t("loading")}</div>
          </div>
        ) : topDreamPrograms.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x snap-mandatory">
            {topDreamPrograms.map((program: any, index: number) => (
              <div
                key={program.id}
                className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] bg-gradient-to-br from-white to-pink-50 border border-pink-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">
                    #{index + 1}
                  </p>
                  <p className="text-xs font-semibold text-pink-700">
                    {isEn ? "Priority" : "ลำดับ"} {program.priority ?? index + 1}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{getUniversityName(program)}</p>
                <h3 className="text-lg font-semibold text-gray-900">
                  {getProgramName(program)}
                </h3>
                <p className="text-xs text-pink-700 mt-1 line-clamp-1">
                  {getLocalizedValue(program, "faculty_name_th", "faculty_name_en")}
                </p>

                <div className="mt-3 space-y-2 text-sm text-gray-700">
                  {(program.r1_admission_quota > 0 || program.program_total_seats > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {program.r1_admission_quota > 0 && (
                        <span className="px-3 py-1 bg-white border border-pink-100 text-pink-700 rounded-full text-xs font-semibold">
                          {isEn ? "Round 1" : "รอบ 1"}: {program.r1_admission_quota} {isEn ? "seats" : "คน"}
                        </span>
                      )}
                      {program.program_total_seats > 0 && (
                        <span className="px-3 py-1 bg-white border border-gray-200 text-gray-700 rounded-full text-xs font-semibold">
                          {isEn ? "Total" : "รวม"}: {program.program_total_seats} {isEn ? "seats" : "คน"}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Link
                  href="/calendar"
                  className="mt-4 inline-block w-full text-center bg-pink-600 hover:bg-pink-700 text-white font-semibold py-2 rounded-lg transition text-sm"
                >
                  {isEn ? "View calendar" : "ดูปฏิทิน"}
                </Link>
              </div>
            ))}

            {/* Add more button */}
            <Link href={"/profile/faculty"}>
              <div className="snap-start flex-shrink-0 w-[280px] sm:w-[320px] border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center hover:border-pink-400 hover:bg-pink-50/50 transition-all cursor-pointer group min-h-[300px]">
                <GraduationCap className="w-10 h-10 text-gray-400 mb-3 group-hover:text-pink-500 transition" />
                <h3 className="text-base font-semibold text-gray-700 mb-2 group-hover:text-pink-700 transition text-center">
                  {t("addInterestTitle")}
                </h3>
                <p className="text-xs text-gray-500 text-center">
                  {t("addInterestSubtitle")}
                </p>
              </div>
            </Link>
          </div>
        ) : (
          <div className="w-full border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
              <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3 group-hover:text-pink-500 transition" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2 group-hover:text-pink-700 transition">
                {t("noInterestTitle")}
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                {t("noInterestSubtitle")}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href="/profile/faculty"
                  className="inline-flex items-center justify-center px-6 py-3 bg-pink-600 text-white font-semibold rounded-xl shadow-sm hover:bg-pink-700 transition"
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  {isEn ? "Go to profile/faculty" : "ไปที่ profile/faculty"}
                </Link>
                <Link
                  href="/faculty"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-pink-700 border border-pink-200 font-semibold rounded-xl hover:bg-pink-50 transition"
                >
                  {isEn ? "Open faculty page" : "ไปหน้าเลือกคณะ"}
                </Link>
              </div>
            </div>
        )}
      </div>
    </div>
  );
}
