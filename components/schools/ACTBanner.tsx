"use client";

import { Link } from "@/routing";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

interface ACTBannerProps {
  studentId?: string;
}

export default function ACTBanner({ studentId }: ACTBannerProps) {
  return (
    <Link href="/act">
      <div className="w-full rounded-2xl border border-red-200 bg-gradient-to-r from-red-700 to-red-600 px-5 py-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
            <Image
              src="/act_logo.png"
              alt="Assumption College Thonburi"
              width={40}
              height={40}
              className="w-9 h-9 object-contain"
            />
          </div>
          <div className="flex-1">
            <p className="text-xs text-red-200 font-medium tracking-wide">
              ACT Academic x InnoTech
            </p>
            <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
              Assumption College Thonburi
            </h3>
            {studentId && (
              <p className="text-xs text-red-200 mt-0.5">
                รหัสนักเรียน: {studentId}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-white/80 text-sm font-semibold shrink-0 group-hover:text-white group-hover:translate-x-1 transition-all">
            เข้าสู่ระบบ
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
