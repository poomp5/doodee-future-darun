import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

type ProgramRecord = {
  university_name_th?: string;
  university_name_en?: string;
  faculty_name_th?: string;
  faculty_name_en?: string;
  field_name_th?: string;
  field_name_en?: string;
  program_id?: string;
  program_name_th?: string;
  program_name_en?: string;
};

let allRecords: ProgramRecord[] | null = null;
let cachedUniversities: { th: string; en: string }[] | null = null;

async function loadRecords() {
  if (allRecords) return allRecords;
  const filePath = path.join(process.cwd(), "universities.json");
  const raw = await readFile(filePath, "utf-8");
  allRecords = JSON.parse(raw) as ProgramRecord[];
  return allRecords;
}

async function getUniversities() {
  if (cachedUniversities) return cachedUniversities;
  const records = await loadRecords();
  const map = new Map<string, string>();
  for (const r of records) {
    if (r.university_name_th) map.set(r.university_name_th, r.university_name_en || "");
  }
  cachedUniversities = [...map.entries()]
    .map(([th, en]) => ({ th, en }))
    .sort((a, b) => a.th.localeCompare(b.th, "th"));
  return cachedUniversities;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const university = searchParams.get("university");

    const records = await loadRecords();

    if (university) {
      const byUni = records.filter((r) => r.university_name_th === university);
      const faculty = searchParams.get("faculty");

      if (faculty) {
        const programMap = new Map<string, { id: string; th: string; en: string }>();
        for (const r of byUni) {
          if (
            r.faculty_name_th === faculty &&
            r.program_id &&
            r.program_name_th
          ) {
            programMap.set(r.program_id, {
              id: r.program_id,
              th: r.program_name_th,
              en: r.program_name_en || "",
            });
          }
        }
        return NextResponse.json({
          programs: [...programMap.values()].sort((a, b) => a.th.localeCompare(b.th, "th")),
        });
      }

      // Only university selected - return faculties
      const facMap = new Map<string, string>();
      for (const r of byUni) {
        if (r.faculty_name_th) facMap.set(r.faculty_name_th, r.faculty_name_en || "");
      }
      return NextResponse.json({
        faculties: [...facMap.entries()]
          .map(([th, en]) => ({ th, en }))
          .sort((a, b) => a.th.localeCompare(b.th, "th")),
      });
    }

    // No university filter - return all universities only
    const universities = await getUniversities();
    return NextResponse.json({ universities });
  } catch (error) {
    console.error("Community filters error:", error);
    return NextResponse.json({ error: "Failed to load filters" }, { status: 500 });
  }
}
