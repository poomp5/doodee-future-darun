"use client";

import { useState } from "react";
import {
  Zap,
  Plus,
  Edit,
  Trash,
  X,
  Save,
  Trash2,
  Code2,
  Languages,
  Handshake,
  Palette,
  Microscope,
  Sparkles,
  BadgeCheck
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTypeConfirmDialog } from "@/components/ui/type-confirm-dialog";
import { useTranslations } from "next-intl";

interface Skill {
  id?: string;
  skill_name: string;
  skill_category: string;
  proficiency_level: string;
  verified_by: string;
  evidence_url: string;
  years_of_experience: number | null;
  data_source?: string;
}

interface SkillsFormProps {
  userId: string;
  initialData: Skill[];
  onUpdate?: () => void;
}

const SKILL_CATEGORIES = [
  { value: 'technical', label: 'ทักษะทางเทคนิค', color: 'blue', icon: Code2 },
  { value: 'language', label: 'ภาษา', color: 'green', icon: Languages },
  { value: 'soft_skill', label: 'ทักษะอ่อน', color: 'purple', icon: Handshake },
  { value: 'creative', label: 'ความคิดสร้างสรรค์', color: 'pink', icon: Palette },
  { value: 'research', label: 'การวิจัย', color: 'indigo', icon: Microscope },
];

const PROFICIENCY_LEVELS = [
  { value: 'beginner', label: 'เริ่มต้น', width: 25, color: 'bg-gray-400' },
  { value: 'intermediate', label: 'ปานกลาง', width: 50, color: 'bg-blue-400' },
  { value: 'advanced', label: 'ขั้นสูง', width: 75, color: 'bg-purple-400' },
  { value: 'expert', label: 'ผู้เชี่ยวชาญ', width: 100, color: 'bg-pink-500' },
];

const VERIFICATION_TYPES = [
  { value: 'self', label: 'ประเมินตนเอง' },
  { value: 'teacher', label: 'ครูยืนยัน' },
  { value: 'institution', label: 'สถาบันรับรอง' },
  { value: 'certificate', label: 'มีใบรับรอง' },
];

