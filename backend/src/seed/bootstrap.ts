import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { hashPassword } from "../utils/commonUtils";

const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL,
});
const prisma = new PrismaClient({ adapter });

async function ensureSystemStatus() {
  const existing = await prisma.systemStatus.findFirst({
    select: { id: true },
  });

  if (existing) {
    console.log("SystemStatus already exists. Skipping.");
    return;
  }

  await prisma.systemStatus.create({
    data: { status: "Running" },
  });
  console.log("Created SystemStatus.");
}

async function ensureBootstrapAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim() || "Admin";
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  if (!email) {
    console.log("BOOTSTRAP_ADMIN_EMAIL is not set. Skipping admin creation.");
    return;
  }

  const existing = await prisma.admin.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    console.log(`Admin ${email} already exists. Skipping.`);
    return;
  }

  if (!password) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD must be set when creating a bootstrap admin.",
    );
  }

  await prisma.admin.create({
    data: {
      name,
      email,
      password: await hashPassword(password),
    },
  });
  console.log(`Created bootstrap admin ${email}.`);
}

async function main() {
  await ensureSystemStatus();
  await ensureBootstrapAdmin();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
