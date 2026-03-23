"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "@/routing";
import AdminSidebar from "@/components/admin/AdminSidebar";
import LoadingSpinner from "@/components/LoadingSpinner";
import useSWR from "swr";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarCollapse = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  }, []);

  const { data: userData, isLoading: userLoading } = useSWR(
    user ? `/api/db/users?id=${user.id}` : null
  );
  const userRole = user ? (userData?.data?.role ?? null) : null;
  const loading = authLoading || (user && userLoading);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const canAccessAdmin = userRole === 'admin' || userRole === 'superadmin' || userRole === 'moderator';

  useEffect(() => {
    if (!authLoading && !loading && userRole !== null) {
      if (userRole === 'act_admin') {
        router.replace("/act-admin");
      } else if (!canAccessAdmin) {
        router.replace("/profile");
      }
    }
  }, [userRole, authLoading, loading, router, canAccessAdmin]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!canAccessAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Sidebar */}
      <AdminSidebar onCollapsedChange={handleSidebarCollapse} />

      {/* Main Content - with responsive margin */}
      <main className={`min-h-screen pt-14 md:pt-0 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {children}
      </main>
    </div>
  );
}
