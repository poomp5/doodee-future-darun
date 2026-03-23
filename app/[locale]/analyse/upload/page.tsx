"use client";
import { useState, useEffect, Suspense } from "react";
import { FileImage, Info, Cloud, RefreshCw, Target, ClipboardList, Palette, BarChart3, Dumbbell, Wrench, GraduationCap, Lightbulb, ChevronDown, AlertTriangle, CheckCircle, Brain, FileText, XCircle, Search, ArrowLeft, Sparkles } from "lucide-react";
import Image from "next/image";
import ProgressBar from "@/components/ProgressBar";
import dynamic from "next/dynamic";
import { enhancedOCR, OCRResult, OCRProgress } from "@/lib/enhanced-ocr";
import { portfolioAnalyzer, PortfolioAnalysisResult, PortfolioAnalysisProgress } from "@/lib/portfolio-analyzer";
import toast from 'react-hot-toast';
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { useRouter, Link } from "@/routing";
import { useSearchParams } from "next/navigation";

const FileUpload = dynamic(() => import("@/components/FileUpload"), { ssr: false });
const SkillsRadarChart = dynamic(() => import("@/components/SkillsRadarChart"), { ssr: false });

const FileUploadSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-36 rounded-lg border border-dashed border-gray-200 bg-gray-50" />
    <div className="mt-4 flex items-center gap-3">
      <div className="h-9 w-28 rounded-md bg-gray-200" />
      <div className="h-9 w-20 rounded-md bg-gray-200" />
      <div className="h-4 w-32 rounded bg-gray-100" />
    </div>
  </div>
);

const SkillsRadarChartSkeleton = () => (
  <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm animate-pulse">
    <div className="h-5 w-44 bg-gray-200 rounded mx-auto mb-4" />
    <div className="mx-auto h-64 w-64 rounded-full bg-gray-100 border border-gray-200" />
    <div className="mt-4 grid grid-cols-2 gap-2">
      <div className="h-4 rounded bg-gray-200" />
      <div className="h-4 rounded bg-gray-200" />
      <div className="h-4 rounded bg-gray-200" />
      <div className="h-4 rounded bg-gray-200" />
    </div>
  </div>
);

