import { Link } from "@/routing";
import { Home, Search } from "lucide-react";

const translations = {
  th: {
    title: "ไม่พบหน้าที่ต้องการ",
    message: "ขอโทษค่ะ หน้าที่คุณกำลังมองหาไม่มีอยู่ในระบบ หรืออาจถูกย้ายไปแล้ว",
    goHome: "กลับหน้าหลัก",
    needHelp: "ต้องการความช่วยเหลือ? ติดต่อทีมสนับสนุนของเรา",
  },
  en: {
    title: "Page Not Found",
    message: "Sorry, the page you are looking for does not exist or has been moved.",
    goHome: "Go Home",
    needHelp: "Need help? Contact our support team",
  },
};

export default function NotFound() {
  // Default to Thai if locale cannot be determined
  const locale = "th";
  const t = translations[locale];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-purple-50 to-pink-100 px-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            <h1 className="text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-16 h-16 text-pink-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Message */}
        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          {t.title}
        </h2>
        <p className="text-gray-600 mb-8">
          {t.message}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
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
