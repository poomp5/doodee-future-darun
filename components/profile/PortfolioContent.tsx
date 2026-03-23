"use client";

import { useState } from "react";
import ProfileCompletenessCard from "./enhanced/ProfileCompletenessCard";
import EducationHistoryForm from "./enhanced/EducationHistoryForm";
import AchievementsForm from "./enhanced/AchievementsForm";
import SkillsForm from "./enhanced/SkillsForm";
import InterestsForm from "./enhanced/InterestsForm";
import ExtracurricularForm from "./enhanced/ExtracurricularForm";
import CareerGoalsForm from "./enhanced/CareerGoalsForm";
import AIExtractButton from "./AIExtractButton";
import {
  GraduationCap,
  Award,
  Zap,
  Heart,
  Users,
  Target,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Upload,
  ExternalLink,
  Eye,
  Trash,
  Package,
  CheckCircle2
} from "lucide-react";
import { Link } from "@/routing";
import { showToast } from "@/lib/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PortfolioContentProps {
  userId: string;
  educationHistory: any[];
  achievements: any[];
  skills: any[];
  interests: any[];
  extracurricular: any[];
  careerGoals: any[];
  portfolioUploads: any[];
  purchases: any[];
}

export default function PortfolioContent({
  userId,
  educationHistory,
  achievements,
  skills,
  interests,
  extracurricular,
  careerGoals,
  portfolioUploads: initialUploads,
  purchases,
}: PortfolioContentProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const confirmDialog = useConfirmDialog();

  // State for expandable sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    education: false,
    achievements: false,
    skills: false,
    interests: false,
    extracurricular: false,
    careerGoals: false,
  });

  // Portfolio uploads state
  const [portfolioUploads, setPortfolioUploads] = useState(initialUploads);
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<any | null>(null);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
      alert(t('portfolio.downloadError'));
    } finally {
      setExporting(false);
    }
  };

  // Portfolio file handlers
  const handlePreviewFile = (upload: any) => {
    setSelectedUpload(upload);
    setFilePreviewOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const deletePortfolioUpload = (id: string) => {
    confirmDialog.open({
      title: t('deleteFile'),
      description: t('confirmDeleteFile'),
      confirmText: tCommon('delete'),
      cancelText: tCommon('cancel'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await fetch(`/api/portfolio/upload-record?id=${id}`, { method: 'DELETE' });
          setPortfolioUploads(prev => prev.filter(p => p.id !== id));
          showToast.success(t('deleteSuccess'));
        } catch (error) {
          console.error("Error deleting portfolio:", error);
          showToast.error(t('cannotDeleteFile'));
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Profile Completeness Card */}
      <ProfileCompletenessCard key={completenessKey} userId={userId} />

      {/* Portfolio Uploads & Purchases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Portfolio Uploads */}
        <div className="p-6 bg-white border border-gray-200 shadow-md rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-pink-700 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('portfolioUploads')}
            </h3>
            <Link href="/analyse">
              <button className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1">
                <Upload className="w-3 h-3" />
                {t('uploadMore')}
              </button>
            </Link>
          </div>

          {portfolioUploads.length > 0 ? (
            <div className="space-y-2">
              {portfolioUploads.slice(0, 5).map((upload: any) => (
                <div
                  key={upload.id}
                  className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="w-4 h-4 text-pink-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {upload.file_name || upload.file_url?.split('/').pop()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(upload.file_size)}
                        {upload.analyzed && (
                          <span className="ml-2 text-green-600 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('analyzed')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handlePreviewFile(upload)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title={t('openFile')}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!upload.analyzed && (
                      <Link href={`/analyse?file=${upload.id}`}>
                        <button className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors text-xs">
                          {t('analyzeNow')}
                        </button>
                      </Link>
                    )}
                    <button
                      onClick={() => deletePortfolioUpload(upload.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title={tCommon('delete')}
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {portfolioUploads.length > 5 && (
                <Link href="/analyse">
                  <button className="w-full text-sm text-pink-600 hover:text-pink-700 py-2">
                    {t('portfolio.viewAll', { count: portfolioUploads.length })}
                  </button>
                </Link>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">{t('noUploadsYet')}</p>
              <Link href="/analyse">
                <button className="mt-2 text-sm text-pink-600 hover:text-pink-700">
                  {t('startUpload')}
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Purchased Templates */}
        <div className="p-6 bg-white border border-gray-200 shadow-md rounded-xl">
          <h3 className="font-semibold text-pink-700 text-lg mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            {t('purchasedTemplates')}
          </h3>
          {purchases.length > 0 ? (
            <div className="space-y-3">
              {purchases.map((purchase: any) => (
                <div
                  key={purchase.id}
                  className="p-3 border border-gray-200 rounded-lg hover:border-pink-300 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 text-sm">
                        {purchase.template_title || 'Portfolio Template'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('purchasedOn')}{' '}
                        {new Date(purchase.purchased_at).toLocaleDateString('th-TH')}
                      </p>
                    </div>
                    {purchase.template_url && (
                      <a
                        href={purchase.template_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md transition-colors flex items-center gap-1 text-xs"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {t('openCanva')}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">{t('portfolio.noTemplates')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Profile Sections */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">{t('portfolio.detailedProfile')}</h2>
          <button
            onClick={handleExportPortfolio}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
            {exporting ? t('portfolio.downloading') : t('portfolio.downloadData')}
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
                <h3 className="font-semibold text-gray-800">{t('portfolio.educationHistory')}</h3>
                <p className="text-sm text-gray-500">{t('portfolio.itemCount', { count: educationHistory.length })}</p>
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
                userId={userId}
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
                <h3 className="font-semibold text-gray-800">{t('portfolio.achievements')}</h3>
                <p className="text-sm text-gray-500">{t('portfolio.itemCount', { count: achievements.length })}</p>
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
                userId={userId}
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
                <h3 className="font-semibold text-gray-800">{t('portfolio.skills')}</h3>
                <p className="text-sm text-gray-500">{t('portfolio.itemCount', { count: skills.length })}</p>
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
                userId={userId}
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
                <h3 className="font-semibold text-gray-800">{t('portfolio.interests')}</h3>
                <p className="text-sm text-gray-500">{t('portfolio.itemCount', { count: interests.length })}</p>
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
                userId={userId}
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
                <h3 className="font-semibold text-gray-800">{t('portfolio.extracurricular')}</h3>
                <p className="text-sm text-gray-500">{t('portfolio.itemCount', { count: extracurricular.length })}</p>
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
                userId={userId}
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
                <h3 className="font-semibold text-gray-800">{t('portfolio.careerGoals')}</h3>
                <p className="text-sm text-gray-500">{t('portfolio.itemCount', { count: careerGoals.length })}</p>
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
                userId={userId}
                initialData={careerGoals}
                onUpdate={handleProfileUpdate}
              />
            </div>
          )}
        </div>
      </div>

      {/* File Preview Dialog */}
      <Dialog open={filePreviewOpen} onOpenChange={setFilePreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{t('portfolio.filePreview')}</DialogTitle>
            <DialogDescription>
              {selectedUpload?.file_name || selectedUpload?.file_url?.split('/').pop()}
            </DialogDescription>
          </DialogHeader>
          {selectedUpload?.file_url && (
            <div className="mt-4">
              {selectedUpload.file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={selectedUpload.file_url}
                  alt="Preview"
                  className="w-full h-auto rounded-lg"
                />
              ) : selectedUpload.file_url.match(/\.pdf$/i) ? (
                <iframe
                  src={selectedUpload.file_url}
                  className="w-full h-[70vh] rounded-lg border"
                />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-600">{t('portfolio.cannotPreview')}</p>
                  <a
                    href={selectedUpload.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {t('portfolio.openFile')}
                  </a>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {confirmDialog.dialog}
    </div>
  );
}
