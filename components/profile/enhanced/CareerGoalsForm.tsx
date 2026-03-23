"use client";

import { useState } from "react";
import {
  Target,
  Plus,
  Edit,
  Trash,
  X,
  Save,
  Sparkles,
  Trash2,
  Clock3,
  Lightbulb,
  Building2,
  GraduationCap,
  BookOpen,
  RotateCcw,
  CheckCircle2
} from "lucide-react";
import { showToast } from "@/lib/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTypeConfirmDialog } from "@/components/ui/type-confirm-dialog";
import { useTranslations } from "next-intl";

interface CareerGoal {
  id?: string;
  primary_goal: string;
  backup_goals: string[];
  target_universities: string[];
  target_programs: string[];
  target_industry: string;
  timeline: string;
  motivation: string;
  steps_taken: string[];
  data_source?: string;
}

interface CareerGoalsFormProps {
  userId: string;
  initialData: CareerGoal[];
  onUpdate?: () => void;
}

export default function CareerGoalsForm({ userId, initialData, onUpdate }: CareerGoalsFormProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const confirmDialog = useConfirmDialog();
  const typeConfirmDialog = useTypeConfirmDialog();

  const [goalsList, setGoalsList] = useState<CareerGoal[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<CareerGoal>({
    primary_goal: '',
    backup_goals: [],
    target_universities: [],
    target_programs: [],
    target_industry: '',
    timeline: '',
    motivation: '',
    steps_taken: [],
  });

  // Temporary input states for multi-input arrays
  const [backupGoalInput, setBackupGoalInput] = useState('');
  const [universityInput, setUniversityInput] = useState('');
  const [programInput, setProgramInput] = useState('');
  const [stepInput, setStepInput] = useState('');

  // Calculate AI items
  const aiItems = goalsList.filter(goal => goal.data_source === 'ai_extracted');
  const aiItemsCount = aiItems.length;
  const hasAiItems = aiItemsCount > 0;

  const resetForm = () => {
    setFormData({
      primary_goal: '',
      backup_goals: [],
      target_universities: [],
      target_programs: [],
      target_industry: '',
      timeline: '',
      motivation: '',
      steps_taken: [],
    });
    setIsAdding(false);
    setEditingId(null);
    setBackupGoalInput('');
    setUniversityInput('');
    setProgramInput('');
    setStepInput('');
  };

  const handleEdit = (entry: CareerGoal) => {
    setFormData(entry);
    setEditingId(entry.id || null);
    setIsAdding(true);
  };

  const handleSave = async () => {
    if (!formData.primary_goal) {
      showToast.error('กรุณากรอกเป้าหมายหลัก');
      return;
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId ? { ...formData, id: editingId } : formData;

      const response = await fetch('/api/db/user/career-goals', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (response.ok) {
        if (editingId) {
          setGoalsList(goalsList.map(g => g.id === editingId ? result.data : g));
          showToast.success('อัปเดตเป้าหมายสำเร็จ');
        } else {
          setGoalsList([...goalsList, result.data]);
          showToast.success('เพิ่มเป้าหมายสำเร็จ');
        }
        resetForm();
        onUpdate?.();
      } else {
        showToast.error(result.error || 'เกิดข้อผิดพลาด');
      }
    } catch (error) {
      console.error('Error saving career goal:', error);
      showToast.error('ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const handleDelete = (id: string) => {
    confirmDialog.open({
      title: 'ลบเป้าหมาย',
      description: 'คุณแน่ใจหรือไม่ที่จะลบเป้าหมายนี้?',
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const response = await fetch(`/api/db/user/career-goals?id=${id}`, {
            method: 'DELETE',
          });

          if (response.ok) {
            setGoalsList(goalsList.filter(g => g.id !== id));
            showToast.success('ลบเป้าหมายสำเร็จ');
            onUpdate?.();
          } else {
            showToast.error('ไม่สามารถลบข้อมูลได้');
          }
        } catch (error) {
          console.error('Error deleting career goal:', error);
          showToast.error('เกิดข้อผิดพลาด');
        }
      },
    });
  };

  // Array manipulation helpers
  const addBackupGoal = () => {
    if (backupGoalInput.trim()) {
      setFormData({
        ...formData,
        backup_goals: [...formData.backup_goals, backupGoalInput.trim()],
      });
      setBackupGoalInput('');
    }
  };

  const removeBackupGoal = (index: number) => {
    setFormData({
      ...formData,
      backup_goals: formData.backup_goals.filter((_, i) => i !== index),
    });
  };

  const addUniversity = () => {
    if (universityInput.trim()) {
      setFormData({
        ...formData,
        target_universities: [...formData.target_universities, universityInput.trim()],
      });
      setUniversityInput('');
    }
  };

  const removeUniversity = (index: number) => {
    setFormData({
      ...formData,
      target_universities: formData.target_universities.filter((_, i) => i !== index),
    });
  };

  const addProgram = () => {
    if (programInput.trim()) {
      setFormData({
        ...formData,
        target_programs: [...formData.target_programs, programInput.trim()],
      });
      setProgramInput('');
    }
  };

  const removeProgram = (index: number) => {
    setFormData({
      ...formData,
      target_programs: formData.target_programs.filter((_, i) => i !== index),
    });
  };

  const addStep = () => {
    if (stepInput.trim()) {
      setFormData({
        ...formData,
        steps_taken: [...formData.steps_taken, stepInput.trim()],
      });
      setStepInput('');
    }
  };

  const removeStep = (index: number) => {
    setFormData({
      ...formData,
      steps_taken: formData.steps_taken.filter((_, i) => i !== index),
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
    const allIds = goalsList.map(g => g.id).filter((id): id is string => !!id);
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
          fetch(`/api/db/user/career-goals?id=${id}`, { method: 'DELETE' })
        )
      );

      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - successCount;

      setGoalsList(goalsList.filter(g => !ids.includes(g.id!)));
      setSelectedIds(new Set());

      if (failCount === 0) {
        showToast.success(`ลบข้อมูลสำเร็จ ${successCount} รายการ`);
      } else {
        showToast.warning(`ลบสำเร็จ ${successCount} รายการ, ล้มเหลว ${failCount} รายการ`);
      }
      onUpdate?.();
    } catch (error) {
      console.error('Error batch deleting career goals:', error);
      showToast.error('เกิดข้อผิดพลาดในการลบข้อมูล');
    }
  };

  const handleDeleteSelected = () => {
    const selectedIdsArray = Array.from(selectedIds);
    if (selectedIdsArray.length === 0) return;

    confirmDialog.open({
      title: 'ลบเป้าหมายที่เลือก',
      description: `คุณแน่ใจหรือไม่ที่จะลบเป้าหมาย ${selectedIdsArray.length} รายการ?`,
      confirmText: 'ลบ',
      cancelText: 'ยกเลิก',
      variant: 'danger',
      onConfirm: async () => {
        await handleBatchDelete(selectedIdsArray);
      },
    });
  };

  const handleDeleteAllAI = () => {
    const aiItemIds = aiItems.map(g => g.id).filter((id): id is string => !!id);
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
      {/* Action Toolbar (only show if there are AI items) */}
      {hasAiItems && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-3 mb-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.size === goalsList.length && goalsList.length > 0}
                onChange={(e) => e.target.checked ? handleSelectAll() : handleDeselectAll()}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">
                เลือกทั้งหมด ({goalsList.length} รายการ)
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

      {/* Career Goals List */}
      {goalsList.map((goal) => (
        <div
          key={goal.id}
          className="border border-purple-200 rounded-lg p-5 bg-gradient-to-br from-white to-purple-50 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start gap-4">
            {/* Checkbox (only show if AI items exist) */}
            {hasAiItems && (
              <div className="pt-0.5">
                <input
                  type="checkbox"
                  checked={selectedIds.has(goal.id!)}
                  onChange={() => handleToggleSelect(goal.id!)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                />
              </div>
            )}

            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>

            <div className="flex-1 min-w-0">
              {/* Primary Goal */}
              <div className="mb-3">
                <h4 className="font-bold text-lg text-gray-800 mb-1 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-500" />
                  {goal.primary_goal}
                  {goal.data_source === 'ai_extracted' && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </span>
                  )}
                </h4>
                {goal.timeline && (
                  <p className="text-sm text-purple-600 font-medium inline-flex items-center gap-1">
                    <Clock3 className="w-3.5 h-3.5" />
                    {goal.timeline}
                  </p>
                )}
              </div>

              {/* Motivation */}
              {goal.motivation && (
                <div className="mb-3 bg-pink-50 border-l-4 border-pink-400 p-3 rounded">
                  <p className="text-sm text-gray-700">
                    <span className="font-semibold inline-flex items-center gap-1">
                      <Lightbulb className="w-3.5 h-3.5" />
                      แรงบันดาลใจ:
                    </span>{" "}
                    {goal.motivation}
                  </p>
                </div>
              )}

              {/* Target Industry */}
              {goal.target_industry && (
                <div className="mb-3">
                  <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm">
                    <Building2 className="w-3.5 h-3.5" />
                    {goal.target_industry}
                  </span>
                </div>
              )}

              {/* Target Universities & Programs */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {goal.target_universities && goal.target_universities.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1 inline-flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      มหาวิทยาลัยเป้าหมาย:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {goal.target_universities.map((uni, idx) => (
                        <span key={idx} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {uni}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {goal.target_programs && goal.target_programs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1 inline-flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      สาขาวิชาเป้าหมาย:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {goal.target_programs.map((prog, idx) => (
                        <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                          {prog}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Backup Goals */}
              {goal.backup_goals && goal.backup_goals.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-600 mb-1 inline-flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    เป้าหมายสำรอง:
                  </p>
                  <ul className="space-y-1">
                    {goal.backup_goals.map((backup, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                        <span className="text-gray-400">•</span>
                        {backup}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Steps Taken */}
              {goal.steps_taken && goal.steps_taken.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1 inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    ขั้นตอนที่ดำเนินการไปแล้ว:
                  </p>
                  <ul className="space-y-1">
                    {goal.steps_taken.map((step, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-1">
              <button
                onClick={() => handleEdit(goal)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(goal.id!)}
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
        <div className="border-2 border-purple-300 rounded-lg p-5 bg-purple-50">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              {editingId ? 'แก้ไขเป้าหมาย' : 'เพิ่มเป้าหมาย'}
            </h4>
            <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Primary Goal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เป้าหมายหลัก *
              </label>
              <input
                type="text"
                value={formData.primary_goal}
                onChange={(e) => setFormData({ ...formData, primary_goal: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="เช่น เข้าศึกษาในคณะวิศวกรรมศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย"
              />
            </div>

            {/* Timeline & Industry */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  กรอบเวลา
                </label>
                <input
                  type="text"
                  value={formData.timeline}
                  onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="เช่น ภายใน 2 ปี, ปี 2568"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  อุตสาหกรรมเป้าหมาย
                </label>
                <input
                  type="text"
                  value={formData.target_industry}
                  onChange={(e) => setFormData({ ...formData, target_industry: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="เช่น เทคโนโลยี, การแพทย์"
                />
              </div>
            </div>

            {/* Motivation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                แรงบันดาลใจ / ทำไมถึงมีเป้าหมายนี้?
              </label>
              <textarea
                value={formData.motivation}
                onChange={(e) => setFormData({ ...formData, motivation: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="บอกเราว่าทำไมคุณถึงมีเป้าหมายนี้..."
              />
            </div>

            {/* Target Universities */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                มหาวิทยาลัยเป้าหมาย
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={universityInput}
                  onChange={(e) => setUniversityInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addUniversity())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="ชื่อมหาวิทยาลัย"
                />
                <button
                  type="button"
                  onClick={addUniversity}
                  className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.target_universities.map((uni, index) => (
                  <span key={index} className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                    {uni}
                    <button
                      type="button"
                      onClick={() => removeUniversity(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Target Programs */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                สาขาวิชาเป้าหมาย
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={programInput}
                  onChange={(e) => setProgramInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProgram())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="ชื่อสาขาวิชา"
                />
                <button
                  type="button"
                  onClick={addProgram}
                  className="px-3 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.target_programs.map((prog, index) => (
                  <span key={index} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-2 py-1 rounded text-sm">
                    {prog}
                    <button
                      type="button"
                      onClick={() => removeProgram(index)}
                      className="text-purple-600 hover:text-purple-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Backup Goals */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เป้าหมายสำรอง
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={backupGoalInput}
                  onChange={(e) => setBackupGoalInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBackupGoal())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="เป้าหมายสำรอง (กรณีเป้าหมายหลักไม่สำเร็จ)"
                />
                <button
                  type="button"
                  onClick={addBackupGoal}
                  className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {formData.backup_goals.map((goal, index) => (
                  <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded text-sm">
                    <span className="flex-1 text-gray-700">{goal}</span>
                    <button
                      type="button"
                      onClick={() => removeBackupGoal(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Steps Taken */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ขั้นตอนที่ดำเนินการไปแล้ว
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={stepInput}
                  onChange={(e) => setStepInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addStep())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="สิ่งที่คุณได้ทำไปแล้วเพื่อบรรลุเป้าหมาย"
                />
                <button
                  type="button"
                  onClick={addStep}
                  className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-1">
                {formData.steps_taken.map((step, index) => (
                  <div key={index} className="flex items-center gap-2 bg-green-50 px-3 py-2 rounded text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="flex-1 text-gray-700">{step}</span>
                    <button
                      type="button"
                      onClick={() => removeStep(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
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
          className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-purple-400 hover:text-purple-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          เพิ่มเป้าหมายในอนาคต
        </button>
      )}

      {confirmDialog.dialog}
      {typeConfirmDialog.dialog}
    </div>
  );
}
