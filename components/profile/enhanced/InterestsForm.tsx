"use client";

import { useState } from "react";
import {
  Heart,
  Plus,
  Edit,
  Trash,
  X,
  Save,
  Trash2,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Sparkles,
  Clock3,
  Circle,
  CircleDot,
  Gauge,
  Flame,
  type LucideIcon
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTypeConfirmDialog } from "@/components/ui/type-confirm-dialog";
import { useTranslations } from "next-intl";

interface Interest {
  id?: string;
  interest_category: string;
  interest_name: string;
  intensity_level: number;
  since_when: string;
  description: string;
  data_source?: string;
}

interface InterestsFormProps {
  userId: string;
  initialData: Interest[];
  onUpdate?: () => void;
}

const INTEREST_CATEGORIES = [
  { value: 'subject_area', label: 'สาขาวิชา', color: 'blue', icon: BookOpen },
  { value: 'career_field', label: 'สายอาชีพ', color: 'purple', icon: BriefcaseBusiness },
  { value: 'hobby', label: 'งานอดิเรก', color: 'pink', icon: Heart },
  { value: 'industry', label: 'อุตสาหกรรม', color: 'indigo', icon: Building2 },
];

const INTENSITY_LABELS = [
  { min: 1, max: 3, label: 'สนใจเล็กน้อย', color: 'text-gray-500', icon: Circle },
  { min: 4, max: 6, label: 'สนใจ', color: 'text-blue-500', icon: CircleDot },
  { min: 7, max: 8, label: 'สนใจมาก', color: 'text-purple-500', icon: Gauge },
  { min: 9, max: 10, label: 'หลงใหล', color: 'text-pink-500', icon: Flame },
];

