import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const runtime = "nodejs";

// Get rating info for a post (avg + user's own rating)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const userId = session?.user?.id || null;

    const [agg, userRating] = await Promise.all([
      prisma.community_ratings.aggregate({
        where: { post_id: id },
        _avg: { score: true },
        _count: { score: true },
      }),
      userId
        ? prisma.community_ratings.findUnique({
            where: { post_id_user_id: { post_id: id, user_id: userId } },
          })
        : null,
    ]);

    return NextResponse.json({
      average: agg._avg.score ? Math.round(agg._avg.score * 10) / 10 : 0,
      count: agg._count.score,
      userScore: userRating?.score || null,
    });
  } catch (error) {
    console.error("Rating GET error:", error);
    return NextResponse.json({ error: "Failed to fetch rating" }, { status: 500 });
  }
}

// Submit or update a rating
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const score = Number(body.score);

    if (!score || score < 1 || score > 5 || !Number.isInteger(score)) {
      return NextResponse.json({ error: "Score must be 1-5" }, { status: 400 });
    }

    // Check post exists
    const post = await prisma.community_posts.findUnique({
      where: { id },
      select: { id: true, user_id: true },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Upsert rating
    await prisma.community_ratings.upsert({
      where: {
        post_id_user_id: { post_id: id, user_id: session.user.id },
      },
      create: {
        post_id: id,
        user_id: session.user.id,
        score,
      },
      update: {
        score,
        updated_at: new Date(),
      },
    });

    // Return updated aggregate
    const agg = await prisma.community_ratings.aggregate({
      where: { post_id: id },
      _avg: { score: true },
      _count: { score: true },
    });

    return NextResponse.json({
      average: agg._avg.score ? Math.round(agg._avg.score * 10) / 10 : 0,
      count: agg._count.score,
      userScore: score,
    });
  } catch (error) {
    console.error("Rating POST error:", error);
    return NextResponse.json({ error: "Failed to submit rating" }, { status: 500 });
  }
}
