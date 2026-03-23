// ─── TCAS69 Calculator Types ────────────────────────────────────────────────

// ── Subject Codes ──
export type TGATSubject = 'TGAT1' | 'TGAT2' | 'TGAT3';
export type TPATSubject = 'TPAT1' | 'TPAT2' | 'TPAT21' | 'TPAT22' | 'TPAT23' | 'TPAT3' | 'TPAT4' | 'TPAT5';
export type ALevelSubject =
  | 'A_MATH1' | 'A_MATH2'
  | 'A_PHY' | 'A_CHEM' | 'A_BIO'
  | 'A_SCI' // วิทยาศาสตร์ประยุกต์
  | 'A_THAI' | 'A_SOC' | 'A_ENG'
  | 'A_FRLANG'; // ภาษาต่างประเทศ (นอกจากอังกฤษ)

export type SubjectCode = TGATSubject | TPATSubject | ALevelSubject | 'GPAX' | 'ONET';

// ── Subject Configuration ──
export interface SubjectConfig {
  code: SubjectCode;
  name: string;
  nameTh: string;
  maxScore: number;
  category: 'TGAT' | 'TPAT' | 'A-Level' | 'Other';
}

export const SUBJECT_CONFIG: Record<SubjectCode, SubjectConfig> = {
  // TGAT
  TGAT1: { code: 'TGAT1', name: 'TGAT1 (English Communication)', nameTh: 'TGAT1 ภาษาอังกฤษ', maxScore: 100, category: 'TGAT' },
  TGAT2: { code: 'TGAT2', name: 'TGAT2 (Critical Thinking)', nameTh: 'TGAT2 คิดอย่างมีเหตุผล', maxScore: 100, category: 'TGAT' },
  TGAT3: { code: 'TGAT3', name: 'TGAT3 (Competency)', nameTh: 'TGAT3 สมรรถนะการทำงาน', maxScore: 100, category: 'TGAT' },

  // TPAT
  TPAT1: { code: 'TPAT1', name: 'TPAT1 (Medicine)', nameTh: 'TPAT1 กสพท (แพทย์)', maxScore: 100, category: 'TPAT' },
  TPAT2: { code: 'TPAT2', name: 'TPAT2 (Art)', nameTh: 'TPAT2 ศิลปกรรม', maxScore: 100, category: 'TPAT' },
  TPAT21: { code: 'TPAT21', name: 'TPAT21 (Music)', nameTh: 'TPAT21 ดนตรี', maxScore: 100, category: 'TPAT' },
  TPAT22: { code: 'TPAT22', name: 'TPAT22 (Visual Art)', nameTh: 'TPAT22 ทัศนศิลป์', maxScore: 100, category: 'TPAT' },
  TPAT23: { code: 'TPAT23', name: 'TPAT23 (Performing Art)', nameTh: 'TPAT23 นาฏศิลป์', maxScore: 100, category: 'TPAT' },
  TPAT3: { code: 'TPAT3', name: 'TPAT3 (Engineering)', nameTh: 'TPAT3 วิศวกรรมศาสตร์', maxScore: 100, category: 'TPAT' },
  TPAT4: { code: 'TPAT4', name: 'TPAT4 (Architecture)', nameTh: 'TPAT4 สถาปัตยกรรมศาสตร์', maxScore: 100, category: 'TPAT' },
  TPAT5: { code: 'TPAT5', name: 'TPAT5 (Education)', nameTh: 'TPAT5 ครุศาสตร์/ศึกษาศาสตร์', maxScore: 100, category: 'TPAT' },

  // A-Level
  A_MATH1: { code: 'A_MATH1', name: 'A-Level Math 1', nameTh: 'A-Level คณิต 1', maxScore: 100, category: 'A-Level' },
  A_MATH2: { code: 'A_MATH2', name: 'A-Level Math 2', nameTh: 'A-Level คณิต 2', maxScore: 100, category: 'A-Level' },
  A_PHY: { code: 'A_PHY', name: 'A-Level Physics', nameTh: 'A-Level ฟิสิกส์', maxScore: 100, category: 'A-Level' },
  A_CHEM: { code: 'A_CHEM', name: 'A-Level Chemistry', nameTh: 'A-Level เคมี', maxScore: 100, category: 'A-Level' },
  A_BIO: { code: 'A_BIO', name: 'A-Level Biology', nameTh: 'A-Level ชีววิทยา', maxScore: 100, category: 'A-Level' },
  A_SCI: { code: 'A_SCI', name: 'A-Level Applied Science', nameTh: 'A-Level วิทยาศาสตร์ประยุกต์', maxScore: 100, category: 'A-Level' },
  A_THAI: { code: 'A_THAI', name: 'A-Level Thai', nameTh: 'A-Level ภาษาไทย', maxScore: 100, category: 'A-Level' },
  A_SOC: { code: 'A_SOC', name: 'A-Level Social Studies', nameTh: 'A-Level สังคมศึกษา', maxScore: 100, category: 'A-Level' },
  A_ENG: { code: 'A_ENG', name: 'A-Level English', nameTh: 'A-Level ภาษาอังกฤษ', maxScore: 100, category: 'A-Level' },
  A_FRLANG: { code: 'A_FRLANG', name: 'A-Level Foreign Lang', nameTh: 'A-Level ภาษาต่างประเทศ', maxScore: 100, category: 'A-Level' },

  // Other
  GPAX: { code: 'GPAX', name: 'GPAX', nameTh: 'GPAX', maxScore: 4, category: 'Other' },
  ONET: { code: 'ONET', name: 'O-NET', nameTh: 'O-NET', maxScore: 100, category: 'Other' },
};

