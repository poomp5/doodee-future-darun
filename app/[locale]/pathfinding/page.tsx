"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Link } from "@/routing";
import { useLocale } from "next-intl";
import {
  Map,
  Sparkles,
  Star,
  Trophy,
  Target,
  FileText,
  GraduationCap,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Loader2,
  BookOpen,
  Medal,
  Pencil,
  TrendingUp,
  AlertCircle,
  UserCircle2,
  ChevronDown,
  Circle,
  RefreshCw,
  ExternalLink,
  ThumbsUp,
  Minus,
  Brain,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/Breadcrumbs";
import type { ProfileSummary, PortfolioQuality } from "@/app/api/pathfinding/route";

// Types

interface TCASRound {
  round: 1 | 2 | 3 | 4;
  name: string;
  suitability: "high" | "medium" | "low";
  score: number;
  reasons: string[];
  tips: string[];
  requiredItems: string[];
}

interface PathfindingResult {
  summary: string;
  rounds: TCASRound[];
  topRecommendation: 1 | 2 | 3 | 4;
  personalMessage: string;
  nextSteps: string[];
}

// Quiz

interface QuizQuestion {
  id: number;
  th: string;
  en: string;
  options: Array<{
    id: string;
    th: string;
    en: string;
    promptHint: string;
    internationalSignal?: -1 | 0 | 1 | 2;
  }>;
}

type InternationalFit = "high" | "medium" | "low";

interface QuizSuggestion {
  lines: string[];
  internationalFit: InternationalFit | null;
  internationalText: string | null;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    th: "เมื่อต้องเผชิญกับสิ่งสำคัญ คุณมักจะ...",
    en: "When facing something important, you usually...",
    options: [
      { id: "A", th: "เริ่มวางแผนและเตรียมตัวล่วงหน้านาน", en: "Start planning and preparing well in advance", promptHint: "วางแผนระยะยาว ชอบเตรียมตัวก่อน → เหมาะกับรอบ 1 และ 2" },
      { id: "B", th: "ศึกษาข้อมูลให้ครบแล้วค่อยลงมือ", en: "Research thoroughly before taking action", promptHint: "ชอบข้อมูลครบก่อนเริ่ม ทำงานเป็นระบบ → เหมาะกับรอบ 2 และ 3" },
      { id: "C", th: "เร่งทำช่วงใกล้เวลา แต่ทำได้ดี", en: "Intensively sprint close to deadlines and still do well", promptHint: "เก่งการเตรียมตัวแบบเข้มข้น ชอบแรงกดดัน → เหมาะกับรอบ 3" },
      { id: "D", th: "ปรับตัวตามสถานการณ์ที่เปลี่ยนไป", en: "Adapt flexibly as the situation changes", promptHint: "ยืดหยุ่นสูง ปรับตัวเก่ง → เหมาะกับรอบ 4" },
    ],
  },
  {
    id: 2,
    th: "ผลงานหรือความสำเร็จที่ทำให้คุณภูมิใจที่สุดมักจะเป็น...",
    en: "Your proudest achievement is usually...",
    options: [
      { id: "A", th: "ผลงานสร้างสรรค์ โปรเจกต์ หรืองานที่ทำเอง", en: "A creative project or personal creation", promptHint: "มีผลงานสร้างสรรค์หรือโปรเจกต์โดดเด่น → เหมาะกับรอบ 1" },
      { id: "B", th: "ผลการสอบหรือคะแนนวิชาการที่ดีเยี่ยม", en: "High exam scores or academic excellence", promptHint: "เด่นด้านวิชาการและการสอบ → เหมาะกับรอบ 3" },
      { id: "C", th: "การนำทีมหรือทำกิจกรรมเพื่อส่วนรวม", en: "Leading a team or contributing to community activities", promptHint: "มีภาวะผู้นำ มีกิจกรรมชุมชนหรือโรงเรียน → เหมาะกับรอบ 1 และ 2" },
      { id: "D", th: "ทักษะใหม่ที่พัฒนาขึ้นมาด้วยตนเอง", en: "A new skill developed through self-learning", promptHint: "ชอบเรียนรู้ด้วยตนเอง ยังอยู่ระหว่างพัฒนา → เหมาะกับรอบ 4" },
    ],
  },
  {
    id: 3,
    th: "ก่อนถูกประเมินหรือทดสอบ คุณจะทำอะไรก่อน?",
    en: "Before a big evaluation or test, what do you do first?",
    options: [
      { id: "A", th: "ทบทวนสิ่งที่เตรียมมาทั้งหมดอย่างละเอียด", en: "Review everything I've prepared in detail", promptHint: "พึ่งการเตรียมตัวล่วงหน้า ชอบเตรียมไว้ก่อน → เหมาะกับรอบ 1 และ 2" },
      { id: "B", th: "ฝึกทำแบบทดสอบหรือข้อสอบจำลอง", en: "Practice with mock tests or exercises", promptHint: "เน้นฝึกสอบ ชอบ mock test → เหมาะกับรอบ 3" },
      { id: "C", th: "ปรึกษาครูหรืออาจารย์ที่ปรึกษา", en: "Consult with a teacher or mentor", promptHint: "ใกล้ชิดครู ชอบรับคำแนะนำ → เหมาะกับรอบ 1 และ 2 โควตา" },
      { id: "D", th: "ยอมรับความไม่แน่นอน พักผ่อนและตั้งสติ", en: "Accept uncertainty, rest, and stay calm", promptHint: "สบายใจกับความไม่แน่นอน มีความยืดหยุ่น → เหมาะกับรอบ 4" },
    ],
  },
  {
    id: 4,
    th: "เพื่อนในชั้นเรียนมักมองคุณว่าเป็น...",
    en: "Your classmates most likely see you as...",
    options: [
      { id: "A", th: "คนสร้างสรรค์ที่มีโปรเจกต์น่าสนใจเสมอ", en: "The creative one who always has interesting projects", promptHint: "บุคลิกสร้างสรรค์ มีพอร์ตโฟลิโอ → เหมาะกับรอบ 1" },
      { id: "B", th: "คนเก่งสอบที่ได้คะแนนสูงเป็นประจำ", en: "The top scorer who consistently aces exams", promptHint: "ดาวเด่นวิชาการ → เหมาะกับรอบ 3" },
      { id: "C", th: "หัวหน้าชมรมหรือคนที่รู้จักทั่วโรงเรียน", en: "The club leader or the person everyone knows", promptHint: "มีเครือข่ายและกิจกรรมในโรงเรียน → เหมาะกับรอบ 1 และ 2" },
      { id: "D", th: "คนที่มีดีซ่อนอยู่ รอวันปล่อยของ", en: "The wildcard with hidden talents waiting to emerge", promptHint: "ศักยภาพที่ยังรอเวลา ยังอยู่ระหว่างพัฒนา → เหมาะกับรอบ 4" },
    ],
  },
  {
    id: 5,
    th: "เมื่อต้องบอกเล่าประสบการณ์และทักษะของตัวเอง คุณ...",
    en: "When sharing your experiences and skills, you...",
    options: [
      { id: "A", th: "สนุกกับมัน ชอบเล่าเรื่องราวของตัวเอง", en: "Enjoy it — love telling my story", promptHint: "ถนัดนำเสนอตัวเอง สัมภาษณ์เก่ง → เหมาะกับรอบ 1" },
      { id: "B", th: "เขียนออกมาได้ดี แต่ไม่ค่อยถนัดพูด", en: "Can write it well but prefer not to speak", promptHint: "ถนัดเขียน จัดพอร์ตได้ดี → เหมาะกับรอบ 1 และ 2" },
      { id: "C", th: "ชอบแสดงให้ดูมากกว่าพูดหรือเขียน", en: "Prefer showing by doing rather than explaining", promptHint: "เก่งงานปฏิบัติ เน้นผลลัพธ์จริง → เหมาะกับรอบ 3" },
      { id: "D", th: "ยังไม่แน่ใจว่าจุดเด่นของตัวเองคืออะไร", en: "Still figuring out what makes me stand out", promptHint: "อยู่ระหว่างค้นหาตัวตน ต้องการพัฒนาก่อน → เหมาะกับรอบ 4" },
    ],
  },
  {
    id: 6,
    th: "ความสัมพันธ์ของคุณกับครูและโรงเรียนเป็นอย่างไร?",
    en: "How is your relationship with your teachers and school?",
    options: [
      { id: "A", th: "ดีมาก ครูรู้จักและเชื่อมั่นในตัวเรา", en: "Very close — teachers know and believe in me", promptHint: "ครูสนับสนุน มีโอกาสรับใบรับรองที่แข็งแกร่ง → เหมาะกับรอบ 1 และ 2" },
      { id: "B", th: "ดีพอสมควร เป็นทางการ ไม่ใกล้ชิดมาก", en: "Fine, mostly professional and not very personal", promptHint: "ความสัมพันธ์ปกติ เน้นวิชาการ → เหมาะกับรอบ 3" },
      { id: "C", th: "โรงเรียนมีโควตาพิเศษกับบางมหาวิทยาลัย", en: "My school has special quota agreements with universities", promptHint: "มีโควตาโรงเรียน → รอบ 2 เป็นพิเศษ" },
      { id: "D", th: "หลากหลาย บางทีดี บางทีห่างเหิน", en: "Mixed — close with some, distant with others", promptHint: "ความสัมพันธ์แบบผสมผสาน ไม่ได้โดดเด่นด้านใดด้านหนึ่ง" },
    ],
  },
  {
    id: 7,
    th: "คุณมักวางแผนล่วงหน้านานแค่ไหน?",
    en: "How far ahead do you usually plan?",
    options: [
      { id: "A", th: "หลายเดือน วางแผนรายละเอียดทุกขั้นตอน", en: "Months ahead with every step detailed", promptHint: "วางแผนระยะยาวอย่างละเอียด → เหมาะกับรอบ 1 ที่ต้องเตรียมพอร์ต" },
      { id: "B", th: "สองสามสัปดาห์ กำหนดเป้าหมายสำคัญ", en: "A few weeks with key milestones", promptHint: "วางแผนระยะกลาง → เหมาะกับรอบ 2 และ 3" },
      { id: "C", th: "โฟกัสที่งานตรงหน้าก็เพียงพอ", en: "Focus on the immediate task at hand", promptHint: "Present-focused เน้นทำทีละอย่าง → เหมาะกับรอบ 3 ที่ต้องสอบ" },
      { id: "D", th: "ไม่ชอบวางแผนตายตัว ชอบไหลตามโอกาส", en: "Prefer flowing with opportunities over strict plans", promptHint: "ยืดหยุ่น ชอบโอกาสที่เกิดขึ้นเอง → เหมาะกับรอบ 4" },
    ],
  },
  {
    id: 8,
    th: "ถ้าต้องเลือกหนึ่งคำเพื่ออธิบายตัวเอง คุณจะเลือก...",
    en: "If you had to pick one word to describe yourself, you'd choose...",
    options: [
      { id: "A", th: "สร้างสรรค์ — ฉันชอบสร้างและแสดงออก", en: "Creative — I love making things and expressing myself", promptHint: "บุคลิกสร้างสรรค์ ชอบแสดงออก → เหมาะกับรอบ 1" },
      { id: "B", th: "มุ่งมั่น — ฉันไม่ยอมแพ้จนกว่าจะสำเร็จ", en: "Driven — I won't stop until I succeed", promptHint: "มุ่งมั่น มีแรงจูงใจสูง แข่งขันได้ → เหมาะกับรอบ 3" },
      { id: "C", th: "เชื่อมต่อ — ฉันรู้จักคนและชอบสร้างเครือข่าย", en: "Connected — I build networks and know people", promptHint: "มีเครือข่าย รู้จักคนมาก → เหมาะกับรอบ 1 และ 2" },
      { id: "D", th: "ยืดหยุ่น — ฉันพร้อมรับทุกสถานการณ์", en: "Adaptable — I'm ready for any situation", promptHint: "ยืดหยุ่น พร้อมรับทุกสถานการณ์ → เหมาะกับรอบ 4" },
    ],
  },
  {
    id: 9,
    th: "ถ้าต้องเรียนในสภาพแวดล้อมนานาชาติ (ใช้ภาษาอังกฤษมากขึ้น) คุณรู้สึกว่า...",
    en: "If you study in an international environment (more English usage), you feel...",
    options: [
      {
        id: "A",
        th: "พร้อมและตื่นเต้น อยากเรียนกับเพื่อนหลากหลายประเทศ",
        en: "Ready and excited to study with diverse international peers",
        promptHint: "เปิดรับสภาพแวดล้อมนานาชาติสูง ทักษะการปรับตัวดี → มีแนวโน้มเหมาะกับหลักสูตรภาคนานาชาติ",
        internationalSignal: 2,
      },
      {
        id: "B",
        th: "พอได้ ถ้ามีเวลาเตรียมภาษาเพิ่มเติม",
        en: "Comfortable if I have time to strengthen language skills first",
        promptHint: "มีศักยภาพสำหรับภาคนานาชาติ หากวางแผนพัฒนาภาษาอังกฤษต่อเนื่อง",
        internationalSignal: 1,
      },
      {
        id: "C",
        th: "อยากเริ่มจากหลักสูตรไทยก่อน แล้วค่อยต่อยอด",
        en: "Prefer starting in Thai program first, then transitioning later",
        promptHint: "ปัจจุบันอาจเหมาะกับหลักสูตรไทยมากกว่า และค่อยเตรียมความพร้อมสำหรับภาคนานาชาติ",
        internationalSignal: 0,
      },
      {
        id: "D",
        th: "ยังไม่มั่นใจด้านภาษาและการเรียนแบบนานาชาติ",
        en: "Not confident yet with language and international learning style",
        promptHint: "ควรโฟกัสเสริมพื้นฐานภาษาและความมั่นใจก่อนพิจารณาภาคนานาชาติ",
        internationalSignal: -1,
      },
    ],
  },
];

