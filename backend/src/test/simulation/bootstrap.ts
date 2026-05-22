import request from "supertest";
import { server } from "../../server";
import { prisma } from "../setup";
import { hashPasswordSync } from "../../utils/commonUtils";
import type { SimulationBootstrapConfig } from "./config";
import { generateAuthCookie } from "../testUtils";
const { faker } = require("@faker-js/faker");
import { EnglishBackground } from "../../types";

type Slot = { weekday: number; startTime: string };

type SimulationBootstrapState = {
  seed: number;
  admin: { id: number; email: string; authCookie: string };
  plans: Array<{ id: number; name: string }>;
  instructors: Array<{ id: number; email: string; slots: Slot[] }>;
  customers: Array<{
    id: number;
    email: string;
    childIds: number[];
    subscriptionIds: number[];
    freeTrialClassId: number | null;
  }>;
};

function buildDeterministicSlots(count: number): Slot[] {
  const weekdays = [1, 2, 3, 4, 5, 6, 0];
  const times = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00"];
  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    slots.push({
      weekday: weekdays[i % weekdays.length]!,
      startTime: times[i % times.length]!,
    });
  }
  return slots;
}

async function seedAdmin(seed: number) {
  const email = `sim-admin+${seed}@example.com`;
  const name = `Sim Admin ${seed}`;
  const password = `sim-admin-password-${seed}`;

  const admin = await prisma.admin.create({
    data: {
      email,
      name,
      password: hashPasswordSync(password),
    },
  });

  return admin;
}

async function registerPlan(authCookie: string, i: number) {
  const planNameEng = `SimPlan${i + 1}`;
  const planNameJpn = `シムプラン${i + 1}`;
  const weeklyClassTimes = 1;
  const description = `Simulation plan ${i + 1}`;

  await request(server)
    .post("/admins/plan-list/register")
    .set("Cookie", authCookie)
    .send({
      planNameEng,
      planNameJpn,
      weeklyClassTimes,
      description,
      englishBackground: EnglishBackground.NonNative,
    })
    .expect(201);

  const created = await prisma.plan.findFirst({
    where: { name: `${planNameJpn} / ${planNameEng}` },
  });
  if (!created) throw new Error("Plan creation failed");
  return created;
}

async function registerInstructor(authCookie: string, seed: number, i: number) {
  const email = `sim-instructor+${seed}-${i}@example.com`.toLowerCase();
  const password = `sim-instructor-password-${i}`;

  const instructorPayload = {
    email,
    password,
    name: faker.person.fullName(),
    classURL: `https://example.com/class/${i}`,
    icon: `/images/default-user-icon.jpg?id=${i}`,
    nickname: `SimTeacher${i + 1}`,
    birthdate: "1990-01-01",
    lifeHistory: "Simulation life history",
    favoriteFood: "Ramen",
    hobby: "Reading",
    messageForChildren: "Let’s have fun learning English!",
    workingTime: "Weekdays",
    skill: "Conversation",
    meetingId: String(10_000_000_000 + i),
    passcode: `PASS${i}`.padEnd(8, "0"),
    englishBackground: EnglishBackground.NonNative,
  };

  await request(server)
    .post("/admins/instructor-list/register")
    .set("Cookie", authCookie)
    .send(instructorPayload)
    .expect(201);

  const created = await prisma.instructor.findUnique({ where: { email } });
  if (!created) throw new Error("Instructor creation failed");
  return created;
}

async function createInstructorSchedule(
  authCookie: string,
  instructorId: number,
  config: SimulationBootstrapConfig,
  slots: Slot[],
) {
  await request(server)
    .post(`/instructors/${instructorId}/schedules`)
    .set("Cookie", authCookie)
    .send({
      effectiveFrom: config.scheduleEffectiveFrom,
      timezone: config.timezone,
      slots,
    })
    .expect(201);
}

async function registerCustomer(seed: number, i: number) {
  const email = `sim-customer+${seed}-${i}@example.com`.toLowerCase();
  const password = `sim-customer-password-${i}`;

  await request(server)
    .post("/customers/register")
    .send({
      customerData: {
        name: faker.person.fullName(),
        email,
        password,
        prefecture: "Tokyo",
      },
      childData: {
        name: faker.person.fullName(),
        birthdate: "2017-01-01",
        personalInfo: "Simulation child",
      },
    })
    .expect(201);

  const created = await prisma.customer.findUnique({ where: { email } });
  if (!created) throw new Error("Customer creation failed");
  return created;
}

