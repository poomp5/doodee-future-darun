import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function createTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS user_interested_programs (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      program_id INTEGER NOT NULL REFERENCES programs(id),
      priority INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, program_id)
    )
  `;

  const strings = [query] as unknown as TemplateStringsArray;
  Object.defineProperty(strings, 'raw', { value: [query] });
  await sql(strings);

  console.log('Table user_interested_programs created!');
}

createTable();
