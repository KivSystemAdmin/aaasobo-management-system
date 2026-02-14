import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";
import { server } from "../../server";
import { prisma } from "../setup";
import {
  createAdmin,
  createChild,
  createClass,
  createCustomer,
  createInstructor,
  generateAuthCookie,
} from "../testUtils";

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

describe("double booking", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("prevents double-booking for the same instructor/dateTime", async () => {
    const admin = await createAdmin();
    const adminAuthCookie = await generateAuthCookie(admin.id, "admin");

    const instructor = await createInstructor();
    const rebookableUntil = new Date("2025-12-31T00:00:00.000Z");

    const setupCustomer = async () => {
      const customer = await createCustomer();
      const child = await createChild(customer.id);
      const oldClass = await createClass(customer.id);
      await prisma.class.update({
        where: { id: oldClass.id },
        data: {
          isFreeTrial: true,
          rebookableUntil,
        },
      });
      return { customer, child, oldClass };
    };

    const customerA = await setupCustomer();
    const customerB = await setupCustomer();

    const targetDateTime = new Date("2025-01-15T00:00:00.000Z");
    const postRebook = (args: {
      oldClassId: number;
      customerId: number;
      childrenIds: number[];
    }) =>
      request(server)
        .post(`/classes/${args.oldClassId}/rebook`)
        .set("Cookie", adminAuthCookie)
        .send({
          dateTime: targetDateTime.toISOString(),
          instructorId: instructor.id,
          customerId: args.customerId,
          childrenIds: args.childrenIds,
        });

    const responses = await Promise.all([
      postRebook({
        oldClassId: customerA.oldClass.id,
        customerId: customerA.customer.id,
        childrenIds: [customerA.child.id],
      }),
      postRebook({
        oldClassId: customerB.oldClass.id,
        customerId: customerB.customer.id,
        childrenIds: [customerB.child.id],
      }),
    ]);
    const statuses = responses.map((r) => r.status).sort();
    expect(statuses[0]).toBe(201);
    expect([400, 409]).toContain(statuses[1]);
    const conflictResponse = responses.find((r) => r.status !== 201);
    expect(["instructor conflict", "likely instructor conflict"]).toContain(
      conflictResponse?.body?.errorType,
    );

    const rebookedCount = await prisma.class.count({
      where: {
        instructorId: instructor.id,
        dateTime: targetDateTime,
        status: "rebooked",
      },
    });
    expect(rebookedCount).toBe(1);
  });
});
