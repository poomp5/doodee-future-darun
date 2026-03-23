/**
 * Script to seed mock exam subjects and faculty criteria to Neon database
 * Run with: npx tsx scripts/seed-mock-exam.ts
 */

import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// ── Subject definitions ──
const SUBJECTS = [
  { code: "MATH", name: "Mathematics", exam_type: "A-LEVEL", display_order: 1 },
  { code: "PHYSICS", name: "Physics", exam_type: "A-LEVEL", display_order: 2 },
  { code: "ENGLISH", name: "English", exam_type: "A-LEVEL", display_order: 3 },
  {
    code: "CHEMISTRY",
    name: "Chemistry",
    exam_type: "A-LEVEL",
    display_order: 4,
  },
  { code: "BIOLOGY", name: "Biology", exam_type: "A-LEVEL", display_order: 5 },
  {
    code: "THAI",
    name: "Thai Language",
    exam_type: "A-LEVEL",
    display_order: 6,
  },
  {
    code: "SOCIAL",
    name: "Social Studies",
    exam_type: "A-LEVEL",
    display_order: 7,
  },
  {
    code: "TGAT1",
    name: "TGAT1 - Thai Communication",
    exam_type: "TGAT",
    display_order: 8,
  },
  {
    code: "TGAT2",
    name: "TGAT2 - Critical Thinking",
    exam_type: "TGAT",
    display_order: 9,
  },
  {
    code: "TGAT3",
    name: "TGAT3 - Future Workforce Competency",
    exam_type: "TGAT",
    display_order: 10,
  },
  {
    code: "TPAT3",
    name: "TPAT3 - Science, Technology, Engineering",
    exam_type: "TPAT",
    display_order: 11,
  },
  {
    code: "TPAT5",
    name: "TPAT5 - Teacher Aptitude",
    exam_type: "TPAT",
    display_order: 12,
  },
];

// ── Faculty criteria ──
const FACULTY_CRITERIA = [
  {
    faculty: "Engineering (Computer)",
    university: "Chulalongkorn University",
    requirements: [
      { subject: "MATH", min: 60, weight: 0.4 },
      { subject: "PHYSICS", min: 50, weight: 0.4 },
      { subject: "ENGLISH", min: 40, weight: 0.2 },
    ],
    display_order: 1,
  },
  {
    faculty: "Engineering (Electrical)",
    university: "Chulalongkorn University",
    requirements: [
      { subject: "MATH", min: 55, weight: 0.35 },
      { subject: "PHYSICS", min: 55, weight: 0.35 },
      { subject: "ENGLISH", min: 40, weight: 0.15 },
      { subject: "CHEMISTRY", min: 40, weight: 0.15 },
    ],
    display_order: 2,
  },
  {
    faculty: "Medicine",
    university: "Mahidol University",
    requirements: [
      { subject: "BIOLOGY", min: 70, weight: 0.3 },
      { subject: "CHEMISTRY", min: 65, weight: 0.25 },
      { subject: "MATH", min: 60, weight: 0.2 },
      { subject: "ENGLISH", min: 55, weight: 0.15 },
      { subject: "PHYSICS", min: 50, weight: 0.1 },
    ],
    display_order: 3,
  },
  {
    faculty: "Science (Computer Science)",
    university: "Kasetsart University",
    requirements: [
      { subject: "MATH", min: 50, weight: 0.45 },
      { subject: "ENGLISH", min: 40, weight: 0.3 },
      { subject: "PHYSICS", min: 40, weight: 0.25 },
    ],
    display_order: 4,
  },
  {
    faculty: "Arts (English)",
    university: "Thammasat University",
    requirements: [
      { subject: "ENGLISH", min: 65, weight: 0.6 },
      { subject: "THAI", min: 45, weight: 0.2 },
      { subject: "SOCIAL", min: 40, weight: 0.2 },
    ],
    display_order: 5,
  },
  {
    faculty: "Commerce and Accountancy",
    university: "Chulalongkorn University",
    requirements: [
      { subject: "MATH", min: 60, weight: 0.4 },
      { subject: "ENGLISH", min: 55, weight: 0.4 },
      { subject: "THAI", min: 40, weight: 0.2 },
    ],
    display_order: 6,
  },
  {
    faculty: "Engineering (Civil)",
    university: "King Mongkut's University of Technology Thonburi",
    requirements: [
      { subject: "MATH", min: 50, weight: 0.4 },
      { subject: "PHYSICS", min: 50, weight: 0.35 },
      { subject: "ENGLISH", min: 35, weight: 0.25 },
    ],
    display_order: 7,
  },
  {
    faculty: "Architecture",
    university: "Chulalongkorn University",
    requirements: [
      { subject: "MATH", min: 55, weight: 0.3 },
      { subject: "PHYSICS", min: 45, weight: 0.25 },
      { subject: "ENGLISH", min: 50, weight: 0.25 },
      { subject: "THAI", min: 40, weight: 0.2 },
    ],
    display_order: 8,
  },
];

