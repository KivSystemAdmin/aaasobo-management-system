import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
const { faker } = require("@faker-js/faker");
import { server } from "../../../server";
import { prisma } from "../../setup";
import {
  createInstructor,
  createAdmin,
  createInstructorSchedule,
  createInstructorSlot,
  createInstructorAbsence,
  createClass,
  createCustomer,
  generateAuthCookie,
  generateTestInstructor,
} from "../../testUtils";

/**
 * Creates a time-only ISO string
 * @returns Time-only ISO string (e.g., "1970-01-01T10:00:00.000Z")
 */
function time(strings: TemplateStringsArray, ...values: any[]): string {
  const input = strings[0] + (values[0] || "");
  const timeMatch = input.match(/^(\d{1,2}):(\d{2})$/);

  if (timeMatch) {
    const [, hours, minutes] = timeMatch;
    return `1970-01-01T${hours.padStart(2, "0")}:${minutes}:00.000Z`;
  }

  throw new Error(`Invalid time format: "${input}". Use "HH:MM" format.`);
}

/**
 * Convert JST datetime to UTC
 * @returns UTC ISO string
 */
function jst(strings: TemplateStringsArray, ...values: any[]): string {
  const input = strings[0] + (values[0] || "");

  // Match date only: YYYY-MM-DD
  const dateOnlyMatch = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch;
    // Create JST date at 00:00 and convert to UTC
    const jstDate = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
    return jstDate.toISOString();
  }

  // Match datetime: YYYY-MM-DD HH:MM
  const dateTimeMatch = input.match(
    /^(\d{4})-(\d{2})-(\d{2})[ ](\d{1,2}):(\d{2})$/,
  );
  if (dateTimeMatch) {
    const [, year, month, day, hours, minutes] = dateTimeMatch;
    // Create a Date object in JST and convert to UTC
    const jstDate = new Date(
      `${year}-${month}-${day}T${hours.padStart(2, "0")}:${minutes}:00+09:00`,
    );
    return jstDate.toISOString();
  }

  throw new Error(
    `Invalid JST format: "${input}". Use "YYYY-MM-DD" or "YYYY-MM-DD HH:MM" format.`,
  );
}

describe("POST /instructors/:id/schedules", () => {
  describe("schedule versioning", () => {
    it("succeed creating new schedule for instructor with no existing schedules", async () => {
      const admin = await createAdmin();
      const authCookie = await generateAuthCookie(admin.id, "admin");
      const instructor = await createInstructor();

      const requestBody = {
        effectiveFrom: "2025-02-01",
        timezone: "Asia/Tokyo",
        slots: [
          {
            weekday: 1,
            startTime: "09:00",
          },
          {
            weekday: 3,
            startTime: "14:00",
          },
        ],
      };

      const response = await request(server)
        .post(`/instructors/${instructor.id}/schedules`)
        .set("Cookie", authCookie)
        .send(requestBody)
        .expect(201);

      expect(response.body.data).toMatchObject({
        instructorId: instructor.id,
        effectiveFrom: "2025-02-01T00:00:00.000Z",
        effectiveTo: null,
        timezone: "Asia/Tokyo",
      });
      expect(response.body.data.slots).toHaveLength(2);
      expect(response.body.data.slots).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            weekday: 1,
            startTime: "09:00",
          }),
          expect.objectContaining({
            weekday: 3,
            startTime: "14:00",
          }),
        ]),
      );
    });

    it("succeed adding new schedule version and ending existing schedule", async () => {
      const admin = await createAdmin();
      const authCookie = await generateAuthCookie(admin.id, "admin");
      const instructor = await createInstructor();

      // Create existing active schedule
      const existingSchedule = await createInstructorSchedule(instructor.id, {
        effectiveFrom: new Date("2025-01-01"),
        effectiveTo: null,
        timezone: "Asia/Tokyo",
      });
      await createInstructorSlot(existingSchedule.id, 1, new Date(time`09:00`));

      const requestBody = {
        effectiveFrom: "2025-03-01",
        timezone: "Asia/Tokyo",
        slots: [
          {
            weekday: 2,
            startTime: "10:00",
          },
          {
            weekday: 4,
            startTime: "15:00",
          },
        ],
      };

      const response = await request(server)
        .post(`/instructors/${instructor.id}/schedules`)
        .set("Cookie", authCookie)
        .send(requestBody)
        .expect(201);

      expect(response.body.data).toMatchObject({
        instructorId: instructor.id,
        effectiveFrom: "2025-03-01T00:00:00.000Z",
        effectiveTo: null,
        timezone: "Asia/Tokyo",
      });

      // Verify existing schedule was ended
      const updatedExistingSchedule =
        await prisma.instructorSchedule.findUnique({
          where: { id: existingSchedule.id },
        });
      expect(updatedExistingSchedule?.effectiveTo).toEqual(
        new Date("2025-03-01"),
      );
    });
  });
});