// Deep quiz questions

const DEEP_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 101,
    th: "วิชาหรือสาขาที่คุณรู้สึกถนัดและสนุกที่สุดโดยธรรมชาติคือ...",
    en: "The subject area you naturally excel at and enjoy the most is...",
    options: [
      { id: "A", th: "วิทยาศาสตร์บริสุทธิ์ (ฟิสิกส์ เคมี ชีววิทยา)", en: "Pure sciences (Physics, Chemistry, Biology)", promptHint: "ถนัดวิทยาศาสตร์บริสุทธิ์ → เหมาะกับแพทย์ เภสัช วิทย์ชีวการแพทย์" },
      { id: "B", th: "คณิตศาสตร์และตรรกะเหตุผล", en: "Mathematics and logical reasoning", promptHint: "ถนัดคณิตและตรรกะ → เหมาะกับวิศวกรรม วิทย์คอม เศรษฐศาสตร์" },
      { id: "C", th: "สังคมศาสตร์ ประวัติศาสตร์ และสถานการณ์โลก", en: "Social sciences, history, and world events", promptHint: "ถนัดสายสังคมและมนุษยศาสตร์ → เหมาะกับรัฐศาสตร์ นิติ สังคม" },
      { id: "D", th: "ภาษาศาสตร์ การสื่อสาร และการเล่าเรื่อง", en: "Linguistics, communication, and storytelling", promptHint: "ถนัดภาษาและการสื่อสาร → เหมาะกับนิเทศ อักษรศาสตร์ ภาษา" },
      { id: "E", th: "ศิลปะ ดีไซน์ ดนตรี หรือการแสดงออก", en: "Arts, design, music, or creative expression", promptHint: "ถนัดสายสร้างสรรค์ → เหมาะกับสถาปัตย์ ศิลปกรรม ดีไซน์" },
    ],
  },
  {
    id: 102,
    th: "เมื่ออยู่ภายใต้แรงกดดันสูง (สอบ งานกลุ่ม เส้นตาย) คุณมักจะ...",
    en: "When under high pressure (exams, group work, deadlines), you usually...",
    options: [
      { id: "A", th: "ทำได้ดีขึ้น แรงกดดันทำให้ฉันโฟกัสมากขึ้น", en: "Perform better — pressure sharpens my focus", promptHint: "แรงกดดันเพิ่มประสิทธิภาพ → เหมาะกับสายที่ต้องสอบแข่งขันสูง" },
      { id: "B", th: "จัดการได้ แต่ต้องใช้เวลาฟื้นตัวหลังผ่าน", en: "Manage through it but need recovery time after", promptHint: "ทนแรงกดดันได้ระดับกลาง → ควรวางแผนช่วงพักฟื้น" },
      { id: "C", th: "รู้สึกเครียดมาก แต่พึ่งพาเพื่อนหรือครอบครัวช่วย", en: "Feel very stressed but lean on friends/family for support", promptHint: "ต้องการระบบสนับสนุน → เหมาะกับสายที่มีชุมชนแน่นแฟ้น" },
      { id: "D", th: "หลีกเลี่ยงและผัดวันประกันพรุ่งแล้วค่อยเร่งทำ", en: "Avoid then scramble at the last moment", promptHint: "แนวโน้ม procrastinate ภายใต้ stress → ควรเสริมทักษะบริหารเวลา" },
    ],
  },
  {
    id: 103,
    th: "ในการเรียนหรือทำโปรเจกต์ คุณชอบรูปแบบใดมากที่สุด?",
    en: "When studying or working on a project, which style fits you best?",
    options: [
      { id: "A", th: "เรียนคนเดียว สมาธิเต็มที่ ไม่ต้องการคนรบกวน", en: "Solo with full concentration — no interruptions", promptHint: "ชอบทำงานคนเดียว อิสระสูง → เหมาะกับสาขาที่เน้นการวิจัยหรืองานส่วนตัว" },
      { id: "B", th: "ส่วนใหญ่คนเดียว แต่มีเช็คอินกับกลุ่มบ้าง", en: "Mostly solo but occasional group check-ins", promptHint: "balance ระหว่างอิสระและความร่วมมือ → ยืดหยุ่นสูง" },
      { id: "C", th: "ร่วมมือในกลุ่มเล็กๆ ที่ไว้ใจกัน", en: "Collaborate closely in a small trusted team", promptHint: "ชอบทีมเล็กและการร่วมมือ → เหมาะกับสายงานที่ต้องทำงานเป็นทีม" },
      { id: "D", th: "ชอบแลกเปลี่ยนกับคนหลายๆ คน สนุกกับการถกเถียง", en: "Love exchanging ideas with many people and debate", promptHint: "extrovert learner ชอบสังคมและแลกเปลี่ยนความคิด → เหมาะกับสายสังคม นิติ ธุรกิจ" },
    ],
  },
  {
    id: 104,
    th: "ภาพชีวิตหลังเรียนจบที่คุณฝันถึงมากที่สุดคือ...",
    en: "Your most dreamed-of vision for life after graduation is...",
    options: [
      { id: "A", th: "ประกอบอาชีพเฉพาะทางที่ชัดเจน (แพทย์ วิศวกร ทนาย ฯลฯ)", en: "A defined professional career (doctor, engineer, lawyer, etc.)", promptHint: "มีเป้าหมายวิชาชีพชัดเจน → เหมาะกับสายวิชาชีพที่ต้องใบอนุญาต" },
      { id: "B", th: "ทำธุรกิจหรือ startup ของตัวเอง", en: "Running my own business or startup", promptHint: "มีแนวคิดผู้ประกอบการ → เน้นสาขาที่ส่งเสริมนวัตกรรมและธุรกิจ" },
      { id: "C", th: "ศึกษาต่อระดับบัณฑิตหรือทำวิจัย", en: "Pursuing postgraduate studies or research", promptHint: "มุ่งสู่สายวิชาการและวิจัย → เน้นคะแนนและทักษะการวิจัย" },
      { id: "D", th: "ทำงานสายสร้างสรรค์หรืออิสระ (ฟรีแลนซ์ ศิลปิน สื่อ ฯลฯ)", en: "Working in creative or freelance fields (artist, media, etc.)", promptHint: "สายอิสระและสร้างสรรค์ → เน้นการสร้างพอร์ตและผลงาน" },
    ],
  },
  {
    id: 105,
    th: "ผลงานหรือโปรเจกต์ที่คุณทำขึ้นเองในปัจจุบันอยู่ในระดับใด?",
    en: "How would you describe your current personal projects or portfolio?",
    options: [
      { id: "A", th: "มีผลงานที่ภูมิใจและพร้อมแสดงออกสู่สาธารณะ", en: "Have work I'm proud of and ready to showcase", promptHint: "พอร์ตแข็งแกร่งและพร้อม → แนะนำรอบ 1 Portfolio อย่างมาก" },
      { id: "B", th: "เริ่มทำแล้วแต่ยังต้องพัฒนาเพิ่มอีก", en: "Started but needs significant development", promptHint: "พอร์ตอยู่ระหว่างพัฒนา → ควรเร่งสร้างผลงานเพิ่มก่อนสมัคร" },
      { id: "C", th: "มีไอเดียดีๆ แต่ยังไม่ได้ทำจริงจัง", en: "Have great ideas but haven't executed seriously yet", promptHint: "ยังต้องเริ่มสร้างผลงาน → ควรวางแผนสร้างพอร์ต 6-12 เดือนล่วงหน้า" },
      { id: "D", th: "ไม่แน่ใจว่าต้องมีพอร์ตประเภทใดสำหรับสาขาที่สนใจ", en: "Unsure what kind of portfolio applies to my field", promptHint: "ต้องศึกษาเกณฑ์พอร์ตของสาขาที่สนใจก่อนเริ่มสร้าง" },
    ],
  },
  {
    id: 106,
    th: "เมื่อผิดหวังกับผลลัพธ์หรือเจอความล้มเหลว คุณมักจะ...",
    en: "When you face disappointment or failure, you typically...",
    options: [
      { id: "A", th: "วิเคราะห์ว่าผิดพลาดตรงไหนและลองใหม่ทันที", en: "Analyze what went wrong and try again immediately", promptHint: "มี growth mindset และความยืดหยุ่นสูง → เหมาะกับสายที่ต้องสอบหลายรอบ" },
      { id: "B", th: "ใช้เวลาพักก่อนแล้วค่อยกลับมาสู้ใหม่", en: "Take a break then return with renewed energy", promptHint: "ฟื้นตัวได้ดีแต่ต้องการเวลา → ให้มีแผนที่มีช่วงพักเพียงพอ" },
      { id: "C", th: "ระบายกับคนที่ไว้ใจแล้วค่อยรู้สึกดีขึ้น", en: "Vent to someone I trust then feel better", promptHint: "ต้องการ emotional support → ควรมีเครือข่ายช่วยเหลือที่แข็งแกร่ง" },
      { id: "D", th: "ตั้งคำถามว่าตัวเองเหมาะกับสิ่งนั้นจริงๆ หรือเปล่า", en: "Question whether I'm really suited for it at all", promptHint: "อาจขาดความมั่นใจในตัวเอง → ควรเสริม self-awareness และแรงจูงใจ" },
    ],
  },
  {
    id: 107,
    th: "ในการเรียนรอบวันๆ คุณต้องการโครงสร้างมากแค่ไหน?",
    en: "In your daily learning, how much structure do you need?",
    options: [
      { id: "A", th: "ต้องการตารางและกฎเกณฑ์ที่ชัดเจน ทำให้ฉัน productive", en: "Need clear schedules and rules — they make me productive", promptHint: "ต้องการโครงสร้างสูง → เหมาะกับสถาบันที่มีระบบการเรียนแบบ traditional" },
      { id: "B", th: "ชอบมีแนวทางหลัก แต่อยากมีพื้นที่ตัดสินใจเอง", en: "Like having guidelines but want room to decide", promptHint: "ต้องการกึ่งโครงสร้าง → ยืดหยุ่นได้ในหลายสภาพแวดล้อม" },
      { id: "C", th: "เรียนรู้ได้ดีที่สุดด้วยตัวเอง ไม่ชอบถูกบังคับ", en: "Learn best self-directed without feeling forced", promptHint: "อิสระสูง self-directed learner → เหมาะกับสาขาที่มีอิสระทางวิชาการ" },
      { id: "D", th: "ชอบเรียนจากประสบการณ์จริง (lab ฝึกงาน fieldwork)", en: "Learn best from real experience (labs, internships, fieldwork)", promptHint: "experiential learner → เหมาะกับสาขาที่มีภาคปฏิบัติ/ฝึกงานสูง" },
    ],
  },
  {
    id: 108,
    th: "เมื่อต้องตัดสินใจเรื่องสำคัญ คุณพึ่งพาอะไรมากที่สุด?",
    en: "When making an important decision, you rely most on...",
    options: [
      { id: "A", th: "ข้อมูล สถิติ และตรรกะเหตุผล", en: "Data, statistics, and logical reasoning", promptHint: "การตัดสินใจแบบวิเคราะห์ข้อมูล → เหมาะกับสายที่ต้องแก้ปัญหาซับซ้อน" },
      { id: "B", th: "ประสบการณ์และสัญชาตญาณของตัวเอง", en: "My own experience and gut instinct", promptHint: "พึ่งสัญชาตญาณ มีความมั่นใจในตัวเอง → ควรใช้ร่วมกับข้อมูลด้วย" },
      { id: "C", th: "ความคิดเห็นของคนที่ไว้ใจ (พ่อแม่ เพื่อน ครู)", en: "Opinions of people I trust (family, friends, teachers)", promptHint: "ต้องการ validation จากคนรอบข้าง → ควรเสริมความมั่นใจในการตัดสินใจตัวเอง" },
      { id: "D", th: "ค่านิยมและสิ่งที่ตัวเองเชื่อมั่นในระยะยาว", en: "My personal values and long-term beliefs", promptHint: "ตัดสินใจด้วยค่านิยม → มี sense of purpose ที่ชัดเจน" },
    ],
  },
  {
    id: 109,
    th: "ในยามที่ต้องแข่งขันกับคนอื่นโดยตรง คุณรู้สึกอย่างไร?",
    en: "When you need to compete directly against others, you feel...",
    options: [
      { id: "A", th: "มีไฟมากขึ้น การแข่งขันทำให้ฉันเก่งขึ้น", en: "More fired up — competition makes me sharper", promptHint: "competitive spirit สูง → เหมาะกับรอบ Admission และสาขาที่มีการแข่งขันสูง" },
      { id: "B", th: "โอเค แต่ชอบแข่งกับตัวเองมากกว่า", en: "Fine with it but prefer competing against my past self", promptHint: "self-competitive มากกว่า external → ชอบพัฒนาตัวเองมากกว่าชนะคนอื่น" },
      { id: "C", th: "กังวลกับผลลัพธ์มาก แต่ทำได้ถ้าเตรียมตัวดี", en: "Anxious about outcomes but can do it when well-prepared", promptHint: "ต้องการการเตรียมตัวที่ดีเพื่อลด anxiety → วางแผนล่วงหน้าช่วยได้มาก" },
      { id: "D", th: "ไม่ชอบการแข่งขัน ชอบเส้นทางที่ไม่ต้องสู้ตรงกัน", en: "Dislike competition — prefer paths with less direct rivalry", promptHint: "หลีกเลี่ยง direct competition → เหมาะกับเส้นทางที่มี alternative pathways" },
    ],
  },
  {
    id: 110,
    th: "แรงบันดาลใจหลักที่ผลักดันให้คุณอยากเรียนต่อระดับมหาวิทยาลัยคือ...",
    en: "The primary drive that motivates you to pursue higher education is...",
    options: [
      { id: "A", th: "ความรักในวิชาการและความอยากรู้อยากเห็น", en: "Love of learning and intellectual curiosity", promptHint: "intrinsic motivation สูง → ชอบสาขาที่เปิดโอกาสสำรวจความรู้เชิงลึก" },
      { id: "B", th: "อยากมีความมั่นคงทางการเงินและรายได้ที่ดี", en: "Wanting financial stability and a good income", promptHint: "แรงจูงใจด้านความมั่นคงทางการเงิน → เน้นสายวิชาชีพที่ตลาดงานดี" },
      { id: "C", th: "ต้องการสร้างผลกระทบเชิงบวกต่อสังคมหรือโลก", en: "Wanting to create positive impact on society or the world", promptHint: "mission-driven → เหมาะกับสายสังคม สาธารณสุข การศึกษา" },
      { id: "D", th: "ความคาดหวังของครอบครัวหรือคนรอบข้าง", en: "Family and social expectations motivating me", promptHint: "แรงจูงใจภายนอก → ควรสำรวจแรงจูงใจภายในเพื่อความยั่งยืนระยะยาว" },
    ],
  },
];

