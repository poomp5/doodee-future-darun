import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function checkAnalysis() {
  console.log('Checking portfolio_analysis table...');

  const analyses = await sql`SELECT id, user_id, analyzed_at FROM portfolio_analysis ORDER BY analyzed_at DESC LIMIT 10`;
  console.log('\nAnalysis records:', analyses.length);
  analyses.forEach((a: any) => {
    console.log(`  - ID: ${a.id}, User: ${a.user_id}, Date: ${a.analyzed_at}, File URL: ${a.file_url || 'NULL'}`);
  });

  console.log('\n\nChecking portfolio_uploads table...');
  const uploads = await sql`SELECT id, user_id, portfolio_name, file_url, created_at FROM portfolio_uploads ORDER BY created_at DESC LIMIT 10`;
  console.log('\nUpload records:', uploads.length);
  uploads.forEach((u: any) => {
    console.log(`  - ID: ${u.id}, User: ${u.user_id}, Name: ${u.portfolio_name}, URL: ${u.file_url?.substring(0, 50)}...`);
  });
}

checkAnalysis().catch(console.error);
