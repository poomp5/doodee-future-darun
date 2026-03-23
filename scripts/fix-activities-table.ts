import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function fixTable() {
  try {
    // Add missing columns
    const queries = [
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS subcategory VARCHAR(100);`,
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'other';`,
      `ALTER TABLE activities ADD COLUMN IF NOT EXISTS link_url TEXT;`,
    ];

    for (const query of queries) {
      const strings = [query] as unknown as TemplateStringsArray;
      Object.defineProperty(strings, 'raw', { value: [query] });
      await sql(strings);
      console.log('Executed:', query.substring(0, 60) + '...');
    }

    console.log('\nMissing columns added successfully!');

    // Verify columns
    const columnsQuery = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'activities'
      ORDER BY ordinal_position;
    `;

    const colStrings = [columnsQuery] as unknown as TemplateStringsArray;
    Object.defineProperty(colStrings, 'raw', { value: [columnsQuery] });
    const columns = await sql(colStrings);

    console.log('\nUpdated table columns:');
    columns.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

fixTable();
