import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  extractPortfolioHintsFromAnalysis,
  extractStructuredPortfolioHints,
  recommendProgramsBySkills,
} from "@/lib/program-recommendation";

type ParsedAnalysisExtras = {
  recommendations: string[];
  detected_interests: string[];
  portfolio_text_excerpt: string | null;
  analysis_metadata: {
    text_length?: number;
    confidence_score?: number;
    processing_time?: number;
  } | null;
};

function normalizeAnalysisStatus(status?: string | null): string {
  const normalized = (status || "").toLowerCase();
  if (!normalized) {
    return "completed";
  }
  if (normalized.includes("fail") || normalized.includes("error")) {
    return "failed";
  }
  if (normalized.includes("pending") || normalized.includes("process")) {
    return "pending";
  }
  return "completed";
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function sanitizeTextForDb(value: unknown, maxLength = 12000): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const sanitized = value
    // PostgreSQL text/jsonb cannot contain null bytes.
    .replace(/\u0000/g, "")
    // Strip problematic control chars.
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    // Remove unpaired UTF-16 surrogates.
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, "")
    .replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (!sanitized) {
    return null;
  }

  return sanitized.slice(0, maxLength);
}

function sanitizeStringListForDb(
  value: unknown,
  maxItems = 30,
  maxLength = 500,
): string[] {
  return normalizeStringList(value)
    .map((item) => sanitizeTextForDb(item, maxLength))
    .filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    )
    .slice(0, maxItems);
}

function sanitizeJsonValue(value: unknown, depth = 0): unknown {
  if (value === null) {
    return null;
  }
  if (depth > 8) {
    return null;
  }
  if (typeof value === "string") {
    return sanitizeTextForDb(value, 3000) ?? "";
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 100)
      .map((item) => sanitizeJsonValue(item, depth + 1));
  }
  if (typeof value === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(
      value as Record<string, unknown>,
    ).slice(0, 100)) {
      output[key] = sanitizeJsonValue(raw, depth + 1);
    }
    return output;
  }
  return null;
}

function normalizeSkillScores(raw: unknown): Record<string, number> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const normalized: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
      continue;
    }
    normalized[key] = Math.max(0, Math.min(100, numericValue));
  }

  return normalized;
}

function extractFirstFacultyMeta(
  recommendedFaculties: unknown,
  recommendedCourses?: unknown,
  adviceText?: string,
): {
  universityName: string | null;
  programName: string | null;
  logoUrl: string | null;
} {
  // Try recommended_faculties first
  if (Array.isArray(recommendedFaculties) && recommendedFaculties.length > 0) {
    const firstFaculty = recommendedFaculties[0];
    if (
      typeof firstFaculty === "object" &&
      firstFaculty !== null &&
      !Array.isArray(firstFaculty)
    ) {
      const faculty = firstFaculty as Record<string, any>;
      const universityName =
        faculty.university_name_th || faculty.university_name_en || null;
      const programName =
        faculty.faculty_name_th ||
        faculty.faculty_name_en ||
        faculty.program_name_th ||
        faculty.program_name_en ||
        null;
      const logoUrl = faculty.logo_url || null;

      // Return if we found university info
      if (universityName) {
        return { universityName, programName, logoUrl };
      }
    }
  }

  // Fallback to recommended_courses
  if (Array.isArray(recommendedCourses) && recommendedCourses.length > 0) {
    const firstCourse = recommendedCourses[0];
    if (
      typeof firstCourse === "object" &&
      firstCourse !== null &&
      !Array.isArray(firstCourse)
    ) {
      const course = firstCourse as Record<string, any>;
      const universityName =
        course.university_name_th || course.university_name_en || null;
      const programName =
        course.faculty_name_th ||
        course.faculty_name_en ||
        course.program_name_th ||
        course.program_name_en ||
        null;
      const logoUrl = course.logo_url || null;

      if (universityName) {
        return { universityName, programName, logoUrl };
      }
    }
  }

  // Last resort: try to extract from advice text
  if (adviceText && typeof adviceText === "string") {
    // Common Thai university patterns
    const universityPatterns = [
      /มหาวิทยาลัย([ก-๙]+)/,
      /(จุฬาลงกรณ์|มหิดล|เกษตรศาสตร์|ธรรมศาสตร์|ศิลปากร|รามคำแหง|เชียงใหม่|ขอนแก่น|สงขลานครินทร์|บูรพา|นเรศวร|มหาสารคาม|วลัยลักษณ์|ทักษิณ|อุบลราชธานี)/,
      /มหาวิทยาลัยเทคโนโลยี([ก-๙]+)/,
    ];

    for (const pattern of universityPatterns) {
      const match = adviceText.match(pattern);
      if (match) {
        return {
          universityName: match[0],
          programName: null,
          logoUrl: null,
        };
      }
    }
  }

  return { universityName: null, programName: null, logoUrl: null };
}

