import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateApiKey,
  requireScope,
  extractUserId,
  logUsage,
  authError,
} from "@/lib/api-key";
import { OPTIONS, corsOk, corsError, withCors } from "@/lib/cors";

export { OPTIONS };

// GET /api/v1/dream-faculties?user_id=<uuid>
// Scope: read:dream-faculties
// ดึงรายการคณะในฝันของ user พร้อมข้อมูลโปรแกรม
export async function GET(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (authError(auth)) return withCors(auth.response);

  const scopeErr = requireScope(auth, "read:dream-faculties");
  if (scopeErr) return withCors(scopeErr);

  const userId =
    new URL(req.url).searchParams.get("user_id") ?? extractUserId(req);
  if (!userId)
    return corsError(
      "user_id query param or X-Doodee-User-Id header required",
      400,
    );

  try {
    const data = await prisma.$queryRaw<any[]>`
      SELECT
        uip.id,
        uip.user_id,
        uip.program_id,
        uip.priority,
        uip.created_at,
        p.university_name_th,
        p.university_name_en,
        p.faculty_name_th,
        p.faculty_name_en,
        p.field_name_th,
        p.field_name_en,
        p.program_name_th,
        p.program_name_en,
        p.program_id        AS program_code,
        p.logo_url,
        p.major_acceptance_number  AS program_total_seats,
        p.number_acceptance_mko2   AS r1_admission_quota,
        p.graduate_rate,
        p.employment_rate,
        p.median_salary
      FROM user_interested_programs uip
      LEFT JOIN programs p ON uip.program_id = p.id
      WHERE uip.user_id = ${userId}
      ORDER BY uip.priority ASC
    `;

    logUsage(
      auth.keyId,
      "/api/v1/dream-faculties",
      "GET",
      200,
      req.headers.get("x-forwarded-for"),
    );
    return corsOk({ data });
  } catch {
    return corsError("Failed to fetch dream faculties", 500);
  }
}

// POST /api/v1/dream-faculties
// Scope: write:dream-faculties
// Header: X-Doodee-User-Id
// Body: { program_id: number, priority?: number }
export async function POST(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (authError(auth)) return withCors(auth.response);

  const scopeErr = requireScope(auth, "write:dream-faculties");
  if (scopeErr) return withCors(scopeErr);

  const userId = extractUserId(req);
  if (!userId) return corsError("X-Doodee-User-Id header required", 400);

  const body = await req.json().catch(() => ({}));
  const { program_id, priority } = body;
  if (!program_id) return corsError("program_id required", 400);

  try {
    const result = await prisma.user_interested_programs.create({
      data: {
        user_id: userId,
        program_id: parseInt(program_id, 10),
        priority: priority ?? 99,
      },
    });
    logUsage(
      auth.keyId,
      "/api/v1/dream-faculties",
      "POST",
      201,
      req.headers.get("x-forwarded-for"),
    );
    return corsOk({ data: result }, 201);
  } catch (err: any) {
    if (err?.code === "P2002") return corsError("Program already in list", 409);
    return corsError("Failed to add program", 500);
  }
}

// DELETE /api/v1/dream-faculties?id=<row_id>
// Scope: write:dream-faculties
// Header: X-Doodee-User-Id
export async function DELETE(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (authError(auth)) return withCors(auth.response);

  const scopeErr = requireScope(auth, "write:dream-faculties");
  if (scopeErr) return withCors(scopeErr);

  const userId = extractUserId(req);
  if (!userId) return corsError("X-Doodee-User-Id header required", 400);

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const programId = searchParams.get("program_id");
  if (!id && !programId)
    return corsError("id or program_id query param required", 400);

  try {
    if (id) {
      await prisma.user_interested_programs.deleteMany({
        where: { id: parseInt(id, 10), user_id: userId },
      });
    } else {
      await prisma.user_interested_programs.deleteMany({
        where: { program_id: parseInt(programId!, 10), user_id: userId },
      });
    }
    logUsage(
      auth.keyId,
      "/api/v1/dream-faculties",
      "DELETE",
      200,
      req.headers.get("x-forwarded-for"),
    );
    return corsOk({ success: true });
  } catch {
    return corsError("Failed to remove program", 500);
  }
}

// PUT /api/v1/dream-faculties
// Scope: write:dream-faculties
// Header: X-Doodee-User-Id
// Body: { updates: [{ id: number, priority: number }] }
// เรียงลำดับ priority ใหม่
export async function PUT(req: NextRequest) {
  const auth = await validateApiKey(req);
  if (authError(auth)) return withCors(auth.response);

  const scopeErr = requireScope(auth, "write:dream-faculties");
  if (scopeErr) return withCors(scopeErr);

  const userId = extractUserId(req);
  if (!userId) return corsError("X-Doodee-User-Id header required", 400);

  const body = await req.json().catch(() => ({}));
  const { updates } = body;
  if (!Array.isArray(updates)) return corsError("updates array required", 400);

  try {
    for (const u of updates) {
      await prisma.user_interested_programs.updateMany({
        where: { id: u.id, user_id: userId },
        data: { priority: u.priority },
      });
    }
    logUsage(
      auth.keyId,
      "/api/v1/dream-faculties",
      "PUT",
      200,
      req.headers.get("x-forwarded-for"),
    );
    return corsOk({ success: true });
  } catch {
    return corsError("Failed to update priorities", 500);
  }
}