export default function InterestsForm({ userId, initialData, onUpdate }: InterestsFormProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const confirmDialog = useConfirmDialog();
  const typeConfirmDialog = useTypeConfirmDialog();

  const [interestsList, setInterestsList] = useState<Interest[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Interest>({
    interest_category: 'subject_area',
    interest_name: '',
    intensity_level: 5,
    since_when: '',
    description: '',
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Calculate AI-extracted items count
  const aiItems = interestsList.filter(i => i.data_source === 'ai_extracted');
  const aiItemsCount = aiItems.length;
  const hasAiItems = aiItemsCount > 0;

  const resetForm = () => {
    setFormData({
      interest_category: 'subject_area',
      interest_name: '',
      intensity_level: 5,
      since_when: '',
      description: '',
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (entry: Interest) => {
    setFormData(entry);
    setEditingId(entry.id || null);
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.interest_name) {
      showToast.error('กรุณากรอกชื่อความสนใจ');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch('/api/db/user/interests', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        if (editingId) {
          setInterestsList(interestsList.map(i => i.id === editingId ? result.data : i));
          showToast.success('อัปเดตความสนใจสำเร็จ');
        } else {
          setInterestsList([...interestsList, result.data]);
          showToast.success('เพิ่มความสนใจสำเร็จ');
        }
        resetForm();
        onUpdate?.();
      } else {
        showToast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving interest:', error);
      showToast.error('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDelete = (id: string) => {
    confirmDialog.open({
      title: 'ลบความสนใจ',
      description: 'คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/db/user/interests?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setInterestsList(interestsList.filter(i => i.id !== id));
            showToast.success('ลบข้อมูลสำเร็จ');
            onUpdate?.();
          } else {
            showToast.error('ไม่สามารถลบข้อมูลได้');
          }
        } catch (error) {
          console.error('Error deleting interest:', error);
          showToast.error('เกิดข้อผิดพลาด');
        }
      },
    });
  };

  const getIntensityInfo = (level: number) => {
    return INTENSITY_LABELS.find(i => level >= i.min && level <= i.max) || INTENSITY_LABELS[1];
  };

  const getIntensityColor = (level: number) => {
    if (level >= 9) return 'bg-pink-500';
    if (level >= 7) return 'bg-purple-500';
    if (level >= 4) return 'bg-blue-500';
    return 'bg-gray-400';
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
    const allIds = new Set(interestsList.map(i => i.id).filter((id): id is string => !!id));
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
          fetch(`/api/db/user/interests?id=${id}`, { method: 'DELETE' })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      setInterestsList(interestsList.filter(i => !ids.includes(i.id!)));
      setSelectedIds(new Set());

      if (failCount === 0) {
        showToast.success(`ลบข้อมูลสำเร็จ ${successCount} รายการ`);
      } else {
        showToast.warning(`ลบสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
      }

      onUpdate?.();
    } catch (error) {
      console.error('Error batch deleting interests:', error);
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
    const aiItemIds = aiItems.map(i => i.id).filter((id): id is string => !!id);
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

  // Group interests by category
  const groupedInterests = interestsList.reduce((acc, interest) => {
    const category = interest.interest_category || 'subject_area';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(interest);
    return acc;
  }, {} as Record<string, Interest[]>);

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
                checked={selectedIds.size === interestsList.length && interestsList.length > 0}
                onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                เลือกทั้งหมด ({interestsList.length} รายการ)
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

      {/* Interests Grid by Category */}
      {Object.entries(groupedInterests).map(([category, interests]) => {
        const categoryInfo = INTEREST_CATEGORIES.find(c => c.value === category);
        return (
          <div key={category} className="border border-gray-200 rounded-lg p-4 bg-white">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              {categoryInfo?.icon && <categoryInfo.icon className="w-4 h-4 text-pink-600" />}
              <span className="text-lg">{categoryInfo?.label || category}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {interests.length}
              </span>
            </h4>
            <div className="space-y-2">
              {interests.map((interest) => {
                const intensityInfo = getIntensityInfo(interest.intensity_level);
                const IntensityIcon = intensityInfo.icon as LucideIcon;
                return (
                  <div
                    key={interest.id}
                    className="flex items-start gap-3 p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg hover:shadow-md transition-shadow"
                  >
                    {/* Checkbox - Only show if AI items exist */}
                    {hasAiItems && (
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(interest.id!)}
                          onChange={() => handleToggleSelect(interest.id!)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer mt-0.5"
                        />
                      </div>
                    )}

                    <Heart className={`w-5 h-5 flex-shrink-0 mt-0.5 ${intensityInfo.color}`} fill="currentColor" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-gray-800">{interest.interest_name}</h5>
                        <IntensityIcon className={`w-4 h-4 ${intensityInfo.color}`} />
                        {interest.data_source === 'ai_extracted' && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            AI
                          </span>
                        )}
                      </div>
                      {interest.description && (
                        <p className="text-sm text-gray-600 mb-2">{interest.description}</p>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden max-w-32">
                            <div
                              className={`h-full ${getIntensityColor(interest.intensity_level)} transition-all duration-300`}
                              style={{ width: `${interest.intensity_level * 10}%` }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${intensityInfo.color}`}>
                            {intensityInfo.label}
                          </span>
                        </div>
                        {interest.since_when && (
                          <span className="text-xs text-gray-500 inline-flex items-center gap-1">
                            <Clock3 className="w-3 h-3" />
                            {interest.since_when}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(interest)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(interest.id!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Add/Edit Form */}
      {isAdding ? (
        <div className="border-2 border-pink-300 rounded-lg p-4 bg-pink-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">
              {editingId ? 'แก้ไขความสนใจ' : 'เพิ่มความสนใจ'}
            </h4>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Interest Name & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ความสนใจ *
                </label>
                <input
                  type="text"
                  value={formData.interest_name}
                  onChange={(e) => setFormData({ ...formData, interest_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="เช่น วิศวกรรมซอฟต์แวร์, การออกแบบ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่ *
                </label>
                <select
                  value={formData.interest_category}
                  onChange={(e) => setFormData({ ...formData, interest_category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {INTEREST_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Intensity Level Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระดับความสนใจ: <span className={getIntensityInfo(formData.intensity_level).color + ' font-semibold'}>
                  {getIntensityInfo(formData.intensity_level).label}
                </span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">1</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={formData.intensity_level}
                  onChange={(e) => setFormData({ ...formData, intensity_level: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-500"
                />
                <span className="text-xs text-gray-500">10</span>
                <span className="text-sm font-bold text-pink-600 w-8 text-center">
                  {formData.intensity_level}
                </span>
              </div>
            </div>

            {/* Since When */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สนใจมานานแค่ไหน?
              </label>
              <input
                type="text"
                value={formData.since_when}
                onChange={(e) => setFormData({ ...formData, since_when: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="เช่น 3 ปี, ตั้งแต่ ม.1, ตั้งแต่เด็ก"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ทำไมถึงสนใจ?
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="บอกเราว่าทำไมคุณถึงสนใจเรื่องนี้..."
              />
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
          เพิ่มความสนใจ
        </button>
      )}

      {confirmDialog.dialog}
      {typeConfirmDialog.dialog}
    </div>
  );
}
