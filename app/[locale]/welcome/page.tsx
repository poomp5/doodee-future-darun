"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowRight, Info, RefreshCw } from "lucide-react";
import { Link, useRouter } from "@/routing";
import { useAuth } from "@/components/AuthProvider";

const DreamUniversity = () => {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [checkingRedirect, setCheckingRedirect] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const checkIfAlreadyPicked = async () => {
      try {
        if (user) {
          const res = await fetch(`/api/db/interested-faculties?user_id=${user.id}`);
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            router.replace("/");
            return;
          }
        }
      } catch (error) {
        console.error("Error checking interested faculties:", error);
      } finally {
        setCheckingRedirect(false);
      }
    };

    checkIfAlreadyPicked();
  }, [authLoading, user, router]);

  const dreamUniversities = [
    {
      logo: "/university/cu.jpg",
      thaiName: "จุฬาลงกรณ์มหาวิทยาลัย",
      englishName: "Chulalongkorn University",
    },
    {
      logo: "/university/ku.jpeg",
      thaiName: "มหาวิทยาลัยเกษตรศาสตร์",
      englishName: "Kasetsart University",
    },
    {
      logo: "/university/kmutt.png",
      thaiName: "มหาวิทยาลัยพระจอมเกล้าธนบุรี",
      englishName: "King Mongkut's University of Technology Thonburi",
    },
    {
      logo: "/university/kmitl.png",
      thaiName: "สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง",
      englishName: "King Mongkut's Institute of Technology Ladkrabang",
    },
    {
      logo: "/university/kmutnb.png",
      thaiName: "มหาวิทยาลัยพระจอมเกล้าพระนครเหนือ",
      englishName: "King Mongkut's University of Technology North Bangkok",
    },
    {
      logo: "/university/tu.png",
      thaiName: "มหาวิทยาลัยธรรมศาสตร์",
      englishName: "Thammasat University",
    },
    {
      logo: "/university/mu.png",
      thaiName: "มหาวิทยาลัยมหิดล",
      englishName: "Mahidol University",
    },
    {
      logo: "/university/cmu.png",
      thaiName: "มหาวิทยาลัยเชียงใหม่",
      englishName: "Chiang Mai University",
    },
  ];

  if (checkingRedirect) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>กำลังโหลด...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-screen-sm px-4 pt-6 pb-32">
      <div className="mb-5 rounded-2xl border border-pink-100 bg-pink-50 px-4 py-3 shadow-sm">
        <div className="flex items-start gap-3 text-sm text-pink-900">
          <Info className="mt-0.5 h-5 w-5 text-pink-500" />
          <div className="space-y-1">
            <p className="font-semibold text-pink-700">
              เลือกมหาวิทยาลัยที่สนใจ แล้วกดปุ่ม “ไปเลือกคณะ” ด้านล่างเพื่อไปขั้นถัดไป
            </p>
            <p className="text-pink-700/80">
              แตะที่การ์ดหรือปุ่มลูกศรเพื่อไปหน้าคณะได้ทันที
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-center text-pink-600">
        มหาวิทยาลัยในฝันของคุณ
      </h2>
      <p className="mb-4 text-center text-gray-600">Universities of Interest</p>

      <div className="grid grid-cols-1 gap-4">
        {dreamUniversities.map((uni, index) => (
          <Link
            key={index}
            href="/faculty"
            aria-label={`ไปเลือกคณะที่ ${uni.thaiName}`}
            className="group flex items-center rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="relative mr-4 h-20 w-20 flex-shrink-0">
              <Image
                src={uni.logo}
                alt={`${uni.thaiName} Logo`}
                fill
                style={{ objectFit: "contain" }}
                className="rounded-full border bg-white"
              />
            </div>
            <div className="flex flex-1 items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {uni.thaiName}
                </h3>
                <p className="text-sm text-gray-600">{uni.englishName}</p>
              </div>
              <div className="flex items-center gap-1 text-sm font-semibold text-pink-600 transition group-hover:translate-x-1">
                ไปเลือกคณะ
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="fixed bottom-6 left-0 right-0 px-4">
        <Link
          href="/faculty"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-pink-600 px-4 py-3 text-white shadow-lg shadow-pink-200 transition hover:bg-pink-700"
        >
          ไปเลือกคณะ / สาขาต่อ
          <ArrowRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};

export default DreamUniversity;
