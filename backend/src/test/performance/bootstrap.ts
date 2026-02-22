import request from "supertest";
import { server } from "../../server";
import {
  createAdmin,
  createChild,
  createCustomer,
  createInstructor,
  createPlan,
  generateAuthCookie,
} from "../testUtils";
import type { PerformanceTestConfig } from "./config";

type Slot = { weekday: number; startTime: string };

type PerformanceBootstrapState = {
  adminAuthCookie: string;
  instructorIds: number[];
};

const PERFORMANCE_ADMIN = {
  email: "admin@example.com",
  password: "AaasoBo!Admin",
  name: "Admin",
};

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
  const admin = await createAdmin(PERFORMANCE_ADMIN);
  const adminAuthCookie = await generateAuthCookie(admin.id, "admin", {
    expirationTime: "180d",
  });
  const plan = await createPlan({
    name: "パフォーマンステスト / Performance Test",
    weeklyClassTimes: 1,
    description: "Seeded plan for performance test inspection",
    isNative: false,
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

  for (
    let customerIndex = 0;
    customerIndex < config.customers;
    customerIndex += 1
  ) {
    const customer = await createCustomer();
    const child = await createChild(customer.id);
    const instructor = instructors[customerIndex % instructors.length]!;
    const slot = slots[customerIndex % slots.length]!;

    const subscriptionId = await registerSubscription({
      adminAuthCookie,
      customerId: customer.id,
      planId: plan.id,
      startDate: config.startDate,
    });

    await createRecurringClass({
      instructorId: instructor.id,
      customerId: customer.id,
      childId: child.id,
      subscriptionId,
      slot,
      startDate: config.startDate,
    });
  }

  return {
    adminAuthCookie,
    instructorIds: instructors.map((instructor) => instructor.id),
  };
}
