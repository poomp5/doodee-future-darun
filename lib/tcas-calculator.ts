import type {
  UserScores,
  ScoreWeight,
  CutoffHistory,
  CalculationResult,
  ChanceLevel,
  SubjectCode,
  ProgramInfo,
  RankedProgram,
  RankingEvaluation,
  SUBJECT_CONFIG,
} from '@/types/tcas-calculator';

/**
 * Calculate weighted score for a program based on user scores and weights
 */
export function calculateWeightedScore(
  userScores: UserScores,
  weights: ScoreWeight[]
): { weightedScore: number; maxPossibleScore: number; missingSubjects: SubjectCode[]; belowMinimum: { subject: SubjectCode; score: number; minRequired: number }[] } {
  let weightedScore = 0;
  let maxPossibleScore = 0;
  const missingSubjects: SubjectCode[] = [];
  const belowMinimum: { subject: SubjectCode; score: number; minRequired: number }[] = [];

  for (const weight of weights) {
    const userScore = userScores[weight.subjectCode];
    const maxSubjectScore = 100; // Most subjects have max score of 100

    // Calculate max possible contribution
    maxPossibleScore += maxSubjectScore * weight.weight;

    if (userScore === undefined || userScore === null) {
      missingSubjects.push(weight.subjectCode);
      continue;
    }

    // Check minimum score requirement
    if (weight.minScore !== undefined && userScore < weight.minScore) {
      belowMinimum.push({
        subject: weight.subjectCode,
        score: userScore,
        minRequired: weight.minScore,
      });
    }

    // Add weighted score
    weightedScore += userScore * weight.weight;
  }

  return {
    weightedScore: Math.round(weightedScore * 100) / 100,
    maxPossibleScore: Math.round(maxPossibleScore * 100) / 100,
    missingSubjects,
    belowMinimum,
  };
}

/**
 * Evaluate chance level based on weighted score and cutoff history
 */
export function evaluateChance(
  weightedScore: number,
  cutoffHistory: CutoffHistory[],
  compareYear?: number,
  compareRound?: number
): { chanceLevel: ChanceLevel; comparison?: CalculationResult['comparison'] } {
  // Find the most relevant cutoff data
  let cutoff: CutoffHistory | undefined;

  if (compareYear && compareRound) {
    cutoff = cutoffHistory.find(c => c.year === compareYear && c.round === compareRound);
  }

  // If specific year/round not found, use most recent
  if (!cutoff && cutoffHistory.length > 0) {
    // Sort by year descending, then round descending
    const sorted = [...cutoffHistory].sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return b.round - a.round;
    });
    cutoff = sorted[0];
  }

  // If no cutoff data available
  if (!cutoff) {
    return { chanceLevel: 'UNKNOWN' };
  }

  const difference = weightedScore - cutoff.minScore;

  // Calculate percentile if we have avg and min
  let percentile: number | undefined;
  if (cutoff.avgScore && cutoff.minScore) {
    // Estimate percentile based on position between min and avg
    // Assuming normal distribution, avg is roughly at 50th percentile of accepted
    const range = cutoff.avgScore - cutoff.minScore;
    if (range > 0) {
      const position = (weightedScore - cutoff.minScore) / range;
      percentile = Math.min(100, Math.max(0, position * 50));
    }
  }

  // Determine chance level
  let chanceLevel: ChanceLevel;

  if (difference >= 20) {
    chanceLevel = 'VERY_HIGH';
  } else if (difference >= 10) {
    chanceLevel = 'HIGH';
  } else if (difference >= 0) {
    chanceLevel = 'MEDIUM';
  } else if (difference >= -10) {
    chanceLevel = 'LOW';
  } else {
    chanceLevel = 'VERY_LOW';
  }

  return {
    chanceLevel,
    comparison: {
      year: cutoff.year,
      round: cutoff.round,
      cutoffMin: cutoff.minScore,
      cutoffAvg: cutoff.avgScore,
      difference: Math.round(difference * 100) / 100,
      percentile,
    },
  };
}

/**
 * Calculate result for a single program
 */
export function calculateProgramResult(
  userScores: UserScores,
  program: ProgramInfo,
  compareYear?: number,
  compareRound?: number
): CalculationResult {
  const weights = program.weights || [];
  const cutoffHistory = program.cutoffHistory || [];

  const { weightedScore, maxPossibleScore, missingSubjects, belowMinimum } =
    calculateWeightedScore(userScores, weights);

  const percentage = maxPossibleScore > 0
    ? Math.round((weightedScore / maxPossibleScore) * 10000) / 100
    : 0;

  const { chanceLevel, comparison } = evaluateChance(
    weightedScore,
    cutoffHistory,
    compareYear,
    compareRound
  );

  return {
    program,
    weightedScore,
    maxPossibleScore,
    percentage,
    chanceLevel,
    comparison,
    missingSubjects,
    belowMinimum,
  };
}

/**
 * Calculate results for multiple programs
 */
