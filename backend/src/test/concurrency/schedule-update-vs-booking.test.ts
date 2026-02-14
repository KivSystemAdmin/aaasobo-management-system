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

describe("concurrency: schedule update vs booking race", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2025-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const { repetitions } = getConcurrencyConfig();

  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    it(`keeps schedule and booking state consistent when slot is removed (run #${repetition})`, async () => {
      const admin = await createAdmin();
      const adminAuthCookie = await generateAuthCookie(admin.id, "admin");
      const instructor = await createInstructor();

      await request(server)
        .post(`/instructors/${instructor.id}/schedules`)
        .set("Cookie", adminAuthCookie)
        .send({
          effectiveFrom: "2025-01-01",
          timezone: "Asia/Tokyo",
          slots: [{ weekday: 3, startTime: "00:00" }],
        })
        .expect(201);

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

      const scheduleUpdateRequest = request(server)
        .post(`/instructors/${instructor.id}/schedules`)
        .set("Cookie", adminAuthCookie)
        .send({
          effectiveFrom: "2025-01-15",
          timezone: "Asia/Tokyo",
          slots: [{ weekday: 4, startTime: "00:00" }],
        });

      const [rebookResponse, scheduleUpdateResponse] = await Promise.all([
        rebookRequest,
        scheduleUpdateRequest,
      ]);

      expect(scheduleUpdateResponse.status).toBe(201);
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

      const targetDate = new Date("2025-01-15T00:00:00.000Z");
      const activeSchedule = await prisma.instructorSchedule.findFirst({
        where: {
          instructorId: instructor.id,
          effectiveFrom: { lte: targetDate },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: targetDate } }],
        },
        include: { slots: true },
      });

      const hasTargetSlot = !!activeSchedule?.slots.some(
        (slot) =>
          slot.weekday === 3 &&
          slot.startTime.toISOString().slice(11, 16) === "00:00",
      );

      expect(bookedOrRebookedCount).toBe(0);
      expect(hasTargetSlot).toBe(false);

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
