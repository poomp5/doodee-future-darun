"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash, Search, ExternalLink, MapPin, CalendarDays } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";
import { Link } from "@/routing";
import Swal from "@/lib/swal-toast";
import { getCategoryLabel, getCategoryGroupLabel, SOURCE_OPTIONS } from "@/lib/categories";

interface Activity {
  id: number;
  title: string;
  description: string;
  image_url: string;
  location: string;
  start_date: string;
  end_date: string;
  category: string;
  subcategory: string;
  max_participants: number | null;
  price: number;
  source: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
  deadline: string | null;
}

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const TableSkeleton = () => (
    <div className="p-4 md:p-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-6 w-44 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-36 bg-gray-100 rounded" />
        </div>
        <div className="h-10 w-40 bg-gray-200 rounded-lg" />
      </div>
      <div className="h-10 w-full bg-gray-100 rounded-lg mb-6" />
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="h-10 bg-gray-50" />
        <div className="divide-y">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-12 bg-white" />
          ))}
        </div>
      </div>
    </div>
  );

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const res = await fetch("/api/db/activities");
      const data = await res.json();
      setActivities(data.data || []);
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ?",
      text: "คุณต้องการลบกิจกรรมนี้หรือไม่?",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/db/activities?id=${id}`, { method: "DELETE" });
        setActivities(activities.filter((a) => a.id !== id));
        Swal.fire({
          icon: "success",
          title: "ลบสำเร็จ",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
      }
    }
  };

  const filteredActivities = activities.filter(
    (activity) =>
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceIcon = (source: string) => {
    const sourceOpt = SOURCE_OPTIONS.find((s) => s.value === source);
    return sourceOpt?.icon;
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      
        <TableSkeleton />
      
    );
  }

  return (
    
      <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">
            จัดการกิจกรรม
          </h1>
          <p className="text-gray-500">ทั้งหมด {activities.length} กิจกรรม</p>
        </div>
        <Link
          href="/admin/activities/new"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มกิจกรรมใหม่</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหากิจกรรม..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
        />
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredActivities.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border border-gray-100">
            {searchTerm ? "ไม่พบกิจกรรมที่ค้นหา" : "ยังไม่มีกิจกรรม"}
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Contester: รูปแนวตั้ง - layout แบบ horizontal (รูปด้านข้าง) */}
              {activity.source === "contester" ? (
                <div className="flex">
                  {activity.image_url ? (
                    <Image
                      src={activity.image_url}
                      alt={activity.title}
                      width={120}
                      height={160}
                      className="w-28 h-36 object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-28 h-36 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-400 text-xs flex-shrink-0">
                      No img
                    </div>
                  )}
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="font-medium text-gray-800 line-clamp-2 text-sm">
                        {activity.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className={`text-xs font-medium ${activity.price > 0 ? "text-pink-600" : "text-green-600"}`}>
                          {activity.price > 0 ? `฿${activity.price.toLocaleString()}` : "ฟรี"}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            activity.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {activity.is_active ? "เปิด" : "ปิด"}
                        </span>
                      </div>
                      {activity.deadline && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                          <CalendarDays className="w-3 h-3" />
                          <span>ปิด {formatDate(activity.deadline)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        {getSourceIcon(activity.source) && (
                          <Image
                            src={getSourceIcon(activity.source)!}
                            alt={activity.source}
                            width={50}
                            height={16}
                            className="w-auto h-4"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/activities/${activity.id}`}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(activity.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* CampHub/อื่นๆ: รูปแนวนอน - layout แบบ vertical (รูปด้านบน) */
                <>
                  {activity.image_url ? (
                    <Image
                      src={activity.image_url}
                      alt={activity.title}
                      width={400}
                      height={200}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-400 text-sm">
                      No image
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 line-clamp-2">
                          {activity.title}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          activity.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {activity.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className={`text-sm font-medium ${activity.price > 0 ? "text-pink-600" : "text-green-600"}`}>
                        {activity.price > 0 ? `฿${activity.price.toLocaleString()}` : "ฟรี"}
                      </span>
                      <div className="flex items-center gap-2">
                        {getSourceIcon(activity.source) && (
                          <Image
                            src={getSourceIcon(activity.source)!}
                            alt={activity.source}
                            width={60}
                            height={20}
                            className="w-auto h-5"
                          />
                        )}
                        {activity.link_url && (
                          <a
                            href={activity.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-purple-500"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">หมวดหมู่</span>
                        <div className="flex flex-col items-end">
                          <span className="text-gray-700">
                            {getCategoryGroupLabel(activity.category)}
                          </span>
                          {activity.subcategory && (
                            <span className="text-xs text-purple-600">
                              {getCategoryLabel(activity.subcategory)}
                            </span>
                          )}
                        </div>
                      </div>
                      {activity.start_date && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">วันที่</span>
                          <div className="flex items-center gap-1 text-gray-700">
                            <CalendarDays className="w-4 h-4" />
                            <span>{formatDate(activity.start_date)}</span>
                          </div>
                        </div>
                      )}
                      {activity.deadline && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">ปิดรับสมัคร</span>
                          <div className="flex items-center gap-1 text-gray-700">
                            <CalendarDays className="w-4 h-4" />
                            <span>{formatDate(activity.deadline)}</span>
                          </div>
                        </div>
                      )}
                      {activity.location && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">สถานที่</span>
                          <div className="flex items-center gap-1 text-gray-700">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate max-w-[150px]">
                              {activity.location}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Link
                        href={`/admin/activities/${activity.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        <span>แก้ไข</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                      >
                        <Trash className="w-4 h-4" />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                กิจกรรม
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                ค่าสมัคร
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                วันที่
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                ปิดรับสมัคร
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                สถานที่
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                แหล่งที่มา
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                สถานะ
              </th>
              <th className="text-right px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                จัดการ
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredActivities.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-12 text-center text-gray-500"
                >
                  {searchTerm ? "ไม่พบกิจกรรมที่ค้นหา" : "ยังไม่มีกิจกรรม"}
                </td>
              </tr>
            ) : (
              filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {activity.image_url ? (
                        <Image
                          src={activity.image_url}
                          alt={activity.title}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center text-purple-400 text-xs">
                          No img
                        </div>
                      )}
                      <div className="min-w-0 max-w-xs">
                        <p className="font-medium text-gray-800 break-words">
                          {activity.title}
                        </p>
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">
                            {getCategoryGroupLabel(activity.category)}
                          </span>
                          {activity.subcategory && (
                            <span className="text-xs text-purple-600">
                              {getCategoryLabel(activity.subcategory)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium text-sm ${activity.price > 0 ? "text-pink-600" : "text-green-600"}`}>
                      {activity.price > 0 ? `฿${activity.price.toLocaleString()}` : "ฟรี"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activity.start_date ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <CalendarDays className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDate(activity.start_date)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activity.deadline ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <CalendarDays className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDate(activity.deadline)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {activity.location ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate max-w-[150px]">
                          {activity.location}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(activity.source) && (
                        <Image
                          src={getSourceIcon(activity.source)!}
                          alt={activity.source}
                          width={60}
                          height={20}
                          className="w-auto h-5"
                        />
                      )}
                      {activity.link_url && (
                        <a
                          href={activity.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-purple-500"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        activity.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {activity.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/activities/${activity.id}`}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      </div>
    
  );
}
