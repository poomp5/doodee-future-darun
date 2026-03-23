"use client";

import { useState } from "react";
import { Calculator, Plus, Edit, Trash, Save, X, TrendingUp, BookOpen } from "lucide-react";
import { showToast } from "@/lib/toast";
import { useTranslations } from "next-intl";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

interface GpaxContentProps {
  userId: string;
  gpaxEntries: any[];
}

export default function GpaxContent({ userId, gpaxEntries: initialEntries }: GpaxContentProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  const [gpaxEntries, setGpaxEntries] = useState(initialEntries);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    gpa: "",
    credits: "",
    academic_year: "",
  });

  const confirmDialog = useConfirmDialog();

  // Calculate overall GPAX
  const calculateGpax = (): number | null => {
    let totalPoints = 0;
    let totalCredits = 0;

    gpaxEntries.forEach((entry) => {
      const gpa = Number(entry.gpa) || 0;
      const credits = Number(entry.credits) || 0;
      totalPoints += gpa * credits;
      totalCredits += credits;
    });

    return totalCredits > 0 ? totalPoints / totalCredits : null;
  };

  const overallGpax = calculateGpax();

  const handleAdd = () => {
    setIsAdding(true);
    setEditingId(null);
    setFormData({ gpa: "", credits: "", academic_year: "" });
  };

  const handleEdit = (entry: any) => {
    setEditingId(entry.id);
    setIsAdding(false);
    setFormData({
      gpa: entry.gpa.toString(),
      credits: entry.credits.toString(),
      academic_year: entry.academic_year || "",
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({ gpa: "", credits: "", academic_year: "" });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.gpa || !formData.credits) {
      showToast.error(t('gpax.errorsFillRequired'));
      return;
    }

    const gpa = Number(formData.gpa);
    const credits = Number(formData.credits);

    if (gpa < 0 || gpa > 4) {
      showToast.error(t('gpax.errorsGpaRange'));
      return;
    }

    if (credits <= 0) {
      showToast.error(t('gpax.errorsCreditsPositive'));
      return;
    }

    try {
      if (editingId) {
        // Update existing entry
        const res = await fetch('/api/db/gpax-entries', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            gpa: formData.gpa,
            credits: formData.credits,
            academic_year: formData.academic_year,
          }),
        });

        if (!res.ok) throw new Error('Failed to update');

        setGpaxEntries(prev =>
          prev.map(entry =>
            entry.id === editingId
              ? { ...entry, gpa: formData.gpa, credits: formData.credits, academic_year: formData.academic_year }
              : entry
          )
        );
        showToast.success(t('gpax.successUpdated'));
      } else {
        // Create new entry
        const res = await fetch('/api/db/gpax-entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            gpa: formData.gpa,
            credits: formData.credits,
            academic_year: formData.academic_year,
          }),
        });

        if (!res.ok) throw new Error('Failed to create');

        const newEntry = await res.json();
        setGpaxEntries(prev => [...prev, newEntry]);
        showToast.success(t('gpax.successAdded'));
      }

      handleCancel();
    } catch (error) {
      console.error('Error saving GPAX:', error);
      showToast.error(t('gpax.errorsCannotSave'));
    }
  };

  const handleDelete = (id: number) => {
    confirmDialog.open({
      title: t('gpax.deleteTitle'),
      description: t('gpax.deleteConfirm'),
      confirmText: tCommon('delete'),
      cancelText: tCommon('cancel'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/db/gpax-entries?id=${id}`, {
            method: 'DELETE',
          });

          if (!res.ok) throw new Error('Failed to delete');

          setGpaxEntries(prev => prev.filter(entry => entry.id !== id));
          showToast.success(t('gpax.successDeleted'));
        } catch (error) {
          console.error('Error deleting GPAX:', error);
          showToast.error(t('gpax.errorsCannotDelete'));
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600" />
              {t('gpax.title')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('gpax.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Current GPAX Display */}
      <div className="bg-gradient-to-br from-pink-500 via-purple-500 to-pink-600 rounded-xl shadow-xl p-5 sm:p-8">
        <div className="text-center text-white">
          <div className="flex items-center justify-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
            <h3 className="text-lg font-medium">{t('gpax.current')}</h3>
          </div>
          {overallGpax !== null ? (
            <>
              <p className="text-4xl sm:text-6xl font-bold my-4">{overallGpax.toFixed(2)}</p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm bg-white/20 rounded-lg px-4 py-3 max-w-md mx-auto">
                <div>
                  <p className="opacity-80">{t('gpax.totalEntries')}</p>
                  <p className="font-semibold">{gpaxEntries.length}</p>
                </div>
                <div className="w-full h-px sm:w-px sm:h-10 bg-white/30"></div>
                <div>
                  <p className="opacity-80">{t('gpax.totalCredits')}</p>
                  <p className="font-semibold break-words">
                    {gpaxEntries.reduce((sum, entry) => sum + Number(entry.credits), 0).toFixed(1)} {t('gpax.creditUnit')}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8">
              <BookOpen className="w-16 h-16 mx-auto mb-3 opacity-70" />
              <p className="text-lg">{t('gpax.noData')}</p>
              <p className="text-sm opacity-80 mt-1">{t('gpax.getStarted')}</p>
            </div>
          )}
        </div>
      </div>

      {/* GPAX Entries */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('gpax.entries')}
          </h3>
          {!isAdding && !editingId && (
            <button
              onClick={handleAdd}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('gpax.addEntry')}
            </button>
          )}
        </div>

        {/* Add/Edit Form */}
        {(isAdding || editingId) && (
          <div className="mb-4 p-4 bg-pink-50 border-2 border-pink-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-3">
              {editingId ? t('gpax.editEntry') : t('gpax.addNewEntry')}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('gpax.gpaLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4"
                  value={formData.gpa}
                  onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder={t('gpax.gpaPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('gpax.creditsLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder={t('gpax.creditsPlaceholder')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('gpax.academicYearLabel')}
                </label>
                <input
                  type="text"
                  value={formData.academic_year}
                  onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  placeholder={t('gpax.yearPlaceholder')}
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleSave}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                {tCommon('save')}
              </button>
              <button
                onClick={handleCancel}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
                {tCommon('cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Entries List */}
        {gpaxEntries.length === 0 ? (
          <div className="text-center py-12">
            <Calculator className="w-16 h-16 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-1">{t('gpax.noData')}</p>
            <p className="text-sm text-gray-400">{t('gpax.addToCalculate')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {gpaxEntries
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((entry) => {
                const gpa = Number(entry.gpa);
                const credits = Number(entry.credits);
                const isEditing = editingId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className={`border-2 rounded-lg p-4 transition-all ${
                      isEditing
                        ? "border-pink-400 bg-pink-50"
                        : "border-gray-200 bg-white hover:border-pink-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3">
                          <div className={`text-2xl font-bold ${
                            gpa >= 3.5 ? "text-green-600" :
                            gpa >= 3.0 ? "text-blue-600" :
                            gpa >= 2.5 ? "text-yellow-600" :
                            "text-gray-600"
                          }`}>
                            {gpa.toFixed(2)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 break-words">
                              {entry.academic_year || t('gpax.unspecifiedSemester')}
                            </p>
                            <p className="text-sm text-gray-600 break-words">
                              {credits.toFixed(1)} {t('gpax.creditUnit')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 self-end sm:self-auto">
                        <button
                          onClick={() => handleEdit(entry)}
                          disabled={isAdding || (editingId && editingId !== entry.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={tCommon('edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={isAdding || editingId !== null}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={tCommon('delete')}
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Future Feature Note */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-1">
              {t('gpax.futureFeature')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('gpax.futureDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog.dialog}
    </div>
  );
}
