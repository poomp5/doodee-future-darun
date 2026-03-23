/**
 * TCAS Data Import Script
 *
 * This script imports historical cutoff data and score weights for TCAS programs.
 *
 * Usage:
 *   npx tsx scripts/import-tcas-data.ts --cutoffs ./data/cutoffs.json
 *   npx tsx scripts/import-tcas-data.ts --weights ./data/weights.json
 *   npx tsx scripts/import-tcas-data.ts --cutoffs ./data/cutoffs.csv
 *
 * Data formats:
 *
 * Cutoffs JSON:
 * [
 *   {
 *     "program_id": 1,
 *     "year": 2568,
 *     "round": 3,
 *     "min_score": 72.5,
 *     "max_score": 95.2,
 *     "avg_score": 78.3,
 *     "seats": 50,
 *     "applicants": 250
 *   }
 * ]
 *
 * Weights JSON:
 * [
 *   {
 *     "program_id": 1,
 *     "subject_code": "TGAT1",
 *     "weight": 0.2,
 *     "min_score": 30
 *   }
 * ]
 *
 * Cutoffs CSV:
 * program_id,year,round,min_score,max_score,avg_score,seats,applicants
 * 1,2568,3,72.5,95.2,78.3,50,250
 */

import 'dotenv/config';
import { PrismaClient } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

// Create Prisma client with adapter (matching lib/prisma.ts pattern)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface CutoffData {
  program_id: number;
  year: number;
  round: number;
  min_score: number;
  max_score?: number;
  avg_score?: number;
  seats?: number;
  applicants?: number;
}

interface WeightData {
  program_id: number;
  subject_code: string;
  weight: number;
  min_score?: number;
}

function parseCSV(content: string): any[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const data: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};

    headers.forEach((header, index) => {
      const value = values[index];
      // Parse numeric values
      if (value && !isNaN(Number(value))) {
        row[header] = Number(value);
      } else {
        row[header] = value || null;
      }
    });

    data.push(row);
  }

  return data;
}

function loadFile(filePath: string): any[] {
  const fullPath = path.resolve(filePath);
  const content = fs.readFileSync(fullPath, 'utf-8');

  if (filePath.endsWith('.json')) {
    return JSON.parse(content);
  } else if (filePath.endsWith('.csv')) {
    return parseCSV(content);
  }

  throw new Error(`Unsupported file format: ${filePath}`);
}

async function importCutoffs(filePath: string) {
  console.log(`Importing cutoff data from ${filePath}...`);

  const data: CutoffData[] = loadFile(filePath);
  console.log(`Found ${data.length} records to import`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of data) {
    try {
      // Validate required fields
      if (!record.program_id || !record.year || !record.round || record.min_score === undefined) {
        console.warn(`Skipping invalid record: ${JSON.stringify(record)}`);
        skipped++;
        continue;
      }

      // Check if program exists
      const program = await prisma.programs.findUnique({
        where: { id: record.program_id },
      });

      if (!program) {
        console.warn(`Program not found: ${record.program_id}`);
        skipped++;
        continue;
      }

      // Upsert cutoff data
      await prisma.tcas_cutoff_history.upsert({
        where: {
          program_id_year_round: {
            program_id: record.program_id,
            year: record.year,
            round: record.round,
          },
        },
        update: {
          min_score: record.min_score,
          max_score: record.max_score,
          avg_score: record.avg_score,
          seats: record.seats,
          applicants: record.applicants,
        },
        create: {
          program_id: record.program_id,
          year: record.year,
          round: record.round,
          min_score: record.min_score,
          max_score: record.max_score,
          avg_score: record.avg_score,
          seats: record.seats,
          applicants: record.applicants,
        },
      });

      imported++;
    } catch (error) {
      console.error(`Error importing record: ${JSON.stringify(record)}`, error);
      errors++;
    }
  }

  console.log(`
Import complete:
  - Imported: ${imported}
  - Skipped: ${skipped}
  - Errors: ${errors}
`);
}