describe("GET /instructors/:id/available-slots - Active Schedule", () => {
  let authCookie: string;

  beforeEach(async () => {
    const customer = await createCustomer();
    authCookie = await generateAuthCookie(customer.id, "customer");
  });
  /*
   * Interval Overlap Patterns
   *
   * Pattern A: No Overlap    - Query period ends before or at schedule start
   *            endDate <= effectiveFrom
   *
   * Pattern B: Partial Overlap - Query period starts before schedule, ends after schedule starts
   *            startDate < effectiveFrom < endDate
   *
   * Pattern C: Full Overlap  - Query period starts at or after schedule start
   *            effectiveFrom <= startDate < endDate
   *
   * Note: All boundary cases (=) are handled within these 3 main patterns
   */

  it("startDate < endDate < effectiveFrom (no overlap)", async () => {
    const instructor = await createInstructor();
    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });

    await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-01", end: "2025-06-30", timezone: "Asia/Tokyo" })
      .expect(200)
      .expect((res) => expect(res.body.data).toEqual([]));
  });

  it("startDate < endDate = effectiveFrom (boundary, no overlap)", async () => {
    const instructor = await createInstructor();
    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });

    await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-01", end: "2025-07-01", timezone: "Asia/Tokyo" })
      .expect(200)
      .expect((res) => expect(res.body.data).toEqual([]));
  });

  it("startDate < effectiveFrom < endDate (partial overlap from effectiveFrom)", async () => {
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"), // Tuesday
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule.id, 2, new Date(time`11:00`)); // Tuesday
    await createInstructorSlot(schedule.id, 2, new Date(time`12:00`)); // Tuesday

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-01", end: "2025-07-02", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([
      { dateTime: jst`2025-07-01 11:00` },
      { dateTime: jst`2025-07-01 12:00` },
    ]);
  });

  it("effectiveFrom = startDate < endDate (boundary, full overlap from startDate)", async () => {
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"), // Tuesday
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule.id, 0, new Date(time`09:00`)); // Sunday
    await createInstructorSlot(schedule.id, 1, new Date(time`10:00`)); // Monday
    await createInstructorSlot(schedule.id, 2, new Date(time`11:00`)); // Tuesday
    await createInstructorSlot(schedule.id, 2, new Date(time`12:00`)); // Tuesday (2 slots)
    await createInstructorSlot(schedule.id, 3, new Date(time`13:00`)); // Wednesday
    await createInstructorSlot(schedule.id, 4, new Date(time`14:00`)); // Thursday
    await createInstructorSlot(schedule.id, 5, new Date(time`15:00`)); // Friday
    await createInstructorSlot(schedule.id, 6, new Date(time`16:00`)); // Saturday

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-07-01", end: "2025-07-08", timezone: "Asia/Tokyo" })
      .expect(200);

    // All weekdays covered from startDate onwards in JST
    expect(response.body.data).toEqual([
      { dateTime: jst`2025-07-01 11:00` },
      { dateTime: jst`2025-07-01 12:00` },
      { dateTime: jst`2025-07-02 13:00` },
      { dateTime: jst`2025-07-03 14:00` },
      { dateTime: jst`2025-07-04 15:00` },
      { dateTime: jst`2025-07-05 16:00` },
      { dateTime: jst`2025-07-06 09:00` },
      { dateTime: jst`2025-07-07 10:00` },
    ]);
  });

  it("effectiveFrom < startDate < endDate (full overlap from startDate)", async () => {
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"), // Tuesday
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule.id, 4, new Date(time`14:00`)); // Thursday
    await createInstructorSlot(schedule.id, 5, new Date(time`15:00`)); // Friday
    await createInstructorSlot(schedule.id, 6, new Date(time`16:00`)); // Saturday
    await createInstructorSlot(schedule.id, 0, new Date(time`09:00`)); // Sunday
    await createInstructorSlot(schedule.id, 1, new Date(time`10:00`)); // Monday

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-07-10", end: "2025-07-15", timezone: "Asia/Tokyo" })
      .expect(200);

    // Slots from startDate onwards (schedule has been running)
    expect(response.body.data).toEqual([
      { dateTime: jst`2025-07-10 14:00` },
      { dateTime: jst`2025-07-11 15:00` },
      { dateTime: jst`2025-07-12 16:00` },
      { dateTime: jst`2025-07-13 09:00` },
      { dateTime: jst`2025-07-14 10:00` },
    ]);
  });
});

