import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

async function checkAdmin() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = await prisma.users.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || !["admin", "superadmin", "moderator"].includes(user.role || ""))
    return null;
  return session.user.id;
}

interface AIResponse {
  title_th: string;
  title_en: string;
  excerpt_th: string;
  excerpt_en: string;
  content_th: string;
  content_en: string;
  suggested_tags: string[];
  suggested_slug: string;
}

interface ProgressEvent {
  step: "scraping" | "preparing" | "generating" | "parsing" | "complete" | "error";
  progress: number;
  message: string;
  data?: any;
  error?: string;
}

// Extract text from JSON object recursively
function extractTextFromJson(obj: any, depth = 0): string {
  if (depth > 10) return ""; // Prevent infinite recursion
  if (obj === null || obj === undefined) return "";
  if (typeof obj === "string") {
    // Skip URLs, IDs, and short strings
    if (obj.startsWith("http") || obj.length < 10) return "";
    return obj + " ";
  }
  if (typeof obj === "number" || typeof obj === "boolean") return "";
  if (Array.isArray(obj)) {
    return obj.map(item => extractTextFromJson(item, depth + 1)).join(" ");
  }
  if (typeof obj === "object") {
    // Prioritize content-like keys
    const contentKeys = ["title", "name", "description", "content", "text", "body", "detail", "details", "summary", "excerpt", "message", "label", "value"];
    let result = "";

    for (const key of contentKeys) {
      if (obj[key] && typeof obj[key] === "string" && obj[key].length > 10) {
        result += obj[key] + "\n";
      }
    }

    // Then extract from all other keys
    for (const key of Object.keys(obj)) {
      if (!contentKeys.includes(key)) {
        result += extractTextFromJson(obj[key], depth + 1);
      }
    }
    return result;
  }
  return "";
}

