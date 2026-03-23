import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function canAccessAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;

  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return (
    user?.role === "admin" ||
    user?.role === "superadmin" ||
    user?.role === "moderator"
  );
}

export async function GET(request: NextRequest) {
  try {
    if (!(await canAccessAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 300);
    const searchFilter = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { username: { contains: search, mode: "insensitive" as const } },
            { full_name: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const matchingUserIds = searchFilter
      ? (
          await prisma.users.findMany({
            where: searchFilter,
            select: { id: true },
          })
        ).map((user) => user.id)
      : [];

    const uploadsWhere = search
      ? {
          OR: [
            { portfolio_name: { contains: search, mode: "insensitive" as const } },
            { file_type: { contains: search, mode: "insensitive" as const } },
            { file_url: { contains: search, mode: "insensitive" as const } },
            ...(matchingUserIds.length ? [{ user_id: { in: matchingUserIds } }] : []),
          ],
        }
      : undefined;

    const [totalCount, uploads, last30DaysUploads] = await Promise.all([
      prisma.portfolio_uploads.count({
        where: uploadsWhere,
      }),
      prisma.portfolio_uploads.findMany({
        where: uploadsWhere,
        orderBy: { created_at: "desc" },
        take: limit,
      }),
      prisma.portfolio_uploads.findMany({
        where: {
          ...(uploadsWhere ?? {}),
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          },
        },
        select: {
          created_at: true,
        },
      }),
    ]);

    const userIds = Array.from(new Set(uploads.map((upload) => upload.user_id)));
    const users = userIds.length
      ? await prisma.users.findMany({
          where: {
            id: { in: userIds },
          },
          select: {
            id: true,
            email: true,
            username: true,
            full_name: true,
            profile_image_url: true,
          },
        })
      : [];

    const userMap = new Map(users.map((user) => [user.id, user]));
    const filteredUploads = search
      ? uploads.filter((upload) => {
          const user = userMap.get(upload.user_id);
          return Boolean(
            user ||
              upload.portfolio_name.toLowerCase().includes(search.toLowerCase()) ||
              upload.file_url.toLowerCase().includes(search.toLowerCase()) ||
              (upload.file_type || "").toLowerCase().includes(search.toLowerCase()),
          );
        })
      : uploads;

    const analysisKeys = filteredUploads
      .filter((upload) => !!upload.file_url)
      .map((upload) => ({
        user_id: upload.user_id,
        file_url: upload.file_url,
      }));

    const analyses = analysisKeys.length
      ? await prisma.portfolio_analysis.findMany({
          where: {
            OR: analysisKeys,
          },
          select: {
            user_id: true,
            file_url: true,
            analyzed_at: true,
          },
          orderBy: { analyzed_at: "desc" },
        })
      : [];

    const analysisMap = new Map<
      string,
      {
        count: number;
        latestAnalyzedAt: Date | null;
      }
    >();

    for (const analysis of analyses) {
      const key = `${analysis.user_id}:${analysis.file_url ?? ""}`;
      const existing = analysisMap.get(key);

      if (!existing) {
        analysisMap.set(key, {
          count: 1,
          latestAnalyzedAt: analysis.analyzed_at ?? null,
        });
        continue;
      }

      existing.count += 1;
      if (
        analysis.analyzed_at &&
        (!existing.latestAnalyzedAt ||
          analysis.analyzed_at > existing.latestAnalyzedAt)
      ) {
        existing.latestAnalyzedAt = analysis.analyzed_at;
      }
    }

    const data = filteredUploads.map((upload) => {
      const key = `${upload.user_id}:${upload.file_url}`;
      const analysisInfo = analysisMap.get(key);
      const previewUrl =
        upload.thumbnail_url ||
        (upload.file_type?.startsWith("image/") ? upload.file_url : null);
      const user = userMap.get(upload.user_id);

      return {
        ...upload,
        users: user ?? {
          id: upload.user_id,
          email: null,
          username: null,
          full_name: null,
          profile_image_url: null,
        },
        preview_url: previewUrl,
        analysis_count: analysisInfo?.count ?? 0,
        latest_analysis_at: analysisInfo?.latestAnalyzedAt ?? null,
      };
    });

    const dailyMap = new Map<string, number>();
    for (let index = 29; index >= 0; index -= 1) {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - index);
      const key = date.toISOString().slice(0, 10);
      dailyMap.set(key, 0);
    }

    for (const upload of last30DaysUploads) {
      if (!upload.created_at) continue;
      const key = upload.created_at.toISOString().slice(0, 10);
      dailyMap.set(key, (dailyMap.get(key) ?? 0) + 1);
    }

    return NextResponse.json({
      data,
      total: totalCount,
      summary: {
        dailyUploads: Array.from(dailyMap.entries()).map(([date, count]) => ({
          date,
          count,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching portfolio upload logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio upload logs" },
      { status: 500 },
    );
  }
}
