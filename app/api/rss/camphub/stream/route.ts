import { NextResponse } from 'next/server';

const RSS_BASE = 'https://www.camphub.in.th/feed/';
const MAX_FEED_PAGES = 30; // safety cap — CampHub has ~200+ posts
const UTM = '?utm_source=doodee-future.com&utm_medium=external-shelf-on-partner&utm_campaign=';

const CATEGORY_MAP: Record<string, string> = {
  'คอม/ไอที': 'tech',
  'วิทยาศาสตร์': 'innovation',
  'วิศวกรรม': 'innovation',
  'สถาปัตย์/ออกแบบ': 'art',
  'นิเทศ/สื่อสารมวลชน': 'creative',
  'บัญชี/บริหารธุรกิจ': 'business',
  'แพทย์': 'medical',
  'เภสัช': 'medical',
  'พยาบาล': 'medical',
  'สัตวแพทย์': 'medical',
  'จิตแพทย์/จิตวิทยา': 'medical',
  'สายสุขภาพอื่นๆ': 'medical',
  'ดนตรี': 'music',
  'อาสา/อนุรักษ์': 'lifestyle',
  'ประกวดแข่งขัน': 'general',
  'พัฒนาทักษะ/เวิร์กชอป': 'general',
  'แนะแนวเรียนต่อ/อาชีพ': 'education',
  'ศีลธรรม/ศาสนา/ภาวนา': 'lifestyle',
  'ข่าวประชาสัมพันธ์': 'general',
};

const SUBCATEGORY_MAP: Record<string, string> = {
  'คอม/ไอที': 'tech_programming',
  'วิทยาศาสตร์': 'inno_science',
  'วิศวกรรม': 'inno_engineering',
  'สถาปัตย์/ออกแบบ': 'art_graphic',
  'นิเทศ/สื่อสารมวลชน': 'creative_content',
  'บัญชี/บริหารธุรกิจ': 'biz_management',
  'แพทย์': 'med_doctor',
  'เภสัช': 'med_pharmacy',
  'พยาบาล': 'med_nurse',
  'สัตวแพทย์': 'med_veterinary',
  'จิตแพทย์/จิตวิทยา': 'med_psychiatry',
  'สายสุขภาพอื่นๆ': 'med_other',
  'ดนตรี': 'music_other',
  'อาสา/อนุรักษ์': 'life_volunteer',
  'แนะแนวเรียนต่อ/อาชีพ': 'edu_other',
};

const PRICE_RANGE_MAP: Record<string, number> = {
  '1-500 บาท': 250,
  '501-1000 บาท': 750,
  '1001-1500 บาท': 1250,
  '1501-2500 บาท': 2000,
  '2501-5000 บาท': 3750,
  '5001-10000 บาท': 7500,
};

function extractText(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
  const m = xml.match(re);
  return m ? m[1].trim() : '';
}

function extractImage(html: string): string {
  const m = html.match(/<img[^>]+src="([^"]+)"/i);
  return m ? m[1] : '';
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200);
}

function parsePrice(cats: string[], content: string): number {
  const exactMatch = content.match(
    /(?:ค่าใช้จ่าย|ค่าสมัคร|ค่าลงทะเบียน|ราคา)[^\d\n]{0,15}(\d[\d,]*)\s*บาท/
  );
  if (exactMatch) return parseInt(exactMatch[1].replace(/,/g, ''));
  if (cats.includes('ฟรี')) return 0;
  for (const cat of cats) {
    if (cat in PRICE_RANGE_MAP) return PRICE_RANGE_MAP[cat];
  }
  return 0;
}