// Scrape website content (supports SPAs with embedded JSON)
async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "th,en;q=0.9",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    let extractedContent = "";

    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    if (title) extractedContent += `Title: ${title}\n\n`;

    // Extract meta description
    const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDesc = metaDescMatch ? metaDescMatch[1].trim() : "";
    if (metaDesc) extractedContent += `Description: ${metaDesc}\n\n`;

    // Try to extract Next.js __NEXT_DATA__ (common in modern React apps)
    const nextDataMatch = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const pageProps = nextData?.props?.pageProps;
        if (pageProps) {
          const jsonText = extractTextFromJson(pageProps);
          if (jsonText.trim().length > 100) {
            extractedContent += `Content (from page data):\n${jsonText}\n`;
          }
        }
      } catch (e) {
        console.error("Failed to parse __NEXT_DATA__:", e);
      }
    }

    // Try to extract Nuxt __NUXT__ data
    const nuxtDataMatch = html.match(/window\.__NUXT__\s*=\s*(\{[\s\S]*?\});?\s*<\/script>/i);
    if (nuxtDataMatch) {
      try {
        // This is tricky because Nuxt data can be complex, try basic extraction
        const jsonText = extractTextFromJson(JSON.parse(nuxtDataMatch[1]));
        if (jsonText.trim().length > 100) {
          extractedContent += `Content (from Nuxt):\n${jsonText}\n`;
        }
      } catch (e) {
        // Nuxt format is harder to parse, skip
      }
    }

    // Try to find any JSON-LD structured data
    const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of jsonLdMatches) {
      try {
        const jsonLd = JSON.parse(match[1]);
        const jsonText = extractTextFromJson(jsonLd);
        if (jsonText.trim().length > 50) {
          extractedContent += `Structured data:\n${jsonText}\n`;
        }
      } catch (e) {
        // Skip invalid JSON-LD
      }
    }

    // Try to find embedded JSON in script tags (generic)
    const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    for (const match of scriptMatches) {
      const scriptContent = match[1];
      // Look for JSON assignments like window.data = {...} or var data = {...}
      const jsonAssignMatch = scriptContent.match(/(?:window\.\w+|var\s+\w+|const\s+\w+|let\s+\w+)\s*=\s*(\{[\s\S]{100,}?\});/);
      if (jsonAssignMatch) {
        try {
          const jsonText = extractTextFromJson(JSON.parse(jsonAssignMatch[1]));
          if (jsonText.trim().length > 100) {
            extractedContent += `Content (from script):\n${jsonText.substring(0, 5000)}\n`;
            break; // Only use first good match
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }

    // Fallback: Extract text from HTML body
    let htmlText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
      .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ");

    // Extract main content areas
    const mainContentMatch = html.match(/<(?:article|main|div[^>]*class=["'][^"']*content[^"']*["'])[^>]*>([\s\S]*?)<\/(?:article|main|div)>/i);
    if (mainContentMatch) {
      htmlText = mainContentMatch[1];
    }

    // Remove HTML tags and clean up
    htmlText = htmlText
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#\d+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (htmlText.length > 100) {
      extractedContent += `HTML Content:\n${htmlText}\n`;
    }

    // Limit content length
    if (extractedContent.length > 15000) {
      extractedContent = extractedContent.substring(0, 15000) + "...";
    }

    // Check if we got meaningful content
    if (extractedContent.length < 100) {
      throw new Error("Could not extract meaningful content from the page. The website may use JavaScript to load content dynamically.");
    }

    return extractedContent;
  } catch (error) {
    console.error("Error scraping website:", error);
    throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

async function callTyphoon(prompt: string, signal: AbortSignal): Promise<string> {
  const response = await fetch("https://api.opentyphoon.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TYPHOON_API_KEY}`,
    },
    body: JSON.stringify({
      model: "typhoon-v2.5-30b-a3b-instruct",
      messages: [
        {
          role: "system",
          content: `คุณเป็นนักสรุปและเขียนบทความมืออาชีพ เชี่ยวชาญด้านการศึกษาและการเตรียมตัวสอบเข้ามหาวิทยาลัย

**หน้าที่หลักของคุณ:**
สรุปเนื้อหาจากข้อมูลดิบที่ได้รับ และเขียนเป็นบทความบล็อกที่กระชับ อ่านง่าย

**ข้อกำหนดสำคัญที่สุด:**
- สรุปและย่อเนื้อหาจากข้อมูลที่ให้มาเท่านั้น
- ห้ามเพิ่มข้อมูลจากความรู้ภายนอกโดยเด็ดขาด
- ห้ามแต่งเติม ห้ามคาดเดา ห้ามใส่ตัวเลข วันที่ หรือข้อมูลที่ไม่มีในต้นฉบับ
- ดึงประเด็นสำคัญจากข้อมูลดิบมาสรุปให้กระชับ
- ถ้าข้อมูลไม่เพียงพอ ให้สรุปเท่าที่มี อย่าเพิ่มเอง

กฎในการเขียน:
1. เขียนในรูปแบบ Markdown
2. ใช้หัวข้อย่อย (##, ###) เพื่อจัดโครงสร้าง
3. ใส่ bullet points หรือ numbered lists เพื่อสรุปประเด็นสำคัญ
4. เขียนให้กระชับ ชัดเจน และเข้าใจง่าย
5. สร้างทั้งเวอร์ชันภาษาไทยและภาษาอังกฤษ
6. ตอบในรูปแบบ JSON เท่านั้น`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 8000,
      temperature: 0.5,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Typhoon API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
}

async function callDeepSeek(prompt: string, signal: AbortSignal): Promise<string> {
  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: `คุณเป็นนักสรุปและเขียนบทความมืออาชีพ เชี่ยวชาญด้านการศึกษาและการเตรียมตัวสอบเข้ามหาวิทยาลัย

**หน้าที่หลักของคุณ:**
สรุปเนื้อหาจากข้อมูลดิบที่ได้รับ และเขียนเป็นบทความบล็อกที่กระชับ อ่านง่าย

**ข้อกำหนดสำคัญที่สุด:**
- สรุปและย่อเนื้อหาจากข้อมูลที่ให้มาเท่านั้น
- ห้ามเพิ่มข้อมูลจากความรู้ภายนอกโดยเด็ดขาด
- ห้ามแต่งเติม ห้ามคาดเดา ห้ามใส่ตัวเลข วันที่ หรือข้อมูลที่ไม่มีในต้นฉบับ
- ดึงประเด็นสำคัญจากข้อมูลดิบมาสรุปให้กระชับ
- ถ้าข้อมูลไม่เพียงพอ ให้สรุปเท่าที่มี อย่าเพิ่มเอง

กฎในการเขียน:
1. เขียนในรูปแบบ Markdown
2. ใช้หัวข้อย่อย (##, ###) เพื่อจัดโครงสร้าง
3. ใส่ bullet points หรือ numbered lists เพื่อสรุปประเด็นสำคัญ
4. เขียนให้กระชับ ชัดเจน และเข้าใจง่าย
5. สร้างทั้งเวอร์ชันภาษาไทยและภาษาอังกฤษ
6. ตอบในรูปแบบ JSON เท่านั้น`,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 8000,
      temperature: 0.5,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || "";
}

function parseAIResponse(content: string): AIResponse | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return null;
  } catch (error) {
    console.error("Error parsing AI response:", error);
    return null;
  }
}

function buildPrompt(
  sourceContent: string,
  url: string,
  customPrompt: string,
  tone: string,
  targetAudience: string
): string {
  const toneInstructions: Record<string, string> = {
    informative: "เขียนในรูปแบบให้ความรู้ ชัดเจน ตรงประเด็น",
    casual: "เขียนในรูปแบบสบายๆ เป็นกันเอง อ่านง่าย",
    professional: "เขียนในรูปแบบมืออาชีพ น่าเชื่อถือ",
    motivational: "เขียนในรูปแบบสร้างแรงบันดาลใจ กระตุ้นให้ผู้อ่านลงมือทำ",
  };

  const audienceInstructions: Record<string, string> = {
    students: "เขียนสำหรับนักเรียนมัธยมปลายที่เตรียมสอบเข้ามหาวิทยาลัย",
    parents: "เขียนสำหรับผู้ปกครองที่สนใจการศึกษาของลูก",
    general: "เขียนสำหรับผู้อ่านทั่วไปที่สนใจด้านการศึกษา",
  };

  let customInstructions = "";
  if (customPrompt && customPrompt.trim()) {
    customInstructions = `
คำแนะนำพิเศษจากผู้เขียน:
${customPrompt.trim()}

`;
  }

  return `**สรุปข้อมูลรับสมัครต่อไปนี้** และเขียนเป็นบทความที่มีโครงสร้างชัดเจน:

---ข้อมูลดิบ${url ? ` (จาก URL: ${url})` : ""}---
${sourceContent}
---จบข้อมูลดิบ---

**งานของคุณ:**
1. อ่านและทำความเข้าใจข้อมูลดิบข้างต้น
2. ดึงข้อมูลสำคัญเกี่ยวกับการรับสมัคร (ถ้ามี):
   - จำนวนที่รับ (โควต้า/จำนวนคนที่รับ)
   - วันเปิด-ปิดรับสมัคร และ Timeline ต่างๆ
   - เอกสารที่ต้องใช้ในการสมัคร
   - ลิงก์สมัครหรือข้อมูลติดต่อ
3. เขียนเป็นบทความที่กระชับ เข้าใจง่าย จัดหมวดหมู่ชัดเจน

${customInstructions}สไตล์การเขียน: ${toneInstructions[tone] || toneInstructions.informative}
กลุ่มเป้าหมาย: ${audienceInstructions[targetAudience] || audienceInstructions.students}

กรุณาตอบในรูปแบบ JSON ดังนี้:
{
  "title_th": "ชื่อโครงการ/หลักสูตร (จากข้อมูลที่มี)",
  "title_en": "Program/Course name in English",
  "excerpt_th": "สรุปสั้นๆ 1-2 ประโยค เกี่ยวกับโครงการนี้",
  "excerpt_en": "Short summary about this program",
  "content_th": "บทความภาษาไทยในรูปแบบ Markdown โดยจัดโครงสร้างดังนี้:\\n\\n## ข้อมูลทั่วไป\\n[สรุปภาพรวมของโครงการ]\\n\\n## จำนวนที่รับ\\n[ระบุจำนวนโควต้า/ที่นั่ง ถ้ามีในข้อมูล]\\n\\n## กำหนดการสำคัญ\\n[วันเปิด-ปิดรับสมัคร, วันสอบ, วันประกาศผล ฯลฯ]\\n\\n## เอกสารที่ใช้สมัคร\\n[รายการเอกสารที่ต้องเตรียม]\\n\\n## วิธีการสมัคร\\n[ขั้นตอนและลิงก์สมัคร]",
  "content_en": "English article with same structure",
  "suggested_tags": ["tag1", "tag2", "tag3"],
  "suggested_slug": "program-name-slug"
}

**ข้อกำหนดสำคัญที่สุด:**
- **สรุปเนื้อหาจากข้อมูลดิบที่ให้มาเท่านั้น** ห้ามเพิ่มข้อมูลจากความรู้ภายนอกโดยเด็ดขาด
- ห้ามแต่งเติม ห้ามคาดเดา ห้ามใส่ตัวเลข วันที่ หรือข้อมูลที่ไม่มีในต้นฉบับ
- ถ้าข้อมูลบางส่วนไม่มี ให้ข้ามหัวข้อนั้นไป หรือเขียนว่า "ไม่ระบุในข้อมูล"
- ใส่ลิงก์ต้นฉบับ: ${url || "ไม่มี"} ไว้ในบทความด้วย
- ตอบเป็น JSON เท่านั้น ไม่ต้องมีคำอธิบายเพิ่มเติม
- slug ต้องเป็นภาษาอังกฤษ ตัวพิมพ์เล็ก ใช้ขีดกลางคั่นคำ`;
}

// GET /api/admin/blog/ai-generate - For URL-only requests (simple JSON response)
export async function GET(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const searchParams = request.nextUrl.searchParams;
    const url = searchParams.get("url") || "";
    const tone = searchParams.get("tone") || "informative";
    const targetAudience = searchParams.get("targetAudience") || "students";
    const customPrompt = searchParams.get("customPrompt") || "";

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required for GET requests" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return JSON response for GET (no streaming to avoid header issues)
    return handleJsonResponse("", url, customPrompt, tone, targetAudience);
  } catch (error) {
    console.error("AI generate error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate blog post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// POST /api/admin/blog/ai-generate - Supports both SSE streaming and JSON response
export async function POST(request: NextRequest) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const {
      content,
      url,
      customPrompt,
      tone = "informative",
      targetAudience = "students",
      stream = false, // Enable SSE streaming
    } = body;

    // If streaming requested, return SSE response
    if (stream) {
      return handleStreamingResponse(content, url, customPrompt, tone, targetAudience);
    }

    // Otherwise, return regular JSON response
    return handleJsonResponse(content, url, customPrompt, tone, targetAudience);
  } catch (error) {
    console.error("AI generate error:", error);
    return new Response(JSON.stringify({ error: "Failed to generate blog post" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Handle SSE streaming response
function handleStreamingResponse(
  content: string,
  url: string,
  customPrompt: string,
  tone: string,
  targetAudience: string
): Response {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendProgress = async (event: ProgressEvent) => {
    await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
  };

  // Process in background
  (async () => {
    const startTime = Date.now();

    try {
      let sourceContent = content || "";

      // Step 1: Scraping (if URL provided)
      if (url && url.trim()) {
        await sendProgress({
          step: "scraping",
          progress: 10,
          message: "Fetching website content...",
        });

        try {
          const scrapeStartTime = Date.now();
          const scrapedContent = await scrapeWebsite(url.trim());
          const scrapeDuration = ((Date.now() - scrapeStartTime) / 1000).toFixed(1);
          sourceContent = scrapedContent;

          await sendProgress({
            step: "scraping",
            progress: 20,
            message: `Content fetched (${scrapeDuration}s)`,
          });
        } catch (error) {
          await sendProgress({
            step: "error",
            progress: 0,
            message: "Failed to scrape website",
            error: error instanceof Error ? error.message : "Unknown error",
          });
          await writer.close();
          return;
        }
      }

      // Validate content
      if (!sourceContent || sourceContent.trim().length < 50) {
        await sendProgress({
          step: "error",
          progress: 0,
          message: "Content must be at least 50 characters",
          error: "Content too short",
        });
        await writer.close();
        return;
      }

      // Step 2: Preparing content
      await sendProgress({
        step: "preparing",
        progress: 25,
        message: `Preparing content for AI (${sourceContent.length.toLocaleString()} characters)...`,
      });

      const prompt = buildPrompt(sourceContent, url, customPrompt, tone, targetAudience);

      await sendProgress({
        step: "preparing",
        progress: 30,
        message: "Content prepared, starting AI generation...",
      });

      // Step 3: AI Generation
      await sendProgress({
        step: "generating",
        progress: 40,
        message: "AI is writing your article...",
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      let result: string;
      let usedProvider: string;

      try {
        await sendProgress({
          step: "generating",
          progress: 50,
          message: "Connecting to Typhoon AI...",
        });

        result = await callTyphoon(prompt, controller.signal);
        usedProvider = "typhoon";

        await sendProgress({
          step: "generating",
          progress: 80,
          message: "AI generation complete!",
        });
      } catch (typhoonError) {
        console.error("Typhoon error, falling back to DeepSeek:", typhoonError);

        await sendProgress({
          step: "generating",
          progress: 55,
          message: "Switching to DeepSeek AI...",
        });

        result = await callDeepSeek(prompt, controller.signal);
        usedProvider = "deepseek";

        await sendProgress({
          step: "generating",
          progress: 80,
          message: "AI generation complete!",
        });
      } finally {
        clearTimeout(timeoutId);
      }

      // Step 4: Parsing response
      await sendProgress({
        step: "parsing",
        progress: 90,
        message: "Formatting response...",
      });

      const parsed = parseAIResponse(result);

      if (!parsed) {
        await sendProgress({
          step: "error",
          progress: 0,
          message: "Failed to parse AI response",
          error: "Invalid response format",
        });
        await writer.close();
        return;
      }

      const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);

      // Step 5: Complete
      await sendProgress({
        step: "complete",
        progress: 100,
        message: `Article generated successfully (${totalDuration}s)`,
        data: {
          translations: {
            th: {
              title: parsed.title_th,
              excerpt: parsed.excerpt_th,
              content: parsed.content_th,
            },
            en: {
              title: parsed.title_en,
              excerpt: parsed.excerpt_en,
              content: parsed.content_en,
            },
          },
          suggested_tags: parsed.suggested_tags || [],
          suggested_slug: parsed.suggested_slug || "",
          source_url: url || null,
          provider: usedProvider,
        },
      });
    } catch (error) {
      console.error("AI generate error:", error);

      if (error instanceof Error && error.name === "AbortError") {
        await sendProgress({
          step: "error",
          progress: 0,
          message: "Request timed out",
          error: "Please try again with shorter content.",
        });
      } else {
        await sendProgress({
          step: "error",
          progress: 0,
          message: "Failed to generate blog post",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

// Handle regular JSON response
async function handleJsonResponse(
  content: string,
  url: string,
  customPrompt: string,
  tone: string,
  targetAudience: string
): Promise<Response> {
  let sourceContent = content || "";

  // If URL is provided, scrape the website
  if (url && url.trim()) {
    try {
      const scrapedContent = await scrapeWebsite(url.trim());
      sourceContent = scrapedContent;
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to scrape website: ${error instanceof Error ? error.message : "Unknown error"}`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
  }

  if (!sourceContent || sourceContent.trim().length < 50) {
    return new Response(
      JSON.stringify({ error: "Content must be at least 50 characters" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const prompt = buildPrompt(sourceContent, url, customPrompt, tone, targetAudience);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000);

  let result: string;
  let usedProvider: string;

  try {
    try {
      result = await callTyphoon(prompt, controller.signal);
      usedProvider = "typhoon";
    } catch (typhoonError) {
      console.error("Typhoon error, falling back to DeepSeek:", typhoonError);
      result = await callDeepSeek(prompt, controller.signal);
      usedProvider = "deepseek";
    }
  } finally {
    clearTimeout(timeoutId);
  }

  const parsed = parseAIResponse(result);

  if (!parsed) {
    return new Response(
      JSON.stringify({ error: "Failed to parse AI response", raw: result }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
      data: {
        translations: {
          th: {
            title: parsed.title_th,
            excerpt: parsed.excerpt_th,
            content: parsed.content_th,
          },
          en: {
            title: parsed.title_en,
            excerpt: parsed.excerpt_en,
            content: parsed.content_en,
          },
        },
        suggested_tags: parsed.suggested_tags || [],
        suggested_slug: parsed.suggested_slug || "",
        source_url: url || null,
      },
      provider: usedProvider,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