async function registerSubscription(
  authCookie: string,
  customerId: number,
  planId: number,
  subscriptionStartAtIso: string,
) {
  await request(server)
    .post(`/customers/${customerId}/subscription`)
    .set("Cookie", authCookie)
    .send({ planId, startAt: subscriptionStartAtIso })
    .expect(200);

  const created = await prisma.subscription.findFirst({
    where: { customerId, planId },
    orderBy: { id: "desc" },
  });
  if (!created) throw new Error("Subscription creation failed");
  return created;
}

async function createRecurringClass(args: {
  instructorId: number;
  customerId: number;
  childrenIds: number[];
  subscriptionId: number;
  startDate: string;
  timezone: string;
  slot: Slot;
}) {
  await request(server)
    .post("/recurring-classes")
    .send({
      instructorId: args.instructorId,
      weekday: args.slot.weekday,
      startTime: args.slot.startTime,
      customerId: args.customerId,
      childrenIds: args.childrenIds,
      subscriptionId: args.subscriptionId,
      startDate: args.startDate,
      timezone: args.timezone,
    })
    .expect(201);
}

export async function bootstrapSimulation(
  config: SimulationBootstrapConfig,
): Promise<SimulationBootstrapState> {
  faker.seed(config.seed);

  const admin = await seedAdmin(config.seed);
  const adminAuthCookie = await generateAuthCookie(admin.id, "admin");

  const plans = await Promise.all(
    Array.from({ length: config.scale.plans }).map((_, i) =>
      registerPlan(adminAuthCookie, i),
    ),
  );

  const instructorSlots = buildDeterministicSlots(
    config.scale.slotsPerInstructor,
  );
  const instructors = [];
  for (let i = 0; i < config.scale.instructors; i++) {
    const instructor = await registerInstructor(
      adminAuthCookie,
      config.seed,
      i,
    );
    await createInstructorSchedule(
      adminAuthCookie,
      instructor.id,
      config,
      instructorSlots,
    );
    instructors.push({ ...instructor, slots: instructorSlots });
  }

  const nextSlotIndexByInstructorId = new Map<number, number>();
  const customers = [];
  for (let i = 0; i < config.scale.customers; i++) {
    const customer = await registerCustomer(config.seed, i);
    const children = await prisma.child.findMany({
      where: { customerId: customer.id },
      orderBy: { id: "asc" },
    });
    const freeTrialClass = await prisma.class.findFirst({
      where: { customerId: customer.id, isFreeTrial: true },
      orderBy: { id: "asc" },
    });

    const subscriptionIds: number[] = [];
    for (let r = 0; r < config.scale.recurringClassesPerCustomer; r++) {
      const plan = plans[(i + r) % plans.length]!;
      const subscription = await registerSubscription(
        adminAuthCookie,
        customer.id,
        plan.id,
        config.subscriptionStartAtIso,
      );
      subscriptionIds.push(subscription.id);

      const chosenInstructor = instructors[(i + r) % instructors.length]!;
      const nextSlotIndex =
        nextSlotIndexByInstructorId.get(chosenInstructor.id) ?? 0;
      const slot = chosenInstructor.slots[nextSlotIndex]!;
      nextSlotIndexByInstructorId.set(
        chosenInstructor.id,
        (nextSlotIndex + 1) % chosenInstructor.slots.length,
      );
      await createRecurringClass({
        instructorId: chosenInstructor.id,
        customerId: customer.id,
        childrenIds: children.map((c) => c.id),
        subscriptionId: subscription.id,
        startDate: config.recurringStartDate,
        timezone: config.timezone,
        slot,
      });
    }

    customers.push({
      ...customer,
      childIds: children.map((c) => c.id),
      subscriptionIds,
      freeTrialClassId: freeTrialClass?.id ?? null,
    });
  }

  return {
    seed: config.seed,
    admin: { id: admin.id, email: admin.email, authCookie: adminAuthCookie },
    plans: plans.map((p) => ({ id: p.id, name: p.name })),
    instructors: instructors.map((i) => ({
      id: i.id,
      email: i.email,
      slots: i.slots,
    })),
    customers: customers.map((c) => ({
      id: c.id,
      email: c.email,
      childIds: c.childIds,
      subscriptionIds: c.subscriptionIds,
      freeTrialClassId: c.freeTrialClassId,
    })),
  };
}
