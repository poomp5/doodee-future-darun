// ── Mock Exam Input Types ──

export interface SubjectScore {
  [subject: string]: number;
}

export interface FacultyRequirement {
  subject: string;
  min: number;
  weight: number;
}

export interface FacultyCriteria {
  faculty: string;
  university: string;
  requirements: FacultyRequirement[];
}

export interface MockExamInput {
  examType: "TGAT" | "TPAT" | "A-LEVEL";
  scores: SubjectScore;
  facultyCriteria: FacultyCriteria[];
}

// ── Mock Exam Output Types ──

export type ChanceLevel = "HIGH_CHANCE" | "MEDIUM_CHANCE" | "LOW_CHANCE";
export type OverallStatus = "PASS_MINIMUM" | "FAIL_MINIMUM";

export interface SubjectAnalysis {
  subject: string;
  score: number;
  label: "strength" | "weakness";
}

export interface FacultyRecommendation {
  faculty: string;
  university: string;
  weightedScore: number;
  chance: ChanceLevel;
  reason: string;
}

export interface MockExamSummary {
  examType: string;
  overallStatus: OverallStatus;
}

export interface MockExamAnalysis {
  strengths: SubjectAnalysis[];
  weaknesses: SubjectAnalysis[];
}

export interface MockExamResult {
  summary: MockExamSummary;
  analysis: MockExamAnalysis;
  recommendations: FacultyRecommendation[];
}

// ── Seed Data Types ──

export interface SubjectDefinition {
  code: string;
  name: string;
}