function getInternationalFit(answers: Record<number, string>): InternationalFit | null {
  const intlQuestion = QUIZ_QUESTIONS.find((q) => q.id === 9);
  if (!intlQuestion) return null;
  const answerId = answers[9];
  if (!answerId) return null;

  const selected = intlQuestion.options.find((o) => o.id === answerId);
  if (!selected || selected.internationalSignal == null) return null;

  if (selected.internationalSignal >= 2) return "high";
  if (selected.internationalSignal >= 1) return "medium";
  return "low";
}

function buildQuizSuggestion(answers: Record<number, string>, locale: string): QuizSuggestion {
  const isThai = locale !== "en";
  const selectedPairs = QUIZ_QUESTIONS.map((q) => {
    const answerId = answers[q.id];
    if (!answerId) return null;
    const option = q.options.find((o) => o.id === answerId);
    return option ? { q, option } : null;
  }).filter(Boolean) as Array<{ q: QuizQuestion; option: QuizQuestion["options"][number] }>;

  const picked = selectedPairs
    .slice(0, 2)
    .map(({ option }) => (isThai ? `"${option.th}"` : `"${option.en}"`));

  const styleLine =
    picked.length > 0
      ? isThai
        ? `แพตเทิร์นจากคำตอบของคุณ: ${picked.join(" / ")}`
        : `Patterns from your answers: ${picked.join(" / ")}`
      : isThai
      ? "ยังไม่มีคำตอบจากแบบสอบถาม"
      : "No quiz answers were selected";

  const actionLine = isThai
    ? "ใช้รูปแบบการเตรียมตัวที่เข้ากับนิสัยของตัวเองตอนวางแผนพอร์ต การสอบ และการสัมภาษณ์"
    : "Use your natural style when planning portfolio, exam prep, and interview practice";

  const fit = getInternationalFit(answers);
  const internationalText =
    fit === "high"
      ? isThai
        ? "ความพร้อมภาคนานาชาติ: สูง"
        : "International program readiness: High"
      : fit === "medium"
      ? isThai
        ? "ความพร้อมภาคนานาชาติ: ปานกลาง (แนะนำพัฒนาภาษาเพิ่ม)"
        : "International program readiness: Medium (improve language skills)"
      : fit === "low"
      ? isThai
        ? "ความพร้อมภาคนานาชาติ: ควรพัฒนาเพิ่มเติมก่อน"
        : "International program readiness: Needs more preparation"
      : null;

  return {
    lines: [styleLine, actionLine],
    internationalFit: fit,
    internationalText,
  };
}

