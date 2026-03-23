"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/routing";
import { usePathname } from "next/navigation";
import { Link } from "@/routing";
import Image from "next/image";
import useSWR from "swr";
import {
  Users,
  ChevronLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  User,
  PanelLeftClose,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

const ACT_ROLES = ["admin", "superadmin", "act_admin"];

const ACT_SECTIONS = [
  {
    title: "โรงเรียน",
    items: [
      { label: "Dashboard", href: "/act-admin", icon: LayoutDashboard },
      { label: "นักเรียนทั้งหมด", href: "/act-admin/students", icon: Users },
    ],
  },
  {
    title: "คณะในฝัน",
    items: [
      { label: "ภาพรวม", href: "/act-admin/dream-report", icon: GraduationCap },
      { label: "รายชื่อนักเรียน", href: "/act-admin/dream-report/students", icon: Users },
    ],
  },
];

function hasThaiCharacters(value: string) {
  return /[\u0E00-\u0E7F]/.test(value);
}

export default function ACTAdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: userData, isLoading: userLoading } = useSWR(
    user ? `/api/db/users?id=${user.id}` : null
  );
  const userRole = userData?.data?.role;
  const loading = authLoading || (user && userLoading);
  const canAccess = userRole && ACT_ROLES.includes(userRole);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!loading && userRole !== null && userRole !== undefined && !canAccess) {
      router.push("/");
    }
  }, [userRole, loading, router, canAccess]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const saved = localStorage.getItem("actAdminSidebarCollapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapsed = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("actAdminSidebarCollapsed", String(next));
  };

  if (loading) return <LoadingSpinner fullScreen />;
  if (!canAccess) return null;

  const currentPath = (pathname as string).replace(/^\/(th|en)/, "");
  // Exact-match routes (no children beneath them)
  const EXACT_ROUTES = ["/act-admin", "/act-admin/dream-report"];
  const isActive = (href: string) =>
    currentPath === href ||
    (!EXACT_ROUTES.includes(href) && currentPath.startsWith(href));

  const renderLink = ({
    label,
    href,
    icon: Icon,
    compact = false,
  }: {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    compact?: boolean;
  }) => {
    const active = isActive(href);
    return (
      <Link
        key={href}
        href={href}
        title={compact ? label : undefined}
        className={`flex items-center ${compact ? "justify-center" : "gap-3"} px-3 py-2.5 rounded-lg transition-colors ${
          active
            ? "bg-pink-50 text-pink-600 font-medium"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <Icon className={`w-5 h-5 ${active ? "text-pink-500" : "text-gray-400"}`} />
        {!compact && <span>{label}</span>}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/act_logo.png" alt="ACT" width={40} height={40} className="w-10 h-10 object-contain" />
            <div>
              <h1 className="font-bold text-gray-800 text-sm leading-tight">ACT Admin</h1>
              <p className="text-xs text-gray-500">Assumption College Thonburi</p>
            </div>
          </Link>
          <button onClick={() => setMobileOpen(false)} className="md:hidden p-2 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {user?.image ? (
            <Image src={user.image} alt={user.name || "user"} width={36} height={36} className="rounded-full" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.name || user?.email?.split("@")[0] || "Admin"}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-5">
          {ACT_SECTIONS.map((section) => (
            <div key={section.title}>
              <p
                className={`mb-2 px-3 text-[11px] font-semibold text-gray-400 ${
                  hasThaiCharacters(section.title) ? "tracking-normal" : "uppercase tracking-[0.18em]"
                }`}
              >
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => renderLink(item))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {userRole !== "act_admin" && (
          <Link
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
            <span>กลับ Admin Panel</span>
          </Link>
        )}
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-50">
        <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 text-gray-600 hover:text-gray-900">
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/" className="flex items-center gap-2 ml-2">
          <Image src="/act_logo.png" alt="ACT" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="font-bold text-gray-800">ACT Admin</span>
        </Link>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <aside className={`md:hidden fixed left-0 top-0 h-screen w-64 bg-white z-50 flex flex-col transform transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex-col z-50 transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}>
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 shadow-sm z-10"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
        </button>

        {isCollapsed ? (
          <div className="flex flex-col h-full">
            <div className="p-3 border-b border-gray-200 flex justify-center">
              <Link href="/">
                <Image src="/act_logo.png" alt="ACT" width={40} height={40} className="w-10 h-10 object-contain" />
              </Link>
            </div>
            <div className="p-3 border-b border-gray-200 flex justify-center">
              {user?.image ? (
                <Image src={user.image} alt={user.name || "user"} width={36} height={36} className="rounded-full" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
              )}
            </div>
            <nav className="flex-1 p-2 overflow-y-auto">
              <div className="space-y-3">
                {ACT_SECTIONS.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <div className="mx-2 border-t border-gray-100" />
                    {section.items.map((item) => renderLink({ ...item, compact: true }))}
                  </div>
                ))}
              </div>
            </nav>
            <div className="p-2 border-t border-gray-200 space-y-1">
              {userRole !== "act_admin" && <Link href="/admin" title="กลับ Admin Panel" className="flex items-center justify-center p-2.5 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </Link>}
              <button onClick={() => signOut()} title="ออกจากระบบ" className="w-full flex items-center justify-center p-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <SidebarContent />
        )}
      </aside>

      {/* Main */}
      <main className={`pt-14 md:pt-0 transition-all duration-300 min-h-screen ${isCollapsed ? "md:ml-16" : "md:ml-64"}`}>
        {children}
      </main>
    </div>
  );
}
