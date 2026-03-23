import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

// GET /api/mock-exam/scores - Fetch current user's scores grouped by subject (latest per subject)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all user scores, ordered by created_at desc
    const allScores = await prisma.user_scores.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
    });

    // Group by subject, keep only the latest score per subject
    const latestBySubject: Record<string, { score: number; exam_date: string | null; id: string }> = {};
    for (const row of allScores) {
      const subjectKey = row.subject.toUpperCase();
      if (!latestBySubject[subjectKey]) {
        latestBySubject[subjectKey] = {
          score: Number(row.score),
          exam_date: row.exam_date ? row.exam_date.toISOString() : null,
          id: row.id.toString(),
        };
      }
    }

    return NextResponse.json({
      scores: latestBySubject,
      total: allScores.length,
    });
  } catch (error) {
    console.error("Error fetching mock exam scores:", error);
    return NextResponse.json(
      { error: "Failed to fetch scores" },
      { status: 500 }
    );
  }
}

// POST /api/mock-exam/scores - Bulk upsert scores for mock exam
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { scores, examType } = body;

    if (!scores || typeof scores !== "object") {
      return NextResponse.json(
        { error: "scores object is required" },
        { status: 400 }
      );
    }

    // Upsert each score: create new entry for each subject
    const results = [];
    for (const [subject, score] of Object.entries(scores)) {
      if (typeof score !== "number" || score < 0 || score > 100) continue;

      const created = await prisma.user_scores.create({
        data: {
          user_id: userId,
          subject: subject.toUpperCase(),
          score: score,
          max_score: 100,
          exam_date: new Date(),
        },
      });

      results.push({
        id: created.id.toString(),
        subject: created.subject,
        score: Number(created.score),
      });
    }

    return NextResponse.json({
      success: true,
      saved: results.length,
      data: results,
    });
  } catch (error) {
    console.error("Error saving mock exam scores:", error);
    return NextResponse.json(
      { error: "Failed to save scores" },
      { status: 500 }
    );
  }
}
