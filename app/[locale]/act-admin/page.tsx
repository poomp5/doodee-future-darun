"use client";

import useSWR from "swr";
import { Link } from "@/routing";
import Image from "next/image";
import {
  ArrowRight,
  GraduationCap,
  School,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  ChartOptions,
  Legend,
  LinearScale,
  TooltipItem,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard summary");
  }
  return response.json();
};

const GRADE_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

type DashboardSummary = {
  totalStudents: number;
  registeredCount: number;
  notRegisteredCount: number;
  gradeStats: Array<{
    grade: string;
    totalCount: number;
    registeredCount: number;
  }>;
};

function formatGradeLabel(grade: string) {
  return /^\d+$/.test(grade) ? `ม.${grade}` : grade;
}

function OverviewSkeleton() {
  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <div className="h-16 w-full max-w-[20rem] animate-pulse rounded-2xl bg-gray-200" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-2xl border border-gray-200 bg-white"
          />
        ))}
      </div>
      <div className="h-[320px] sm:h-[380px] animate-pulse rounded-3xl border border-gray-200 bg-white" />
    </div>
  );
}

export default function ACTAdminOverview() {
  const { data, error, isLoading } = useSWR(
    "/api/admin/act/dashboard-summary",
    fetcher,
  );

  const summary: DashboardSummary = data?.data ?? {
    totalStudents: 0,
    registeredCount: 0,
    notRegisteredCount: 0,
    gradeStats: [],
  };

  const labels = summary.gradeStats.map((item) => formatGradeLabel(item.grade));
  const chartData = {
    labels,
    datasets: [
      {
        label: "ลงทะเบียนแล้ว",
        data: summary.gradeStats.map((item) => item.registeredCount),
        backgroundColor: summary.gradeStats.map(
          (_, index) => GRADE_COLORS[index % GRADE_COLORS.length],
        ),
        borderRadius: 14,
        borderSkipped: false as const,
        maxBarThickness: 72,
      },
    ],
  };

  const chartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          title(items: TooltipItem<"bar">[]) {
            return items[0]?.label ?? "";
          },
          label(context: TooltipItem<"bar">) {
            return `ลงทะเบียนแล้ว ${Number(context.raw) || 0} คน`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#4b5563",
          font: {
            family: "inherit",
            size: 12,
            weight: 600,
          },
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0 as const,
          color: "#6b7280",
        },
        grid: {
          color: "rgba(148, 163, 184, 0.18)",
        },
      },
    },
  };

  if (isLoading) {
    return <OverviewSkeleton />;
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-red-700">
          โหลดข้อมูล dashboard ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
        </div>
      </div>
    );
  }

  const chartMinWidth = Math.max(320, summary.gradeStats.length * 72);

  return (
    <div className="space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-100 bg-white shadow sm:h-14 sm:w-14">
          <Image
            src="/act_logo.png"
            alt="ACT"
            width={44}
            height={44}
            className="h-9 w-9 object-contain sm:h-11 sm:w-11"
          />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
            Assumption College Thonburi
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Dashboard ภาพรวมการลงทะเบียนนักเรียนในระบบ · ปีการศึกษา 2568
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          color="bg-slate-900"
          label="นักเรียนทั้งหมด"
          value={summary.totalStudents}
          helper="ฐานข้อมูลนักเรียน ACT"
        />
        <StatCard
          icon={UserCheck}
          color="bg-emerald-500"
          label="ลงทะเบียนแล้ว"
          value={summary.registeredCount}
          helper="นักเรียนที่มีบัญชีใน Doodee"
        />
        <StatCard
          icon={UserX}
          color="bg-amber-500"
          label="ยังไม่ได้ลงทะเบียน"
          value={summary.notRegisteredCount}
          helper="นักเรียนที่ยังไม่เข้าระบบ"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-600">
                Registration Dashboard
              </p>
              <h2 className="mt-1 text-lg font-bold text-gray-900 sm:text-xl">
                จำนวนนักเรียนที่ลงทะเบียนแล้วแยกตามระดับชั้น
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                ดูได้ทันทีว่าระดับชั้นไหนเข้าระบบแล้วกี่คน
              </p>
            </div>
            <div className="w-full rounded-2xl bg-red-50 px-4 py-3 text-left sm:w-auto sm:text-right">
              <p className="text-xs font-medium text-red-500">รวมที่ลงทะเบียนแล้ว</p>
              <p className="text-2xl font-bold text-red-700">
                {summary.registeredCount}
              </p>
            </div>
          </div>

          <div className="-mx-1 overflow-x-auto px-1">
            {summary.gradeStats.length > 0 ? (
              <div
                className="h-[280px] sm:h-[320px]"
                style={{ minWidth: `${chartMinWidth}px` }}
              >
                <Bar data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 text-center text-sm text-gray-500 sm:h-[320px]">
                ยังไม่มีข้อมูลระดับชั้นสำหรับแสดงกราฟ
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50">
              <School className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">สรุประดับชั้น</h2>
              <p className="text-sm text-gray-500">แยกตามจำนวนนักเรียนที่ลงทะเบียนแล้ว</p>
            </div>
          </div>

          <div className="space-y-3">
            {summary.gradeStats.map((item, index) => (
              <div
                key={item.grade}
                className="rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-3.5 w-3.5 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          GRADE_COLORS[index % GRADE_COLORS.length],
                      }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">
                        {formatGradeLabel(item.grade)}
                      </p>
                      <p className="text-xs text-gray-500">
                        ลงทะเบียนแล้ว {item.registeredCount} จาก {item.totalCount} คน
                      </p>
                    </div>
                  </div>
                  <span className="w-fit rounded-full bg-white px-3 py-1 text-sm font-semibold text-gray-700">
                    {item.registeredCount} คน
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/act-admin/students">
          <div className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-red-200 hover:shadow-md sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <Users className="h-5 w-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">รายชื่อนักเรียน</p>
                  <p className="text-xs text-gray-500">
                    ดู / ค้นหา / กรองตามห้องเรียน
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-red-600" />
            </div>
          </div>
        </Link>

        <Link href="/act-admin/dream-report">
          <div className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-4 transition-all hover:border-red-200 hover:shadow-md sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50">
                  <GraduationCap className="h-5 w-5 text-red-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">รายงานคณะในฝัน</p>
                  <p className="text-xs text-gray-500">
                    สรุปการเลือกคณะ / ใครยังไม่ได้เลือก
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-400 transition-all group-hover:translate-x-1 group-hover:text-red-600" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
  helper,
}: {
  icon: typeof Users;
  color: string;
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:p-5">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${color}`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
        <p className="text-xs leading-relaxed text-gray-400">{helper}</p>
      </div>
    </div>
  );
}
