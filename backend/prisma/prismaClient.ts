import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "../generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  pool?: Pool;
};

// Connection Pool settings for Vercel
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.POSTGRES_PRISMA_URL,
    max: 2,
    idleTimeoutMillis: 30000, // 30 seconds idle timeout
    connectionTimeoutMillis: 2000, // 2 seconds connection timeout
  });

// Initialize the Prisma Adapter with the connection pool
const adapter = new PrismaPg(pool);

// Instantiate Prisma Client
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    transactionOptions: {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 2000, // 2 seconds max wait for acquiring a connection
      timeout: 60000, // 60 seconds transaction timeout
    },
  });

// Prevent multiple instances in development environment
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}