// Constants

const ROUND_COLORS: Record<number, { bg: string; border: string; icon: string }> = {
  1: { bg: "bg-purple-50", border: "border-purple-200", icon: "text-purple-600" },
  2: { bg: "bg-blue-50", border: "border-blue-200", icon: "text-blue-600" },
  3: { bg: "bg-green-50", border: "border-green-200", icon: "text-green-600" },
  4: { bg: "bg-orange-50", border: "border-orange-200", icon: "text-orange-600" },
};

const SUITABILITY_LABEL: Record<string, { label: string; color: string }> = {
  high: { label: "เหมาะสมมาก", color: "text-green-600" },
  medium: { label: "เหมาะสมปานกลาง", color: "text-yellow-600" },
  low: { label: "เหมาะสมน้อย", color: "text-red-500" },
};

const PORTFOLIO_LABEL: Record<PortfolioQuality, { label: string; color: string; icon: React.ElementType }> = {
  excellent: { label: "ดีเยี่ยม", color: "text-green-600", icon: Trophy },
  good: { label: "ดี", color: "text-blue-600", icon: ThumbsUp },
  basic: { label: "พื้นฐาน", color: "text-yellow-600", icon: FileText },
  none: { label: "ยังไม่มี", color: "text-gray-400", icon: Minus },
};