export function calculateMultiplePrograms(
  userScores: UserScores,
  programs: ProgramInfo[],
  compareYear?: number,
  compareRound?: number
): CalculationResult[] {
  return programs
    .map(program => calculateProgramResult(userScores, program, compareYear, compareRound))
    .sort((a, b) => {
      // Sort by chance level first, then by weighted score
      const chancePriority: Record<ChanceLevel, number> = {
        VERY_HIGH: 5,
        HIGH: 4,
        MEDIUM: 3,
        LOW: 2,
        VERY_LOW: 1,
        UNKNOWN: 0,
      };
      const chanceDiff = chancePriority[b.chanceLevel] - chancePriority[a.chanceLevel];
      if (chanceDiff !== 0) return chanceDiff;
      return b.weightedScore - a.weightedScore;
    });
}

/**
 * Evaluate a ranked list of programs (for Program Type 4)
 */
export function evaluateRanking(
  userScores: UserScores,
  rankedProgramIds: number[],
  programs: ProgramInfo[],
  compareYear?: number,
  compareRound?: number
): RankingEvaluation {
  const programMap = new Map(programs.map(p => [p.id, p]));
  const rankedPrograms: RankedProgram[] = [];

  let safeCount = 0;
  let matchCount = 0;
  let reachCount = 0;

  for (let i = 0; i < rankedProgramIds.length; i++) {
    const programId = rankedProgramIds[i];
    const program = programMap.get(programId);

    if (!program) continue;

    const result = calculateProgramResult(userScores, program, compareYear, compareRound);

    // Determine strategy classification
    let strategy: 'safe' | 'reach' | 'match';
    if (result.chanceLevel === 'VERY_HIGH' || result.chanceLevel === 'HIGH') {
      strategy = 'safe';
      safeCount++;
    } else if (result.chanceLevel === 'MEDIUM') {
      strategy = 'match';
      matchCount++;
    } else {
      strategy = 'reach';
      reachCount++;
    }

    rankedPrograms.push({
      rank: i + 1,
      programId,
      program,
      result,
      strategy,
    });
  }

  // Determine overall risk level
  let riskLevel: 'low' | 'medium' | 'high';
  let recommendation: string;

  if (safeCount >= 3) {
    riskLevel = 'low';
    recommendation = 'การจัดอันดับของคุณมีความปลอดภัยดี มีตัวเลือกที่มั่นใจหลายตัว';
  } else if (safeCount >= 1 && matchCount >= 2) {
    riskLevel = 'medium';
    recommendation = 'การจัดอันดับมีความสมดุล แต่ควรพิจารณาเพิ่มตัวเลือกที่มั่นใจมากขึ้น';
  } else {
    riskLevel = 'high';
    recommendation = 'คุณอาจต้องเพิ่มตัวเลือกที่มีโอกาสสูงขึ้นเพื่อลดความเสี่ยง';
  }

  return {
    programs: rankedPrograms,
    overall: {
      safeCount,
      matchCount,
      reachCount,
      riskLevel,
      recommendation,
    },
  };
}

/**
 * Get chance level display info
 */
export function getChanceLevelInfo(level: ChanceLevel): {
  label: string;
  labelTh: string;
  color: string;
  bgColor: string;
  textColor: string;
} {
  switch (level) {
    case 'VERY_HIGH':
      return {
        label: 'Very High',
        labelTh: 'สูงมาก',
        color: 'green',
        bgColor: 'bg-green-100',
        textColor: 'text-green-700',
      };
    case 'HIGH':
      return {
        label: 'High',
        labelTh: 'สูง',
        color: 'emerald',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700',
      };
    case 'MEDIUM':
      return {
        label: 'Medium',
        labelTh: 'ปานกลาง',
        color: 'yellow',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-700',
      };
    case 'LOW':
      return {
        label: 'Low',
        labelTh: 'ต่ำ',
        color: 'orange',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-700',
      };
    case 'VERY_LOW':
      return {
        label: 'Very Low',
        labelTh: 'ต่ำมาก',
        color: 'red',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
      };
    case 'UNKNOWN':
    default:
      return {
        label: 'Unknown',
        labelTh: 'ไม่ทราบ',
        color: 'gray',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
      };
  }
}

/**
 * Format score for display
 */
export function formatScore(score: number, decimals: number = 2): string {
  return score.toFixed(decimals);
}

/**
 * Calculate summary statistics from results
 */
export function calculateSummary(results: CalculationResult[]): {
  totalPrograms: number;
  highChance: number;
  mediumChance: number;
  lowChance: number;
} {
  return {
    totalPrograms: results.length,
    highChance: results.filter(r => r.chanceLevel === 'VERY_HIGH' || r.chanceLevel === 'HIGH').length,
    mediumChance: results.filter(r => r.chanceLevel === 'MEDIUM').length,
    lowChance: results.filter(r => r.chanceLevel === 'LOW' || r.chanceLevel === 'VERY_LOW' || r.chanceLevel === 'UNKNOWN').length,
  };
}
