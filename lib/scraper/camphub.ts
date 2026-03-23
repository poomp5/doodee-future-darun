import * as cheerio from "cheerio";

export type ScrapedActivity = {
  title: string;
  description: string;
  image_url: string;
  location: string;
  start_date: string | null;
  end_date: string | null;
  deadline: string | null;
  category: string;
  subcategory: string;
  max_participants: number | null;
  source: "camphub";
  link_url: string;
  price: number;
  content_type: "course" | "activity";
};

type CategoryMap = Record<string, { category: string; subcategory: string }>;

// Longer/more-specific keys MUST come before shorter ones that are substrings
// e.g. "เทคนิคการแพทย์" before "แพทย์", "สัตวแพทย์" before "แพทย์"
const CATEGORY_MAPPING: CategoryMap = {
  "เทคนิคการแพทย์": { category: "medical", subcategory: "med_medtech" },
  "สัตวแพทย์": { category: "medical", subcategory: "med_veterinary" },
  "ทันตแพทย์": { category: "medical", subcategory: "med_dentist" },
  "จิตแพทย์": { category: "medical", subcategory: "med_psychiatry" },
  "จิตวิทยา": { category: "medical", subcategory: "med_psychiatry" },
  "แพทย์": { category: "medical", subcategory: "med_doctor" },
  "พยาบาล": { category: "medical", subcategory: "med_nurse" },
  "เภสัช": { category: "medical", subcategory: "med_pharmacy" },
  "สหเวช": { category: "medical", subcategory: "med_medtech" },
  "สุขภาพ": { category: "medical", subcategory: "med_other" },
  "สื่อสารมวลชน": { category: "communication", subcategory: "comm_other" },
  "นิเทศ": { category: "communication", subcategory: "comm_other" },
  "บัญชี": { category: "business", subcategory: "biz_accounting" },
  "บริหาร": { category: "business", subcategory: "biz_management" },
  "ธุรกิจ": { category: "business", subcategory: "biz_management" },
  "คอม": { category: "tech", subcategory: "tech_programming" },
  "ไอที": { category: "tech", subcategory: "tech_programming" },
  "โปรแกรม": { category: "tech", subcategory: "tech_programming" },
  "วิศวกรรม": { category: "innovation", subcategory: "inno_engineering" },
  "สถาปัตย์": { category: "art", subcategory: "art_graphic" },
  "ออกแบบ": { category: "art", subcategory: "art_graphic" },
};

const THAI_MONTHS: Record<string, string> = {
  "มกราคม": "01",
  "กุมภาพันธ์": "02",
  "มีนาคม": "03",
  "เมษายน": "04",
  "พฤษภาคม": "05",
  "มิถุนายน": "06",
  "กรกฎาคม": "07",
  "สิงหาคม": "08",
  "กันยายน": "09",
  "ตุลาคม": "10",
  "พฤศจิกายน": "11",
  "ธันวาคม": "12",
  "มค": "01",
  "กพ": "02",
  "มีค": "03",
  "เมย": "04",
  "พค": "05",
  "มิย": "06",
  "กค": "07",
  "สค": "08",
  "กย": "09",
  "ตค": "10",
  "พย": "11",
  "ธค": "12",
};

const DEFAULT_CATEGORY = { category: "general", subcategory: "general_other" };

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36";

const DATE_LABELS = {
  start: [/วันที่จัดกิจกรรม/i, /วันจัดกิจกรรม/i, /วันจัดค่าย/i],
  deadline: [/วันที่รับสมัคร/i, /วันปิดรับสมัคร/i, /หมดเขตรับสมัคร/i, /ปิดรับสมัคร/i],
};

const PARTICIPANT_LABEL = /จำนวนที่รับ|จำนวนรับ/i;

const COURSE_KEYWORDS = [
  "กิจกรรมออนไลน์",
  "คอร์สออนไลน์",
  "ติวสอบ",
  "สอนทำพอร์ต",
  "พัฒนาทักษะ",
  "เวิร์กชอป",
];

