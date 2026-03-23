export type ExamCountdown = {
  id: string;
  label: string;
  targetDate: string; // ISO date
};

// Centralized configurable countdown targets
export const examCountdowns: ExamCountdown[] = [
  { id: "a-level", label: "A-Level", targetDate: "2026-03-14T00:00:00+07:00" },
  { id: "tpat1", label: "TPAT1", targetDate: "2026-02-14T00:00:00+07:00" },
  { id: "tgat", label: "TGAT", targetDate: "2025-12-13T00:00:00+07:00" },
  { id: "tpat2-5", label: "TPAT2-5", targetDate: "2025-12-14T00:00:00+07:00" },
];

