"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import R2Image from "@/components/R2Image";
import { useParams } from "next/navigation";
import { useRouter, Link } from "@/routing";
import { useAuth } from "@/components/AuthProvider";
import Swal from "@/lib/swal-toast";
import { Share2, Instagram, Copy } from "lucide-react";

type PageItem = {
  id: string;
  pageNumber: number;
  imageUrl: string;
  aspectRatio?: number | null;
};

type PostDetail = {
  id: string;
  title: string;
  description?: string | null;
  university_name?: string | null;
  faculty_name?: string | null;
  field_name?: string | null;
  program_name?: string | null;
  cover_image_url?: string | null;
  created_at?: string | null;
  user?: {
    id: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  } | null;
  pages: PageItem[];
  rating?: { average: number; count: number };
};

export default function CommunityPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Rating state
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [userScore, setUserScore] = useState<number | null>(null);
  const [hoverStar, setHoverStar] = useState(0);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const isOwner = !!(user && post?.user && user.id === post.user.id);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/community/${id}`);
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error || "ไม่พบโพสต์");
          return;
        }
        setPost(data);
        if (data.rating) {
          setRatingAvg(data.rating.average || 0);
          setRatingCount(data.rating.count || 0);
        }
      } catch {
        setError("เกิดข้อผิดพลาดในการโหลด");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // Load user's own rating
  useEffect(() => {
    if (!id || !user) return;
    const loadUserRating = async () => {
      try {
        const res = await fetch(`/api/community/${id}/rate`);
        const data = await res.json();
        if (data.userScore) setUserScore(data.userScore);
      } catch {}
    };
    loadUserRating();
  }, [id, user]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightbox === null || !post) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowRight" && lightbox < post.pages.length - 1)
        setLightbox(lightbox + 1);
      if (e.key === "ArrowLeft" && lightbox > 0)
        setLightbox(lightbox - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightbox, post]);

  const handleRate = async (score: number) => {
    if (!user) {
      router.push("/login");
      return;
    }
    setRatingSubmitting(true);
    try {
      const res = await fetch(`/api/community/${id}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score }),
      });
      const data = await res.json();
      if (!res.ok || data.error) return;
      setRatingAvg(data.average);
      setRatingCount(data.count);
      setUserScore(data.userScore);
    } catch {}
    setRatingSubmitting(false);
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "ยืนยันลบโพสต์นี้?",
      text: "จะไม่สามารถกู้คืนได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ลบเลย",
      cancelButtonText: "ยกเลิก",
    });
    if (!result.isConfirmed) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/community/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || data.error) {
        Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: data.error || "", confirmButtonColor: "#db2777" });
        return;
      }
      await Swal.fire({ icon: "success", title: "ลบโพสต์สำเร็จ", timer: 1500, showConfirmButton: false });
      router.push("/community");
    } catch {
      Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", confirmButtonColor: "#db2777" });
    } finally {
      setDeleting(false);
    }
  };

  const buildStoryImage = async (coverUrl: string): Promise<Blob | null> => {
    const STORY_W = 1080;
    const STORY_H = 1920;
    // White area within the frame (measured from ig-story-share.png)
    const CONTENT_X = 28;
    const CONTENT_Y = 115;
    const CONTENT_W = STORY_W - CONTENT_X * 2; // ~1024
    const CONTENT_H = 1600;

    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    try {
      // Proxy R2 images through our own domain to avoid CORS tainted canvas
      const proxiedCoverUrl = coverUrl.includes("cdn.pranakorn.dev")
        ? coverUrl.replace("https://cdn.pranakorn.dev", "/r2-proxy")
        : coverUrl;

      const [coverImg, frameImg] = await Promise.all([
        loadImg(proxiedCoverUrl),
        loadImg("/ig-story-share.png"),
      ]);

      const canvas = document.createElement("canvas");
      canvas.width = STORY_W;
      canvas.height = STORY_H;
      const ctx = canvas.getContext("2d")!;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, STORY_W, STORY_H);

      // Fit cover image inside content area (center, maintain aspect ratio)
      const coverAspect = coverImg.width / coverImg.height;
      const contentAspect = CONTENT_W / CONTENT_H;
      let drawW: number, drawH: number;
      if (coverAspect > contentAspect) {
        drawW = CONTENT_W;
        drawH = CONTENT_W / coverAspect;
      } else {
        drawH = CONTENT_H;
        drawW = CONTENT_H * coverAspect;
      }
      const drawX = CONTENT_X + (CONTENT_W - drawW) / 2;
      const drawY = CONTENT_Y + (CONTENT_H - drawH) / 2;
      ctx.drawImage(coverImg, drawX, drawY, drawW, drawH);

      // Overlay frame on top
      ctx.drawImage(frameImg, 0, 0, STORY_W, STORY_H);

      return await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );
    } catch {
      return null;
    }
  };

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [buildingStory, setBuildingStory] = useState(false);

  const handleShareStory = async () => {
    const coverUrl = post?.pages?.[0]?.imageUrl || post?.cover_image_url;
    if (!coverUrl) return;

    setBuildingStory(true);
    const storyBlob = await buildStoryImage(coverUrl);
    setBuildingStory(false);

    if (!storyBlob) {
      Swal.fire({ icon: "error", title: "สร้างรูป Story ไม่สำเร็จ", timer: 2000, showConfirmButton: false });
      return;
    }

    const file = new File([storyBlob], "doodee-story.png", { type: "image/png" });

    // Mobile: use Web Share API with file
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          title: `${post?.title || "ผลงาน"} - Doodee Community`,
          files: [file],
        });
        setShowShareMenu(false);
        return;
      } catch {}
    }

    // Desktop: download the image
    const a = document.createElement("a");
    a.href = URL.createObjectURL(storyBlob);
    a.download = "doodee-story.png";
    a.click();
    URL.revokeObjectURL(a.href);
    setShowShareMenu(false);
    Swal.fire({
      icon: "success",
      title: "ดาวน์โหลดรูป Story แล้ว",
      text: "นำไปโพสต์ใน Instagram Story ได้เลย",
      timer: 2500,
      showConfirmButton: false,
    });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShowShareMenu(false);
      Swal.fire({
        icon: "success",
        title: "คัดลอกลิงก์แล้ว",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch {}
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center text-gray-500">
        กำลังโหลด...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-gray-600">{error || "ไม่พบโพสต์"}</p>
        <button
          onClick={() => router.push("/community")}
          className="text-pink-600 underline text-sm"
        >
          กลับหน้า Community
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-3 md:px-4 py-5 md:py-8 space-y-4 md:space-y-6">
        {/* Back link */}
        <Link
          href="/community"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-pink-600 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          กลับหน้า Community
        </Link>

        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {post.title}
            </h1>
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 text-gray-500 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition"
                  title="แชร์"
                >
                  <Share2 className="w-5 h-5" />
                </button>
                {showShareMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowShareMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 w-56">
                      <button
                        onClick={handleShareStory}
                        disabled={buildingStory}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600 transition disabled:opacity-50"
                      >
                        {buildingStory ? (
                          <div className="w-5 h-5 border-2 border-pink-300 border-t-pink-600 rounded-full animate-spin" />
                        ) : (
                          <Instagram className="w-5 h-5" />
                        )}
                        <span>{buildingStory ? "กำลังสร้างรูป..." : "แชร์ลง IG Story"}</span>
                      </button>
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition"
                      >
                        <Copy className="w-5 h-5" />
                        <span>คัดลอกลิงก์</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
              {isOwner && (
                <>
                  <Link
                    href={`/community/${post.id}/edit` as any}
                    className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                  >
                    แก้ไข
                  </Link>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-3 py-1.5 text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition disabled:opacity-50"
                  >
                    {deleting ? "กำลังลบ..." : "ลบ"}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            {(post.university_name || post.faculty_name || post.program_name || post.field_name) && (
              <span className="text-pink-600 font-semibold">
                {post.university_name || "ไม่ระบุ"} · {post.faculty_name || "ไม่ระบุคณะ"}
                {post.program_name
                  ? ` · ${post.program_name}`
                  : post.field_name
                    ? ` · ${post.field_name}`
                    : ""}
              </span>
            )}
            {post.pages.length > 0 && (
              <span>{post.pages.length} หน้า</span>
            )}
          </div>
          {post.description && (
            <p className="text-gray-600">{post.description}</p>
          )}
          {/* User info */}
          {post.user && (
            <div className="flex items-center gap-2 pt-1">
              {post.user.image ? (
                <Image
                  src={post.user.image}
                  alt={post.user.name || "user"}
                  width={28}
                  height={28}
                  className="rounded-full"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center text-xs font-bold">
                  {(post.user.username || post.user.name || "U")
                    .slice(0, 1)
                    .toUpperCase()}
                </div>
              )}
              <span className="text-sm text-gray-600">
                โพสต์โดย {post.user.name || post.user.username || "ไม่ระบุ"}
              </span>
            </div>
          )}

          {/* Star Rating */}
          <div className="flex items-center gap-3 pt-2">
            <div
              className="flex items-center gap-0.5"
              onMouseLeave={() => setHoverStar(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const filled = hoverStar ? star <= hoverStar : star <= (userScore || 0);
                return (
                  <button
                    key={star}
                    type="button"
                    disabled={ratingSubmitting}
                    onClick={() => handleRate(star)}
                    onMouseEnter={() => setHoverStar(star)}
                    className="p-0.5 transition disabled:opacity-50"
                  >
                    <svg
                      className={`w-7 h-7 transition ${
                        filled ? "text-yellow-400" : "text-gray-300"
                      }`}
                      fill={filled ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                );
              })}
            </div>
            <div className="text-sm text-gray-500">
              <span className="font-semibold text-gray-700">{ratingAvg > 0 ? ratingAvg : "-"}</span>
              {ratingCount > 0 && <span> ({ratingCount} คะแนน)</span>}
            </div>
            {userScore && (
              <span className="text-xs text-pink-600">คุณให้ {userScore} ดาว</span>
            )}
          </div>
        </div>

        {/* Pages grid */}
        {post.pages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">ไม่มีหน้าที่แสดง</div>
        ) : (
          <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-4">
            {post.pages.map((page, idx) => (
              <button
                key={page.id}
                onClick={() => setLightbox(idx)}
                className="relative w-full bg-gray-50 border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer group"
              >
                <div
                  className="relative w-full"
                  style={{ aspectRatio: page.aspectRatio ? `${page.aspectRatio}` : "3/4" }}
                >
                  <R2Image
                    src={page.imageUrl}
                    alt={`หน้า ${page.pageNumber}`}
                    fill
                    className="object-contain group-hover:scale-[1.01] transition"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                  หน้า {page.pageNumber}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox !== null && post.pages[lightbox] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            หน้า {post.pages[lightbox].pageNumber} / {post.pages.length}
          </div>

          {lightbox > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox - 1); }}
              className="absolute left-2 md:left-4 text-white/70 hover:text-white p-2"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <div
            className="relative w-full h-full max-w-4xl max-h-[90vh] mx-2 md:mx-12"
            onClick={(e) => e.stopPropagation()}
          >
            <R2Image
              src={post.pages[lightbox].imageUrl}
              alt={`หน้า ${post.pages[lightbox].pageNumber}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {lightbox < post.pages.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(lightbox + 1); }}
              className="absolute right-2 md:right-4 text-white/70 hover:text-white p-2"
            >
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </>
  );
}
