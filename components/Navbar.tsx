'use client'
<<<<<<< HEAD
import { GraduationCap, User, Home, BarChart3, Target, Users, ChevronDown, Coins, Sparkles, Settings, LogOut, Map } from 'lucide-react';
=======
import { GraduationCap, User, Home, BarChart3, Target, Users, ChevronDown, Coins, Sparkles, Settings, LogOut, Zap } from 'lucide-react';
>>>>>>> 506f4b05615b8aa80664fdb3c30d3634585b1aad
import { Link, usePathname } from '@/routing';
import { useAuth } from './AuthProvider';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';
import { useState, useEffect } from 'react';
import useSWR from "swr";

const ADMIN_NAV_ROLES = ['admin', 'superadmin', 'moderator', 'act_admin'];

const Navbar = () => {
  const { user, signOut } = useAuth();
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { data: userData } = useSWR(
    user ? `/api/db/users?id=${user.id}` : null
  );
  const userRole = user ? userData?.data?.role || "member" : null;
  const userImage = userData?.data?.profile_image_url || user?.image;
  const adminHref = userRole === "act_admin" ? "/act-admin" : "/admin";
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/", label: t("home"), icon: Home },
    { href: "/analyse", label: t("analyze"), icon: BarChart3 },
    { href: "/course", label: t("plan"), icon: Target },
    { href: "/pathfinding", label: t("pathfinding"), icon: Map },
    // { href: "/calculator", label: t("calculator"), icon: Calculator },
    { href: "/community", label: t("community"), icon: Users },
    { href: "/talent-pipeline", label: t("talentPipeline"), icon: Zap },
  ];


  const isActive = (href: string) => pathname === href;
  return (
    <nav
      className={`hidden lg:block fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-pink-100"
          : "bg-pink-600"
      }`}
    >
      <div className="w-full px-4 xl:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image
              src="/doodee-logo-circle.png"
              alt="Doodee Logo"
              width={300}
              height={300}
              className="h-12 w-12 object-contain"
            />
            <div className="flex flex-col">
              <span
                className={`text-xl font-bold tracking-tight transition-colors ${
                  scrolled ? "text-gray-800" : "text-white"
                }`}
              >
                {t("brand")}
              </span>
              <span
                className={`text-[10px] font-medium -mt-1 transition-colors ${
                  scrolled ? "text-pink-500" : "text-pink-200"
                }`}
              >
                Future Planning
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                    scrolled
                      ? active
                        ? "bg-pink-100 text-pink-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                      : active
                      ? "bg-white/25 text-white"
                      : "text-white/80 hover:bg-white/15 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <LanguageSwitcher scrolled={scrolled} />

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen((o) => !o)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 ${
                    scrolled
                      ? "bg-pink-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02]"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                >
                  <div className="relative">
                    {userImage ? (
                      <Image
                        src={userImage}
                        alt={user.name || user.email || "User"}
                        width={32}
                        height={32}
                        className="rounded-full border-2 border-white/50"
                      />
                    ) : (
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          scrolled ? "bg-white/20" : "bg-white/30"
                        }`}
                      >
                        <User className="h-4 w-4" />
                      </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></span>
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-4 py-3 bg-gradient-to-r from-pink-50 to-rose-50 border-b border-pink-100">
                        <p className="font-semibold text-gray-800 truncate">
                          {user.name || user.email?.split("@")[0]}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                      </div>

                      <div className="py-2">
                        <Link
                          href="/profile"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-medium">{t("myAccount")}</span>
                        </Link>

                        <Link
                          href="/points"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Coins className="h-4 w-4 text-yellow-600" />
                          </div>
                          <span className="font-medium">{t("points")}</span>
                          <span className="ml-auto px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">
                            <Sparkles className="h-3 w-3 inline mr-0.5" />
                            NEW
                          </span>
                        </Link>

                        {ADMIN_NAV_ROLES.includes(userRole || "") && (
                          <Link
                            href={adminHref}
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                              <Settings className="h-4 w-4 text-purple-600" />
                            </div>
                            <span className="font-medium">Admin Panel</span>
                          </Link>
                        )}
                      </div>

                      <div className="border-t border-gray-100" />

                      <div className="py-2">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            signOut();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                            <LogOut className="h-4 w-4 text-red-600" />
                          </div>
                          <span className="font-medium">{t("logout")}</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                  scrolled
                    ? "bg-pink-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02]"
                    : "bg-white text-pink-600 hover:bg-pink-50"
                }`}
              >
                <User className="h-4 w-4" />
                {t("signIn")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
