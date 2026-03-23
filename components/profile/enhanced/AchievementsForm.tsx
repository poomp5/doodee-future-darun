"use client";

import { useState } from "react";
import {
  Award,
  Plus,
  Edit,
  Trash,
  X,
  Save,
  Link as LinkIcon,
  Trash2,
  GraduationCap,
  Trophy,
  Palette,
  Crown,
  Heart,
  ScrollText,
  Sparkles,
  MapPin,
  Calendar,
  BadgeCheck
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTypeConfirmDialog } from "@/components/ui/type-confirm-dialog";
import { useTranslations } from "next-intl";

interface Achievement {
  id?: string;
  achievement_type: string;
  title: string;
  description: string;
  organization: string;
  date_achieved: string | null;
  achievement_level: string;
  certificate_url: string;
  evidence_urls: string[];
  skills_gained: string[];
  data_source?: string;
}

interface AchievementsFormProps {
  userId: string;
  initialData: Achievement[];
  onUpdate?: () => void;
}

const ACHIEVEMENT_TYPES = [
  { value: 'academic', label: 'ความสำเร็จทางวิชาการ', color: 'blue', icon: GraduationCap },
  { value: 'competition', label: 'การแข่งขัน', color: 'yellow', icon: Trophy },
  { value: 'sports', label: 'กีฬา', color: 'green', icon: Trophy },
  { value: 'arts', label: 'ศิลปะ/ดนตรี', color: 'purple', icon: Palette },
  { value: 'leadership', label: 'ความเป็นผู้นำ', color: 'pink', icon: Crown },
  { value: 'community_service', label: 'บริการชุมชน', color: 'red', icon: Heart },
  { value: 'certification', label: 'ใบรับรอง', color: 'indigo', icon: ScrollText },
];

const ACHIEVEMENT_LEVELS = [
  { value: 'school', label: 'ระดับโรงเรียน' },
  { value: 'regional', label: 'ระดับภาค/จังหวัด' },
  { value: 'national', label: 'ระดับประเทศ' },
  { value: 'international', label: 'ระดับนานาชาติ' },
];

