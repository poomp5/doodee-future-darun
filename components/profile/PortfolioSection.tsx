"use client";

import { useState } from "react";
import { FileText, Upload, ExternalLink, Download, Trash, Calculator, Package, Eye } from "lucide-react";
import { Link } from "@/routing";
import { showToast } from "@/lib/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PortfolioSectionProps {
  initialUploads: any[];
  purchases: any[];
  gpax: number | null;
}

export default function PortfolioSection({ initialUploads, purchases, gpax }: PortfolioSectionProps) {
  const t = useTranslations('profile');
  const tCommon = useTranslations('common');

  const [portfolioUploads, setPortfolioUploads] = useState(initialUploads);
  const [filePreviewOpen, setFilePreviewOpen] = useState(false);
  const [selectedUpload, setSelectedUpload] = useState<any | null>(null);
  const confirmDialog = useConfirmDialog();

  const handlePreviewFile = (upload: any) => {
    setSelectedUpload(upload);
    setFilePreviewOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const deletePortfolioUpload = (id: string) => {
    confirmDialog.open({
      title: t('deleteFile'),
      description: t('confirmDeleteFile'),
      confirmText: tCommon('delete'),
      cancelText: tCommon('cancel'),
      variant: 'danger',
      onConfirm: async () => {
        try {
          await fetch(`/api/portfolio/upload-record?id=${id}`, { method: 'DELETE' });
          setPortfolioUploads(prev => prev.filter(p => p.id !== id));
          showToast.success(t('deleteSuccess'));
        } catch (error) {
          console.error("Error deleting portfolio:", error);
          showToast.error(t('cannotDeleteFile'));
        }
      }
    });
  };

  return (
    <div className="p-4 bg-white border border-gray-200 shadow-lg rounded-xl">
      <div>
        {/* GPAX Display Section */}
        {gpax !== null && gpax > 0 && (
          <div className="w-full mt-6 mb-6">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5" />
                  <span className="font-medium">{t('yourGpax')}</span>
                </div>
                <Link href="/course">
                  <button className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1 rounded-md transition-colors">
                    {tCommon('edit')}
                  </button>
                </Link>
              </div>
              <p className="text-4xl font-bold text-center my-3">{gpax.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* Portfolio Uploads Section */}
        <div className="w-full mt-6 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-pink-700 text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {t('portfolioUploads')}
            </h3>
            <Link href="/">
              <button className="text-xs bg-pink-600 hover:bg-pink-700 text-white px-3 py-1.5 rounded-md transition-colors flex items-center gap-1">
                <Upload className="w-3 h-3" />
                {t('uploadMore')}
              </button>
            </Link>
          </div>

          {portfolioUploads.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">{t('noUploadsYet')}</p>
              <Link href="/analyse">
                <button className="mt-3 text-sm bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-md transition-colors">
                  {t('startUpload')}
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {portfolioUploads.map((upload) => (
                <div
                  key={upload.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors bg-white shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    {/* File Icon */}
                    <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-md flex items-center justify-center">
                      <FileText className="w-6 h-6 text-pink-600" />
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">
                        {upload.portfolio_name}
                      </h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {upload.template_type && (
                          <span className="text-xs bg-pink-100 text-pink-700 px-2 py-0.5 rounded">
                            {upload.template_type}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatFileSize(upload.file_size)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(upload.created_at).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handlePreviewFile(upload)}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deletePortfolioUpload(upload.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        title="Delete"
                      >
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      upload.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : upload.status === 'analyzed'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {upload.status === 'completed' ? t('uploadSuccess') :
                       upload.status === 'analyzed' ? t('analyzed') : upload.status}
                    </span>
                    {upload.status === 'completed' && (
                      <Link href="/analyse">
                        <button className="text-xs text-pink-600 hover:text-pink-700 font-medium">
                          {t('analyzeNow')}
                        </button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Portfolio Purchases Section */}
        {purchases.length > 0 && (
          <div className="w-full mt-6 mb-6">
            <h3 className="font-semibold text-pink-700 mb-3 text-lg flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t('purchasedTemplates')}
            </h3>
            <div className="space-y-3">
              {/* Filter out duplicate template names */}
              {purchases
                .filter((purchase, index, self) =>
                  index === self.findIndex((p) => p.template_name === purchase.template_name)
                )
                .map((purchase) => (
                <div
                  key={purchase.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-pink-300 transition-colors bg-pink-50"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">
                        {purchase.template_name}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        {purchase.template_type}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('purchasedOn')}{" "}
                        {new Date(purchase.purchased_at).toLocaleDateString(
                          "th-TH",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-pink-600">
                        ฿{purchase.price}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    {purchase.canva_link && (
                      <a
                        href={purchase.canva_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-md transition-colors"
                      >
                        {t('openCanva')}
                      </a>
                    )}
                    {purchase.download_link && (
                      <a
                        href={purchase.download_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors"
                      >
                        {tCommon('download')}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* File Preview Dialog */}
      <Dialog open={filePreviewOpen} onOpenChange={setFilePreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-500" />
              {selectedUpload?.portfolio_name || "Portfolio Preview"}
            </DialogTitle>
            <DialogDescription>
              {selectedUpload && (
                <div className="flex items-center gap-4 text-sm text-gray-600">
                
                <div className="mt-2 text-left space-y-2">
                  {selectedUpload.template_type && (
                    <span className="inline-block text-xs bg-pink-100 text-pink-700 px-2 py-1 rounded">
                      {selectedUpload.template_type}
                    </span>
                  )}
                  {/* <p className="pl-4"></p> */}
                    <span>  </span>
                    <span>  ขนาดไฟล์: {formatFileSize(selectedUpload.file_size)}</span>
                    <span>•</span>
                    <span>
                      อัปโหลดเมื่อ: {new Date(selectedUpload.created_at).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4">
            {selectedUpload && (
              <>
                {/* File Preview */}
                <div className="border rounded-lg overflow-hidden bg-gray-50 mb-4">
                  <iframe
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedUpload.file_url)}&embedded=true`}
                    className="w-full h-[600px]"
                    title="File Preview"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-end">
                  <a
                    href={selectedUpload.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    เปิดในแท็บใหม่
                  </a>
                  <a
                    href={selectedUpload.file_url}
                    download={selectedUpload.portfolio_name}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    <Download className="w-4 h-4" />
                    ดาวน์โหลด
                  </a>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      {confirmDialog.dialog}
    </div>
  );
}