describe("GET /instructors/:id/available-slots - Schedule End Date", () => {
  let authCookie: string;

  beforeEach(async () => {
    const customer = await createCustomer();
    authCookie = await generateAuthCookie(customer.id, "customer");
  });
  /*
   * Interval Overlap Patterns with effectiveTo (finite schedule)
   *
   * Pattern A: No Overlap    - Query period ends before or at schedule start
   *            endDate <= effectiveFrom
   *
   * Pattern B: Partial Overlap (Start) - Query starts before schedule, ends within schedule
   *            startDate < effectiveFrom < endDate <= effectiveTo
   *
   * Pattern C: Full Overlap  - Query period completely within schedule period
   *            effectiveFrom <= startDate < endDate <= effectiveTo
   *
   * Pattern D: Query Encompasses Schedule - Query period completely contains schedule period
   *            startDate < effectiveFrom < effectiveTo < endDate
   *
   * Pattern E: Partial Overlap (End) - Query starts within schedule, ends after schedule
   *            effectiveFrom <= startDate < effectiveTo < endDate
   *
   * Pattern F: No Overlap    - Query period starts at or after schedule end
   *            effectiveTo <= startDate < endDate
   */

  it("startDate < endDate < effectiveFrom (no overlap before schedule)", async () => {
    const instructor = await createInstructor();
    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: new Date("2025-07-15"),
      timezone: "Asia/Tokyo",
    });

    await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-01", end: "2025-06-30", timezone: "Asia/Tokyo" })
      .expect(200)
      .expect((res) => expect(res.body.data).toEqual([]));
  });

  it("startDate < endDate = effectiveFrom (boundary, no overlap)", async () => {
    const instructor = await createInstructor();
    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: new Date("2025-07-15"),
      timezone: "Asia/Tokyo",
    });

    await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-01", end: "2025-07-01", timezone: "Asia/Tokyo" })
      .expect(200)
      .expect((res) => expect(res.body.data).toEqual([]));
  });

  it("startDate < effectiveFrom < endDate <= effectiveTo (partial overlap from schedule start)", async () => {
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: new Date("2025-07-15"),
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule.id, 2, new Date(time`09:30`));
    await createInstructorSlot(schedule.id, 3, new Date(time`13:00`));
    await createInstructorSlot(schedule.id, 4, new Date(time`16:30`));
    await createInstructorSlot(schedule.id, 5, new Date(time`20:00`));
    await createInstructorSlot(schedule.id, 6, new Date(time`23:30`));
    await createInstructorSlot(schedule.id, 0, new Date(time`00:00`));
    await createInstructorSlot(schedule.id, 1, new Date(time`03:30`));
    await createInstructorSlot(schedule.id, 1, new Date(time`06:30`));

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-25", end: "2025-07-10", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([
      { dateTime: jst`2025-07-01 09:30` },
      { dateTime: jst`2025-07-02 13:00` },
      { dateTime: jst`2025-07-03 16:30` },
      { dateTime: jst`2025-07-04 20:00` },
      { dateTime: jst`2025-07-05 23:30` },
      { dateTime: jst`2025-07-06 00:00` },
      { dateTime: jst`2025-07-07 03:30` },
      { dateTime: jst`2025-07-07 06:30` },
      { dateTime: jst`2025-07-08 09:30` },
      { dateTime: jst`2025-07-09 13:00` },
    ]);
  });

  it("effectiveFrom <= startDate < endDate <= effectiveTo (full overlap within schedule)", async () => {
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: new Date("2025-07-15"),
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule.id, 6, new Date(time`23:30`));
    await createInstructorSlot(schedule.id, 0, new Date(time`00:00`));
    await createInstructorSlot(schedule.id, 1, new Date(time`03:30`));
    await createInstructorSlot(schedule.id, 1, new Date(time`06:30`));
    await createInstructorSlot(schedule.id, 2, new Date(time`09:30`));
    await createInstructorSlot(schedule.id, 3, new Date(time`13:00`));
    await createInstructorSlot(schedule.id, 4, new Date(time`16:30`));
    await createInstructorSlot(schedule.id, 5, new Date(time`20:00`));

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-07-05", end: "2025-07-12", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([
      { dateTime: jst`2025-07-05 23:30` },
      { dateTime: jst`2025-07-06 00:00` },
      { dateTime: jst`2025-07-07 03:30` },
      { dateTime: jst`2025-07-07 06:30` },
      { dateTime: jst`2025-07-08 09:30` },
      { dateTime: jst`2025-07-09 13:00` },
      { dateTime: jst`2025-07-10 16:30` },
      { dateTime: jst`2025-07-11 20:00` },
    ]);
  });

  it("startDate < effectiveFrom < effectiveTo < endDate (query encompasses entire schedule)", async () => {
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: new Date("2025-07-15"),
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule.id, 2, new Date(time`09:30`));
    await createInstructorSlot(schedule.id, 3, new Date(time`13:00`));
    await createInstructorSlot(schedule.id, 4, new Date(time`16:30`));
    await createInstructorSlot(schedule.id, 5, new Date(time`20:00`));
    await createInstructorSlot(schedule.id, 6, new Date(time`23:30`));
    await createInstructorSlot(schedule.id, 0, new Date(time`00:00`));
    await createInstructorSlot(schedule.id, 1, new Date(time`03:30`));
    await createInstructorSlot(schedule.id, 1, new Date(time`06:30`));

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-15", end: "2025-07-30", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([
      { dateTime: jst`2025-07-01 09:30` },
      { dateTime: jst`2025-07-02 13:00` },
      { dateTime: jst`2025-07-03 16:30` },
      { dateTime: jst`2025-07-04 20:00` },
      { dateTime: jst`2025-07-05 23:30` },
      { dateTime: jst`2025-07-06 00:00` },
      { dateTime: jst`2025-07-07 03:30` },
      { dateTime: jst`2025-07-07 06:30` },
      { dateTime: jst`2025-07-08 09:30` },
      { dateTime: jst`2025-07-09 13:00` },
      { dateTime: jst`2025-07-10 16:30` },
      { dateTime: jst`2025-07-11 20:00` },
      { dateTime: jst`2025-07-12 23:30` },
      { dateTime: jst`2025-07-13 00:00` },
      { dateTime: jst`2025-07-14 03:30` },
      { dateTime: jst`2025-07-14 06:30` },
    ]);
  });

  it("effectiveFrom <= startDate < effectiveTo < endDate (partial overlap until schedule end)", async () => {
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: new Date("2025-07-15"),
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule.id, 4, new Date(time`16:30`));
    await createInstructorSlot(schedule.id, 5, new Date(time`20:00`));
    await createInstructorSlot(schedule.id, 6, new Date(time`23:30`));
    await createInstructorSlot(schedule.id, 0, new Date(time`00:00`));
    await createInstructorSlot(schedule.id, 1, new Date(time`03:30`));
    await createInstructorSlot(schedule.id, 1, new Date(time`06:30`));

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-07-10", end: "2025-07-20", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([
      { dateTime: jst`2025-07-10 16:30` },
      { dateTime: jst`2025-07-11 20:00` },
      { dateTime: jst`2025-07-12 23:30` },
      { dateTime: jst`2025-07-13 00:00` },
      { dateTime: jst`2025-07-14 03:30` },
      { dateTime: jst`2025-07-14 06:30` },
    ]);
  });

  it("effectiveTo <= startDate < endDate (no overlap after schedule end)", async () => {
    const instructor = await createInstructor();
    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: new Date("2025-07-15"),
      timezone: "Asia/Tokyo",
    });

    await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-07-15", end: "2025-07-25", timezone: "Asia/Tokyo" })
      .expect(200)
      .expect((res) => expect(res.body.data).toEqual([]));
  });

  it("effectiveTo < startDate < endDate (no overlap, clear gap after schedule)", async () => {
    const instructor = await createInstructor();
    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: new Date("2025-07-15"),
      timezone: "Asia/Tokyo",
    });

    await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-07-20", end: "2025-07-30", timezone: "Asia/Tokyo" })
      .expect(200)
      .expect((res) => expect(res.body.data).toEqual([]));
  });
});

