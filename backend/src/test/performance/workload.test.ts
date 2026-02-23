import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { server } from "../../server";
import { getPerformanceTestConfig } from "./config";
import { initializePerformanceData } from "./bootstrap";
import { writePerformanceReport } from "./report";
import { InstructorCalendarClassesResponse } from "../../../../shared/schemas/instructors";

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

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function isEndOfMonth(day: Date): boolean {
  const nextDay = new Date(day);
  nextDay.setUTCDate(day.getUTCDate() + 1);
  return nextDay.getUTCDate() === 1;
}

function getNextMonthParams(day: Date): {
  year: number;
  month: (typeof MONTH_NAMES)[number];
} {
  const nextMonthDate = new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth() + 1, 1),
  );
  return {
    year: nextMonthDate.getUTCFullYear(),
    month: MONTH_NAMES[nextMonthDate.getUTCMonth()]!,
  };
}

const COMPLETABLE_CLASS_STATUSES = new Set(["pending", "booked", "rebooked"]);

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

async function handleSimulationDay(args: {
  day: Date;
  adminAuthCookie: string;
  instructorIds: number[];
}) {
  const dayDateKey = args.day.toISOString().slice(0, 10);

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

  const generationErrors: string[] = [];

  if (isEndOfMonth(args.day)) {
    const { year, month } = getNextMonthParams(args.day);
    const generationResponse = await request(server)
      .post("/classes/create-classes")
      .set("Cookie", args.adminAuthCookie)
      .send({ year, month });

    if (generationResponse.status !== 201) {
      generationErrors.push(
        `create-classes year=${year} month=${month} status=${generationResponse.status} body=${JSON.stringify(generationResponse.body)}`,
      );
    }
  }

  return {
    latencies: [
      ...classFetchResults.map((result) => result.latencyMs),
      ...completionResults.map((result) => result.latencyMs),
    ],
    errors: [...fetchErrors, ...completionErrors, ...generationErrors],
    completedClasses: completionResults.length - completionErrors.length,
  };
}

describe("performance: simple completion workload", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ticks day-by-day and completes scheduled classes", async () => {
    const config = getPerformanceTestConfig();
    const state = await initializePerformanceData(config);

    const runStartedAt = performance.now();
    const allLatencies: number[] = [];
    const allErrors: string[] = [];
    let completedClasses = 0;
    let daysPassed = 0;

    for (const day of enumerateDays(config.startDate, config.endDate)) {
      vi.setSystemTime(day);
      daysPassed += 1;

      const dayResult = await handleSimulationDay({
        day,
        adminAuthCookie: state.adminAuthCookie,
        instructorIds: state.instructorIds,
      });

      allLatencies.push(...dayResult.latencies);
      allErrors.push(...dayResult.errors);
      completedClasses += dayResult.completedClasses;
    }

    const runEndedAt = performance.now();
    const latencyStats = calcLatencyStats(allLatencies);

    const reportPath = await writePerformanceReport({
      config,
      summary: {
        elapsedMs: runEndedAt - runStartedAt,
        daysPassed,
        completedClasses,
        latencyMinMs: latencyStats.min,
        latencyMaxMs: latencyStats.max,
        latencyAvgMs: latencyStats.average,
        latencyMedianMs: latencyStats.median,
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
