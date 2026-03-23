"use client";

import { showToast } from "@/lib/toast";

type FireOptions = {
  icon?: "success" | "error" | "warning" | "info" | string;
  title?: string;
  text?: string;
  html?: string;
  showCancelButton?: boolean;
  input?: string;
  inputValue?: string;
  timer?: number;
  showConfirmButton?: boolean;
  preConfirm?: () => any | Promise<any>;
  [key: string]: any;
};

type FireResult<T = any> = {
  isConfirmed: boolean;
  isDismissed: boolean;
  value?: T;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const stripHtml = (value?: string): string => {
  if (!value) return "";
  if (typeof window === "undefined") return value.replace(/<[^>]*>/g, " ").trim();
  const parser = new DOMParser();
  const doc = parser.parseFromString(value, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
};

const buildMessage = (options: FireOptions): string =>
  options.text || stripHtml(options.html) || options.title || "";

const showByIcon = (options: FireOptions, message: string) => {
  if (options.icon === "success") return showToast.success(message || "Success");
  if (options.icon === "error") return showToast.error(message || "Error");
  if (options.icon === "warning") return showToast.warning(message || "Warning");
  if (options.icon === "info") return showToast.info(message || "Info");
  return showToast.custom(message || "Notification");
};

const Swal = {
  async fire(options: FireOptions | string): Promise<FireResult> {
    const normalized: FireOptions = typeof options === "string" ? { title: options } : options || {};
    const message = buildMessage(normalized);

    if (normalized.input) {
      const label = normalized.title || normalized.text || "";
      const value = window.prompt(label, normalized.inputValue || "");
      const isConfirmed = value !== null;
      if (!isConfirmed) return { isConfirmed: false, isDismissed: true, value: null };
      showByIcon({ ...normalized, icon: normalized.icon || "success" }, message || String(value));
      return { isConfirmed: true, isDismissed: false, value };
    }

    if (normalized.showCancelButton) {
      const confirmed = window.confirm(message || normalized.title || "Confirm?");
      if (!confirmed) return { isConfirmed: false, isDismissed: true };

      let value: any = true;
      if (normalized.preConfirm) value = await normalized.preConfirm();
      showByIcon({ ...normalized, icon: normalized.icon || "success" }, message || "Completed");
      if (normalized.timer && normalized.showConfirmButton === false) {
        await sleep(normalized.timer);
      }
      return { isConfirmed: true, isDismissed: false, value };
    }

    let value: any = true;
    if (normalized.preConfirm) value = await normalized.preConfirm();
    showByIcon(normalized, message);

    if (normalized.timer && normalized.showConfirmButton === false) {
      await sleep(normalized.timer);
    }

    return { isConfirmed: true, isDismissed: false, value };
  },
};

export default Swal;
