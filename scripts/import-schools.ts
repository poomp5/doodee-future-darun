import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import prisma from "../lib/prisma";

type SchoolRow = {
  id: string;
  name: string;
  province?: string;
  district?: string;
  schoolType?: string;
};

const BATCH_SIZE = 1000;

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

async function ensureSchoolsTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS schools (
      school_id VARCHAR(20) PRIMARY KEY,
      school_name TEXT NOT NULL,
      province TEXT,
      district TEXT,
      school_type TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_schools_name ON schools(school_name)
  `);

  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_schools_province ON schools(province)
  `);
}

async function loadSourceFile(): Promise<SchoolRow[]> {
  const filePath = path.join(process.cwd(), "School.json");
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("School.json must be a JSON array");
  }

  return parsed
    .filter((item) => item && item.id && item.name)
    .map((item) => ({
      id: String(item.id),
      name: String(item.name),
      province: item.province ? String(item.province) : null,
      district: item.district ? String(item.district) : null,
      schoolType: item.schoolType ? String(item.schoolType) : null,
    }));
}

async function importBatch(rows: SchoolRow[]) {
  if (rows.length === 0) return;

  const valuesSql = rows
    .map((r) => {
      const schoolId = `'${escapeSql(r.id)}'`;
      const schoolName = `'${escapeSql(r.name)}'`;
      const province = r.province ? `'${escapeSql(r.province)}'` : "NULL";
      const district = r.district ? `'${escapeSql(r.district)}'` : "NULL";
      const schoolType = r.schoolType ? `'${escapeSql(r.schoolType)}'` : "NULL";
      return `(${schoolId}, ${schoolName}, ${province}, ${district}, ${schoolType})`;
    })
    .join(",\n");

  await prisma.$executeRawUnsafe(`
    INSERT INTO schools (school_id, school_name, province, district, school_type)
    VALUES
    ${valuesSql}
    ON CONFLICT (school_id) DO UPDATE
      SET school_name = EXCLUDED.school_name,
          province = EXCLUDED.province,
          district = EXCLUDED.district,
          school_type = EXCLUDED.school_type,
          updated_at = NOW()
  `);
}

async function main() {
  console.log("Preparing schools import...");
  await ensureSchoolsTable();

  const rows = await loadSourceFile();
  console.log(`Loaded ${rows.length.toLocaleString()} schools from School.json`);

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    await importBatch(batch);
    console.log(
      `Imported ${Math.min(i + BATCH_SIZE, rows.length).toLocaleString()} / ${rows.length.toLocaleString()}`
    );
  }

  const countRows = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(
    `SELECT COUNT(*)::bigint AS total FROM schools`
  );
  const total = countRows[0]?.total ?? 0n;

  console.log(`Done. schools table now has ${total.toString()} rows.`);
}

main()
  .catch((error) => {
    console.error("Import failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
