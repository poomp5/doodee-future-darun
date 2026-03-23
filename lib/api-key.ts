import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export function hashApiKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export type AuthResult =
  | { ok: true; keyId: number; scopes: string[]; userId?: string }
  | { ok: false; response: NextResponse };

/** ตรวจ API Key จาก header Authorization: Bearer <key> หรือ X-Api-Key */
export async function validateApiKey(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  const rawKey = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : (req.headers.get("X-Api-Key") ?? null);

  if (!rawKey) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "API key required",
          hint: "Set Authorization: Bearer <key> or X-Api-Key header",
        },
        { status: 401 },
      ),
    };
  }

  const keyHash = hashApiKey(rawKey);
  const apiKey = await prisma.api_keys.findUnique({
    where: { key_hash: keyHash, is_active: true },
  });

  if (!apiKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Invalid or inactive API key" },
        { status: 401 },
      ),
    };
  }

  if (apiKey.expires_at && apiKey.expires_at < new Date()) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "API key has expired" },
        { status: 401 },
      ),
    };
  }

  // Rate limit: count requests in last 60s
  const since = new Date(Date.now() - 60_000);
  const recentCount = await prisma.api_usage.count({
    where: { api_key_id: apiKey.id, created_at: { gte: since } },
  });

  if (recentCount >= apiKey.rate_limit) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Rate limit exceeded",
          limit: apiKey.rate_limit,
          window_seconds: 60,
        },
        {
          status: 429,
          headers: {
            "Retry-After": "60",
            "X-RateLimit-Limit": String(apiKey.rate_limit),
            "X-RateLimit-Remaining": "0",
          },
        },
      ),
    };
  }

  // อัป last_used async (non-blocking)
  void prisma.api_keys.update({
    where: { id: apiKey.id },
    data: { last_used_at: new Date() },
  });

  return { ok: true, keyId: apiKey.id, scopes: apiKey.scopes };
}

/** แปลง AuthResult ที่ fail เป็น NextResponse | null (ใช้แทน !auth.ok เพื่อให้ TypeScript narrow ได้) */
export function authError(
  auth: AuthResult,
): auth is { ok: false; response: NextResponse } {
  return !auth.ok;
}

/** ตรวจ scope ที่ต้องการ */
export function requireScope(
  auth: AuthResult,
  scope: string,
): NextResponse | null {
  const scopes = (auth as { ok: true; scopes: string[] }).scopes ?? [];
  if (!scopes.includes(scope)) {
    return NextResponse.json(
      { error: `Scope '${scope}' required`, granted: scopes },
      { status: 403 },
    );
  }
  return null;
}

/**
 * ดึง user_id จาก header X-Doodee-User-Id
 * dekgp.com ต้องส่ง UUID ของ user (จาก doodee accounts) มาใน header นี้
 */
export function extractUserId(req: NextRequest): string | null {
  return req.headers.get("X-Doodee-User-Id");
}

/** Log การใช้งาน (non-blocking) */
export function logUsage(
  keyId: number,
  endpoint: string,
  method: string,
  status: number,
  ip?: string | null,
): void {
  void prisma.api_usage.create({
    data: { api_key_id: keyId, endpoint, method, status, ip: ip ?? null },
  });
}
