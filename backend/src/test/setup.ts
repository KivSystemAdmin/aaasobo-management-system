import { afterAll, beforeEach } from "vitest";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { execSync } from "child_process";
import { readFile } from "fs/promises";
import path from "path";

const { faker } = require("@faker-js/faker");

let prisma!: PrismaClient;
let prismaInitialized = false;

// IMPORTANT: this module runs before each test file is evaluated.
// We initialize the DB connection at module load time so that any modules
// imported by the tests (e.g. `server`, which imports `prismaClient`) see the
// correct connection string immediately.
await (async () => {
  try {
    const baseDatabaseUrl = await getBaseDatabaseUrl();
    const keepDatabase = process.env.KEEP_DATABASE === "1";

    if (keepDatabase) {
      process.env.DATABASE_URL = baseDatabaseUrl;
      process.env.POSTGRES_PRISMA_URL = baseDatabaseUrl;
    } else {
      const workerId =
        process.env.VITEST_WORKER_ID ?? process.env.VITEST_POOL_ID ?? "0";
      const workerDbName = `aaasobo_test_${workerId}`;
      requireSafeDbName(workerDbName);

      const workerDatabaseUrl = withDatabase(baseDatabaseUrl, workerDbName);
      process.env.DATABASE_URL = workerDatabaseUrl;
      process.env.POSTGRES_PRISMA_URL = workerDatabaseUrl;

      await ensureDatabaseExists(baseDatabaseUrl, workerDbName);
    }

    // Initialize Prisma client (engineType="client" requires a driver adapter)
    const adapter = new PrismaPg({
      connectionString: process.env.POSTGRES_PRISMA_URL,
    });
    prisma = new PrismaClient({ adapter });

    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: process.env,
    });

    // Connect Prisma client
    await prisma.$connect();
    prismaInitialized = true;

    // Set consistent seed for reproducible test data
    faker.seed(12345);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      [
        "Test database setup failed.",
        message,
        "Fix: start Docker, or set TEST_DATABASE_URL to a reachable PostgreSQL instance.",
        "Note: without KEEP_DATABASE=1, the configured DB user must be able to create/drop databases for parallel tests.",
      ].join("\n"),
      { cause: error },
    );
  }
})();

beforeEach(async () => {
  if (!prismaInitialized) return;
  // Truncate all tables before each test to ensure isolation
  await truncateAllTables();
});

afterAll(async () => {
  // Disconnect Prisma client
  if (prismaInitialized) {
    await prisma.$disconnect();
  }
});

async function truncateAllTables() {
  const tables = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  // Disable foreign key checks temporarily
  await prisma.$executeRaw`SET session_replication_role = replica;`;

  // Truncate all tables
  for (const { tablename } of tables) {
    if (tablename !== "_prisma_migrations") {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tablename}" CASCADE;`);
    }
  }

  // Re-enable foreign key checks
  await prisma.$executeRaw`SET session_replication_role = DEFAULT;`;
}

async function getBaseDatabaseUrl() {
  if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;

  const stateDir = path.join(process.cwd(), ".vitest");
  const baseDatabaseUrlFile = path.join(stateDir, "base-database-url.txt");
  try {
    const baseDatabaseUrl = await readFile(baseDatabaseUrlFile, "utf8");
    return baseDatabaseUrl.trim();
  } catch {
    throw new Error(
      [
        "TEST_DATABASE_URL is not set and Vitest global setup did not provide a database URL.",
        "Fix: run tests via `cd backend && npm run test`, or set TEST_DATABASE_URL to a reachable PostgreSQL instance.",
      ].join("\n"),
    );
  }
}

function withDatabase(databaseUrl: string, databaseName: string) {
  requireSafeDbName(databaseName);
  const url = new URL(databaseUrl);
  url.pathname = `/${databaseName}`;
  return url.toString();
}

function requireSafeDbName(dbName: string) {
  if (!/^[a-z0-9_]+$/i.test(dbName)) {
    throw new Error(`Unsafe database name: ${dbName}`);
  }
}

function quotedIdentifier(id: string) {
  requireSafeDbName(id);
  return `"${id.replaceAll('"', '""')}"`;
}

function asAdminDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  url.pathname = "/postgres";
  return url.toString();
}

async function ensureDatabaseExists(baseDatabaseUrl: string, dbName: string) {
  requireSafeDbName(dbName);
  const adminUrl = asAdminDatabaseUrl(baseDatabaseUrl);
  const adapter = new PrismaPg({ connectionString: adminUrl });
  const adminPrisma = new PrismaClient({ adapter });
  await adminPrisma.$connect();
  try {
    const rows = await adminPrisma.$queryRaw<Array<{ exists: number }>>`
      SELECT 1 as exists FROM pg_database WHERE datname = ${dbName}
    `;
    if (rows.length > 0) return;
    await adminPrisma.$executeRawUnsafe(
      `CREATE DATABASE ${quotedIdentifier(dbName)}`,
    );
  } finally {
    await adminPrisma.$disconnect();
  }
}

// Export prisma instance for use in tests
export { prisma };
