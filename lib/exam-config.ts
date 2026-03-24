export type ExamCountdown = {
  id: string;
  label: string;
  targetDate: string; // ISO date
};

// Centralized configurable countdown targets — dek70 (TCAS68 / ปีการศึกษา 2568)
export const examCountdowns: ExamCountdown[] = [
  { id: "tgat", label: "TGAT/TPAT", targetDate: "2026-12-06T00:00:00+07:00" },
  { id: "a-level", label: "A-Level", targetDate: "2027-03-20T00:00:00+07:00" },
  { id: "tcas-r1", label: "TCAS รอบ 1", targetDate: "2026-10-01T00:00:00+07:00" },
  { id: "tcas-r3", label: "TCAS รอบ 3", targetDate: "2027-05-06T00:00:00+07:00" },
];