function escape(str: string | null | undefined): string {
  if (str === null || str === undefined) return "";
  return String(str).replace(/'/g, "''");
}

async function rawQuery(query: string) {
  const strings = [query] as unknown as TemplateStringsArray;
  Object.defineProperty(strings, "raw", { value: [query] });
  return await sql(strings);
}

async function seedSubjects() {
  console.log("Seeding mock_exam_subjects...");

  for (const subject of SUBJECTS) {
    const query = `
      INSERT INTO mock_exam_subjects (code, name, exam_type, is_active, display_order)
      VALUES ('${escape(subject.code)}', '${escape(subject.name)}', '${escape(subject.exam_type)}', true, ${subject.display_order})
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        exam_type = EXCLUDED.exam_type,
        display_order = EXCLUDED.display_order
    `;
    await rawQuery(query);
  }

  const count = await sql`SELECT COUNT(*) as count FROM mock_exam_subjects`;
  console.log(
    `  Seeded ${SUBJECTS.length} subjects. Total in DB: ${count[0].count}`,
  );
}

async function seedFacultyCriteria() {
  console.log("Seeding mock_exam_faculty_criteria...");

  for (const criteria of FACULTY_CRITERIA) {
    const requirementsJson = JSON.stringify(criteria.requirements).replace(
      /'/g,
      "''",
    );

    const query = `
      INSERT INTO mock_exam_faculty_criteria (faculty, university, requirements, is_active, display_order)
      VALUES ('${escape(criteria.faculty)}', '${escape(criteria.university)}', '${requirementsJson}'::jsonb, true, ${criteria.display_order})
      ON CONFLICT DO NOTHING
    `;

    try {
      await rawQuery(query);
    } catch (err) {
      // If row exists (no unique constraint for upsert), try update approach
      // Delete existing + re-insert
      const deleteQuery = `
        DELETE FROM mock_exam_faculty_criteria
        WHERE faculty = '${escape(criteria.faculty)}' AND university = '${escape(criteria.university)}'
      `;
      await rawQuery(deleteQuery);
      await rawQuery(query);
    }
  }

  const count =
    await sql`SELECT COUNT(*) as count FROM mock_exam_faculty_criteria`;
  console.log(
    `  Seeded ${FACULTY_CRITERIA.length} faculty criteria. Total in DB: ${count[0].count}`,
  );
}

async function main() {
  try {
    console.log("Starting mock exam data seeding...\n");

    await seedSubjects();
    await seedFacultyCriteria();

    // Verify
    console.log("\n--- Verification ---");

    const subjects =
      await sql`SELECT code, name, exam_type FROM mock_exam_subjects ORDER BY display_order`;
    console.log(`\nSubjects (${subjects.length}):`);
    subjects.forEach((s: any) => {
      console.log(`  [${s.exam_type}] ${s.code} - ${s.name}`);
    });

    const criteria =
      await sql`SELECT faculty, university FROM mock_exam_faculty_criteria WHERE is_active = true ORDER BY display_order`;
    console.log(`\nFaculty Criteria (${criteria.length}):`);
    criteria.forEach((c: any) => {
      console.log(`  ${c.faculty} @ ${c.university}`);
    });

    console.log("\nSeeding completed successfully!");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

main();
