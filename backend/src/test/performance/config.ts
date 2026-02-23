const DEFAULT_PERFORMANCE_CONFIG = {
  seed: 123456,
  startDate: "2025-01-01",
  endDate: "2025-01-31",
  instructors: 5,
  slotsPerInstructor: 10,
  customers: 10,
  cancelProbability: 0.25,
  outputPath: "./logs/performance-report.md",
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parseDate(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return fallback;
  return value;
}

function parseProbability(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed)) return fallback;
  if (parsed < 0 || parsed > 1) return fallback;
  return parsed;
}

export type PerformanceTestConfig = {
  seed: number;
  startDate: string;
  endDate: string;
  instructors: number;
  slotsPerInstructor: number;
  customers: number;
  cancelProbability: number;
  outputPath: string;
};

export function getPerformanceTestConfig(): PerformanceTestConfig {
  return {
    seed: parsePositiveInt(
      process.env.PERF_SEED,
      DEFAULT_PERFORMANCE_CONFIG.seed,
    ),
    startDate: parseDate(
      process.env.PERF_START_DATE,
      DEFAULT_PERFORMANCE_CONFIG.startDate,
    ),
    endDate: parseDate(
      process.env.PERF_END_DATE,
      DEFAULT_PERFORMANCE_CONFIG.endDate,
    ),
    instructors: parsePositiveInt(
      process.env.PERF_INSTRUCTORS,
      DEFAULT_PERFORMANCE_CONFIG.instructors,
    ),
    slotsPerInstructor: parsePositiveInt(
      process.env.PERF_SLOTS_PER_INSTRUCTOR,
      DEFAULT_PERFORMANCE_CONFIG.slotsPerInstructor,
    ),
    customers: parsePositiveInt(
      process.env.PERF_CUSTOMERS,
      DEFAULT_PERFORMANCE_CONFIG.customers,
    ),
    cancelProbability: parseProbability(
      process.env.PERF_CANCEL_PROBABILITY,
      DEFAULT_PERFORMANCE_CONFIG.cancelProbability,
    ),
    outputPath:
      process.env.PERF_OUTPUT || DEFAULT_PERFORMANCE_CONFIG.outputPath,
  };
}
