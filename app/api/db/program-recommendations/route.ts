import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  extractPortfolioHintsFromAnalysis,
  extractStructuredPortfolioHints,
  recommendProgramsBySkills,
} from "@/lib/program-recommendation";

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawSkillScores = body?.skill_scores ?? body?.subject_scores;
    const skillScores =
      rawSkillScores && typeof rawSkillScores === "object" && !Array.isArray(rawSkillScores)
        ? rawSkillScores
        : {};
    const requestedLimit = Number(body?.limit);
    const limit = Number.isFinite(requestedLimit) ? requestedLimit : 8;
    const detectedInterests = normalizeStringList(
      body?.detected_interests ?? body?.detectedInterests,
    );
    const customHints = normalizeStringList(body?.portfolio_hints ?? body?.portfolioHints);
    const analysisHints = extractPortfolioHintsFromAnalysis(
      body?.recommended_faculties ?? body?.recommendedFaculties,
      detectedInterests,
      body?.overview,
    );
    const portfolioTextHints = extractStructuredPortfolioHints(
      body?.portfolio_text ?? body?.portfolioText,
    );
    const portfolioHints = [...analysisHints, ...portfolioTextHints, ...customHints];
    const strictPortfolioHint = body?.strict_portfolio_hint !== false;

    if (Object.keys(skillScores).length === 0 && portfolioHints.length === 0) {
      return NextResponse.json(
        { error: "skill_scores or portfolio hints are required" },
        { status: 400 },
      );
    }

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
    });

    const recommendations = recommendProgramsBySkills(programs, skillScores, limit, {
      portfolioHints,
      detectedInterests,
      strictPortfolioHint,
    });
    return NextResponse.json({ data: recommendations });
  } catch (error) {
    console.error("Error generating program recommendations:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 },
    );
  }
}
