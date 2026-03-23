import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const result = await sql`SELECT COUNT(*) as count FROM programs`;
  console.log('Current records in programs table:', result[0].count);
}
main();
