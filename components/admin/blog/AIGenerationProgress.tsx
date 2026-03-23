"use client";

import { useTranslations } from "next-intl";
import { Check, Loader2, Globe, Cpu, FileText, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";

export type GenerationStep = "scraping" | "preparing" | "generating" | "parsing" | "complete" | "error";

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: "info" | "success" | "error";
}

interface AIGenerationProgressProps {
  currentStep: GenerationStep;
  progress: number;
  logs: LogEntry[];
  error?: string;
}

const STEPS: { key: GenerationStep; icon: typeof Globe }[] = [
  { key: "scraping", icon: Globe },
  { key: "generating", icon: Cpu },
  { key: "parsing", icon: FileText },
  { key: "complete", icon: CheckCircle },
];

function getStepIndex(step: GenerationStep): number {
  if (step === "error") return -1;
  if (step === "preparing") return 0; // Part of scraping/initial phase
  const index = STEPS.findIndex((s) => s.key === step);
  return index >= 0 ? index : 0;
}

function isStepComplete(currentStep: GenerationStep, checkStep: GenerationStep): boolean {
  if (currentStep === "error") return false;
  const currentIndex = getStepIndex(currentStep);
  const checkIndex = getStepIndex(checkStep);
  return currentIndex > checkIndex;
}

function isStepActive(currentStep: GenerationStep, checkStep: GenerationStep): boolean {
  if (currentStep === "error") return false;
  if (currentStep === "preparing" && checkStep === "scraping") return true;
  return currentStep === checkStep;
}

export default function AIGenerationProgress({
  currentStep,
  progress,
  logs,
  error,
}: AIGenerationProgressProps) {
  const t = useTranslations("blog.admin.ai.progress");
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const currentStepIndex = getStepIndex(currentStep);

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="relative">
        <div className="flex justify-between items-center">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isComplete = isStepComplete(currentStep, step.key);
            const isActive = isStepActive(currentStep, step.key);
            const isPending = !isComplete && !isActive;

            return (
              <div key={step.key} className="flex flex-col items-center z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isComplete
                      ? "bg-green-500 text-white"
                      : isActive
                      ? "bg-purple-500 text-white animate-pulse"
                      : currentStep === "error"
                      ? "bg-red-100 text-red-400"
                      : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isComplete
                      ? "text-green-600"
                      : isActive
                      ? "text-purple-600"
                      : currentStep === "error"
                      ? "text-red-400"
                      : "text-gray-400"
                  }`}
                >
                  {t(`steps.${step.key}`)}
                </span>
              </div>
            );
          })}
        </div>

        {/* Connecting lines */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0" style={{ marginLeft: "5%", marginRight: "5%", width: "90%" }}>
          <div
            className={`h-full transition-all duration-500 ${
              currentStep === "error" ? "bg-red-300" : "bg-purple-500"
            }`}
            style={{
              width: currentStep === "error"
                ? "0%"
                : currentStep === "complete"
                ? "100%"
                : `${Math.min(100, (currentStepIndex / (STEPS.length - 1)) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">{t("progressLabel")}</span>
          <span className={`font-medium ${currentStep === "error" ? "text-red-600" : "text-purple-600"}`}>
            {progress}%
          </span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              currentStep === "error"
                ? "bg-red-500"
                : currentStep === "complete"
                ? "bg-green-500"
                : "bg-gradient-to-r from-purple-500 to-pink-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {currentStep === "error" && error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">{t("errorTitle")}</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Logs Panel */}
      <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto font-mono text-sm">
        <div className="flex items-center gap-2 mb-3 text-gray-400">
          <FileText className="w-4 h-4" />
          <span>{t("logsTitle")}</span>
        </div>
        <div className="space-y-1.5">
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className="text-gray-500 flex-shrink-0">
                {log.timestamp.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                  hour12: false,
                })}
              </span>
              <span
                className={
                  log.type === "success"
                    ? "text-green-400"
                    : log.type === "error"
                    ? "text-red-400"
                    : "text-gray-300"
                }
              >
                {log.type === "success" && "✓ "}
                {log.type === "error" && "✗ "}
                {log.type === "info" && "→ "}
                {log.message}
              </span>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-gray-500 italic">{t("waitingToStart")}</div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* Success Message */}
      {currentStep === "complete" && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">{t("successTitle")}</p>
            <p className="text-sm text-green-600 mt-1">{t("successMessage")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