function parseDeadline(content: string): string | null {
  const MONTHS: Record<string, string> = {
    'มกราคม': '01', 'ม.ค.': '01', 'ก.พ.': '02', 'กุมภาพันธ์': '02',
    'มีนาคม': '03', 'มี.ค.': '03', 'เมษายน': '04', 'เม.ย.': '04',
    'พฤษภาคม': '05', 'พ.ค.': '05', 'มิถุนายน': '06', 'มิ.ย.': '06',
    'กรกฎาคม': '07', 'ก.ค.': '07', 'สิงหาคม': '08', 'ส.ค.': '08',
    'กันยายน': '09', 'ก.ย.': '09', 'ตุลาคม': '10', 'ต.ค.': '10',
    'พฤศจิกายน': '11', 'พ.ย.': '11', 'ธันวาคม': '12', 'ธ.ค.': '12',
  };
  const MONTH_PAT = 'มกราคม|กุมภาพันธ์|มีนาคม|เมษายน|พฤษภาคม|มิถุนายน|กรกฎาคม|สิงหาคม|กันยายน|ตุลาคม|พฤศจิกายน|ธันวาคม|ม\\.ค\\.|ก\\.พ\\.|มี\\.ค\\.|เม\\.ย\\.|พ\\.ค\\.|มิ\\.ย\\.|ก\\.ค\\.|ส\\.ค\\.|ก\\.ย\\.|ต\\.ค\\.|พ\\.ย\\.|ธ\\.ค\\.';
  const patterns = [
    new RegExp(`(?:ปิดรับสมัคร|วันสุดท้าย|ภายในวันที่|สมัครได้.*?ถึง)[^\\d\\n]{0,30}(\\d{1,2})\\s*(${MONTH_PAT})\\s*(\\d{4})`),
    new RegExp(`ปิดรับ\\s*(\\d{1,2})\\s*(${MONTH_PAT})\\s*(\\d{4})`),
    new RegExp(`(\\d{1,2})\\s*(${MONTH_PAT})\\s*(\\d{4})[^\\d]{0,10}(?:ปิด|หมดเขต|สุดท้าย)`),
  ];
  for (const pattern of patterns) {
    const m = content.match(pattern);
    if (m) {
      const day = m[1].padStart(2, '0');
      const month = MONTHS[m[2].trim()] || '01';
      const buddhistYear = parseInt(m[3]);
      const year = buddhistYear > 2500 ? buddhistYear - 543 : buddhistYear;
      return `${year}-${month}-${day}`;
    }
  }
  return null;
}

function parseMaxParticipants(content: string): number | null {
  const m = content.match(/(?:รับจำนวน|จำนวนจำกัด|รับเพียง|รับ)\s*(\d+)\s*คน/);
  return m ? parseInt(m[1]) : null;
}

function mapCategory(cats: string[]): { category: string; subcategory: string } {
  for (const cat of cats) {
    if (SUBCATEGORY_MAP[cat]) {
      return { category: CATEGORY_MAP[cat] || 'general', subcategory: SUBCATEGORY_MAP[cat] };
    }
  }
  for (const cat of cats) {
    if (CATEGORY_MAP[cat]) return { category: CATEGORY_MAP[cat], subcategory: '' };
  }
  return { category: 'general', subcategory: '' };
}

function parseItems(xml: string) {
  return xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
}

function parseFeedPage(xml: string, feedPageNum: number) {
  const items = parseItems(xml);
  return items.map((item, index) => {
    const title = extractText(item, 'title')
      .replace(/&#\d+;/g, (e) => String.fromCharCode(parseInt(e.slice(2, -1))))
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');

    const link = extractText(item, 'link');
    const description = extractText(item, 'description');
    const contentEncoded = extractText(item, 'content:encoded');
    const creator = extractText(item, 'dc:creator');

    const cats = (item.match(/<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi) || [])
      .map((c) => {
        const m = c.match(/<category[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/i);
        return m ? m[1].trim() : '';
      })
      .filter(Boolean);

    const image = extractImage(contentEncoded) || extractImage(description);
    const descText = stripHtml(description);
    const { category, subcategory } = mapCategory(cats);
    const fullText = contentEncoded || description;
    const price = parsePrice(cats, fullText);
    const deadline = parseDeadline(fullText);
    const maxParticipants = parseMaxParticipants(fullText);

    const safeTitle = title.slice(0, 50).replace(/[^\u0020-\u007E\u0E00-\u0E7F]/g, '').trim();
    const utmLink = link ? `${link}${UTM}${encodeURIComponent(safeTitle)}` : link;

    return {
      id: -((feedPageNum - 1) * 10 + index + 1),
      title,
      description: descText,
      image_url: image,
      price,
      category,
      subcategory,
      duration: '',
      instructor: creator,
      source: 'camphub',
      link_url: utmLink,
      is_active: true,
      deadline,
      max_participants: maxParticipants,
    };
  });
}

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      for (let page = 1; page <= MAX_FEED_PAGES; page++) {
        const url = page === 1 ? RSS_BASE : `${RSS_BASE}?paged=${page}`;
        try {
          const res = await fetch(url, { next: { revalidate: 1800 } });
          if (!res.ok) break;
          const xml = await res.text();
          const items = parseFeedPage(xml, page);
          if (items.length === 0) break; // no more pages
          // Write one NDJSON line per batch
          controller.enqueue(encoder.encode(JSON.stringify({ items }) + '\n'));
        } catch {
          break;
        }
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-store',
      'X-Accel-Buffering': 'no', // disable nginx buffering
    },
  });
}
