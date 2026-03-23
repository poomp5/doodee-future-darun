'use client';

import { Link, usePathname } from '@/routing';
import { useTranslations } from 'next-intl';
import {
  User,
  FileText,
  GraduationCap,
  Calculator,
  CheckSquare,
  Shield,
} from 'lucide-react';

const ProfileTabs = () => {
  const t = useTranslations('profile');
  const pathname = usePathname();

  const tabs = [
    {
      href: '/profile',
      label: t('tabs.info'),
      icon: User,
      match: (path: string) => path === '/profile' || path === '/profile/info',
    },
    {
      href: '/profile/portfolio',
      label: t('tabs.portfolio'),
      icon: FileText,
      match: (path: string) => path.startsWith('/profile/portfolio'),
    },
    {
      href: '/profile/faculty',
      label: t('tabs.faculty'),
      icon: GraduationCap,
      match: (path: string) => path.startsWith('/profile/faculty'),
    },
    {
      href: '/profile/gpax',
      label: t('tabs.gpax'),
      icon: Calculator,
      match: (path: string) => path.startsWith('/profile/gpax'),
    },
    {
      href: '/profile/todolist',
      label: t('tabs.todolist'),
      icon: CheckSquare,
      match: (path: string) => path.startsWith('/profile/todolist'),
    },
    {
      href: '/terms',
      label: t('tabs.legal'),
      icon: Shield,
      match: (path: string) =>
        path.startsWith('/terms') ||
        path.startsWith('/privacy') ||
        path.startsWith('/contact'),
    },
  ];

  return (
    <>
      {/* Desktop Left Sidebar Nav */}
      <nav className="hidden md:flex flex-col gap-1" aria-label="Profile tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.match(pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                group flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm
                transition-all duration-150
                ${
                  isActive
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }
              `}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${isActive ? 'text-pink-600' : 'text-gray-400 group-hover:text-gray-500'}`}
              />
              <span>{tab.label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Mobile: Scrollable Icon Tab Bar */}
      <nav
        className="md:hidden flex overflow-x-auto scrollbar-hide gap-1 pb-1 pt-6"
        aria-label="Profile tabs"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.match(pathname);

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`
                flex flex-col items-center gap-1 px-4 py-2.5 rounded-xl shrink-0
                transition-all duration-150 text-xs font-medium
                ${
                  isActive
                    ? 'bg-pink-50 text-pink-600'
                    : 'text-gray-500 hover:bg-gray-100'
                }
              `}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-pink-600' : 'text-gray-400'}`} />
              <span className="whitespace-nowrap">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
};

export default ProfileTabs;
