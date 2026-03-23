// app/api/pdf-ocr/route.ts
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file)
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.type !== "application/pdf")
    return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const pdfParse = (await import("pdf-parse")) as unknown as (
    buffer: Buffer
  ) => Promise<any>;
  const data = await pdfParse(buffer);


  return NextResponse.json({
    success: true,
    text: data.text,
    metadata: {
      pages: data.numpages,
      info: data.info,
      filename: file.name,
      size: file.size,
    },
  });
}

export async function GET() {
  return NextResponse.json({
    message: "PDF OCR endpoint is running. Use POST with a PDF file.",
  });
}
