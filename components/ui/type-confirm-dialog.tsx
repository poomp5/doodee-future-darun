"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface TypeConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "danger" | "warning";
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  confirmationKeyword: string; // The text user must type to confirm (e.g., "DELETE")
}

export function TypeConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  onConfirm,
  loading: externalLoading,
  confirmationKeyword,
}: TypeConfirmDialogProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const [typedText, setTypedText] = useState("");
  const loading = externalLoading ?? internalLoading;

  const isConfirmEnabled = typedText === confirmationKeyword && !loading;

  const handleConfirm = async () => {
    if (!isConfirmEnabled) return;

    try {
      setInternalLoading(true);
      await onConfirm();
      onOpenChange(false);
      setTypedText(""); // Reset input
    } catch (error) {
      console.error("Confirmation error:", error);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      setTypedText(""); // Reset input when closing
    }
  };

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300";
      case "warning":
        return "bg-orange-600 hover:bg-orange-700 text-white disabled:bg-orange-300";
      default:
        return "bg-pink-600 hover:bg-pink-700 text-white disabled:bg-pink-300";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="py-4">
          <label htmlFor="confirm-input" className="block text-sm font-medium text-gray-700 mb-2">
            Type <span className="font-bold text-red-600">{confirmationKeyword}</span> to confirm
          </label>
          <input
            id="confirm-input"
            type="text"
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && isConfirmEnabled) {
                handleConfirm();
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            placeholder={`Type "${confirmationKeyword}"`}
            autoComplete="off"
            disabled={loading}
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="text-gray-700 border-gray-300 hover:bg-gray-50"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!isConfirmEnabled}
            className={getConfirmButtonStyles()}
          >
            {loading ? "Processing..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to use type-confirm dialog
 *
 * Example usage:
 * const typeConfirmDialog = useTypeConfirmDialog();
 *
 * <Button onClick={() => typeConfirmDialog.open({
 *   title: "Delete all AI data?",
 *   description: "This action cannot be undone and will delete 15 items.",
 *   confirmText: "Delete All",
 *   variant: "danger",
 *   confirmationKeyword: "DELETE",
 *   onConfirm: async () => {
 *     await deleteAllItems();
 *   }
 * })}>
 *   Delete All
 * </Button>
 *
 * {typeConfirmDialog.dialog}
 */
export function useTypeConfirmDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<TypeConfirmDialogProps, "open" | "onOpenChange">>({
    title: "",
    onConfirm: () => {},
    confirmationKeyword: "DELETE",
  });

  const open = (newConfig: Omit<TypeConfirmDialogProps, "open" | "onOpenChange">) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const dialog = (
    <TypeConfirmDialog
      {...config}
      open={isOpen}
      onOpenChange={setIsOpen}
    />
  );

  return { open, dialog, isOpen, setIsOpen };
}
