"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, School, ExternalLink, Check, X, Pencil, GraduationCap, BookOpen } from "lucide-react";
import R2Image from "@/components/R2Image";
import SearchSelect from "@/components/SearchSelect";

type AdminPost = {
  id: string;
  title: string;
  status: string | null;
  university_name: string | null;
  faculty_name: string | null;
  field_name: string | null;
  cover_image_url: string | null;
  created_at: string | null;
  user: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
    school_name: string | null;
  } | null;
};

type EditState = {
  school: string;
  university: string;
  faculty: string;
  field: string;
};

type FilterOption = { th?: string | null; en?: string | null };

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filter options
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);
  const [universities, setUniversities] = useState<string[]>([]);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [fields, setFields] = useState<string[]>([]);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState>({ school: "", university: "", faculty: "", field: "" });
  const [saving, setSaving] = useState(false);

  // Load school options + community filters
  useEffect(() => {
    const load = async () => {
      try {
        const [schoolRes, filtersRes] = await Promise.all([
          fetch("/api/community/schools/all"),
          fetch("/api/community/filters"),
        ]);
        const schoolData = await schoolRes.json();
        if (Array.isArray(schoolData.schools)) setSchoolOptions(schoolData.schools);

        const filtersData = await filtersRes.json();
        if (!filtersData.error) {
          setUniversities((filtersData.universities || []).map((u: FilterOption) => u.th || u.en || "").filter(Boolean));
          setFaculties((filtersData.faculties || []).map((f: FilterOption) => f.th || f.en || "").filter(Boolean));
          setFields((filtersData.fields || []).map((f: FilterOption) => f.th || f.en || "").filter(Boolean));
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const fetchPosts = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      if (q) params.set("search", q);
      const res = await fetch(`/api/admin/community?${params}`);
      const data = await res.json();
      setPosts(data.data || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => fetchPosts(search), 300);
    return () => clearTimeout(t);
  }, [search, fetchPosts]);

  const startEdit = (post: AdminPost) => {
    setEditingId(post.id);
    setEditState({
      school: post.user?.school_name || "",
      university: post.university_name || "",
      faculty: post.faculty_name || "",
      field: post.field_name || "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState({ school: "", university: "", faculty: "", field: "" });
  };

  const saveEdit = async (postId: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/community/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          school_name: editState.school,
          university_name: editState.university,
          faculty_name: editState.faculty,
          field_name: editState.field,
        }),
      });
      if (res.ok) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  university_name: editState.university || null,
                  faculty_name: editState.faculty || null,
                  field_name: editState.field || null,
                  user: p.user ? { ...p.user, school_name: editState.school || null } : p.user,
                }
              : p
          )
        );
        cancelEdit();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Community Ports</h1>
          <p className="text-sm text-gray-500">
            พอร์ตทั้งหมดในระบบ {total} รายการ
          </p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ค้นหาจากชื่อ, มหาวิทยาลัย, ผู้ใช้"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-50"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3">พอร์ต</th>
                <th className="px-4 py-3">ผู้อัปโหลด</th>
                <th className="px-4 py-3 min-w-[220px]">โรงเรียน</th>
                <th className="px-4 py-3 min-w-[220px]">มหาวิทยาลัย</th>
                <th className="px-4 py-3 min-w-[200px]">คณะ / สาขา</th>
                <th className="px-4 py-3">สถานะ</th>
                <th className="px-4 py-3">วันที่</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                    ไม่พบรายการ
                  </td>
                </tr>
              ) : (
                posts.map((post) => {
                  const isEditing = editingId === post.id;
                  return (
                    <tr key={post.id} className="align-top hover:bg-gray-50/50">
                      {/* Cover + title */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                            {post.cover_image_url ? (
                              <R2Image src={post.cover_image_url} alt={post.title} fill className="object-cover" />
                            ) : (
                              <div className="flex h-full items-center justify-center text-gray-300 text-xs">-</div>
                            )}
                          </div>
                          <p className="max-w-[140px] truncate text-sm font-medium text-gray-900">{post.title}</p>
                        </div>
                      </td>

                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {post.user?.image ? (
                            <Image src={post.user.image} alt={post.user.name || ""} width={24} height={24} className="rounded-full shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {(post.user?.name || "U").slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900 max-w-[110px] truncate">{post.user?.name || "-"}</p>
                            {post.user?.username && <p className="text-xs text-gray-400">@{post.user.username}</p>}
                          </div>
                        </div>
                      </td>

                      {/* School */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <SearchSelect
                            value={editState.school}
                            onChange={(v) => setEditState((s) => ({ ...s, school: v }))}
                            options={schoolOptions}
                            placeholder="เลือกโรงเรียน"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => startEdit(post)}>
                            <School className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className={`text-sm ${post.user?.school_name ? "text-gray-800" : "text-gray-400"}`}>
                              {post.user?.school_name || "ไม่ระบุ"}
                            </span>
                            <Pencil className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 text-pink-500 transition-opacity" />
                          </div>
                        )}
                      </td>

                      {/* University */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <SearchSelect
                            value={editState.university}
                            onChange={(v) => setEditState((s) => ({ ...s, university: v }))}
                            options={universities}
                            placeholder="เลือกมหาวิทยาลัย"
                          />
                        ) : (
                          <div className="flex items-center gap-1.5 group cursor-pointer" onClick={() => startEdit(post)}>
                            <GraduationCap className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                            <span className={`text-sm line-clamp-1 ${post.university_name ? "text-gray-800" : "text-gray-400"}`}>
                              {post.university_name || "ไม่ระบุ"}
                            </span>
                            <Pencil className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 text-pink-500 transition-opacity shrink-0" />
                          </div>
                        )}
                      </td>

                      {/* Faculty / Field */}
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5">
                            <SearchSelect
                              value={editState.faculty}
                              onChange={(v) => setEditState((s) => ({ ...s, faculty: v }))}
                              options={faculties}
                              placeholder="คณะ"
                            />
                            <SearchSelect
                              value={editState.field}
                              onChange={(v) => setEditState((s) => ({ ...s, field: v }))}
                              options={fields}
                              placeholder="สาขา"
                            />
                          </div>
                        ) : (
                          <div className="flex items-start gap-1.5 group cursor-pointer" onClick={() => startEdit(post)}>
                            <BookOpen className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <div>
                              <p className={`text-sm line-clamp-1 ${post.faculty_name ? "text-gray-800" : "text-gray-400"}`}>
                                {post.faculty_name || "ไม่ระบุคณะ"}
                              </p>
                              {post.field_name && <p className="text-xs text-gray-500 line-clamp-1">{post.field_name}</p>}
                            </div>
                            <Pencil className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 text-pink-500 transition-opacity shrink-0 mt-0.5" />
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          post.status === "open" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {post.status || "-"}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(post.created_at)}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => saveEdit(post.id)}
                                disabled={saving}
                                className="rounded-lg bg-pink-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-pink-700 disabled:opacity-50 flex items-center gap-1"
                              >
                                <Check className="h-3.5 w-3.5" />
                                บันทึก
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="rounded-lg bg-gray-100 p-1.5 text-gray-600 hover:bg-gray-200"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <Link
                              href={`/th/community/${post.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              ดู
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
