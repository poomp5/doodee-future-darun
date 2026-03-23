"use client";

import { useState } from "react";
import { UploadCloud, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface BannerUploaderProps {
  onUploaded: (url: string) => void;
}

export default function BannerUploader({ onUploaded }: BannerUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(false);
    setUploading(true);

    try {
      // Request presigned URL
      const urlRes = await fetch("/api/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });
      const urlData = await urlRes.json();
      if (!urlRes.ok || !urlData.uploadUrl) throw new Error(urlData.error || "Failed to get upload URL");

      // Upload to R2 directly
      const uploadRes = await fetch(urlData.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");

      onUploaded(urlData.publicUrl);
      setSuccess(true);
    } catch (err: any) {
      console.error("Upload error:", err);
      setError(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 bg-gray-50">
      <label className="flex flex-col items-center justify-center gap-2 cursor-pointer text-center">
        <div className="w-14 h-14 rounded-full bg-white shadow flex items-center justify-center text-pink-500">
          {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-semibold text-pink-600">อัปโหลดรูปแบนเนอร์</span>{" "}
          <span className="text-gray-500">(16:9, PNG/JPG)</span>
        </div>
        <input
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          className="hidden"
          onChange={handleFileChange}
        />
      </label>
      {success && (
        <p className="mt-2 text-green-600 text-sm flex items-center gap-1">
          <CheckCircle className="w-4 h-4" /> อัปโหลดสำเร็จ
        </p>
      )}
      {error && (
        <p className="mt-2 text-red-600 text-sm flex items-center gap-1">
          <AlertCircle className="w-4 h-4" /> {error}
        </p>
      )}
    </div>
  );
}
