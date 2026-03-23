// Prisma client - use this for all new code
export { default as prisma } from './prisma';

// ============================================
// LEGACY: Neon serverless functions below
// These are kept for backward compatibility during migration
// New code should use Prisma client directly
// ============================================

import { neon } from '@neondatabase/serverless';
import { getPooledDatabaseUrl } from './database-url';

let sqlClient: ReturnType<typeof neon> | null = null;

function getSqlClient() {
  if (!sqlClient) {
    sqlClient = neon(getPooledDatabaseUrl());
  }
  return sqlClient;
}

// Create Neon SQL client for tagged template queries (legacy)
const sql = ((strings: TemplateStringsArray, ...values: any[]) => {
  return getSqlClient()(strings, ...values);
}) as ReturnType<typeof neon>;

// Helper to safely escape SQL values (legacy)
function escapeValue(value: any): string {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'string') {
    return `'${value.replace(/'/g, "''")}'`;
  }
  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

// Create a parameterized query function (legacy)
const sqlQuery = async (query: string, params: any[] = []) => {
  let finalQuery = query;
  for (let i = params.length - 1; i >= 0; i--) {
    const placeholder = `$${i + 1}`;
    finalQuery = finalQuery.split(placeholder).join(escapeValue(params[i]));
  }

  const strings = [finalQuery] as unknown as TemplateStringsArray;
  Object.defineProperty(strings, 'raw', { value: [finalQuery] });

  const result = await sql(strings);
  return result;
};

export { sql, sqlQuery };

// Legacy helper functions - use Prisma instead for new code

/**
 * @deprecated Use prisma.tableName.findMany() instead
 */
export async function dbSelect<T = any>(
  table: string,
  columns: string = '*',
  where?: Record<string, any>,
  options?: { orderBy?: string; limit?: number; offset?: number; single?: boolean }
): Promise<T[]> {
  let query = `SELECT ${columns} FROM ${table}`;
  const values: any[] = [];
  let paramIndex = 1;

  if (where && Object.keys(where).length > 0) {
    const conditions = Object.entries(where).map(([key, value]) => {
      values.push(value);
      return `${key} = $${paramIndex++}`;
    });
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  if (options?.orderBy) {
    query += ` ORDER BY ${options.orderBy}`;
  }

  if (options?.limit) {
    query += ` LIMIT ${options.limit}`;
  }

  if (options?.offset) {
    query += ` OFFSET ${options.offset}`;
  }

  const result = await sqlQuery(query, values);
  return result as T[];
}

/**
 * @deprecated Use prisma.tableName.create() instead
 */
export async function dbInsert<T = any>(
  table: string,
  data: Record<string, any>
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
  const result = await sqlQuery(query, values);
  return (result[0] as T) || null;
}

/**
 * @deprecated Use prisma.tableName.update() instead
 */
export async function dbUpdate<T = any>(
  table: string,
  data: Record<string, any>,
  where: Record<string, any>
): Promise<T | null> {
  const dataKeys = Object.keys(data);
  const whereKeys = Object.keys(where);
  const values = [...Object.values(data), ...Object.values(where)];

  let paramIndex = 1;
  const setClause = dataKeys.map((key) => `${key} = $${paramIndex++}`).join(', ');
  const whereClause = whereKeys.map((key) => `${key} = $${paramIndex++}`).join(' AND ');

  const query = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`;
  const result = await sqlQuery(query, values);
  return (result[0] as T) || null;
}

/**
 * @deprecated Use prisma.tableName.upsert() instead
 */
export async function dbUpsert<T = any>(
  table: string,
  data: Record<string, any>,
  conflictColumn: string = 'id'
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const updateClause = keys
    .filter((key) => key !== conflictColumn)
    .map((key) => `${key} = EXCLUDED.${key}`)
    .join(', ');

  const query = `
    INSERT INTO ${table} (${columns})
    VALUES (${placeholders})
    ON CONFLICT (${conflictColumn})
    DO UPDATE SET ${updateClause}
    RETURNING *
  `;

  const result = await sqlQuery(query, values);
  return (result[0] as T) || null;
}

/**
 * @deprecated Use prisma.tableName.delete() instead
 */
export async function dbDelete(
  table: string,
  where: Record<string, any>
): Promise<boolean> {
  const keys = Object.keys(where);
  const values = Object.values(where);
  const conditions = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');

  const query = `DELETE FROM ${table} WHERE ${conditions}`;
  await sqlQuery(query, values);
  return true;
}

/**
 * @deprecated Use prisma.$queryRaw() instead
 */
export async function dbQuery<T = any>(
  query: string,
  values?: any[]
): Promise<T[]> {
  const result = await sqlQuery(query, values || []);
  return result as T[];
}