describe("GET /instructors/:id/available-slots - Multiple Schedules Adjacent", () => {
  let authCookie: string;

  beforeEach(async () => {
    const customer = await createCustomer();
    authCookie = await generateAuthCookie(customer.id, "customer");
  });
  /*
   * Multi-Schedule Interaction Patterns (Adjacent Schedules)
   *
   * Setup: endedSchedule (June 1 - July 1, exclusive) + activeSchedule (July 1+, infinite)
   * Note: Schedules are typically adjacent with no gaps (endedSchedule.effectiveTo = activeSchedule.effectiveFrom)
   *
   * Pattern A: Query Spans Both Schedules - Query period overlaps both ended and active schedules
   *            startDate < endedSchedule.effectiveTo = activeSchedule.effectiveFrom < endDate
   *
   * Note: Single-schedule interactions are already tested in previous describe blocks
   */

  it("startDate < endedSchedule.effectiveTo = activeSchedule.effectiveFrom < endDate (spans both schedules, no gap)", async () => {
    const instructor = await createInstructor();

    const endedSchedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-06-01"),
      effectiveTo: new Date("2025-07-01"),
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(endedSchedule.id, 1, new Date(time`15:00`));
    await createInstructorSlot(endedSchedule.id, 3, new Date(time`14:00`));

    const activeSchedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(activeSchedule.id, 2, new Date(time`13:00`));
    await createInstructorSlot(activeSchedule.id, 4, new Date(time`12:00`));

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-25", end: "2025-07-10", timezone: "Asia/Tokyo" })
      .expect(200);

    // Should return slots from both schedules
    // Note: July 1st is NOT included from ended schedule since effectiveTo is exclusive
    expect(response.body.data).toEqual([
      { dateTime: jst`2025-06-25 14:00` },
      { dateTime: jst`2025-06-30 15:00` },
      { dateTime: jst`2025-07-01 13:00` },
      { dateTime: jst`2025-07-03 12:00` },
      { dateTime: jst`2025-07-08 13:00` },
    ]);
  });

  it("startDate < endedSchedule.effectiveFrom and activeSchedule.effectiveFrom < endDate (spans entire ended schedule plus active)", async () => {
    const instructor = await createInstructor();

    const endedSchedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-06-01"),
      effectiveTo: new Date("2025-07-01"),
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(endedSchedule.id, 1, new Date(time`15:00`));
    await createInstructorSlot(endedSchedule.id, 3, new Date(time`14:00`));

    const activeSchedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(activeSchedule.id, 2, new Date(time`13:00`));
    await createInstructorSlot(activeSchedule.id, 4, new Date(time`12:00`));

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-05-01", end: "2025-07-05", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([
      { dateTime: jst`2025-06-02 15:00` },
      { dateTime: jst`2025-06-04 14:00` },
      { dateTime: jst`2025-06-09 15:00` },
      { dateTime: jst`2025-06-11 14:00` },
      { dateTime: jst`2025-06-16 15:00` },
      { dateTime: jst`2025-06-18 14:00` },
      { dateTime: jst`2025-06-23 15:00` },
      { dateTime: jst`2025-06-25 14:00` },
      { dateTime: jst`2025-06-30 15:00` },
      { dateTime: jst`2025-07-01 13:00` },
      { dateTime: jst`2025-07-03 12:00` },
    ]);
  });
});