const FIELDS = [
  "วิศวกรรมศาสตร์",
  "แพทยศาสตร์ / สาธารณสุข",
  "วิทยาศาสตร์ / เทคโนโลยี",
  "บริหารธุรกิจ / เศรษฐศาสตร์",
  "นิติศาสตร์ / รัฐศาสตร์",
  "ครุศาสตร์ / ศึกษาศาสตร์",
  "สถาปัตยกรรมศาสตร์ / ออกแบบ",
  "นิเทศศาสตร์ / สื่อสารมวลชน",
  "อักษรศาสตร์ / มนุษยศาสตร์",
  "สังคมศาสตร์",
  "เกษตรศาสตร์",
  "สัตวแพทยศาสตร์",
  "เภสัชศาสตร์",
  "ทันตแพทยศาสตร์",
  "พยาบาลศาสตร์",
  "อื่นๆ",
];

// Main

export default function PathfindingPage() {
  const { user, loading: authLoading } = useAuth();
  const locale = useLocale();

  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PathfindingResult | null>(null);
  const [quizSuggestion, setQuizSuggestion] = useState<QuizSuggestion | null>(null);

  // Quiz
  const [quizDone, setQuizDone] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});

  // Deep quiz
  const [deepQuizMode, setDeepQuizMode] = useState(false);
  const [deepQuizDone, setDeepQuizDone] = useState(false);
  const [deepQuizAnswers, setDeepQuizAnswers] = useState<Record<number, string>>({});
  const [deepAnalyzing, setDeepAnalyzing] = useState(false);
  const [deepResult, setDeepResult] = useState<PathfindingResult | null>(null);

  // Optional overrides
  const [targetField, setTargetField] = useState("");
  const [targetUniversity, setTargetUniversity] = useState("");

  useEffect(() => {
    if (!user) {
      setLoadingProfile(false);
      return;
    }
    fetch("/api/pathfinding")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setProfile(d.data as ProfileSummary);
          if (d.data.careerGoalField) setTargetField(d.data.careerGoalField);
          if (d.data.careerGoalUniversities?.[0]) setTargetUniversity(d.data.careerGoalUniversities[0]);
        } else {
          toast.error(d.error || "ไม่สามารถโหลดข้อมูลโปรไฟล์ได้");
        }
      })
      .catch(() => toast.error("ไม่สามารถเชื่อมต่อได้"))
      .finally(() => setLoadingProfile(false));
  }, [user]);

  async function handleAnalyze() {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนใช้งาน");
      return;
    }
    if (!targetField) {
      toast.error("กรุณาเลือกสาขา/คณะที่สนใจก่อน");
      return;
    }
    setAnalyzing(true);
    try {
      const localQuizSuggestion = buildQuizSuggestion(quizAnswers, locale);
      setQuizSuggestion(localQuizSuggestion);

      const quizSummary = QUIZ_QUESTIONS
        .map((q) => {
          const answerId = quizAnswers[q.id];
          if (!answerId) return null;
          const option = q.options.find((o) => o.id === answerId);
          if (!option) return null;
          return locale !== "en"
            ? `${q.th}: ${option.th}`
            : `${q.en}: ${option.en}`;
        })
        .filter(Boolean) as string[];

      const quizInsights = QUIZ_QUESTIONS
        .map((q) => {
          const answerId = quizAnswers[q.id];
          if (!answerId) return null;
          const option = q.options.find((o) => o.id === answerId);
          return option ? option.promptHint : null;
        })
        .filter(Boolean) as string[];

      const res = await fetch("/api/pathfinding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetField,
          targetUniversity: targetUniversity || undefined,
          quizInsights: quizInsights.length > 0 ? quizInsights : undefined,
          quizSummary: quizSummary.length > 0 ? quizSummary : undefined,
          internationalFit: localQuizSuggestion.internationalFit ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        return;
      }
      setResult(data.data as PathfindingResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleDeepAnalyze(deepAnswers: Record<number, string>) {
    setDeepQuizAnswers(deepAnswers);
    setDeepQuizDone(true);
    setDeepAnalyzing(true);
    try {
      const deepQuizInsights = DEEP_QUIZ_QUESTIONS
        .map((q) => {
          const answerId = deepAnswers[q.id];
          if (!answerId) return null;
          const option = q.options.find((o) => o.id === answerId);
          return option ? option.promptHint : null;
        })
        .filter(Boolean) as string[];

      const deepQuizSummary = DEEP_QUIZ_QUESTIONS
        .map((q) => {
          const answerId = deepAnswers[q.id];
          if (!answerId) return null;
          const option = q.options.find((o) => o.id === answerId);
          if (!option) return null;
          return locale !== "en" ? `${q.th}: ${option.th}` : `${q.en}: ${option.en}`;
        })
        .filter(Boolean) as string[];

      const shallowInsights = QUIZ_QUESTIONS
        .map((q) => {
          const answerId = quizAnswers[q.id];
          if (!answerId) return null;
          const option = q.options.find((o) => o.id === answerId);
          return option ? option.promptHint : null;
        })
        .filter(Boolean) as string[];

      const res = await fetch("/api/pathfinding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetField,
          targetUniversity: targetUniversity || undefined,
          quizInsights: shallowInsights.length > 0 ? shallowInsights : undefined,
          deepQuizInsights: deepQuizInsights.length > 0 ? deepQuizInsights : undefined,
          deepQuizSummary: deepQuizSummary.length > 0 ? deepQuizSummary : undefined,
          isDeepAnalysis: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "เกิดข้อผิดพลาด กรุณาลองใหม่");
        setDeepQuizMode(false);
        return;
      }
      setDeepResult(data.data as PathfindingResult);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.error("ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่");
      setDeepQuizMode(false);
    } finally {
      setDeepAnalyzing(false);
    }
  }

  if (authLoading || (user && loadingProfile)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin text-pink-500 w-10 h-10 mx-auto" />
          <p className="text-gray-500 text-sm">กำลังโหลดข้อมูลโปรไฟล์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <Breadcrumbs
          items={[
            { label: "หน้าหลัก", href: "/" },
            { label: "ค้นเส้นทาง TCAS", href: "/pathfinding" },
          ]}
        />

        {/* Header */}
        <div className="flex items-center gap-3 mt-4 mb-8">
          <div className="p-3 bg-pink-100 rounded-2xl">
            <Map className="w-8 h-8 text-pink-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ระบบค้นเส้นทาง TCAS</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              AI วิเคราะห์โปรไฟล์ของคุณเพื่อแนะนำรอบสมัครที่เหมาะสมที่สุด
            </p>
          </div>
        </div>

        {!user ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
            <UserCircle2 className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-700 font-semibold">กรุณาเข้าสู่ระบบก่อนใช้งาน</p>
            <p className="text-sm text-gray-500">ระบบต้องการข้อมูลโปรไฟล์ของคุณเพื่อวิเคราะห์เส้นทาง TCAS</p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-pink-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-pink-700 transition"
            >
              เข้าสู่ระบบ <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : deepResult ? (
          <DeepResultView
            result={deepResult}
            locale={locale}
            onBack={() => {
              setDeepResult(null);
              setDeepQuizMode(false);
              setDeepQuizDone(false);
              setDeepQuizAnswers({});
            }}
          />
        ) : deepAnalyzing ? (
          <div className="min-h-[200px] flex flex-col items-center justify-center gap-3 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Loader2 className="animate-spin text-violet-500 w-10 h-10" />
            <p className="text-gray-600 text-sm font-medium">
              {locale !== "en" ? "AI กำลังวิเคราะห์เชิงลึก..." : "AI is performing deep analysis..."}
            </p>
            <p className="text-xs text-gray-400">
              {locale !== "en" ? "อาจใช้เวลาสักครู่" : "This may take a moment"}
            </p>
          </div>
        ) : (deepQuizMode && !deepQuizDone) ? (
          <QuizStep
            questions={DEEP_QUIZ_QUESTIONS}
            locale={locale}
            onComplete={handleDeepAnalyze}
            onSkip={() => { setDeepQuizMode(false); setDeepQuizDone(false); }}
          />
        ) : result ? (
          <ResultView
            result={result}
            profile={profile}
            locale={locale}
            quizSuggestion={quizSuggestion}
            onStartDeepQuiz={() => setDeepQuizMode(true)}
            onReset={() => {
              setResult(null);
              setQuizSuggestion(null);
            }}
          />
        ) : !quizDone ? (
          <QuizStep
            questions={QUIZ_QUESTIONS}
            locale={locale}
            onComplete={(answers) => { setQuizAnswers(answers); setQuizDone(true); }}
            onSkip={() => setQuizDone(true)}
          />
        ) : (
          <div className="space-y-5">
            {/* Profile data card */}
            {profile && <ProfileCard profile={profile} />}

            {/* Missing data warning */}
            {profile && profile.missingItems.length > 0 && (
              <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-700">ข้อมูลโปรไฟล์ยังไม่ครบ</p>
                  <ul className="mt-1 space-y-0.5">
                    {profile.missingItems.map((item, i) => (
                      <li key={i} className="text-xs text-amber-600">- {item}</li>
                    ))}
                  </ul>
                  <Link href="/profile" className="inline-flex items-center gap-1 mt-2 text-xs text-amber-700 font-medium underline underline-offset-2">
                    <ExternalLink className="w-3 h-3" /> ไปกรอกข้อมูลโปรไฟล์
                  </Link>
                </div>
              </div>
            )}

            {/* Target field & university */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <h2 className="font-semibold text-gray-800">เป้าหมาย</h2>
                {profile?.careerGoalField && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                    ดึงจากโปรไฟล์
                  </span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  สาขา / คณะที่สนใจ <span className="text-red-500">*</span>
                </label>
                <select
                  value={targetField}
                  onChange={(e) => setTargetField(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"
                >
                  <option value="">-- เลือกสาขา --</option>
                  {FIELDS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  มหาวิทยาลัยเป้าหมาย{" "}
                  <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                  {profile?.careerGoalUniversities?.[0] && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      ดึงจากโปรไฟล์
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  placeholder="เช่น จุฬาลงกรณ์มหาวิทยาลัย, มหาวิทยาลัยมหิดล"
                  value={targetUniversity}
                  onChange={(e) => setTargetUniversity(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>
            </div>

            {/* Analyze button */}
            {/* Deep quiz nudge */}
            <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-start gap-3">
              <Brain className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-violet-800">
                  {locale !== "en" ? "ต้องการการวิเคราะห์ที่ลึกกว่านี้?" : "Want a deeper, more personal analysis?"}
                </p>
                <p className="text-xs text-violet-600 mt-0.5 leading-relaxed">
                  {locale !== "en"
                    ? "ตอบ 10 คำถามเชิงลึก เพื่อให้ AI วิเคราะห์จุดแข็ง สไตล์การเรียน และเป้าหมายระยะยาวของคุณ สำหรับผลวิเคราะห์ที่แม่นยำและเป็นส่วนตัวยิ่งขึ้น"
                    : "Answer 10 in-depth questions so the AI can analyze your strengths, learning style, and long-term goals for a more precise recommendation"
                  }
                </p>
                <button
                  onClick={() => setDeepQuizMode(true)}
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-700 bg-violet-100 hover:bg-violet-200 px-3 py-1.5 rounded-lg transition"
                >
                  <Zap className="w-3 h-3" />
                  {locale !== "en" ? "เริ่มแบบทดสอบเชิงลึก" : "Start deep quiz"}
                </button>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!targetField || analyzing || !profile?.hasEnoughData}
              className="w-full py-4 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-2xl font-bold text-base transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI กำลังวิเคราะห์โปรไฟล์ของคุณ...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  วิเคราะห์เส้นทาง TCAS ด้วย AI
                </>
              )}
            </button>

            {!profile?.hasEnoughData && (
              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                <AlertCircle className="w-3 h-3" />
                กรุณากรอก GPAX ในโปรไฟล์ก่อนวิเคราะห์
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Profile preview card

function ProfileCard({ profile }: { profile: ProfileSummary }) {
  const gpaxColor =
    profile.gpax == null
      ? "text-gray-400"
      : profile.gpax >= 3.5
      ? "text-green-600"
      : profile.gpax >= 3.0
      ? "text-yellow-600"
      : "text-orange-500";

  const scoreCount = Object.keys(profile.scores).length;
  const portInfo = PORTFOLIO_LABEL[profile.portfolioQuality];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserCircle2 className="w-5 h-5 text-pink-500" />
          <h2 className="font-semibold text-gray-800">สรุปข้อมูลโปรไฟล์</h2>
        </div>
        <Link
          href="/profile"
          className="text-xs text-pink-600 hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> อัปเดตโปรไฟล์
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* GPAX */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className={`text-2xl font-bold ${gpaxColor}`}>
            {profile.gpax != null ? profile.gpax.toFixed(2) : "-"}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <GraduationCap className="w-3 h-3" /> GPAX
          </div>
        </div>

        {/* Scores */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className={`text-2xl font-bold ${scoreCount > 0 ? "text-blue-600" : "text-gray-400"}`}>
            {scoreCount}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <BookOpen className="w-3 h-3" /> คะแนนสอบ
          </div>
        </div>

        {/* Portfolio */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className={`flex items-center justify-center ${portInfo.color}`}>
            <portInfo.icon className="w-6 h-6" />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            พอร์ต ({profile.portfolioCount})
          </div>
          <div className={`text-xs font-medium ${portInfo.color}`}>{portInfo.label}</div>
        </div>

        {/* Activities */}
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <div className={`text-2xl font-bold ${profile.extracurricular.length > 0 ? "text-purple-600" : "text-gray-400"}`}>
            {profile.extracurricular.length}
          </div>
          <div className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
            <Target className="w-3 h-3" /> กิจกรรม
          </div>
        </div>
      </div>

      {/* Score details */}
      {scoreCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            คะแนนที่บันทึกไว้
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(profile.scores).map(([key, val]) => (
              <span key={key} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                {profile.scoreLabels[key] ?? key}: {val}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {profile.achievements.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Medal className="w-3 h-3 text-yellow-500" /> รางวัล / เกียรติบัตร
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.achievements.slice(0, 4).map((a, i) => (
              <span key={i} className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full">
                {a}
              </span>
            ))}
            {profile.achievements.length > 4 && (
              <span className="text-xs text-gray-400">+{profile.achievements.length - 4} รายการ</span>
            )}
          </div>
        </div>
      )}

      {/* School info */}
      {(profile.schoolName || profile.schoolType) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            <span className="font-medium">โรงเรียน:</span>{" "}
            {[profile.schoolName, profile.schoolType].filter(Boolean).join(" / ")}
          </p>
        </div>
      )}
    </div>
  );
}

// Result view

function ResultView({
  result,
  profile,
  locale,
  quizSuggestion,
  onStartDeepQuiz,
  onReset,
}: {
  result: PathfindingResult;
  profile: ProfileSummary | null;
  locale: string;
  quizSuggestion: QuizSuggestion | null;
  onStartDeepQuiz?: () => void;
  onReset: () => void;
}) {
  const isThai = locale !== "en";
  const sortedRounds = [...result.rounds].sort((a, b) => b.score - a.score);
  const topRound = result.rounds.find((r) => r.round === result.topRecommendation);

  return (
    <div className="space-y-6">
      {/* Personal message card */}
      <div className="bg-pink-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5" />
          <span className="font-semibold text-sm">ผลการวิเคราะห์จาก AI</span>
        </div>
        <p className="text-base leading-relaxed">{result.summary}</p>
        <div className="mt-4 bg-white/20 rounded-xl p-4">
          <p className="text-sm leading-relaxed italic">&ldquo;{result.personalMessage}&rdquo;</p>
        </div>
      </div>

      {/* Top recommendation highlight */}
      {topRound && (
        <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            <span className="font-bold text-yellow-700">รอบที่แนะนำมากที่สุด</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{topRound.name}</p>
          <p className="text-sm text-gray-600 mt-1">
            คะแนนความเหมาะสม:{" "}
            <span className="font-bold text-yellow-600">{topRound.score}/100</span>
          </p>
        </div>
      )}

      {/* All rounds */}
      <div>
        <h2 className="text-base font-bold text-gray-800 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-pink-500" />
          ความเหมาะสมในแต่ละรอบ
        </h2>
        <div className="space-y-4">
          {sortedRounds.map((round) => (
            <RoundCard key={round.round} round={round} isTop={round.round === result.topRecommendation} />
          ))}
        </div>
      </div>

      {/* Next steps */}
      {quizSuggestion && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
          <h3 className="font-bold text-emerald-800 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {isThai ? "คำแนะนำจากแบบสอบถาม" : "Quiz-based suggestions"}
          </h3>
          <ul className="space-y-2">
            {quizSuggestion.lines.map((line, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                {line}
              </li>
            ))}
          </ul>
          {quizSuggestion.internationalText && (
            <p className="mt-3 inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              {quizSuggestion.internationalText}
            </p>
          )}
        </div>
      )}

      {result.nextSteps?.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="font-bold text-blue-800 mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            ขั้นตอนถัดไปที่ควรทำ
          </h3>
          <ol className="space-y-2">
            {result.nextSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-blue-700">
                <span className="w-5 h-5 rounded-full bg-blue-200 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Profile used */}
      {profile && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">ข้อมูลที่ใช้วิเคราะห์</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {profile.gpax != null && (
              <span className="bg-white border rounded-full px-2.5 py-1 text-gray-600">GPAX {profile.gpax.toFixed(2)}</span>
            )}
            {Object.entries(profile.scores).map(([k, v]) => (
              <span key={k} className="bg-white border rounded-full px-2.5 py-1 text-gray-600">{k} {v}</span>
            ))}
            <span className="bg-white border rounded-full px-2.5 py-1 text-gray-600">
              พอร์ต: {PORTFOLIO_LABEL[profile.portfolioQuality].label}
            </span>
            {profile.achievements.length > 0 && (
              <span className="bg-white border rounded-full px-2.5 py-1 text-gray-600">
                รางวัล {profile.achievements.length} รายการ
              </span>
            )}
          </div>
        </div>
      )}

      {/* Deep quiz nudge */}
      {onStartDeepQuiz && (
        <div className="bg-violet-50 border border-violet-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-violet-800 text-sm">
                {isThai ? "ต้องการผลวิเคราะห์ที่ลึกกว่านี้?" : "Want an even deeper analysis?"}
              </p>
              <p className="text-xs text-violet-600 mt-1 leading-relaxed">
                {isThai
                  ? "ตอบ 10 คำถามเชิงลึกเพิ่มเติม เพื่อให้ AI วิเคราะห์จุดแข็ง สไตล์การเรียน และเป้าหมายระยะยาวของคุณ สำหรับผลวิเคราะห์ที่แม่นยำและเป็นส่วนตัวยิ่งขึ้น"
                  : "Answer 10 more in-depth questions so AI can analyze your strengths, learning style, and long-term goals in greater detail"
                }
              </p>
              <button
                onClick={onStartDeepQuiz}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition"
              >
                <Zap className="w-4 h-4" />
                {isThai ? "เริ่มแบบทดสอบเชิงลึก" : "Start deep analysis"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset button */}
      <button
        onClick={onReset}
        className="w-full py-3 border-2 border-pink-200 text-pink-600 rounded-xl font-semibold text-sm hover:bg-pink-50 transition-all flex items-center justify-center gap-2"
      >
        <Pencil className="w-4 h-4" />
        วิเคราะห์ใหม่อีกครั้ง
      </button>
    </div>
  );
}

// Round card

function RoundCard({ round, isTop }: { round: TCASRound; isTop: boolean }) {
  const [open, setOpen] = useState(false);
  const colors = ROUND_COLORS[round.round];
  const suit = SUITABILITY_LABEL[round.suitability];

  return (
    <div
      className={`rounded-2xl border-2 overflow-hidden transition-all ${colors.bg} ${
        isTop ? "border-yellow-400 shadow-md" : colors.border
      }`}
    >
      <button className="w-full text-left" onClick={() => setOpen((o) => !o)}>
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isTop && <Trophy className="w-4 h-4 text-yellow-500" />}
              <div>
                <p className="font-bold text-gray-900 text-sm">{round.name}</p>
                <p className={`text-xs font-medium ${suit.color}`}>{suit.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ScoreBar score={round.score} />
              {open ? (
                <ChevronDown className={`w-4 h-4 ${colors.icon} rotate-180`} />
              ) : (
                <ChevronDown className={`w-4 h-4 ${colors.icon}`} />
              )}
            </div>
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-current/10 px-4 pb-4 pt-3 space-y-3">
          {round.reasons?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">เหตุผล</p>
              <ul className="space-y-1">
                {round.reasons.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {round.tips?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">คำแนะนำ</p>
              <ul className="space-y-1">
                {round.tips.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500 shrink-0 mt-0.5" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {round.requiredItems?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">สิ่งที่ต้องเตรียม</p>
              <ul className="space-y-1">
                {round.requiredItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-green-500" : score >= 40 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-8 text-right">{score}</span>
    </div>
  );
}

// Quiz step — one question at a time

function QuizStep({
  questions = QUIZ_QUESTIONS,
  locale,
  onComplete,
  onSkip,
}: {
  questions?: QuizQuestion[];
  locale: string;
  onComplete: (answers: Record<number, string>) => void;
  onSkip: () => void;
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const total = questions.length;
  const q = questions[current];
  const isThai = locale !== "en";
  const questionText = isThai ? q.th : q.en;
  const selectedOption = answers[q.id];
  const isLast = current === total - 1;
  const progressPct = ((current + 1) / total) * 100;

  const label = isThai ? `คำถามที่ ${current + 1} จาก ${total}` : `Question ${current + 1} of ${total}`;
  const nextLabel = isThai ? (isLast ? "เสร็จสิ้น" : "ถัดไป") : (isLast ? "Done" : "Next");
  const backLabel = isThai ? "ย้อนกลับ" : "Back";
  const skipLabel = isThai ? "ข้ามแบบสอบถาม" : "Skip quiz";
  const headerLabel = isThai
    ? "แบบสอบถามเพื่อการวิเคราะห์ที่แม่นยำขึ้น"
    : "Personality Quiz for Better Analysis";

  function handleSelect(optionId: string) {
    setAnswers((prev) => ({ ...prev, [q.id]: optionId }));
  }

  function handleNext() {
    if (isLast) {
      onComplete(answers);
    } else {
      setCurrent((c) => c + 1);
    }
  }

  return (
    <div className="space-y-5">
      {/* Header + progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-500" />
            <h2 className="font-semibold text-gray-800 text-sm">{headerLabel}</h2>
          </div>
          <button
            onClick={onSkip}
            className="text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2"
          >
            {skipLabel}
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-xs font-semibold text-pink-600">{Math.round(progressPct)}%</span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex gap-1 pt-0.5">
            {questions.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i < current ? "bg-pink-300" : i === current ? "bg-pink-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <p className="text-base font-semibold text-gray-900 mb-5 leading-relaxed">
          {questionText}
        </p>
        <div className="space-y-3">
          {q.options.map((option) => {
            const optText = isThai ? option.th : option.en;
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 text-sm font-medium transition-all flex items-start gap-3 ${
                  isSelected
                    ? "border-pink-500 bg-pink-50 text-pink-800"
                    : "border-gray-200 hover:border-pink-300 hover:bg-pink-50/40 text-gray-700"
                }`}
              >
                <span
                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 mt-0.5 ${
                    isSelected ? "bg-pink-500 text-white" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {option.id}
                </span>
                {optText}
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        {current > 0 && (
          <button
            onClick={() => setCurrent((c) => c - 1)}
            className="flex-none px-5 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold text-sm hover:bg-gray-50 transition-all"
          >
            {backLabel}
          </button>
        )}
        <button
          onClick={handleNext}
          disabled={!selectedOption}
          className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-200 disabled:text-gray-400 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
        >
          {nextLabel}
          {!isLast && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// Deep result view — shown after deep quiz analysis

function DeepResultView({
  result,
  locale,
  onBack,
}: {
  result: PathfindingResult;
  locale: string;
  onBack: () => void;
}) {
  const isThai = locale !== "en";
  const sortedRounds = [...result.rounds].sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-violet-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5" />
          <span className="text-sm font-semibold">
            {isThai ? "ผลวิเคราะห์เชิงลึกจาก AI" : "Deep AI Analysis"}
          </span>
        </div>
        <p className="text-base leading-relaxed">{result.summary}</p>
        {result.personalMessage && (
          <div className="mt-4 bg-white/20 rounded-xl p-4">
            <p className="text-sm leading-relaxed italic">&ldquo;{result.personalMessage}&rdquo;</p>
          </div>
        )}
      </div>

      {/* TCAS round cards */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          {isThai ? "ความเหมาะสมของแต่ละรอบ TCAS" : "TCAS Round Suitability"}
        </h3>
        {sortedRounds.map((round) => (
          <RoundCard
            key={round.round}
            round={round}
            isTop={round.round === result.topRecommendation}
          />
        ))}
      </div>

      {/* Next steps */}
      {result.nextSteps?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-3">
          <h3 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-violet-500" />
            {isThai ? "ขั้นตอนต่อไป" : "Next Steps"}
          </h3>
          <ol className="space-y-2">
            {result.nextSteps.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-violet-100 text-violet-700 text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Back button */}
      <button
        onClick={onBack}
        className="w-full py-3 border-2 border-violet-200 text-violet-600 rounded-xl font-semibold text-sm hover:bg-violet-50 transition-all flex items-center justify-center gap-2"
      >
        <ArrowRight className="w-4 h-4 rotate-180" />
        {isThai ? "กลับดูผลวิเคราะห์หลัก" : "Back to main analysis"}
      </button>
    </div>
  );
}
