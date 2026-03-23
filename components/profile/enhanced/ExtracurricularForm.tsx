"use client";

import { useState } from "react";
import {
  Users,
  Plus,
  Edit,
  Trash,
  X,
  Save,
  Trash2,
  Heart,
  Trophy,
  Palette,
  Crown,
  Microscope,
  Sparkles,
  UserRound,
  MapPin,
  Clock3,
  BadgeCheck
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTypeConfirmDialog } from "@/components/ui/type-confirm-dialog";
import { useTranslations } from "next-intl";

interface Extracurricular {
  id?: string;
  activity_name: string;
  activity_type: string;
  role: string;
  organization: string;
  start_date: string | null;
  end_date: string | null;
  is_ongoing: boolean;
  hours_committed: number | null;
  description: string;
  impact_description: string;
  achievements: string[];
  data_source?: string;
}

interface ExtracurricularFormProps {
  userId: string;
  initialData: Extracurricular[];
  onUpdate?: () => void;
}

const ACTIVITY_TYPES = [
  { value: 'club', label: 'ชมรม/กลุ่มนักเรียน', color: 'blue', icon: Users },
  { value: 'volunteer', label: 'อาสาสมัคร', color: 'red', icon: Heart },
  { value: 'sports', label: 'กีฬา', color: 'green', icon: Trophy },
  { value: 'arts', label: 'ศิลปะ/วัฒนธรรม', color: 'purple', icon: Palette },
  { value: 'leadership', label: 'ภาวะผู้นำ', color: 'yellow', icon: Crown },
  { value: 'research', label: 'วิจัย', color: 'indigo', icon: Microscope },
];

const ROLE_OPTIONS = [
  'สมาชิก',
  'ผู้นำทีม',
  'หัวหน้าชมรม',
  'ประธาน',
  'รองประธาน',
  'เลขานุการ',
  'ผู้ก่อตั้ง',
  'อื่นๆ',
];