describe("GET /instructors/:id/available-slots - Multiple Schedules Gap", () => {
  let authCookie: string;

  beforeEach(async () => {
    const customer = await createCustomer();
    authCookie = await generateAuthCookie(customer.id, "customer");
  });
  /*
   * Multi-Schedule Interaction Patterns (Schedules with Gap)
   *
   * Setup: endedSchedule (June 1 - June 20, exclusive) + activeSchedule (July 10+, infinite)
   * Note: This tests the unusual scenario where there's a gap between schedule periods
   *
   * Pattern A: Query Spans Both Schedules with Gap - Query period overlaps both schedules and the gap
   *            startDate < endedSchedule.effectiveTo < activeSchedule.effectiveFrom < endDate
   *
   * Pattern B: Query Spans Only Gap - Query period falls entirely within the gap period
   *            endedSchedule.effectiveTo <= startDate < endDate <= activeSchedule.effectiveFrom
   */

  it("endedSchedule.effectiveTo < activeSchedule.effectiveFrom with query spanning gap", async () => {
    const instructor = await createInstructor();

    const endedSchedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-06-01"),
      effectiveTo: new Date("2025-06-20"),
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(endedSchedule.id, 1, new Date(time`15:00`));
    await createInstructorSlot(endedSchedule.id, 3, new Date(time`14:00`));

    const activeSchedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-10"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(activeSchedule.id, 2, new Date(time`10:00`));
    await createInstructorSlot(activeSchedule.id, 4, new Date(time`15:00`));

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-15", end: "2025-07-15", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([
      { dateTime: jst`2025-06-16 15:00` },
      { dateTime: jst`2025-06-18 14:00` },
      { dateTime: jst`2025-07-10 15:00` },
    ]);
  });

  it("query spans entire ended schedule, gap, and part of active schedule", async () => {
    const instructor = await createInstructor();

    const endedSchedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-06-01"),
      effectiveTo: new Date("2025-06-20"),
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(endedSchedule.id, 1, new Date(time`15:00`));
    await createInstructorSlot(endedSchedule.id, 3, new Date(time`14:00`));

    const activeSchedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-10"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(activeSchedule.id, 2, new Date(time`10:00`));
    await createInstructorSlot(activeSchedule.id, 4, new Date(time`15:00`));

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-05-25", end: "2025-07-12", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([
      { dateTime: jst`2025-06-02 15:00` },
      { dateTime: jst`2025-06-04 14:00` },
      { dateTime: jst`2025-06-09 15:00` },
      { dateTime: jst`2025-06-11 14:00` },
      { dateTime: jst`2025-06-16 15:00` },
      { dateTime: jst`2025-06-18 14:00` },
      { dateTime: jst`2025-07-10 15:00` },
    ]);
  });

  it("query period spans only the gap between schedules (no slots)", async () => {
    const instructor = await createInstructor();

    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-06-01"),
      effectiveTo: new Date("2025-06-20"),
      timezone: "Asia/Tokyo",
    });

    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-10"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-25", end: "2025-07-05", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([]);
  });

  it("query period exactly matches the gap between schedules", async () => {
    const instructor = await createInstructor();

    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-06-01"),
      effectiveTo: new Date("2025-06-20"),
      timezone: "Asia/Tokyo",
    });

    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-10"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-06-20", end: "2025-07-10", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([]);
  });
});

