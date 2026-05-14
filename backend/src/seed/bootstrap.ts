import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { hashPassword } from "../utils/commonUtils";

const adapter = new PrismaPg({
  connectionString: process.env.POSTGRES_PRISMA_URL,
});
const prisma = new PrismaClient({ adapter });

const defaultPlans = [
  {
    name: "月3,180円プラン / 3,180 yen/month Plan",
    description: "2 classes per week",
    weeklyClassTimes: 2,
    englishBackground: 0,
  },
  {
    name: "月7,980円プラン / 7,980 yen/month Plan",
    description: "5 classes per week",
    weeklyClassTimes: 5,
    englishBackground: 0,
  },
  {
    name: "月5,980円プラン / 5,980 yen/month Plan",
    description: "1 classes per week",
    weeklyClassTimes: 1,
    englishBackground: 1,
  },
  {
    name: "月10,800円プラン / 10,800 yen/month Plan",
    description: "2 classes per week",
    weeklyClassTimes: 2,
    englishBackground: 2,
  },
];

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

async function ensureDefaultPlans() {
  for (const plan of defaultPlans) {
    const existing = await prisma.plan.findFirst({
      where: {
        name: plan.name,
        terminationAt: null,
      },
      select: { id: true },
    });

    if (existing) {
      console.log(`Plan already exists: ${plan.name}. Skipping.`);
      continue;
    }

    await prisma.plan.create({ data: plan });
    console.log(`Created plan: ${plan.name}.`);
  }
}

async function main() {
  await ensureSystemStatus();
  await ensureBootstrapAdmin();
  await ensureDefaultPlans();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
