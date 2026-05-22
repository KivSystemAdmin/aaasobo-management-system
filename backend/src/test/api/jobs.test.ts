import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import request from "supertest";
import { server } from "../../server";
import { prisma } from "../setup";
import {
  createAdmin,
  createCustomer,
  createInstructor,
  createClass,
  createEvent,
} from "../testUtils";
import {
  convertToISOString,
  getFirstDesignatedDayOfYear,
} from "../../utils/dateUtils";
import { maskedHeadLetters } from "../../utils/commonUtils";
import { EnglishBackground } from "../../types";

function cronAuthHeader() {
  process.env.CRON_SECRET = "test-cron-secret";
  return `Bearer ${process.env.CRON_SECRET}`;
}

function listAllSundaysOfNextYear(now: Date): string[] {
  const nextYear = now.getFullYear() + 1;
  const firstSunday = getFirstDesignatedDayOfYear(nextYear, "Sun");
  const dates: string[] = [];

  for (
    let d = new Date(firstSunday);
    d.getFullYear() === nextYear;
    d = new Date(d.setDate(d.getDate() + 7))
  ) {
    dates.push(convertToISOString(d.toISOString().split("T")[0]));
  }

  return dates;
}

describe("/jobs", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("GET /jobs/get-system-status", () => {
    it("succeed returning system status (cron auth)", async () => {
      await prisma.systemStatus.create({
        data: { id: 1, status: "Running" },
      });

      const response = await request(server)
        .get("/jobs/get-system-status")
        .set("Authorization", cronAuthHeader())
        .expect(200);

      expect(response.body).toEqual({ status: "Running" });
    });

    it("return 500 when system status row is missing", async () => {
      const response = await request(server)
        .get("/jobs/get-system-status")
        .set("Authorization", cronAuthHeader())
        .expect(500);

      expect(response.body).toHaveProperty("message");
    });

    it("return 401 when cron auth is missing", async () => {
      await request(server).get("/jobs/get-system-status").expect(401);
    });
  });

  describe("PATCH /jobs/update-system-status", () => {
    it("toggle system status Running -> Stop (cron auth)", async () => {
      await prisma.systemStatus.create({
        data: { id: 1, status: "Running" },
      });

      const response = await request(server)
        .patch("/jobs/update-system-status")
        .set("Authorization", cronAuthHeader())
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({ id: 1, status: "Stop" }),
      );

      const reloaded = await prisma.systemStatus.findUnique({
        where: { id: 1 },
        select: { status: true },
      });
      expect(reloaded?.status).toBe("Stop");
    });
  });

  describe("POST /jobs/business-schedule/update-sunday-color", () => {
    it("create next year's Sunday schedules (cron auth)", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T00:00:00.000Z"));

      const event = await createEvent();

      const response = await request(server)
        .post("/jobs/business-schedule/update-sunday-color")
        .set("Authorization", cronAuthHeader())
        .send({ eventId: event.id })
        .expect(200);

      expect(response.body).toEqual({
        message: "Sunday colors updated successfully.",
      });

      const expectedDates = listAllSundaysOfNextYear(new Date());
      const schedules = await prisma.schedule.findMany({
        where: { eventId: event.id },
        orderBy: { date: "asc" },
      });

      expect(schedules).toHaveLength(expectedDates.length);
      expect(schedules[0].date.toISOString()).toBe(expectedDates[0]);
      expect(schedules.at(-1)?.date.toISOString()).toBe(expectedDates.at(-1));
    });

    it("return 401 when cron auth is missing", async () => {
      const event = await createEvent();
      await request(server)
        .post("/jobs/business-schedule/update-sunday-color")
        .send({ eventId: event.id })
        .expect(401);
    });
  });

  describe("PATCH /jobs/mask/instructors", () => {
    it("mask instructors whose terminationAt is in the past", async () => {
      const toMask = await createInstructor();
      await prisma.instructor.update({
        where: { id: toMask.id },
        data: {
          terminationAt: new Date("2000-01-01T00:00:00.000Z"),
          classURL: "https://example.com/class",
          englishBackground: EnglishBackground.NativeA,
        },
      });

      const active = await createInstructor();
      await prisma.instructor.update({
        where: { id: active.id },
        data: {
          terminationAt: null,
          classURL: "https://example.com/active",
          englishBackground: EnglishBackground.NonNative,
        },
      });

      const response = await request(server)
        .patch("/jobs/mask/instructors")
        .set("Authorization", cronAuthHeader())
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toEqual(
        expect.objectContaining({
          id: toMask.id,
          name: maskedHeadLetters,
        }),
      );
      expect(response.body[0].classURL).toContain(maskedHeadLetters);

      const maskedDb = await prisma.instructor.findUnique({
        where: { id: toMask.id },
        select: { name: true, classURL: true, englishBackground: true },
      });
      expect(maskedDb?.name).toBe(maskedHeadLetters);
      expect(maskedDb?.classURL).toContain(maskedHeadLetters);
      expect(maskedDb?.englishBackground).toBe(EnglishBackground.NonNative);

      const activeDb = await prisma.instructor.findUnique({
        where: { id: active.id },
        select: { classURL: true, englishBackground: true },
      });
      expect(activeDb?.classURL).toBe("https://example.com/active");
      expect(activeDb?.englishBackground).toBe(EnglishBackground.NonNative);
    });

    it("return empty list when no instructors need masking", async () => {
      await createInstructor();

      const response = await request(server)
        .patch("/jobs/mask/instructors")
        .set("Authorization", cronAuthHeader())
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  describe("DELETE /jobs/delete/past-admins", () => {
    it("delete admins whose terminationAt is older than 36 months (cron auth)", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-02T00:00:00.000Z"));

      const oldTerminatedAdmin = await createAdmin();
      const recentTerminatedAdmin = await createAdmin();
      const activeAdmin = await createAdmin();

      await prisma.admin.update({
        where: { id: oldTerminatedAdmin.id },
        data: { terminationAt: new Date("2023-03-31T00:00:00.000Z") },
      });

      await prisma.admin.update({
        where: { id: recentTerminatedAdmin.id },
        data: { terminationAt: new Date("2023-04-02T00:00:00.000Z") },
      });

      const response = await request(server)
        .delete("/jobs/delete/past-admins")
        .set("Authorization", cronAuthHeader())
        .expect(200);

      expect(response.body.deletedAdmins).toEqual({ count: 1 });

      expect(
        await prisma.admin.findUnique({
          where: { id: oldTerminatedAdmin.id },
        }),
      ).toBeNull();

      expect(
        await prisma.admin.findUnique({
          where: { id: recentTerminatedAdmin.id },
        }),
      ).not.toBeNull();

      expect(
        await prisma.admin.findUnique({
          where: { id: activeAdmin.id },
        }),
      ).not.toBeNull();
    });

    it("return 401 when cron auth is missing", async () => {
      await request(server).delete("/jobs/delete/past-admins").expect(401);
    });
  });

  describe("DELETE /jobs/delete/past-message-board-posts", () => {
    it("delete message board posts older than 12 months (cron auth)", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-04-02T00:00:00.000Z"));

      const oldPost = await prisma.messageBoardPost.create({
        data: {
          target: 2,
          body: "old post",
          createdAt: new Date("2025-04-01T00:00:00.000Z"),
        },
      });

      const recentPost = await prisma.messageBoardPost.create({
        data: {
          target: 2,
          body: "recent post",
          createdAt: new Date("2025-04-02T00:00:00.000Z"),
        },
      });

      const response = await request(server)
        .delete("/jobs/delete/past-message-board-posts")
        .set("Authorization", cronAuthHeader())
        .expect(200);

      expect(response.body.deletedPosts).toEqual({ count: 1 });

      expect(
        await prisma.messageBoardPost.findUnique({ where: { id: oldPost.id } }),
      ).toBeNull();

      expect(
        await prisma.messageBoardPost.findUnique({
          where: { id: recentPost.id },
        }),
      ).not.toBeNull();
    });

    it("return 401 when cron auth is missing", async () => {
      await request(server)
        .delete("/jobs/delete/past-message-board-posts")
        .expect(401);
    });
  });

  describe("DELETE /jobs/delete/old-classes", () => {
    it("delete classes older than 13 months (cron auth)", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2025-06-01T00:00:00.000Z"));

      const customer = await createCustomer();
      const instructor = await createInstructor();

      const oldDate = new Date("2024-04-30T00:00:00.000Z");
      const newDate = new Date("2024-05-02T00:00:00.000Z");
      await createClass(customer.id, instructor.id, oldDate);
      await createClass(customer.id, instructor.id, newDate);

      const response = await request(server)
        .delete("/jobs/delete/old-classes")
        .set("Authorization", cronAuthHeader())
        .expect(200);

      expect(response.body.deletedClasses).toEqual({ count: 1 });
      expect(await prisma.class.count()).toBe(1);
    });
  });
});
