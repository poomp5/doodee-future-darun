import { createWorker } from 'tesseract.js';
import { pdfService } from './pdf-service';

export interface OCRResult {
  text: string;
  confidence: number;
  processingTime: number;
  method: 'tesseract' | 'pdf-extraction';
  error?: string;
}

export interface OCRProgress {
  progress: number;
  status: string;
}

type OCRCandidate = {
  text: string;
  confidence: number;
  method: 'tesseract' | 'pdf-extraction';
  source: string;
};

type ImagePreprocessMode = 'balanced' | 'high-contrast' | 'threshold';

export class EnhancedOCR {
  private worker: any = null;

  async initializeWorker(
    onProgress?: (progress: OCRProgress) => void
  ): Promise<void> {
    if (this.worker) return;

    try {
      this.worker = await createWorker('tha+eng', 1, {
        logger: (m: any) => {
          if (onProgress && m.status && m.progress !== undefined) {
            onProgress({
              progress: m.progress * 100,
              status: this.translateStatus(m.status),
            });
          }
        },
      });

      // Base configuration optimized for Thai/English portfolio documents
      await this.worker.setParameters({
        tessedit_pageseg_mode: '6', // Block of text
        tessedit_ocr_engine_mode: '1', // LSTM only
        preserve_interword_spaces: '1',
        user_defined_dpi: '300',
        tessedit_do_invert: '0',
        classify_enable_learning: '0',
        textord_heavy_nr: '1',
      });
    } catch (error) {
      console.error('Failed to initialize OCR worker:', error);
      throw new Error('OCR initialization failed');
    }
  }

