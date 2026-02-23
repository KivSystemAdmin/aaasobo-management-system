import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { server } from "../../server";
import { getPerformanceTestConfig } from "./config";
import {
  initializePerformanceData,
  type PerformanceCustomerState,
} from "./bootstrap";
import { writePerformanceReport } from "./report";
import {
  AvailableSlotsResponse,
  InstructorCalendarClassesResponse,
} from "../../../../shared/schemas/instructors";
import {
  CustomerClassesResponse,
  RebookableClassesResponse,
} from "../../../../shared/schemas/customers";

vi.mock("../../lib/email/resendClient", () => ({
  resend: {
    emails: {
      send: vi
        .fn()
        .mockResolvedValue({ data: { id: "mock-email-id" }, error: null }),
    },
  },
}));

vi.mock("../../lib/email/mail", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/email/mail")>();
  return {
    ...actual,
    sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
    resendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
    sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
  };
});

function* enumerateDays(startDate: string, endDate: string): Generator<Date> {
  const current = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  while (current <= end) {
    yield new Date(current);
    current.setUTCDate(current.getUTCDate() + 1);
  }
}

const COMPLETABLE_CLASS_STATUSES = new Set(["pending", "booked", "rebooked"]);
const CANCEL_TARGET_STATUSES = new Set(["pending", "booked", "rebooked"]);
const REBOOK_BUSINESS_ERROR_STATUSES = new Set([400, 403, 404, 409]);

function calcLatencyStats(latencies: number[]) {
  if (latencies.length === 0) {
    return {
      min: 0,
      max: 0,
      average: 0,
      median: 0,
    };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const total = latencies.reduce((sum, value) => sum + value, 0);
  const medianIndex = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[medianIndex - 1]! + sorted[medianIndex]!) / 2
      : sorted[medianIndex]!;

  return {
    min: sorted[0]!,
    max: sorted[sorted.length - 1]!,
    average: total / latencies.length,
    median,
  };
}

