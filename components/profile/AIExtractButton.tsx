"use client";

import { useState } from "react";
import { Sparkles, CheckCircle, AlertCircle, Loader2, FileText, FileSearch } from "lucide-react";
import { showToast } from "@/lib/toast";
import { enhancedOCR } from "@/lib/enhanced-ocr";

interface ExtractionResult {
  success: boolean;
  message: string;
  stats?: {
    filesProcessed: number;
    itemsExtracted: number;
    duplicatesRemoved: number;
    itemsCreated: number;
    breakdown: {
      education: number;
      achievements: number;
      skills: number;
      interests: number;
      extracurricular: number;
      careerGoals: number;
    };
  };
}

interface AIExtractButtonProps {
  onComplete?: () => void;
}

export default function AIExtractButton({ onComplete }: AIExtractButtonProps) {
  const [extracting, setExtracting] = useState(false);
  const [result, setResult] = useState<ExtractionResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [currentStep, setCurrentStep] = useState('');
  const [ocrProgress, setOcrProgress] = useState({ current: 0, total: 0 });

  // Helper function to convert URL to File object
  const fetchFileFromUrl = async (url: string, fileName: string): Promise<File> => {
    const response = await fetch(url);
    const blob = await response.blob();
    const fileType = blob.type || (fileName.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg');
    return new File([blob], fileName, { type: fileType });
  };

  const handleExtract = async () => {
    try {
      setExtracting(true);
      setResult(null);
      setShowResult(false);
      setCurrentStep('กำลังดึงข้อมูลพอร์ตของคุณ...');

      // First, check if portfolios need OCR
      const checkResponse = await fetch('/api/profile/ai-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const checkData = await checkResponse.json();

      // If portfolios need OCR, process them
      if (checkData.needsOCR && checkData.portfolios && checkData.portfolios.length > 0) {
        setCurrentStep('กำลังอ่านข้อความจากพอร์ต...');
        setOcrProgress({ current: 0, total: checkData.portfolios.length });

        const portfoliosWithOCR = [];

        for (let i = 0; i < checkData.portfolios.length; i++) {
          const portfolio = checkData.portfolios[i];
          const isPDF = portfolio.type === 'application/pdf' || portfolio.name.toLowerCase().endsWith('.pdf');
          const fileType = isPDF ? 'PDF' : 'รูปภาพ';

          setCurrentStep(`กำลังประมวลผล${fileType} ${i + 1}/${checkData.portfolios.length}...`);

          try {
            // Convert URL to File object
            const file = await fetchFileFromUrl(portfolio.url, portfolio.name);

            // Use extractText() which handles both PDFs and images with multi-tier fallback
            const ocrResult = await enhancedOCR.extractText(
              file,
              (progress) => {
                // Update progress with file type and status
                const statusText = isPDF && progress.status?.includes('PDF')
                  ? 'กำลังแยกข้อความจาก PDF'
                  : 'กำลังอ่านข้อความด้วย OCR';
                setCurrentStep(`${statusText} ${i + 1}/${checkData.portfolios.length} (${Math.round(progress.progress)}%)`);
              }
            );

            if (ocrResult && ocrResult.text && ocrResult.text.length > 10) {
              portfoliosWithOCR.push({
                id: portfolio.id,
                name: portfolio.name,
                ocrText: ocrResult.text,
              });
            } else {
              console.warn(`No sufficient text extracted from ${portfolio.name}`);
            }

            // Update progress after processing completes
            setOcrProgress({ current: i + 1, total: checkData.portfolios.length });
          } catch (error) {
            console.error(`Error processing portfolio ${portfolio.name}:`, error);
            // Update progress even if this file failed
            setOcrProgress({ current: i + 1, total: checkData.portfolios.length });
            // Continue with other portfolios even if one fails
          }
        }

        if (portfoliosWithOCR.length === 0) {
          showToast.error('ไม่สามารถอ่านข้อความจากพอร์ตได้ กรุณาตรวจสอบว่าไฟล์มีข้อความที่ชัดเจนและอ่านได้');
          setResult({
            success: false,
            message: 'ไม่สามารถอ่านข้อความจากพอร์ตได้',
            stats: {
              filesProcessed: checkData.portfolios.length,
              itemsExtracted: 0,
              duplicatesRemoved: 0,
              itemsCreated: 0,
              breakdown: {
                education: 0,
                achievements: 0,
                skills: 0,
                interests: 0,
                extracurricular: 0,
                careerGoals: 0,
              },
            },
          });
          setShowResult(true);
          return;
        }

        // Now send OCR text to AI for extraction
        setCurrentStep('กำลังวิเคราะห์ข้อมูลด้วย AI...');
        const extractResponse = await fetch('/api/profile/ai-extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ portfolios: portfoliosWithOCR }),
        });

        const data = await extractResponse.json();

        if (!extractResponse.ok) {
          showToast.error(data.error || 'ไม่สามารถแยกข้อมูลได้');
          return;
        }

        setResult(data);
        setShowResult(true);

        if (data.stats?.itemsCreated > 0) {
          showToast.success(`แยกข้อมูลสำเร็จ ${data.stats.itemsCreated} รายการ!`);
          // Trigger refresh of profile data
          if (onComplete) {
            setTimeout(() => {
              onComplete();
            }, 1000);
          }
        } else {
          showToast.info('ไม่พบข้อมูลที่สามารถแยกได้จากพอร์ตของคุณ');
        }
        return;
      }

      // If we reach here, it means the API returned data directly (not needsOCR)
      if (!checkResponse.ok) {
        showToast.error(checkData.error || 'ไม่สามารถแยกข้อมูลได้');
        return;
      }

      if (checkData.error) {
        showToast.error(checkData.error);
        return;
      }

      setResult(checkData);
      setShowResult(true);

      if (checkData.stats?.itemsCreated > 0) {
        showToast.success(`แยกข้อมูลสำเร็จ ${checkData.stats.itemsCreated} รายการ!`);
        // Trigger refresh of profile data
        if (onComplete) {
          setTimeout(() => {
            onComplete();
          }, 1000);
        }
      } else {
        showToast.info('ไม่พบข้อมูลที่สามารถแยกได้จากพอร์ตของคุณ');
      }
    } catch (error) {
      console.error('Error extracting data:', error);
      showToast.error('เกิดข้อผิดพลาดในการแยกข้อมูล');
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Extract Button */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">
              แยกข้อมูลจากพอร์ตด้วย AI
            </h3>
            <p className="text-sm text-gray-600 mb-3">
              ให้ AI ช่วยแยกข้อมูลการศึกษา ผลงาน ทักษะ และความสนใจจากพอร์ตที่คุณอัปโหลดไว้แล้ว
            </p>
            <button
              onClick={handleExtract}
              disabled={extracting}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {extracting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังแยกข้อมูล...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>เริ่มแยกข้อมูล</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Extraction Progress */}
      {extracting && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
            <span className="text-sm font-medium text-gray-700">
              {currentStep || 'กำลังวิเคราะห์พอร์ตของคุณ...'}
            </span>
          </div>

          {/* OCR Progress Bar */}
          {ocrProgress.total > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>ไฟล์ {ocrProgress.current} / {ocrProgress.total}</span>
                <span>{Math.round((ocrProgress.current / ocrProgress.total) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(ocrProgress.current / ocrProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="space-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <FileSearch className="w-3 h-3 text-purple-600" />
              <span>อ่านข้อความจากไฟล์ (PDF/รูปภาพ)</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-purple-600" />
              <span>วิเคราะห์เนื้อหาด้วย AI</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3 h-3 text-purple-600" />
              <span>สร้างข้อมูลโปรไฟล์</span>
            </div>
          </div>
        </div>
      )}

      {/* Extraction Results */}
      {showResult && result && (
        <div
          className={`border rounded-lg p-4 ${
            result.stats?.itemsCreated
              ? 'bg-green-50 border-green-200'
              : 'bg-yellow-50 border-yellow-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {result.stats?.itemsCreated ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4
                className={`font-semibold mb-2 ${
                  result.stats?.itemsCreated ? 'text-green-800' : 'text-yellow-800'
                }`}
              >
                {result.message}
              </h4>

              {result.stats && result.stats.itemsCreated > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">ไฟล์ที่ประมวลผล:</span>{' '}
                    {result.stats.filesProcessed} ไฟล์
                  </div>

                  {/* Duplicate Stats */}
                  {result.stats.duplicatesRemoved > 0 && (
                    <div className="text-sm bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                      <span className="text-blue-700 inline-flex items-center gap-1">
                        <FileSearch className="w-4 h-4" />
                        ตรวจพบข้อมูลซ้ำ <span className="font-semibold">{result.stats.duplicatesRemoved}</span> รายการและลบออกแล้ว
                      </span>
                    </div>
                  )}

                  {/* Breakdown */}
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    {result.stats.breakdown.education > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>การศึกษา: {result.stats.breakdown.education}</span>
                      </div>
                    )}
                    {result.stats.breakdown.achievements > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>ผลงาน: {result.stats.breakdown.achievements}</span>
                      </div>
                    )}
                    {result.stats.breakdown.skills > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span>ทักษะ: {result.stats.breakdown.skills}</span>
                      </div>
                    )}
                    {result.stats.breakdown.interests > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                        <span>ความสนใจ: {result.stats.breakdown.interests}</span>
                      </div>
                    )}
                    {result.stats.breakdown.extracurricular > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>กิจกรรม: {result.stats.breakdown.extracurricular}</span>
                      </div>
                    )}
                    {result.stats.breakdown.careerGoals > 0 && (
                      <div className="flex items-center gap-2 text-xs text-gray-600">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                        <span>เป้าหมาย: {result.stats.breakdown.careerGoals}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-green-200">
                    <p className="text-xs text-green-700 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      ข้อมูลที่แยกโดย AI จะมีป้ายกำกับ "AI" และคุณสามารถแก้ไขหรือลบได้
                    </p>
                  </div>
                </div>
              )}

              {result.stats && result.stats.itemsCreated === 0 && (
                <div className="text-sm text-yellow-700">
                  <p>
                    พอร์ตของคุณอาจไม่มีข้อมูลที่ AI สามารถอ่านได้ หรือไฟล์อาจอยู่ในรูปแบบที่ยังไม่รองรับ
                  </p>
                  <p className="mt-2">
                    ลองเพิ่มข้อมูลด้วยตนเองหรืออัปโหลดพอร์ตในรูปแบบรูปภาพ (PNG, JPG) ที่มีข้อความชัดเจน
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-700 mb-2">
          <strong>วิธีใช้:</strong> คลิกปุ่ม "เริ่มแยกข้อมูล" ระบบจะอ่านข้อความจากพอร์ตของคุณ (รองรับทั้ง PDF และรูปภาพ)
          และวิเคราะห์ด้วย AI เพื่อสร้างข้อมูลโปรไฟล์อัตโนมัติ (ใช้เวลาประมาณ 30-60 วินาทีต่อไฟล์)
        </p>
        <p className="text-xs text-blue-600">
          <strong>เคล็ดลับ:</strong> ระบบจะประมวลผลพอร์ตที่คุณอัปโหลดไว้แล้ว (สูงสุด 5 ไฟล์ล่าสุด)
          ไฟล์ PDF จะถูกแยกข้อความโดยตรง ส่วนรูปภาพจะใช้ OCR ข้อมูลที่ AI แยกจะมีป้ายกำกับ "AI"
        </p>
      </div>
    </div>
  );
}
