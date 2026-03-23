import {
  Monitor,
  Palette,
  Briefcase,
  GraduationCap,
  Lightbulb,
  Sparkles,
  Mic2,
  Music,
  Dumbbell,
  Heart,
  Layers,
  Stethoscope,
  LucideIcon,
} from "lucide-react";

export interface CategoryItem {
  value: string;
  label: string;
}

export interface CategoryGroup {
  label: string;
  icon: LucideIcon;
  items: CategoryItem[];
}

export const CATEGORY_GROUPS: Record<string, CategoryGroup> = {
  general: {
    label: "ทั่วไป",
    icon: Layers,
    items: [
      { value: "general_other", label: "อื่นๆ" },
    ],
  },
  tech: {
    label: "เทคโนโลยีและดิจิทัล",
    icon: Monitor,
    items: [
      { value: "tech_programming", label: "การเขียนโปรแกรม" },
      { value: "tech_ai", label: "AI/Machine Learning" },
      { value: "tech_web", label: "Web Development" },
      { value: "tech_mobile", label: "Mobile App" },
      { value: "tech_data", label: "Data Science" },
      { value: "tech_cyber", label: "Cybersecurity" },
      { value: "tech_other", label: "เทคโนโลยีอื่นๆ" },
    ],
  },
  art: {
    label: "ศิลปะและการออกแบบ",
    icon: Palette,
    items: [
      { value: "art_graphic", label: "Graphic Design" },
      { value: "art_uxui", label: "UX/UI Design" },
      { value: "art_fine", label: "วิจิตรศิลป์" },
      { value: "art_photo", label: "การถ่ายภาพ" },
      { value: "art_video", label: "ตัดต่อวิดีโอ" },
      { value: "art_fashion", label: "แฟชั่น" },
      { value: "art_other", label: "ศิลปะอื่นๆ" },
    ],
  },
  business: {
    label: "ธุรกิจและการเงิน",
    icon: Briefcase,
    items: [
      { value: "biz_startup", label: "Startup/ผู้ประกอบการ" },
      { value: "biz_marketing", label: "การตลาด" },
      { value: "biz_finance", label: "การเงินการลงทุน" },
      { value: "biz_accounting", label: "บัญชี" },
      { value: "biz_management", label: "การจัดการ" },
      { value: "biz_ecommerce", label: "E-commerce" },
      { value: "biz_other", label: "ธุรกิจอื่นๆ" },
    ],
  },
  education: {
    label: "การศึกษา",
    icon: GraduationCap,
    items: [
      { value: "edu_tcas", label: "TCAS/สอบเข้า" },
      { value: "edu_portfolio", label: "Portfolio" },
      { value: "edu_interview", label: "สอบสัมภาษณ์" },
      { value: "edu_language", label: "ภาษา" },
      { value: "edu_abroad", label: "เรียนต่อต่างประเทศ" },
      { value: "edu_scholarship", label: "ทุนการศึกษา" },
      { value: "edu_other", label: "การศึกษาอื่นๆ" },
    ],
  },
  innovation: {
    label: "นวัตกรรมและการวิจัย",
    icon: Lightbulb,
    items: [
      { value: "inno_science", label: "วิทยาศาสตร์" },
      { value: "inno_engineering", label: "วิศวกรรม" },
      { value: "inno_health", label: "สุขภาพและการแพทย์" },
      { value: "inno_environment", label: "สิ่งแวดล้อม" },
      { value: "inno_social", label: "นวัตกรรมสังคม" },
      { value: "inno_other", label: "นวัตกรรมอื่นๆ" },
    ],
  },
  creative: {
    label: "สร้างสรรค์",
    icon: Sparkles,
    items: [
      { value: "creative_writing", label: "การเขียน" },
      { value: "creative_content", label: "Content Creator" },
      { value: "creative_film", label: "ภาพยนตร์" },
      { value: "creative_animation", label: "Animation" },
      { value: "creative_game", label: "Game Design" },
      { value: "creative_other", label: "สร้างสรรค์อื่นๆ" },
    ],
  },
  communication: {
    label: "การสื่อสารและการพูด",
    icon: Mic2,
    items: [
      { value: "comm_public", label: "Public Speaking" },
      { value: "comm_debate", label: "โต้วาที" },
      { value: "comm_mc", label: "พิธีกร/MC" },
      { value: "comm_presentation", label: "การนำเสนอ" },
      { value: "comm_podcast", label: "Podcast" },
      { value: "comm_other", label: "การสื่อสารอื่นๆ" },
    ],
  },
  music: {
    label: "ดนตรีและศิลปะการแสดง",
    icon: Music,
    items: [
      { value: "music_instrument", label: "เครื่องดนตรี" },
      { value: "music_singing", label: "การร้องเพลง" },
      { value: "music_production", label: "Music Production" },
      { value: "music_dance", label: "เต้น" },
      { value: "music_theater", label: "ละครเวที" },
      { value: "music_other", label: "ศิลปะการแสดงอื่นๆ" },
    ],
  },
  sport: {
    label: "กีฬา",
    icon: Dumbbell,
    items: [
      { value: "sport_football", label: "ฟุตบอล" },
      { value: "sport_basketball", label: "บาสเกตบอล" },
      { value: "sport_esport", label: "E-sport" },
      { value: "sport_fitness", label: "ฟิตเนส" },
      { value: "sport_martial", label: "ศิลปะป้องกันตัว" },
      { value: "sport_other", label: "กีฬาอื่นๆ" },
    ],
  },
  lifestyle: {
    label: "ไลฟ์สไตล์และสังคม",
    icon: Heart,
    items: [
      { value: "life_volunteer", label: "อาสาสมัคร" },
      { value: "life_travel", label: "ท่องเที่ยว" },
      { value: "life_cooking", label: "ทำอาหาร" },
      { value: "life_mindfulness", label: "สุขภาพจิต/Mindfulness" },
      { value: "life_leadership", label: "ภาวะผู้นำ" },
      { value: "life_networking", label: "Networking" },
      { value: "life_other", label: "ไลฟ์สไตล์อื่นๆ" },
    ],
  },
  medical: {
    label: "ค่ายหมอ",
    icon: Stethoscope,
    items: [
      { value: "med_doctor", label: "แพทย์" },
      { value: "med_dentist", label: "ทันตแพทย์" },
      { value: "med_nurse", label: "พยาบาล" },
      { value: "med_pharmacy", label: "เภสัช" },
      { value: "med_psychiatry", label: "จิตแพทย์/จิตวิทยา" },
      { value: "med_veterinary", label: "สัตวแพทย์" },
      { value: "med_medtech", label: "เทคนิคการแพทย์/สหเวช" },
      { value: "med_other", label: "สายสุขภาพอื่นๆ" },
    ],
  },
};

// Helper function to get category label
export function getCategoryLabel(value: string): string {
  for (const group of Object.values(CATEGORY_GROUPS)) {
    const item = group.items.find((i) => i.value === value);
    if (item) return item.label;
  }
  return value;
}

// Helper function to get category group label (main category)
export function getCategoryGroupLabel(groupKey: string): string {
  const group = CATEGORY_GROUPS[groupKey];
  return group ? group.label : groupKey;
}

// Helper function to get category group icon
export function getCategoryGroupIcon(groupKey: string): LucideIcon | null {
  const group = CATEGORY_GROUPS[groupKey];
  return group ? group.icon : null;
}

// Helper function to get category group key from subcategory value
export function getCategoryGroupKey(subcategoryValue: string): string | null {
  for (const [key, group] of Object.entries(CATEGORY_GROUPS)) {
    if (group.items.some((i) => i.value === subcategoryValue)) {
      return key;
    }
  }
  return null;
}

// Source options
export const SOURCE_OPTIONS = [
  { value: "camphub", label: "CampHub", icon: "/camphub.png" },
  { value: "contester", label: "Contester", icon: "/contester.svg" },
  { value: "other", label: "อื่นๆ", icon: null },
];