function parseAnalysisExtras(raw: unknown): ParsedAnalysisExtras {
  if (!raw) {
    return {
      recommendations: [],
      detected_interests: [],
      portfolio_text_excerpt: null,
      analysis_metadata: null,
    };
  }

  if (Array.isArray(raw)) {
    return {
      recommendations: normalizeStringList(raw),
      detected_interests: [],
      portfolio_text_excerpt: null,
      analysis_metadata: null,
    };
  }

  if (typeof raw === "object") {
    const asObject = raw as Record<string, unknown>;
    const rawMetadata =
      asObject.analysis_metadata &&
      typeof asObject.analysis_metadata === "object" &&
      !Array.isArray(asObject.analysis_metadata)
        ? (asObject.analysis_metadata as Record<string, unknown>)
        : null;
    const rawPortfolioText =
      asObject.portfolio_text_excerpt ?? asObject.portfolioTextExcerpt;
    const portfolioTextExcerpt =
      typeof rawPortfolioText === "string" && rawPortfolioText.trim().length > 0
        ? rawPortfolioText.trim()
        : null;

    const textLength = Number(
      rawMetadata?.text_length ?? rawMetadata?.textLength,
    );
    const confidenceScore = Number(
      rawMetadata?.confidence_score ?? rawMetadata?.confidenceScore,
    );
    const processingTime = Number(
      rawMetadata?.processing_time ?? rawMetadata?.processingTime,
    );

    const metadata = rawMetadata
      ? {
          ...(Number.isFinite(textLength) ? { text_length: textLength } : {}),
          ...(Number.isFinite(confidenceScore)
            ? { confidence_score: confidenceScore }
            : {}),
          ...(Number.isFinite(processingTime)
            ? { processing_time: processingTime }
            : {}),
        }
      : null;

    return {
      recommendations: normalizeStringList(asObject.recommendations),
      detected_interests: normalizeStringList(asObject.detected_interests),
      portfolio_text_excerpt: portfolioTextExcerpt,
      analysis_metadata: metadata,
    };
  }

  return {
    recommendations: [],
    detected_interests: [],
    portfolio_text_excerpt: null,
    analysis_metadata: null,
  };
}

function serializeAnalysisWithComputedFields(analysis: any) {
  const extras = parseAnalysisExtras(analysis.recommended_courses);
  return {
    ...analysis,
    id: analysis.id.toString(),
    overview: typeof analysis.advice === "string" ? analysis.advice : null,
    recommendations: extras.recommendations,
    detected_interests: extras.detected_interests,
    portfolio_text_excerpt: extras.portfolio_text_excerpt,
    analysis_metadata: extras.analysis_metadata,
  };
}

