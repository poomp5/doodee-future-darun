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

  const handleDiscordLogin = async () => {
    try {
      setLoading(true);
      setLoadingProvider('discord');
      setError(null);

      await signIn("discord", {
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

          {/* Discord Sign In Button */}
          <button
            onClick={handleDiscordLogin}
            disabled={loading}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold py-3 px-4 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed mt-3"
          >
            {loadingProvider === 'discord' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.114 18.1.128 18.116a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
                {t('continueWithDiscord')}
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