function cleanText(text?: string | null): string {
  if (!text) return "";
  return text.replace(/\s+/g, " ").trim();
}

export function parseThaiDate(dateStr?: string | null): string | null {
  if (!dateStr || typeof dateStr !== "string") return null;
  const raw = cleanText(dateStr);
  if (!raw) return null;

  const monthKey = Object.keys(THAI_MONTHS).find((m) => raw.includes(m));
  if (!monthKey) return null;

  const month = THAI_MONTHS[monthKey];
  const nums = raw.match(/\d+/g) || [];
  if (nums.length === 0) return null;

  let day = nums[0];
  let year = nums[nums.length - 1];

  // If only one number is found and looks like a day (<=31), assume current Buddhist year
  if (nums.length === 1) {
    const n = parseInt(nums[0], 10);
    if (n <= 31) {
      day = nums[0];
      year = String(new Date().getFullYear() + 543);
    }
  }

  // Handle two-digit years
  if (year.length === 2) {
    const yearNum = parseInt(year, 10);
    year = String(yearNum > 70 ? 1900 + yearNum : 2000 + yearNum + 543); // convert to BE for consistency
  }

  // If year >= 2500, it's Buddhist Era → subtract 543. Otherwise it's already CE.
  const yearNum = parseInt(year, 10);
  const christianYear = yearNum >= 2500 ? yearNum - 543 : yearNum;
  const dayInt = Math.max(1, Math.min(31, parseInt(day, 10) || 1));

  if (Number.isNaN(christianYear)) return null;

  return `${christianYear}-${month}-${String(dayInt).padStart(2, "0")}`;
}

function determineCategory($: cheerio.CheerioAPI, title: string, description: string) {
  // 1) Check article's own category tags (class="category-*")
  //    These are the actual category badges on the article, NOT navigation menu items
  const categoryAnchors = $('a[class^="category-"]').toArray();
  for (const el of categoryAnchors) {
    const text = cleanText($(el).text());
    if (!text || text.length > 50) continue;
    const hit = findCategory(text);
    if (hit) return hit;
  }

  // 2) Fallback to title + description text search
  const combinedText = `${title} ${description}`;
  const hit = findCategory(combinedText);
  if (hit) return hit;

  return DEFAULT_CATEGORY;
}

function findCategory(text: string) {
  for (const key of Object.keys(CATEGORY_MAPPING)) {
    if (text.includes(key)) {
      return CATEGORY_MAPPING[key];
    }
  }
  return null;
}

function extractImage($: cheerio.CheerioAPI): string {
  // 1) og:image meta tag (most reliable - always in <head>, no lazy loading)
  let src = $('meta[property="og:image"]').attr("content") || "";

  // 2) div.meta-image img - try data-src first (lazy load), then src
  if (!src) {
    const metaImg = $(".meta-image img").first();
    src = metaImg.attr("data-src") || "";
    if (!src || src.startsWith("data:")) {
      src = metaImg.attr("src") || "";
    }
  }

  // 3) Any img with data-src containing wp-content/uploads
  if (!src || src.startsWith("data:")) {
    src = $('img[data-src*="wp-content/uploads"]').first().attr("data-src") || "";
  }

  // 4) Any img with real src containing wp-content/uploads
  if (!src || src.startsWith("data:")) {
    const img = $('img[src*="wp-content/uploads"]').first();
    const s = img.attr("src") || "";
    if (!s.startsWith("data:")) src = s;
  }

  if (src.startsWith("//")) src = `https:${src}`;
  return cleanText(src);
}

function extractDescription($: cheerio.CheerioAPI): string {
  const section = $(".entry-content").first().length ? $(".entry-content").first() : $("section").first();
  const paragraphs = section.find("p").toArray();
  const text = paragraphs.map((p) => cleanText($(p).text())).filter(Boolean).join("\n");
  return text.slice(0, 5000);
}

