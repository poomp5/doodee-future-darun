/**
 * Script to seed universities/programs data to Neon database
 * Run with: npx tsx scripts/seed-universities.ts
 */

import { neon } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

// Helper for raw SQL queries
async function rawQuery(query: string) {
  const strings = [query] as unknown as TemplateStringsArray;
  Object.defineProperty(strings, 'raw', { value: [query] });
  return await sql(strings);
}

async function createTable() {
  console.log('Creating programs table...');

  await sql`
    CREATE TABLE IF NOT EXISTS programs (
      id SERIAL PRIMARY KEY,
      university_type_id VARCHAR(10),
      university_type_name_th VARCHAR(100),
      university_id VARCHAR(10),
      university_name_th VARCHAR(255),
      university_name_en VARCHAR(255),
      campus_id VARCHAR(10),
      campus_name_th VARCHAR(255),
      campus_name_en VARCHAR(255),
      faculty_id VARCHAR(10),
      faculty_name_th VARCHAR(255),
      faculty_name_en VARCHAR(255),
      group_field_id VARCHAR(10),
      group_field_th VARCHAR(255),
      field_id VARCHAR(10),
      field_name_th VARCHAR(255),
      field_name_en VARCHAR(255),
      program_running_number VARCHAR(10),
      program_name_th TEXT,
      program_name_en TEXT,
      program_type_id VARCHAR(10),
      program_type_name_th VARCHAR(100),
      program_id VARCHAR(50) UNIQUE,
      number_acceptance_mko2 INTEGER DEFAULT 0,
      program_partners_id VARCHAR(50),
      program_partners_inter_name VARCHAR(255),
      country_partners_name VARCHAR(255),
      major_acceptance_number INTEGER DEFAULT 0,
      cost TEXT,
      graduate_rate VARCHAR(100),
      employment_rate VARCHAR(100),
      median_salary VARCHAR(100),
      logo_url VARCHAR(500),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create indexes for faster searching
  await sql`CREATE INDEX IF NOT EXISTS idx_programs_university_id ON programs(university_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_programs_faculty_id ON programs(faculty_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_programs_university_name ON programs(university_name_th)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_programs_faculty_name ON programs(faculty_name_th)`;

  console.log('Table and indexes created successfully!');
}

async function seedData() {
  console.log('Loading data from JSON file...');

  const jsonPath = path.join(process.cwd(), 'universities_cleaned.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const programs = JSON.parse(rawData);

  console.log(`Found ${programs.length} programs to insert`);

  // Insert in batches of 100
  const BATCH_SIZE = 100;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < programs.length; i += BATCH_SIZE) {
    const batch = programs.slice(i, i + BATCH_SIZE);

    try {
      // Build batch insert query
      const values = batch.map((p: any) => `(
        '${escape(p.university_type_id)}',
        '${escape(p.university_type_name_th)}',
        '${escape(p.university_id)}',
        '${escape(p.university_name_th)}',
        '${escape(p.university_name_en)}',
        '${escape(p.campus_id)}',
        '${escape(p.campus_name_th)}',
        '${escape(p.campus_name_en)}',
        '${escape(p.faculty_id)}',
        '${escape(p.faculty_name_th)}',
        '${escape(p.faculty_name_en)}',
        '${escape(p.group_field_id)}',
        '${escape(p.group_field_th)}',
        '${escape(p.field_id)}',
        '${escape(p.field_name_th)}',
        '${escape(p.field_name_en)}',
        '${escape(p.program_running_number)}',
        '${escape(p.program_name_th)}',
        '${escape(p.program_name_en)}',
        '${escape(p.program_type_id)}',
        '${escape(p.program_type_name_th)}',
        '${escape(p.program_id)}',
        ${p.number_acceptance_mko2 || 0},
        '${escape(p.program_partners_id)}',
        '${escape(p.program_partners_inter_name)}',
        '${escape(p.country_partners_name)}',
        ${p.major_acceptance_number || 0},
        '${escape(p.cost)}',
        '${escape(p.graduate_rate)}',
        '${escape(p.employment_rate)}',
        '${escape(p.median_salary)}',
        '${escape(p.logo_url)}'
      )`).join(',\n');

      const query = `
        INSERT INTO programs (
          university_type_id, university_type_name_th, university_id, university_name_th, university_name_en,
          campus_id, campus_name_th, campus_name_en, faculty_id, faculty_name_th, faculty_name_en,
          group_field_id, group_field_th, field_id, field_name_th, field_name_en,
          program_running_number, program_name_th, program_name_en, program_type_id, program_type_name_th,
          program_id, number_acceptance_mko2, program_partners_id, program_partners_inter_name, country_partners_name,
          major_acceptance_number, cost, graduate_rate, employment_rate, median_salary, logo_url
        ) VALUES ${values}
        ON CONFLICT (program_id) DO NOTHING
      `;

      await rawQuery(query);
      inserted += batch.length;

      const progress = Math.round((i / programs.length) * 100);
      process.stdout.write(`\rProgress: ${progress}% (${inserted}/${programs.length})`);

    } catch (error) {
      console.error(`\nError inserting batch at index ${i}:`, error);
      errors += batch.length;
    }
  }

  console.log(`\n\nSeeding completed!`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Errors: ${errors}`);
}

function escape(str: string | null | undefined): string {
  if (str === null || str === undefined) return '';
  return String(str).replace(/'/g, "''");
}

async function main() {
  try {
    console.log('Starting database seeding...\n');

    await createTable();
    await seedData();

    // Verify
    const count = await sql`SELECT COUNT(*) as count FROM programs`;
    console.log(`\nTotal programs in database: ${count[0].count}`);

    // Show sample universities
    const universities = await sql`
      SELECT DISTINCT university_name_th, logo_url
      FROM programs
      ORDER BY university_name_th
      LIMIT 5
    `;
    console.log('\nSample universities:');
    universities.forEach((u: any) => {
      console.log(`  - ${u.university_name_th}`);
      console.log(`    Logo: ${u.logo_url}`);
    });

  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
