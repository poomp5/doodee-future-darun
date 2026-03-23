import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { uploadToR2 } from "@/lib/r2-upload";
import { auth } from "@/auth";

export const runtime = "nodejs";
export const maxDuration = 60;

const isR2Configured =
  !!process.env.R2_ENDPOINT &&
  !!process.env.R2_ACCESS_KEY_ID &&
  !!process.env.R2_SECRET_ACCESS_KEY &&
  !!process.env.R2_BUCKET_NAME &&
  !!process.env.R2_PUBLIC_URL;

const withTrailingSlash = (p: string) => `${p}${path.sep}`;

const BLANK_SAMPLE_GRID = 12;

function isCanvasLikelyBlank(
  ctx: any,
  width: number,
  height: number,
) {
  const gridX = BLANK_SAMPLE_GRID;
  const gridY = BLANK_SAMPLE_GRID;
  for (let gx = 1; gx <= gridX; gx++) {
    const x = Math.min(width - 1, Math.floor((gx / (gridX + 1)) * width));
    for (let gy = 1; gy <= gridY; gy++) {
      const y = Math.min(height - 1, Math.floor((gy / (gridY + 1)) * height));
      const data = ctx.getImageData(x, y, 1, 1).data;
      if (!(data[0] === 255 && data[1] === 255 && data[2] === 255 && data[3] === 255)) {
        return false;
      }
    }
  }
  return true;
}

async function renderPageToCanvas(page: any, targetWidth: number, maxScale: number) {
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(maxScale, targetWidth / baseViewport.width);
  const viewport = page.getViewport({ scale });

  const width = Math.floor(viewport.width);
  const height = Math.floor(viewport.height);

  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);

  const canvasFactory = {
    create: (w: number, h: number) => {
      const c = createCanvas(w, h);
      return { canvas: c, context: c.getContext("2d") };
    },
    reset: (canvasAndContext: any, w: number, h: number) => {
      canvasAndContext.canvas.width = w;
      canvasAndContext.canvas.height = h;
    },
    destroy: (canvasAndContext: any) => {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
    },
  };

  await page
    .render({
      canvasContext: context as any,
      viewport,
      canvasFactory,
    })
    .promise;

  const blank = isCanvasLikelyBlank(context, width, height);

  return { canvas, context, width, height, blank };
}

function resolvePdfjsDistBasePath() {
  // Prefer Node resolution so standalone output works in production
  try {
    const createRequire = (process as any).getBuiltinModule?.("module")?.createRequire;
    if (createRequire) {
      const req = createRequire(process.cwd());
      const pkgPath = req.resolve("pdfjs-dist/package.json");
      return path.dirname(pkgPath);
    }
  } catch {}
  // Fallback to classic node_modules path
  return path.join(process.cwd(), "node_modules", "pdfjs-dist");
}

// Patch clip() to ignore Path2D type mismatches; avoids InvalidArg crashes from @napi-rs/canvas.
function ensureClipCompat() {
  const createRequire = (process as any).getBuiltinModule?.("module")?.createRequire;
  if (!createRequire) return;
  const req = createRequire(process.cwd());
  const modules: any[] = [];
  try { modules.push(req("@napi-rs/canvas")); } catch {}
  try { modules.push(req("pdfjs-dist/node_modules/@napi-rs/canvas")); } catch {}
  try { modules.push(req("pdf-parse/node_modules/pdfjs-dist/node_modules/@napi-rs/canvas")); } catch {}

  for (const mod of modules) {
    try {
      const canvas = mod.createCanvas(1, 1);
      const context = canvas.getContext("2d");
      const proto = Object.getPrototypeOf(context);
      if (proto.__clipCompatPatched) continue;
      proto.__clipCompatPatched = true;
      const origClip = proto.clip;
      proto.clip = function patchClip(pathArg?: any, fillRule?: string) {
        // @napi-rs/canvas doesn't support Path2D objects or fillRule parameter.
        // If args are provided (Path2D/fillRule), skip clipping to avoid blank renders.
        if (pathArg || fillRule) return;
        try {
          return origClip.call(this);
        } catch {
          return;
        }
      };
      
      // Also patch any future contexts by patching the module's createCanvas
      const origCreateCanvas = mod.createCanvas;
      mod.createCanvas = function patchedCreateCanvas(...args: any[]) {
        const canvas = origCreateCanvas.apply(this, args);
        const ctx = canvas.getContext("2d");
        if (ctx && !Object.getPrototypeOf(ctx).__clipCompatPatched) {
          Object.getPrototypeOf(ctx).__clipCompatPatched = true;
          const origCtxClip = Object.getPrototypeOf(ctx).clip;
          Object.getPrototypeOf(ctx).clip = function patchClip(pathArg?: any, fillRule?: string) {
            if (pathArg || fillRule) return;
            try {
              return origCtxClip.call(this);
            } catch {
              return;
            }
          };
        }
        return canvas;
      };
    } catch {}
  }
}

