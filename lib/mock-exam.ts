import type {
  MockExamInput,
  MockExamResult,
  MockExamSummary,
  MockExamAnalysis,
  FacultyRecommendation,
  SubjectAnalysis,
  ChanceLevel,
  OverallStatus,
  FacultyCriteria,
} from "@/types/mock-exam";

/**
 * Classify chance based on weighted score.
 * >= 75 -> HIGH_CHANCE
 * 60-74 -> MEDIUM_CHANCE
 * < 60  -> LOW_CHANCE
 */
function classifyChance(weightedScore: number): ChanceLevel {
  if (weightedScore >= 75) return "HIGH_CHANCE";
  if (weightedScore >= 60) return "MEDIUM_CHANCE";
  return "LOW_CHANCE";
}

/**
 * Evaluate a single faculty against provided scores.
 * RULE 1: If ANY subject score < minimum requirement -> LOW_CHANCE
 * RULE 2: WeightedScore = sum(score * weight)
 * RULE 3: Chance classification by weighted score
 */
function evaluateFaculty(
  scores: Record<string, number>,
  criteria: FacultyCriteria
): FacultyRecommendation {
  const failedSubjects: string[] = [];
  let weightedScore = 0;

  for (const req of criteria.requirements) {
    const score = scores[req.subject];

    if (score === undefined || score < req.min) {
      failedSubjects.push(req.subject);
    }

    weightedScore += (score ?? 0) * req.weight;
  }

  // Round to 2 decimal places
  weightedScore = Math.round(weightedScore * 100) / 100;

  // RULE 1: any subject below minimum -> LOW_CHANCE
  if (failedSubjects.length > 0) {
    return {
      faculty: criteria.faculty,
      university: criteria.university,
      weightedScore,
      chance: "LOW_CHANCE",
      reason: `Below minimum in: ${failedSubjects.join(", ")}`,
    };
  }

  // RULE 3: classify by weighted score
  const chance = classifyChance(weightedScore);

  let reason: string;
  if (chance === "HIGH_CHANCE") {
    reason = "All minimums passed. Weighted score is competitive.";
  } else if (chance === "MEDIUM_CHANCE") {
    reason = "All minimums passed. Weighted score is moderate.";
  } else {
    reason = "All minimums passed but weighted score is below competitive threshold.";
  }

  return {
    faculty: criteria.faculty,
    university: criteria.university,
    weightedScore,
    chance,
    reason,
  };
}

/**
 * Analyze strengths and weaknesses across all scores.
 * RULE 4: Strength = score >= 70
 * RULE 5: Weakness = score < 60
 */
function analyzeScores(
  scores: Record<string, number>,
  facultyCriteria: FacultyCriteria[]
): MockExamAnalysis {
  const strengths: SubjectAnalysis[] = [];
  const weaknesses: SubjectAnalysis[] = [];

  // Collect all minimum requirements per subject across all faculties
  const minRequirements: Record<string, number> = {};
  for (const criteria of facultyCriteria) {
    for (const req of criteria.requirements) {
      if (
        minRequirements[req.subject] === undefined ||
        req.min > minRequirements[req.subject]
      ) {
        minRequirements[req.subject] = req.min;
      }
    }
  }

  for (const [subject, score] of Object.entries(scores)) {
    if (score >= 70) {
      strengths.push({ subject, score, label: "strength" });
    }

    const minReq = minRequirements[subject];
    if (score < 60 || (minReq !== undefined && score < minReq)) {
      weaknesses.push({ subject, score, label: "weakness" });
    }
  }

  return { strengths, weaknesses };
}

/**
 * Determine overall status: PASS_MINIMUM if at least one faculty has all minimums met.
 */
function determineOverallStatus(
  recommendations: FacultyRecommendation[]
): OverallStatus {
  const anyPassed = recommendations.some(
    (r) => !r.reason.startsWith("Below minimum")
  );
  return anyPassed ? "PASS_MINIMUM" : "FAIL_MINIMUM";
}

/**
 * Main evaluation function.
 * Accepts MockExamInput, returns MockExamResult.
 */
export function evaluateMockExam(input: MockExamInput): MockExamResult {
  const { examType, scores, facultyCriteria } = input;

  // Evaluate each faculty
  const recommendations: FacultyRecommendation[] = facultyCriteria.map(
    (criteria) => evaluateFaculty(scores, criteria)
  );

  // Sort: HIGH_CHANCE first, then MEDIUM_CHANCE, then LOW_CHANCE
  const chanceOrder: Record<ChanceLevel, number> = {
    HIGH_CHANCE: 0,
    MEDIUM_CHANCE: 1,
    LOW_CHANCE: 2,
  };
  recommendations.sort(
    (a, b) => chanceOrder[a.chance] - chanceOrder[b.chance]
  );

  // Analyze strengths/weaknesses
  const analysis = analyzeScores(scores, facultyCriteria);

  // Summary
  const summary: MockExamSummary = {
    examType,
    overallStatus: determineOverallStatus(recommendations),
  };

  return {
    summary,
    analysis,
    recommendations,
  };
}