export default function AchievementsForm({ userId, initialData, onUpdate }: AchievementsFormProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const confirmDialog = useConfirmDialog();
  const typeConfirmDialog = useTypeConfirmDialog();

  const [achievementsList, setAchievementsList] = useState<Achievement[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Achievement>({
    achievement_type: 'academic',
    title: '',
    description: '',
    organization: '',
    date_achieved: null,
    achievement_level: 'school',
    certificate_url: '',
    evidence_urls: [],
    skills_gained: [],
  });
  const [urlInput, setUrlInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Calculate AI-extracted items count
  const aiItems = achievementsList.filter(a => a.data_source === 'ai_extracted');
  const aiItemsCount = aiItems.length;
  const hasAiItems = aiItemsCount > 0;

  const resetForm = () => {
    setFormData({
      achievement_type: 'academic',
      title: '',
      description: '',
      organization: '',
      date_achieved: null,
      achievement_level: 'school',
      certificate_url: '',
      evidence_urls: [],
      skills_gained: [],
    });
    setUrlInput('');
    setSkillInput('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (entry: Achievement) => {
    setFormData(entry);
    setEditingId(entry.id || null);
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      showToast.error('กรุณากรอกชื่อความสำเร็จ');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch('/api/db/user/achievements', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        if (editingId) {
          setAchievementsList(achievementsList.map(a => a.id === editingId ? result.data : a));
          showToast.success('อัปเดตความสำเร็จสำเร็จ');
        } else {
          setAchievementsList([...achievementsList, result.data]);
          showToast.success('เพิ่มความสำเร็จสำเร็จ');
        }
        resetForm();
        onUpdate?.();
      } else {
        showToast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving achievement:', error);
      showToast.error('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDelete = (id: string) => {
    confirmDialog.open({
      title: 'ลบความสำเร็จ',
      description: 'คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/db/user/achievements?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setAchievementsList(achievementsList.filter(a => a.id !== id));
            showToast.success('ลบข้อมูลสำเร็จ');
            onUpdate?.();
          } else {
            showToast.error('ไม่สามารถลบข้อมูลได้');
          }
        } catch (error) {
          console.error('Error deleting achievement:', error);
          showToast.error('เกิดข้อผิดพลาด');
        }
      },
    });
  };

  const addUrl = () => {
    if (urlInput.trim()) {
      setFormData({
        ...formData,
        evidence_urls: [...formData.evidence_urls, urlInput.trim()],
      });
      setUrlInput('');
    }
  };

  const removeUrl = (index: number) => {
    setFormData({
      ...formData,
      evidence_urls: formData.evidence_urls.filter((_, i) => i !== index),
    });
  };

  const addSkill = () => {
    if (skillInput.trim()) {
      setFormData({
        ...formData,
        skills_gained: [...formData.skills_gained, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    setFormData({
      ...formData,
      skills_gained: formData.skills_gained.filter((_, i) => i !== index),
    });
  };

  const getTypeColor = (type: string) => {
    const typeObj = ACHIEVEMENT_TYPES.find(t => t.value === type);
    return typeObj?.color || 'gray';
  };

  const getLevelBadgeColor = (level: string) => {
    const colors: Record<string, string> = {
      school: 'bg-gray-100 text-gray-700',
      regional: 'bg-blue-100 text-blue-700',
      national: 'bg-purple-100 text-purple-700',
      international: 'bg-pink-100 text-pink-700',
    };
    return colors[level] || 'bg-gray-100 text-gray-700';
  };

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    const allIds = new Set(achievementsList.map(a => a.id).filter((id): id is string => !!id));
    setSelectedIds(allIds);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Batch delete handler
  const handleBatchDelete = async (ids: string[]) => {
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          fetch(`/api/db/user/achievements?id=${id}`, { method: 'DELETE' })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      setAchievementsList(achievementsList.filter(a => !ids.includes(a.id!)));
      setSelectedIds(new Set());

      if (failCount === 0) {
        showToast.success(`ลบข้อมูลสำเร็จ ${successCount} รายการ`);
      } else {
        showToast.warning(`ลบสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
      }

      onUpdate?.();
    } catch (error) {
      console.error('Error batch deleting achievements:', error);
      showToast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleDeleteSelected = () => {
    const idsToDelete = Array.from(selectedIds);
    if (idsToDelete.length === 0) return;

    confirmDialog.open({
      title: 'ลบข้อมูลที่เลือก',
      description: `คุณแน่ใจหรือไม่ที่จะลบข้อมูล ${idsToDelete.length} รายการ?`,
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      onConfirm: async () => {
        await handleBatchDelete(idsToDelete);
      },
    });
  };

  const handleDeleteAllAI = () => {
    const aiItemIds = aiItems.map(a => a.id).filter((id): id is string => !!id);
    if (aiItemIds.length === 0) return;

    typeConfirmDialog.open({
      title: 'ลบข้อมูล AI ทั้งหมด',
      description: `การดำเนินการนี้จะลบข้อมูลที่ AI สกัดไว้ทั้งหมด ${aiItemsCount} รายการ และไม่สามารถย้อนกลับได้`,
      confirmText: 'ลบทั้งหมด',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      confirmationKeyword: 'DELETE',
      onConfirm: async () => {
        await handleBatchDelete(aiItemIds);
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar - Only show if AI items exist */}
      {hasAiItems && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Select All Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === achievementsList.length && achievementsList.length > 0}
                onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                เลือกทั้งหมด ({achievementsList.length} รายการ)
              </span>
            </label>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              {selectedIds.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบที่เลือก ({selectedIds.size})
                </button>
              )}
              {aiItemsCount > 0 && (
                <button
                  onClick={handleDeleteAllAI}
                  className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  ลบ AI ทั้งหมด ({aiItemsCount})
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Achievements List */}
      {achievementsList.map((entry) => {
        const achievementType = ACHIEVEMENT_TYPES.find(t => t.value === entry.achievement_type);
        const AchievementTypeIcon = achievementType?.icon;

        return (
          <div
            key={entry.id}
            className="border border-gray-200 rounded-lg p-4 bg-white hover:border-pink-300 transition-colors"
          >
            <div className="flex items-start gap-3">
            {/* Checkbox - Only show if AI items exist */}
            {hasAiItems && (
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={selectedIds.has(entry.id!)}
                  onChange={() => handleToggleSelect(entry.id!)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Award className={`w-5 h-5 text-${getTypeColor(entry.achievement_type)}-600`} />
                <h4 className="font-semibold text-gray-800">{entry.title}</h4>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getLevelBadgeColor(entry.achievement_level)}`}>
                  {ACHIEVEMENT_LEVELS.find(l => l.value === entry.achievement_level)?.label}
                </span>
                {entry.data_source === 'ai_extracted' && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
                  {AchievementTypeIcon && <AchievementTypeIcon className="w-3 h-3" />}
                  {achievementType?.label}
                </span>
                {entry.organization && (
                  <span className="text-xs text-gray-600 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {entry.organization}
                  </span>
                )}
                {entry.date_achieved && (
                  <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(entry.date_achieved).toLocaleDateString('th-TH', { year: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>

              {entry.description && (
                <p className="text-sm text-gray-600 mb-2">{entry.description}</p>
              )}

              {entry.skills_gained && entry.skills_gained.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {entry.skills_gained.map((skill, idx) => (
                    <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {(entry.certificate_url || (entry.evidence_urls && entry.evidence_urls.length > 0)) && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {entry.certificate_url && (
                    <a
                      href={entry.certificate_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      ใบรับรอง
                    </a>
                  )}
                  {entry.evidence_urls && entry.evidence_urls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <LinkIcon className="w-3 h-3" />
                      หลักฐาน {idx + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={() => handleEdit(entry)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(entry.id!)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </div>
          </div>
        );
      })}

      {/* Add/Edit Form */}
      {isAdding ? (
        <div className="border-2 border-pink-300 rounded-lg p-4 bg-pink-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">
              {editingId ? 'แก้ไขความสำเร็จ' : 'เพิ่มความสำเร็จ'}
            </h4>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Type & Level */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภท *
                </label>
                <select
                  value={formData.achievement_type}
                  onChange={(e) => setFormData({ ...formData, achievement_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {ACHIEVEMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ระดับ *
                </label>
                <select
                  value={formData.achievement_level}
                  onChange={(e) => setFormData({ ...formData, achievement_level: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {ACHIEVEMENT_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อความสำเร็จ *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="เช่น รางวัลชนะเลิศการแข่งขันวิทยาศาสตร์โอลิมปิก"
              />
            </div>

            {/* Organization & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หน่วยงาน/องค์กร
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="เช่น สอวน."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่ได้รับ
                </label>
                <input
                  type="date"
                  value={formData.date_achieved || ''}
                  onChange={(e) => setFormData({ ...formData, date_achieved: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียด
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="อธิบายความสำเร็จนี้..."
              />
            </div>

            {/* Certificate URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ลิงก์ใบรับรอง
              </label>
              <input
                type="url"
                value={formData.certificate_url}
                onChange={(e) => setFormData({ ...formData, certificate_url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="https://..."
              />
            </div>

            {/* Evidence URLs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ลิงก์หลักฐานเพิ่มเติม
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="https://..."
                />
                <button
                  type="button"
                  onClick={addUrl}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  เพิ่ม
                </button>
              </div>
              {formData.evidence_urls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.evidence_urls.map((url, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      <LinkIcon className="w-3 h-3" />
                      หลักฐาน {idx + 1}
                      <button onClick={() => removeUrl(idx)} className="hover:text-blue-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Skills Gained */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ทักษะที่ได้รับ
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="เช่น Problem Solving, ทำงานเป็นทีม"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  เพิ่ม
                </button>
              </div>
              {formData.skills_gained.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills_gained.map((skill, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {skill}
                      <button onClick={() => removeSkill(idx)} className="hover:text-green-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-md hover:bg-pink-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                บันทึก
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-pink-400 hover:text-pink-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          เพิ่มความสำเร็จ/รางวัล
        </button>
      )}

      {confirmDialog.dialog}
      {typeConfirmDialog.dialog}
    </div>
  );
}
