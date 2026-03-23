"use client";
import { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js";
import { Line } from "react-chartjs-2";
import {
  BookOpen,
  Calendar,
  Layers,
  TrendingUp,
  Upload,
  Users,
  School,
  ArrowRight,
} from "lucide-react";
import { Link } from "@/routing";
import Image from "next/image";
import { useAuth } from "@/components/AuthProvider";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
);

interface Stats {
  totalCourses: number;
  totalActivities: number;
  totalContent: number;
  totalUsers: number;
  totalPortfolioUploads: number;
}

interface DailyUploadPoint {
  date: string;
  count: number;
}

const ACT_ROLES = ["admin", "superadmin", "act_admin"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalCourses: 0,
    totalActivities: 0,
    totalContent: 0,
    totalUsers: 0,
    totalPortfolioUploads: 0,
  });
  const [dailyUploads, setDailyUploads] = useState<DailyUploadPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const isActEmail = user?.email?.toLowerCase().endsWith("act.ac.th") ?? false;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [coursesRes, activitiesRes, usersRes, uploadsRes] = await Promise.all([
          fetch("/api/db/courses"),
          fetch("/api/db/activities"),
          fetch("/api/admin/users"),
          fetch("/api/admin/portfolio-uploads?limit=1"),
        ]);

        const coursesData = await coursesRes.json();
        const activitiesData = await activitiesRes.json();
        const usersData = await usersRes.json();
        const uploadsData = await uploadsRes.json();

        const courses = coursesData.data || [];
        const activities = activitiesData.data || [];
        const users = usersData.data || [];

        setStats({
          totalCourses: courses.length,
          totalActivities: activities.length,
          totalContent: courses.length + activities.length,
          totalUsers: users.length,
          totalPortfolioUploads: uploadsData.total || 0,
        });
        setDailyUploads(uploadsData.summary?.dailyUploads || []);
        setCurrentRole(usersData.currentRole || null);
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      label: "คอร์สทั้งหมด",
      value: stats.totalCourses,
      icon: BookOpen,
      color: "bg-blue-500",
      href: "/admin/courses",
    },
    {
      label: "กิจกรรมทั้งหมด",
      value: stats.totalActivities,
      icon: Calendar,
      color: "bg-purple-500",
      href: "/admin/activities",
    },
    {
      label: "รวมทั้งหมด",
      value: stats.totalContent,
      icon: Layers,
      color: "bg-green-500",
      href: "/admin/courses",
    },
    {
      label: "ผู้ใช้งาน",
      value: stats.totalUsers,
      icon: Users,
      color: "bg-pink-500",
      href: "/admin/users",
    },
    {
      label: "Portfolio Uploads",
      value: stats.totalPortfolioUploads,
      icon: Upload,
      color: "bg-orange-500",
      href: "/admin/portfolio-uploads",
    },
  ];
  const lineData = {
    labels: dailyUploads.map((point, index) => {
      const date = new Date(point.date);
      return index % 3 === 0
        ? date.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
          })
        : "";
    }),
    datasets: [
      {
        label: "Uploads",
        data: dailyUploads.map((point) => point.count),
        borderColor: "rgba(236, 72, 153, 1)",
        backgroundColor: "rgba(236, 72, 153, 0.14)",
        fill: true,
        tension: 0.35,
        borderWidth: 3,
        pointRadius: 3,
        pointHoverRadius: 5,
        pointBackgroundColor: "#ec4899",
        pointBorderColor: "#ffffff",
        pointBorderWidth: 2,
      },
    ],
  };

  const lineOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.9)",
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
        titleFont: {
          family: "Kanit, sans-serif",
          size: 13,
        },
        bodyFont: {
          family: "Kanit, sans-serif",
          size: 13,
        },
        callbacks: {
          title: (items) => {
            const raw = dailyUploads[items[0]?.dataIndex ?? 0]?.date;
            if (!raw) return "";
            return new Date(raw).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
          },
          label: (context) => `${context.parsed.y} uploads`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        border: {
          display: false,
        },
        ticks: {
          color: "#9ca3af",
          font: {
            family: "Kanit, sans-serif",
            size: 11,
          },
          maxRotation: 0,
          autoSkip: false,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
          color: "#9ca3af",
          font: {
            family: "Kanit, sans-serif",
            size: 11,
          },
        },
        grid: {
          color: "rgba(243, 244, 246, 1)",
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    
      <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">ภาพรวมระบบจัดการคอร์สและกิจกรรม</p>
      </div>

      {/* ACT School System Banner - only for ACT_ROLES */}
      {!loading && currentRole && ACT_ROLES.includes(currentRole) && isActEmail && <Link href="/act-admin">
        <div className="mb-8 w-full rounded-2xl bg-gradient-to-r from-red-700 to-red-600 px-6 py-5 shadow-md hover:shadow-lg transition-shadow cursor-pointer group">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Image src="/act_logo.png" alt="ACT" width={44} height={44} className="p-1.5 object-contain" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-red-200 font-medium tracking-wide uppercase">ระบบโรงเรียน · School System</p>
              <h2 className="text-lg font-bold text-white leading-tight">Assumption College Thonburi</h2>
              <p className="text-sm text-red-200 mt-0.5">จัดการนักเรียน · ดูคณะในฝัน</p>
            </div>
            <div className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl text-white font-semibold text-sm transition shrink-0 group-hover:translate-x-1 duration-200">
              เปิดระบบ <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </Link>}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-8">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Link
              key={index}
              href={card.href}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{card.label}</p>
                  {loading ? (
                    <div className="h-8 w-12 bg-gray-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <div className="xl:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Traffic การอัปโหลดพอร์ต
              </h2>
              <p className="text-sm text-gray-500">
                จำนวนการอัปโหลดต่อวันในช่วง 30 วันที่ผ่านมา
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-pink-600 font-medium">
              <TrendingUp className="w-4 h-4" />
              {stats.totalPortfolioUploads} uploads ทั้งหมด
            </div>
          </div>

          {loading ? (
            <div className="h-64 rounded-xl bg-gray-100 animate-pulse" />
          ) : (
            <div className="h-64">
              <Line data={lineData} options={lineOptions} />
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            สรุปพอร์ตล่าสุด
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl bg-pink-50 p-4">
              <p className="text-sm text-gray-500">อัปโหลดรวมทั้งหมด</p>
              <p className="mt-1 text-3xl font-bold text-pink-700">
                {loading ? "-" : stats.totalPortfolioUploads}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">อัปโหลดวันนี้</p>
              <p className="mt-1 text-2xl font-bold text-gray-800">
                {loading ? "-" : dailyUploads[dailyUploads.length - 1]?.count ?? 0}
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-sm text-gray-500">วันที่อัปโหลดสูงสุดในรอบ 30 วัน</p>
              <p className="mt-1 text-base font-semibold text-gray-800">
                {loading
                  ? "-"
                  : (() => {
                      const peak = [...dailyUploads].sort((a, b) => b.count - a.count)[0];
                      if (!peak) return "-";
                      return `${new Date(peak.date).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                      })} (${peak.count})`;
                    })()}
              </p>
            </div>
            <Link
              href="/admin/portfolio-uploads"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Upload className="w-4 h-4" />
              เปิด Upload Logs
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/admin/courses/new"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-colors"
          >
            <BookOpen className="w-6 h-6 text-pink-500" />
            <div>
              <p className="font-medium text-gray-800">เพิ่มคอร์สใหม่</p>
              <p className="text-sm text-gray-500">สร้างคอร์สเรียนใหม่</p>
            </div>
          </Link>
          <Link
            href="/admin/activities/new"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
          >
            <Calendar className="w-6 h-6 text-purple-500" />
            <div>
              <p className="font-medium text-gray-800">เพิ่มกิจกรรมใหม่</p>
              <p className="text-sm text-gray-500">สร้างกิจกรรมใหม่</p>
            </div>
          </Link>
          <Link
            href="/admin/portfolio-uploads"
            className="flex items-center gap-3 p-4 rounded-lg border-2 border-dashed border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors"
          >
            <Upload className="w-6 h-6 text-orange-500" />
            <div>
              <p className="font-medium text-gray-800">ดู Upload Logs</p>
              <p className="text-sm text-gray-500">ตรวจรายการพอร์ตที่อัปขึ้น CDN</p>
            </div>
          </Link>
        </div>
      </div>
      </div>
    
  );
}
