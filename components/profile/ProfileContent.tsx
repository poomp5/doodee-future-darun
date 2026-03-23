"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/routing";
import { useAuth } from "@/components/AuthProvider";
import ProfileCard from "./ProfileCard";
import TodoSection from "./TodoSection";
import PortfolioSection from "./PortfolioSection";
import FacultiesSection from "./FacultiesSection";
import WelcomeModal from "./WelcomeModal";
import ProfileCompletenessCard from "./enhanced/ProfileCompletenessCard";
import EducationHistoryForm from "./enhanced/EducationHistoryForm";
import AchievementsForm from "./enhanced/AchievementsForm";
import SkillsForm from "./enhanced/SkillsForm";
import InterestsForm from "./enhanced/InterestsForm";
import ExtracurricularForm from "./enhanced/ExtracurricularForm";
import CareerGoalsForm from "./enhanced/CareerGoalsForm";
import AIExtractButton from "./AIExtractButton";
import type { ProfileData } from "@/lib/profile-data";
import {
  GraduationCap,
  Award,
  Zap,
  Heart,
  Users,
  Target,
  ChevronDown,
  ChevronUp,
  Download
} from "lucide-react";

interface ProfileContentProps {
  profileData: ProfileData;
}

export default function ProfileContent({ profileData }: ProfileContentProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    education: false,
    achievements: false,
    skills: false,
    interests: false,
    extracurricular: false,
    careerGoals: false,
  });

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (!user) return null;

  const {
    user: userData,
    todos,
    purchases,
    interestedFaculties,
    portfolioUploads,
    gpax,
    educationHistory,
    achievements,
    skills,
    interests,
    extracurricular,
    careerGoals,
  } = profileData;

  const completedCount = todos.filter((item: any) => item.is_completed).length;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  // Refresh profile completeness after updates
  const [completenessKey, setCompletenessKey] = useState(0);
  const handleProfileUpdate = () => {
    setCompletenessKey(prev => prev + 1);
  };

  // Export portfolio handler
  const [exporting, setExporting] = useState(false);
  const handleExportPortfolio = async () => {
    try {
      setExporting(true);
      const response = await fetch('/api/profile/export?format=json');

      if (!response.ok) {
        throw new Error('Failed to export portfolio');
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `doodee-portfolio-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting portfolio:', error);
      alert('ไม่สามารถดาวน์โหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <WelcomeModal />
      <div className="container mx-auto px-4 max-w-lg md:max-w-screen-xl mb-12 mt-12">
        {/* Profile Completeness - Full Width */}
        <div className="mb-6">
          <ProfileCompletenessCard key={completenessKey} userId={user.id} />
        </div>

        {/* Original 3-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          {/* Column 1: Profile Card with Todo inside */}
          <ProfileCard
            user={userData}
            sessionUser={{
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            }}
            progressPercent={progressPercent}
            todoSection={
              <TodoSection
                initialTodos={todos}
                userId={user.id}
              />
            }
          />

          {/* Column 2: GPAX, Portfolio, Purchases */}
          <PortfolioSection
            initialUploads={portfolioUploads}
            purchases={purchases}
            gpax={gpax}
          />

          {/* Column 3: Interested Faculties */}
          <FacultiesSection initialFaculties={interestedFaculties} />
        </div>

        {/* Enhanced Profile Sections - Expandable */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">ข้อมูลโปรไฟล์แบบละเอียด</h2>
            <button
              onClick={handleExportPortfolio}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
              {exporting ? 'กำลังดาวน์โหลด...' : 'ดาวน์โหลดข้อมูล'}
            </button>
          </div>

          {/* AI Extract Button */}
          <AIExtractButton onComplete={handleProfileUpdate} />

          {/* Education History */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('education')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-white hover:from-blue-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">ประวัติการศึกษา</h3>
                  <p className="text-sm text-gray-500">{educationHistory.length} รายการ</p>
                </div>
              </div>
              {expandedSections.education ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.education && (
              <div className="p-4 border-t border-gray-200">
                <EducationHistoryForm
                  userId={user.id}
                  initialData={educationHistory}
                  onUpdate={handleProfileUpdate}
                />
              </div>
            )}
          </div>

          {/* Achievements */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('achievements')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-yellow-50 to-white hover:from-yellow-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-yellow-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">ผลงานและรางวัล</h3>
                  <p className="text-sm text-gray-500">{achievements.length} รายการ</p>
                </div>
              </div>
              {expandedSections.achievements ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.achievements && (
              <div className="p-4 border-t border-gray-200">
                <AchievementsForm
                  userId={user.id}
                  initialData={achievements}
                  onUpdate={handleProfileUpdate}
                />
              </div>
            )}
          </div>

          {/* Skills */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('skills')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-white hover:from-purple-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Zap className="w-6 h-6 text-purple-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">ทักษะ</h3>
                  <p className="text-sm text-gray-500">{skills.length} รายการ</p>
                </div>
              </div>
              {expandedSections.skills ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.skills && (
              <div className="p-4 border-t border-gray-200">
                <SkillsForm
                  userId={user.id}
                  initialData={skills}
                  onUpdate={handleProfileUpdate}
                />
              </div>
            )}
          </div>

          {/* Interests */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('interests')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-white hover:from-pink-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-pink-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">ความสนใจ</h3>
                  <p className="text-sm text-gray-500">{interests.length} รายการ</p>
                </div>
              </div>
              {expandedSections.interests ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.interests && (
              <div className="p-4 border-t border-gray-200">
                <InterestsForm
                  userId={user.id}
                  initialData={interests}
                  onUpdate={handleProfileUpdate}
                />
              </div>
            )}
          </div>

          {/* Extracurricular */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('extracurricular')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-white hover:from-green-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-green-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">กิจกรรมเสริมหลักสูตร</h3>
                  <p className="text-sm text-gray-500">{extracurricular.length} รายการ</p>
                </div>
              </div>
              {expandedSections.extracurricular ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.extracurricular && (
              <div className="p-4 border-t border-gray-200">
                <ExtracurricularForm
                  userId={user.id}
                  initialData={extracurricular}
                  onUpdate={handleProfileUpdate}
                />
              </div>
            )}
          </div>

          {/* Career Goals */}
          <div className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm">
            <button
              onClick={() => toggleSection('careerGoals')}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-white hover:from-indigo-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-indigo-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-800">เป้าหมายในอนาคต</h3>
                  <p className="text-sm text-gray-500">{careerGoals.length} รายการ</p>
                </div>
              </div>
              {expandedSections.careerGoals ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>
            {expandedSections.careerGoals && (
              <div className="p-4 border-t border-gray-200">
                <CareerGoalsForm
                  userId={user.id}
                  initialData={careerGoals}
                  onUpdate={handleProfileUpdate}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
