import { describe, it, expect, vi } from "vitest";
import { prisma } from "../setup";
import { bootstrapSimulation } from "./bootstrap";
import { defaultSimulationBootstrapConfig } from "./config";

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

describe("simulation bootstrap", () => {
  it("creates a realistic initial state via APIs", async () => {
    const seed = 12345;
    const state = await bootstrapSimulation({
      ...defaultSimulationBootstrapConfig,
      seed,
      scale: {
        ...defaultSimulationBootstrapConfig.scale,
        instructors: 2,
        customers: 3,
      },
    });

    expect(state.seed).toBe(seed);
    expect(state.admin.id).toBeGreaterThan(0);
    expect(state.instructors).toHaveLength(2);
    expect(state.customers).toHaveLength(3);

    expect(await prisma.subscription.count()).toBe(3);
    expect(await prisma.recurringClass.count()).toBeGreaterThanOrEqual(3);
    expect(
      await prisma.class.count({ where: { status: "booked" } }),
    ).toBeGreaterThan(0);
  }, 20_000);
});
