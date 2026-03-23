'use client';

import { useRef, useState } from 'react';
import Cropper, { ReactCropperElement } from 'react-cropper';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface CropModalProps {
  src: string;
  type: 'avatar' | 'banner';
  onCancel: () => void;
  onCrop: (blob: Blob) => void;
}

export default function CropModal({ src, type, onCancel, onCrop }: CropModalProps) {
  const cropperRef = useRef<ReactCropperElement>(null);
  const [processing, setProcessing] = useState(false);

  const aspectRatio = type === 'avatar' ? 1 : 4;

  const handleConfirm = () => {
    const cropper = cropperRef.current?.cropper;
    if (!cropper) return;
    setProcessing(true);
    cropper.getCroppedCanvas({
      width: type === 'avatar' ? 400 : 1500,
      height: type === 'avatar' ? 400 : 375,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high',
    }).toBlob(
      (blob) => {
        if (blob) onCrop(blob);
        setProcessing(false);
      },
      'image/jpeg',
      0.92
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">
            {type === 'avatar' ? 'ตัดรูปโปรไฟล์' : 'ตัดรูป Banner'}
          </h3>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper */}
        <div className="bg-gray-900">
          <Cropper
            ref={cropperRef}
            src={src}
            style={{ maxHeight: 340, width: '100%' }}
            aspectRatio={aspectRatio}
            viewMode={1}
            dragMode="move"
            cropBoxMovable
            cropBoxResizable
            autoCropArea={1}
            responsive
            guides={false}
            background={false}
            highlight={false}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => cropperRef.current?.cropper.zoom(0.1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => cropperRef.current?.cropper.zoom(-0.1)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => cropperRef.current?.cropper.rotate(90)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              title="Rotate"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleConfirm}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2 text-sm text-white bg-pink-600 rounded-lg hover:bg-pink-700 disabled:bg-pink-300 transition-colors"
            >
              <Check className="w-4 h-4" />
              {processing ? 'กำลังประมวลผล...' : 'ใช้รูปนี้'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