export default function SkillsForm({ userId, initialData, onUpdate }: SkillsFormProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const confirmDialog = useConfirmDialog();
  const typeConfirmDialog = useTypeConfirmDialog();

  const [skillsList, setSkillsList] = useState<Skill[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Skill>({
    skill_name: '',
    skill_category: 'technical',
    proficiency_level: 'intermediate',
    verified_by: 'self',
    evidence_url: '',
    years_of_experience: null,
  });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Calculate AI-extracted items count
  const aiItems = skillsList.filter(s => s.data_source === 'ai_extracted');
  const aiItemsCount = aiItems.length;
  const hasAiItems = aiItemsCount > 0;

  const resetForm = () => {
    setFormData({
      skill_name: '',
      skill_category: 'technical',
      proficiency_level: 'intermediate',
      verified_by: 'self',
      evidence_url: '',
      years_of_experience: null,
    });
    setIsAdding(false);
    setEditingId(null);
  };

  const handleEdit = (entry: Skill) => {
    setFormData(entry);
    setEditingId(entry.id || null);
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.skill_name) {
      showToast.error('กรุณากรอกชื่อทักษะ');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch('/api/db/user/skills', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        if (editingId) {
          setSkillsList(skillsList.map(s => s.id === editingId ? result.data : s));
          showToast.success('อัปเดตทักษะสำเร็จ');
        } else {
          setSkillsList([...skillsList, result.data]);
          showToast.success('เพิ่มทักษะสำเร็จ');
        }
        resetForm();
        onUpdate?.();
      } else {
        showToast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving skill:', error);
      showToast.error('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDelete = (id: string) => {
    confirmDialog.open({
      title: 'ลบทักษะ',
      description: 'คุณแน่ใจหรือไม่ที่จะลบทักษะนี้?',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/db/user/skills?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setSkillsList(skillsList.filter(s => s.id !== id));
            showToast.success('ลบทักษะสำเร็จ');
            onUpdate?.();
          } else {
            showToast.error('ไม่สามารถลบข้อมูลได้');
          }
        } catch (error) {
          console.error('Error deleting skill:', error);
          showToast.error('เกิดข้อผิดพลาด');
        }
      },
    });
  };

  const getProficiencyInfo = (level: string) => {
    return PROFICIENCY_LEVELS.find(p => p.value === level) || PROFICIENCY_LEVELS[1];
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
    const allIds = new Set(skillsList.map(s => s.id).filter((id): id is string => !!id));
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
          fetch(`/api/db/user/skills?id=${id}`, { method: 'DELETE' })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      setSkillsList(skillsList.filter(s => !ids.includes(s.id!)));
      setSelectedIds(new Set());

      if (failCount === 0) {
        showToast.success(`ลบข้อมูลสำเร็จ ${successCount} รายการ`);
      } else {
        showToast.warning(`ลบสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
      }

      onUpdate?.();
    } catch (error) {
      console.error('Error batch deleting skills:', error);
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
    const aiItemIds = aiItems.map(s => s.id).filter((id): id is string => !!id);
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

  // Group skills by category
  const groupedSkills = skillsList.reduce((acc, skill) => {
    const category = skill.skill_category || 'technical';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

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
                checked={selectedIds.size === skillsList.length && skillsList.length > 0}
                onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                เลือกทั้งหมด ({skillsList.length} รายการ)
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

      {/* Skills Grid by Category */}
      {Object.entries(groupedSkills).map(([category, skills]) => {
        const categoryInfo = SKILL_CATEGORIES.find(c => c.value === category);
        return (
          <div key={category} className="border border-gray-200 rounded-lg p-4 bg-white">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              {categoryInfo?.icon && <categoryInfo.icon className="w-4 h-4 text-pink-600" />}
              <span className="text-xl">{categoryInfo?.label || category}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {skills.length}
              </span>
            </h4>
            <div className="space-y-2">
              {skills.map((skill) => {
                const profInfo = getProficiencyInfo(skill.proficiency_level);
                return (
                  <div
                    key={skill.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {/* Checkbox - Only show if AI items exist */}
                    {hasAiItems && (
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(skill.id!)}
                          onChange={() => handleToggleSelect(skill.id!)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                      </div>
                    )}

                    <Zap className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-800">{skill.skill_name}</h5>
                          {skill.data_source === 'ai_extracted' && (
                            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              AI
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {skill.years_of_experience && (
                            <span className="text-xs text-gray-500">
                              {skill.years_of_experience} ปี
                            </span>
                          )}
                          {skill.verified_by !== 'self' && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded inline-flex items-center gap-1">
                              <BadgeCheck className="w-3 h-3" />
                              ยืนยันแล้ว
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${profInfo.color} transition-all duration-300`}
                            style={{ width: `${profInfo.width}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 w-20 text-right">
                          {profInfo.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(skill)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(skill.id!)}
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
              {editingId ? 'แก้ไขทักษะ' : 'เพิ่มทักษะ'}
            </h4>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Skill Name & Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ชื่อทักษะ *
                </label>
                <input
                  type="text"
                  value={formData.skill_name}
                  onChange={(e) => setFormData({ ...formData, skill_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="เช่น Python, English, Leadership"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  หมวดหมู่ *
                </label>
                <select
                  value={formData.skill_category}
                  onChange={(e) => setFormData({ ...formData, skill_category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {SKILL_CATEGORIES.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Proficiency Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ระดับความชำนาญ *
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PROFICIENCY_LEVELS.map(level => (
                  <button
                    key={level.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, proficiency_level: level.value })}
                    className={`px-3 py-2 text-sm rounded-md transition-colors ${
                      formData.proficiency_level === level.value
                        ? `${level.color} text-white`
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Verification & Experience */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  การยืนยัน
                </label>
                <select
                  value={formData.verified_by}
                  onChange={(e) => setFormData({ ...formData, verified_by: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  {VERIFICATION_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ประสบการณ์ (ปี)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.years_of_experience || ''}
                  onChange={(e) => setFormData({ ...formData, years_of_experience: e.target.value ? parseInt(e.target.value) : null })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Evidence URL */}
            {formData.verified_by !== 'self' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ลิงก์หลักฐาน/ใบรับรอง
                </label>
                <input
                  type="url"
                  value={formData.evidence_url}
                  onChange={(e) => setFormData({ ...formData, evidence_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>
            )}

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
          เพิ่มทักษะ
        </button>
      )}

      {confirmDialog.dialog}
      {typeConfirmDialog.dialog}
    </div>
  );
}
