import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function createTables() {
  // Create courses table
  const coursesQuery = `
    CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      image_url TEXT,
      price NUMERIC(10,2) DEFAULT 0,
      category VARCHAR(100) DEFAULT 'general',
      subcategory VARCHAR(100),
      duration VARCHAR(100),
      instructor VARCHAR(255),
      source VARCHAR(50) DEFAULT 'other',
      link_url TEXT,
      is_active BOOLEAN DEFAULT true,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create activities table
  const activitiesQuery = `
    CREATE TABLE IF NOT EXISTS activities (
      id SERIAL PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      image_url TEXT,
      location VARCHAR(500),
      start_date DATE,
      end_date DATE,
      category VARCHAR(100) DEFAULT 'general',
      subcategory VARCHAR(100),
      max_participants INTEGER,
      source VARCHAR(50) DEFAULT 'other',
      link_url TEXT,
      is_active BOOLEAN DEFAULT true,
      display_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `;

  // Create indexes for activities
  const indexQueries = [
    'CREATE INDEX IF NOT EXISTS idx_activities_category ON activities(category)',
    'CREATE INDEX IF NOT EXISTS idx_activities_is_active ON activities(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_activities_display_order ON activities(display_order)',
    'CREATE INDEX IF NOT EXISTS idx_activities_start_date ON activities(start_date)',
    'CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category)',
    'CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active)',
    'CREATE INDEX IF NOT EXISTS idx_courses_display_order ON courses(display_order)',
  ];

  try {
    // Execute courses table creation
    let strings = [coursesQuery] as unknown as TemplateStringsArray;
    Object.defineProperty(strings, 'raw', { value: [coursesQuery] });
    await sql(strings);
    console.log('Table courses created!');

    // Execute activities table creation
    strings = [activitiesQuery] as unknown as TemplateStringsArray;
    Object.defineProperty(strings, 'raw', { value: [activitiesQuery] });
    await sql(strings);
    console.log('Table activities created!');

    // Create indexes
    for (const indexQuery of indexQueries) {
      strings = [indexQuery] as unknown as TemplateStringsArray;
      Object.defineProperty(strings, 'raw', { value: [indexQuery] });
      await sql(strings);
    }
    console.log('Indexes created!');

    console.log('All tables and indexes created successfully!');
  } catch (error) {
    console.error('Error creating tables:', error);
    process.exit(1);
  }
}

createTables();
