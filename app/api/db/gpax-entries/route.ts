import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET - Get GPAX entries for user
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const entries = await prisma.user_gpax_entries.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: 'asc' },
  });

  return NextResponse.json(entries);
}

// POST - Create new GPAX entry
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { gpa, credits, academic_year } = body;

  if (!gpa || !credits) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const entry = await prisma.user_gpax_entries.create({
    data: {
      user_id: session.user.id,
      gpa: parseFloat(gpa),
      credits: parseFloat(credits),
      academic_year: academic_year || null,
    },
  });

  // Convert Decimal to plain object for JSON serialization
  return NextResponse.json({
    ...entry,
    gpa: entry.gpa.toString(),
    credits: entry.credits.toString(),
  });
}

// PUT - Update GPAX entry
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { id, gpa, credits, academic_year } = body;

  if (!id || !gpa || !credits) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.user_gpax_entries.findFirst({
    where: { id: parseInt(id), user_id: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  const entry = await prisma.user_gpax_entries.update({
    where: { id: parseInt(id) },
    data: {
      gpa: parseFloat(gpa),
      credits: parseFloat(credits),
      academic_year: academic_year || null,
    },
  });

  return NextResponse.json({
    ...entry,
    gpa: entry.gpa.toString(),
    credits: entry.credits.toString(),
  });
}

// DELETE - Delete GPAX entry
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  // Verify ownership
  const existing = await prisma.user_gpax_entries.findFirst({
    where: { id: parseInt(id), user_id: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
  }

  await prisma.user_gpax_entries.delete({
    where: { id: parseInt(id) },
  });

  return NextResponse.json({ success: true });
}
