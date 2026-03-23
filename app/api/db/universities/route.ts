import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const universities = await prisma.universities.findMany({
      select: {
        id: true,
        university_name_th: true,
        university_name_en: true,
        logo_url: true,
      },
      orderBy: {
        university_name_th: "asc",
      },
    });

    const formattedUniversities = universities.map((u) => ({
      id: u.id.toString(),
      name_th: u.university_name_th,
      name_en: u.university_name_en,
      logo_url: u.logo_url,
    }));

    const response = NextResponse.json({
      universities: formattedUniversities,
    });

    // Cache for 1 hour (universities data rarely changes)
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=3600, stale-while-revalidate=7200",
    );

    return response;
  } catch (error) {
    console.error("Error fetching universities:", error);
    return NextResponse.json(
      { error: "Failed to fetch universities" },
      { status: 500 },
    );
  }
}

export const revalidate = 3600; // Revalidate every hour
