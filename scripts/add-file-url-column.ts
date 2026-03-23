import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function addFileUrlColumn() {
  console.log('Adding file_url column to portfolio_analysis table...');

  try {
    await sql`ALTER TABLE portfolio_analysis ADD COLUMN IF NOT EXISTS file_url TEXT`;
    console.log('Column added successfully!');
  } catch (error) {
    console.error('Error adding column:', error);
  }

  // Verify
  const columns = await sql`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'portfolio_analysis'
  `;
  console.log('\nCurrent columns in portfolio_analysis:');
  columns.forEach((c: any) => {
    console.log(`  - ${c.column_name}: ${c.data_type}`);
  });
}

addFileUrlColumn().catch(console.error);
