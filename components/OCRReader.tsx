"use client";
import { useState } from "react";
import { FileText } from "lucide-react";

export default function OCRReader() {
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setText("");
    setProgress(0);

    try {
      const res = await fetch("/api/pdf-ocr", {
        method: "POST",
        body: file,
      });

      if (!res.ok) throw new Error("OCR API Error");
      const data = await res.json();

      setText(data.text);
    } catch (err) {
      console.error(err);
      setText("เกิดข้อผิดพลาดในการประมวลผล OCR");
    } finally {
      setLoading(false);
      setProgress(100);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-2 inline-flex items-center gap-2">
        <FileText className="w-5 h-5 text-pink-600" />
        OCR Reader (PDF + Image)
      </h2>
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={handleFile}
        className="mb-4"
      />

      {loading && (
        <div className="mb-4">
          <p>กำลังประมวลผล OCR ...</p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded-md border">
        {text || "ยังไม่มีข้อความ OCR"}
      </pre>
    </div>
  );
}
