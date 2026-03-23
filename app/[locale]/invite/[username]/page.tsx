"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "@/routing";
import { useAuth } from "@/components/AuthProvider";
import Image from "next/image";
import { UserPlus, Gift, CircleAlert, PartyPopper, CheckCircle2 } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [referrer, setReferrer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const username = params.username as string;

  useEffect(() => {
    const trackInviteClick = async () => {
      try {
        setLoading(true);

        // Fetch referrer info by username from API
        const res = await fetch(`/api/db/referral?username=${username}`);
        const referrerData = await res.json();

        if (!res.ok || referrerData.error) {
          setError("ไม่พบผู้ใช้ที่คุณกำลังมองหา");
          setLoading(false);
          return;
        }

        // Check if user is trying to use their own referral link
        if (user && user.id === referrerData.id) {
          setError("ขออภัย ลิงก์นี้ถูกสร้างโดยคุณเอง");
          setLoading(false);
          setTimeout(() => {
            router.push("/");
          }, 2000);
          return;
        }

        setReferrer(referrerData);

        // Track the click (only if not already logged in)
        if (!user) {
          await fetch('/api/db/referral/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referrer_user_id: referrerData.id,
              referral_code: referrerData.referral_code || username,
              user_agent: navigator.userAgent,
            }),
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Error tracking invite:", err);
        setError("เกิดข้อผิดพลาด");
        setLoading(false);
      }
    };

    trackInviteClick();
  }, [username, user, router]);

  // If user is already logged in, redirect to home
  useEffect(() => {
    if (!authLoading && user) {
      // Check if this is a referral signup
      const checkAndAwardReferral = async () => {
        if (referrer && user.id !== referrer.id) {
          // Update referral tracking with signed up user
          await fetch('/api/db/referral/signup', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referrer_id: referrer.id,
            }),
          });
        }

        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push("/");
        }, 2000);
      };

      checkAndAwardReferral();
    }
  }, [authLoading, user, referrer, router]);

  const handleSignUp = () => {
    // Store referral code in localStorage before redirecting to login
    if (referrer) {
      localStorage.setItem("referral_code", referrer.referral_code || referrer.username);
      localStorage.setItem("referrer_id", referrer.id);
    }
    router.push("/login");
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-50 px-4">
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

  if (user && referrer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-50 px-4">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block bg-green-100 rounded-full p-4">
              <Gift className="w-16 h-16 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            <span className="inline-flex items-center gap-2">
              <PartyPopper className="w-6 h-6 text-pink-500" />
              ยินดีต้อนรับ!
            </span>
          </h1>
          <p className="text-gray-600 mb-4">
            คุณได้รับ 10 แต้มจากการสมัครผ่าน referral link!
          </p>
          <p className="text-sm text-gray-500">กำลังนำคุณไปยังหน้าแรก...</p>
        </div>
      </div>
    );
  }

  // Extract first name only (before space or full name)
  const referrerName = referrer?.first_name ||
    (referrer?.full_name ? referrer.full_name.split(' ')[0] : referrer?.username);

  return (
    
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-50 px-4">
      <div className="max-w-md w-full">
        {/* Invitation Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Referrer Info */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-pink-400">
                {referrer?.profile_image_url ? (
                  <Image
                    src={referrer.profile_image_url}
                    alt={referrerName}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-pink-200 flex items-center justify-center">
                    <UserPlus className="w-10 h-10 text-pink-600" />
                  </div>
                )}
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {referrerName} ชวนคุณมาสร้างอนาคต
            </h1>
            <p className="text-gray-600">
              Doodee Future วิเคราะห์ผลงาน และวางแผนการศึกษา
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-pink-50 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-pink-700 mb-3 flex items-center gap-2">
              <Gift className="w-5 h-5" />
              สิทธิพิเศษสำหรับคุณ
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                <span>รับ <strong className="text-pink-600">10 แต้ม</strong> ทันทีที่สมัคร</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                <span>วิเคราะห์ Portfolio ฟรี</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                <span>เข้าถึงแผนการเรียนและคอร์สแนะนำ</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-pink-600 mt-0.5 flex-shrink-0" />
                <span>แลกแต้มรับของรางวัล</span>
              </li>
            </ul>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleSignUp}
            className="w-full bg-pink-600 hover:bg-pink-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            เริ่มต้นใช้งานฟรี
          </button>

          <p className="text-center text-xs text-gray-500 mt-4">
            การสมัครใช้งานถือว่าคุณยอมรับเงื่อนไขการใช้งาน
          </p>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-6 text-sm text-gray-600">
          <p>
            มีบัญชีอยู่แล้ว?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-pink-600 hover:underline font-semibold"
            >
              เข้าสู่ระบบ
            </button>
          </p>
        </div>
      </div>
      </div>
    
  );
}
