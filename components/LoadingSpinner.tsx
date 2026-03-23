"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = "md",
  text,
  fullScreen = false
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-16 h-16",
    lg: "w-24 h-24",
  };

  if (fullScreen) {
    return null;
  }

  const borderSizes = {
    sm: "border-2",
    md: "border-2",
    lg: "border-4",
  };

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        aria-label="Loading"
        className={`${sizeClasses[size]} ${borderSizes[size]} rounded-full border-pink-200 border-t-pink-500 animate-spin`}
      />
      {text && (
        <p className="text-pink-600 text-sm font-medium animate-pulse">{text}</p>
      )}
    </div>
  );

  return content;
}
