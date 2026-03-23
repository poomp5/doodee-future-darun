"use client";

import { useEffect, useMemo, useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isWithinInterval,
  parseISO,
  eachDayOfInterval,
} from "date-fns";
import { th, enUS } from "date-fns/locale";
import { useAuth } from "@/components/AuthProvider";
import { useLocale } from "next-intl";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Search,
  GripVertical,
  CalendarPlus,
  X,
  Check,
} from "lucide-react";

const TCAS_EVENTS = [
  { id: "cu-portfolio", name: "จุฬาฯ Portfolio", university: "จุฬาลงกรณ์มหาวิทยาลัย", startDate: "2026-11-03", endDate: "2026-11-17", color: "#ec4899" },
  { id: "cu-quota", name: "จุฬาฯ Quota", university: "จุฬาลงกรณ์มหาวิทยาลัย", startDate: "2027-02-12", endDate: "2027-02-23", color: "#ec4899" },
  { id: "cu-admission", name: "จุฬาฯ Admission", university: "จุฬาลงกรณ์มหาวิทยาลัย", startDate: "2027-05-06", endDate: "2027-05-12", color: "#ec4899" },
  { id: "ku-portfolio-1", name: "เกษตร Portfolio รอบ 1", university: "มหาวิทยาลัยเกษตรศาสตร์", startDate: "2026-10-15", endDate: "2026-11-15", color: "#16a34a" },
  { id: "ku-portfolio-2", name: "เกษตร Portfolio รอบ 2", university: "มหาวิทยาลัยเกษตรศาสตร์", startDate: "2026-12-19", endDate: "2027-01-15", color: "#16a34a" },
  { id: "ku-quota", name: "เกษตร Quota", university: "มหาวิทยาลัยเกษตรศาสตร์", startDate: "2027-02-13", endDate: "2027-03-12", color: "#16a34a" },
  { id: "ku-admission", name: "เกษตร Admission", university: "มหาวิทยาลัยเกษตรศาสตร์", startDate: "2027-05-06", endDate: "2027-05-12", color: "#16a34a" },
  { id: "kku-portfolio-1", name: "ขอนแก่น Portfolio รอบ 1", university: "มหาวิทยาลัยขอนแก่น", startDate: "2026-10-01", endDate: "2026-10-10", color: "#b91c1c" },
  { id: "kku-portfolio-2", name: "ขอนแก่น Portfolio รอบ 2", university: "มหาวิทยาลัยขอนแก่น", startDate: "2026-12-22", endDate: "2026-12-27", color: "#b91c1c" },
  { id: "kku-quota", name: "ขอนแก่น Quota", university: "มหาวิทยาลัยขอนแก่น", startDate: "2027-03-02", endDate: "2027-03-11", color: "#b91c1c" },
  { id: "kku-admission", name: "ขอนแก่น Admission", university: "มหาวิทยาลัยขอนแก่น", startDate: "2027-05-06", endDate: "2027-05-12", color: "#b91c1c" },
  { id: "tu-portfolio", name: "ธรรมศาสตร์ Portfolio", university: "มหาวิทยาลัยธรรมศาสตร์", startDate: "2026-10-15", endDate: "2026-11-17", color: "#ca8a04" },
  { id: "tu-quota-special", name: "ธรรมศาสตร์ Quota ช้างเผือก", university: "มหาวิทยาลัยธรรมศาสตร์", startDate: "2027-01-06", endDate: "2027-01-20", color: "#ca8a04" },
  { id: "tu-quota-regular", name: "ธรรมศาสตร์ Quota ปกติ", university: "มหาวิทยาลัยธรรมศาสตร์", startDate: "2027-03-02", endDate: "2027-03-17", color: "#ca8a04" },
  { id: "tu-admission", name: "ธรรมศาสตร์ Admission", university: "มหาวิทยาลัยธรรมศาสตร์", startDate: "2027-05-06", endDate: "2027-05-12", color: "#ca8a04" },
  { id: "mu-portfolio-1", name: "มหิดล Portfolio รอบ 1", university: "มหาวิทยาลัยมหิดล", startDate: "2026-10-01", endDate: "2026-10-16", color: "#2563eb" },
  { id: "mu-portfolio-2", name: "มหิดล Portfolio รอบ 2", university: "มหาวิทยาลัยมหิดล", startDate: "2026-12-01", endDate: "2027-01-08", color: "#2563eb" },
  { id: "mu-quota", name: "มหิดล Quota", university: "มหาวิทยาลัยมหิดล", startDate: "2027-03-20", endDate: "2027-04-08", color: "#2563eb" },
  { id: "mu-admission", name: "มหิดล Admission", university: "มหาวิทยาลัยมหิดล", startDate: "2027-05-06", endDate: "2027-05-12", color: "#2563eb" },
  { id: "kmutt-early", name: "มจธ. Early", university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี", startDate: "2026-10-17", endDate: "2026-10-17", color: "#ea580c" },
  { id: "kmutt-portfolio", name: "มจธ. Portfolio", university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี", startDate: "2026-10-28", endDate: "2026-10-28", color: "#ea580c" },
  { id: "kmutt-quota", name: "มจธ. Quota", university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี", startDate: "2027-02-12", endDate: "2027-02-12", color: "#ea580c" },
  { id: "kmutt-admission", name: "มจธ. Admission", university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี", startDate: "2027-05-06", endDate: "2027-05-12", color: "#ea580c" },
  { id: "kmutt-direct", name: "มจธ. Direct", university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าธนบุรี", startDate: "2027-05-28", endDate: "2027-06-01", color: "#ea580c" },
  { id: "kmutnb-portfolio", name: "มจพ. Portfolio", university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ", startDate: "2026-09-21", endDate: "2026-09-21", color: "#dc2626" },
  { id: "kmutnb-quota", name: "มจพ. Quota", university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ", startDate: "2026-10-10", endDate: "2026-10-10", color: "#dc2626" },
  { id: "kmutnb-admission", name: "มจพ. Admission", university: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ", startDate: "2027-05-06", endDate: "2027-05-12", color: "#dc2626" },
  { id: "sut-portfolio-1", name: "มทส. Portfolio รอบ 1", university: "มหาวิทยาลัยเทคโนโลยีสุรนารี", startDate: "2026-09-01", endDate: "2026-09-19", color: "#92400e" },
  { id: "sut-portfolio-2", name: "มทส. Portfolio รอบ 2", university: "มหาวิทยาลัยเทคโนโลยีสุรนารี", startDate: "2026-11-14", endDate: "2026-12-19", color: "#92400e" },
  { id: "sut-quota", name: "มทส. Quota", university: "มหาวิทยาลัยเทคโนโลยีสุรนารี", startDate: "2027-03-02", endDate: "2027-04-07", color: "#92400e" },
  { id: "sut-admission", name: "มทส. Admission", university: "มหาวิทยาลัยเทคโนโลยีสุรนารี", startDate: "2027-05-06", endDate: "2027-05-12", color: "#92400e" },
  { id: "swu-portfolio", name: "มศว Portfolio", university: "มหาวิทยาลัยศรีนครินทรวิโรฒ", startDate: "2026-11-11", endDate: "2026-12-11", color: "#e11d48" },
  { id: "swu-quota", name: "มศว Quota", university: "มหาวิทยาลัยศรีนครินทรวิโรฒ", startDate: "2027-02-11", endDate: "2027-02-26", color: "#e11d48" },
  { id: "swu-admission", name: "มศว Admission", university: "มหาวิทยาลัยศรีนครินทรวิโรฒ", startDate: "2027-05-06", endDate: "2027-05-12", color: "#e11d48" },
  { id: "sil-portfolio-1", name: "ศิลปากร Portfolio รอบ 1", university: "มหาวิทยาลัยศิลปากร", startDate: "2026-10-14", endDate: "2026-10-30", color: "#7c3aed" },
  { id: "sil-portfolio-2", name: "ศิลปากร Portfolio รอบ 2", university: "มหาวิทยาลัยศิลปากร", startDate: "2026-12-08", endDate: "2026-12-25", color: "#7c3aed" },
  { id: "sil-quota", name: "ศิลปากร Quota", university: "มหาวิทยาลัยศิลปากร", startDate: "2027-02-17", endDate: "2027-03-05", color: "#7c3aed" },
  { id: "sil-admission", name: "ศิลปากร Admission", university: "มหาวิทยาลัยศิลปากร", startDate: "2027-05-06", endDate: "2027-05-12", color: "#7c3aed" },
  { id: "psu-portfolio-1", name: "ม.อ. Portfolio รอบ 1", university: "มหาวิทยาลัยสงขลานครินทร์", startDate: "2026-10-01", endDate: "2026-11-06", color: "#3b82f6" },
  { id: "psu-portfolio-2", name: "ม.อ. Portfolio รอบ 2", university: "มหาวิทยาลัยสงขลานครินทร์", startDate: "2026-12-01", endDate: "2026-12-22", color: "#3b82f6" },
  { id: "psu-quota", name: "ม.อ. Quota", university: "มหาวิทยาลัยสงขลานครินทร์", startDate: "2027-03-03", endDate: "2027-03-25", color: "#3b82f6" },
  { id: "psu-admission", name: "ม.อ. Admission", university: "มหาวิทยาลัยสงขลานครินทร์", startDate: "2027-05-06", endDate: "2027-05-12", color: "#3b82f6" },
  { id: "mfu-portfolio-1", name: "มฟล. Portfolio รอบ 1", university: "มหาวิทยาลัยแม่ฟ้าหลวง", startDate: "2026-09-10", endDate: "2026-09-30", color: "#991b1b" },
  { id: "mfu-portfolio-2", name: "มฟล. Portfolio รอบ 2", university: "มหาวิทยาลัยแม่ฟ้าหลวง", startDate: "2026-11-04", endDate: "2026-11-24", color: "#991b1b" },
  { id: "mfu-quota-1", name: "มฟล. Quota รอบ 1", university: "มหาวิทยาลัยแม่ฟ้าหลวง", startDate: "2027-02-12", endDate: "2027-02-25", color: "#991b1b" },
  { id: "mfu-admission", name: "มฟล. Admission", university: "มหาวิทยาลัยแม่ฟ้าหลวง", startDate: "2027-05-06", endDate: "2027-05-12", color: "#991b1b" },
  { id: "ssru-portfolio-1", name: "สวนสุนันทา Portfolio รอบ 1", university: "มหาวิทยาลัยราชภัฏสวนสุนันทา", startDate: "2026-08-15", endDate: "2026-08-31", color: "#db2777" },
  { id: "ssru-quota", name: "สวนสุนันทา Quota", university: "มหาวิทยาลัยราชภัฏสวนสุนันทา", startDate: "2027-01-08", endDate: "2027-03-31", color: "#db2777" },
  { id: "ssru-admission", name: "สวนสุนันทา Admission", university: "มหาวิทยาลัยราชภัฏสวนสุนันทา", startDate: "2027-05-06", endDate: "2027-05-12", color: "#db2777" },
  { id: "rmutt-portfolio", name: "มทร.ธัญบุรี Portfolio", university: "มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี", startDate: "2026-10-28", endDate: "2026-12-08", color: "#15803d" },
  { id: "rmutt-quota", name: "มทร.ธัญบุรี Quota", university: "มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี", startDate: "2027-02-12", endDate: "2027-03-16", color: "#15803d" },
  { id: "rmutt-admission", name: "มทร.ธัญบุรี Admission", university: "มหาวิทยาลัยเทคโนโลยีราชมงคลธัญบุรี", startDate: "2027-05-06", endDate: "2027-05-12", color: "#15803d" },
];

type PopoverEvent = typeof TCAS_EVENTS[0] & { isTracked: boolean };

const WEEK_DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const WEEK_DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Max event rows per day cell before "+N more"
const MAX_VISIBLE = 3;

export default function Calendar() {
  const { user } = useAuth();
  const locale = useLocale();
  const isEn = locale === "en";
  const dfLocale = isEn ? enUS : th;

  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 9, 1)); // Oct 2026 - first events
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [popoverEvent, setPopoverEvent] = useState<PopoverEvent | null>(null);
  const [trackedEvents, setTrackedEvents] = useState<string[]>([]);
  const [showTrackedOnly, setShowTrackedOnly] = useState(false);
  const [search, setSearch] = useState("");
  const [uniFilter, setUniFilter] = useState("all");
  const [todoList, setTodoList] = useState<any[]>([]);
  const [todoLoading, setTodoLoading] = useState(false);
  const [newTodo, setNewTodo] = useState("");

  const txt = {
    today: isEn ? "Today" : "วันนี้",
    showTracked: isEn ? "Following only" : "ที่ติดตาม",
    showAll: isEn ? "Show all" : "ทั้งหมด",
    searchPlaceholder: isEn ? "Search..." : "ค้นหา...",
    allUni: isEn ? "All universities" : "ทุกมหาวิทยาลัย",
    noEvents: isEn ? "No events" : "ไม่มีกิจกรรม",
    follow: isEn ? "Follow" : "ติดตาม",
    unfollow: isEn ? "Unfollow" : "เลิกติดตาม",
    open: isEn ? "Open now" : "เปิดรับสมัคร",
    myTodos: isEn ? "My To-dos" : "รายการของฉัน",
    addPlaceholder: isEn ? "Add task..." : "เพิ่มรายการ...",
    notLoggedIn: isEn ? "Sign in to use" : "ล็อกอินเพื่อใช้งาน",
    loading: isEn ? "Loading..." : "กำลังโหลด...",
    noTodos: isEn ? "No tasks yet" : "ยังไม่มีรายการ",
    dragHint: isEn ? "Drag tasks to calendar" : "ลากรายการลงปฏิทินได้",
    more: (n: number) => isEn ? `+${n} more` : `+${n} เพิ่มเติม`,
    upcoming: isEn ? "Upcoming" : "กำลังจะมาถึง",
    scheduled: (d: string) => isEn ? `Scheduled: ${d}` : `จัดตาราง: ${d}`,
  };

  // Load tracked events
  useEffect(() => {
    try {
      const s = localStorage.getItem("calendar_tracked_events");
      if (s) setTrackedEvents(JSON.parse(s));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem("calendar_tracked_events", JSON.stringify(trackedEvents));
  }, [trackedEvents]);

  // Load todos
  useEffect(() => {
    if (!user?.id) return setTodoList([]);
    setTodoLoading(true);
    fetch(`/api/db/todos?user_id=${user.id}`)
      .then((r) => r.json())
      .then(({ data }) => { if (Array.isArray(data)) setTodoList(data); })
      .catch(() => {})
      .finally(() => setTodoLoading(false));
  }, [user?.id]);

  const isTracked = (id: string) => trackedEvents.includes(id);
  const toggleTrack = (id: string) =>
    setTrackedEvents((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);

  const filteredEvents = useMemo(() => {
    const base = showTrackedOnly ? TCAS_EVENTS.filter((e) => isTracked(e.id)) : TCAS_EVENTS;
    const q = search.trim().toLowerCase();
    return base.filter((e) => {
      const matchQ = !q || e.name.toLowerCase().includes(q) || e.university.toLowerCase().includes(q);
      const matchU = uniFilter === "all" || e.university === uniFilter;
      return matchQ && matchU;
    });
  }, [showTrackedOnly, trackedEvents, search, uniFilter]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get events for a specific day
  const eventsForDay = (day: Date) =>
    filteredEvents.filter((e) =>
      isWithinInterval(day, { start: parseISO(e.startDate), end: parseISO(e.endDate) })
    );

  // Is first day of a multi-day event on this row?
  const isEventStart = (e: typeof TCAS_EVENTS[0], day: Date) =>
    isSameDay(day, parseISO(e.startDate)) || isSameDay(day, startOfWeek(day, { weekStartsOn: 0 }));

  const isEventEnd = (e: typeof TCAS_EVENTS[0], day: Date) =>
    isSameDay(day, parseISO(e.endDate)) || isSameDay(day, endOfWeek(day, { weekStartsOn: 0 }));

  // Todos
  const handleAddTodo = async () => {
    if (!newTodo.trim() || !user?.id) return;
    const res = await fetch("/api/db/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTodo, is_completed: false }),
    });
    const { data, error } = await res.json();
    if (!error && data) { setTodoList((p) => [data, ...p]); setNewTodo(""); }
  };

  const handleToggleTodo = async (id: string, current: boolean) => {
    await fetch("/api/db/todos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_completed: !current }),
    });
    setTodoList((p) => p.map((t) => t.id === id ? { ...t, is_completed: !current } : t));
  };

  const handleScheduleTodo = async (todoId: string, dateStr: string) => {
    const res = await fetch("/api/db/todos", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: todoId, calendar_date: dateStr }),
    });
    const { data } = await res.json();
    if (data) setTodoList((p) => p.map((t) => t.id === todoId ? { ...t, calendar_date: dateStr } : t));
  };

  // Drag state
  const [draggingTodo, setDraggingTodo] = useState<any>(null);
  const [dragOverDay, setDragOverDay] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-0 bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 gap-3 flex-wrap">
        {/* Month nav */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-base font-semibold text-gray-900 w-36 text-center select-none">
            {format(currentMonth, isEn ? "MMMM yyyy" : "MMMM yyyy", { locale: dfLocale })}
          </span>
          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition text-gray-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date())}
            className="ml-1 text-xs font-medium px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition"
          >
            {txt.today}
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowTrackedOnly((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition ${
              showTrackedOnly
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <Star className={`w-3 h-3 ${showTrackedOnly ? "fill-white" : ""}`} />
            {showTrackedOnly ? txt.showAll : txt.showTracked}
          </button>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={txt.searchPlaceholder}
              className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 w-36"
            />
          </div>

          <select
            value={uniFilter}
            onChange={(e) => setUniFilter(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300 text-gray-700 max-w-[160px]"
          >
            {["all", ...Array.from(new Set(TCAS_EVENTS.map((e) => e.university))).sort()].map((u) => (
              <option key={u} value={u}>{u === "all" ? txt.allUni : u}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Main: Calendar + Sidebar ── */}
      <div className="flex flex-col lg:flex-row">

        {/* Calendar grid */}
        <div className="flex-1 min-w-0">
          {/* Day headers */}
          <div className="grid grid-cols-7 border-b border-gray-100">
            {(isEn ? WEEK_DAYS_EN : WEEK_DAYS_TH).map((d) => (
              <div key={d} className="py-2 text-center text-[11px] font-semibold text-gray-400 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dayEvents = eventsForDay(day);
              const visible = dayEvents.slice(0, MAX_VISIBLE);
              const overflow = dayEvents.length - MAX_VISIBLE;
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const todayDay = isToday(day);
              const dateStr = format(day, "yyyy-MM-dd");
              const isDragTarget = dragOverDay === dateStr;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(isSameDay(day, selectedDay!) ? null : day)}
                  onDragOver={(e) => { if (draggingTodo) { e.preventDefault(); setDragOverDay(dateStr); } }}
                  onDragLeave={() => setDragOverDay(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (draggingTodo) {
                      handleScheduleTodo(draggingTodo.id, dateStr);
                      setDraggingTodo(null);
                      setDragOverDay(null);
                    }
                  }}
                  className={`
                    relative min-h-[90px] border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors
                    ${idx % 7 === 0 ? "border-l-0" : ""}
                    ${isSelected ? "bg-gray-50" : isDragTarget ? "bg-blue-50" : "hover:bg-gray-50/60"}
                    ${!isCurrentMonth ? "bg-gray-50/30" : ""}
                  `}
                >
                  {/* Date number */}
                  <div className="flex justify-end mb-1">
                    <span
                      className={`
                        w-6 h-6 flex items-center justify-center text-xs font-medium rounded-full select-none
                        ${todayDay ? "bg-pink-600 text-white font-bold" : isCurrentMonth ? "text-gray-700" : "text-gray-300"}
                      `}
                    >
                      {format(day, "d")}
                    </span>
                  </div>

                  {/* Event chips */}
                  <div className="flex flex-col gap-0.5">
                    {visible.map((ev) => {
                      const tracked = isTracked(ev.id);
                      const isStart = isEventStart(ev, day);
                      const isEnd = isEventEnd(ev, day);
                      return (
                        <button
                          key={ev.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPopoverEvent({ ...ev, isTracked: tracked });
                          }}
                          className="w-full text-left"
                        >
                          <div
                            className={`
                              h-5 flex items-center px-1.5 text-[10px] font-medium truncate
                              ${isStart ? "rounded-l-full pl-1.5" : "pl-0.5"}
                              ${isEnd ? "rounded-r-full pr-1.5" : "pr-0"}
                            `}
                            style={{
                              backgroundColor: tracked ? ev.color + "30" : ev.color + "18",
                              color: ev.color,
                              borderLeft: isStart ? `2.5px solid ${ev.color}` : "none",
                            }}
                          >
                            {isStart && <span className="truncate">{ev.name}</span>}
                          </div>
                        </button>
                      );
                    })}
                    {overflow > 0 && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedDay(day); }}
                        className="text-[10px] text-gray-400 hover:text-gray-600 text-left px-1 font-medium"
                      >
                        {txt.more(overflow)}
                      </button>
                    )}
                  </div>

                  {/* Drop indicator */}
                  {isDragTarget && (
                    <div className="absolute inset-0 border-2 border-blue-400 rounded pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Sidebar ── */}
        <div className="w-full lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-gray-100 flex flex-col">

          {/* Selected day events */}
          <div className="flex-1 p-4 border-b border-gray-100">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
              {selectedDay
                ? format(selectedDay, isEn ? "EEEE, d MMMM yyyy" : "EEEE d MMMM yyyy", { locale: dfLocale })
                : txt.upcoming}
            </div>

            {selectedDay ? (
              (() => {
                const evs = eventsForDay(selectedDay);
                return evs.length === 0 ? (
                  <p className="text-sm text-gray-400">{txt.noEvents}</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {evs.map((ev) => {
                      const tracked = isTracked(ev.id);
                      const isOpen = new Date() >= parseISO(ev.startDate) && new Date() <= parseISO(ev.endDate);
                      return (
                        <div key={ev.id} className="flex items-start gap-2.5 group">
                          <div className="w-1 h-full min-h-[40px] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: ev.color }} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-sm font-medium text-gray-800 leading-tight">{ev.name}</span>
                              <button
                                onClick={() => toggleTrack(ev.id)}
                                className={`shrink-0 mt-0.5 ${tracked ? "text-amber-500" : "text-gray-300 hover:text-gray-500"}`}
                              >
                                <Star className={`w-3.5 h-3.5 ${tracked ? "fill-amber-400" : ""}`} />
                              </button>
                            </div>
                            <p className="text-xs text-gray-400 truncate mt-0.5">{ev.university}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">
                                {format(parseISO(ev.startDate), "d MMM", { locale: dfLocale })} – {format(parseISO(ev.endDate), "d MMM", { locale: dfLocale })}
                              </span>
                              {isOpen && (
                                <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded-full">
                                  {txt.open}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              // Show upcoming tracked events
              <div className="flex flex-col gap-2">
                {TCAS_EVENTS
                  .filter((e) => isTracked(e.id) && parseISO(e.endDate) >= new Date())
                  .sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime())
                  .slice(0, 5)
                  .map((ev) => (
                    <div key={ev.id} className="flex items-start gap-2.5">
                      <div className="w-1 min-h-[36px] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: ev.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 leading-tight truncate">{ev.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {format(parseISO(ev.startDate), "d MMM", { locale: dfLocale })} – {format(parseISO(ev.endDate), "d MMM yy", { locale: dfLocale })}
                        </p>
                      </div>
                    </div>
                  ))}
                {trackedEvents.length === 0 && (
                  <p className="text-xs text-gray-400">
                    {isEn ? "Click ★ on any event to follow it" : "กด ★ ที่ event เพื่อติดตาม"}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* To-do list */}
          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <CalendarPlus className="w-3.5 h-3.5" />
                {txt.myTodos}
              </span>
              {!user && <span className="text-[10px] text-orange-400">{txt.notLoggedIn}</span>}
            </div>

            {user && (
              <p className="text-[10px] text-gray-400 mb-2 flex items-center gap-1">
                <GripVertical className="w-3 h-3" />
                {txt.dragHint}
              </p>
            )}

            {/* Add input */}
            <div className="flex gap-1.5 mb-3">
              <input
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTodo()}
                placeholder={txt.addPlaceholder}
                disabled={!user}
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-300 disabled:opacity-40"
              />
              <button
                onClick={handleAddTodo}
                disabled={!user}
                className="w-7 h-7 rounded-lg bg-gray-900 hover:bg-gray-700 text-white flex items-center justify-center disabled:opacity-40 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List */}
            {todoLoading ? (
              <p className="text-xs text-gray-400 text-center py-2">{txt.loading}</p>
            ) : todoList.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-2">{txt.noTodos}</p>
            ) : (
              <ul className="space-y-1 max-h-48 overflow-y-auto pr-0.5">
                {todoList.map((todo) => (
                  <li
                    key={todo.id}
                    draggable
                    onDragStart={() => setDraggingTodo(todo)}
                    onDragEnd={() => { setDraggingTodo(null); setDragOverDay(null); }}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group cursor-grab active:cursor-grabbing transition"
                  >
                    <GripVertical className="w-3 h-3 text-gray-300 group-hover:text-gray-400 shrink-0" />
                    <button
                      onClick={() => handleToggleTodo(todo.id, todo.is_completed)}
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                        todo.is_completed
                          ? "bg-gray-900 border-gray-900"
                          : "border-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {todo.is_completed && <Check className="w-2.5 h-2.5 text-white" />}
                    </button>
                    <span className={`flex-1 text-xs leading-tight min-w-0 truncate ${todo.is_completed ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {todo.title}
                    </span>
                    {todo.calendar_date && (
                      <span className="text-[9px] text-blue-500 bg-blue-50 border border-blue-100 rounded px-1 shrink-0">
                        {format(parseISO(todo.calendar_date), "d MMM", { locale: dfLocale })}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Event Popover ── */}
      {popoverEvent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setPopoverEvent(null)}
        >
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 w-80 max-w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPopoverEvent(null)}
              className="absolute top-3.5 right-3.5 text-gray-400 hover:text-gray-600 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3 mb-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: popoverEvent.color }} />
              <div>
                <h3 className="font-semibold text-gray-900 leading-tight">{popoverEvent.name}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{popoverEvent.university}</p>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-4 pl-5">
              {format(parseISO(popoverEvent.startDate), isEn ? "d MMMM yyyy" : "d MMMM yyyy", { locale: dfLocale })}
              {" – "}
              {format(parseISO(popoverEvent.endDate), isEn ? "d MMMM yyyy" : "d MMMM yyyy", { locale: dfLocale })}
            </div>

            {new Date() >= parseISO(popoverEvent.startDate) && new Date() <= parseISO(popoverEvent.endDate) && (
              <div className="mb-3 pl-5">
                <span className="text-xs font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
                  {txt.open}
                </span>
              </div>
            )}

            <div className="pl-5">
              <button
                onClick={() => {
                  toggleTrack(popoverEvent.id);
                  setPopoverEvent((p) => p ? { ...p, isTracked: !p.isTracked } : null);
                }}
                className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-xl border transition w-full justify-center ${
                  popoverEvent.isTracked
                    ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100"
                    : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Star className={`w-4 h-4 ${popoverEvent.isTracked ? "fill-amber-400 text-amber-400" : "text-gray-400"}`} />
                {popoverEvent.isTracked ? txt.unfollow : txt.follow}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
