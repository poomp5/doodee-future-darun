"use client";

import { useState } from "react";
import { School, Plus, Edit, Trash, X, Save, Trash2, MapPin, Trophy, Sparkles } from "lucide-react";
import { showToast } from "@/lib/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTypeConfirmDialog } from "@/components/ui/type-confirm-dialog";
import { useTranslations } from "next-intl";

interface EducationEntry {
  id?: string;
  school_name: string;
  school_type: string;
  start_year: number | null;
  end_year: number | null;
  is_current: boolean;
  location: string;
  major: string;
  honors_awards: string[];
  data_source?: string;
}

interface EducationHistoryFormProps {
  userId: string;
  initialData: EducationEntry[];
  onUpdate?: () => void;
}

const SCHOOL_TYPES = [
  { value: 'primary', label: 'ประถมศึกษา' },
  { value: 'secondary', label: 'มัธยมต้น' },
  { value: 'high_school', label: 'มัธยมปลาย' },
  { value: 'university', label: 'มหาวิทยาลัย' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i + 5);

export default function EducationHistoryForm({ userId, initialData, onUpdate }: EducationHistoryFormProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const confirmDialog = useConfirmDialog();
  const typeConfirmDialog = useTypeConfirmDialog();

  const [educationList, setEducationList] = useState<EducationEntry[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<EducationEntry>({
    school_name: '',
    school_type: 'high_school',
    start_year: null,
    end_year: null,
    is_current: false,
    location: '',
    major: '',
    honors_awards: [],
  });
  const [awardInput, setAwardInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Calculate AI-extracted items count
  const aiItems = educationList.filter(e => e.data_source === 'ai_extracted');
  const aiItemsCount = aiItems.length;
  const hasAiItems = aiItemsCount > 0;

  const resetForm = () => {
    setFormData({
      school_name: '',
      school_type: 'high_school',
      start_year: null,
      end_year: null,
      is_current: false,
      location: '',
      major: '',
      honors_awards: [],
    });
    setAwardInput('');
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (entry: EducationEntry) => {
    setFormData(entry);
    setEditingId(entry.id || null);
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.school_name) {
      showToast.error('กรุณากรอกชื่อสถานศึกษา');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch('/api/db/user/education', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        if (editingId) {
          setEducationList(educationList.map(e => e.id === editingId ? result.data : e));
          showToast.success('อัปเดตข้อมูลการศึกษาสำเร็จ');
        } else {
          setEducationList([...educationList, result.data]);
          showToast.success('เพิ่มข้อมูลการศึกษาสำเร็จ');
        }
        resetForm();
        onUpdate?.();
      } else {
        showToast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving education:', error);
      showToast.error('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDelete = (id: string) => {
    confirmDialog.open({
      title: 'ลบข้อมูลการศึกษา',
      description: 'คุณแน่ใจหรือไม่ที่จะลบข้อมูลนี้?',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/db/user/education?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setEducationList(educationList.filter(e => e.id !== id));
            showToast.success('ลบข้อมูลสำเร็จ');
            onUpdate?.();
          } else {
            showToast.error('ไม่สามารถลบข้อมูลได้');
          }
        } catch (error) {
          console.error('Error deleting education:', error);
          showToast.error('เกิดข้อผิดพลาด');
        }
      },
    });
  };

  const addAward = () => {
    if (awardInput.trim()) {
      setFormData({
        ...formData,
        honors_awards: [...formData.honors_awards, awardInput.trim()],
      });
      setAwardInput('');
    }
  };

  const removeAward = (index: number) => {
    setFormData({
      ...formData,
      honors_awards: formData.honors_awards.filter((_, i) => i !== index),
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
    const allIds = new Set(educationList.map(e => e.id).filter((id): id is string => !!id));
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
          fetch(`/api/db/user/education?id=${id}`, { method: 'DELETE' })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      setEducationList(educationList.filter(e => !ids.includes(e.id!)));
      setSelectedIds(new Set());

      if (failCount === 0) {
        showToast.success(`ลบข้อมูลสำเร็จ ${successCount} รายการ`);
      } else {
        showToast.warning(`ลบสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
      }

      onUpdate?.();
    } catch (error) {
      console.error('Error batch deleting education:', error);
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
    const aiItemIds = aiItems.map(e => e.id).filter((id): id is string => !!id);
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
                checked={selectedIds.size === educationList.length && educationList.length > 0}
                onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                เลือกทั้งหมด ({educationList.length} รายการ)
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

      {/* Education List */}
      {educationList.map((entry) => (
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
              <div className="flex items-center gap-2 mb-1">
                <School className="w-4 h-4 text-pink-600" />
                <h4 className="font-semibold text-gray-800">{entry.school_name}</h4>
                {entry.is_current && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    กำลังศึกษา
                  </span>
                )}
                {entry.data_source === 'ai_extracted' && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{SCHOOL_TYPES.find(t => t.value === entry.school_type)?.label}</p>
              {entry.major && <p className="text-sm text-gray-600">สาขา: {entry.major}</p>}
              {entry.location && (
                <p className="text-xs text-gray-500 inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {entry.location}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {entry.start_year} - {entry.is_current ? 'ปัจจุบัน' : entry.end_year}
              </p>
              {entry.honors_awards && entry.honors_awards.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {entry.honors_awards.map((award, idx) => (
                    <span key={idx} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded inline-flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      {award}
                    </span>
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
      ))}

      {/* Add/Edit Form */}
      {isAdding ? (
        <div className="border-2 border-pink-300 rounded-lg p-4 bg-pink-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800">
              {editingId ? 'แก้ไขข้อมูลการศึกษา' : 'เพิ่มข้อมูลการศึกษา'}
            </h4>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อสถานศึกษา *
              </label>
              <input
                type="text"
                value={formData.school_name}
                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                placeholder="เช่น โรงเรียนมัธยมสาธิต"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ระดับการศึกษา
                </label>
                <select
                  value={formData.school_type}
                  onChange={(e) => setFormData({ ...formData, school_type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {SCHOOL_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สถานที่
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="เช่น กรุงเทพฯ"
                />
              </div>
            </div>

            {(formData.school_type === 'university' || formData.school_type === 'high_school') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สาขา/แผนการเรียน
                </label>
                <input
                  type="text"
                  value={formData.major}
                  onChange={(e) => setFormData({ ...formData, major: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="เช่น วิทย์-คณิต, วิศวกรรมคอมพิวเตอร์"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ปีที่เริ่ม
                </label>
                <select
                  value={formData.start_year || ''}
                  onChange={(e) => setFormData({ ...formData, start_year: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="">เลือกปี</option>
                  {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ปีที่จบ
                </label>
                <select
                  value={formData.end_year || ''}
                  onChange={(e) => setFormData({ ...formData, end_year: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={formData.is_current}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent disabled:bg-gray-100"
                >
                  <option value="">เลือกปี</option>
                  {YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_current}
                onChange={(e) => setFormData({ ...formData, is_current: e.target.checked, end_year: e.target.checked ? null : formData.end_year })}
                className="rounded border-gray-300 text-pink-600 focus:ring-pink-500"
              />
              <span className="text-sm text-gray-700">กำลังศึกษาอยู่</span>
            </label>

            {/* Awards */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รางวัล/เกียรติบัตร
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={awardInput}
                  onChange={(e) => setAwardInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAward())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="เช่น เกียรตินิยมอันดับ 1"
                />
                <button
                  type="button"
                  onClick={addAward}
                  className="px-3 py-2 bg-pink-100 text-pink-700 rounded-md hover:bg-pink-200 transition-colors"
                >
                  เพิ่ม
                </button>
              </div>
              {formData.honors_awards.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.honors_awards.map((award, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {award}
                      <button onClick={() => removeAward(idx)} className="hover:text-yellow-900">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

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
          เพิ่มประวัติการศึกษา
        </button>
      )}

      {confirmDialog.dialog}
      {typeConfirmDialog.dialog}
    </div>
  );
}
