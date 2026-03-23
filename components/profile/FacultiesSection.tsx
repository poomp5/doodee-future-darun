"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown, GripVertical, GraduationCap, FileText, ExternalLink, Eye, BarChart3 } from "lucide-react";
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

interface FacultiesSectionProps {
  initialFaculties: any[];
}

export default function FacultiesSection({ initialFaculties }: FacultiesSectionProps) {
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

  const moveFacultyUp = (index: number) => {
    if (index === 0) return;

    const newFaculties = [...interestedFaculties];
    [newFaculties[index - 1], newFaculties[index]] = [newFaculties[index], newFaculties[index - 1]];

    setInterestedFaculties(newFaculties);
    scheduleFacultyPriorityUpdate(newFaculties);
  };

  const moveFacultyDown = (index: number) => {
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

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
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

  return (
    <div className="p-4 bg-white border border-gray-200 shadow-lg rounded-xl">
      {/* Interested Faculties Section */}
      <div className="w-full mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold text-pink-700 text-lg flex items-center gap-2">
            {t('interestedFaculties')}
          </h3>
          {interestedFaculties.length > 0 && (
            <Link href="/faculty">
              <button className="w-full sm:w-auto text-xs bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded-md transition-colors">
                {tCommon('edit')}
              </button>
            </Link>
          )}
        </div>

        {interestedFaculties.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 text-sm mb-1">{t('noFacultiesSelected')}</p>
            <p className="text-gray-400 text-xs mb-3">{t('selectFacultyHint')}</p>
            <Link href="/faculty">
              <button className="text-sm bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md transition-colors">
                {t('selectFaculties')}
              </button>
            </Link>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-3">
              {t('dragToReorder')}
            </p>
            <div className="space-y-2">
            {interestedFaculties.map((item: any, index: number) => (
              <div
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                className={`border border-pink-200 rounded-lg p-3 transition-all bg-gradient-to-r from-pink-50 to-white cursor-move ${
                  draggedIndex === index
                    ? "opacity-50 scale-95"
                    : "hover:border-pink-400 hover:shadow-md"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <div className="bg-pink-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                  {/* Logo */}
                  {item.logo_url && (
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                      <R2Image
                        src={item.logo_url}
                        alt={getUniversityName(item)}
                        width={40}
                        height={40}
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
                    {(item.major_category || item.minor_category) && (
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {item.major_category && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {item.major_category}
                          </span>
                        )}
                        {item.minor_category && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            {item.minor_category}
                          </span>
                        )}
                      </div>
                    )}
                    {(item.r1_admission_quota > 0 || item.program_total_seats > 0) && (
                      <div className="mt-2 space-y-1">
                        <p className="text-xs font-semibold text-gray-700">รับสมัคร:</p>
                        <div className="flex flex-wrap items-center gap-1">
                          {item.r1_admission_quota > 0 && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                              รอบ 1: {item.r1_admission_quota} คน
                            </span>
                          )}
                          {item.program_total_seats > item.r1_admission_quota && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              รอบอื่นๆ: {item.program_total_seats - item.r1_admission_quota} คน
                            </span>
                          )}
                          {item.program_total_seats > 0 && (
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-gray-500"></span>
                              รวม: {item.program_total_seats} คน
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleViewFiles(item)}
                      className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                      title="ดูไฟล์ Portfolio"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => moveFacultyUp(index)}
                      disabled={index === 0}
                      className={`p-1 rounded transition-colors ${
                        index === 0
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
                      className={`p-1 rounded transition-colors ${
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
            ))}
            </div>
          </>
        )}
      </div>

      {/* Portfolio Files Dialog */}
      <Dialog open={fileViewerOpen} onOpenChange={(open) => {
        setFileViewerOpen(open);
        if (!open) setPreviewFileUrl(null);
      }}>
        <DialogContent className={previewFileUrl ? "max-w-6xl max-h-[90vh]" : "max-w-2xl max-h-[80vh]"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-500" />
              {previewFileUrl ? previewFileName : "ไฟล์ Portfolio ที่อัปโหลด"}
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
                    title="File Preview"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-between">
                  <button
                    onClick={() => setPreviewFileUrl(null)}
                    className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  >
                    ← กลับ
                  </button>
                  <div className="flex gap-3">
                    <a
                      href={previewFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <ExternalLink className="w-4 h-4" />
                      เปิดในแท็บใหม่
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              /* File List Mode */
              <div className="space-y-4">
                {/* Admission Quota Summary */}
                {(selectedFaculty?.r1_admission_quota > 0 || selectedFaculty?.program_total_seats > 0) && (
                  <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
                      <BarChart3 className="w-4 h-4 text-pink-600" />
                      จำนวนรับสมัคร
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedFaculty?.r1_admission_quota > 0 && (
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md shadow-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                          <span className="text-sm text-gray-700">
                            รอบ 1: <span className="font-semibold text-yellow-800">{selectedFaculty.r1_admission_quota}</span> คน
                          </span>
                        </div>
                      )}
                      {selectedFaculty?.program_total_seats > selectedFaculty?.r1_admission_quota && (
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md shadow-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                          <span className="text-sm text-gray-700">
                            รอบอื่นๆ: <span className="font-semibold text-blue-800">{selectedFaculty.program_total_seats - selectedFaculty.r1_admission_quota}</span> คน
                          </span>
                        </div>
                      )}
                      {selectedFaculty?.program_total_seats > 0 && (
                        <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-md shadow-sm">
                          <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                          <span className="text-sm text-gray-700">
                            รวมทั้งหมด: <span className="font-semibold text-gray-800">{selectedFaculty.program_total_seats}</span> คน
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Portfolio Files List */}
                {[
                  {
                    label: "รอบที่ 1 - Portfolio",
                    path: selectedFaculty?.file_path_1,
                    color: "#ffb601",
                    hoverColor: "#e6a400",
                    quota: selectedFaculty?.r1_admission_quota || 0
                  },
                  {
                    label: "รอบที่ 2 - Quota",
                    path: selectedFaculty?.file_path_2,
                    color: "#f36b55",
                    hoverColor: "#e05540",
                    quota: null
                  },
                  {
                    label: "รอบที่ 3 - Admission",
                    path: selectedFaculty?.file_path_3,
                    color: "#01a0a9",
                    hoverColor: "#018a92",
                    quota: null
                  },
                  {
                    label: "รอบที่ 4 - Direct Admission",
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
                              ไม่มีไฟล์
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
                                รับสมัคร {file.quota} คน
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
                          เปิด
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
                      <p className="text-gray-500">ไม่มีไฟล์ Portfolio</p>
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
