"use client";
import { useState, useEffect } from "react";
import {
  Star,
  ShoppingBag,
  History,
  TrendingUp,
  GraduationCap,
  Gift,
} from "lucide-react";
import Image from "next/image";
import { Link, useRouter } from "@/routing";
import Swal from "@/lib/swal-toast";
import { useAuth } from "@/components/AuthProvider";
import { useTranslations } from "next-intl";

const PointsPage = () => {
  const t = useTranslations("points");
  const tCommon = useTranslations("common");
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const dateLocale =
    typeof navigator !== "undefined" ? navigator.language : "th-TH";

  // Real user points data from database
  const [userPoints, setUserPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const maxPoints = 100; // Doodee Pro Max
  const progressPercent = Math.round((userPoints / maxPoints) * 100);

  // Rewards from database
  const [rewards, setRewards] = useState<any[]>([]);

  // Points courses from database
  const [pointsCourses, setPointsCourses] = useState<any[]>([]);

  // Point history from database
  const [pointHistory, setPointHistory] = useState<any[]>([]);

  // Fetch user data and points from API
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchUserData = async () => {
      try {
        setLoading(true);

        const [userRes, pointsRes, coursesRes, rewardsRes] = await Promise.all([
          fetch(`/api/db/users?id=${user.id}`),
          fetch(`/api/db/points?user_id=${user.id}`),
          fetch("/api/db/points-courses?is_active=true"),
          fetch("/api/db/points-rewards?is_active=true"),
        ]);

        const [userData, pointsData, coursesData, rewardsData] =
          await Promise.all([
            userRes.json(),
            pointsRes.json(),
            coursesRes.json(),
            rewardsRes.json(),
          ]);

        if (!userRes.ok) throw new Error(userData.error);
        if (!pointsRes.ok) throw new Error(pointsData.error);

        const userInfo = userData.data;
        setUserData(userInfo);
        setUserPoints(userInfo?.current_points || 0);
        setTotalPoints(userInfo?.total_points || 0);

        const mappedHistory =
          pointsData.history?.map((item: any) => ({
            id: item.id,
            action: item.action_description || item.description,
            points: item.points_changed ?? item.points,
            date: new Date(item.created_at).toLocaleDateString("th-TH"),
            time: new Date(item.created_at).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          })) || [];

        setPointHistory(mappedHistory);
        setPointsCourses(coursesData.data || []);
        setRewards(rewardsData.data || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, authLoading, router]);

  const handleRedeem = async (item: any) => {
    if (!user) return;

    if (userPoints >= item.points_cost) {
      // Confirm before redeeming
      const confirmResult = await Swal.fire({
        icon: "question",
        title: t("confirmRedeemTitle", { title: item.title }),
        html: t
          .raw("confirmRedeemBody")
          .replace("{cost}", String(item.points_cost))
          .replace("{remaining}", String(userPoints - item.points_cost)),
        showCancelButton: true,
        confirmButtonText: tCommon("confirm"),
        cancelButtonText: tCommon("cancel"),
        confirmButtonColor: "#ec4899",
      });

      if (!confirmResult.isConfirmed) return;

      try {
        // Call API to deduct points
        const res = await fetch("/api/db/points", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            points_amount: item.points_cost,
            description: t("redeemDescription", { title: item.title }),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          Swal.fire({
            icon: "error",
            title: tCommon("error"),
            text: data.error || t("redeemError"),
            confirmButtonColor: "#ec4899",
          });
          return;
        }

        // Update local points state
        setUserPoints(data.new_balance);

        // Add to point history locally
        setPointHistory((prev) => [
          {
            id: Date.now(),
            action: t("redeemDescription", { title: item.title }),
            points: -item.points_cost,
            date: new Date().toLocaleDateString(dateLocale),
            time: new Date().toLocaleTimeString(dateLocale, {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
          ...prev,
        ]);

        // Show reward content based on type
        if (item.reward_type === "link" || item.reward_type === "pdf") {
          Swal.fire({
            icon: "success",
            title: item.title,
            html: t
              .raw("rewardLinkHtml")
              .replace("{description}", item.description || "")
              .replace("{url}", item.reward_value),
            confirmButtonColor: "#ec4899",
          });
        } else if (item.reward_type === "message") {
          Swal.fire({
            icon: "success",
            title: item.title,
            html: t
              .raw("rewardMessageHtml")
              .replace("{description}", item.description || "")
              .replace("{message}", item.reward_value),
            confirmButtonColor: "#ec4899",
          });
        }
      } catch (error) {
        console.error("Error redeeming:", error);
        Swal.fire({
          icon: "error",
          title: tCommon("error"),
          text: t("redeemError"),
          confirmButtonColor: "#ec4899",
        });
      }
    } else {
      Swal.fire({
        icon: "error",
        title: t("notEnoughPoints"),
        text: t("notEnoughPointsDetail", {
          need: item.points_cost,
          short: item.points_cost - userPoints,
        }),
        confirmButtonColor: "#ec4899",
      });
    }
  };

  const PointsSkeleton = () => (
    <div className="container mx-auto max-w-screen-xl px-4 pb-20 animate-pulse">
      <div className="mt-8 mb-6 space-y-2">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-64 bg-gray-100 rounded" />
      </div>

      <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="h-8 w-24 bg-gray-100 rounded" />
          <div className="h-10 w-24 bg-gray-200 rounded-full" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-100 space-y-3">
          <div className="h-6 w-36 bg-gray-200 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-100 space-y-3">
          <div className="h-6 w-36 bg-gray-200 rounded" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );

  if (authLoading || loading) {
    return <PointsSkeleton />;
  }

  if (!user) return null;

  const inviteUrl = userData?.username
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/th/invite/${userData.username}`
    : "";

  return (
    <div className="container mx-auto max-w-screen-xl px-4 pb-20">
      {/* Header Section */}
      <div className="mt-8 mb-6">
        <h1 className="text-3xl font-bold text-pink-700 flex items-center gap-2">
          <Star className="w-8 h-8" />
          {t("title")}
        </h1>
        <p className="text-gray-600 mt-2">{t("subtitle")}</p>
      </div>

      {/* Points Summary Card */}
      <div className="bg-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-pink-600 mb-2">
              {t("currentPoints")}
            </h2>
            <p className="text-sm text-gray-600">{t("unlockProMax")}</p>
          </div>
          <div className="bg-gradient-to-br from-[#FCB1CE] to-[#DF5C8E] px-8 py-4 rounded-2xl text-white shadow-md flex items-center gap-3">
            <span className="text-5xl font-bold">{userPoints}</span>
            <div className="bg-white rounded-full p-2">
              <Image
                src="/doodee_logo.png"
                alt="Doodee"
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
          </div>
        </div>

        {/* Progress to Doodee Pro Max */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-700 font-medium">
              {progressPercent}%
            </span>
            <span className="text-sm text-gray-500">100%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#FCB1CE] to-[#DF5C8E] h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-2">{t("inviteDescription")}</p>
        </div>

        {/* Invite Link */}
        {inviteUrl && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-1 flex items-center gap-0 overflow-hidden">
            <input
              type="text"
              value={inviteUrl}
              readOnly
              className="flex-1 bg-transparent text-gray-700 px-3 py-2 outline-none text-sm"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText(inviteUrl);
                Swal.fire({
                  icon: "success",
                  title: t("linkCopiedSuccess"),
                  text: t("canShareLink"),
                  toast: true,
                  position: "top-end",
                  showConfirmButton: false,
                  timer: 2000,
                  timerProgressBar: true,
                });
              }}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-r-lg font-semibold text-sm transition-colors text-white"
              style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
            >
              {tCommon("copy")}
            </button>
          </div>
        )}
      </div>

      {/* Rewards Shop Section */}
      {rewards.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-pink-700 mb-4 flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            {t("shop")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="bg-pink-100 rounded-full p-3">
                    <Gift className="w-6 h-6 text-pink-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{item.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {item.description || ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-pink-500" />
                    <span className="font-bold text-pink-600">
                      {item.points_cost} {t("point")}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRedeem(item)}
                    disabled={userPoints < item.points_cost}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      userPoints >= item.points_cost
                        ? "bg-pink-500 hover:bg-pink-600 text-white"
                        : "bg-gray-200 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {t("buyWithPoints")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Courses Section (from database) */}
      {pointsCourses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-pink-700 mb-4 flex items-center gap-2">
            <TrendingUp className="w-6 h-6" />
            {t("courses")}
          </h2>
          <div className="flex overflow-x-auto gap-4 pb-4">
            {pointsCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-2xl shadow-md p-2 flex-shrink-0 w-64"
              >
                {course.link_url ? (
                  <Link href={course.link_url}>
                    <div className="relative w-full h-32 mb-2 rounded-md overflow-hidden bg-gray-100">
                      {course.image_url ? (
                        <Image
                          src={course.image_url}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <GraduationCap className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                      {course.description || ""}
                    </p>
                    <p className="text-pink-600 font-bold">
                      {course.points_cost === 0
                        ? "FREE"
                        : course.points_cost + " " + t("point")}
                    </p>
                  </Link>
                ) : (
                  <>
                    <div className="relative w-full h-32 mb-2 rounded-md overflow-hidden bg-gray-100">
                      {course.image_url ? (
                        <Image
                          src={course.image_url}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <GraduationCap className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                      {course.description || ""}
                    </p>
                    <p className="text-pink-600 font-bold">
                      {course.points_cost === 0
                        ? "FREE"
                        : course.points_cost + " " + t("point")}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Point History */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-pink-700 mb-4 flex items-center gap-2">
          <History className="w-6 h-6" />
          {t("pointsHistory")}
        </h2>
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-md">
          <ul className="space-y-3">
            {pointHistory.map((history) => (
              <li
                key={history.id}
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      history.points > 0 ? "bg-green-100" : "bg-red-100"
                    }`}
                  >
                    {history.points > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-600" />
                    ) : (
                      <ShoppingBag className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">
                      {history.action}
                    </p>
                    <p className="text-xs text-gray-500">
                      {history.date} | {history.time}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-bold text-lg ${
                    history.points > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {history.points > 0 ? "+" : ""}
                  {history.points}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PointsPage;
