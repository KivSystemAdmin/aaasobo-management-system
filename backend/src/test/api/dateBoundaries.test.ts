import { describe, expect, it } from "vitest";
import {
  getJstDateAtUtcMidnight,
  getJstMonthRange,
  toJstDateKey,
} from "../../utils/dateUtils";

describe("JST date boundaries", () => {
  it.each([
    [2025, 1, "2025-01-31T15:00:00.000Z", "2025-02-28T15:00:00.000Z"],
    [2024, 1, "2024-01-31T15:00:00.000Z", "2024-02-29T15:00:00.000Z"],
    [2025, 3, "2025-03-31T15:00:00.000Z", "2025-04-30T15:00:00.000Z"],
    [2025, 11, "2025-11-30T15:00:00.000Z", "2025-12-31T15:00:00.000Z"],
  ])(
    "bounds month %s-%s at JST midnight",
    (year, month, expectedStart, expectedEnd) => {
      const range = getJstMonthRange(year, month);
      expect(range.start.toISOString()).toBe(expectedStart);
      expect(range.end.toISOString()).toBe(expectedEnd);
    },
  );

  it("keeps early-morning instants on their JST calendar date", () => {
    expect(toJstDateKey(new Date("2025-12-31T15:30:00.000Z"))).toBe(
      "2026-01-01",
    );
    expect(toJstDateKey(new Date("2026-01-01T14:59:59.999Z"))).toBe(
      "2026-01-01",
    );
    expect(
      getJstDateAtUtcMidnight(
        new Date("2026-01-01T14:59:59.999Z"),
      ).toISOString(),
    ).toBe("2026-01-01T00:00:00.000Z");
  });
});
