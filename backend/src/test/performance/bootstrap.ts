import request from "supertest";
import { server } from "../../server";
import {
  createAdmin,
  createChild,
  createCustomer,
  createInstructor,
  createPlan,
  generateAuthCookie,
  setTestDataSeed,
} from "../testUtils";
import type { PerformanceTestConfig } from "./config";
import { EnglishBackground } from "../../types";

type Slot = { weekday: number; startTime: string };

export type PerformanceCustomerState = {
  customerId: number;
  customerAuthCookie: string;
  childIds: number[];
};

type PerformanceBootstrapState = {
  adminAuthCookie: string;
  instructorIds: number[];
  customers: PerformanceCustomerState[];
};

const PERFORMANCE_ADMIN = {
  email: "admin@example.com",
  password: "AaasoBo!Admin",
  name: "Admin",
};

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildSlots(count: number): Slot[] {
  const weekdays = [1, 2, 3, 4, 5];
  const times: string[] = [];
  for (let hour = 16; hour <= 20; hour += 1) {
    times.push(`${String(hour).padStart(2, "0")}:00`);
    times.push(`${String(hour).padStart(2, "0")}:30`);
  }

  const templateSlots: Slot[] = weekdays.flatMap((weekday) =>
    times.map((startTime) => ({ weekday, startTime })),
  );

  if (count > templateSlots.length) {
    throw new Error(
      `PERF_SLOTS_PER_INSTRUCTOR=${count} exceeds weekday slot capacity ${templateSlots.length}.`,
    );
  }

  return templateSlots.slice(0, count);
}

function buildShuffledAssignments(args: {
  instructors: Array<{ id: number }>;
  slots: Slot[];
  random: () => number;
}) {
  const assignments = args.instructors.flatMap((instructor) =>
    args.slots.map((slot) => ({ instructorId: instructor.id, slot })),
  );

  for (let i = assignments.length - 1; i > 0; i -= 1) {
    const j = Math.floor(args.random() * (i + 1));
    const tmp = assignments[i]!;
    assignments[i] = assignments[j]!;
    assignments[j] = tmp;
  }

  return assignments;
}

function toJstDateString(date: string): string {
  return `${date}T00:00:00+09:00`;
}

async function createInstructorSchedule(args: {
  adminAuthCookie: string;
  instructorId: number;
  slots: Slot[];
  startDate: string;
}) {
  const response = await request(server)
    .post(`/instructors/${args.instructorId}/schedules`)
    .set("Cookie", args.adminAuthCookie)
    .send({
      effectiveFrom: args.startDate,
      timezone: "Asia/Tokyo",
      slots: args.slots,
    });

  if (response.status !== 201) {
    throw new Error(
      `failed to create instructor schedule: instructorId=${args.instructorId}, status=${response.status}, body=${JSON.stringify(response.body)}`,
    );
  }
}

async function registerSubscription(args: {
  adminAuthCookie: string;
  customerId: number;
  planId: number;
  startDate: string;
}) {
  const response = await request(server)
    .post(`/customers/${args.customerId}/subscription`)
    .set("Cookie", args.adminAuthCookie)
    .send({
      planId: args.planId,
      startAt: toJstDateString(args.startDate),
    });

  if (response.status !== 200) {
    throw new Error(
      `failed to register subscription: customerId=${args.customerId}, status=${response.status}, body=${JSON.stringify(response.body)}`,
    );
  }

  const subscriptionId = response.body?.newSubscription?.id;
  if (typeof subscriptionId !== "number") {
    throw new Error(
      `missing subscription id in response: customerId=${args.customerId}, body=${JSON.stringify(response.body)}`,
    );
  }

  return subscriptionId;
}

async function createRecurringClass(args: {
  instructorId: number;
  customerId: number;
  childId: number;
  subscriptionId: number;
  slot: Slot;
  startDate: string;
}) {
  const response = await request(server)
    .post("/recurring-classes")
    .send({
      instructorId: args.instructorId,
      weekday: args.slot.weekday,
      startTime: args.slot.startTime,
      customerId: args.customerId,
      childrenIds: [args.childId],
      subscriptionId: args.subscriptionId,
      startDate: args.startDate,
      timezone: "Asia/Tokyo",
    });

  if (response.status !== 201) {
    throw new Error(
      `failed to create recurring class: customerId=${args.customerId}, instructorId=${args.instructorId}, status=${response.status}, body=${JSON.stringify(response.body)}`,
    );
  }
}

export async function initializePerformanceData(
  config: PerformanceTestConfig,
): Promise<PerformanceBootstrapState> {
  setTestDataSeed(config.seed);
  const random = createSeededRandom(config.seed);

  const admin = await createAdmin(PERFORMANCE_ADMIN);
  const adminAuthCookie = await generateAuthCookie(admin.id, "admin", {
    expirationTime: "180d",
  });
  const plan = await createPlan({
    name: "パフォーマンステスト / Performance Test",
    weeklyClassTimes: 1,
    description: "Seeded plan for performance test inspection",
    englishBackground: EnglishBackground.NonNative,
  });

  const instructors = await Promise.all(
    Array.from({ length: config.instructors }, () => createInstructor()),
  );

  const slots = buildSlots(config.slotsPerInstructor);
  await Promise.all(
    instructors.map((instructor) =>
      createInstructorSchedule({
        adminAuthCookie,
        instructorId: instructor.id,
        slots,
        startDate: config.startDate,
      }),
    ),
  );

  const assignments = buildShuffledAssignments({
    instructors,
    slots,
    random,
  });
  if (config.customers > assignments.length) {
    throw new Error(
      `PERF_CUSTOMERS=${config.customers} exceeds unique instructor-slot capacity ${assignments.length}.`,
    );
  }
  const customers: PerformanceCustomerState[] = [];
  for (
    let customerIndex = 0;
    customerIndex < config.customers;
    customerIndex += 1
  ) {
    const customer = await createCustomer();
    const child = await createChild(customer.id);
    const assignment = assignments[customerIndex]!;

    const subscriptionId = await registerSubscription({
      adminAuthCookie,
      customerId: customer.id,
      planId: plan.id,
      startDate: config.startDate,
    });

    await createRecurringClass({
      instructorId: assignment.instructorId,
      customerId: customer.id,
      childId: child.id,
      subscriptionId,
      slot: assignment.slot,
      startDate: config.startDate,
    });

    customers.push({
      customerId: customer.id,
      customerAuthCookie: await generateAuthCookie(customer.id, "customer", {
        expirationTime: "180d",
      }),
      childIds: [child.id],
    });
  }

  return {
    adminAuthCookie,
    instructorIds: instructors.map((instructor) => instructor.id),
    customers,
  };
}