async function importWeights(filePath: string) {
  console.log(`Importing weight data from ${filePath}...`);

  const data: WeightData[] = loadFile(filePath);
  console.log(`Found ${data.length} records to import`);

  let imported = 0;
  let skipped = 0;
  let errors = 0;

  for (const record of data) {
    try {
      // Validate required fields
      if (!record.program_id || !record.subject_code || record.weight === undefined) {
        console.warn(`Skipping invalid record: ${JSON.stringify(record)}`);
        skipped++;
        continue;
      }

      // Check if program exists
      const program = await prisma.programs.findUnique({
        where: { id: record.program_id },
      });

      if (!program) {
        console.warn(`Program not found: ${record.program_id}`);
        skipped++;
        continue;
      }

      // Upsert weight data
      await prisma.tcas_score_weights.upsert({
        where: {
          program_id_subject_code: {
            program_id: record.program_id,
            subject_code: record.subject_code,
          },
        },
        update: {
          weight: record.weight,
          min_score: record.min_score,
        },
        create: {
          program_id: record.program_id,
          subject_code: record.subject_code,
          weight: record.weight,
          min_score: record.min_score,
        },
      });

      imported++;
    } catch (error) {
      console.error(`Error importing record: ${JSON.stringify(record)}`, error);
      errors++;
    }
  }

  console.log(`
Import complete:
  - Imported: ${imported}
  - Skipped: ${skipped}
  - Errors: ${errors}
`);
}

async function generateSampleData() {
  console.log('Generating sample cutoff data...');

  // Get some programs
  const programs = await prisma.programs.findMany({
    take: 100,
    select: { id: true },
  });

  if (programs.length === 0) {
    console.log('No programs found in database');
    return;
  }

  console.log(`Found ${programs.length} programs, generating sample data...`);

  let created = 0;
  const years = [2568, 2567, 2566];
  const rounds = [1, 2, 3, 4];

  for (const program of programs) {
    for (const year of years) {
      for (const round of rounds) {
        // Generate random but realistic scores
        const minScore = 50 + Math.random() * 30; // 50-80
        const avgScore = minScore + 5 + Math.random() * 10; // min + 5-15
        const maxScore = avgScore + 5 + Math.random() * 15; // avg + 5-20

        try {
          await prisma.tcas_cutoff_history.upsert({
            where: {
              program_id_year_round: {
                program_id: program.id,
                year,
                round,
              },
            },
            update: {},
            create: {
              program_id: program.id,
              year,
              round,
              min_score: Math.round(minScore * 100) / 100,
              max_score: Math.round(maxScore * 100) / 100,
              avg_score: Math.round(avgScore * 100) / 100,
              seats: Math.floor(20 + Math.random() * 100),
              applicants: Math.floor(100 + Math.random() * 500),
            },
          });
          created++;
        } catch {
          // Ignore duplicates
        }
      }
    }

    // Generate sample weights
    const weights = [
      { subject: 'TGAT1', weight: 0.15 },
      { subject: 'TGAT2', weight: 0.15 },
      { subject: 'TGAT3', weight: 0.10 },
      { subject: 'A_MATH1', weight: 0.20 },
      { subject: 'A_ENG', weight: 0.15 },
      { subject: 'A_PHY', weight: 0.15 },
      { subject: 'A_CHEM', weight: 0.10 },
    ];

    for (const w of weights) {
      try {
        await prisma.tcas_score_weights.upsert({
          where: {
            program_id_subject_code: {
              program_id: program.id,
              subject_code: w.subject,
            },
          },
          update: {},
          create: {
            program_id: program.id,
            subject_code: w.subject,
            weight: w.weight,
            min_score: Math.floor(20 + Math.random() * 20),
          },
        });
      } catch {
        // Ignore duplicates
      }
    }
  }

  console.log(`Generated sample data for ${programs.length} programs (${created} cutoff records)`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
TCAS Data Import Script

Usage:
  npx ts-node scripts/import-tcas-data.ts --cutoffs <file>
  npx ts-node scripts/import-tcas-data.ts --weights <file>
  npx ts-node scripts/import-tcas-data.ts --generate-sample

Options:
  --cutoffs <file>    Import cutoff history from JSON/CSV file
  --weights <file>    Import score weights from JSON/CSV file
  --generate-sample   Generate sample data for testing

Examples:
  npx ts-node scripts/import-tcas-data.ts --cutoffs ./data/cutoffs.json
  npx ts-node scripts/import-tcas-data.ts --weights ./data/weights.csv
  npx ts-node scripts/import-tcas-data.ts --generate-sample
`);
    return;
  }

  try {
    if (args[0] === '--cutoffs' && args[1]) {
      await importCutoffs(args[1]);
    } else if (args[0] === '--weights' && args[1]) {
      await importWeights(args[1]);
    } else if (args[0] === '--generate-sample') {
      await generateSampleData();
    } else {
      console.error('Invalid arguments. Run without arguments for help.');
    }
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
