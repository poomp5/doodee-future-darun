"use client";

import { useState, useEffect } from "react";
import { Sparkles, ExternalLink, Calendar, DollarSign, ChevronRight, RefreshCw, Target, BookOpen, Lightbulb } from "lucide-react";
import { showToast } from "@/lib/toast";
import { Link } from "@/routing";

interface Recommendation {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  subcategory: string | null;
  price: number;
  start_date?: string | null;
  deadline?: string | null;
  link_url: string | null;
  score: number;
  matchReasons: string[];
  type: 'activity' | 'course';
}

interface ForYouWidgetProps {
  limit?: number;
  type?: 'activity' | 'course' | 'both';
  showScore?: boolean; // For debugging
}

export default function ForYouWidget({ limit = 6, type = 'both', showScore = false }: ForYouWidgetProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasProfileData, setHasProfileData] = useState({
    interests: false,
    skills: false,
    achievements: false,
    careerGoals: false,
  });
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setRefreshing(true);
      const response = await fetch(`/api/recommendations?limit=${limit}&type=${type}`);
      const result = await response.json();

      if (response.ok) {
        setRecommendations(result.data || []);
        setHasProfileData(result.meta?.hasProfileData || {});
      } else {
        showToast.error('ไม่สามารถโหลดคำแนะนำได้');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      showToast.error('เกิดข้อผิดพลาดในการโหลดคำแนะนำ');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [limit, type]);

  const handleItemClick = async (item: Recommendation) => {
    // Track view for better recommendations
    try {
      await fetch('/api/tracking/view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: item.id,
          itemType: item.type,
        }),
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  const hasAnyProfileData = Object.values(hasProfileData).some(Boolean);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">แนะนำสำหรับคุณ</h2>
            <p className="text-sm text-gray-500">เลือกสรรโดยเฉพาะจากข้อมูลของคุณ</p>
          </div>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          รีเฟรช
        </button>
      </div>

      {/* No Profile Data Warning */}
      {!hasAnyProfileData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 mb-2 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-700" />
            <strong>เติมข้อมูลโปรไฟล์เพื่อรับคำแนะนำที่ดีขึ้น!</strong>
          </p>
          <p className="text-xs text-yellow-700 mb-3">
            เราจะแนะนำค่ายและคอร์สที่ตรงกับความสนใจและเป้าหมายของคุณมากขึ้น
          </p>
          <Link href="/profile" className="text-sm text-yellow-800 font-semibold hover:underline">
            ไปยังหน้าโปรไฟล์ →
          </Link>
        </div>
      )}

      {/* Recommendations Grid */}
      {recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="group bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {/* Image */}
              <div className="relative h-48 bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-16 h-16 text-purple-300" />
                  </div>
                )}
                {/* Type Badge */}
                <div className="absolute top-2 left-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    item.type === 'activity'
                      ? 'bg-blue-500 text-white'
                      : 'bg-green-500 text-white'
                  }`}>
                    {item.type === 'activity' ? (
                      <>
                        <Target className="w-3 h-3 mr-1" />
                        กิจกรรม
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-3 h-3 mr-1" />
                        คอร์ส
                      </>
                    )}
                  </span>
                </div>
                {/* Score Badge (Debug Mode) */}
                {showScore && (
                  <div className="absolute top-2 right-2">
                    <span className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs font-bold">
                      {item.score}
                    </span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                  {item.title}
                </h3>

                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                )}

                {/* Match Reasons */}
                {item.matchReasons.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {item.matchReasons.slice(0, 2).map((reason, idx) => (
                      <div key={idx} className="flex items-center gap-1 text-xs text-purple-600">
                        <span className="w-1 h-1 bg-purple-600 rounded-full"></span>
                        <span>{reason}</span>
                      </div>
                    ))}
                    {item.matchReasons.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{item.matchReasons.length - 2} เหตุผลอื่นๆ
                      </span>
                    )}
                  </div>
                )}

                {/* Meta Info */}
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                  {item.price !== undefined && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      <span>{item.price === 0 ? 'ฟรี' : `${item.price.toLocaleString()} บาท`}</span>
                    </div>
                  )}
                  {(item.start_date || item.deadline) && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {item.start_date
                          ? new Date(item.start_date).toLocaleDateString('th-TH')
                          : new Date(item.deadline!).toLocaleDateString('th-TH')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                {item.link_url ? (
                  <a
                    href={item.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleItemClick(item)}
                    className="flex items-center justify-between w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all group"
                  >
                    <span className="font-medium">ดูรายละเอียด</span>
                    <ExternalLink className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                ) : (
                  <Link
                    href={item.type === 'activity' ? `/activity/${item.id}` : `/course/${item.id}`}
                    onClick={() => handleItemClick(item)}
                    className="flex items-center justify-between w-full px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all group"
                  >
                    <span className="font-medium">ดูรายละเอียด</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">ยังไม่มีคำแนะนำในขณะนี้</p>
          <p className="text-sm text-gray-500">
            ลองเติมข้อมูลโปรไฟล์เพิ่มเติมเพื่อรับคำแนะนำที่ดีขึ้น
          </p>
        </div>
      )}
    </div>
  );
}