  async terminateWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  private translateStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      'initializing api': 'กำลังเตรียมระบบ OCR...',
      'initialized api': 'ระบบ OCR พร้อม',
      'loading language traineddata': 'กำลังโหลดภาษา...',
      'loaded language traineddata': 'โหลดภาษาเสร็จ',
      'initializing tesseract': 'กำลังเริ่ม Tesseract...',
      'initialized tesseract': 'Tesseract พร้อม',
      'recognizing text': 'กำลังอ่านข้อความ...',
    };
    return statusMap[status] || status;
  }

  async extractFromPDF(
    file: File,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      onProgress?.({ progress: 5, status: 'เริ่มประมวลผล PDF...' });

      // Pass 1: Native PDF text extraction
      let nativePdfText = '';
      let nativePdfConfidence = 0;
      let nativePdfQuality = 0;
      try {
        const pdfResult = await pdfService.extractTextFromPDF(
          file,
          (progress, status) => {
            onProgress?.({ progress, status });
          }
        );

        if (pdfResult.success && pdfResult.text) {
          nativePdfText = this.cleanExtractedText(pdfResult.text);
          nativePdfConfidence = 95;
          nativePdfQuality = this.hasMeaningfulText(nativePdfText)
            ? this.calculateTextQualityScore(nativePdfText, nativePdfConfidence)
            : 0;

          // Very strong native extraction -> skip OCR to save time.
          const canTrustNativeOnly =
            this.hasMeaningfulText(nativePdfText) &&
            nativePdfText.length >= 1200 &&
            nativePdfQuality >= 0.78;
          if (canTrustNativeOnly) {
            onProgress?.({ progress: 100, status: 'ดึงข้อความจาก PDF สำเร็จ' });
            return {
              text: nativePdfText,
              confidence: nativePdfConfidence,
              processingTime: Date.now() - startTime,
              method: 'pdf-extraction',
            };
          }
        }
      } catch (pdfError) {
        console.warn('PDF.js extraction failed, falling back to OCR:', pdfError);
      }

      // Pass 2: OCR from rendered PDF pages (multi-pass variants)
      onProgress?.({ progress: 20, status: 'ใช้ OCR สำหรับ PDF...' });

      let ocrPdfText = '';
      let ocrPdfConfidence = 0;
      try {
        const imageResult = await this.convertPDFToImageAndOCR(file, onProgress);
        ocrPdfText = this.cleanExtractedText(imageResult.text);
        ocrPdfConfidence = imageResult.confidence;
      } catch (ocrError) {
        console.warn('PDF to image OCR failed:', ocrError);
      }

      // Merge results from both passes to maximize completeness
      const mergedText = this.cleanExtractedText(
        this.mergeTexts(nativePdfText, ocrPdfText)
      );

      let finalText = mergedText;
      let finalConfidence =
        nativePdfText && ocrPdfText
          ? Math.round((nativePdfConfidence * 0.55 + ocrPdfConfidence * 0.45) * 10) / 10
          : nativePdfText
          ? nativePdfConfidence
          : ocrPdfConfidence;
      let finalMethod: OCRResult['method'] = nativePdfText ? 'pdf-extraction' : 'tesseract';

      const mergedQuality = this.hasMeaningfulText(mergedText)
        ? this.calculateTextQualityScore(mergedText, finalConfidence)
        : 0;
      const ocrQuality = this.hasMeaningfulText(ocrPdfText)
        ? this.calculateTextQualityScore(ocrPdfText, ocrPdfConfidence)
        : 0;

      // If native extraction is likely noisy/corrupt, trust OCR more.
      if (nativePdfQuality <= 0.3 && ocrQuality >= 0.52) {
        finalText = ocrPdfText;
        finalConfidence = ocrPdfConfidence;
        finalMethod = 'tesseract';
      } else if (ocrQuality > mergedQuality + 0.08) {
        finalText = ocrPdfText;
        finalConfidence = ocrPdfConfidence;
        finalMethod = 'tesseract';
      } else if (nativePdfQuality > mergedQuality + 0.08) {
        finalText = nativePdfText;
        finalConfidence = nativePdfConfidence;
        finalMethod = 'pdf-extraction';
      }

      if (this.hasMeaningfulText(finalText)) {
        onProgress?.({ progress: 100, status: 'ดึงข้อความจาก PDF สำเร็จ' });
        return {
          text: finalText,
          confidence: finalConfidence,
          processingTime: Date.now() - startTime,
          method: finalMethod,
        };
      }

      // Last fallback: direct OCR path
      onProgress?.({ progress: 50, status: 'ลอง OCR โดยตรง...' });
      const directOCRResult = await this.extractFromImage(file, onProgress);
      return {
        ...directOCRResult,
        text: this.cleanExtractedText(directOCRResult.text),
        processingTime: Date.now() - startTime,
        error: directOCRResult.error
          ? `PDF processing failed, tried direct OCR: ${directOCRResult.error}`
          : undefined,
      };
    } catch (error) {
      console.error('All PDF extraction methods failed:', error);
      return {
        text: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        method: 'pdf-extraction',
        error: `Failed to extract PDF text: ${
          error instanceof Error ? error.message : 'All methods failed'
        }`,
      };
    }
  }

  private async convertPDFToImageAndOCR(
    file: File,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      const imageDataUrls = await pdfService.convertPDFPagesToImages(file, 5);

      if (imageDataUrls.length === 0) {
        throw new Error('Could not convert PDF pages to images');
      }

      let allText = '';
      let weightedConfidence = 0;
      let pageCount = 0;

      await this.initializeWorker(onProgress);

      for (let i = 0; i < imageDataUrls.length; i++) {
        onProgress?.({
          progress: 10 + ((i + 1) / imageDataUrls.length) * 80,
          status: `OCR หน้า ${i + 1}/${imageDataUrls.length}...`,
        });

        const bestCandidate = await this.extractBestCandidateFromImageDataUrl(
          imageDataUrls[i],
          onProgress,
          `PDF หน้า ${i + 1}`
        );

        if (bestCandidate && this.hasMeaningfulText(bestCandidate.text)) {
          allText += bestCandidate.text + '\n\n';
          weightedConfidence += bestCandidate.confidence;
          pageCount++;
        }
      }

      return {
        text: this.cleanExtractedText(allText),
        confidence: pageCount > 0 ? weightedConfidence / pageCount : 0,
        processingTime: Date.now() - startTime,
        method: 'tesseract',
      };
    } catch (error) {
      console.error('PDF to image OCR error:', error);
      return {
        text: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        method: 'tesseract',
        error: 'Failed to OCR PDF images',
      };
    }
  }

  async extractFromImage(
    file: File,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    const startTime = Date.now();

    try {
      await this.initializeWorker(onProgress);
      const variants = await this.generateImageVariants(file);
      const bestCandidate = await this.extractBestCandidateFromVariants(
        variants,
        onProgress,
        'รูปภาพ'
      );

      if (!bestCandidate) {
        return {
          text: '',
          confidence: 0,
          processingTime: Date.now() - startTime,
          method: 'tesseract',
          error: 'No OCR candidates generated',
        };
      }

      return {
        text: this.cleanExtractedText(bestCandidate.text),
        confidence: bestCandidate.confidence,
        processingTime: Date.now() - startTime,
        method: 'tesseract',
      };
    } catch (error) {
      console.error('Image OCR error:', error);
      return {
        text: '',
        confidence: 0,
        processingTime: Date.now() - startTime,
        method: 'tesseract',
        error: 'Failed to extract image text',
      };
    }
  }

  private async extractBestCandidateFromImageDataUrl(
    imageDataUrl: string,
    onProgress?: (progress: OCRProgress) => void,
    label: string = 'เอกสาร'
  ): Promise<OCRCandidate | null> {
    const variants = await this.generateVariantsFromDataUrl(imageDataUrl);
    return this.extractBestCandidateFromVariants(variants, onProgress, label);
  }

  private async extractBestCandidateFromVariants(
    variants: Array<{ label: string; image: string }>,
    onProgress?: (progress: OCRProgress) => void,
    label: string = 'เอกสาร'
  ): Promise<OCRCandidate | null> {
    if (!this.worker) {
      await this.initializeWorker(onProgress);
    }

    const candidates: OCRCandidate[] = [];
    const psmModes = [6, 11];
    let step = 0;
    const totalSteps = variants.length * psmModes.length;

    for (const variant of variants) {
      for (const psm of psmModes) {
        step += 1;
        onProgress?.({
          progress: Math.min(95, 50 + (step / totalSteps) * 40),
          status: `กำลัง OCR (${label} - ${variant.label}, โหมด ${psm})...`,
        });

        try {
          await this.worker.setParameters({
            tessedit_pageseg_mode: String(psm),
          });
          const { data } = await this.worker.recognize(variant.image);
          const cleaned = this.cleanExtractedText(data?.text || '');
          if (!cleaned) {
            continue;
          }

          candidates.push({
            text: cleaned,
            confidence: Number(data?.confidence) || 0,
            method: 'tesseract',
            source: `${variant.label}-psm${psm}`,
          });
        } catch (error) {
          console.warn(`OCR candidate failed (${variant.label}, psm ${psm}):`, error);
        }
      }
    }

    if (candidates.length === 0) {
      return null;
    }

    return candidates.sort((a, b) => {
      const qualityA = this.calculateTextQualityScore(a.text, a.confidence);
      const qualityB = this.calculateTextQualityScore(b.text, b.confidence);
      return qualityB - qualityA;
    })[0];
  }

  private async generateImageVariants(file: File): Promise<Array<{ label: string; image: string }>> {
    const balanced = await this.preprocessImage(file, 'balanced');
    const highContrast = await this.preprocessImage(file, 'high-contrast');
    const threshold = await this.preprocessImage(file, 'threshold');

    return [
      { label: 'balanced', image: balanced },
      { label: 'high-contrast', image: highContrast },
      { label: 'threshold', image: threshold },
    ].filter((item) => !!item.image);
  }

  private async generateVariantsFromDataUrl(dataUrl: string): Promise<Array<{ label: string; image: string }>> {
    const balanced = await this.preprocessDataUrl(dataUrl, 'balanced');
    const highContrast = await this.preprocessDataUrl(dataUrl, 'high-contrast');
    const threshold = await this.preprocessDataUrl(dataUrl, 'threshold');

    return [
      { label: 'balanced', image: balanced },
      { label: 'high-contrast', image: highContrast },
      { label: 'threshold', image: threshold },
    ].filter((item) => !!item.image);
  }

  private async preprocessImage(file: File, mode: ImagePreprocessMode): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        if (!dataUrl) {
          resolve('');
          return;
        }
        const processed = await this.preprocessDataUrl(dataUrl, mode);
        resolve(processed);
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  }

  private async preprocessDataUrl(dataUrl: string, mode: ImagePreprocessMode): Promise<string> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const longestSide = Math.max(img.width, img.height);
        const scale = longestSide < 1800 ? (1800 / Math.max(1, longestSide)) : 1;

        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        let totalGray = 0;
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          totalGray += gray;
        }
        const avgGray = totalGray / Math.max(1, data.length / 4);
        const thresholdBase = Math.max(95, Math.min(175, avgGray));

        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          let output = gray;

          if (mode === 'high-contrast') {
            output = gray < thresholdBase ? Math.max(0, gray * 0.55) : Math.min(255, gray * 1.2);
          } else if (mode === 'threshold') {
            output = gray < thresholdBase ? 0 : 255;
          } else {
            output = gray < thresholdBase ? Math.max(0, gray - 28) : Math.min(255, gray + 18);
          }

          data[i] = output;
          data[i + 1] = output;
          data[i + 2] = output;
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  private cleanExtractedText(rawText: string): string {
    if (!rawText) {
      return '';
    }

    let text = rawText
      .replace(/\r/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[^\S\n]{2,}/g, ' ')
      .trim();

    for (let i = 0; i < 4; i++) {
      text = text.replace(/([ก-๙])\s(?=[ก-๙])/g, '$1');
    }

    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const dedupedLines: string[] = [];
    const seen = new Set<string>();

    for (const line of lines) {
      const key = line
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9ก-๙]/g, '')
        .slice(0, 120);

      if (key.length > 10 && seen.has(key)) {
        continue;
      }
      if (key.length > 10) {
        seen.add(key);
      }
      dedupedLines.push(line);
    }

    return dedupedLines.join('\n').trim();
  }

  private calculateTextQualityScore(text: string, confidence: number): number {
    const normalized = (text || '').trim();
    if (!normalized) {
      return 0;
    }

    const compact = normalized.replace(/\s+/g, ' ');
    const lengthScore = Math.min(1, compact.length / 1400);
    const thaiChars = (compact.match(/[ก-๙]/g) || []).length;
    const engChars = (compact.match(/[A-Za-z]/g) || []).length;
    const numberChars = (compact.match(/[0-9]/g) || []).length;
    const validChars = thaiChars + engChars + numberChars;
    const charDensity = validChars / Math.max(1, compact.length);
    const lineCount = normalized.split('\n').filter((line) => line.trim().length > 0).length;
    const structureScore = Math.min(1, lineCount / 20);
    const confidenceScore = Math.max(0, Math.min(1, confidence / 100));

    return (
      confidenceScore * 0.45 +
      lengthScore * 0.3 +
      charDensity * 0.15 +
      structureScore * 0.1
    );
  }

  private hasMeaningfulText(text: string): boolean {
    const compact = this.cleanExtractedText(text).replace(/\s+/g, ' ').trim();
    return compact.length >= 40;
  }

  private mergeTexts(primary: string, secondary: string): string {
    if (!primary && !secondary) {
      return '';
    }
    if (!primary) {
      return secondary;
    }
    if (!secondary) {
      return primary;
    }

    const allLines = [...primary.split('\n'), ...secondary.split('\n')]
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const merged: string[] = [];
    const seen = new Set<string>();

    for (const line of allLines) {
      const key = line
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[^a-z0-9ก-๙]/g, '')
        .slice(0, 120);

      if (key.length > 10 && seen.has(key)) {
        continue;
      }
      if (key.length > 10) {
        seen.add(key);
      }
      merged.push(line);
    }

    return merged.join('\n');
  }

  async extractText(
    file: File,
    onProgress?: (progress: OCRProgress) => void
  ): Promise<OCRResult> {
    const fileType = file.type.toLowerCase();

    if (fileType === 'application/pdf') {
      return await this.extractFromPDF(file, onProgress);
    } else if (fileType.startsWith('image/')) {
      return await this.extractFromImage(file, onProgress);
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
  }
}

// Singleton instance
export const enhancedOCR = new EnhancedOCR();
