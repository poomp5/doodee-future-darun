"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { GraduationCap, Loader2, Target, BookOpen, Star } from "lucide-react";
import { Link } from "@/routing";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function LoginPage() {
  const t = useTranslations('login');
  const [loading, setLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setLoadingProvider('google');
      setError(null);

      await signIn("google", {
        callbackUrl: "/auth/callback",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      setLoading(false);
      setLoadingProvider(null);
    }
  };

  return (
    
      <div className="max-w-screen-xl mx-auto min-h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-pink-600 rounded-2xl p-4 shadow-lg">
              <GraduationCap className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-pink-700 mb-2">
            Doodee Future
          </h1>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {t('title')}
          </h2>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 border border-gray-300 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loadingProvider === 'google' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Image
                  src="/icons/google-logo.svg"
                  alt="Google"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                {t('continueWithGoogle')}
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {t('termsAcceptance')}
              <br />
              <Link
                href="/terms"
                className="text-pink-600 hover:underline cursor-pointer"
              >
                {t('termsOfService')}
              </Link>{" "}
              &{" "}
              <Link
                href="/privacy"
                className="text-pink-600 hover:underline cursor-pointer"
              >
                {t('privacyPolicy')}
              </Link>
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="bg-white rounded-xl p-4 shadow-sm mb-2 flex items-center justify-center">
              <Target className="w-8 h-8 text-pink-600" />
            </div>
            <p className="text-xs text-gray-600">{t('analyzePortfolio')}</p>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-xl p-4 shadow-sm mb-2 flex items-center justify-center">
              <BookOpen className="w-8 h-8 text-pink-600" />
            </div>
            <p className="text-xs text-gray-600">{t('planStudies')}</p>
          </div>
          <div className="text-center">
            <div className="bg-white rounded-xl p-4 shadow-sm mb-2 flex items-center justify-center">
              <Star className="w-8 h-8 text-pink-600" />
            </div>
            <p className="text-xs text-gray-600">{t('earnPoints')}</p>
          </div>
        </div>
      </div>
      </div>
    
  );
}
