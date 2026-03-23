"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import R2Image from "@/components/R2Image";
import { useRouter, Link } from "@/routing";
import { useAuth } from "@/components/AuthProvider";

type MyPost = {
  id: string;
  title: string;
  description?: string | null;
  university_name?: string | null;
  faculty_name?: string | null;
  program_name?: string | null;
  status?: string | null;
  cover_image_url?: string | null;
  created_at?: string | null;
  pageCount: number;
};

export default function MyPostsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/community/my-posts");
        const data = await res.json();
        if (!res.ok || data.error) {
          console.error(data.error);
          return;
        }
        setPosts(data.data || []);
      } catch (err) {
        console.error("Load my posts error", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-3 md:px-4 py-5 md:py-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            พอร์ตของฉัน
          </h1>
          <p className="text-sm text-gray-500">
            ประวัติการอัปโหลดพอร์ตทั้งหมดของคุณ
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href="/community"
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
          >
            Community
          </Link>
          <Link
            href="/community/upload"
            className="px-3 py-1.5 text-sm bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition font-semibold"
          >
            อัปโหลดใหม่
          </Link>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <p className="text-gray-500">คุณยังไม่มีพอร์ตที่อัปโหลด</p>
          <Link
            href="/community/upload"
            className="inline-block px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 text-sm font-semibold"
          >
            อัปโหลดพอร์ตเล่มแรก
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/community/${post.id}` as any}
              className="bg-white rounded-xl border shadow-sm hover:shadow-md transition overflow-hidden flex flex-col"
            >
              {post.cover_image_url ? (
                <div className="relative w-full aspect-[3/4] bg-gray-50">
                  <R2Image
                    src={post.cover_image_url}
                    alt={post.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  />
                </div>
              ) : (
                <div className="w-full aspect-[3/4] bg-gray-100 flex items-center justify-center text-gray-500 text-sm">
                  ไม่มีภาพ
                </div>
              )}
              <div className="p-2.5 md:p-3 flex-1 flex flex-col gap-1">
                <h3 className="font-bold text-sm md:text-base text-gray-900 line-clamp-1">
                  {post.title}
                </h3>
                <div className="text-[11px] md:text-xs text-pink-600 font-medium line-clamp-1">
                  {post.university_name || "ไม่ระบุ"} · {post.faculty_name || "ไม่ระบุคณะ"}
                </div>
                {post.program_name && (
                  <div className="text-[11px] md:text-xs text-gray-500 line-clamp-1">
                    {post.program_name}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-auto pt-1.5 text-xs text-gray-400">
                  <span>{post.pageCount} หน้า</span>
                  {post.created_at && (
                    <>
                      <span>·</span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString("th-TH", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
