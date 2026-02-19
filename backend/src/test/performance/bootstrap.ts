import {
  createAdmin,
  createChild,
  createClass,
  createCustomer,
  createInstructor,
  createPlan,
  generateAuthCookie,
} from "../testUtils";
import type { PerformanceTestConfig } from "./config";

type Slot = { weekday: number; startTime: string };

export type CompletionTarget = {
  classId: number;
  dateKey: string;
};

type PerformanceBootstrapState = {
  adminAuthCookie: string;
  completionTargets: CompletionTarget[];
};

const PERFORMANCE_ADMIN = {
  email: "admin@example.com",
  password: "AaasoBo!Admin",
  name: "Admin",
};

function* enumerateDays(startDate: string, endDate: string): Generator<Date> {
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (current <= end) {
    yield new Date(current);
    current.setUTCDate(current.getUTCDate() + 1);
  }
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
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

function toClassDateTime(day: Date, slot: Slot): Date {
  const target = new Date(day);
  const [hours, minutes] = slot.startTime
    .split(":")
    .map((value) => Number.parseInt(value, 10));
  target.setUTCHours(hours ?? 0, minutes ?? 0, 0, 0);
  return target;
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
  const customers = await Promise.all(
    Array.from({ length: config.customers }, async () => {
      const customer = await createCustomer();
      const child = await createChild(customer.id);
      return { customerId: customer.id, childId: child.id };
    }),
  );

  const slots = buildSlots(config.slotsPerInstructor);
  const completionTargets: CompletionTarget[] = [];

  for (const day of enumerateDays(config.startDate, config.endDate)) {
    const weekday = day.getUTCDay();
    if (weekday === 0 || weekday === 6) continue;

    for (
      let customerIndex = 0;
      customerIndex < customers.length;
      customerIndex += 1
    ) {
      const instructor = instructors[customerIndex % instructors.length]!;
      const slot = slots[customerIndex % slots.length]!;
      const dateTime = toClassDateTime(day, slot);

      const classRecord = await createClass(
        customers[customerIndex]!.customerId,
        instructor.id,
        dateTime,
      );

      completionTargets.push({
        classId: classRecord.id,
        dateKey: toDateKey(day),
      });
    }
  }

  return {
    adminAuthCookie,
    completionTargets,
  };
}
