"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, TrendingUp, Loader2, Lightbulb, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import useSWR from "swr";

interface CompletenessData {
  percentage: number;
  breakdown: {
    basicInfo: { score: number; max: number; items: string[] };
    education: { score: number; max: number; count: number };
    achievements: { score: number; max: number; count: number };
    extracurricular: { score: number; max: number; count: number };
    skills: { score: number; max: number; count: number };
    interests: { score: number; max: number; count: number };
    careerGoals: { score: number; max: number; count: number };
    academic: { score: number; max: number; items: string[] };
  };
  missingItems: string[];
  recommendations: string[];
}

interface ProfileCompletenessCardProps {
  userId: string;
}

export default function ProfileCompletenessCard({ userId }: ProfileCompletenessCardProps) {
  const t = useTranslations('profile');
  const [expanded, setExpanded] = useState(false);

  const { data, isLoading, mutate } = useSWR(
    userId ? `/api/profile/completeness?user_id=${userId}` : null
  );
  const completeness: CompletenessData | null = data?.data || null;

  const getColorByPercentage = (percentage: number) => {
    if (percentage >= 90) return { bg: 'bg-green-500', text: 'text-green-700', border: 'border-green-500' };
    if (percentage >= 70) return { bg: 'bg-blue-500', text: 'text-blue-700', border: 'border-blue-500' };
    if (percentage >= 50) return { bg: 'bg-yellow-500', text: 'text-yellow-700', border: 'border-yellow-500' };
    return { bg: 'bg-pink-500', text: 'text-pink-700', border: 'border-pink-500' };
  };

  const getSectionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      basicInfo: 'ข้อมูลพื้นฐาน',
      education: 'ประวัติการศึกษา',
      achievements: 'รางวัล/ความสำเร็จ',
      extracurricular: 'กิจกรรมเสริมหลักสูตร',
      skills: 'ทักษะ',
      interests: 'ความสนใจ',
      careerGoals: 'เป้าหมายอาชีพ',
      academic: 'ข้อมูลวิชาการ',
    };
    return labels[key] || key;
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!completeness) {
    return null;
  }

  const colors = getColorByPercentage(completeness.percentage);

  return (
    <div className="p-6 bg-gradient-to-br from-white to-pink-50 border border-pink-200 rounded-xl shadow-lg">
      {/* Header with Progress Circle */}
      <div className="flex items-start gap-6 mb-6">
        {/* Circular Progress */}
        <div className="relative flex-shrink-0">
          <svg className="w-24 h-24 transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r="40"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - completeness.percentage / 100)}`}
              className={colors.bg.replace('bg-', 'text-')}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-2xl font-bold ${colors.text}`}>
              {completeness.percentage}%
            </span>
          </div>
        </div>

        {/* Title and Description */}
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-pink-600" />
            ความสมบูรณ์ของโปรไฟล์
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {completeness.recommendations[0] || 'โปรไฟล์ของคุณสมบูรณ์แล้ว!'}
          </p>

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-2">
            {completeness.percentage < 100 && (
              <span className="text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded-full">
                เหลืออีก {100 - completeness.percentage}% ให้สมบูรณ์
              </span>
            )}
            {completeness.missingItems.length > 0 && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                {completeness.missingItems.length} รายการที่ขาด
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Breakdown Sections */}
      <div className="space-y-2 mb-4">
        {Object.entries(completeness.breakdown).map(([key, section]) => {
          const percentage = section.max > 0 ? (section.score / section.max) * 100 : 0;
          return (
            <div key={key} className="flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-700">
                    {getSectionLabel(key)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {section.score}/{section.max}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bg} transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
              {percentage >= 100 ? (
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {/* Toggle Details Button */}
      {(completeness.missingItems.length > 0 || completeness.recommendations.length > 1) && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
        >
          {expanded ? '▲ ซ่อนรายละเอียด' : '▼ ดูรายละเอียดเพิ่มเติม'}
        </button>
      )}

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-pink-200 space-y-4">
          {/* Missing Items */}
          {completeness.missingItems.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                รายการที่ยังขาด
              </h4>
              <ul className="space-y-1">
                {completeness.missingItems.map((item, index) => (
                  <li key={index} className="text-xs text-gray-600 pl-6 relative">
                    <span className="absolute left-0 top-1">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {completeness.recommendations.length > 1 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                คำแนะนำ
              </h4>
              <ul className="space-y-1">
                {completeness.recommendations.slice(1).map((rec, index) => (
                  <li key={index} className="text-xs text-gray-600 pl-6 relative">
                    <Lightbulb className="absolute left-0 top-0.5 w-3.5 h-3.5 text-yellow-600" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={() => mutate()}
        className="mt-4 w-full text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span className="inline-flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" />
          อัปเดตความสมบูรณ์
        </span>
      </button>
    </div>
  );
}