function createSeededRng(seed: number) {
  let state = seed >>> 0;
  if (state === 0) state = 1;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pickRandom<T>(items: T[], rng: () => number): T | null {
  if (items.length === 0) return null;
  const index = Math.floor(rng() * items.length);
  return items[index] ?? null;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isLastWeekOfRun(day: Date, endDate: Date): boolean {
  return addDays(day, 7).getTime() > endDate.getTime();
}

type CustomerDailyResult = {
  latencies: {
    cancel: number[];
    rebook: number[];
  };
  errors: string[];
  cancelAttempts: number;
  cancelSuccess: number;
  cancelSkippedNoTarget: number;
  rebookAttempts: number;
  rebookSuccess: number;
  rebookSkippedNoSlot: number;
  rebookBusinessErrors: number;
};

async function handleCustomerDailyOperation(args: {
  day: Date;
  customer: PerformanceCustomerState;
  cancelProbability: number;
  rng: () => number;
}): Promise<CustomerDailyResult> {
  const result: CustomerDailyResult = {
    latencies: {
      cancel: [],
      rebook: [],
    },
    errors: [],
    cancelAttempts: 0,
    cancelSuccess: 0,
    cancelSkippedNoTarget: 0,
    rebookAttempts: 0,
    rebookSuccess: 0,
    rebookSkippedNoSlot: 0,
    rebookBusinessErrors: 0,
  };

  if (args.rng() > args.cancelProbability) {
    return result;
  }

  const customerClassesResponse = await request(server)
    .get(`/customers/${args.customer.customerId}/classes`)
    .set("Cookie", args.customer.customerAuthCookie);

  if (
    customerClassesResponse.status !== 200 ||
    !Array.isArray(customerClassesResponse.body)
  ) {
    result.errors.push(
      `customer-classes customerId=${args.customer.customerId} status=${customerClassesResponse.status} body=${JSON.stringify(customerClassesResponse.body)}`,
    );
    return result;
  }

  const parsedCustomerClasses = CustomerClassesResponse.parse(
    customerClassesResponse.body,
  );
  const cancelThreshold = addDays(args.day, 1).getTime();
  const cancelTargets = parsedCustomerClasses.filter(
    (classRecord) =>
      CANCEL_TARGET_STATUSES.has(classRecord.classStatus) &&
      new Date(classRecord.start).getTime() > cancelThreshold,
  );

  const classToCancel = pickRandom(cancelTargets, args.rng);
  if (!classToCancel) {
    result.cancelSkippedNoTarget += 1;
    return result;
  }

  result.cancelAttempts += 1;
  const cancelStartedAt = performance.now();
  const cancelResponse = await request(server)
    .patch(`/classes/${classToCancel.classId}/cancel`)
    .set("Cookie", args.customer.customerAuthCookie);
  const cancelEndedAt = performance.now();
  result.latencies.cancel.push(cancelEndedAt - cancelStartedAt);

  if (cancelResponse.status !== 200) {
    if (cancelResponse.status >= 500) {
      result.errors.push(
        `cancel classId=${classToCancel.classId} customerId=${args.customer.customerId} status=${cancelResponse.status} body=${JSON.stringify(cancelResponse.body)}`,
      );
    }
    return result;
  }

  result.cancelSuccess += 1;

  const rebookStart = toDateString(addDays(args.day, 1));
  const rebookEnd = toDateString(addDays(args.day, 8));
  const availableSlotsResponse = await request(server)
    .get("/instructors/available-slots")
    .set("Cookie", args.customer.customerAuthCookie)
    .query({
      start: rebookStart,
      end: rebookEnd,
      timezone: "Asia/Tokyo",
      isNative: "false",
    });

  if (availableSlotsResponse.status !== 200) {
    result.errors.push(
      `available-slots customerId=${args.customer.customerId} status=${availableSlotsResponse.status} body=${JSON.stringify(availableSlotsResponse.body)}`,
    );
    return result;
  }

  const availableSlots = AvailableSlotsResponse.parse(
    availableSlotsResponse.body,
  ).data;
  const pickedSlot = pickRandom(availableSlots, args.rng);
  if (!pickedSlot || pickedSlot.availableInstructors.length === 0) {
    result.rebookSkippedNoSlot += 1;
    return result;
  }

  const pickedInstructorId = pickRandom(
    pickedSlot.availableInstructors,
    args.rng,
  );
  if (pickedInstructorId == null) {
    result.rebookSkippedNoSlot += 1;
    return result;
  }

  result.rebookAttempts += 1;
  const rebookStartedAt = performance.now();
  const rebookResponse = await request(server)
    .post(`/classes/${classToCancel.classId}/rebook`)
    .set("Cookie", args.customer.customerAuthCookie)
    .send({
      dateTime: pickedSlot.dateTime,
      instructorId: pickedInstructorId,
      customerId: args.customer.customerId,
      childrenIds: args.customer.childIds,
    });
  const rebookEndedAt = performance.now();
  result.latencies.rebook.push(rebookEndedAt - rebookStartedAt);

  if (rebookResponse.status === 201) {
    result.rebookSuccess += 1;
    return result;
  }

  if (rebookResponse.status >= 500) {
    result.errors.push(
      `rebook classId=${classToCancel.classId} customerId=${args.customer.customerId} status=${rebookResponse.status} body=${JSON.stringify(rebookResponse.body)}`,
    );
    return result;
  }

  if (REBOOK_BUSINESS_ERROR_STATUSES.has(rebookResponse.status)) {
    result.rebookBusinessErrors += 1;
    return result;
  }

  result.errors.push(
    `rebook unexpected classId=${classToCancel.classId} customerId=${args.customer.customerId} status=${rebookResponse.status} body=${JSON.stringify(rebookResponse.body)}`,
  );
  return result;
}

type DayResult = {
  latencies: number[];
  operationLatencies: {
    fetch: number[];
    complete: number[];
    cancel: number[];
    rebook: number[];
  };
  errors: string[];
  completedClasses: number;
  cancelAttempts: number;
  cancelSuccess: number;
  cancelSkippedNoTarget: number;
  rebookAttempts: number;
  rebookSuccess: number;
  rebookSkippedNoSlot: number;
  rebookBusinessErrors: number;
};

async function handleSimulationDay(args: {
  day: Date;
  endDate: Date;
  adminAuthCookie: string;
  instructorIds: number[];
  customers: PerformanceCustomerState[];
  cancelProbability: number;
  rng: () => number;
}): Promise<DayResult> {
  const dayDateKey = args.day.toISOString().slice(0, 10);

  const customerResults: CustomerDailyResult[] = [];
  if (!isLastWeekOfRun(args.day, args.endDate)) {
    for (const customer of args.customers) {
      customerResults.push(
        await handleCustomerDailyOperation({
          day: args.day,
          customer,
          cancelProbability: args.cancelProbability,
          rng: args.rng,
        }),
      );
    }
  }

  const classFetchResults = await Promise.all(
    args.instructorIds.map(async (instructorId) => {
      const startedAt = performance.now();
      const response = await request(server)
        .get(`/instructors/${instructorId}/calendar-classes`)
        .set("Cookie", args.adminAuthCookie);
      const endedAt = performance.now();

      return {
        instructorId,
        latencyMs: endedAt - startedAt,
        status: response.status,
        body: response.body,
      };
    }),
  );

  const fetchErrors = classFetchResults
    .filter((result) => result.status !== 200)
    .map(
      (result) =>
        `calendar-classes instructorId=${result.instructorId} status=${result.status} body=${JSON.stringify(result.body)}`,
    );

  const classIds = new Set<number>();
  for (const result of classFetchResults) {
    if (result.status !== 200 || !Array.isArray(result.body)) {
      continue;
    }

    const parsedClasses = InstructorCalendarClassesResponse.parse(result.body);
    for (const classRecord of parsedClasses) {
      if (
        COMPLETABLE_CLASS_STATUSES.has(classRecord.classStatus) &&
        classRecord.start.slice(0, 10) === dayDateKey
      ) {
        classIds.add(classRecord.classId);
      }
    }
  }

  const completionResults = await Promise.all(
    Array.from(classIds).map(async (classId) => {
      const startedAt = performance.now();
      const response = await request(server)
        .patch(`/classes/${classId}/status`)
        .set("Cookie", args.adminAuthCookie)
        .send({ status: "completed" });
      const endedAt = performance.now();

      return {
        classId,
        latencyMs: endedAt - startedAt,
        status: response.status,
        body: response.body,
      };
    }),
  );

  const completionErrors = completionResults
    .filter((result) => result.status !== 200)
    .map(
      (result) =>
        `classId=${result.classId} status=${result.status} body=${JSON.stringify(result.body)}`,
    );

  return {
    latencies: [
      ...classFetchResults.map((result) => result.latencyMs),
      ...completionResults.map((result) => result.latencyMs),
      ...customerResults.flatMap((result) => result.latencies.cancel),
      ...customerResults.flatMap((result) => result.latencies.rebook),
    ],
    operationLatencies: {
      fetch: classFetchResults.map((result) => result.latencyMs),
      complete: completionResults.map((result) => result.latencyMs),
      cancel: customerResults.flatMap((result) => result.latencies.cancel),
      rebook: customerResults.flatMap((result) => result.latencies.rebook),
    },
    errors: [
      ...fetchErrors,
      ...completionErrors,
      ...customerResults.flatMap((result) => result.errors),
    ],
    completedClasses: completionResults.length - completionErrors.length,
    cancelAttempts: customerResults.reduce(
      (sum, result) => sum + result.cancelAttempts,
      0,
    ),
    cancelSuccess: customerResults.reduce(
      (sum, result) => sum + result.cancelSuccess,
      0,
    ),
    cancelSkippedNoTarget: customerResults.reduce(
      (sum, result) => sum + result.cancelSkippedNoTarget,
      0,
    ),
    rebookAttempts: customerResults.reduce(
      (sum, result) => sum + result.rebookAttempts,
      0,
    ),
    rebookSuccess: customerResults.reduce(
      (sum, result) => sum + result.rebookSuccess,
      0,
    ),
    rebookSkippedNoSlot: customerResults.reduce(
      (sum, result) => sum + result.rebookSkippedNoSlot,
      0,
    ),
    rebookBusinessErrors: customerResults.reduce(
      (sum, result) => sum + result.rebookBusinessErrors,
      0,
    ),
  };
}

async function countRebookableClassesAtEnd(
  customers: PerformanceCustomerState[],
) {
  const responses = await Promise.all(
    customers.map((customer) =>
      request(server)
        .get(`/customers/${customer.customerId}/rebookable-classes`)
        .set("Cookie", customer.customerAuthCookie),
    ),
  );

  let count = 0;
  const errors: string[] = [];
  for (const [index, response] of responses.entries()) {
    const customerId = customers[index]?.customerId ?? "unknown";
    if (response.status !== 200 || !Array.isArray(response.body)) {
      errors.push(
        `rebookable-classes customerId=${customerId} status=${response.status} body=${JSON.stringify(response.body)}`,
      );
      continue;
    }

    count += RebookableClassesResponse.parse(response.body).length;
  }

  return { count, errors };
}

describe("performance: completion + customer cancel/rebook workload", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ticks day-by-day and runs completion with daily customer cancel/rebook", async () => {
    const config = getPerformanceTestConfig();
    const state = await initializePerformanceData(config);
    const rng = createSeededRng(config.seed);

    const runStartedAt = performance.now();
    const allLatencies: number[] = [];
    const fetchLatencies: number[] = [];
    const completionLatencies: number[] = [];
    const cancelLatencies: number[] = [];
    const rebookLatencies: number[] = [];
    const allErrors: string[] = [];
    let completedClasses = 0;
    let daysPassed = 0;
    let cancelAttempts = 0;
    let cancelSuccess = 0;
    let cancelSkippedNoTarget = 0;
    let rebookAttempts = 0;
    let rebookSuccess = 0;
    let rebookSkippedNoSlot = 0;
    let rebookBusinessErrors = 0;

    const runEndDate = new Date(`${config.endDate}T00:00:00.000Z`);

    for (const day of enumerateDays(config.startDate, config.endDate)) {
      vi.setSystemTime(day);
      daysPassed += 1;

      const dayResult = await handleSimulationDay({
        day,
        endDate: runEndDate,
        adminAuthCookie: state.adminAuthCookie,
        instructorIds: state.instructorIds,
        customers: state.customers,
        cancelProbability: config.cancelProbability,
        rng,
      });

      allLatencies.push(...dayResult.latencies);
      fetchLatencies.push(...dayResult.operationLatencies.fetch);
      completionLatencies.push(...dayResult.operationLatencies.complete);
      cancelLatencies.push(...dayResult.operationLatencies.cancel);
      rebookLatencies.push(...dayResult.operationLatencies.rebook);
      allErrors.push(...dayResult.errors);
      completedClasses += dayResult.completedClasses;
      cancelAttempts += dayResult.cancelAttempts;
      cancelSuccess += dayResult.cancelSuccess;
      cancelSkippedNoTarget += dayResult.cancelSkippedNoTarget;
      rebookAttempts += dayResult.rebookAttempts;
      rebookSuccess += dayResult.rebookSuccess;
      rebookSkippedNoSlot += dayResult.rebookSkippedNoSlot;
      rebookBusinessErrors += dayResult.rebookBusinessErrors;
    }

    const rebookableClassCount = await countRebookableClassesAtEnd(
      state.customers,
    );
    allErrors.push(...rebookableClassCount.errors);

    const runEndedAt = performance.now();
    const latencyStats = calcLatencyStats(allLatencies);
    const fetchLatencyStats = calcLatencyStats(fetchLatencies);
    const completionLatencyStats = calcLatencyStats(completionLatencies);
    const cancelLatencyStats = calcLatencyStats(cancelLatencies);
    const rebookLatencyStats = calcLatencyStats(rebookLatencies);

    const reportPath = await writePerformanceReport({
      config,
      summary: {
        elapsedMs: runEndedAt - runStartedAt,
        daysPassed,
        completedClasses,
        cancelAttempts,
        cancelSuccess,
        cancelSkippedNoTarget,
        rebookAttempts,
        rebookSuccess,
        rebookSkippedNoSlot,
        rebookBusinessErrors,
        rebookableClassesAtEnd: rebookableClassCount.count,
        latencyMinMs: latencyStats.min,
        latencyMaxMs: latencyStats.max,
        latencyAvgMs: latencyStats.average,
        latencyMedianMs: latencyStats.median,
        fetchLatencyAvgMs: fetchLatencyStats.average,
        completionLatencyAvgMs: completionLatencyStats.average,
        cancelLatencyAvgMs: cancelLatencyStats.average,
        rebookLatencyAvgMs: rebookLatencyStats.average,
        errors: allErrors,
      },
      outputPath: config.outputPath,
    });

    expect(daysPassed).toBeGreaterThan(0);
    expect(completedClasses).toBeGreaterThan(0);
    expect(allErrors).toEqual([]);
    expect(reportPath.endsWith(".md")).toBe(true);
  }, 180_000);
});