// Accepts JSON body: { pdfUrl, pdfKey, watermark }
// Client uploads PDF to R2 via presigned URL first, then calls this endpoint.
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { pdfUrl, pdfKey, watermark = "1" } = body;

    if (!pdfUrl) {
      return NextResponse.json({ error: "pdfUrl is required" }, { status: 400 });
    }

    // Fetch PDF from R2
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: "ไม่สามารถดาวน์โหลดไฟล์ PDF ได้" }, { status: 400 });
    }
    // Log headers for debugging (content-length, content-type, cache)
    const contentLength = pdfResponse.headers.get("content-length");
    const contentType = pdfResponse.headers.get("content-type");
    const cacheControl = pdfResponse.headers.get("cache-control");
    console.log("Community prepare: PDF headers", {
      contentLength,
      contentType,
      cacheControl,
      status: pdfResponse.status,
    });

    const arrayBuffer = await pdfResponse.arrayBuffer();
    const pdfBytes = new Uint8Array(arrayBuffer);

    // Basic sanity check: PDF should start with "%PDF-"
    const signature = String.fromCharCode(...pdfBytes.slice(0, 5));
    console.log("Community prepare: PDF signature", {
      signature,
      sizeBytes: pdfBytes.length,
    });
    if (signature !== "%PDF-") {
      return NextResponse.json(
        { error: "ไฟล์ไม่ใช่ PDF หรือไฟล์เสียหาย", signature, size: pdfBytes.length },
        { status: 400 }
      );
    }

    // Apply canvas compatibility patch before loading PDF.js
    ensureClipCompat();

    const g = globalThis as any;

    // Patch structuredClone BEFORE loading pdfjs to prevent DataCloneError in LoopbackPort.
    if (!g.__structuredClonePatched) {
      g.__structuredClonePatched = true;
      const origStructuredClone = globalThis.structuredClone;
      (globalThis as any).structuredClone = function patchedStructuredClone(val: any, options?: any) {
        if (options?.transfer) {
          try {
            return origStructuredClone(val, options);
          } catch {
            return origStructuredClone(val);
          }
        }
        return origStructuredClone(val, options);
      };
    }

    // Load worker module into globalThis.pdfjsWorker BEFORE importing pdf.mjs.
    // pdfjs checks globalThis.pdfjsWorker?.WorkerMessageHandler in #mainThreadWorkerMessageHandler
    // and skips import(workerSrc) entirely if it's present - avoiding Turbopack bundle path issues.
    if (!g.pdfjsWorker) {
      g.pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
    }

    const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as any;

    const pdfjsDistBasePath = resolvePdfjsDistBasePath();
    // Debug: verify pdfjs assets exist in production (cmaps, standard_fonts, wasm, iccs)
    try {
      const assetDirs = ["cmaps", "standard_fonts", "wasm", "iccs"].map((d) =>
        path.join(pdfjsDistBasePath, d)
      );
      const assetChecks = assetDirs.map((dir) => ({
        dir,
        exists: fs.existsSync(dir),
        sample: fs.existsSync(dir)
          ? fs.readdirSync(dir).slice(0, 3)
          : [],
      }));
      console.log("Community prepare: pdfjs assets check", {
        base: pdfjsDistBasePath,
        checks: assetChecks,
      });
    } catch (e) {
      console.log("Community prepare: pdfjs assets check failed", e);
    }
    const baseOptions = {
      data: pdfBytes,
      disableFontFace: true,
      isEvalSupported: false,
      cMapUrl: withTrailingSlash(path.join(pdfjsDistBasePath, "cmaps")),
      cMapPacked: true,
      iccUrl: withTrailingSlash(path.join(pdfjsDistBasePath, "iccs")),
      standardFontDataUrl: withTrailingSlash(path.join(pdfjsDistBasePath, "standard_fonts")),
      wasmUrl: withTrailingSlash(path.join(pdfjsDistBasePath, "wasm")),
      useWorkerFetch: false,
      disableWorker: true,
    };

    const primaryOptions = {
      ...baseOptions,
      useWasm: true,
      useSystemFonts: true,
    };

    const fallbackOptions = {
      ...baseOptions,
      useWasm: false,
      useSystemFonts: false,
    };

    let pdfDoc = await pdfjsLib.getDocument(primaryOptions).promise;
    if (!pdfDoc || pdfDoc.numPages === 0) {
      return NextResponse.json({ error: "PDF has no pages" }, { status: 400 });
    }

    // Load watermark asset
    const watermarkPath = path.join(process.cwd(), "public", "watermark", `${watermark}.png`);
    const watermarkImage = await loadImage(watermarkPath);

    const maxPages = 50;
    let uploadedPages: Array<{ pageNumber: number; imageUrl: string; key?: string; aspectRatio: number }> = [];
    let attempt = 0;

    while (true) {
      uploadedPages = [];
      const totalPages = Math.min(pdfDoc.numPages, maxPages);
      let retryWithFallback = false;

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        const page = await pdfDoc.getPage(pageNumber);
        const { canvas, context, width, height, blank } = await renderPageToCanvas(
          page,
          1200,
          2.2,
        );

        if (pageNumber === 1 && blank && attempt === 0) {
          console.warn("Community prepare: first page blank, retrying with fallback pdfjs options");
          retryWithFallback = true;
          break;
        }

        // Overlay watermark covering entire page (PNG already has configured opacity)
        context.drawImage(watermarkImage, 0, 0, width, height);

        const pngBuffer = canvas.toBuffer("image/png");
        const aspectRatio = Math.round((width / height) * 1000) / 1000;

        if (!isR2Configured) {
          uploadedPages.push({
            pageNumber,
            imageUrl: `data:image/png;base64,${pngBuffer.toString("base64")}`,
            key: undefined,
            aspectRatio,
          });
        } else {
          try {
            const uploadResult = await uploadToR2(
              pngBuffer,
              `community-page-${pageNumber}.png`,
              "image/png"
            );

            if (!uploadResult.success || !uploadResult.url) {
              throw new Error(uploadResult.error || "Upload failed");
            }

            uploadedPages.push({
              pageNumber,
              imageUrl: uploadResult.url,
              key: uploadResult.key,
              aspectRatio,
            });
          } catch (uploadErr: any) {
            console.error("Community page upload error:", uploadErr);
            uploadedPages.push({
              pageNumber,
              imageUrl: `data:image/png;base64,${pngBuffer.toString("base64")}`,
              key: undefined,
              aspectRatio,
            });
          }
        }
      }

      if (retryWithFallback && attempt === 0) {
        attempt += 1;
        pdfDoc.destroy();
        pdfDoc = await pdfjsLib.getDocument(fallbackOptions).promise;
        continue;
      }

      break;
    }

    pdfDoc.destroy();

    return NextResponse.json({
      success: true,
      pages: uploadedPages,
      originalFile: pdfUrl && pdfKey ? { url: pdfUrl, key: pdfKey } : null,
      storage: isR2Configured ? "r2" : "inline",
    });
  } catch (error: any) {
    console.error("Community prepare error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process PDF" },
      { status: 500 }
    );
  }
}
