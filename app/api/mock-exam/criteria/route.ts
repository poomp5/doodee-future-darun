import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/mock-exam/criteria - Fetch subjects and faculty criteria from DB
export async function GET(request: NextRequest) {
  try {
    const [subjects, criteria] = await Promise.all([
      prisma.mock_exam_subjects.findMany({
        where: { is_active: true },
        orderBy: { display_order: "asc" },
        select: {
          id: true,
          code: true,
          name: true,
          exam_type: true,
          display_order: true,
        },
      }),
      prisma.mock_exam_faculty_criteria.findMany({
        where: { is_active: true },
        orderBy: { display_order: "asc" },
        select: {
          id: true,
          faculty: true,
          university: true,
          requirements: true,
          display_order: true,
        },
      }),
    ]);

    return NextResponse.json({
      subjects,
      facultyCriteria: criteria,
    });
  } catch (error) {
    console.error("Error fetching mock exam criteria:", error);
    return NextResponse.json(
      { error: "Failed to fetch criteria" },
      { status: 500 }
    );
  }
}
