import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { scrapeCamphub, normalizeUrls } from "@/lib/scraper/camphub";

async function isAdmin() {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "admin" || user?.role === "superadmin";
}

// POST /api/admin/scrape - Scrape URL(s) and save to database
export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { urls: rawUrls, preview } = body as { urls: string[]; preview?: boolean };

    if (!rawUrls || !Array.isArray(rawUrls) || rawUrls.length === 0) {
      return NextResponse.json({ error: "urls array is required" }, { status: 400 });
    }

    if (rawUrls.length > 20) {
      return NextResponse.json({ error: "Maximum 20 URLs at a time" }, { status: 400 });
    }

    const urls = normalizeUrls(rawUrls);
    const results: { url: string; success: boolean; data?: any; error?: string }[] = [];

    for (const url of urls) {
      try {
        const scraped = await scrapeCamphub(url);

        if (preview) {
          results.push({ url, success: true, data: scraped });
        } else {
          const isCourse = scraped.content_type === "course";
          const table = isCourse ? "courses" : "activities";

          // Check for duplicate by link_url in both tables
          const existingActivity = await prisma.activities.findFirst({ where: { link_url: url } });
          const existingCourse = await prisma.courses.findFirst({ where: { link_url: url } });

          if (existingActivity || existingCourse) {
            const dup = existingActivity || existingCourse;
            results.push({ url, success: false, error: `มีอยู่ในระบบแล้ว (${table} ID: ${dup!.id})` });
            continue;
          }

          let recordId: number;

          if (isCourse) {
            const course = await prisma.courses.create({
              data: {
                title: scraped.title.slice(0, 500),
                description: scraped.description,
                image_url: scraped.image_url,
                category: (scraped.category || "general").slice(0, 100),
                subcategory: (scraped.subcategory || "").slice(0, 100),
                max_participants: scraped.max_participants,
                price: scraped.price,
                source: "camphub",
                link_url: scraped.link_url,
                deadline: scraped.deadline ? new Date(scraped.deadline) : null,
                is_active: true,
              },
            });
            recordId = course.id;
          } else {
            const activity = await prisma.activities.create({
              data: {
                title: scraped.title.slice(0, 500),
                description: scraped.description,
                image_url: scraped.image_url,
                location: (scraped.location || "Online").slice(0, 500),
                start_date: scraped.start_date ? new Date(scraped.start_date) : null,
                end_date: scraped.end_date ? new Date(scraped.end_date) : null,
                deadline: scraped.deadline ? new Date(scraped.deadline) : null,
                category: (scraped.category || "general").slice(0, 100),
                subcategory: (scraped.subcategory || "").slice(0, 100),
                max_participants: scraped.max_participants,
                price: scraped.price,
                source: "camphub",
                link_url: scraped.link_url,
                is_active: true,
              },
            });
            recordId = activity.id;
          }

          results.push({ url, success: true, data: { ...scraped, id: recordId, table } });
        }
      } catch (err) {
        results.push({
          url,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Scrape error:", error);
    return NextResponse.json({ error: "Failed to scrape" }, { status: 500 });
  }
}
