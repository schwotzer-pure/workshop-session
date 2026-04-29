import { Pool } from "pg";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function makePool() {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    // Serverless tuning: each instance keeps 1 connection alive max.
    max: 1,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    // Reuse the pool across hot Vercel invocations within the same container.
    keepAlive: true,
  });
}

function makeClient() {
  const pool = globalForPrisma.pgPool ?? makePool();
  if (!globalForPrisma.pgPool) globalForPrisma.pgPool = pool;
  return new PrismaClient({ adapter: new PrismaPg(pool) });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

// Reuse client across hot reloads (dev) AND between invocations on the
// same Vercel function container (prod).
if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
