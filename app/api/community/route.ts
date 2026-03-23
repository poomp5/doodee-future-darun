import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

const serializePost = (post: any, schoolName?: string | null) => ({
  ...post,
  id: post.id?.toString(),
  school_name: schoolName ?? null,
  program_name: post.programs?.program_name_th || post.programs?.program_name_en || null,
  user: post.users
    ? {
        id: post.users.id,
        name: post.users.full_name || post.users.username,
        username: post.users.username,
        image: post.users.profile_image_url,
      }
    : null,
  pages: post.community_pages?.map((p: any) => ({
    id: p.id?.toString(),
    pageNumber: p.page_number || p.pageNumber || p.page_number,
    imageUrl: p.image_url || p.imageUrl,
    aspectRatio: p.aspect_ratio || p.aspectRatio || null,
    isVisible: p.is_visible ?? p.isVisible,
  })),
});

// List community posts with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "12", 10), 1), 50);
    const university = searchParams.get("university");
    const faculty = searchParams.get("faculty");
    const school = searchParams.get("school");
    const programId = searchParams.get("program_id");

    const where: any = { status: "open" };
    if (university) where.university_name = { contains: university, mode: "insensitive" };
    if (faculty) where.faculty_name = { contains: faculty, mode: "insensitive" };
    if (programId) where.program_id = parseInt(programId, 10);

    // Filter by school: find user_ids that have matching school in education history
    if (school) {
      const matchingUsers = await prisma.user_education_history.findMany({
        where: { school_name: { contains: school, mode: "insensitive" } },
        select: { user_id: true },
        distinct: ["user_id"],
      });
      const userIds = matchingUsers.map((u) => u.user_id);
      where.user_id = { in: userIds };
    }

    const [total, posts] = await prisma.$transaction([
      prisma.community_posts.count({ where }),
      prisma.community_posts.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          programs: {
            select: {
              program_name_th: true,
              program_name_en: true,
            },
          },
          community_pages: {
            where: { is_visible: true },
            orderBy: { page_number: "asc" },
          },
          users: {
            select: { id: true, full_name: true, username: true, profile_image_url: true },
          },
        },
      }),
    ]);

    let schoolCount = 0;
    // Map user_id -> school_name for posts in this page
    let userSchoolMap = new Map<string, string>();
    try {
      const ownerIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];

      if (ownerIds.length > 0) {
        const schoolRows = await prisma.user_education_history.findMany({
          where: {
            user_id: { in: ownerIds },
            school_name: { not: "" },
          },
          select: { user_id: true, school_name: true },
          orderBy: { created_at: "desc" },
        });
        // Keep latest school per user
        for (const row of schoolRows) {
          if (!userSchoolMap.has(row.user_id)) {
            userSchoolMap.set(row.user_id, row.school_name);
          }
        }

        // Count distinct schools across ALL matching posts (not just this page)
        const allOwners = await prisma.community_posts.findMany({
          where,
          select: { user_id: true },
          distinct: ["user_id"],
        });
        const allOwnerIds = allOwners.map((r) => r.user_id).filter(Boolean);
        const distinctSchools = await prisma.user_education_history.findMany({
          where: { user_id: { in: allOwnerIds }, school_name: { not: "" } },
          select: { school_name: true },
          distinct: ["school_name"],
        });
        schoolCount = distinctSchools.length;
      }
    } catch (e) {
      // Keep response resilient even if education table shape differs
    }

    // Get ratings for all posts in one query
    let ratingMap = new Map<string, { average: number; count: number }>();
    try {
      const postIds = posts.map((p) => p.id);
      if (postIds.length > 0) {
        const ratings = await prisma.community_ratings.groupBy({
          by: ["post_id"],
          where: { post_id: { in: postIds } },
          _avg: { score: true },
          _count: { score: true },
        });
        ratingMap = new Map(
          ratings.map((r) => [
            r.post_id,
            {
              average: r._avg.score ? Math.round(r._avg.score * 10) / 10 : 0,
              count: r._count.score,
            },
          ])
        );
      }
    } catch (e) {
      // ratings table may not be available yet
    }

    return NextResponse.json({
      data: posts.map((post) => ({
        ...serializePost(post, userSchoolMap.get(post.user_id) ?? null),
        rating: ratingMap.get(post.id) || { average: 0, count: 0 },
      })),
      page,
      limit,
      total,
      schoolCount,
    });
  } catch (error) {
    console.error("Community list error:", error);
    return NextResponse.json({ error: "Failed to fetch community posts" }, { status: 500 });
  }
}

// Create a community post
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      // legacy single-target (backwards compat)
      universityName,
      facultyName,
      fieldName,
      programId,
      // new multi-target array: [{ universityName, facultyName, fieldName }]
      targets,
      watermark = "watermark1",
      status = "open",
      originalFile,
      pages,
    } = body;

    if (!title || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({ error: "Title and at least one page are required" }, { status: 400 });
    }

    const normalizedStatus = status === "closed" ? "closed" : "open";

    // Resolve first target for primary fields (for backwards compat queries)
    const firstTarget = Array.isArray(targets) && targets.length > 0 ? targets[0] : null;
    const resolvedUniversity = firstTarget?.universityName || universityName || null;
    const resolvedFaculty = firstTarget?.facultyName || facultyName || null;
    const resolvedProgramInput = firstTarget?.programId || programId || null;

    const visiblePages = pages.filter((p: any) => p.isVisible !== false);
    const coverImageUrl = visiblePages[0]?.imageUrl || pages[0]?.imageUrl;

    let resolvedProgramId: number | null = null;
    let resolvedField = fieldName || null;
    if (typeof resolvedProgramInput === "number" && Number.isInteger(resolvedProgramInput)) {
      resolvedProgramId = resolvedProgramInput;
    } else if (typeof resolvedProgramInput === "string" && resolvedProgramInput.trim()) {
      const trimmedProgramId = resolvedProgramInput.trim();
      const matchedProgram = await prisma.programs.findFirst({
        where: {
          OR: [
            { program_id: trimmedProgramId },
            ...(/^\d+$/.test(trimmedProgramId) ? [{ id: Number(trimmedProgramId) }] : []),
          ],
        },
        select: { id: true, field_name_th: true, field_name_en: true },
      });
      resolvedProgramId = matchedProgram?.id ?? null;
      resolvedField = matchedProgram?.field_name_th || matchedProgram?.field_name_en || resolvedField;
    }

    const created = await prisma.$transaction(async (tx) => {
      const post = await tx.community_posts.create({
        data: {
          user_id: session.user.id,
          title,
          description,
          university_name: resolvedUniversity,
          faculty_name: resolvedFaculty,
          field_name: resolvedField,
          program_id: resolvedProgramId,
          // Store all targets as JSON in description extras or use university_name for primary
          status: normalizedStatus,
          watermark,
          original_file_url: originalFile?.url || null,
          cover_image_url: coverImageUrl || null,
        },
      });

      await tx.community_pages.createMany({
        data: pages.map((p: any, idx: number) => ({
          post_id: post.id,
          page_number: p.pageNumber ?? p.page_number ?? idx + 1,
          image_url: p.imageUrl || p.image_url,
          storage_key: p.key || p.storageKey || null,
          aspect_ratio: p.aspectRatio || null,
          is_visible: p.isVisible !== false,
        })),
      });

      return post;
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    console.error("Community create error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
