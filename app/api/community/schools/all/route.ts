import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

let cachedSchools: string[] | null = null;

export async function GET() {
  try {
    if (!cachedSchools) {
      const filePath = path.join(process.cwd(), "School.json");
      const raw = await readFile(filePath, "utf-8");
      const data: { name?: string }[] = JSON.parse(raw);
      const names = data
        .map((s) => s?.name)
        .filter((n): n is string => typeof n === "string" && n.trim().length > 0);
      cachedSchools = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, "th"));
    }
    return NextResponse.json({ schools: cachedSchools });
  } catch (error) {
    console.error("Schools all error:", error);
    return NextResponse.json({ schools: [] });
  }
}
