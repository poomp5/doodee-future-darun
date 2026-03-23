import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export const runtime = 'nodejs';

/**
 * Check if user is admin
 */
async function isAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role === 'admin' || user?.role === 'superadmin';
}

/**
 * GET - List programs with pagination and filters
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 50)
 * - search: string (searches university, faculty, program names)
 * - academic_year: string (filter by academic year)
 * - university_id: string
 * - faculty_id: string
 */
export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const academicYear = searchParams.get('academic_year') || '';
    const universityId = searchParams.get('university_id') || '';
    const facultyId = searchParams.get('faculty_id') || '';

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { university_name_th: { contains: search, mode: 'insensitive' } },
        { university_name_en: { contains: search, mode: 'insensitive' } },
        { faculty_name_th: { contains: search, mode: 'insensitive' } },
        { faculty_name_en: { contains: search, mode: 'insensitive' } },
        { program_name_th: { contains: search, mode: 'insensitive' } },
        { program_name_en: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Academic year filter
    if (academicYear) {
      where.academic_years = {
        has: academicYear,
      };
    }

    // University filter
    if (universityId) {
      where.university_id = universityId;
    }

    // Faculty filter
    if (facultyId) {
      where.faculty_id = facultyId;
    }

    // Get total count
    const total = await prisma.programs.count({ where });

    // Get paginated data
    const programs = await prisma.programs.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { university_name_th: 'asc' },
        { faculty_name_th: 'asc' },
        { program_name_th: 'asc' },
      ],
    });

    // Fetch file paths from universities table
    const programsWithFiles = await Promise.all(
      programs.map(async (program) => {
        if (program.university_id) {
          const university = await prisma.universities.findUnique({
            where: { university_id: program.university_id },
            select: {
              file_path_1: true,
              file_path_2: true,
              file_path_3: true,
              file_path_4: true,
            },
          });

          return {
            ...program,
            file_path_1: university?.file_path_1 || null,
            file_path_2: university?.file_path_2 || null,
            file_path_3: university?.file_path_3 || null,
            file_path_4: university?.file_path_4 || null,
          };
        }
        return program;
      })
    );

    return NextResponse.json({
      programs: programsWithFiles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('GET programs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete programs (bulk or single)
 * Body: { ids: number[] } or { id: number }
 */
export async function DELETE(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { ids, id } = body;

    if (!ids && !id) {
      return NextResponse.json(
        { error: 'ids or id is required' },
        { status: 400 }
      );
    }

    // Delete single or multiple
    if (ids && Array.isArray(ids)) {
      await prisma.programs.deleteMany({
        where: {
          id: { in: ids },
        },
      });

      return NextResponse.json({
        success: true,
        message: `Deleted ${ids.length} programs`,
      });
    } else if (id) {
      await prisma.programs.delete({
        where: { id: parseInt(id) },
      });

      return NextResponse.json({
        success: true,
        message: 'Program deleted',
      });
    }
  } catch (error) {
    console.error('DELETE programs error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
