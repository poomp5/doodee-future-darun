import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function checkTable() {
  try {
    // Check if table exists
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'activities'
      );
    `;

    const strings = [checkQuery] as unknown as TemplateStringsArray;
    Object.defineProperty(strings, 'raw', { value: [checkQuery] });
    const result = await sql(strings);

    console.log('Table exists:', result[0].exists);

    if (result[0].exists) {
      // Get table columns
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'activities'
        ORDER BY ordinal_position;
      `;

      const colStrings = [columnsQuery] as unknown as TemplateStringsArray;
      Object.defineProperty(colStrings, 'raw', { value: [columnsQuery] });
      const columns = await sql(colStrings);

      console.log('\nTable columns:');
      columns.forEach((col: any) => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });

      // Get current data
      const dataQuery = `SELECT COUNT(*) as count FROM activities;`;
      const dataStrings = [dataQuery] as unknown as TemplateStringsArray;
      Object.defineProperty(dataStrings, 'raw', { value: [dataQuery] });
      const count = await sql(dataStrings);
      console.log('\nCurrent row count:', count[0].count);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkTable();
