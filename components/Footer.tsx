'use client';

import { Link } from '@/routing';
import { useTranslations } from 'next-intl';
import { Instagram, Mail, MapPin } from 'lucide-react';
import Image from 'next/image';

const Footer = () => {
  const t = useTranslations('footer');
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: '/analyse', label: t('quickLinks.analyse') },
    { href: '/course', label: t('quickLinks.course') },
    { href: '/community', label: t('quickLinks.community') },
    { href: '/mock-exam', label: t('quickLinks.mockExam') },
    { href: '/faculty', label: t('quickLinks.faculty') },
  ];

  const resources = [
    { href: '/calendar', label: t('resources.calendar') },
    { href: '/points', label: t('resources.points') },
    { href: '/profile', label: t('resources.profile') },
  ];

  const legal = [
    { href: '/privacy', label: t('legal.privacy') },
    { href: '/terms', label: t('legal.terms') },
  ];

  const socialLinks = [
    {
      href: 'https://www.instagram.com/doodee.future',
      icon: Instagram,
      label: 'Instagram',
      color: 'hover:bg-pink-600',
    },
  ];

  return (
    <footer className="hidden md:block bg-gray-800 text-gray-300 mt-16">
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Brand + description */}
          <div className="lg:col-span-4 space-y-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image
                  src="/doodee-logo-circle.png"
                  alt="Doodee Future"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="text-xl font-bold text-white">
                Doodee Future
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
              {t("brand.description")}
            </p>
            <p className="text-xs text-gray-500 leading-relaxed max-w-xs">
              {t("brand.tagline")}
            </p>

            {/* Social icons */}
            <div className="flex gap-2 pt-1">
              {socialLinks.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className={`w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center text-gray-400 transition-all duration-200 ${s.color} hover:text-white`}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              {t("quickLinks.title")}
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-pink-400 transition-colors duration-150 flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-pink-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="lg:col-span-2">
            <h3 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              {t("resources.title")}
            </h3>
            <ul className="space-y-2.5">
              {resources.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-pink-400 transition-colors duration-150 flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-pink-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h3 className="text-white font-semibold text-sm mt-7 mb-4 tracking-wide uppercase">
              {t("legal.title")}
            </h3>
            <ul className="space-y-2.5">
              {legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 hover:text-pink-400 transition-colors duration-150 flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-gray-600 group-hover:bg-pink-400 transition-colors" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4">
            <h3 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">
              {t("contact.title")}
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              {t("contact.description")}
            </p>
            <ul className="space-y-3">
              <li>
                <a
                  href="mailto:contact@doodee-future.com"
                  className="flex items-start gap-3 text-sm text-gray-400 hover:text-pink-400 transition-colors duration-150 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center shrink-0 group-hover:bg-pink-500/20 transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      {t("contact.emailLabel")}
                    </p>
                    <p>contact@doodee-future.com</p>
                  </div>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-sm text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">
                      {t("contact.addressLabel")}
                    </p>
                    <p className="leading-relaxed">{t("contact.address")}</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>
            © {currentYear} Doodee Future. {t("copyright")}
          </p>
          <span className="text-xs text-gray-500">
            {t("builtByPrefix")}{" "}
            <a
              href="https://act.ac.th/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-pink-400 underline underline-offset-2 transition-colors"
            >
              {t("builtBySchool")}
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
