"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/routing";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";
import R2Image from "@/components/R2Image";
import {
  User,
  MapPin,
  Calendar,
  Award,
  Trophy,
  Star,
  Eye,
  Share2,
  GraduationCap,
  CircleAlert,
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Swal from "@/lib/swal-toast";

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [stats, setStats] = useState({
    totalPoints: 0,
    completedTodos: 0,
    portfolios: 0,
    views: 0,
  });
  const [interestedFaculties, setInterestedFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const username = params.username as string;

  useEffect(() => {
    const fetchPublicProfile = async () => {
      try {
        setLoading(true);

        // Fetch profile with stats from API
        const res = await fetch(`/api/db/profile?username=${username}`);
        const data = await res.json();

        if (!res.ok || data.error) {
          setError("ไม่พบโปรไฟล์ที่คุณกำลังมองหา");
          setLoading(false);
          return;
        }

        setProfileUser(data.user);
        setStats(data.stats);
        setInterestedFaculties(data.interestedFaculties || []);

        // Track profile view
        await fetch('/api/db/profile/view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profile_user_id: data.user.id,
            viewer_user_id: currentUser?.id || null,
            user_agent: navigator.userAgent,
            referer: document.referrer || null,
          }),
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching public profile:", err);
        setError("เกิดข้อผิดพลาดในการโหลดโปรไฟล์");
        setLoading(false);
      }
    };

    fetchPublicProfile();
  }, [username, currentUser]);

  const handleShareProfile = () => {
    const profileUrl = `${window.location.origin}/u/${username}`;

    if (navigator.share) {
      navigator
        .share({
          title: `โปรไฟล์ของ ${displayName}`,
          text: "มาดูโปรไฟล์ของฉันบน Doodee Future!",
          url: profileUrl,
        })
        .catch((err) => console.log("Error sharing:", err));
    } else {
      navigator.clipboard.writeText(profileUrl);
      Swal.fire({
        icon: "success",
        title: "คัดลอกลิงก์แล้ว!",
        text: "ลิงก์โปรไฟล์ถูกคัดลอกไปยังคลิปบอร์ดแล้ว",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleInviteFriend = () => {
    router.push(`/invite/${username}`);
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4 inline-flex items-center gap-2">
            <CircleAlert className="w-6 h-6 text-red-500" />
            {error}
          </h1>
          <button
            onClick={() => router.push("/")}
            className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-2 rounded-lg"
          >
            กลับสู่หน้าแรก
          </button>
        </div>
      </div>
    );
  }

  const displayName =
    profileUser?.first_name && profileUser?.last_name
      ? `${profileUser.first_name} ${profileUser.last_name}`
      : profileUser?.full_name || profileUser?.username;

  const isOwnProfile = currentUser?.id === profileUser?.id;

  return (
    
      <div className="min-h-screen bg-gray-50 pb-24">
      <div className="container mx-auto px-4 pt-12 max-w-4xl">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Profile Image */}
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-pink-400 flex-shrink-0">
              {profileUser?.profile_image_url ? (
                <R2Image
                  src={profileUser.profile_image_url}
                  alt={displayName}
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-pink-200 flex items-center justify-center">
                  <User className="w-16 h-16 text-pink-600" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {displayName}
              </h1>
              <p className="text-gray-600 mb-1">@{profileUser?.username}</p>

              {profileUser?.bio && (
                <p className="text-gray-700 mt-3 mb-4">{profileUser.bio}</p>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
                <button
                  onClick={handleShareProfile}
                  className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  แชร์โปรไฟล์
                </button>

                {!isOwnProfile && (
                  <button
                    onClick={handleInviteFriend}
                    className="flex items-center gap-2 bg-white hover:bg-gray-100 text-pink-600 border-2 border-pink-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    <Award className="w-4 h-4" />
                    รับโค้ดเชิญเพื่อน
                  </button>
                )}

                {isOwnProfile && (
                  <button
                    onClick={() => router.push("/profile")}
                    className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    แก้ไขโปรไฟล์
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.totalPoints}</p>
            <p className="text-sm text-gray-600">แต้มสะสม</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <Star className="w-8 h-8 text-pink-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.completedTodos}</p>
            <p className="text-sm text-gray-600">งานที่ทำเสร็จ</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <Award className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.portfolios}</p>
            <p className="text-sm text-gray-600">Portfolio</p>
          </div>

          <div className="bg-white rounded-xl shadow p-6 text-center">
            <Eye className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-800">{stats.views}</p>
            <p className="text-sm text-gray-600">ผู้เข้าชม</p>
          </div>
        </div>

        {/* Interested Faculties - Horizontal Scroll */}
        {interestedFaculties.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-6 h-6 text-pink-600" />
              <h2 className="text-xl font-bold text-gray-800">คณะที่สนใจ</h2>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-pink-300 scrollbar-track-pink-50">
              {interestedFaculties.map((faculty, index) => (
                <div
                  key={faculty.id || index}
                  className="flex-shrink-0 w-64 bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-100 hover:shadow-md transition-shadow"
                >
                  {/* University Logo & Rank */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="relative">
                      {faculty.university_logo_url ? (
                        <R2Image
                          src={faculty.university_logo_url}
                          alt={faculty.university_name_th}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-contain bg-white border-2 border-pink-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-pink-200 flex items-center justify-center">
                          <GraduationCap className="w-6 h-6 text-pink-600" />
                        </div>
                      )}
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500 truncate">
                        {faculty.university_name_th}
                      </p>
                    </div>
                  </div>

                  {/* Faculty & Program */}
                  <div className="space-y-1">
                    <h3 className="font-semibold text-gray-800 text-sm leading-tight line-clamp-2">
                      {faculty.faculty_name_th}
                    </h3>
                    <p className="text-xs text-pink-600 font-medium truncate">
                      {faculty.program_name_th}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">เกี่ยวกับ</h2>

          <div className="space-y-3">
            {profileUser?.email && (
              <div className="flex items-center gap-3 text-gray-700">
                <User className="w-5 h-5 text-gray-400" />
                <span>{profileUser.email}</span>
              </div>
            )}

            <div className="flex items-center gap-3 text-gray-700">
              <Calendar className="w-5 h-5 text-gray-400" />
              <span>
                เข้าร่วมเมื่อ{" "}
                {new Date(profileUser?.created_at).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            {profileUser?.referral_code && (
              <div className="mt-4 p-4 bg-pink-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">รหัสเชิญเพื่อน</p>
                <code className="text-lg font-mono font-bold text-pink-600">
                  {profileUser.referral_code}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* CTA for non-logged in users */}
        {!currentUser && (
          <div className="mt-6 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl shadow-lg p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-2">เริ่มต้นใช้งานฟรี!</h3>
            <p className="mb-4">
              สร้างโปรไฟล์ของคุณเอง วางแผนการศึกษา และสะสมแต้มรับรางวัล
            </p>
            <button
              onClick={() => router.push("/login")}
              className="bg-white text-pink-600 font-bold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
            >
              สมัครใช้งานฟรี
            </button>
          </div>
        )}
      </div>
      </div>
    
  );
}
