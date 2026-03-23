const DATABASE_URL_ENV_KEYS = ['DATABASE_URL', 'DATABASE_URL_UNPOOLED'] as const;

export function getDatabaseUrl(): string {
  for (const key of DATABASE_URL_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }

  throw new Error(
    `Database URL is not set. Expected one of: ${DATABASE_URL_ENV_KEYS.join(', ')}`
  );
}

export function getPooledDatabaseUrl(): string {
  return process.env.DATABASE_URL?.trim() || getDatabaseUrl();
}

export function getDirectDatabaseUrl(): string {
  return process.env.DATABASE_URL_UNPOOLED?.trim() || getDatabaseUrl();
}