describe("GET /instructors/:id/available-slots - With Absences", () => {
  let authCookie: string;

  beforeEach(async () => {
    const customer = await createCustomer();
    authCookie = await generateAuthCookie(customer.id, "customer");
  });
  it("succeed filtering out absent slots and ignoring absences outside query range", async () => {
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-07"), // Monday
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule.id, 1, new Date(time`09:00`));
    await createInstructorSlot(schedule.id, 2, new Date(time`19:00`));
    await createInstructorSlot(schedule.id, 3, new Date(time`09:00`));

    // Create absences: one within query range, one outside
    await createInstructorAbsence(
      instructor.id,
      new Date(jst`2025-07-07 09:00`),
    );
    await createInstructorAbsence(
      instructor.id,
      new Date(jst`2025-07-09 09:00`),
    );

    const response = await request(server)
      .get(`/instructors/${instructor.id}/available-slots`)
      .set("Cookie", authCookie)
      .query({ start: "2025-07-07", end: "2025-07-09", timezone: "Asia/Tokyo" })
      .expect(200);

    expect(response.body.data).toEqual([{ dateTime: jst`2025-07-08 19:00` }]);
  });
});

describe("GET /instructors/available-slots - All Available Slots", () => {
  let authCookie: string;

  beforeEach(async () => {
    const customer = await createCustomer();
    authCookie = await generateAuthCookie(customer.id, "customer");
  });
  it("succeed returning available slots grouped by time with instructor lists", async () => {
    const instructor1 = await createInstructor();
    const instructor2 = await createInstructor();
    const instructor3 = await createInstructor();

    const schedule1 = await createInstructorSchedule(instructor1.id, {
      effectiveFrom: new Date("2025-08-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule1.id, 1, new Date(time`10:00`));
    await createInstructorSlot(schedule1.id, 1, new Date(time`11:00`));

    const schedule2 = await createInstructorSchedule(instructor2.id, {
      effectiveFrom: new Date("2025-08-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule2.id, 1, new Date(time`10:00`));
    await createInstructorSlot(schedule2.id, 1, new Date(time`14:00`));

    const schedule3 = await createInstructorSchedule(instructor3.id, {
      effectiveFrom: new Date("2025-08-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule3.id, 1, new Date(time`11:00`));

    // Create absence for instructor2 on 2025-08-04 14:00
    await createInstructorAbsence(
      instructor2.id,
      new Date(jst`2025-08-04 14:00`),
    );

    // Create booking for instructor3 on 2025-08-04 11:00
    const customer = await createCustomer();
    await createClass(
      customer.id,
      instructor3.id,
      new Date(jst`2025-08-04 11:00`),
    );

    const response = await request(server)
      .get("/instructors/available-slots")
      .set("Cookie", authCookie)
      .query({
        start: "2025-08-04",
        end: "2025-08-05",
        timezone: "Asia/Tokyo",
        isNative: "false",
      })
      .expect(200);

    expect(response.body.data).toEqual([
      {
        dateTime: jst`2025-08-04 10:00`,
        availableInstructors: [instructor1.id, instructor2.id],
      },
      {
        dateTime: jst`2025-08-04 11:00`,
        availableInstructors: [instructor1.id],
      },
    ]);
  });

  it("succeed handling empty results when no instructors are available", async () => {
    const response = await request(server)
      .get("/instructors/available-slots")
      .set("Cookie", authCookie)
      .query({
        start: "2025-08-04",
        end: "2025-08-05",
        timezone: "Asia/Tokyo",
        isNative: "false",
      })
      .expect(200);

    expect(response.body.data).toEqual([]);
  });
});

describe("GET /instructors/:id/schedules", () => {
  let authCookie: string;

  beforeEach(async () => {
    const admin = await createAdmin();
    authCookie = await generateAuthCookie(admin.id, "admin");
  });
  it("succeed returning instructor schedules", async () => {
    const instructor = await createInstructor();
    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2024-01-01"),
      effectiveTo: new Date("2024-06-30"),
    });
    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2024-07-01"),
      effectiveTo: null,
    });

    const response = await request(server)
      .get(`/instructors/${instructor.id}/schedules`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
  });
});

describe("GET /instructors/:id/schedules/active", () => {
  let authCookie: string;

  beforeEach(async () => {
    const customer = await createCustomer();
    authCookie = await generateAuthCookie(customer.id, "customer");
  });
  it("succeed with valid effective date", async () => {
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2024-01-01"),
      effectiveTo: null,
    });
    await createInstructorSlot(
      schedule.id,
      1,
      new Date("1970-01-01T09:00:00Z"),
    );

    const response = await request(server)
      .get(`/instructors/${instructor.id}/schedules/active`)
      .set("Cookie", authCookie)
      .query({ effectiveDate: "2024-06-15" })
      .expect(200);

    expect(response.body.data.id).toBe(schedule.id);
  });
});

describe("GET /instructors/:id/schedules/:scheduleId", () => {
  let authCookie: string;

  beforeEach(async () => {
    const admin = await createAdmin();
    authCookie = await generateAuthCookie(admin.id, "admin");
  });
  it("succeed with valid schedule ID", async () => {
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id);

    const response = await request(server)
      .get(`/instructors/${instructor.id}/schedules/${schedule.id}`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.data.id).toBe(schedule.id);
  });
});

describe("POST /instructors/:id/schedules", () => {
  it("succeed creating schedules for instructor with future termination date", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const futureDate = faker.date.future();
    const testData = generateTestInstructor();
    const instructor = await createInstructor({
      ...testData,
      birthdate: new Date(testData.birthdate),
      terminationAt: futureDate,
    });
    await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2024-01-01"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });

    const response = await request(server)
      .post(`/instructors/${instructor.id}/schedules`)
      .set("Cookie", authCookie)
      .send({
        effectiveFrom: "2025-02-01",
        timezone: "Asia/Tokyo",
        slots: [{ weekday: 1, startTime: "09:00" }],
      })
      .expect(201);

    expect(response.body.data).toMatchObject({
      instructorId: instructor.id,
      effectiveFrom: "2025-02-01T00:00:00.000Z",
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
  });
});
