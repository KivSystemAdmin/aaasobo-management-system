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
import { getConcurrencyConfig } from "./config";

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

describe("concurrency: absence creation vs booking race", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const { repetitions } = getConcurrencyConfig();

  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    it(`absence operation always wins and booking does not remain confirmed (run #${repetition})`, async () => {
      const admin = await createAdmin();
      const adminAuthCookie = await generateAuthCookie(admin.id, "admin");
      const instructor = await createInstructor();

      const customer = await createCustomer();
      const child = await createChild(customer.id);
      const oldClass = await createClass(customer.id);

      await prisma.class.update({
        where: { id: oldClass.id },
        data: {
          isFreeTrial: true,
          rebookableUntil: new Date("2025-12-31T00:00:00.000Z"),
        },
      });

      const targetDateTime = new Date("2025-01-15T00:00:00.000Z");

      const rebookRequest = request(server)
        .post(`/classes/${oldClass.id}/rebook`)
        .set("Cookie", adminAuthCookie)
        .send({
          dateTime: targetDateTime.toISOString(),
          instructorId: instructor.id,
          customerId: customer.id,
          childrenIds: [child.id],
        });

      const absenceRequest = request(server)
        .post(`/instructors/${instructor.id}/absences`)
        .set("Cookie", adminAuthCookie)
        .send({ absentAt: targetDateTime.toISOString() });

      const [rebookResponse, absenceResponse] = await Promise.all([
        rebookRequest,
        absenceRequest,
      ]);
      expect(absenceResponse.status).toBe(201);
      expect([201, 400, 409]).toContain(rebookResponse.status);

      const bookedOrRebookedCount = await prisma.class.count({
        where: {
          instructorId: instructor.id,
          dateTime: targetDateTime,
          status: {
            in: ["booked", "rebooked"],
          },
        },
      });

      const absenceCount = await prisma.instructorAbsence.count({
        where: {
          instructorId: instructor.id,
          absentAt: targetDateTime,
        },
      });

      expect(absenceCount).toBe(1);
      expect(bookedOrRebookedCount).toBe(0);

      const canceledClass = await prisma.class.findFirst({
        where: {
          instructorId: instructor.id,
          customerId: customer.id,
          dateTime: targetDateTime,
          status: "canceledByInstructor",
        },
      });

      if (rebookResponse.status === 201) {
        expect(canceledClass).toBeTruthy();
        expect(canceledClass?.rebookableUntil).toBeTruthy();
      }
    });
  }
});