export default function UploadPage() {
  const t = useTranslations('portfolio');
  const tCommon = useTranslations('common');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  type FileResult = {
    id: string;
    name: string;
    imageData: string;
    ocrResult: OCRResult | null;
    portfolioAnalysis: PortfolioAnalysisResult | null;
    portfolioAnalysisProgress: PortfolioAnalysisProgress | null;
    deepseekResult: string | null;
    deepseekJson: any;
    deepseekLoading: boolean;
    ocrLoading: boolean;
    portfolioAnalysisLoading: boolean;
    cloudUrl?: string;
    cloudKey?: string;
  };

  interface UploadedFile {
    url: string;
    key: string;
    originalName: string;
    file: File;
  }

  const [fileResults, setFileResults] = useState<FileResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [expandedOCR, setExpandedOCR] = useState<{ [key: string]: boolean }>({});
  const [autoTriggered, setAutoTriggered] = useState(false);

  const fetchFileFromUrl = async (url: string, fileName: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const fileType =
      blob.type ||
      (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    return new File([blob], fileName, { type: fileType });
  };

  // Cleanup OCR worker on unmount
  useEffect(() => {
    return () => {
      enhancedOCR.terminateWorker();
    };
  }, []);

  // Check auth
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || !user || autoTriggered) return;
    const from = searchParams?.get("from");
    const uploadId =
      searchParams?.get("uploadId") || searchParams?.get("file");
    if (!from && !uploadId) return;

    const runAutoAnalyze = async () => {
      try {
        setAutoTriggered(true);
        setLoading(true);
        setStatusText(t('status.cloudProcessing'));

        const uploadsRes = await fetch('/api/portfolio/upload-record', {
          cache: 'no-store',
        });
        const uploadsResult = uploadsRes.ok ? await uploadsRes.json() : null;
        const uploads = Array.isArray(uploadsResult?.data)
          ? uploadsResult.data
          : [];
        if (uploads.length === 0) {
          toast.error('ไม่พบพอร์ตโฟลิโอ กรุณาอัปโหลดก่อน');
          return;
        }

        let target = uploads[0];
        if (uploadId) {
          const match = uploads.find((u: any) => String(u.id) === String(uploadId));
          if (match) target = match;
        }

        if (!target?.file_url) {
          toast.error('ไม่พบไฟล์พอร์ตที่ต้องการวิเคราะห์');
          return;
        }

        const fileName =
          target.portfolio_name ||
          (typeof target.file_url === 'string'
            ? target.file_url.split('/').pop()
            : null) ||
          'portfolio.pdf';

        const file = await fetchFileFromUrl(target.file_url, fileName);
        const saved = await processFileForOCR(
          {
            url: target.file_url,
            key: target.file_key || '',
            originalName: fileName,
            file,
          },
          target.file_url,
          target.file_key || undefined
        );

        if (saved) {
          toast.success('วิเคราะห์เสร็จสิ้น กำลังพาคุณไปดูผลลัพธ์...');
          setTimeout(() => {
            router.push('/analyse');
          }, 1200);
        } else {
          toast.error('วิเคราะห์ไม่สำเร็จ กรุณาลองใหม่');
        }
      } catch (error) {
        console.error('Auto analyse error:', error);
        toast.error('ไม่สามารถวิเคราะห์พอร์ตอัตโนมัติได้');
      } finally {
        setLoading(false);
      }
    };

    runAutoAnalyze();
  }, [authLoading, user, autoTriggered, searchParams, router, t]);

  // Handle cloud upload
  const handleCloudUpload = async (uploadedFiles: UploadedFile[]) => {
    setLoading(true);
    setStatusText(t('status.cloudProcessing'));

    try {
      toast.success(t('toast.cloudStart', { count: uploadedFiles.length }));
      let savedCount = 0;

      for (const uploadedFile of uploadedFiles) {
        const saved = await processFileForOCR(uploadedFile, uploadedFile.url, uploadedFile.key);
        if (saved) {
          savedCount += 1;
        }
      }

      if (savedCount === 0) {
        setStatusText(t('toast.cloudProcessingError'));
        toast.error('วิเคราะห์เสร็จแล้ว แต่บันทึกผลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        return;
      }

      setStatusText(t('status.completed'));

      // Show success message with link to view results
      toast.success(`วิเคราะห์เสร็จสิ้น ${savedCount} ไฟล์! กำลังพาคุณไปดูผลลัพธ์...`, {
        duration: 2000
      });

      // Redirect to analyse page after 2 seconds
      setTimeout(() => {
        router.push('/analyse');
      }, 2000);
    } catch (error) {
      console.error("Cloud processing error:", error);
      setStatusText(t('toast.cloudProcessingError'));
      toast.error(t('toast.cloudProcessingError'));
    } finally {
      setLoading(false);
    }
  };

  // Process file for OCR
  const processFileForOCR = async (uploadedFile: UploadedFile | File, cloudUrl?: string, cloudKey?: string): Promise<boolean> => {
    let file: File;
    let fileName: string;

    if ('originalName' in uploadedFile) {
      file = uploadedFile.file;
      fileName = uploadedFile.originalName;
      cloudUrl = uploadedFile.url;
      cloudKey = uploadedFile.key;
    } else {
      file = uploadedFile;
      fileName = file.name;
    }

    const newFileId = Math.random().toString(36).substring(2, 11);
    const newFile: FileResult = {
      id: newFileId,
      name: fileName,
      imageData: cloudUrl || '',
      ocrResult: null,
      portfolioAnalysis: null,
      portfolioAnalysisProgress: null,
      deepseekResult: null,
      deepseekJson: null,
      deepseekLoading: false,
      ocrLoading: true,
      portfolioAnalysisLoading: false,
      cloudUrl,
      cloudKey,
    };

    setFileResults((prev) => [...prev, newFile]);
    let analysisSaved = false;

    try {
      const onProgress = (progress: OCRProgress) => {
        setProgress(progress.progress);
        setStatusText(progress.status);
      };

      setStatusText(t('status.ocrStarting'));
      toast.loading(t('toast.ocrReading', { filename: fileName }), { id: newFileId });
      const ocrResult = await enhancedOCR.extractText(file, onProgress);

      setFileResults((prev) =>
        prev.map((f) =>
          f.id === newFileId
            ? {
                ...f,
                ocrResult,
                ocrLoading: false,
                deepseekLoading: true,
                imageData: cloudUrl || URL.createObjectURL(file),
              }
            : f
        )
      );

      if (ocrResult.text && ocrResult.text.trim().length > 0) {
        setFileResults((prev) =>
          prev.map((f) =>
            f.id === newFileId
              ? {
                  ...f,
                  portfolioAnalysisLoading: true,
                }
              : f
          )
        );

        setStatusText(t('status.analyzingPortfolio'));
        toast.loading(t('toast.analyzingPortfolio', { filename: fileName }), { id: newFileId });

        const onPortfolioProgress = (progress: PortfolioAnalysisProgress) => {
          setFileResults((prev) =>
            prev.map((f) =>
              f.id === newFileId
                ? {
                    ...f,
                    portfolioAnalysisProgress: progress,
                  }
                : f
            )
          );
        };

        const portfolioAnalysis = await portfolioAnalyzer.analyzePortfolio(
          ocrResult.text,
          fileName,
          ocrResult.confidence,
          onPortfolioProgress
        );

        setFileResults((prev) =>
          prev.map((f) =>
            f.id === newFileId
              ? {
                  ...f,
                  portfolioAnalysis,
                  deepseekResult: portfolioAnalysis?.overview || null,
                  deepseekJson: null,
                  deepseekLoading: false,
                  portfolioAnalysisLoading: false,
                }
              : f
          )
        );

        // Save analysis to database
        if (user?.id && portfolioAnalysis) {
          try {
            console.log('Saving analysis to database for user:', user.id);
            const saveResponse = await fetch('/api/db/analysis', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                subject_scores: portfolioAnalysis.skillsScore || {},
                recommended_faculties: portfolioAnalysis.recommendedFaculties || [],
                strengths: portfolioAnalysis.strengths || [],
                weaknesses: portfolioAnalysis.weaknesses || [],
                recommendations: portfolioAnalysis.recommendations || [],
                overview: portfolioAnalysis.overview || null,
                detected_interests: portfolioAnalysis.detectedInterests || [],
                portfolio_text_excerpt: ocrResult.text ? ocrResult.text.slice(0, 12000) : null,
                analysis_metadata: portfolioAnalysis.analysisMetadata || null,
                file_url: cloudUrl,
              }),
            });
            const responseText = await saveResponse.text();
            let saveResult: any = {};
            try {
              saveResult = responseText ? JSON.parse(responseText) : {};
            } catch {
              saveResult = { raw: responseText };
            }
            if (saveResponse.ok) {
              console.log('Analysis saved to database:', saveResult);
              analysisSaved = true;
            } else {
              console.error(
                'Failed to save analysis - API error:',
                { status: saveResponse.status, body: saveResult }
              );
            }
          } catch (dbError) {
            console.error('Failed to save analysis - Network error:', dbError);
          }
        }

        toast.success(t('toast.complete', { filename: fileName }), { id: newFileId });
        return analysisSaved;
      } else {
        setFileResults((prev) =>
          prev.map((f) =>
            f.id === newFileId
              ? {
                  ...f,
                  deepseekLoading: false,
                  portfolioAnalysisLoading: false,
                }
              : f
          )
        );

        toast(t('toast.noText', { filename: fileName }), {
          id: newFileId,
          icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
          style: {
            background: '#fef3c7',
            color: '#92400e',
          },
        });
        return false;
      }
    } catch (error) {
      console.error("OCR processing error:", error);
      setFileResults((prev) =>
        prev.map((f) =>
          f.id === newFileId
            ? {
                ...f,
                ocrLoading: false,
                deepseekLoading: false,
                portfolioAnalysisLoading: false,
                ocrResult: {
                  text: '',
                  confidence: 0,
                  processingTime: 0,
                  method: 'tesseract' as const,
                  error: 'Processing failed'
                }
              }
            : f
        )
      );

      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('import.meta') || errorMsg.includes('SyntaxError')) {
        toast.error(t('toast.pdfFallback', { filename: fileName }), { id: newFileId });
      } else {
        toast.error(t('toast.processingFailed', { filename: fileName, error: errorMsg }), { id: newFileId });
      }
      return false;
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-500">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>{tCommon('loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header with back button */}
        <div className="mb-6">
          <Link
            href="/analyse"
            className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 font-medium mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            กลับไปดูผลการวิเคราะห์
          </Link>
          <h1 className="text-3xl font-bold text-pink-700 flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            อัปโหลด Portfolio / เกียรติบัตร
          </h1>
          <p className="text-gray-600 mt-2">อัปโหลดไฟล์ของคุณเพื่อรับการวิเคราะห์จาก AI</p>
        </div>

        {/* Warning Alert */}
        <div className="flex items-center p-4 mb-6 text-sm text-yellow-800 rounded-lg bg-yellow-50 border border-yellow-200">
          <Info className="h-4 w-4 flex-shrink-0 mr-2" />
          <div>
            <span className="font-medium">{tCommon('warning')}</span> {t('warningMessage')}
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 border-2 border-pink-200 mb-6">
          <h2 className="text-xl font-semibold text-pink-700 flex items-center gap-2 mb-4">
            <FileImage className="w-6 h-6" />
            เลือกไฟล์ของคุณ
          </h2>

          <Suspense fallback={<FileUploadSkeleton />}>
            <FileUpload
              onUploadComplete={handleCloudUpload}
              multiple={true}
              acceptedFileTypes="application/pdf,image/*"
              maxFileSize={20}
              saveToDatabase={true}
              templateType="portfolio"
            />
          </Suspense>

          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p className="flex items-center">
              {/* <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span> */}
              {/* {t('storageInfo')} */}
            </p>
          </div>
        </div>

        {/* Progress Indicator */}
        {loading && (
          <div className="w-full text-center mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
              <p className="text-pink-600 font-medium text-lg mb-2">{statusText}</p>
              <ProgressBar progress={progress} />
              <p className="text-sm text-gray-600 mt-3">กรุณารอสักครู่ ระบบกำลังวิเคราะห์ไฟล์ของคุณ...</p>
            </div>
          </div>
        )}

        {/* Live Upload Results Preview */}
        {fileResults.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Target className="w-6 h-6 text-pink-600" />
              กำลังประมวลผล
            </h2>
            {fileResults.map((file) => (
              <div
                key={file.id}
                className="bg-white rounded-lg border-2 border-pink-200 shadow-lg overflow-hidden"
              >
                <div className="bg-gradient-to-r from-pink-50 to-purple-50 px-6 py-4 border-b border-pink-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">{file.name}</h3>
                    {file.cloudUrl && (
                      <div className="flex items-center space-x-2 text-sm flex-shrink-0">
                        <Cloud className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <span className="text-blue-600 font-medium">{t('labels.cloudStored')}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* OCR Loading */}
                  {file.ocrLoading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-700 font-medium mb-2 flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" /> {t('status.processingOCR')}
                      </p>
                      <ProgressBar progress={progress} />
                      <p className="text-sm text-blue-600 mt-2">{statusText}</p>
                    </div>
                  )}

                  {/* Portfolio Analysis Loading */}
                  {file.portfolioAnalysisLoading && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-purple-700 font-medium mb-3 flex items-center gap-2">
                        <Brain className="w-5 h-5" /> {t('status.analyzingPortfolio')}
                      </p>
                      {file.portfolioAnalysisProgress && (
                        <>
                          <ProgressBar progress={file.portfolioAnalysisProgress.progress} />
                          <p className="text-sm text-purple-600 mt-2">
                            {file.portfolioAnalysisProgress.status}
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Analysis Complete Preview */}
                  {file.portfolioAnalysis && !file.portfolioAnalysisLoading && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600 font-semibold">
                        <CheckCircle className="w-5 h-5" />
                        วิเคราะห์เสร็จสิ้น!
                      </div>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h5 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4" /> สรุปผล
                        </h5>
                        <p className="text-green-700 text-sm leading-relaxed">
                          {file.portfolioAnalysis.overview}
                        </p>
                      </div>
                      {file.portfolioAnalysis.recommendedFaculties && file.portfolioAnalysis.recommendedFaculties.length > 0 && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                          <h5 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" /> คณะที่แนะนำ (Top 3)
                          </h5>
                          <div className="space-y-2">
                            {file.portfolioAnalysis.recommendedFaculties.slice(0, 3).map((faculty, index) => (
                              <div key={index} className="flex items-center justify-between bg-white rounded px-3 py-2">
                                <span className="font-medium text-indigo-800">{faculty.faculty}</span>
                                <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700 font-semibold">
                                  {faculty.matchPercentage}%
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Box */}
        {!loading && fileResults.length === 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <FileText className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              พร้อมที่จะวิเคราะห์แล้ว
            </h3>
            <p className="text-blue-700 text-sm">
              เลือกไฟล์ Portfolio หรือเกียรติบัตรของคุณด้านบน แล้วระบบจะวิเคราะห์ทันที
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
