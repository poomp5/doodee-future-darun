"use client";

import Calendar from "@/components/Calendar";
import { useLocale } from "next-intl";

export default function CalendarPage() {
  const locale = useLocale();
  const isEn = locale === "en";

  return (
    <div className="max-w-screen-xl mx-auto px-4 pb-16 pt-8">
      <div className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">TCAS 2569 / 2570</div>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEn ? "Exam & TCAS Calendar" : "ปฏิทินสอบ & รอบ TCAS"}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isEn
            ? "Track portfolio, quota & admission rounds - click ★ to follow events"
            : "ดูรอบ Portfolio / Quota / Admission - กด ★ เพื่อติดตาม"}
        </p>
      </div>
      <Calendar />
    </div>
  );
}
