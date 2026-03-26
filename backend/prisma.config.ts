import "dotenv/config";
import type { PrismaConfig } from "prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "prisma/config";

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("POSTGRES_PRISMA_URL"),
  },
} satisfies PrismaConfig;

export const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL,
});
