"use client";
import { useState, useEffect } from "react";
import { Link } from "@/routing";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Star,
  ExternalLink,
} from "lucide-react";
import Swal from "@/lib/swal-toast";

interface PointsCourse {
  id: number;
  title: string;
  description: string;
  image_url: string;
  points_cost: number;
  link_url: string;
  course_id: number | null;
  course_type: string;
  is_active: boolean;
  display_order: number;
  created_at: string;
}

export default function PointsCoursesPage() {
  const [courses, setCourses] = useState<PointsCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/db/points-courses");
      const data = await res.json();
      setCourses(data.data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDelete = async (id: number, title: string) => {
    const result = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: `คุณต้องการลบ "${title}" ใช่หรือไม่?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/db/points-courses?id=${id}`, {
          method: "DELETE",
        });

        if (res.ok) {
          Swal.fire({
            icon: "success",
            title: "ลบสำเร็จ",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchCourses();
        } else {
          throw new Error("Delete failed");
        }
      } catch (error) {
        Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด" });
      }
    }
  };

  const handleToggleActive = async (course: PointsCourse) => {
    try {
      const res = await fetch("/api/db/points-courses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: course.id,
          is_active: !course.is_active,
        }),
      });

      if (res.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error("Error toggling active:", error);
    }
  };

  const filteredCourses = courses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getCourseTypeLabel = (type: string) => {
    switch (type) {
      case "from_courses":
        return "จากคอร์สในระบบ";
      case "custom":
        return "เพิ่มเอง";
      default:
        return type;
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Star className="w-7 h-7 text-pink-500" />
            คอร์สในหน้า Points
          </h1>
          <p className="text-gray-500 mt-1">
            จัดการคอร์สที่แสดงในหน้า Points สำหรับผู้ใช้
          </p>
        </div>
        <Link
          href="/admin/points-courses/new"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white px-4 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus className="w-5 h-5" />
          <span>เพิ่มคอร์สใหม่</span>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาคอร์ส..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-pink-500"
          />
        </div>
      </div>

      {/* Course List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 animate-pulse"
            >
              <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">ยังไม่มีคอร์สในหน้า Points</p>
          <Link
            href="/admin/points-courses/new"
            className="inline-flex items-center gap-2 mt-4 text-pink-500 hover:text-pink-600"
          >
            <Plus className="w-4 h-4" />
            เพิ่มคอร์สใหม่
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all ${
                course.is_active
                  ? "border-gray-100"
                  : "border-gray-200 opacity-60"
              }`}
            >
              {/* Image */}
              <div className="relative h-36 bg-gray-100">
                {course.image_url ? (
                  <Image
                    src={course.image_url}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <Star className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                {/* Type Badge */}
                <div className="absolute top-2 left-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      course.course_type === "from_courses"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    {getCourseTypeLabel(course.course_type)}
                  </span>
                </div>
                {/* Points Badge */}
                <div className="absolute top-2 right-2">
                  <span className="bg-pink-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {course.points_cost} Points
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                  {course.description || "ไม่มีคำอธิบาย"}
                </p>

                {/* Link */}
                {course.link_url && (
                  <a
                    href={course.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 mb-3"
                  >
                    <ExternalLink className="w-3 h-3" />
                    ดูลิงก์
                  </a>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleToggleActive(course)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                        course.is_active ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${
                          course.is_active ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </div>
                    <span className={`text-sm font-medium ${course.is_active ? "text-green-600" : "text-gray-400"}`}>
                      {course.is_active ? "เปิด" : "ปิด"}
                    </span>
                  </button>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/points-courses/${course.id}`}
                      className="p-2 text-gray-500 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(course.id, course.title)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
