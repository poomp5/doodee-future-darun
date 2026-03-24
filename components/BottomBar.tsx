"use client";
import {
  Bot,
  House,
  ListChecks,
  Map,
  Upload,
} from "lucide-react";
import { Link } from "@/routing";
import { useTranslations } from "next-intl";

export function MobileFooter() {
  return (
    <div className="block lg:hidden w-full bg-gray-800 text-gray-400 px-4 py-4 text-center mb-16">
      <p className="text-xs leading-relaxed">
        พัฒนาโดย{" "}
        <a
          href="https://act.ac.th/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-300 underline underline-offset-2"
        >
          โรงเรียนอัสสัมชัญธนบุรี
        </a>{" "}
        เพื่อใช้ในการแข่งขัน Darun Hackathon 2026
      </p>
    </div>
  );
}

export default function BottomBar() {
  const t = useTranslations("nav");

  return (
    <div
      className="mt-6 block lg:hidden fixed bottom-0 left-0 right-0 z-50 w-full bg-white border-t border-gray-200 h-16"
      style={{
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
      }}
    >
      <div className="relative grid h-full grid-cols-5 mx-auto">
        <Link href="/" className="w-full">
          <button
            type="button"
            className="w-full h-full inline-flex flex-col items-center justify-center hover:bg-gray-50 group px-1"
          >
            <House className="text-gray-700 group-hover:text-pink-600" />
            <span className="text-xs text-gray-500 group-hover:text-pink-600">
              {t("home")}
            </span>
          </button>
        </Link>
        <Link href="/analyse" className="w-full">
          <button
            type="button"
            className="w-full h-full inline-flex flex-col items-center justify-center hover:bg-gray-50 group px-1"
          >
            <Bot className="text-gray-700 group-hover:text-pink-600" />
            <span className="text-xs text-gray-500 group-hover:text-pink-600">
              {t("analyze")}
            </span>
          </button>
        </Link>
        <Link href="/analyse/upload" className="w-full">
          <button
            type="button"
            className="absolute left-1/2 -translate-x-1/2 -translate-y-3 w-16 h-16 inline-flex flex-col items-center justify-center bg-pink-800 hover:bg-pink-900 group rounded-full shadow-lg"
          >
            <Upload className="h-full w-full p-3 mb-1 text-white hover:text-white" />
          </button>
        </Link>
        <Link href="/course" className="w-full">
          <button
            type="button"
            className="w-full h-full inline-flex flex-col items-center justify-center hover:bg-gray-50 group px-1"
          >
            <ListChecks className="text-gray-700 group-hover:text-pink-600" />
            <span className="text-xs text-gray-500 group-hover:text-pink-600">
              {t("plan")}
            </span>
          </button>
        </Link>
        <Link href="/pathfinding" className="w-full">
          <button
            type="button"
            className="w-full h-full inline-flex flex-col items-center justify-center hover:bg-gray-50 group px-1"
          >
            <Map className="text-gray-700 group-hover:text-pink-600" />
            <span className="text-xs text-gray-500 group-hover:text-pink-600">
              {t("pathfinding")}
            </span>
          </button>
        </Link>
      </div>
    </div>
  );
}
