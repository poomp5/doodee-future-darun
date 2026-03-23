/**
 * Seed additional mock exam questions: TGAT2, A-LEVEL Math
 * Run with: npx tsx scripts/seed-mock-exam-more.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) { console.error('DATABASE_URL is not set'); process.exit(1); }

const sql = neon(DATABASE_URL);

function escape(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str).replace(/'/g, "''");
}

async function rawQuery(query: string) {
  const strings = [query] as unknown as TemplateStringsArray;
  Object.defineProperty(strings, 'raw', { value: [query] });
  return await sql(strings);
}

// ────────────────────────────────────────────
// TGAT2 - Critical Thinking (การคิดอย่างมีวิจารณญาณ)
// ────────────────────────────────────────────
async function seedTGAT2() {
  console.log('Seeding TGAT2 exam...');

  const examResult = await sql`
    INSERT INTO mock_exams (title, description, subject_code, exam_type, duration_minutes, total_score, pass_score, is_active, display_order)
    VALUES (
      'TGAT2 - การคิดอย่างมีวิจารณญาณ',
      'ข้อสอบวัดทักษะการคิดอย่างมีวิจารณญาณและการแก้ปัญหา ประกอบด้วย การวิเคราะห์เหตุผล การตีความข้อมูล และการแก้ปัญหาเชิงตรรกะ',
      'TGAT2',
      'TGAT',
      60,
      100,
      50,
      true,
      2
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `;

  let examId: number;
  if (examResult.length === 0) {
    const existing = await sql`SELECT id FROM mock_exams WHERE subject_code = 'TGAT2' LIMIT 1`;
    if (existing.length === 0) { console.log('  Skipped TGAT2'); return; }
    examId = existing[0].id;
    await sql`DELETE FROM mock_exam_sections WHERE exam_id = ${examId}`;
  } else {
    examId = examResult[0].id;
  }

  // ── Section 1: Logical Reasoning (50 points) ──
  const sec1Result = await sql`
    INSERT INTO mock_exam_sections (exam_id, title, description, section_order, score_weight)
    VALUES (${examId}, 'ส่วนที่ 1: การวิเคราะห์เหตุผลเชิงตรรกะ (Logical Reasoning)', 'ทดสอบความสามารถในการวิเคราะห์ข้อมูลและสรุปผลอย่างมีเหตุผล', 1, 50)
    RETURNING id
  `;
  const sec1Id = sec1Result[0].id;

  const logicQuestions = [
    { q: 'ถ้า "นักเรียนทุกคนที่ขยันจะสอบผ่าน" และ "สมชายสอบไม่ผ่าน" สรุปได้ว่าอะไร?', choices: ['A) สมชายไม่ขยัน', 'B) สมชายขยันแต่โชคร้าย', 'C) ข้อสอบยากเกินไป', 'D) ไม่สามารถสรุปได้'], answer: 'A', explanation: 'จากประพจน์ "ถ้า ก แล้ว ข" ถ้า "ไม่ ข" แล้ว "ไม่ ก" (Contrapositive)' },
    { q: 'ลำดับตัวเลข: 2, 6, 18, 54, ? ตัวเลขถัดไปคืออะไร?', choices: ['A) 108', 'B) 162', 'C) 216', 'D) 72'], answer: 'B', explanation: 'เป็นลำดับเรขาคณิต คูณด้วย 3: 2×3=6, 6×3=18, 18×3=54, 54×3=162' },
    { q: 'ถ้า A > B, B > C, C > D แล้วข้อใดถูกต้อง?', choices: ['A) D > A', 'B) A > D', 'C) B > D เท่านั้น', 'D) ไม่สามารถเปรียบเทียบ A กับ D ได้'], answer: 'B', explanation: 'จากสมบัติการถ่ายทอด (Transitive property): A > B > C > D ดังนั้น A > D' },
    { q: 'ในกลุ่ม 100 คน 70 คนชอบกาแฟ 50 คนชอบชา ถ้าทุกคนชอบอย่างน้อย 1 อย่าง กี่คนชอบทั้งสองอย่าง?', choices: ['A) 10 คน', 'B) 20 คน', 'C) 30 คน', 'D) 40 คน'], answer: 'B', explanation: 'จากหลัก Inclusion-Exclusion: 70 + 50 - 100 = 20 คน' },
    { q: '"สัตว์ทุกตัวที่มีปีกบินได้" - ข้อใดเป็นตัวอย่างค้าน (Counterexample)?', choices: ['A) นกอินทรีบินได้', 'B) เพนกวินมีปีกแต่บินไม่ได้', 'C) ปลาว่ายน้ำได้', 'D) แมวไม่มีปีก'], answer: 'B', explanation: 'เพนกวินมีปีกแต่บินไม่ได้ เป็นตัวอย่างค้านที่หักล้างข้อความนี้' },
    { q: 'ถ้าวันนี้เป็นวันจันทร์ อีก 100 วันจะเป็นวันอะไร?', choices: ['A) วันพุธ', 'B) วันพฤหัสบดี', 'C) วันศุกร์', 'D) วันเสาร์'], answer: 'A', explanation: '100 ÷ 7 = 14 เศษ 2 ดังนั้น วันจันทร์ + 2 = วันพุธ' },
    { q: 'ร้านค้ามีสินค้า 3 ประเภท: A, B, C ลูกค้า 40% ซื้อ A, 30% ซื้อ B, 30% ซื้อ C ไม่มีใครซื้อมากกว่า 1 ประเภท ถ้ามีลูกค้า 200 คน กี่คนซื้อ B?', choices: ['A) 40 คน', 'B) 50 คน', 'C) 60 คน', 'D) 80 คน'], answer: 'C', explanation: '200 × 30% = 60 คน' },
    { q: 'ถ้า "ฝนตกแล้วถนนเปียก" ข้อใดสรุปได้?', choices: ['A) ถนนเปียก แสดงว่าฝนตก', 'B) ฝนไม่ตก แสดงว่าถนนไม่เปียก', 'C) ถนนไม่เปียก แสดงว่าฝนไม่ตก', 'D) ถนนเปียก แสดงว่าฝนจะตกอีก'], answer: 'C', explanation: 'Contrapositive: "ถ้า ไม่ ข แล้ว ไม่ ก" เป็นจริงเสมอ' },
    { q: 'แผนภูมิแท่งแสดงยอดขาย: ม.ค. = 100, ก.พ. = 150, มี.ค. = 120 อัตราการเปลี่ยนแปลงจาก ก.พ. ถึง มี.ค. คือเท่าไร?', choices: ['A) เพิ่ม 20%', 'B) ลด 20%', 'C) ลด 30%', 'D) เพิ่ม 30%'], answer: 'B', explanation: '(120-150)/150 × 100 = -20% (ลดลง 20%)' },
    { q: 'A พูดว่า "B โกหก" B พูดว่า "C โกหก" C พูดว่า "A และ B โกหก" ถ้ามีคนพูดจริง 1 คน ใครพูดจริง?', choices: ['A) A', 'B) B', 'C) C', 'D) ไม่มีใครพูดจริง'], answer: 'B', explanation: 'ถ้า B พูดจริง → C โกหก → "A และ B โกหก" เป็นเท็จ → อย่างน้อย A หรือ B พูดจริง (สอดคล้อง) และ A พูดว่า B โกหก (ซึ่งเป็นเท็จ เพราะ B พูดจริง) ดังนั้น A โกหก → สอดคล้องกัน' },
    { q: 'ถ้าเรียงลำดับตัวอักษร: Z, X, V, T, ? ตัวอักษรถัดไปคืออะไร?', choices: ['A) R', 'B) S', 'C) Q', 'D) P'], answer: 'A', explanation: 'ลดลงทีละ 2: Z(-2)=X(-2)=V(-2)=T(-2)=R' },
    { q: 'นักเรียน 5 คนนั่งเรียงแถว A ต้องนั่งติด B แต่ไม่ติด C จัดได้กี่แบบ?', choices: ['A) 24 แบบ', 'B) 36 แบบ', 'C) 48 แบบ', 'D) 72 แบบ'], answer: 'B', explanation: 'AB เป็นกลุ่ม: 4!×2! = 48, ลบกรณี C ติด AB: ต้องคำนวณ = 48-12 = 36' },
    { q: 'ข้อมูล: 3, 5, 7, 9, 11 ค่ามัธยฐาน (Median) คือเท่าไร?', choices: ['A) 5', 'B) 7', 'C) 9', 'D) 35'], answer: 'B', explanation: 'มัธยฐานคือค่ากลางของข้อมูลที่เรียงลำดับ ตำแหน่งที่ 3 คือ 7' },
    { q: 'บริษัทมีพนักงาน 50 คน เงินเดือนเฉลี่ย 30,000 บาท ถ้ารับพนักงานใหม่ 1 คน เงินเดือน 80,000 บาท เงินเดือนเฉลี่ยใหม่ประมาณเท่าไร?', choices: ['A) 30,000 บาท', 'B) 30,980 บาท', 'C) 32,000 บาท', 'D) 55,000 บาท'], answer: 'B', explanation: '(50×30,000 + 80,000) ÷ 51 = 1,580,000 ÷ 51 ≈ 30,980 บาท' },
    { q: 'กราฟเส้นแสดงอุณหภูมิ 7 วัน: 28, 30, 29, 32, 31, 33, 35 แนวโน้มคือ?', choices: ['A) คงที่', 'B) ลดลงต่อเนื่อง', 'C) เพิ่มขึ้นโดยรวม', 'D) ไม่มีแนวโน้ม'], answer: 'C', explanation: 'แม้มีขึ้นลงบ้าง แต่แนวโน้มโดยรวมเพิ่มขึ้นจาก 28 เป็น 35' },
  ];

  for (let i = 0; i < logicQuestions.length; i++) {
    const q = logicQuestions[i];
    await rawQuery(`
      INSERT INTO mock_exam_questions (section_id, question_text, question_type, choices, correct_answer, explanation, question_order, score)
      VALUES (${sec1Id}, '${escape(q.q)}', 'multiple_choice', '${JSON.stringify(q.choices).replace(/'/g, "''")}'::jsonb, '${q.answer}', '${escape(q.explanation)}', ${i + 1}, 1)
    `);
  }

  // ── Section 2: Data Interpretation & Problem Solving (50 points) ──
  const sec2Result = await sql`
    INSERT INTO mock_exam_sections (exam_id, title, description, section_order, score_weight)
    VALUES (${examId}, 'ส่วนที่ 2: การตีความข้อมูลและแก้ปัญหา (Data Interpretation)', 'ทดสอบความสามารถในการอ่านและตีความข้อมูลจากตาราง กราฟ และสถานการณ์ต่างๆ', 2, 50)
    RETURNING id
  `;
  const sec2Id = sec2Result[0].id;

  const dataQuestions = [
    { q: 'ตารางแสดงจำนวนนักศึกษา: คณะวิศวะ 500, วิทย์ 300, อักษร 200 สัดส่วนคณะวิทย์ต่อทั้งหมดคือเท่าไร?', choices: ['A) 20%', 'B) 30%', 'C) 50%', 'D) 60%'], answer: 'B', explanation: '300 ÷ (500+300+200) × 100 = 300 ÷ 1000 × 100 = 30%' },
    { q: 'ผลสำรวจ: 60% ของนักเรียน 500 คนเลือกเรียนสายวิทย์ กี่คนเลือกเรียนสายวิทย์?', choices: ['A) 200 คน', 'B) 250 คน', 'C) 300 คน', 'D) 350 คน'], answer: 'C', explanation: '500 × 60% = 300 คน' },
    { q: 'ต้นทุนสินค้า 80 บาท ขายราคา 120 บาท กำไรคิดเป็นกี่ % ของต้นทุน?', choices: ['A) 33.3%', 'B) 40%', 'C) 50%', 'D) 66.7%'], answer: 'C', explanation: '(120-80)/80 × 100 = 40/80 × 100 = 50%' },
    { q: 'รถวิ่ง 120 กม. ใช้เวลา 1.5 ชม. ถ้าวิ่งต่อด้วยความเร็วเดิมอีก 2 ชม. จะวิ่งได้ทั้งหมดกี่ กม.?', choices: ['A) 240 กม.', 'B) 280 กม.', 'C) 320 กม.', 'D) 360 กม.'], answer: 'B', explanation: 'ความเร็ว = 120/1.5 = 80 กม./ชม. รวม 3.5 ชม. × 80 = 280 กม.' },
    { q: 'ประชากรเมือง A: ปี 2020 = 10,000 ปี 2021 = 10,500 ปี 2022 = 11,025 อัตราการเพิ่มต่อปีคือ?', choices: ['A) 3%', 'B) 5%', 'C) 7%', 'D) 10%'], answer: 'B', explanation: '10,500/10,000 = 1.05 → เพิ่ม 5% ต่อปี' },
    { q: 'น้ำหนักผลไม้ 5 ชนิด (กก.): 2, 3, 5, 4, 6 ค่าเฉลี่ย (Mean) คือ?', choices: ['A) 3 กก.', 'B) 4 กก.', 'C) 5 กก.', 'D) 6 กก.'], answer: 'B', explanation: '(2+3+5+4+6)/5 = 20/5 = 4 กก.' },
    { q: 'ลดราคา 20% จากราคาเดิม 500 บาท แล้วลดอีก 10% จากราคาที่ลดแล้ว ราคาสุดท้ายคือ?', choices: ['A) 350 บาท', 'B) 360 บาท', 'C) 380 บาท', 'D) 400 บาท'], answer: 'B', explanation: '500 × 0.8 = 400, 400 × 0.9 = 360 บาท' },
    { q: 'อัตราส่วนชาย:หญิง = 3:5 ถ้ามีหญิง 40 คน มีชายกี่คน?', choices: ['A) 20 คน', 'B) 24 คน', 'C) 30 คน', 'D) 32 คน'], answer: 'B', explanation: '3/5 = x/40, x = 3×40/5 = 24 คน' },
    { q: 'ฝากเงิน 10,000 บาท ดอกเบี้ย 2% ต่อปี (ทบต้น) หลัง 2 ปีจะมีเงินเท่าไร?', choices: ['A) 10,200 บาท', 'B) 10,400 บาท', 'C) 10,404 บาท', 'D) 10,404.08 บาท'], answer: 'C', explanation: '10,000 × 1.02² = 10,000 × 1.0404 = 10,404 บาท' },
    { q: 'ถ้าทำงานคนเดียว A ใช้เวลา 6 ชม. B ใช้เวลา 12 ชม. ถ้าทำงานด้วยกันจะเสร็จใน?', choices: ['A) 3 ชม.', 'B) 4 ชม.', 'C) 6 ชม.', 'D) 9 ชม.'], answer: 'B', explanation: 'อัตราการทำงานรวม: 1/6 + 1/12 = 3/12 = 1/4 ใช้เวลา 4 ชม.' },
    { q: 'สี่เหลี่ยมผืนผ้ากว้าง 5 ม. ยาว 8 ม. พื้นที่เท่ากับวงกลมรัศมีเท่าไร? (ใช้ π ≈ 3.14)', choices: ['A) ≈ 3.56 ม.', 'B) ≈ 4.00 ม.', 'C) ≈ 5.00 ม.', 'D) ≈ 6.37 ม.'], answer: 'A', explanation: 'พื้นที่ = 40 ตร.ม. πr² = 40, r² = 40/3.14 ≈ 12.74, r ≈ 3.57 ม.' },
    { q: 'กราฟวงกลมแสดงงบประมาณ: การศึกษา 35%, สาธารณสุข 25%, คมนาคม 20%, อื่นๆ 20% งบ 1,000 ล้าน สาธารณสุขได้เท่าไร?', choices: ['A) 200 ล้าน', 'B) 250 ล้าน', 'C) 300 ล้าน', 'D) 350 ล้าน'], answer: 'B', explanation: '1,000 × 25% = 250 ล้านบาท' },
    { q: 'ข้อมูลคะแนนสอบ: 50, 60, 70, 80, 90 ส่วนเบี่ยงเบนมาตรฐาน (SD) ใกล้เคียงค่าใดมากที่สุด?', choices: ['A) 10', 'B) 14.14', 'C) 20', 'D) 25'], answer: 'B', explanation: 'Mean = 70, Variance = ((−20)²+(−10)²+0²+10²+20²)/5 = 200, SD = √200 ≈ 14.14' },
    { q: 'โรงเรียนมี 3 ชั้น ชั้น ม.4 = 120 คน, ม.5 = 100 คน, ม.6 = 80 คน ถ้าสุ่มนักเรียน 1 คน โอกาสได้ ม.6 เท่าไร?', choices: ['A) 20%', 'B) 26.7%', 'C) 33.3%', 'D) 40%'], answer: 'B', explanation: '80/(120+100+80) = 80/300 ≈ 26.7%' },
    { q: 'รถไฟออกจากสถานี A เวลา 8:00 ถึงสถานี B เวลา 10:30 ระยะทาง 200 กม. ความเร็วเฉลี่ยคือ?', choices: ['A) 60 กม./ชม.', 'B) 70 กม./ชม.', 'C) 80 กม./ชม.', 'D) 90 กม./ชม.'], answer: 'C', explanation: 'เวลา = 2.5 ชม. ความเร็ว = 200/2.5 = 80 กม./ชม.' },
  ];

  for (let i = 0; i < dataQuestions.length; i++) {
    const q = dataQuestions[i];
    await rawQuery(`
      INSERT INTO mock_exam_questions (section_id, question_text, question_type, choices, correct_answer, explanation, question_order, score)
      VALUES (${sec2Id}, '${escape(q.q)}', 'multiple_choice', '${JSON.stringify(q.choices).replace(/'/g, "''")}'::jsonb, '${q.answer}', '${escape(q.explanation)}', ${15 + i + 1}, 1)
    `);
  }

  console.log('  TGAT2 seeded: 2 sections, 30 questions');
  return examId;
}

// ────────────────────────────────────────────
// A-LEVEL Math (คณิตศาสตร์)
// ────────────────────────────────────────────
async function seedALevelMath() {
  console.log('Seeding A-LEVEL Math exam...');

  const examResult = await sql`
    INSERT INTO mock_exams (title, description, subject_code, exam_type, duration_minutes, total_score, pass_score, is_active, display_order)
    VALUES (
      'A-LEVEL คณิตศาสตร์ประยุกต์ 1',
      'ข้อสอบวัดความรู้คณิตศาสตร์ประยุกต์ ประกอบด้วย พีชคณิต เรขาคณิตวิเคราะห์ แคลคูลัส สถิติ และความน่าจะเป็น',
      'MATH',
      'A-LEVEL',
      90,
      100,
      50,
      true,
      3
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `;

  let examId: number;
  if (examResult.length === 0) {
    const existing = await sql`SELECT id FROM mock_exams WHERE subject_code = 'MATH' AND exam_type = 'A-LEVEL' LIMIT 1`;
    if (existing.length === 0) { console.log('  Skipped A-LEVEL Math'); return; }
    examId = existing[0].id;
    await sql`DELETE FROM mock_exam_sections WHERE exam_id = ${examId}`;
  } else {
    examId = examResult[0].id;
  }

  // ── Section 1: Algebra & Functions ──
  const sec1Result = await sql`
    INSERT INTO mock_exam_sections (exam_id, title, description, section_order, score_weight)
    VALUES (${examId}, 'ส่วนที่ 1: พีชคณิตและฟังก์ชัน (Algebra & Functions)', 'พหุนาม สมการ อสมการ ลำดับอนุกรม ฟังก์ชัน', 1, 40)
    RETURNING id
  `;
  const sec1Id = sec1Result[0].id;

  const algebraQuestions = [
    { q: 'ถ้า f(x) = 2x² - 3x + 1 แล้ว f(2) มีค่าเท่ากับ?', choices: ['A) 1', 'B) 3', 'C) 5', 'D) 7'], answer: 'B', explanation: 'f(2) = 2(4) - 3(2) + 1 = 8 - 6 + 1 = 3' },
    { q: 'คำตอบของสมการ x² - 5x + 6 = 0 คือ?', choices: ['A) x = 1, 6', 'B) x = 2, 3', 'C) x = -2, -3', 'D) x = -1, 6'], answer: 'B', explanation: 'แยกตัวประกอบ: (x-2)(x-3) = 0, x = 2 หรือ x = 3' },
    { q: 'ผลรวมอนุกรม 1 + 2 + 3 + ... + 100 เท่ากับ?', choices: ['A) 4,950', 'B) 5,050', 'C) 5,100', 'D) 10,000'], answer: 'B', explanation: 'ใช้สูตร n(n+1)/2 = 100(101)/2 = 5,050' },
    { q: 'ถ้า log₂(x) = 5 แล้ว x มีค่าเท่ากับ?', choices: ['A) 10', 'B) 25', 'C) 32', 'D) 64'], answer: 'C', explanation: 'log₂(x) = 5 → x = 2⁵ = 32' },
    { q: 'ผลต่างของอนุกรมเลขคณิต (Arithmetic Sequence): 3, 7, 11, 15, ... พจน์ที่ 20 คือ?', choices: ['A) 75', 'B) 79', 'C) 80', 'D) 83'], answer: 'B', explanation: 'a₂₀ = 3 + (20-1)×4 = 3 + 76 = 79' },
    { q: 'ถ้า (x+2)/(x-1) = 3 แล้ว x มีค่าเท่ากับ?', choices: ['A) 2', 'B) 2.5', 'C) 3', 'D) 5'], answer: 'B', explanation: 'x+2 = 3(x-1) → x+2 = 3x-3 → 5 = 2x → x = 2.5' },
    { q: 'ถ้า f(x) = x³ - 6x² + 11x - 6 แล้ว f(1) + f(2) + f(3) เท่ากับ?', choices: ['A) -6', 'B) 0', 'C) 6', 'D) 12'], answer: 'B', explanation: 'f(1) = 1-6+11-6 = 0, f(2) = 8-24+22-6 = 0, f(3) = 27-54+33-6 = 0, รวม = 0 (เพราะ 1,2,3 เป็นรากของพหุนาม)' },
    { q: 'ค่าของ |3 - 7| + |7 - 3| เท่ากับ?', choices: ['A) 0', 'B) 4', 'C) 8', 'D) 10'], answer: 'C', explanation: '|3-7| = |-4| = 4, |7-3| = |4| = 4, รวม = 8' },
    { q: 'ถ้า 2ˣ = 8 แล้ว 4ˣ เท่ากับ?', choices: ['A) 16', 'B) 32', 'C) 64', 'D) 128'], answer: 'C', explanation: '2ˣ = 8 → x = 3, 4ˣ = 4³ = 64 หรือ 4ˣ = (2²)ˣ = 2²ˣ = (2ˣ)² = 8² = 64' },
    { q: 'เซต A = {1,2,3,4,5} B = {3,4,5,6,7} จำนวนสมาชิกของ A∪B เท่ากับ?', choices: ['A) 5', 'B) 7', 'C) 10', 'D) 3'], answer: 'B', explanation: 'A∪B = {1,2,3,4,5,6,7} มี 7 สมาชิก' },
  ];

  for (let i = 0; i < algebraQuestions.length; i++) {
    const q = algebraQuestions[i];
    await rawQuery(`
      INSERT INTO mock_exam_questions (section_id, question_text, question_type, choices, correct_answer, explanation, question_order, score)
      VALUES (${sec1Id}, '${escape(q.q)}', 'multiple_choice', '${JSON.stringify(q.choices).replace(/'/g, "''")}'::jsonb, '${q.answer}', '${escape(q.explanation)}', ${i + 1}, 1)
    `);
  }

  // ── Section 2: Statistics & Probability ──
  const sec2Result = await sql`
    INSERT INTO mock_exam_sections (exam_id, title, description, section_order, score_weight)
    VALUES (${examId}, 'ส่วนที่ 2: สถิติและความน่าจะเป็น (Statistics & Probability)', 'การนำเสนอข้อมูล ค่ากลาง การกระจาย ความน่าจะเป็น', 2, 30)
    RETURNING id
  `;
  const sec2Id = sec2Result[0].id;

  const statsQuestions = [
    { q: 'โยนเหรียญ 3 ครั้ง ความน่าจะเป็นที่จะได้หัวอย่างน้อย 2 ครั้ง คือ?', choices: ['A) 1/2', 'B) 3/8', 'C) 1/4', 'D) 1/8'], answer: 'A', explanation: 'P(2 หัว) = C(3,2)×(1/2)³ = 3/8, P(3 หัว) = 1/8, รวม = 4/8 = 1/2' },
    { q: 'ข้อมูล: 10, 20, 30, 40, 50 ค่าเบี่ยงเบนเฉลี่ย (MAD) คือ?', choices: ['A) 8', 'B) 10', 'C) 12', 'D) 14'], answer: 'C', explanation: 'Mean = 30, MAD = (|10-30|+|20-30|+|30-30|+|40-30|+|50-30|)/5 = (20+10+0+10+20)/5 = 12' },
    { q: 'หยิบไพ่ 1 ใบจากสำรับ 52 ใบ ความน่าจะเป็นที่ได้ไพ่โพดำหรือเอซ คือ?', choices: ['A) 15/52', 'B) 16/52', 'C) 17/52', 'D) 4/13'], answer: 'B', explanation: 'โพดำ 13 ใบ + เอซ 4 ใบ - เอซโพดำ 1 ใบ = 16/52 = 4/13' },
    { q: 'ข้อมูลคะแนน: 5, 5, 7, 8, 8, 8, 9 ฐานนิยม (Mode) คือ?', choices: ['A) 5', 'B) 7', 'C) 8', 'D) 9'], answer: 'C', explanation: '8 ปรากฏ 3 ครั้ง มากที่สุด จึงเป็นฐานนิยม' },
    { q: 'ทอดลูกเต๋า 2 ลูก ความน่าจะเป็นที่ผลรวมเป็น 7 คือ?', choices: ['A) 1/6', 'B) 5/36', 'C) 6/36', 'D) 7/36'], answer: 'C', explanation: 'คู่ที่รวมเป็น 7: (1,6)(2,5)(3,4)(4,3)(5,2)(6,1) = 6 แบบ จาก 36 แบบ = 6/36 = 1/6' },
    { q: 'ข้อมูล 5 จำนวนมีค่าเฉลี่ย 20 ถ้าเพิ่มจำนวน 32 เข้าไป ค่าเฉลี่ยใหม่คือ?', choices: ['A) 20', 'B) 22', 'C) 24', 'D) 26'], answer: 'B', explanation: 'ผลรวมเดิม = 5×20 = 100, ผลรวมใหม่ = 100+32 = 132, เฉลี่ยใหม่ = 132/6 = 22' },
    { q: 'สุ่มคน 1 คนจาก 100 คน: ชอบฟุตบอล 60 คน ชอบบาสเก็ตบอล 40 คน ชอบทั้งสอง 20 คน P(ชอบฟุตบอล|ชอบบาสเก็ตบอล) = ?', choices: ['A) 0.2', 'B) 0.33', 'C) 0.5', 'D) 0.6'], answer: 'C', explanation: 'P(ฟุตบอล|บาส) = P(ฟุตบอล∩บาส)/P(บาส) = (20/100)/(40/100) = 20/40 = 0.5' },
    { q: 'ส่วนเบี่ยงเบนมาตรฐานของข้อมูลชุดหนึ่งเป็น 5 ถ้าคูณข้อมูลทุกค่าด้วย 3 ส่วนเบี่ยงเบนมาตรฐานใหม่คือ?', choices: ['A) 5', 'B) 8', 'C) 15', 'D) 25'], answer: 'C', explanation: 'เมื่อคูณข้อมูลด้วยค่าคงที่ c, SD ใหม่ = |c| × SD เดิม = 3 × 5 = 15' },
    { q: 'จัดคน 4 คนนั่งโต๊ะกลม จัดได้กี่แบบ?', choices: ['A) 6 แบบ', 'B) 12 แบบ', 'C) 24 แบบ', 'D) 48 แบบ'], answer: 'A', explanation: 'จัดรอบโต๊ะกลม = (n-1)! = (4-1)! = 3! = 6 แบบ' },
    { q: 'กล่องมีลูกบอลแดง 3 ลูก น้ำเงิน 5 ลูก หยิบ 2 ลูกโดยไม่ใส่คืน P(แดงทั้งคู่) = ?', choices: ['A) 3/28', 'B) 9/64', 'C) 3/56', 'D) 6/56'], answer: 'A', explanation: 'P = (3/8)×(2/7) = 6/56 = 3/28' },
  ];

  for (let i = 0; i < statsQuestions.length; i++) {
    const q = statsQuestions[i];
    await rawQuery(`
      INSERT INTO mock_exam_questions (section_id, question_text, question_type, choices, correct_answer, explanation, question_order, score)
      VALUES (${sec2Id}, '${escape(q.q)}', 'multiple_choice', '${JSON.stringify(q.choices).replace(/'/g, "''")}'::jsonb, '${q.answer}', '${escape(q.explanation)}', ${10 + i + 1}, 1)
    `);
  }

  // ── Section 3: Geometry & Calculus ──
  const sec3Result = await sql`
    INSERT INTO mock_exam_sections (exam_id, title, description, section_order, score_weight)
    VALUES (${examId}, 'ส่วนที่ 3: เรขาคณิตและแคลคูลัส (Geometry & Calculus)', 'เรขาคณิตวิเคราะห์ เวกเตอร์ อนุพันธ์ อินทิกรัล', 3, 30)
    RETURNING id
  `;
  const sec3Id = sec3Result[0].id;

  const geoQuestions = [
    { q: 'ระยะทางระหว่างจุด (1, 2) กับ (4, 6) คือ?', choices: ['A) 3', 'B) 4', 'C) 5', 'D) 7'], answer: 'C', explanation: 'd = √((4-1)²+(6-2)²) = √(9+16) = √25 = 5' },
    { q: 'ถ้า y = 3x² + 2x แล้ว dy/dx เท่ากับ?', choices: ['A) 3x + 2', 'B) 6x + 2', 'C) 6x² + 2', 'D) 3x² + 2x'], answer: 'B', explanation: 'dy/dx = 6x + 2 (ใช้กฎ power rule)' },
    { q: '∫(2x + 3)dx เท่ากับ?', choices: ['A) x² + 3x + C', 'B) 2x² + 3x + C', 'C) x² + 3 + C', 'D) 2x + 3 + C'], answer: 'A', explanation: '∫2x dx = x², ∫3 dx = 3x, รวม = x² + 3x + C' },
    { q: 'สมการเส้นตรงที่ผ่านจุด (0, 3) และ (2, 7) คือ?', choices: ['A) y = 2x + 3', 'B) y = 3x + 3', 'C) y = 2x + 7', 'D) y = x + 3'], answer: 'A', explanation: 'ความชัน m = (7-3)/(2-0) = 2, y-3 = 2(x-0) → y = 2x + 3' },
    { q: 'พื้นที่วงกลมที่มีเส้นผ่านศูนย์กลาง 10 cm คือ? (ใช้ π = 3.14)', choices: ['A) 31.4 cm²', 'B) 50 cm²', 'C) 78.5 cm²', 'D) 314 cm²'], answer: 'C', explanation: 'r = 5, A = πr² = 3.14 × 25 = 78.5 cm²' },
    { q: 'ถ้า f(x) = x³ - 3x จุดวิกฤต (Critical point) ของ f คือ?', choices: ['A) x = 0 เท่านั้น', 'B) x = 1, -1', 'C) x = √3, -√3', 'D) x = 3, -3'], answer: 'B', explanation: "f'(x) = 3x² - 3 = 0 → x² = 1 → x = ±1" },
    { q: 'เวกเตอร์ u = (3, 4) ขนาดของเวกเตอร์ u คือ?', choices: ['A) 3', 'B) 4', 'C) 5', 'D) 7'], answer: 'C', explanation: '|u| = √(3² + 4²) = √(9+16) = √25 = 5' },
    { q: 'จุดตัดแกน x ของเส้นตรง 2x + 3y = 6 คือ?', choices: ['A) (2, 0)', 'B) (3, 0)', 'C) (0, 2)', 'D) (6, 0)'], answer: 'B', explanation: 'แทน y = 0: 2x = 6, x = 3 → จุด (3, 0)' },
    { q: 'ถ้า f(x) = sin(x) แล้ว f′(π/2) เท่ากับ?', choices: ['A) 0', 'B) 1', 'C) -1', 'D) π/2'], answer: 'A', explanation: "f'(x) = cos(x), f'(π/2) = cos(π/2) = 0" },
    { q: '∫₀² (x² + 1) dx มีค่าเท่ากับ?', choices: ['A) 10/3', 'B) 14/3', 'C) 4', 'D) 6'], answer: 'B', explanation: '[x³/3 + x]₀² = (8/3 + 2) - 0 = 8/3 + 6/3 = 14/3' },
  ];

  for (let i = 0; i < geoQuestions.length; i++) {
    const q = geoQuestions[i];
    await rawQuery(`
      INSERT INTO mock_exam_questions (section_id, question_text, question_type, choices, correct_answer, explanation, question_order, score)
      VALUES (${sec3Id}, '${escape(q.q)}', 'multiple_choice', '${JSON.stringify(q.choices).replace(/'/g, "''")}'::jsonb, '${q.answer}', '${escape(q.explanation)}', ${20 + i + 1}, 1)
    `);
  }

  console.log('  A-LEVEL Math seeded: 3 sections, 30 questions');
  return examId;
}

async function main() {
  try {
    console.log('Starting additional exam seeding...\n');

    const tgat2Id = await seedTGAT2();
    const mathId = await seedALevelMath();

    // Verify
    const exams = await sql`SELECT id, title, subject_code FROM mock_exams WHERE is_active = true ORDER BY display_order`;
    console.log(`\nAll exams (${exams.length}):`);
    for (const e of exams) {
      const sections = await sql`SELECT id, title FROM mock_exam_sections WHERE exam_id = ${e.id} ORDER BY section_order`;
      console.log(`  [${e.subject_code}] ${e.title}`);
      for (const s of sections) {
        const qCount = await sql`SELECT COUNT(*) as count FROM mock_exam_questions WHERE section_id = ${s.id}`;
        console.log(`    - ${s.title} (${qCount[0].count} questions)`);
      }
    }

    console.log('\nSeeding completed!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
