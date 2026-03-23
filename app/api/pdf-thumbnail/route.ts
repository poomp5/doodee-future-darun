import { NextRequest, NextResponse } from "next/server";
import { createCanvas } from "@napi-rs/canvas";
import path from "path";

export const runtime = "nodejs";

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

async function renderPageToCanvas(page: any, maxWidth: number) {
  const viewport = page.getViewport({ scale: 1 });
  const scale = Math.min(maxWidth / viewport.width, 2);
  const scaledViewport = page.getViewport({ scale });

  const width = Math.floor(scaledViewport.width);
  const height = Math.floor(scaledViewport.height);

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

  await page.render({
    canvasContext: context as any,
    viewport: scaledViewport,
    canvasFactory,
  }).promise;

  const blank = isCanvasLikelyBlank(context, width, height);
  return { canvas, width, height, blank };
}

async function renderFirstPageToPng(uint8Array: Uint8Array) {
  ensureClipCompat();
  const g = globalThis as any;
  if (!g.pdfjsWorker) {
    g.pdfjsWorker = await import("pdfjs-dist/legacy/build/pdf.worker.mjs");
  }
  const pdfjsLib = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as any;

  const pdfjsDistBasePath = resolvePdfjsDistBasePath();
  const baseOptions = {
    data: uint8Array,
    disableFontFace: true,
    isEvalSupported: false,
    cMapUrl: withTrailingSlash(path.join(pdfjsDistBasePath, "cmaps")),
    cMapPacked: true,
    iccUrl: withTrailingSlash(path.join(pdfjsDistBasePath, "iccs")),
    standardFontDataUrl: withTrailingSlash(path.join(pdfjsDistBasePath, "standard_fonts")),
    wasmUrl: withTrailingSlash(path.join(pdfjsDistBasePath, "wasm")),
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

  const renderWith = async (options: any) => {
    const doc = await pdfjsLib.getDocument(options).promise;
    if (doc.numPages === 0) {
      throw new Error("PDF has no pages");
    }
    const page = await doc.getPage(1);
    const { canvas, blank } = await renderPageToCanvas(page, 400);
    const pngBuffer = canvas.toBuffer("image/png");
    doc.destroy();
    return { pngBuffer, blank };
  };

  let result = await renderWith(primaryOptions);
  if (result.blank) {
    console.warn("PDF thumbnail: blank render detected, retrying with fallback pdfjs options");
    result = await renderWith(fallbackOptions);
  }

  return result.pngBuffer;
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
      const proto = Object.getPrototypeOf(mod.createCanvas(1, 1).getContext("2d"));
      if (proto.__clipCompatPatched) continue;
      proto.__clipCompatPatched = true;
      const origClip = proto.clip;
      proto.clip = function patchClip(pathArg?: any, fillRule?: string) {
        // @napi-rs/canvas doesn't support Path2D objects or fillRule parameter
        // Always call clip() without parameters to avoid InvalidArg errors
        try {
          return origClip.call(this);
        } catch {
          return;
        }
      };
    } catch {}
  }
}

/**
 * GET /api/pdf-thumbnail?url=<pdf_url>
 * Fetch a PDF from a URL and return a PNG thumbnail of the first page.
 */
export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json(
        { error: "url parameter required" },
        { status: 400 },
      );
    }

    // Fetch the PDF from the URL
    const pdfRes = await fetch(url);
    if (!pdfRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch PDF" },
        { status: 502 },
      );
    }

    const arrayBuffer = await pdfRes.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const pngBuffer = await renderFirstPageToPng(uint8Array);

    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=604800",
      },
    });
  } catch (error: any) {
    console.error("PDF thumbnail GET error:", error?.message || error);
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280"><rect width="200" height="280" fill="#FDF2F8" rx="8"/><rect x="20" y="20" width="160" height="200" fill="white" stroke="#EC4899" stroke-width="2" rx="4"/><text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="24" fill="#BE185D">PDF</text></svg>`;
    return new NextResponse(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=3600",
      },
    });
  }
}

/**
 * POST /api/pdf-thumbnail - Upload a PDF file and get a PNG thumbnail
 * Returns a PNG image
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check if it's a PDF
    if (
      !file.type.includes("pdf") &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return NextResponse.json({ error: "File is not a PDF" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    console.log("PDF thumbnail: Loading pdfjs-dist...");

    console.log("PDF thumbnail: Loading document...");
    const pngBuffer = await renderFirstPageToPng(uint8Array);
    console.log("PDF thumbnail: Success! Buffer size:", pngBuffer.length);

    // Return PNG image
    return new NextResponse(new Uint8Array(pngBuffer), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  } catch (error: any) {
    console.error("PDF thumbnail error:", error?.message || error);
    console.error("PDF thumbnail stack:", error?.stack);

    // Fallback: return a simple placeholder SVG if rendering fails
    const fallbackSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="200" height="280" viewBox="0 0 200 280">
        <rect width="200" height="280" fill="#FDF2F8" rx="8"/>
        <rect x="20" y="20" width="160" height="200" fill="white" stroke="#EC4899" stroke-width="2" rx="4"/>
        <text x="100" y="120" text-anchor="middle" font-family="Arial" font-size="24" fill="#BE185D">PDF</text>
        <text x="100" y="150" text-anchor="middle" font-family="Arial" font-size="10" fill="#6B7280">Preview unavailable</text>
      </svg>
    `;

    return new NextResponse(fallbackSvg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=31536000",
      },
    });
  }
}
