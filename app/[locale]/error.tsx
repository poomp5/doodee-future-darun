"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "@/routing";
import { useParams } from "next/navigation";

const translations = {
  th: {
    title: "เกิดข้อผิดพลาด",
    message: "เกิดข้อผิดพลาดที่ไม่คาดคิดขณะโหลดหน้านี้",
    tryAgain: "ลองอีกครั้ง",
    goHome: "กลับหน้าหลัก",
    needHelp: "หากปัญหายังคงอยู่ กรุณาติดต่อทีมสนับสนุนของเรา",
  },
  en: {
    title: "Something went wrong",
    message: "An unexpected error occurred while loading this page.",
    tryAgain: "Try Again",
    goHome: "Go Home",
    needHelp: "If the problem persists, please contact our support team",
  },
};

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams();
  const locale = (params?.locale as "th" | "en") || "th";
  const t = translations[locale];

  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Locale error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* Error Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          {t.title}
        </h1>
        <p className="text-gray-600 mb-2">
          {t.message}
        </p>
        {error.digest && (
          <p className="text-sm text-gray-400 mb-8 font-mono">
            Error ID: {error.digest}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-5 h-5" />
            {t.tryAgain}
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 shadow-md hover:shadow-lg border border-gray-200"
          >
            <Home className="w-5 h-5" />
            {t.goHome}
          </Link>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            {t.needHelp}
          </p>
        </div>
      </div>
    </div>
  );
}
