// PDF service – loads pdfjs-dist v5 from /public at runtime,
// completely bypassing the bundler (Turbopack / Webpack) so the
// web-worker URL resolves correctly in every environment.

export interface PDFTextResult {
  text: string;
  success: boolean;
  error?: string;
  pageCount?: number;
}

export class PDFService {
  private pdfLib: any = null;

  private reconstructPageText(items: any[]): string {
    const tokens = items
      .map((item: any) => {
        if (!item || typeof item.str !== "string") return null;

        const text = item.str.trim();
        if (!text) return null;

        const transform = Array.isArray(item.transform) ? item.transform : [0, 0, 0, 0, 0, 0];
        const x = Number(transform[4] || 0);
        const y = Number(transform[5] || 0);
        const width = Number(item.width || 0);

        return { text, x, y, width };
      })
      .filter(Boolean) as Array<{ text: string; x: number; y: number; width: number }>;

    if (tokens.length === 0) {
      return "";
    }

    // Sort top-to-bottom, then left-to-right
    tokens.sort((a, b) => {
      if (Math.abs(b.y - a.y) > 2.5) return b.y - a.y;
      return a.x - b.x;
    });

    // Group into lines by y proximity
    const lines: Array<Array<{ text: string; x: number; y: number; width: number }>> = [];
    for (const token of tokens) {
      const lastLine = lines[lines.length - 1];
      if (!lastLine) {
        lines.push([token]);
        continue;
      }

      const avgY =
        lastLine.reduce((sum, segment) => sum + segment.y, 0) / Math.max(1, lastLine.length);

      if (Math.abs(token.y - avgY) <= 3.2) {
        lastLine.push(token);
      } else {
        lines.push([token]);
      }
    }

    return lines
      .map((line) => {
        line.sort((a, b) => a.x - b.x);

        let assembled = "";
        let prevEndX: number | null = null;
        for (const segment of line) {
          if (!assembled) {
            assembled = segment.text;
            prevEndX = segment.x + segment.width;
            continue;
          }

          const gap = prevEndX !== null ? segment.x - prevEndX : 2;
          const thaiNoSpaceJoin =
            /[ก-๙]$/.test(assembled) && /^[ก-๙]/.test(segment.text);
          if (gap > 1.5 && !thaiNoSpaceJoin) {
            assembled += " ";
          }
          assembled += segment.text;
          prevEndX = segment.x + segment.width;
        }

        return assembled.trim();
      })
      .filter((line) => line.length > 0)
      .join("\n");
  }

  async initializePDFLib(): Promise<boolean> {
    if (this.pdfLib) return true;
    if (typeof window === "undefined") return false;

    // Already initialised by a previous call / another instance
    if ((window as any).pdfjsLib) {
      this.pdfLib = (window as any).pdfjsLib;
      return true;
    }

    try {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.type = "module";
        script.src = "/pdf-init.mjs"; // sets window.pdfjsLib + workerSrc
        script.onload = () => {
          // The module script runs asynchronously; poll briefly for the global.
          const check = (attempts = 0) => {
            if ((window as any).pdfjsLib) {
              resolve();
            } else if (attempts < 50) {
              setTimeout(() => check(attempts + 1), 50);
            } else {
              reject(new Error("pdfjsLib did not appear on window"));
            }
          };
          check();
        };
        script.onerror = () => reject(new Error("Failed to load /pdf-init.mjs"));
        document.head.appendChild(script);
      });

      this.pdfLib = (window as any).pdfjsLib;
      return true;
    } catch (err) {
      console.error("PDF.js init failed:", err);
      return false;
    }
  }

  async extractTextFromPDF(
    file: File,
    onProgress?: (progress: number, status: string) => void
  ): Promise<PDFTextResult> {
    const initialized = await this.initializePDFLib();

    if (!initialized) {
      return {
        text: "",
        success: false,
        error: "Failed to initialize PDF.js library",
      };
    }

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          onProgress?.(10, "กำลังโหลด PDF...");

          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);

          const loadingTask = this.pdfLib.getDocument({
            data: uint8Array,
            verbosity: 0,
          });

          const pdf = await loadingTask.promise;
          const pageCount = pdf.numPages;

          onProgress?.(20, `พบ ${pageCount} หน้า กำลังอ่าน...`);

          let fullText = "";

          for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
            try {
              onProgress?.(
                20 + (pageNum / pageCount) * 70,
                `อ่านหน้า ${pageNum}/${pageCount}...`
              );

              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();

              if (textContent.items && textContent.items.length > 0) {
                const pageText = this.reconstructPageText(textContent.items);

                if (pageText.trim()) {
                  fullText += pageText + "\n\n";
                }
              }

              page.cleanup();
            } catch (pageError) {
              console.warn(`Error reading page ${pageNum}:`, pageError);
            }
          }

          pdf.destroy();
          onProgress?.(100, "อ่าน PDF เสร็จสิ้น");

          resolve({
            text: fullText.trim(),
            success: true,
            pageCount,
          });
        } catch (error) {
          console.error("PDF text extraction error:", error);
          resolve({
            text: "",
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      };

      reader.onerror = () => {
        resolve({
          text: "",
          success: false,
          error: "Failed to read PDF file",
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  async convertPDFPagesToImages(
    file: File,
    maxPages: number = 3
  ): Promise<string[]> {
    const initialized = await this.initializePDFLib();

    if (!initialized) {
      throw new Error("Failed to initialize PDF.js library");
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async () => {
        try {
          const arrayBuffer = reader.result as ArrayBuffer;
          const uint8Array = new Uint8Array(arrayBuffer);

          const pdf = await this.pdfLib.getDocument({ data: uint8Array })
            .promise;
          const pageCount = Math.min(pdf.numPages, maxPages);
          const imageDataUrls: string[] = [];

          for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.5 });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d")!;
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport }).promise;

            const imageDataUrl = canvas.toDataURL("image/png");
            imageDataUrls.push(imageDataUrl);

            page.cleanup();
          }

          pdf.destroy();
          resolve(imageDataUrls);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read PDF file"));
      reader.readAsArrayBuffer(file);
    });
  }
}

// Singleton instance
export const pdfService = new PDFService();