function extractLocation($: cheerio.CheerioAPI): string {
  let location: string | null = null;

  $("h1, h2, h3, h4, h5, h6, strong, b, span, p").each((_, el) => {
    if (location) return;
    const text = cleanText($(el).text());
    if (!text || text.length > 200) return;
    if (/สถานที่/.test(text)) {
      const nextText = cleanText($(el).next().text());
      const candidate = nextText && nextText.length <= 500 ? nextText : null;
      if (candidate) location = candidate;
    }
  });

  return (location || "Online").slice(0, 500);
}

function extractDates($: cheerio.CheerioAPI) {
  let start: string | null = null;
  let deadline: string | null = null;

  // Target heading elements (h1-h6, strong, b) to avoid matching huge parent divs
  $("h1, h2, h3, h4, h5, h6, strong, b, span, p").each((_, el) => {
    // Only check the element's own direct text content (short labels)
    const ownText = cleanText(
      $(el).contents().filter(function () { return this.type === "text"; }).text()
      || $(el).text()
    );
    if (!ownText || ownText.length > 200) return;

    if (!start && DATE_LABELS.start.some((r) => r.test(ownText))) {
      // Date is in the next sibling element (h4, p, span, etc.)
      const nextText = cleanText($(el).next().text());
      const candidate = parseThaiDate(nextText) || parseThaiDate(ownText);
      if (candidate) start = candidate;
    }

    if (!deadline && DATE_LABELS.deadline.some((r) => r.test(ownText))) {
      const nextText = cleanText($(el).next().text());
      const candidate = parseThaiDate(nextText) || parseThaiDate(ownText);
      if (candidate) deadline = candidate;
    }
  });

  return { start_date: start, end_date: start, deadline };
}

function detectContentType($: cheerio.CheerioAPI): "course" | "activity" {
  const allText = $.text();
  for (const keyword of COURSE_KEYWORDS) {
    if (allText.includes(keyword)) return "course";
  }
  return "activity";
}

function extractPrice($: cheerio.CheerioAPI): number {
  let price = 0;
  $("h1, h2, h3, h4, h5, h6, strong, b, span, p").each((_, el) => {
    if (price > 0) return;
    const text = cleanText($(el).text());
    if (!text || text.length > 200) return;
    if (/ค่าสมัคร|ค่าลงทะเบียน|ราคา|บาท/.test(text)) {
      const match = text.match(/([\d,]+)\s*บาท/);
      if (match) {
        price = parseInt(match[1].replace(/,/g, ""), 10) || 0;
      }
    }
  });
  return price;
}

function extractMaxParticipants($: cheerio.CheerioAPI): number | null {
  let max: number | null = null;
  $("h1, h2, h3, h4, h5, h6, strong, b, span, p").each((_, el) => {
    if (max !== null) return;
    const text = cleanText($(el).text());
    if (!text || text.length > 200) return;
    if (PARTICIPANT_LABEL.test(text)) {
      const nextText = cleanText($(el).next().text());
      const digits = (nextText || text).match(/\d+/);
      if (digits) max = parseInt(digits[0], 10);
    }
  });
  return max;
}

export async function scrapeCamphub(url: string): Promise<ScrapedActivity> {
  const res = await fetch(url, {
    headers: { "user-agent": USER_AGENT },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  const title = (cleanText($("h1").first().text()) || "Untitled").slice(0, 500);
  const description = extractDescription($);
  const image_url = extractImage($);
  const location = extractLocation($);
  const { start_date, end_date, deadline } = extractDates($);
  const max_participants = extractMaxParticipants($) ?? null;
  const { category, subcategory } = determineCategory($, title, description);
  const content_type = detectContentType($);
  const price = extractPrice($);

  return {
    title,
    description,
    image_url,
    location,
    start_date,
    end_date,
    deadline,
    category,
    subcategory,
    max_participants,
    source: "camphub",
    link_url: url,
    price,
    content_type,
  };
}

export function normalizeUrls(urls: string[]): string[] {
  return urls
    .map((u) => cleanText(u))
    .filter(Boolean)
    .map((u) => (u.startsWith("http") ? u : `https://${u}`));
}
