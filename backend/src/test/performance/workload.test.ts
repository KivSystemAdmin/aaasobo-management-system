import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { server } from "../../server";
import { getPerformanceTestConfig } from "./config";
import { initializePerformanceData, type CompletionTarget } from "./bootstrap";
import { writePerformanceReport } from "./report";

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

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

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
  dayTargets: CompletionTarget[];
  adminAuthCookie: string;
}) {
  const results = await Promise.all(
    args.dayTargets.map(async (target) => {
      const startedAt = performance.now();
      const response = await request(server)
        .patch(`/classes/${target.classId}/status`)
        .set("Cookie", args.adminAuthCookie)
        .send({ status: "completed" });
      const endedAt = performance.now();

      return {
        classId: target.classId,
        latencyMs: endedAt - startedAt,
        status: response.status,
        body: response.body,
      };
    }),
  );

  const latencies = results.map((result) => result.latencyMs);
  const errors = results
    .filter((result) => result.status !== 200)
    .map(
      (result) =>
        `classId=${result.classId} status=${result.status} body=${JSON.stringify(result.body)}`,
    );

  return {
    latencies,
    errors,
    completedClasses: results.length - errors.length,
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

    const targetsByDate = new Map<string, CompletionTarget[]>();
    for (const target of state.completionTargets) {
      const existing = targetsByDate.get(target.dateKey) ?? [];
      existing.push(target);
      targetsByDate.set(target.dateKey, existing);
    }

    const runStartedAt = performance.now();
    const allLatencies: number[] = [];
    const allErrors: string[] = [];
    let completedClasses = 0;
    let daysPassed = 0;

    for (const day of enumerateDays(config.startDate, config.endDate)) {
      vi.setSystemTime(day);
      daysPassed += 1;

      const dayTargets = targetsByDate.get(toDateKey(day)) ?? [];
      const dayResult = await handleSimulationDay({
        dayTargets,
        adminAuthCookie: state.adminAuthCookie,
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
    expect(completedClasses).toBe(state.completionTargets.length);
    expect(allErrors).toEqual([]);
    expect(reportPath.endsWith(".md")).toBe(true);
  }, 180_000);
});
