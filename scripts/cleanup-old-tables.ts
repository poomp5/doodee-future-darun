import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function rawQuery(query: string) {
  const strings = [query] as unknown as TemplateStringsArray;
  Object.defineProperty(strings, 'raw', { value: [query] });
  return await sql(strings);
}

async function cleanup() {
  console.log('Cleaning up old tables...\n');

  // Drop old user_interested_faculties table
  try {
    await rawQuery('DROP TABLE IF EXISTS user_interested_faculties CASCADE');
    console.log('[OK] Dropped user_interested_faculties table');
  } catch (e: any) {
    console.log('[ERROR] Error dropping user_interested_faculties:', e.message);
  }

  // Drop old faculties table
  try {
    await rawQuery('DROP TABLE IF EXISTS faculties CASCADE');
    console.log('[OK] Dropped faculties table');
  } catch (e: any) {
    console.log('[ERROR] Error dropping faculties:', e.message);
  }

  // Check user_interested_programs table exists
  const check = await rawQuery("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_interested_programs')");
  console.log('\nuser_interested_programs table exists:', check[0].exists);

  // Count records
  if (check[0].exists) {
    const count = await rawQuery('SELECT COUNT(*) FROM user_interested_programs');
    console.log('Records in user_interested_programs:', count[0].count);
  }

  console.log('\nCleanup complete!');
}

cleanup();
