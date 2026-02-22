import {
  PostgreSqlContainer,
  type StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import dotenv from "dotenv";
import { mkdir, rm, writeFile } from "fs/promises";
import path from "path";

const stateDir = path.join(process.cwd(), ".vitest");
const baseDatabaseUrlFile = path.join(stateDir, "base-database-url.txt");

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

async function dropLeakedTestDatabases(baseDatabaseUrl: string) {
  const adminUrl = asAdminDatabaseUrl(baseDatabaseUrl);
  const adapter = new PrismaPg({ connectionString: adminUrl });
  const prisma = new PrismaClient({ adapter });
  await prisma.$connect();

  try {
    const rows = await prisma.$queryRaw<Array<{ datname: string }>>`
      SELECT datname FROM pg_database WHERE datname LIKE 'aaasobo_test_%'
    `;

    for (const { datname } of rows) {
      requireSafeDbName(datname);
      await prisma.$executeRaw`
        SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${datname}
      `;
      try {
        await prisma.$executeRawUnsafe(
          `DROP DATABASE IF EXISTS ${quotedIdentifier(datname)} WITH (FORCE)`,
        );
      } catch {
        await prisma.$executeRawUnsafe(
          `DROP DATABASE IF EXISTS ${quotedIdentifier(datname)}`,
        );
      }
    }
  } finally {
    await prisma.$disconnect();
  }
}

export default async function globalSetup() {
  dotenv.config();
  await mkdir(stateDir, { recursive: true });

  let container: StartedPostgreSqlContainer | undefined;
  let baseDatabaseUrlForTeardown: string | undefined;

  const baseDatabaseUrl = await (async () => {
    if (process.env.TEST_DATABASE_URL) return process.env.TEST_DATABASE_URL;
    if (process.env.POSTGRES_PRISMA_URL) return process.env.POSTGRES_PRISMA_URL;
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

    try {
      container = await new PostgreSqlContainer("postgres:16-alpine")
        .withDatabase("postgres")
        .withUsername("test_user")
        .withPassword("test_password")
        .start();

      return container.getConnectionUri();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        [
          "No test database connection is configured.",
          "Testcontainers PostgreSQL startup failed.",
          message,
          "Fix: start a container runtime (e.g. Docker), set TEST_DATABASE_URL, or set POSTGRES_PRISMA_URL/DATABASE_URL in `backend/.env`.",
        ].join("\n"),
        { cause: error },
      );
    }
  })();

  baseDatabaseUrlForTeardown = baseDatabaseUrl;
  await writeFile(baseDatabaseUrlFile, baseDatabaseUrl, "utf8");
  try {
    await dropLeakedTestDatabases(baseDatabaseUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(["Test DB cleanup skipped due to error.", message].join("\n"));
  }

  return async () => {
    if (baseDatabaseUrlForTeardown) {
      try {
        await dropLeakedTestDatabases(baseDatabaseUrlForTeardown);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(
          ["Test DB cleanup at shutdown skipped due to error.", message].join(
            "\n",
          ),
        );
      }
    }
    await rm(baseDatabaseUrlFile, { force: true });
    if (container) await container.stop();
  };
}
