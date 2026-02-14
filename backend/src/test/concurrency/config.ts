const DEFAULT_CONCURRENCY_REPETITIONS = 1;
const DEFAULT_CONCURRENCY_SEED = 123456;

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function getConcurrencyConfig() {
  const repetitions = parsePositiveInt(
    process.env.CONCURRENCY_REPETITIONS,
    DEFAULT_CONCURRENCY_REPETITIONS,
  );
  const seed = parsePositiveInt(
    process.env.CONCURRENCY_SEED,
    DEFAULT_CONCURRENCY_SEED,
  );

  return {
    repetitions,
    seed,
  };
}
