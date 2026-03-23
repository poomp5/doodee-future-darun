"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/routing";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";
import useSWR from "swr";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  LogOut,
  User,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  PanelLeftClose,
  Tags,
  Star,
  Gift,
  Globe,
  GraduationCap,
  Upload,
  School,
  FileText,
} from "lucide-react";

const ACT_ROLES = ["admin", "superadmin", "act_admin"];

function buildMenuSections(userRole: string | undefined) {
  const sections = [
    {
      title: "ภาพรวม",
      roles: ["admin", "superadmin", "moderator"],
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "จัดการผู้ใช้", href: "/admin/users", icon: Users },
      ],
    },
    {
      title: "คอนเทนต์",
      roles: ["admin", "superadmin", "moderator"],
      items: [
        { label: "จัดการคอร์ส", href: "/admin/courses", icon: BookOpen },
        { label: "จัดการกิจกรรม", href: "/admin/activities", icon: Calendar },
        { label: "จัดการหลักสูตร", href: "/admin/programs", icon: GraduationCap },
        { label: "จัดการหมวดหมู่", href: "/admin/categories", icon: Tags },
        { label: "แบนเนอร์", href: "/admin/banners", icon: LayoutDashboard },
      ],
    },
    {
      title: "การขายและพอร์ต",
      roles: ["admin", "superadmin", "moderator"],
      items: [
        { label: "คอร์สหน้า Points", href: "/admin/points-courses", icon: Star },
        { label: "ของรางวัล Points", href: "/admin/points-rewards", icon: Gift },
        { label: "Upload Logs", href: "/admin/portfolio-uploads", icon: Upload },
        { label: "Community Ports", href: "/admin/community", icon: School },
      ],
    },
    {
      title: "บล็อก",
      roles: ["admin", "superadmin", "moderator"],
      items: [
        { label: "จัดการบทความ", href: "/admin/blog", icon: FileText },
        { label: "หมวดหมู่บล็อก", href: "/admin/blog/categories", icon: Tags },
      ],
    },
    {
      title: "เครื่องมือ",
      roles: ["admin", "superadmin", "moderator"],
      items: [
        { label: "Web Scraping", href: "/admin/scrape", icon: Globe },
        { label: "ข้อสอบจำลอง", href: "/admin/mock-exam", icon: BookOpen },
        { label: "PDF ข้อสอบ / เฉลย", href: "/admin/mock-exam-pdfs", icon: Tags },
      ],
    },
    {
      title: "โรงเรียน",
      roles: ACT_ROLES,
      items: [
        {
          label: "Assumption College Thonburi",
          href: "/act-admin",
          icon: School,
        },
      ],
    },
  ];

  return sections.filter((s) => !userRole || s.roles.includes(userRole));
}

function hasThaiCharacters(value: string) {
  return /[\u0E00-\u0E7F]/.test(value);
}

function isPathActive(currentPath: string, href: string) {
  if (currentPath === href) {
    return true;
  }

  if (href === "/admin") {
    return false;
  }

  return currentPath.startsWith(`${href}/`);
}

interface AdminSidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function AdminSidebar({ onCollapsedChange }: AdminSidebarProps) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: userData } = useSWR(user ? `/api/db/users?id=${user.id}` : null);
  const userRole: string | undefined = userData?.data?.role;
  const menuSections = buildMenuSections(userRole);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Load collapsed state from localStorage
  useEffect(() => {
    const savedCollapsed = localStorage.getItem("adminSidebarCollapsed");
    if (savedCollapsed === "true") {
      setIsCollapsed(true);
    }
  }, []);

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("adminSidebarCollapsed", String(newState));
    onCollapsedChange?.(newState);
  };

  // Notify parent of initial collapsed state
  useEffect(() => {
    onCollapsedChange?.(isCollapsed);
  }, [isCollapsed, onCollapsedChange]);

  // Remove locale prefix for comparison
  const currentPath = pathname.replace(/^\/(th|en)/, "") || "/admin";

  const renderMenuLink = ({
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
    const isActive = isPathActive(currentPath, href);

    return (
      <Link
        key={href}
        href={href}
        title={compact ? label : undefined}
        className={`flex items-center ${
          compact ? "justify-center" : "gap-3"
        } px-3 py-2.5 rounded-lg transition-colors ${
          isActive
            ? "bg-pink-50 text-pink-600 font-medium"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <Icon
          className={`w-5 h-5 ${
            isActive ? "text-pink-500" : "text-gray-400"
          }`}
        />
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
            <Image
              src="/doodee_logo.png"
              alt="Doodee Logo"
              width={40}
              height={40}
              className="w-10 h-10 object-cover"
            />
            <div>
              <h1 className="font-bold text-gray-800">Admin Panel</h1>
              <p className="text-xs text-gray-500">Doodee Future</p>
            </div>
          </Link>
          {/* Close button for mobile */}
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden p-2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {user?.image ? (
            <Image
              src={user.image}
              alt={user.name || "User"}
              width={36}
              height={36}
              className="rounded-full"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">
              {user?.name || user?.email?.split("@")[0] || "Admin"}
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-5">
          {menuSections.map((section) => (
            <div key={section.title}>
              <p
                className={`mb-2 px-3 text-[11px] font-semibold text-gray-400 ${
                  hasThaiCharacters(section.title)
                    ? "tracking-normal"
                    : "uppercase tracking-[0.18em]"
                }`}
              >
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => renderMenuLink(item))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Link
          href="/profile"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-400" />
          <span>กลับหน้าหลัก</span>
        </Link>
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
    <>
      {/* Mobile Header with Burger Menu */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center px-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 text-gray-600 hover:text-gray-900"
        >
          <Menu className="w-6 h-6" />
        </button>
        <Link href="/" className="flex items-center gap-2 ml-2">
          <Image
            src="/doodee_logo.png"
            alt="Doodee Logo"
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
          <span className="font-bold text-gray-800">Admin</span>
        </Link>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-screen w-64 bg-white z-50 flex flex-col transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex-col z-50 transition-all duration-300 ${isCollapsed ? "w-16" : "w-64"}`}
      >
        {/* Collapse Toggle Button */}
        <button
          onClick={toggleCollapsed}
          className="absolute -right-3 top-6 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-50 shadow-sm z-10"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Collapsed Content */}
        {isCollapsed ? (
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-3 border-b border-gray-200 flex justify-center">
              <Link href="/">
                <Image
                  src="/doodee_logo.png"
                  alt="Doodee Logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 object-cover"
                />
              </Link>
            </div>

            {/* User Avatar */}
            <div className="p-3 border-b border-gray-200 flex justify-center">
              {user?.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "User"}
                  width={36}
                  height={36}
                  className="rounded-full"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
              )}
            </div>

            {/* Navigation Icons */}
            <nav className="flex-1 p-2 overflow-y-auto">
              <div className="space-y-3">
                {menuSections.map((section) => (
                  <div key={section.title} className="space-y-1">
                    <div className="mx-2 border-t border-gray-100" />
                    {section.items.map((item) =>
                      renderMenuLink({ ...item, compact: true }),
                    )}
                  </div>
                ))}
              </div>
            </nav>

            {/* Footer Icons */}
            <div className="p-2 border-t border-gray-200 space-y-1">
              <Link
                href="/profile"
                title="กลับหน้าหลัก"
                className="flex items-center justify-center p-2.5 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </Link>
              <button
                onClick={() => signOut()}
                title="ออกจากระบบ"
                className="w-full flex items-center justify-center p-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <SidebarContent />
        )}
      </aside>
    </>
  );
}