// ── User Score Input ──
export interface UserScores {
  [key: string]: number | undefined;
}

// ── Score Weight (from database) ──
export interface ScoreWeight {
  subjectCode: SubjectCode;
  weight: number; // 0-1 (e.g., 0.3 for 30%)
  minScore?: number; // minimum required score
}

// ── Cutoff History (from database) ──
export interface CutoffHistory {
  year: number;
  round: number;
  minScore: number;
  maxScore?: number;
  avgScore?: number;
  seats?: number;
  applicants?: number;
}

// ── Program Info ──
export interface ProgramInfo {
  id: number;
  programId?: string;
  universityNameTh?: string;
  universityNameEn?: string;
  facultyNameTh?: string;
  facultyNameEn?: string;
  fieldNameTh?: string;
  fieldNameEn?: string;
  programNameTh?: string;
  programNameEn?: string;
  logoUrl?: string;
  weights?: ScoreWeight[];
  cutoffHistory?: CutoffHistory[];
}

// ── Calculation Result ──
export type ChanceLevel = 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW' | 'UNKNOWN';

export interface CalculationResult {
  program: ProgramInfo;
  weightedScore: number;
  maxPossibleScore: number;
  percentage: number;
  chanceLevel: ChanceLevel;
  comparison?: {
    year: number;
    round: number;
    cutoffMin: number;
    cutoffAvg?: number;
    difference: number; // positive = above cutoff, negative = below
    percentile?: number;
  };
  missingSubjects: SubjectCode[];
  belowMinimum: { subject: SubjectCode; score: number; minRequired: number }[];
}

// ── Calculator Program Types ──
export type CalculatorProgramType = 1 | 2 | 3 | 4;

export interface CalculatorProgram {
  type: CalculatorProgramType;
  name: string;
  nameTh: string;
  description: string;
  icon: string;
}

export const CALCULATOR_PROGRAMS: CalculatorProgram[] = [
  {
    type: 1,
    name: 'Single Faculty Calculator',
    nameTh: 'คำนวณคะแนนคณะที่สนใจ',
    description: 'Calculate your score for a specific faculty/program',
    icon: 'calculator',
  },
  {
    type: 2,
    name: 'University Overview',
    nameTh: 'ดูคะแนนทุกคณะในมหาวิทยาลัย',
    description: 'View all faculties in one university',
    icon: 'building',
  },
  {
    type: 3,
    name: 'Multi-University Comparison',
    nameTh: 'ดูคะแนนหลายมหาวิทยาลัย',
    description: 'Compare the same faculty across universities',
    icon: 'git-compare',
  },
  {
    type: 4,
    name: 'Top 10 Ranking Builder',
    nameTh: 'ลองจัดเซต 10 อันดับ',
    description: 'Build and evaluate your top 10 program choices',
    icon: 'list-ordered',
  },
];

// ── Wizard State ──
export interface CalculatorWizardState {
  step: number;
  programType: CalculatorProgramType | null;
  scores: UserScores;
  selectedUniversityId?: string;
  selectedFacultyId?: string;
  selectedProgramIds: number[];
  rankedPrograms: number[]; // for program type 4
}

// ── API Request/Response Types ──
export interface CalculateRequest {
  scores: UserScores;
  programIds: number[];
  compareYear?: number;
  compareRound?: number;
}

export interface CalculateResponse {
  results: CalculationResult[];
  summary: {
    totalPrograms: number;
    highChance: number;
    mediumChance: number;
    lowChance: number;
  };
}

export interface SaveCalculationRequest {
  scores: UserScores;
  results: CalculationResult[];
  programType: CalculatorProgramType;
}

// ── Ranking Types ──
export interface RankedProgram {
  rank: number;
  programId: number;
  program: ProgramInfo;
  result: CalculationResult;
  strategy?: 'safe' | 'reach' | 'match';
}

export interface RankingEvaluation {
  programs: RankedProgram[];
  overall: {
    safeCount: number;
    matchCount: number;
    reachCount: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendation: string;
  };
}
