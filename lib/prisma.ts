import { PrismaClient, Prisma } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { getPooledDatabaseUrl } from './database-url';

type PrismaGlobal = typeof globalThis & {
  prisma?: PrismaClient;
  prismaPool?: pg.Pool;
};

const globalForPrisma = globalThis as PrismaGlobal;

function getPgPool(connectionString: string): pg.Pool {
  if (!globalForPrisma.prismaPool) {
    globalForPrisma.prismaPool = new pg.Pool({ connectionString });
  }
  return globalForPrisma.prismaPool;
}

function createPrismaClient(): PrismaClient {
  const connectionString = getPooledDatabaseUrl();

  const log: Prisma.LogLevel[] =
    process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'];

  const pool = getPgPool(connectionString);
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ log, adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy avoids throwing during build when DATABASE_URL is unavailable.
const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (prop === 'then') return undefined;
    const client = getPrismaClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export { prisma };
export default prisma;
