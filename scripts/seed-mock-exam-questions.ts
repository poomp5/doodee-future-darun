/**
 * Seed mock exam questions for TGAT1, TGAT2, A-LEVEL English, A-LEVEL Math
 * Run with: npx tsx scripts/seed-mock-exam-questions.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set');
  process.exit(1);
}

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
// TGAT1 - Thai Communication (ภาษาอังกฤษ)
// ────────────────────────────────────────────
async function seedTGAT1() {
  console.log('Seeding TGAT1 exam...');

  // Create exam
  const examResult = await sql`
    INSERT INTO mock_exams (title, description, subject_code, exam_type, duration_minutes, total_score, pass_score, is_active, display_order)
    VALUES (
      'TGAT1 - การสื่อสารภาษาอังกฤษ',
      'ข้อสอบวัดทักษะการสื่อสารภาษาอังกฤษ ประกอบด้วย ทักษะการพูด (Speaking) และทักษะการอ่าน (Reading)',
      'TGAT1',
      'TGAT',
      60,
      100,
      50,
      true,
      1
    )
    ON CONFLICT DO NOTHING
    RETURNING id
  `;

  let examId: number;
  if (examResult.length === 0) {
    const existing = await sql`SELECT id FROM mock_exams WHERE subject_code = 'TGAT1' LIMIT 1`;
    examId = existing[0].id;
    // Clear old data
    await sql`DELETE FROM mock_exam_sections WHERE exam_id = ${examId}`;
  } else {
    examId = examResult[0].id;
  }

  // ── Section 1: Speaking Skill (50 points) ──
  const sec1Result = await sql`
    INSERT INTO mock_exam_sections (exam_id, title, description, section_order, score_weight)
    VALUES (${examId}, 'ส่วนที่ 1: ทักษะการพูด (Speaking Skill)', 'ทดสอบทักษะการถาม-ตอบ และเติมบทสนทนา', 1, 50)
    RETURNING id
  `;
  const sec1Id = sec1Result[0].id;

  // Part 1.1: Question-Response (10 questions)
  const qrQuestions = [
    { q: 'Where is the nearest train station?', choices: ['A) It leaves at 9 AM.', 'B) About two blocks from here.', 'C) I prefer buses.', 'D) The ticket costs 50 baht.'], answer: 'B', explanation: 'คำถามถามเกี่ยวกับสถานที่ ต้องตอบด้วยตำแหน่งที่ตั้ง' },
    { q: 'How often do you exercise?', choices: ['A) At the gym.', 'B) With my friends.', 'C) Three times a week.', 'D) I started last year.'], answer: 'C', explanation: 'How often ถามความถี่ ต้องตอบด้วยจำนวนครั้ง' },
    { q: 'Would you like some coffee?', choices: ['A) Yes, please. With milk.', 'B) It tastes good.', 'C) At the café.', 'D) She drinks tea.'], answer: 'A', explanation: 'เป็นการเสนอ ตอบรับหรือปฏิเสธ' },
    { q: 'Who is responsible for this project?', choices: ['A) It was completed yesterday.', 'B) The deadline is Friday.', 'C) Mr. Chen is the team leader.', 'D) We need more resources.'], answer: 'C', explanation: 'Who ถามบุคคล ต้องตอบด้วยชื่อบุคคล' },
    { q: 'When does the meeting start?', choices: ['A) In the conference room.', 'B) About an hour.', 'C) At 2 PM sharp.', 'D) With all the managers.'], answer: 'C', explanation: 'When ถามเวลา ต้องตอบด้วยเวลาที่ชัดเจน' },
    { q: 'Could you pass me the salt, please?', choices: ['A) It tastes too salty.', 'B) Sure, here you go.', 'C) I prefer pepper.', 'D) The food is delicious.'], answer: 'B', explanation: 'เป็นคำขอร้อง ตอบด้วยการยินดีช่วย' },
    { q: 'What do you do for a living?', choices: ['A) I live in Bangkok.', 'B) I wake up at 7 AM.', 'C) I work as a software engineer.', 'D) I have been living here for 5 years.'], answer: 'C', explanation: '"What do you do for a living?" ถามอาชีพ' },
    { q: 'How was your vacation?', choices: ['A) Two weeks.', 'B) To Japan.', 'C) It was wonderful!', 'D) By airplane.'], answer: 'C', explanation: 'How was ถามความรู้สึก/ประสบการณ์' },
    { q: 'Why were you late this morning?', choices: ['A) I arrived at 9.', 'B) Traffic was terrible.', 'C) I work in the morning.', 'D) It takes 30 minutes.'], answer: 'B', explanation: 'Why ถามเหตุผล ต้องตอบด้วยเหตุผล' },
    { q: 'Do you mind if I open the window?', choices: ['A) Not at all. Go ahead.', 'B) The window is large.', 'C) It was open yesterday.', 'D) I like windows.'], answer: 'A', explanation: '"Do you mind" ตอบ "Not at all" = ไม่ว่าอะไร' },
  ];

  for (let i = 0; i < qrQuestions.length; i++) {
    const q = qrQuestions[i];
    await rawQuery(`
      INSERT INTO mock_exam_questions (section_id, question_text, question_type, choices, correct_answer, explanation, question_order, score)
      VALUES (${sec1Id}, '${escape(q.q)}', 'multiple_choice', '${JSON.stringify(q.choices).replace(/'/g, "''")}'::jsonb, '${q.answer}', '${escape(q.explanation)}', ${i + 1}, 1)
    `);
  }

  // Part 1.2: Short conversations (3 conversations, ~10 questions)
  const shortConvPassages = [
    {
      title: 'Short Conversation 1: At the Restaurant',
      content: 'A: Good evening. Do you have a reservation?\nB: Yes, under the name Smith, for two.\nA: Right this way, please. Here is your table.\nB: Thank you. Can we see the ______(11)______?\nA: Of course. Today\'s special is grilled salmon.\nB: That sounds good. I\'ll have that. And ______(12)______?\nA: Certainly. Would you like anything to ______(13)______?',
      questions: [
        { q: 'Question 11: Fill in blank (11)', choices: ['A) bill', 'B) menu', 'C) receipt', 'D) check'], answer: 'B', explanation: 'ในร้านอาหาร ก่อนสั่งอาหารต้องขอดู menu' },
        { q: 'Question 12: Fill in blank (12)', choices: ['A) what about you', 'B) how about dessert', 'C) what do you recommend for my friend', 'D) can I have the bill'], answer: 'C', explanation: 'ถามแนะนำอาหารสำหรับเพื่อนที่มาด้วย' },
        { q: 'Question 13: Fill in blank (13)', choices: ['A) eat', 'B) order', 'C) cook', 'D) drink'], answer: 'D', explanation: 'พนักงานถามเรื่องเครื่องดื่ม (drink) หลังจากสั่งอาหารแล้ว' },
      ],
    },
    {
      title: 'Short Conversation 2: At the Doctor',
      content: 'Doctor: What seems to be the ______(14)______?\nPatient: I\'ve had a headache for three days.\nDoctor: Have you taken any ______(15)______?\nPatient: Just aspirin, but it doesn\'t help.\nDoctor: Let me ______(16)______ you. Please sit on the bed.\nPatient: Should I be worried?',
      questions: [
        { q: 'Question 14: Fill in blank (14)', choices: ['A) matter', 'B) problem', 'C) issue', 'D) question'], answer: 'B', explanation: '"What seems to be the problem?" เป็นสำนวนที่หมอใช้ถามอาการ' },
        { q: 'Question 15: Fill in blank (15)', choices: ['A) medicine', 'B) food', 'C) rest', 'D) vitamins'], answer: 'A', explanation: 'หมอถามว่าทานยา (medicine) อะไรหรือยัง' },
        { q: 'Question 16: Fill in blank (16)', choices: ['A) check', 'B) examine', 'C) look', 'D) test'], answer: 'B', explanation: '"Let me examine you" หมอจะตรวจร่างกาย' },
      ],
    },
    {
      title: 'Short Conversation 3: Shopping',
      content: 'Customer: Excuse me. I\'m looking for a ______(17)______ for my mother.\nShop Assistant: What\'s the ______(18)______?\nCustomer: Her birthday is next week.\nShop Assistant: How about this silk scarf? It\'s on ______(19)______.\nCustomer: That looks lovely. I\'ll take it.\nShop Assistant: Would you like it ______(20)______?',
      questions: [
        { q: 'Question 17: Fill in blank (17)', choices: ['A) present', 'B) discount', 'C) product', 'D) brand'], answer: 'A', explanation: 'กำลังหาของขวัญ (present) ให้แม่' },
        { q: 'Question 18: Fill in blank (18)', choices: ['A) price', 'B) size', 'C) occasion', 'D) color'], answer: 'C', explanation: 'พนักงานถามโอกาส (occasion) ที่จะให้' },
        { q: 'Question 19: Fill in blank (19)', choices: ['A) display', 'B) sale', 'C) stock', 'D) order'], answer: 'B', explanation: '"on sale" = กำลังลดราคา' },
        { q: 'Question 20: Fill in blank (20)', choices: ['A) delivered', 'B) returned', 'C) gift-wrapped', 'D) exchanged'], answer: 'C', explanation: 'ถามว่าต้องการห่อเป็นของขวัญ (gift-wrapped) ไหม' },
      ],
    },
  ];

  for (const conv of shortConvPassages) {
    const pResult = await rawQuery(`
      INSERT INTO mock_exam_passages (section_id, title, content, passage_type, passage_order)
      VALUES (${sec1Id}, '${escape(conv.title)}', '${escape(conv.content)}', 'conversation', ${shortConvPassages.indexOf(conv) + 1})
      RETURNING id
    `);
    const passageId = pResult[0].id;

    for (let i = 0; i < conv.questions.length; i++) {
      const q = conv.questions[i];
      await rawQuery(`
        INSERT INTO mock_exam_questions (section_id, passage_id, question_text, question_type, choices, correct_answer, explanation, question_order, score)
        VALUES (${sec1Id}, ${passageId}, '${escape(q.q)}', 'multiple_choice', '${JSON.stringify(q.choices).replace(/'/g, "''")}'::jsonb, '${q.answer}', '${escape(q.explanation)}', ${10 + i + 1 + shortConvPassages.indexOf(conv) * 4}, 1)
      `);
    }
  }

  // Part 1.3: Long conversations (2 conversations, 10 questions)
  const longConvPassages = [
    {
      title: 'Long Conversation 1: University Admission',
      content: 'Sarah: Hi, Tom! Have you decided which university you want to apply to?\nTom: I\'m thinking about Chulalongkorn or Thammasat. What about you?\nSarah: I want to study medicine at Mahidol. The ______(21)______ process is really competitive though.\nTom: I heard you need really high scores in science subjects. Are you ______(22)______?\nSarah: I\'ve been studying every day after school. My weak point is ______(23)______.\nTom: Maybe we could study together. I\'m good at chemistry.\nSarah: That would be great! When are the ______(24)______ exams?\nTom: TGAT is in December, and A-Level is in ______(25)______.\nSarah: We don\'t have much time. Let\'s start a study group this weekend.',
      questions: [
        { q: 'Question 21: Fill in blank (21)', choices: ['A) graduation', 'B) admission', 'C) registration', 'D) application'], answer: 'B', explanation: 'admission process = กระบวนการรับสมัคร' },
        { q: 'Question 22: Fill in blank (22)', choices: ['A) prepared', 'B) worried', 'C) interested', 'D) excited'], answer: 'A', explanation: 'ถามว่าเตรียมตัว (prepared) หรือยัง' },
        { q: 'Question 23: Fill in blank (23)', choices: ['A) mathematics', 'B) English', 'C) chemistry', 'D) biology'], answer: 'C', explanation: 'เธอบอกว่าจุดอ่อนคือเคมี ซึ่ง Tom เก่ง' },
        { q: 'Question 24: Fill in blank (24)', choices: ['A) midterm', 'B) final', 'C) entrance', 'D) placement'], answer: 'C', explanation: 'entrance exams = ข้อสอบเข้ามหาวิทยาลัย' },
        { q: 'Question 25: Fill in blank (25)', choices: ['A) January', 'B) February', 'C) March', 'D) April'], answer: 'C', explanation: 'A-Level สอบในเดือนมีนาคม' },
      ],
    },
    {
      title: 'Long Conversation 2: Job Interview',
      content: 'Interviewer: Thank you for coming in today. Could you tell me about your ______(26)______?\nCandidate: I graduated from Kasetsart University with a degree in Computer Science. I\'ve worked at two tech companies.\nInterviewer: What was your ______(27)______ at your previous job?\nCandidate: I was a software developer. I mainly worked on mobile applications.\nInterviewer: Why did you ______(28)______ your last position?\nCandidate: I\'m looking for new challenges and opportunities to grow.\nInterviewer: What are your ______(29)______?\nCandidate: I\'m a quick learner and I work well in teams.\nInterviewer: When would you be ______(30)______ to start?\nCandidate: I can start within two weeks.',
      questions: [
        { q: 'Question 26: Fill in blank (26)', choices: ['A) hobbies', 'B) background', 'C) family', 'D) plans'], answer: 'B', explanation: 'ถามเกี่ยวกับประวัติ (background)' },
        { q: 'Question 27: Fill in blank (27)', choices: ['A) salary', 'B) schedule', 'C) role', 'D) office'], answer: 'C', explanation: 'ถามตำแหน่ง/บทบาท (role) ในงานก่อนหน้า' },
        { q: 'Question 28: Fill in blank (28)', choices: ['A) leave', 'B) join', 'C) find', 'D) start'], answer: 'A', explanation: 'ถามว่าทำไมถึงลาออก (leave) จากงานเดิม' },
        { q: 'Question 29: Fill in blank (29)', choices: ['A) weaknesses', 'B) strengths', 'C) requirements', 'D) expectations'], answer: 'B', explanation: 'ถามจุดแข็ง (strengths)' },
        { q: 'Question 30: Fill in blank (30)', choices: ['A) willing', 'B) able', 'C) ready', 'D) available'], answer: 'D', explanation: '"available to start" = พร้อมเริ่มงานเมื่อไหร่' },
      ],
    },
  ];

  for (const conv of longConvPassages) {
    const pResult = await rawQuery(`
      INSERT INTO mock_exam_passages (section_id, title, content, passage_type, passage_order)
      VALUES (${sec1Id}, '${escape(conv.title)}', '${escape(conv.content)}', 'long_conversation', ${longConvPassages.indexOf(conv) + 4})
      RETURNING id
    `);
    const passageId = pResult[0].id;

    for (let i = 0; i < conv.questions.length; i++) {
      const q = conv.questions[i];
      await rawQuery(`
        INSERT INTO mock_exam_questions (section_id, passage_id, question_text, question_type, choices, correct_answer, explanation, question_order, score)
        VALUES (${sec1Id}, ${passageId}, '${escape(q.q)}', 'multiple_choice', '${JSON.stringify(q.choices).replace(/'/g, "''")}'::jsonb, '${q.answer}', '${escape(q.explanation)}', ${20 + i + 1 + longConvPassages.indexOf(conv) * 5}, 1)
      `);
    }
  }

  // ── Section 2: Reading Skill (50 points) ──
  const sec2Result = await sql`
    INSERT INTO mock_exam_sections (exam_id, title, description, section_order, score_weight)
    VALUES (${examId}, 'ส่วนที่ 2: ทักษะการอ่าน (Reading Skill)', 'ทดสอบทักษะเติมข้อความในเนื้อเรื่อง และอ่านเพื่อจับใจความ', 2, 50)
    RETURNING id
  `;
  const sec2Id = sec2Result[0].id;

  // Part 2.1: Text Completion (2 passages, 15 questions)
  const textCompletionPassages = [
    {
      title: 'Text Completion 1: Climate Change',
      content: 'Climate change is one of the most ______(31)______ challenges facing the world today. Rising temperatures are causing polar ice caps to ______(32)______, leading to higher sea levels. Many scientists believe that human activities, particularly the burning of ______(33)______ fuels, are the main ______(34)______ of this problem. Governments around the world are trying to ______(35)______ carbon emissions by promoting renewable energy sources such as solar and wind power. However, some countries are ______(36)______ to change because it may affect their ______(37)______ growth. If we do not take action soon, the ______(38)______ could be devastating for future generations.',
      questions: [
        { q: 'Question 31', choices: ['A) pressing', 'B) boring', 'C) simple', 'D) minor'], answer: 'A', explanation: 'pressing = เร่งด่วน, สำคัญ' },
        { q: 'Question 32', choices: ['A) grow', 'B) melt', 'C) freeze', 'D) expand'], answer: 'B', explanation: 'น้ำแข็งละลาย (melt) จากอุณหภูมิที่สูงขึ้น' },
        { q: 'Question 33', choices: ['A) natural', 'B) fossil', 'C) organic', 'D) nuclear'], answer: 'B', explanation: 'fossil fuels = เชื้อเพลิงฟอสซิล' },
        { q: 'Question 34', choices: ['A) cause', 'B) result', 'C) effect', 'D) purpose'], answer: 'A', explanation: 'the main cause = สาเหตุหลัก' },
        { q: 'Question 35', choices: ['A) increase', 'B) maintain', 'C) reduce', 'D) produce'], answer: 'C', explanation: 'reduce carbon emissions = ลดการปล่อยคาร์บอน' },
        { q: 'Question 36', choices: ['A) eager', 'B) happy', 'C) reluctant', 'D) willing'], answer: 'C', explanation: 'reluctant = ไม่เต็มใจ, ลังเล' },
        { q: 'Question 37', choices: ['A) personal', 'B) economic', 'C) physical', 'D) social'], answer: 'B', explanation: 'economic growth = การเติบโตทางเศรษฐกิจ' },
        { q: 'Question 38', choices: ['A) benefits', 'B) rewards', 'C) consequences', 'D) advantages'], answer: 'C', explanation: 'consequences = ผลที่ตามมา (ในเชิงลบ)' },
      ],
    },
    {
      title: 'Text Completion 2: Online Learning',
      content: 'The COVID-19 pandemic has ______(39)______ changed the way students learn. Online education has become the new ______(40)______ for millions of students worldwide. While it offers ______(41)______ such as studying from home, many students ______(42)______ with staying focused during virtual classes. Teachers have had to ______(43)______ their teaching methods to suit the digital environment. One major ______(44)______ is that not all students have equal ______(45)______ to technology and the internet.',
      questions: [
        { q: 'Question 39', choices: ['A) slightly', 'B) hardly', 'C) dramatically', 'D) rarely'], answer: 'C', explanation: 'dramatically = อย่างมาก' },
        { q: 'Question 40', choices: ['A) trend', 'B) normal', 'C) fashion', 'D) style'], answer: 'B', explanation: 'the new normal = ความปกติใหม่' },
        { q: 'Question 41', choices: ['A) advantages', 'B) problems', 'C) dangers', 'D) costs'], answer: 'A', explanation: 'advantages = ข้อดี' },
        { q: 'Question 42', choices: ['A) succeed', 'B) enjoy', 'C) struggle', 'D) prefer'], answer: 'C', explanation: 'struggle with = ลำบากกับ' },
        { q: 'Question 43', choices: ['A) abandon', 'B) ignore', 'C) copy', 'D) adapt'], answer: 'D', explanation: 'adapt = ปรับตัว, ปรับเปลี่ยน' },
        { q: 'Question 44', choices: ['A) advantage', 'B) concern', 'C) benefit', 'D) improvement'], answer: 'B', explanation: 'concern = ข้อกังวล' },
        { q: 'Question 45', choices: ['A) desire', 'B) access', 'C) interest', 'D) talent'], answer: 'B', explanation: 'access to = การเข้าถึง' },
      ],
    },
  ];

  for (const tc of textCompletionPassages) {
    const pResult = await rawQuery(`
      INSERT INTO mock_exam_passages (section_id, title, content, passage_type, passage_order)
      VALUES (${sec2Id}, '${escape(tc.title)}', '${escape(tc.content)}', 'text_completion', ${textCompletionPassages.indexOf(tc) + 1})
      RETURNING id
    `);
    const passageId = pResult[0].id;

    for (let i = 0; i < tc.questions.length; i++) {
      const q = tc.questions[i];
      await rawQuery(`
        INSERT INTO mock_exam_questions (section_id, passage_id, question_text, question_type, choices, correct_answer, explanation, question_order, score)
        VALUES (${sec2Id}, ${passageId}, '${escape(q.q)}', 'multiple_choice', '${JSON.stringify(q.choices).replace(/'/g, "''")}'::jsonb, '${q.answer}', '${escape(q.explanation)}', ${30 + i + 1 + textCompletionPassages.indexOf(tc) * 8}, 1)
      `);
    }
  }

  // Part 2.2: Reading Comprehension (3 passages, 15 questions)
  const readingPassages = [
    {
      title: 'Reading 1: Thai Street Food',
      content: 'Thai street food is famous worldwide for its bold flavors and affordable prices. From pad thai to som tam, vendors line the streets of Bangkok offering dishes that have been perfected over generations. The Thai government has tried to regulate street food vendors in recent years, citing concerns about hygiene and traffic congestion. However, many locals and tourists argue that street food is an essential part of Thai culture and should be preserved. A recent survey showed that 87% of Bangkok residents eat street food at least three times a week.',
      questions: [
        { q: 'Question 46: What is the main idea of this passage?', choices: ['A) How to cook Thai street food', 'B) The importance and challenges of Thai street food', 'C) Thai government regulations', 'D) Tourist attractions in Bangkok'], answer: 'B', explanation: 'บทความพูดถึงความสำคัญและความท้าทายของอาหารริมทางไทย' },
        { q: 'Question 47: Why has the Thai government tried to regulate street food?', choices: ['A) To promote tourism', 'B) To increase food prices', 'C) Due to hygiene and traffic concerns', 'D) To support restaurant owners'], answer: 'C', explanation: 'ระบุในบทความว่าเกี่ยวกับสุขอนามัยและจราจร' },
        { q: 'Question 48: According to the survey, how often do Bangkok residents eat street food?', choices: ['A) Every day', 'B) Once a week', 'C) At least three times a week', 'D) Once a month'], answer: 'C', explanation: 'ระบุชัดเจนว่า 87% ทานอย่างน้อย 3 ครั้งต่อสัปดาห์' },
        { q: 'Question 49: The word "preserved" in this context means:', choices: ['A) cooked', 'B) protected and maintained', 'C) removed', 'D) changed'], answer: 'B', explanation: 'preserved = รักษาไว้, อนุรักษ์' },
        { q: 'Question 50: What can be inferred from the passage?', choices: ['A) Street food will be banned soon.', 'B) Street food plays a significant role in Thai daily life.', 'C) All tourists dislike street food.', 'D) Street food is very expensive.'], answer: 'B', explanation: 'จากข้อมูลสำรวจและความคิดเห็นสรุปได้ว่าอาหารริมทางสำคัญมาก' },
      ],
    },
    {
      title: 'Reading 2: Study Abroad',
      content: 'Studying abroad has become increasingly popular among Thai students. In 2024, more than 30,000 Thai students were enrolled in universities overseas, with the United Kingdom, Australia, and the United States being the top destinations. The main benefits include exposure to different cultures, improved language skills, and better career opportunities. However, the cost of studying abroad can be a major barrier, with annual tuition fees ranging from 500,000 to over 2 million baht. Many students rely on scholarships or government funding to pursue their dreams.',
      questions: [
        { q: 'Question 51: How many Thai students studied abroad in 2024?', choices: ['A) About 20,000', 'B) More than 30,000', 'C) Exactly 50,000', 'D) Less than 10,000'], answer: 'B', explanation: 'ระบุในบทความว่ามากกว่า 30,000 คน' },
        { q: 'Question 52: Which country is NOT mentioned as a top destination?', choices: ['A) United Kingdom', 'B) Japan', 'C) Australia', 'D) United States'], answer: 'B', explanation: 'ญี่ปุ่นไม่ได้ถูกกล่าวถึงในบทความ' },
        { q: 'Question 53: What is described as a major barrier?', choices: ['A) Language differences', 'B) Distance from home', 'C) Cost of studying', 'D) Cultural shock'], answer: 'C', explanation: 'ค่าใช้จ่ายเป็นอุปสรรคหลัก (major barrier)' },
        { q: 'Question 54: The word "pursue" means:', choices: ['A) give up', 'B) follow and try to achieve', 'C) avoid', 'D) forget'], answer: 'B', explanation: 'pursue = ติดตาม, พยายามให้สำเร็จ' },
        { q: 'Question 55: What helps students afford studying abroad?', choices: ['A) Part-time jobs only', 'B) Family loans', 'C) Scholarships and government funding', 'D) Student discounts'], answer: 'C', explanation: 'ระบุว่าพึ่งทุนการศึกษาและเงินทุนจากรัฐบาล' },
      ],
    },
    {
      title: 'Reading 3: Artificial Intelligence',
      content: 'Artificial Intelligence (AI) is transforming industries around the world. In healthcare, AI helps doctors diagnose diseases more accurately. In education, personalized learning platforms use AI to adapt to each student\'s pace. However, there are growing concerns about job displacement, as machines can now perform tasks that were previously done by humans. Experts predict that by 2030, AI will create 97 million new jobs while eliminating 85 million existing ones. The key to thriving in the AI era is continuous learning and adaptability.',
      questions: [
        { q: 'Question 56: How does AI help in healthcare?', choices: ['A) By replacing doctors', 'B) By diagnosing diseases more accurately', 'C) By reducing hospital costs', 'D) By performing surgery alone'], answer: 'B', explanation: 'AI ช่วยวินิจฉัยโรคได้แม่นยำขึ้น' },
        { q: 'Question 57: What concern about AI is mentioned?', choices: ['A) It is too expensive.', 'B) It is difficult to use.', 'C) It may replace human jobs.', 'D) It causes health problems.'], answer: 'C', explanation: 'job displacement = การแทนที่งานของมนุษย์' },
        { q: 'Question 58: By 2030, what is the net effect on jobs?', choices: ['A) 85 million fewer jobs', 'B) 97 million fewer jobs', 'C) 12 million more new jobs', 'D) No change'], answer: 'C', explanation: '97 ล้านงานใหม่ - 85 ล้านงานที่หายไป = สุทธิ +12 ล้าน' },
        { q: 'Question 59: The word "thriving" means:', choices: ['A) surviving', 'B) failing', 'C) struggling', 'D) succeeding and growing'], answer: 'D', explanation: 'thriving = เจริญรุ่งเรือง, ประสบความสำเร็จ' },
        { q: 'Question 60: What does the author suggest is important in the AI era?', choices: ['A) Avoiding technology', 'B) Working harder', 'C) Continuous learning and adaptability', 'D) Changing careers frequently'], answer: 'C', explanation: 'ระบุชัดว่าการเรียนรู้ต่อเนื่องและการปรับตัวเป็นกุญแจสำคัญ' },
      ],
    },
  ];

  for (const rp of readingPassages) {
    const pResult = await rawQuery(`
      INSERT INTO mock_exam_passages (section_id, title, content, passage_type, passage_order)
      VALUES (${sec2Id}, '${escape(rp.title)}', '${escape(rp.content)}', 'reading_comprehension', ${readingPassages.indexOf(rp) + 3})
      RETURNING id
    `);
    const passageId = pResult[0].id;

    for (let i = 0; i < rp.questions.length; i++) {
      const q = rp.questions[i];
      await rawQuery(`
        INSERT INTO mock_exam_questions (section_id, passage_id, question_text, question_type, choices, correct_answer, explanation, question_order, score)
        VALUES (${sec2Id}, ${passageId}, '${escape(q.q)}', 'multiple_choice', '${JSON.stringify(q.choices).replace(/'/g, "''")}'::jsonb, '${q.answer}', '${escape(q.explanation)}', ${45 + i + 1 + readingPassages.indexOf(rp) * 5}, 1)
      `);
    }
  }

  console.log('  TGAT1 seeded: 2 sections, 60 questions');
  return examId;
}

async function main() {
  try {
    console.log('Starting exam question seeding...\n');
    const tgat1Id = await seedTGAT1();
    console.log(`\nTGAT1 exam ID: ${tgat1Id}`);

    // Verify
    const exams = await sql`SELECT id, title, subject_code FROM mock_exams WHERE is_active = true ORDER BY display_order`;
    console.log(`\nExams (${exams.length}):`);
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
