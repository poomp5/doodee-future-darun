"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/routing';
import { useState, useTransition } from 'react';
import { Languages, Check } from 'lucide-react';

interface LanguageSwitcherProps {
  scrolled?: boolean;
  compact?: boolean;
}

export default function LanguageSwitcher({ scrolled = false, compact = false }: LanguageSwitcherProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const switchLanguage = (newLocale: 'th' | 'en') => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
      setIsOpen(false);
    });
  };

  const languages: { code: 'th' | 'en'; name: string; shortName: string }[] = [
    { code: 'th', name: 'ไทย', shortName: 'TH' },
    { code: 'en', name: 'English', shortName: 'EN' }
  ];

  const currentLanguage = languages.find(lang => lang.code === locale);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 rounded-lg transition-colors ${
          compact
            ? 'p-2 bg-white/10 hover:bg-white/20 text-white'
            : scrolled
              ? 'px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700'
              : 'px-3 py-2 bg-white/10 hover:bg-white/20 text-white'
        }`}
        disabled={isPending}
        title={currentLanguage?.name}
      >
        <Languages className="w-4 h-4" />
        {!compact && <span className="text-sm font-medium">{currentLanguage?.shortName}</span>}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => switchLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                  locale === lang.code ? 'bg-pink-50 text-pink-700' : 'text-gray-700 hover:bg-gray-50'
                }`}
                disabled={isPending || locale === lang.code}
              >
                <span className="font-medium">{lang.name}</span>
                {locale === lang.code && (
                  <Check className="w-4 h-4 text-pink-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