// GET /api/db/analysis?user_id=xxx&all=true&id=xxx
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const fetchAll = searchParams.get("all") === "true";
    const light = searchParams.get("light") === "true";
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const take =
      Number.isFinite(limit) && (limit as number) > 0 ? limit : undefined;
    const analysisId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 },
      );
    }

    // Fetch specific analysis by ID
    if (analysisId) {
      const analysis = await prisma.portfolio_analysis.findFirst({
        where: { id: BigInt(analysisId), user_id: userId },
      });
      if (!analysis) {
        return NextResponse.json(
          { error: "Analysis not found" },
          { status: 404 },
        );
      }
      return NextResponse.json(serializeAnalysisWithComputedFields(analysis));
    }

    // Fetch all analysis history
    if (fetchAll) {
      const [analyses, uploads, programs] = await Promise.all([
        prisma.portfolio_analysis.findMany({
          where: { user_id: userId },
          orderBy: { analyzed_at: "desc" },
          ...(take ? { take } : {}),
          ...(light
            ? {
                select: {
                  id: true,
                  analyzed_at: true,
                  file_url: true,
                },
              }
            : {}),
        }),
        prisma.portfolio_uploads.findMany({
          where: { user_id: userId },
          select: {
            file_url: true,
            portfolio_name: true,
            status: true,
          },
        }),
        light
          ? Promise.resolve([])
          : prisma.programs.findMany({
              where: {
                OR: [
                  { program_name_th: { not: null } },
                  { field_name_th: { not: null } },
                  { faculty_name_th: { not: null } },
                ],
              },
              select: {
                id: true,
                university_id: true,
                university_name_th: true,
                university_name_en: true,
                faculty_name_th: true,
                faculty_name_en: true,
                group_field_th: true,
                field_name_th: true,
                field_name_en: true,
                program_name_th: true,
                program_name_en: true,
                program_type_name_th: true,
                logo_url: true,
                major_acceptance_number: true,
              },
            }),
      ]);

      const uploadByUrl = new Map(
        uploads
          .filter((upload) => !!upload.file_url)
          .map((upload) => [upload.file_url, upload]),
      );

      // Convert BigInt to string for JSON serialization
      const response = NextResponse.json({
        data: analyses.map((analysis, index) => {
          const serialized = serializeAnalysisWithComputedFields(analysis);
          const matchedUpload = analysis.file_url
            ? uploadByUrl.get(analysis.file_url)
            : undefined;
          const version = analyses.length - index;

          // Extract university info from recommended_faculties with fallback to recommended_courses and advice text
          const { universityName, programName, logoUrl } =
            extractFirstFacultyMeta(
              analysis.recommended_faculties,
              analysis.recommended_courses,
              analysis.advice,
            );

          if (light) {
            return {
              id: analysis.id.toString(),
              analyzed_at: analysis.analyzed_at,
              file_url: analysis.file_url ?? null,
              version,
              version_label: `v${version}`,
              status: normalizeAnalysisStatus(matchedUpload?.status),
              portfolio_name: matchedUpload?.portfolio_name || null,
              submission_university_name: universityName,
              submission_program_name: programName,
              submission_logo_url: logoUrl,
            };
          }

          const skillScores = normalizeSkillScores(analysis.subject_scores);
          const analysisHints = extractPortfolioHintsFromAnalysis(
            analysis.recommended_faculties,
            serialized.detected_interests,
            serialized.overview,
          );
          const portfolioTextHints = extractStructuredPortfolioHints(
            serialized.portfolio_text_excerpt,
          );
          const portfolioHints = [...analysisHints, ...portfolioTextHints];
          const recommendedPrograms = recommendProgramsBySkills(
            programs,
            skillScores,
            1,
            {
              portfolioHints,
              detectedInterests: serialized.detected_interests,
              strictPortfolioHint: portfolioHints.length > 0,
            },
          );
          const submissionProgram = recommendedPrograms[0] ?? null;
          const fallbackFaculty = extractFirstFacultyMeta(
            analysis.recommended_faculties,
            analysis.recommended_courses,
            analysis.advice,
          );

          return {
            ...serialized,
            version,
            version_label: `v${version}`,
            status: normalizeAnalysisStatus(matchedUpload?.status),
            portfolio_name: matchedUpload?.portfolio_name || null,
            submission_university_name:
              submissionProgram?.university_name_th ||
              submissionProgram?.university_name_en ||
              fallbackFaculty.universityName ||
              null,
            submission_program_name:
              submissionProgram?.program_name_th ||
              submissionProgram?.field_name_th ||
              submissionProgram?.faculty_name_th ||
              fallbackFaculty.programName ||
              null,
            submission_logo_url:
              submissionProgram?.logo_url || fallbackFaculty.logoUrl || null,
          };
        }),
      });
    }

    // Fetch latest analysis (default)
    const analysis = await prisma.portfolio_analysis.findFirst({
      where: { user_id: userId },
      orderBy: { analyzed_at: "desc" },
    });

    if (!analysis) {
      return NextResponse.json(null);
    }

    return NextResponse.json(serializeAnalysisWithComputedFields(analysis));
  } catch (error) {
    console.error("Error fetching analysis:", error);
    return NextResponse.json(
      { error: "Failed to fetch analysis" },
      { status: 500 },
    );
  }
}

