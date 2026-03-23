"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, GripVertical, GraduationCap, FileText, ExternalLink, Eye, Plus, Target, BarChart3 } from "lucide-react";
import R2Image from "@/components/R2Image";
import { Link } from "@/routing";
import { showToast } from "@/lib/toast";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FacultyContentProps {
  userId: string;
  interestedFaculties: any[];
}

export default function FacultyContent({ userId, interestedFaculties: initialFaculties }: FacultyContentProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [interestedFaculties, setInterestedFaculties] = useState(initialFaculties);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const reorderSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<any | null>(null);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState<string>("");

  const getLocalizedValue = (item: any, thKey: string, enKey: string) => {
    const thValue = item?.[thKey];
    const enValue = item?.[enKey];
    return locale === "en" ? (enValue || thValue || "") : (thValue || enValue || "");
  };

  const getProgramName = (item: any) =>
    getLocalizedValue(item, "program_name_th", "program_name_en")
    || getLocalizedValue(item, "field_name_th", "field_name_en")
    || getLocalizedValue(item, "faculty_name_th", "faculty_name_en");

  const getFacultyName = (item: any) => getLocalizedValue(item, "faculty_name_th", "faculty_name_en");
  const getUniversityName = (item: any) => getLocalizedValue(item, "university_name_th", "university_name_en");

  const handleViewFiles = (faculty: any) => {
    setSelectedFaculty(faculty);
    setPreviewFileUrl(null);
    setFileViewerOpen(true);
  };

  const handlePreviewFile = (fileUrl: string, fileName: string) => {
    setPreviewFileUrl(fileUrl);
    setPreviewFileName(fileName);
  };

  const moveFacultyUp = async (index: number) => {
    if (index === 0) return;

    const newFaculties = [...interestedFaculties];
    [newFaculties[index - 1], newFaculties[index]] = [newFaculties[index], newFaculties[index - 1]];

    setInterestedFaculties(newFaculties);
    scheduleFacultyPriorityUpdate(newFaculties);
  };

  const moveFacultyDown = async (index: number) => {
    if (index === interestedFaculties.length - 1) return;

    const newFaculties = [...interestedFaculties];
    [newFaculties[index], newFaculties[index + 1]] = [newFaculties[index + 1], newFaculties[index]];

    setInterestedFaculties(newFaculties);
    scheduleFacultyPriorityUpdate(newFaculties);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newFaculties = [...interestedFaculties];
    const [draggedItem] = newFaculties.splice(draggedIndex, 1);
    if (!draggedItem) {
      setDraggedIndex(null);
      return;
    }
    newFaculties.splice(dropIndex, 0, draggedItem);

    setInterestedFaculties(newFaculties);
    setDraggedIndex(null);
    scheduleFacultyPriorityUpdate(newFaculties);
  };

  const scheduleFacultyPriorityUpdate = (faculties: any[]) => {
    if (reorderSaveTimeoutRef.current) {
      clearTimeout(reorderSaveTimeoutRef.current);
    }

    reorderSaveTimeoutRef.current = setTimeout(() => {
      void updateFacultyPriorities(faculties);
      reorderSaveTimeoutRef.current = null;
    }, 250);
  };

  const updateFacultyPriorities = async (faculties: any[]) => {
    try {
      const updates = faculties.map((faculty, index) => ({
        id: faculty.id,
        priority: index + 1,
      }));

      const res = await fetch('/api/db/interested-faculties', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      });
      if (!res.ok) throw new Error('Failed to update order');
    } catch (error) {
      console.error("Error updating faculty priorities:", error);
      showToast.error(t('cannotUpdateOrder'));
    }
  };

  useEffect(() => {
    return () => {
      if (reorderSaveTimeoutRef.current) {
        clearTimeout(reorderSaveTimeoutRef.current);
      }
    };
  }, []);

  const top3Faculties = interestedFaculties.slice(0, 3);
  const otherFaculties = interestedFaculties.slice(3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-6 h-6 sm:w-7 sm:h-7 text-pink-600" />
              {t('interestedFaculties')}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('faculty.selectPrompt')}
            </p>
          </div>
          <Link href="/faculty">
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
              <Plus className="w-4 h-4" />
              {t('faculty.selectButton')}
            </button>
          </Link>
        </div>
      </div>

      {interestedFaculties.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-xl shadow-md p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <GraduationCap className="w-10 h-10 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('noFacultiesSelected')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('selectFacultyHint')}
            </p>
            <Link href="/faculty">
              <button className="px-6 py-3 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors">
                {t('selectFaculties')}
              </button>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Top 3 Dream Faculties */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-500" />
                {t('faculty.top3Title')}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {t('dragToReorder')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {top3Faculties.map((item: any, index: number) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  className={`relative bg-gradient-to-br ${
                    index === 0
                      ? "from-yellow-50 via-amber-50 to-orange-50 border-2 border-yellow-400 shadow-xl"
                      : index === 1
                      ? "from-gray-50 via-slate-50 to-zinc-50 border-2 border-gray-400 shadow-lg"
                      : "from-[#ffe8d2] via-[#e6b489] to-[#cd7f32] border-2 border-[#a85a2a] shadow-xl"
                  } rounded-xl p-4 sm:p-5 cursor-move transition-all ${
                    draggedIndex === index
                      ? "opacity-50 scale-95"
                      : "hover:scale-102 hover:shadow-2xl"
                  }`}
                >
                  {/* Priority Badge */}
                  <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 z-10">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${
                      index === 0
                        ? "bg-gradient-to-br from-yellow-400 to-amber-500"
                        : index === 1
                        ? "bg-gradient-to-br from-gray-400 to-slate-500"
                        : "bg-gradient-to-br from-[#d28b45] via-[#b87333] to-[#8c4a1f]"
                    } flex items-center justify-center shadow-lg border-4 border-white`}>
                      <span className="text-white font-bold text-base sm:text-lg">{index + 1}</span>
                    </div>
                  </div>

                  {/* Drag Handle */}
                  <div className="flex justify-center mb-3">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>

                  {/* University Logo */}
                  {item.logo_url && (
                    <div className="flex justify-center mb-4">
                      <div className="w-20 h-20 rounded-full overflow-hidden bg-white shadow-md border-2 border-white">
                        <R2Image
                          src={item.logo_url}
                          alt={getUniversityName(item)}
                          width={80}
                          height={80}
                          className="object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Faculty Info */}
                  <div className="text-center mb-4">
                    <h4 className="font-bold text-gray-900 text-sm sm:text-base mb-1 break-words line-clamp-2">
                      {getProgramName(item)}
                    </h4>
                    <p className="text-xs sm:text-sm text-pink-600 font-medium mb-1 break-words line-clamp-2">
                      {getFacultyName(item)}
                    </p>
                    <p className="text-xs text-gray-600 break-words line-clamp-2">
                      {getUniversityName(item)}
                    </p>
                  </div>

                  {/* Admission Info */}
                  {(item.r1_admission_quota > 0 || item.program_total_seats > 0) && (
                    <div className="bg-white/80 backdrop-blur rounded-lg p-3 mb-4">
                      <p className="text-xs font-semibold text-gray-700 mb-2">{t('faculty.admission')}:</p>
                      <div className="space-y-1">
                        {item.r1_admission_quota > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{t('faculty.round1')}</span>
                            <span className="font-semibold text-yellow-700">
                              {item.r1_admission_quota} {t('faculty.people')}
                            </span>
                          </div>
                        )}
                        {item.program_total_seats > 0 && (
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">{t('faculty.total')}</span>
                            <span className="font-semibold text-gray-800">
                              {item.program_total_seats} {t('faculty.people')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewFiles(item)}
                      className="flex-1 min-w-0 flex items-center justify-center gap-1 px-2.5 sm:px-3 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-xs sm:text-sm font-medium shadow-sm"
                    >
                      <FileText className="w-4 h-4" />
                      <span className="truncate">{t('faculty.viewPortfolio')}</span>
                    </button>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveFacultyUp(index)}
                        disabled={index === 0}
                        className={`p-2 rounded-lg transition-colors ${
                          index === 0
                            ? "text-gray-300 cursor-not-allowed bg-gray-100"
                            : "text-pink-600 hover:bg-white bg-white/50"
                        }`}
                        title={t('moveUp')}
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveFacultyDown(index)}
                        disabled={index === 2 && otherFaculties.length === 0}
                        className={`p-2 rounded-lg transition-colors ${
                          index === 2 && otherFaculties.length === 0
                            ? "text-gray-300 cursor-not-allowed bg-gray-100"
                            : "text-pink-600 hover:bg-white bg-white/50"
                        }`}
                        title={t('moveDown')}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Other Faculties */}
          {otherFaculties.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('faculty.otherFaculties')}
              </h3>
              <div className="space-y-3">
                {otherFaculties.map((item: any, idx: number) => {
                  const index = idx + 3; // Actual index in full array
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      className={`border-2 border-gray-200 rounded-lg p-3 sm:p-4 transition-all bg-white cursor-move ${
                        draggedIndex === index
                          ? "opacity-50 scale-95"
                          : "hover:border-pink-300 hover:shadow-md"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center gap-2 flex-shrink-0">
                          <GripVertical className="w-4 h-4 text-gray-400" />
                          <div className="bg-gray-600 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm font-bold">
                            {index + 1}
                          </div>
                        </div>
                        {/* Logo */}
                        {item.logo_url && (
                          <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                            <R2Image
                              src={item.logo_url}
                              alt={getUniversityName(item)}
                              width={48}
                              height={48}
                              className="object-contain"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800 text-sm break-words">
                            {getProgramName(item)}
                          </h4>
                          <p className="text-xs text-pink-600 break-words">
                            {getFacultyName(item)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 break-words">
                            {getUniversityName(item)}
                          </p>
                          {(item.r1_admission_quota > 0 || item.program_total_seats > 0) && (
                            <div className="flex flex-wrap items-center gap-1 mt-2">
                              {item.r1_admission_quota > 0 && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                                  {t('faculty.round1')}: {item.r1_admission_quota} {t('faculty.people')}
                                </span>
                              )}
                              {item.program_total_seats > 0 && (
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                                  {t('faculty.total')}: {item.program_total_seats} {t('faculty.people')}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleViewFiles(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title={t('faculty.viewPortfolio')}
                          >
                            <FileText className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => moveFacultyUp(index)}
                            disabled={index === 3}
                            className={`p-1.5 rounded transition-colors ${
                              index === 3
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-pink-600 hover:bg-pink-100"
                            }`}
                            title={t('moveUp')}
                          >
                            <ChevronUp className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => moveFacultyDown(index)}
                            disabled={index === interestedFaculties.length - 1}
                            className={`p-1.5 rounded transition-colors ${
                              index === interestedFaculties.length - 1
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-pink-600 hover:bg-pink-100"
                            }`}
                            title={t('moveDown')}
                          >
                            <ChevronDown className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Portfolio Files Dialog */}
      <Dialog open={fileViewerOpen} onOpenChange={(open) => {
        setFileViewerOpen(open);
        if (!open) setPreviewFileUrl(null);
      }}>
        <DialogContent className={previewFileUrl ? "max-w-6xl max-h-[90vh]" : "max-w-2xl max-h-[80vh]"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-500" />
              {previewFileUrl ? previewFileName : t('faculty.uploadedFiles')}
            </DialogTitle>
            {!previewFileUrl && (
              <DialogDescription>
                {selectedFaculty && (
                  <div className="mt-2 text-left">
                    <p className="font-medium text-gray-900">
                      {getUniversityName(selectedFaculty)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getProgramName(selectedFaculty)}
                    </p>
                  </div>
                )}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="mt-4">
            {previewFileUrl ? (
              /* File Preview Mode */
              <div className="space-y-4">
                <div className="border rounded-lg overflow-hidden bg-gray-50">
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(previewFileUrl)}&embedded=true`}
                    className="w-full h-[600px]"
                    title={t('portfolio.filePreview')}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <button
                    onClick={() => setPreviewFileUrl(null)}
                    className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    {t('faculty.back')}
                  </button>
                  <div className="flex gap-3">
                    <a
                      href={previewFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {t('faculty.openNewTab')}
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* File List Mode */
              <div className="space-y-4">
                {/* Admission Quota Summary */}
                {(selectedFaculty?.r1_admission_quota > 0 || selectedFaculty?.program_total_seats > 0) && (
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-3 sm:p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-pink-600" />
                      {t('faculty.admissionQuota')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFaculty?.r1_admission_quota > 0 && (
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md shadow-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                          <span className="text-xs sm:text-sm text-gray-700 break-words">
                            {t('faculty.round1')}: <span className="font-semibold text-yellow-800">{selectedFaculty.r1_admission_quota}</span> {t('faculty.people')}
                          </span>
                        </div>
                      )}
                      {selectedFaculty?.program_total_seats > selectedFaculty?.r1_admission_quota && (
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md shadow-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <span className="text-xs sm:text-sm text-gray-700 break-words">
                            {t('faculty.otherRounds')}: <span className="font-semibold text-blue-800">{selectedFaculty.program_total_seats - selectedFaculty.r1_admission_quota}</span> {t('faculty.people')}
                          </span>
                        </div>
                      )}
                      {selectedFaculty?.program_total_seats > 0 && (
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md shadow-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                          <span className="text-xs sm:text-sm text-gray-700 break-words">
                            {t('faculty.grandTotal')}: <span className="font-semibold text-gray-800">{selectedFaculty.program_total_seats}</span> {t('faculty.people')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Portfolio Files List */}
                {[
                  {
                    label: t('faculty.round1Portfolio'),
                    path: selectedFaculty?.file_path_1,
                    color: "#ffb601",
                    hoverColor: "#e6a400",
                    quota: selectedFaculty?.r1_admission_quota || 0
                  },
                  {
                    label: t('faculty.round2Quota'),
                    path: selectedFaculty?.file_path_2,
                    color: "#f36b55",
                    hoverColor: "#e05540",
                    quota: null
                  },
                  {
                    label: t('faculty.round3Admission'),
                    path: selectedFaculty?.file_path_3,
                    color: "#01a0a9",
                    hoverColor: "#018a92",
                    quota: null
                  },
                  {
                    label: t('faculty.round4Direct'),
                    path: selectedFaculty?.file_path_4,
                    color: "#00709a",
                    hoverColor: "#005f85",
                    quota: null
                  },
                ].map((file, idx) => (
                  <div
                    key={idx}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="p-2 rounded-lg flex-shrink-0"
                          style={{ backgroundColor: `${file.color}20` }}
                        >
                          <FileText
                            className="w-5 h-5"
                            style={{ color: file.color }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 break-words">{file.label}</p>
                          {!file.path && (
                            <p className="text-sm text-gray-400 italic break-words">
                              {t('faculty.noFile')}
                            </p>
                          )}
                          {file.quota !== null && file.quota > 0 && (
                            <div className="mt-1 flex items-center gap-1">
                              <span
                                className="text-xs px-2 py-0.5 rounded font-semibold"
                                style={{
                                  backgroundColor: `${file.color}20`,
                                  color: file.color
                                }}
                              >
                                {t('faculty.admitQuota', { quota: file.quota })}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      {file.path && (
                        <button
                          onClick={() => handlePreviewFile(file.path, file.label)}
                          className="w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-1.5 text-sm text-white rounded-lg transition flex-shrink-0"
                          style={{
                            backgroundColor: file.color,
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = file.hoverColor}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = file.color}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="truncate">{t('faculty.open')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {!selectedFaculty?.file_path_1 &&
                  !selectedFaculty?.file_path_2 &&
                  !selectedFaculty?.file_path_3 &&
                  !selectedFaculty?.file_path_4 && (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{t('faculty.noPortfolioFiles')}</p>
                    </div>
                  )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
