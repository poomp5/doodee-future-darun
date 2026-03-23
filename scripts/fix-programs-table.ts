/**
 * Script to fix VARCHAR length issues in programs table
 * Run with: npx tsx scripts/fix-programs-table.ts
 */

import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL is not set in .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function fixTable() {
  console.log('Fixing programs table column types...\n');

  // Change VARCHAR columns to TEXT to avoid length issues
  const alterStatements = [
    'ALTER TABLE programs ALTER COLUMN university_type_name_th TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN university_name_th TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN university_name_en TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN campus_name_th TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN campus_name_en TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN faculty_name_th TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN faculty_name_en TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN group_field_th TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN field_name_th TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN field_name_en TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN program_type_name_th TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN program_partners_inter_name TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN country_partners_name TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN graduate_rate TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN employment_rate TYPE TEXT',
    'ALTER TABLE programs ALTER COLUMN median_salary TYPE TEXT',
  ];

  for (const stmt of alterStatements) {
    try {
      const strings = [stmt] as unknown as TemplateStringsArray;
      Object.defineProperty(strings, 'raw', { value: [stmt] });
      await sql(strings);
      console.log('[OK]', stmt.split('ALTER COLUMN ')[1]?.split(' TYPE')[0]);
    } catch (error: any) {
      console.error('[ERROR]', stmt, error.message);
    }
  }

  console.log('\nTable columns fixed!');
}

fixTable();
