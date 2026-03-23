"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/routing";
import { useAuth } from "@/components/AuthProvider";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Gift, CheckCircle, PartyPopper } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<'loading' | 'awarding' | 'success' | 'done'>('loading');
  const [pointsAwarded, setPointsAwarded] = useState(0);

  useEffect(() => {
    const processReferral = async () => {
      if (authLoading) return;

      if (!user) {
        // Not logged in, redirect to login
        router.push("/login");
        return;
      }

      // Check if there's a referral in localStorage
      const referrerId = localStorage.getItem("referrer_id");
      const referralCode = localStorage.getItem("referral_code");

      if (referrerId && referralCode) {
        setStatus('awarding');

        try {
          // Call API to award referral points
          const res = await fetch('/api/db/referral/signup', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              referrer_id: referrerId,
            }),
          });

          const data = await res.json();

          if (data.success) {
            setPointsAwarded(data.points_awarded || 10);
            setStatus('success');

            // Clear referral data from localStorage
            localStorage.removeItem("referrer_id");
            localStorage.removeItem("referral_code");

            // Wait 2 seconds then redirect
            setTimeout(() => {
              router.push("/profile?welcome=referral");
            }, 2000);
          } else {
            // Already referred or error - just redirect
            localStorage.removeItem("referrer_id");
            localStorage.removeItem("referral_code");
            setStatus('done');
            router.push("/profile");
          }
        } catch (error) {
          console.error("Error awarding referral points:", error);
          localStorage.removeItem("referrer_id");
          localStorage.removeItem("referral_code");
          setStatus('done');
          router.push("/profile");
        }
      } else {
        // No referral, just redirect to profile
        setStatus('done');
        router.push("/profile");
      }
    };

    processReferral();
  }, [user, authLoading, router]);

  if (authLoading || status === 'loading') {
    return <LoadingSpinner fullScreen />;
  }

  if (status === 'awarding') {
    return (
      
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-50 px-4">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block animate-bounce">
                <Gift className="w-16 h-16 text-pink-500" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              กำลังให้รางวัล...
            </h1>
            <p className="text-gray-600">รอสักครู่</p>
          </div>
        </div>
      
    );
  }

  if (status === 'success') {
    return (
      
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-pink-50 px-4">
          <div className="text-center">
            <div className="mb-4">
              <div className="inline-block bg-green-100 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              <span className="inline-flex items-center gap-2">
                <PartyPopper className="w-6 h-6 text-pink-500" />
                ยินดีด้วย!
              </span>
            </h1>
            <p className="text-gray-600 mb-2">
              คุณได้รับ <span className="font-bold text-pink-600">{pointsAwarded} แต้ม</span> จากการสมัครผ่าน Referral!
            </p>
            <p className="text-sm text-gray-500">กำลังนำคุณไปยังโปรไฟล์...</p>
          </div>
        </div>
      
    );
  }

  return <LoadingSpinner fullScreen />;
}