export default function ExtracurricularForm({ userId, initialData, onUpdate }: ExtracurricularFormProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const confirmDialog = useConfirmDialog();
  const typeConfirmDialog = useTypeConfirmDialog();

  const [activitiesList, setActivitiesList] = useState<Extracurricular[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Extracurricular>({
    activity_name: '',
    activity_type: 'club',
    role: 'สมาชิก',
    organization: '',
    start_date: null,
    end_date: null,
    is_ongoing: false,
    hours_committed: null,
    description: '',
    impact_description: '',
    achievements: [],
  });
  const [achievementInput, setAchievementInput] = useState('');

  // Calculate AI items
  const aiItems = activitiesList.filter(activity => activity.data_source === 'ai_extracted');
  const aiItemsCount = aiItems.length;
  const hasAiItems = aiItemsCount > 0;

  const resetForm = () => {
    setFormData({
      activity_name: '',
      activity_type: 'club',
      role: 'สมาชิก',
      organization: '',
      start_date: null,
      end_date: null,
      is_ongoing: false,
      hours_committed: null,
      description: '',
      impact_description: '',
      achievements: [],
    });
    setAchievementInput('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (entry: Extracurricular) => {
    setFormData(entry);
    setEditingId(entry.id || null);
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.activity_name) {
      showToast.error('กรุณากรอกชื่อกิจกรรม');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch('/api/db/user/extracurricular', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        if (editingId) {
          setActivitiesList(activitiesList.map(a => a.id === editingId ? result.data : a));
          showToast.success('อัปเดตกิจกรรมสำเร็จ');
        } else {
          setActivitiesList([...activitiesList, result.data]);
          showToast.success('เพิ่มกิจกรรมสำเร็จ');
        }
        resetForm();
        onUpdate?.();
      } else {
        showToast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      showToast.error('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDelete = (id: string) => {
    confirmDialog.open({
      title: 'ลบกิจกรรม',
      description: 'คุณแน่ใจหรือไม่ที่จะลบกิจกรรมนี้?',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/db/user/extracurricular?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setActivitiesList(activitiesList.filter(a => a.id !== id));
            showToast.success('ลบกิจกรรมสำเร็จ');
            onUpdate?.();
          } else {
            showToast.error('ไม่สามารถลบข้อมูลได้');
          }
        } catch (error) {
          console.error('Error deleting activity:', error);
          showToast.error('เกิดข้อผิดพลาด');
        }
      },
    });
  };

  const addAchievement = () => {
    if (achievementInput.trim()) {
      setFormData({
        ...formData,
        achievements: [...formData.achievements, achievementInput.trim()],
      });
      setAchievementInput('');
    }
  };

  const removeAchievement = (index: number) => {
    setFormData({
      ...formData,
      achievements: formData.achievements.filter((_, i) => i !== index),
    });
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
    const allIds = activitiesList.map(a => a.id).filter((id): id is string => !!id);
    setSelectedIds(new Set(allIds));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  // Batch delete handlers
  const handleBatchDelete = async (ids: string[]) => {
    try {
      const results = await Promise.allSettled(
        ids.map(id =>
          fetch(`/api/db/user/extracurricular?id=${id}`, { method: 'DELETE' })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      setActivitiesList(activitiesList.filter(a => !ids.includes(a.id!)));
      setSelectedIds(new Set());

      if (failCount === 0) {
        showToast.success(`ลบข้อมูลสำเร็จ ${successCount} รายการ`);
      } else {
        showToast.warning(`ลบสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
      }
      onUpdate?.();
    } catch (error) {
      console.error('Error batch deleting extracurricular:', error);
      showToast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleDeleteSelected = () => {
    const selectedIdsArray = Array.from(selectedIds);
    if (selectedIdsArray.length === 0) return;

    confirmDialog.open({
      title: 'ลบกิจกรรมที่เลือก',
      description: `คุณแน่ใจหรือไม่ที่จะลบกิจกรรม ${selectedIdsArray.length} รายการ?`,
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      onConfirm: async () => {
        await handleBatchDelete(selectedIdsArray);
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

  const formatDuration = (startDate: string | null, endDate: string | null, isOngoing: boolean) => {
    if (!startDate) return '';
    const start = new Date(startDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short' });
    if (isOngoing) return `${start} - ปัจจุบัน`;
    if (endDate) {
      const end = new Date(endDate).toLocaleDateString('th-TH', { year: 'numeric', month: 'short' });
      return `${start} - ${end}`;
    }
    return start;
  };

  return (
    <div className="space-y-4">
      {/* Action Toolbar (only show if there are AI items) */}
      {hasAiItems && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === activitiesList.length && activitiesList.length > 0}
                onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                เลือกทั้งหมด ({activitiesList.length} รายการ)
              </span>
            </label>

            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                ลบที่เลือก ({selectedIds.size})
              </button>
            )}

            {aiItemsCount > 0 && (
              <button
                onClick={handleDeleteAllAI}
                className="flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md hover:bg-orange-200 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                ลบ AI ทั้งหมด ({aiItemsCount})
              </button>
            )}

            <div className="ml-auto text-xs text-purple-600 font-medium">
              <span className="inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                {aiItemsCount} รายการจาก AI
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Activities List */}
      {activitiesList.map((activity) => {
        const typeInfo = ACTIVITY_TYPES.find(t => t.value === activity.activity_type);
        const TypeIcon = typeInfo?.icon;
        return (
          <div
            key={activity.id}
            className="border border-gray-200 rounded-lg p-4 bg-white hover:border-pink-300 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Checkbox (only show if AI items exist) */}
              {hasAiItems && (
                <div className="pt-0.5">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(activity.id!)}
                    onChange={() => handleToggleSelect(activity.id!)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-5 h-5 text-pink-600" />
                  <h4 className="font-semibold text-gray-800">{activity.activity_name}</h4>
                  {activity.is_ongoing && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      กำลังดำเนินการ
                    </span>
                  )}
                  {activity.data_source === 'ai_extracted' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
                    {TypeIcon && <TypeIcon className="w-3 h-3" />}
                    {typeInfo?.label}
                  </span>
                  {activity.role && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <UserRound className="w-3 h-3" />
                      {activity.role}
                    </span>
                  )}
                  {activity.organization && (
                    <span className="text-xs text-gray-600 inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {activity.organization}
                    </span>
                  )}
                </div>

                <p className="text-xs text-gray-500 mb-2 inline-flex items-center gap-1">
                  <Clock3 className="w-3 h-3" />
                  {formatDuration(activity.start_date, activity.end_date, activity.is_ongoing)}
                  {activity.hours_committed && ` • ${activity.hours_committed} ชั่วโมง`}
                </p>

                {activity.description && (
                  <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                )}

                {activity.impact_description && (
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-2">
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold inline-flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        ผลกระทบ:
                      </span>{" "}
                      {activity.impact_description}
                    </p>
                  </div>
                )}

                {activity.achievements && activity.achievements.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {activity.achievements.map((ach, idx) => (
                      <span key={idx} className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded inline-flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3" />
                        {ach}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(activity)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(activity.id!)}
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
              {editingId ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรม'}
            </h4>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Activity Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อกิจกรรม *
              </label>
              <input
                type="text"
                value={formData.activity_name}
                onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="เช่น ชมรมคอมพิวเตอร์, อาสาสมัครสอนน้อง"
              />
            </div>

            {/* Type & Role */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประเภทกิจกรรม *
                </label>
                <select
                  value={formData.activity_type}
                  onChange={(e) => setFormData({ ...formData, activity_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {ACTIVITY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  บทบาท
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {ROLE_OPTIONS.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Organization */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                องค์กร/สถาบัน
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="เช่น โรงเรียนมัธยมสาธิต, มูลนิธิฯ"
              />
            </div>

            {/* Dates & Hours */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  เริ่มเมื่อ
                </label>
                <input
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สิ้นสุดเมื่อ
                </label>
                <input
                  type="date"
                  value={formData.end_date || ''}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  disabled={formData.is_ongoing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชั่วโมง
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.hours_committed || ''}
                  onChange={(e) => setFormData({ ...formData, hours_committed: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_ongoing}
                onChange={(e) => setFormData({ ...formData, is_ongoing: e.target.checked, end_date: e.target.checked ? null : formData.end_date })}
                className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm text-gray-700">กำลังดำเนินการอยู่</span>
            </label>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รายละเอียดกิจกรรม
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="อธิบายสิ่งที่คุณทำ..."
              />
            </div>

            {/* Impact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ผลกระทบ/ผลลัพธ์
              </label>
              <textarea
                value={formData.impact_description}
                onChange={(e) => setFormData({ ...formData, impact_description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="ผลกระทบที่เกิดขึ้นจากกิจกรรมนี้..."
              />
            </div>

            {/* Achievements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ความสำเร็จจากกิจกรรมนี้
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={achievementInput}
                  onChange={(e) => setAchievementInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAchievement())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="เช่น ช่วยเหลือนักเรียน 50 คน"
                />
                <button
                  type="button"
                  onClick={addAchievement}
                  className="px-3 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                >
                  เพิ่ม
                </button>
              </div>
              {formData.achievements.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.achievements.map((ach, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {ach}
                      <button onClick={() => removeAchievement(idx)} className="hover:text-green-900">
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
          เพิ่มกิจกรรมเสริมหลักสูตร
        </button>
      )}

      {confirmDialog.dialog}
      {typeConfirmDialog.dialog}
    </div>
  );
}
