import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { hashApiKey } from "@/lib/api-key";
import { auth } from "@/auth";

// POST /api/admin/api-keys - สร้าง API key ใหม่
// ต้อง login ด้วย account ที่มี role = "admin"
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ตรวจ admin role
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "admin") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const { name, owner_email, rate_limit, scopes, expires_at } = body;

  if (!name || !owner_email) {
    return NextResponse.json({ error: "name and owner_email required" }, { status: 400 });
  }

  const rawKey = "df_live_" + randomBytes(32).toString("hex");
  const keyHash = hashApiKey(rawKey);

  const created = await prisma.api_keys.create({
    data: {
      key_hash: keyHash,
      name,
      owner_email,
      rate_limit: rate_limit ?? 60,
      scopes: scopes ?? ["read:exams", "write:attempts", "read:attempts", "read:dream-faculties", "write:dream-faculties"],
      expires_at: expires_at ? new Date(expires_at) : null,
    },
  });

  // key จริงแสดงครั้งเดียว - ไม่มีทางเรียกดูภายหลังได้
  return NextResponse.json({ key: rawKey, key_id: created.id, name: created.name }, { status: 201 });
}

// GET /api/admin/api-keys - ดูรายการ keys ทั้งหมด (ไม่แสดง key จริง)
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.users.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const keys = await prisma.api_keys.findMany({
    select: {
      id: true, name: true, owner_email: true,
      is_active: true, rate_limit: true, scopes: true,
      last_used_at: true, created_at: true, expires_at: true,
      _count: { select: { api_usage: true } },
    },
    orderBy: { created_at: "desc" },
  });

  return NextResponse.json({ data: keys });
}

// PATCH /api/admin/api-keys - toggle is_active
// Body: { id: number, is_active: boolean }
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.users.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const { id, is_active } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updated = await prisma.api_keys.update({
    where: { id },
    data: { is_active },
    select: { id: true, name: true, is_active: true },
  });
  return NextResponse.json({ data: updated });
}