// POST /api/db/analysis - Save analysis result
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      subject_scores,
      recommended_faculties,
      strengths,
      weaknesses,
      recommendations,
      overview,
      detected_interests,
      portfolio_text_excerpt,
      analysis_metadata,
      file_url,
    } = body;

    const safeRecommendations = sanitizeStringListForDb(
      recommendations,
      30,
      500,
    );
    const safeDetectedInterests = sanitizeStringListForDb(
      detected_interests,
      20,
      120,
    );
    const safeStrengths = sanitizeStringListForDb(strengths, 20, 500);
    const safeWeaknesses = sanitizeStringListForDb(weaknesses, 20, 500);
    const safeOverview = sanitizeTextForDb(overview, 5000);
    const safeAnalysisMetadata =
      analysis_metadata &&
      typeof analysis_metadata === "object" &&
      !Array.isArray(analysis_metadata)
        ? (analysis_metadata as Record<string, unknown>)
        : null;
    const safePortfolioTextExcerpt = sanitizeTextForDb(
      portfolio_text_excerpt,
      12000,
    );
    const safeSubjectScores = sanitizeJsonValue(subject_scores) ?? {};
    let safeRecommendedFaculties =
      sanitizeJsonValue(recommended_faculties) ?? [];

    // Auto-populate university info if not present in recommended_faculties
    const hasUniversityInfo =
      Array.isArray(safeRecommendedFaculties) &&
      safeRecommendedFaculties.length > 0 &&
      safeRecommendedFaculties[0]?.university_name_th;

    if (!hasUniversityInfo && Object.keys(safeSubjectScores).length > 0) {
      try {
        // Fetch programs for matching
        const programs = await prisma.programs.findMany({
          where: {
            OR: [
              { program_name_th: { not: null } },
              { field_name_th: { not: null } },
              { faculty_name_th: { not: null } },
            ],
          },
          select: {
            id: true,
            university_id: true,
            university_name_th: true,
            university_name_en: true,
            faculty_name_th: true,
            faculty_name_en: true,
            group_field_th: true,
            field_name_th: true,
            field_name_en: true,
            program_name_th: true,
            program_name_en: true,
            program_type_name_th: true,
            logo_url: true,
            major_acceptance_number: true,
          },
          take: 1000, // Limit to reduce load
        });

        const skillScores = normalizeSkillScores(safeSubjectScores);
        const analysisHints = extractPortfolioHintsFromAnalysis(
          safeRecommendedFaculties,
          safeDetectedInterests,
          safeOverview,
        );
        const portfolioTextHints = extractStructuredPortfolioHints(
          safePortfolioTextExcerpt,
        );
        const portfolioHints = [...analysisHints, ...portfolioTextHints];

        const recommendedPrograms = recommendProgramsBySkills(
          programs,
          skillScores,
          1,
          {
            portfolioHints,
            detectedInterests: safeDetectedInterests,
            strictPortfolioHint: portfolioHints.length > 0,
          },
        );

        // If we found a match, add university info to recommended_faculties
        if (recommendedPrograms.length > 0) {
          const topMatch = recommendedPrograms[0];
          const existingFaculties = Array.isArray(safeRecommendedFaculties)
            ? safeRecommendedFaculties
            : [];
          safeRecommendedFaculties = [
            {
              university_id: topMatch.university_id,
              university_name_th: topMatch.university_name_th,
              university_name_en: topMatch.university_name_en,
              faculty_name_th: topMatch.faculty_name_th,
              faculty_name_en: topMatch.faculty_name_en,
              program_name_th: topMatch.program_name_th,
              program_name_en: topMatch.program_name_en,
              field_name_th: topMatch.field_name_th,
              field_name_en: topMatch.field_name_en,
              logo_url: topMatch.logo_url,
              match_percentage: topMatch.match_percentage,
            },
            ...existingFaculties,
          ];
          console.log(
            "Auto-populated university info from top match:",
            topMatch.university_name_th,
          );
        }
      } catch (error) {
        console.error("Error auto-populating university info:", error);
        // Continue without university info - user can add it manually later
      }
    }

    console.log("Saving analysis for user:", session.user.id);
    console.log("Data:", {
      subject_scores,
      recommended_faculties,
      strengths: safeStrengths,
      weaknesses: safeWeaknesses,
      recommendations: safeRecommendations,
      overview: safeOverview,
      detected_interests: safeDetectedInterests,
      portfolio_text_excerpt: safePortfolioTextExcerpt ? "[stored]" : null,
      file_url,
    });

    const analysis = await prisma.portfolio_analysis.create({
      data: {
        user_id: session.user.id,
        subject_scores: safeSubjectScores as any,
        recommended_faculties: safeRecommendedFaculties as any,
        strengths: safeStrengths,
        weaknesses: safeWeaknesses,
        advice: safeOverview,
        recommended_courses: {
          recommendations: safeRecommendations,
          detected_interests: safeDetectedInterests,
          portfolio_text_excerpt: safePortfolioTextExcerpt,
          analysis_metadata: sanitizeJsonValue(safeAnalysisMetadata),
        } as any,
        file_url: sanitizeTextForDb(file_url, 2000),
        analyzed_at: new Date(),
      },
    });

    console.log("Analysis saved:", analysis);

    return NextResponse.json(serializeAnalysisWithComputedFields(analysis));
  } catch (error) {
    console.error("Error saving analysis:", error);
    return NextResponse.json(
      {
        error: "Failed to save analysis",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// DELETE /api/db/analysis?id=xxx - Delete analysis and related upload
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get("id");

    if (!analysisId) {
      return NextResponse.json(
        { error: "Analysis ID is required" },
        { status: 400 },
      );
    }

    // First get the analysis to find file_url
    const analysis = await prisma.portfolio_analysis.findFirst({
      where: { id: BigInt(analysisId), user_id: session.user.id },
    });

    if (analysis?.file_url) {
      // Delete related upload by file_url
      try {
        await prisma.portfolio_uploads.deleteMany({
          where: { user_id: session.user.id, file_url: analysis.file_url },
        });
      } catch (e) {
        // Ignore if no upload exists
      }
    }

    // Delete the analysis
    await prisma.portfolio_analysis.deleteMany({
      where: { id: BigInt(analysisId), user_id: session.user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting analysis:", error);
    return NextResponse.json(
      { error: "Failed to delete analysis" },
      { status: 500 },
    );
  }
}
