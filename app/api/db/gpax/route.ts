import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

// GET /api/db/gpax?user_id=xxx - Get all GPAX entries for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const entries = await prisma.user_gpax_entries.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'asc' },
    });

    // Calculate total GPAX
    let totalPoints = 0;
    let totalCredits = 0;
    entries.forEach((entry) => {
      const gpa = Number(entry.gpa) || 0;
      const credits = Number(entry.credits) || 0;
      totalPoints += gpa * credits;
      totalCredits += credits;
    });
    const gpax = totalCredits > 0 ? totalPoints / totalCredits : 0;

    return NextResponse.json({
      data: entries,
      gpax: gpax,
      totalCredits: totalCredits
    });
  } catch (error) {
    console.error('Error fetching GPAX entries:', error);
    return NextResponse.json({ error: 'Failed to fetch GPAX entries' }, { status: 500 });
  }
}

// POST /api/db/gpax - Save all GPAX entries (replace all)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries)) {
      return NextResponse.json({ error: 'entries must be an array' }, { status: 400 });
    }

    // Delete existing entries for this user
    await prisma.user_gpax_entries.deleteMany({
      where: { user_id: session.user.id },
    });

    // Insert new entries
    const insertedEntries = [];
    for (const entry of entries) {
      const gpa = Number(entry.gpa) || 0;
      const credits = Number(entry.credits) || 0;

      if (gpa > 0 || credits > 0) {
        const inserted = await prisma.user_gpax_entries.create({
          data: {
            user_id: session.user.id,
            gpa: gpa,
            credits: credits,
            academic_year: entry.academicYear || '',
          },
        });
        insertedEntries.push(inserted);
      }
    }

    // Calculate GPAX
    let totalPoints = 0;
    let totalCredits = 0;
    insertedEntries.forEach((entry) => {
      const gpa = Number(entry.gpa) || 0;
      const credits = Number(entry.credits) || 0;
      totalPoints += gpa * credits;
      totalCredits += credits;
    });
    const gpax = totalCredits > 0 ? totalPoints / totalCredits : 0;

    // Update user's GPAX in users table
    await prisma.users.update({
      where: { id: session.user.id },
      data: { gpax: gpax },
    });

    return NextResponse.json({
      data: insertedEntries,
      gpax: gpax,
      totalCredits: totalCredits
    });
  } catch (error) {
    console.error('Error saving GPAX entries:', error);
    return NextResponse.json({ error: 'Failed to save GPAX entries' }, { status: 500 });
  }
}

// DELETE /api/db/gpax - Delete all GPAX entries for current user
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.user_gpax_entries.deleteMany({
      where: { user_id: session.user.id },
    });

    // Reset user's GPAX
    await prisma.users.update({
      where: { id: session.user.id },
      data: { gpax: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting GPAX entries:', error);
    return NextResponse.json({ error: 'Failed to delete GPAX entries' }, { status: 500 });
  }
}
