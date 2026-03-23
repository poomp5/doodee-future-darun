"use client";
import { useState, useEffect } from "react";
import { Plus, Edit, Trash, Search, ExternalLink, CalendarDays } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Image from "next/image";
import { Link } from "@/routing";
import Swal from "@/lib/swal-toast";
import { getCategoryLabel, getCategoryGroupLabel, SOURCE_OPTIONS } from "@/lib/categories";

interface Course {
  id: number;
  title: string;
  description: string;
  image_url: string;
  price: number;
  category: string;
  subcategory: string;
  duration: string;
  instructor: string;
  source: string;
  link_url: string;
  is_active: boolean;
  display_order: number;
  deadline: string | null;
  max_participants: number | null;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const TableSkeleton = () => (
    <div className="p-4 md:p-8 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="h-6 w-40 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-32 bg-gray-100 rounded" />
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
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/db/courses");
      const data = await res.json();
      setCourses(data.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "ยืนยันการลบ?",
      text: "คุณต้องการลบคอร์สนี้หรือไม่?",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        await fetch(`/api/db/courses?id=${id}`, { method: "DELETE" });
        setCourses(courses.filter((c) => c.id !== id));
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

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSourceIcon = (source: string) => {
    const sourceOpt = SOURCE_OPTIONS.find((s) => s.value === source);
    return sourceOpt?.icon;
  };

  const formatDate = (dateStr: string | null) => {
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
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">จัดการคอร์ส</h1>
          <p className="text-gray-500">ทั้งหมด {courses.length} คอร์ส</p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มคอร์สใหม่</span>
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="ค้นหาคอร์ส..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
        />
      </div>

      {/* Mobile/Tablet Card View */}
      <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCourses.length === 0 ? (
          <div className="md:col-span-2 bg-white rounded-xl p-8 text-center text-gray-500 shadow-sm border border-gray-100">
            {searchTerm ? "ไม่พบคอร์สที่ค้นหา" : "ยังไม่มีคอร์ส"}
          </div>
        ) : (
          filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              {/* Contester: รูปแนวตั้ง - layout แบบ horizontal (รูปด้านข้าง) */}
              {course.source === "contester" ? (
                <div className="flex">
                  {course.image_url ? (
                    <Image
                      src={course.image_url}
                      alt={course.title}
                      width={120}
                      height={160}
                      className="w-28 h-36 object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-28 h-36 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-400 text-xs flex-shrink-0">
                      No img
                    </div>
                  )}
                  <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                    <div>
                      <p className="font-medium text-gray-800 line-clamp-2 text-sm">
                        {course.title}
                      </p>
                      {course.instructor && (
                        <p className="text-xs text-gray-500 mt-1">โดย {course.instructor}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span className="text-xs font-medium text-pink-600">
                          {Number(course.price) === 0
                            ? "ฟรี"
                            : `฿${Number(course.price).toLocaleString()}`}
                        </span>
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            course.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {course.is_active ? "เปิด" : "ปิด"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        {getSourceIcon(course.source) && (
                          <Image
                            src={getSourceIcon(course.source)!}
                            alt={course.source}
                            width={50}
                            height={16}
                            className="w-auto h-4"
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/courses/${course.id}`}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
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
                  {course.image_url ? (
                    <Image
                      src={course.image_url}
                      alt={course.title}
                      width={400}
                      height={200}
                      className="w-full h-40 object-cover"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-400 text-sm">
                      No image
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 line-clamp-2">
                          {course.title}
                        </p>
                        {course.instructor && (
                          <p className="text-sm text-gray-500 mt-1">โดย {course.instructor}</p>
                        )}
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          course.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {course.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      <span className="text-sm font-medium text-pink-600">
                        {Number(course.price) === 0
                          ? "ฟรี"
                          : `฿${Number(course.price).toLocaleString()}`}
                      </span>
                      <div className="flex items-center gap-2">
                        {getSourceIcon(course.source) && (
                          <Image
                            src={getSourceIcon(course.source)!}
                            alt={course.source}
                            width={60}
                            height={20}
                            className="w-auto h-5"
                          />
                        )}
                        {course.link_url && (
                          <a
                            href={course.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-pink-500"
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
                          <span className="text-gray-700">{getCategoryGroupLabel(course.category)}</span>
                          {course.subcategory && (
                            <span className="text-xs text-purple-600">{getCategoryLabel(course.subcategory)}</span>
                          )}
                        </div>
                      </div>
                      {course.deadline && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">ปิดรับสมัคร</span>
                          <div className="flex items-center gap-1 text-gray-700">
                            <CalendarDays className="w-4 h-4" />
                            <span>{formatDate(course.deadline)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors text-sm"
                      >
                        <Edit className="w-4 h-4" />
                        <span>แก้ไข</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id)}
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
                คอร์ส
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                หมวดหมู่
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                ราคา
              </th>
              <th className="text-left px-6 py-4 text-sm font-medium text-gray-500 whitespace-nowrap">
                ปิดรับสมัคร
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
            {filteredCourses.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  {searchTerm ? "ไม่พบคอร์สที่ค้นหา" : "ยังไม่มีคอร์ส"}
                </td>
              </tr>
            ) : (
              filteredCourses.map((course) => (
                <tr key={course.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {course.image_url ? (
                        <Image
                          src={course.image_url}
                          alt={course.title}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-pink-400 text-xs">
                          No img
                        </div>
                      )}
                      <div className="min-w-0 max-w-xs">
                        <p className="font-medium text-gray-800 break-words">
                          {course.title}
                        </p>
                        {course.instructor && (
                          <p className="text-sm text-gray-500">
                            โดย {course.instructor}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm text-gray-600">
                        {getCategoryGroupLabel(course.category)}
                      </span>
                      {course.subcategory && (
                        <span className="text-xs text-purple-600">
                          {getCategoryLabel(course.subcategory)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-pink-600">
                      {Number(course.price) === 0
                        ? "ฟรี"
                        : `฿${Number(course.price).toLocaleString()}`}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {course.deadline ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <CalendarDays className="w-4 h-4 flex-shrink-0" />
                        <span>{formatDate(course.deadline)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getSourceIcon(course.source) && (
                        <Image
                          src={getSourceIcon(course.source)!}
                          alt={course.source}
                          width={60}
                          height={20}
                          className="w-auto h-5"
                        />
                      )}
                      {course.link_url && (
                        <a
                          href={course.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-pink-500"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        course.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {course.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/courses/${course.id}`}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id)}
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
