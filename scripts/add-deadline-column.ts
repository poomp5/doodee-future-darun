import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function addDeadlineColumn() {
  try {
    // Add deadline column to courses table
    const coursesQuery = `ALTER TABLE courses ADD COLUMN IF NOT EXISTS deadline DATE;`;
    let strings = [coursesQuery] as unknown as TemplateStringsArray;
    Object.defineProperty(strings, 'raw', { value: [coursesQuery] });
    await sql(strings);
    console.log('Added deadline column to courses table');

    // Add deadline column to activities table
    const activitiesQuery = `ALTER TABLE activities ADD COLUMN IF NOT EXISTS deadline DATE;`;
    strings = [activitiesQuery] as unknown as TemplateStringsArray;
    Object.defineProperty(strings, 'raw', { value: [activitiesQuery] });
    await sql(strings);
    console.log('Added deadline column to activities table');

    console.log('\nDeadline columns added successfully!');
  } catch (error) {
    console.error('Error:', error);
  }
}

addDeadlineColumn();
