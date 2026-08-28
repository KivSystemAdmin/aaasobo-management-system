import { afterEach, describe, it, expect, vi } from "vitest";
import request from "supertest";
import { server } from "../../server";
import { prisma } from "../setup";
import {
  createAdmin,
  createCustomer,
  createPlan,
  createSubscription,
  createChild,
  createInstructor,
  createInstructorSchedule,
  createInstructorSlot,
  createInstructorAbsence,
  createClass,
  createEvent,
  createSchedule,
  generateAuthCookie,
} from "../testUtils";

async function createAdminAuthCookie() {
  const admin = await createAdmin();
  return await generateAuthCookie(admin.id, "admin");
}

function time(strings: TemplateStringsArray, ...values: any[]): Date {
  const input = strings[0] + (values[0] || "");
  const timeMatch = input.match(/^(\d{1,2}):(\d{2})$/);

  if (!timeMatch) {
    throw new Error(`Invalid time format: "${input}". Use "HH:MM" format.`);
  }

  const [, hours, minutes] = timeMatch;
  return new Date(`1970-01-01T${hours.padStart(2, "0")}:${minutes}:00.000Z`);
}

function nextWeekdayOccurrenceUTC(
  startDate: string,
  targetWeekday: number,
  startTime: string,
): Date {
  const [hours, minutes] = startTime.split(":").map(Number);
  const result = new Date(startDate);

  const currentWeekday = result.getUTCDay();
  const daysUntilTarget = (targetWeekday - currentWeekday + 7) % 7;
  result.setUTCDate(result.getUTCDate() + daysUntilTarget);

  result.setUTCHours(hours - 9, minutes, 0, 0);
  return result;
}

async function setupCore({
  slotWeekday,
  slotStartTime,
  slotEffectiveFrom,
  childrenCount = 2,
}: {
  slotWeekday: number;
  slotStartTime: string;
  slotEffectiveFrom: Date;
  childrenCount?: number;
}) {
  const customer = await createCustomer();
  const plan = await createPlan();
  const subscription = await createSubscription(plan.id, customer.id, {
    startAt: new Date("2025-01-01T00:00:00.000Z"),
    endAt: new Date("2026-01-01T00:00:00.000Z"),
  });
  const children = await Promise.all(
    Array.from({ length: childrenCount }).map(() => createChild(customer.id)),
  );

  const instructor = await createInstructor();
  const schedule = await createInstructorSchedule(instructor.id, {
    effectiveFrom: slotEffectiveFrom,
    effectiveTo: null,
    timezone: "Asia/Tokyo",
  });
  await createInstructorSlot(schedule.id, slotWeekday, time`${slotStartTime}`);

  return { customer, subscription, children, instructor, schedule };
}

afterEach(() => {
  vi.useRealTimers();
});

describe("POST /recurring-classes", () => {
  it("succeed creating recurring class when slot exists", async () => {
    const authCookie = await createAdminAuthCookie();
    const { customer, subscription, children, instructor } = await setupCore({
      slotWeekday: 1,
      slotStartTime: "10:00",
      slotEffectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    });

    await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({
        instructorId: instructor.id,
        weekday: 1,
        startTime: "10:00",
        customerId: customer.id,
        childrenIds: children.map((c) => c.id),
        subscriptionId: subscription.id,
        startDate: "2025-01-15",
        timezone: "Asia/Tokyo",
      })
      .expect(201);

    const created = await prisma.recurringClass.findFirst({
      where: { subscriptionId: subscription.id },
      include: { recurringClassAttendance: true, classes: true },
    });

    expect(created).toBeTruthy();
    expect(created?.instructorId).toBe(instructor.id);
    expect(created?.recurringClassAttendance).toHaveLength(children.length);
    expect(created?.classes.length).toBeGreaterThan(6);

    const classAttendances = await prisma.classAttendance.count({
      where: { classId: { in: created!.classes.map((c) => c.id) } },
    });
    expect(classAttendances).toBe(created!.classes.length * children.length);
  });

  it("return 400 when instructor slot is missing", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();
    const plan = await createPlan();
    const subscription = await createSubscription(plan.id, customer.id);
    const child = await createChild(customer.id);
    const instructor = await createInstructor();

    await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({
        instructorId: instructor.id,
        weekday: 1,
        startTime: "10:00",
        customerId: customer.id,
        childrenIds: [child.id],
        subscriptionId: subscription.id,
        startDate: "2025-01-15",
        timezone: "Asia/Tokyo",
      })
      .expect(400);
  });

  it("return 400 when conflicting recurring class exists", async () => {
    const authCookie = await createAdminAuthCookie();
    const { customer, subscription, children, instructor } = await setupCore({
      slotWeekday: 1,
      slotStartTime: "10:00",
      slotEffectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    });

    await prisma.recurringClass.create({
      data: {
        instructorId: instructor.id,
        subscriptionId: subscription.id,
        startAt: new Date("2025-01-20T01:00:00.000Z"),
        endAt: null,
      },
    });

    const response = await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({
        instructorId: instructor.id,
        weekday: 1,
        startTime: "10:00",
        customerId: customer.id,
        childrenIds: children.map((c) => c.id),
        subscriptionId: subscription.id,
        startDate: "2025-01-15",
        timezone: "Asia/Tokyo",
      })
      .expect(400);

    expect(response.body.message).toBe(
      "Regular class already exists at this time slot",
    );
    expect(await prisma.recurringClass.count()).toBe(1);
  });

  it("return 400 for validation errors", async () => {
    const authCookie = await createAdminAuthCookie();
    await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({ instructorId: 1, weekday: 1 })
      .expect(400);

    await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({
        instructorId: 1,
        weekday: 7,
        startTime: "10:00",
        customerId: 1,
        childrenIds: [1],
        subscriptionId: 1,
        startDate: "2025-01-01",
      })
      .expect(400);

    await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({
        instructorId: 1,
        weekday: 1,
        startTime: "10:00:00",
        customerId: 1,
        childrenIds: [1],
        subscriptionId: 1,
        startDate: "2025-01-01",
      })
      .expect(400);

    await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({
        instructorId: 1,
        weekday: 1,
        startTime: "10:00",
        customerId: 1,
        childrenIds: [],
        subscriptionId: 1,
        startDate: "2025-01-01",
      })
      .expect(400);
  });

  it("cancel created classes that conflict with existing classes", async () => {
    const authCookie = await createAdminAuthCookie();
    const { customer, subscription, children, instructor } = await setupCore({
      slotWeekday: 1,
      slotStartTime: "10:00",
      slotEffectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    });

    const firstOccurrence = nextWeekdayOccurrenceUTC("2025-01-15", 1, "10:00");

    const otherCustomer = await createCustomer();
    await createClass(otherCustomer.id, instructor.id, firstOccurrence);

    await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({
        instructorId: instructor.id,
        weekday: 1,
        startTime: "10:00",
        customerId: customer.id,
        childrenIds: children.map((c) => c.id),
        subscriptionId: subscription.id,
        startDate: "2025-01-15",
        timezone: "Asia/Tokyo",
      })
      .expect(201);

    const recurringClass = await prisma.recurringClass.findFirst({
      where: { subscriptionId: subscription.id },
      orderBy: { id: "desc" },
    });

    const conflicted = await prisma.class.findFirst({
      where: {
        recurringClassId: recurringClass!.id,
        dateTime: firstOccurrence,
      },
    });

    expect(conflicted?.status).toBe("canceledByInstructor");
    expect(conflicted?.canceledAt).toBeTruthy();
  });

  it("cancel created classes that fall on instructor absences", async () => {
    const authCookie = await createAdminAuthCookie();
    const { customer, subscription, children, instructor } = await setupCore({
      slotWeekday: 1,
      slotStartTime: "10:00",
      slotEffectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    });

    const firstOccurrence = nextWeekdayOccurrenceUTC("2025-01-15", 1, "10:00");
    await createInstructorAbsence(instructor.id, firstOccurrence);

    await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({
        instructorId: instructor.id,
        weekday: 1,
        startTime: "10:00",
        customerId: customer.id,
        childrenIds: children.map((c) => c.id),
        subscriptionId: subscription.id,
        startDate: "2025-01-15",
        timezone: "Asia/Tokyo",
      })
      .expect(201);

    const recurringClass = await prisma.recurringClass.findFirst({
      where: { subscriptionId: subscription.id },
      orderBy: { id: "desc" },
    });

    const absentClass = await prisma.class.findFirst({
      where: {
        recurringClassId: recurringClass!.id,
        dateTime: firstOccurrence,
      },
    });

    expect(absentClass?.status).toBe("canceledByInstructor");
    expect(absentClass?.canceledAt).toBeTruthy();
  });

  it("does not create classes on no-class business schedule dates", async () => {
    const authCookie = await createAdminAuthCookie();
    const { customer, subscription, children, instructor } = await setupCore({
      slotWeekday: 1,
      slotStartTime: "10:00",
      slotEffectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    });
    const firstOccurrence = nextWeekdayOccurrenceUTC("2025-01-15", 1, "10:00");
    const noClassEvent = await createEvent({
      name: "お休み / No Class",
      color: "#111111",
    });
    await createSchedule(
      noClassEvent.id,
      new Date(`${firstOccurrence.toISOString().slice(0, 10)}T00:00:00.000Z`),
    );

    await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({
        instructorId: instructor.id,
        weekday: 1,
        startTime: "10:00",
        customerId: customer.id,
        childrenIds: children.map((c) => c.id),
        subscriptionId: subscription.id,
        startDate: "2025-01-15",
        timezone: "Asia/Tokyo",
      })
      .expect(201);

    const recurringClass = await prisma.recurringClass.findFirst({
      where: { subscriptionId: subscription.id },
      orderBy: { id: "desc" },
    });
    const classOnNoClassDate = await prisma.class.findFirst({
      where: {
        recurringClassId: recurringClass!.id,
        dateTime: firstOccurrence,
      },
    });

    expect(classOnNoClassDate).toBeNull();
  });

  it("creates admin-canceled classes on rebookable no-class dates", async () => {
    const authCookie = await createAdminAuthCookie();
    const { customer, subscription, children, instructor } = await setupCore({
      slotWeekday: 1,
      slotStartTime: "10:00",
      slotEffectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
    });
    const firstOccurrence = nextWeekdayOccurrenceUTC("2025-01-15", 1, "10:00");
    const rebookableEvent = await createEvent({
      name: "お休み振替対象日 / No Class (Rebookable)",
      color: "#222222",
    });
    await createSchedule(
      rebookableEvent.id,
      new Date(`${firstOccurrence.toISOString().slice(0, 10)}T00:00:00.000Z`),
    );

    await request(server)
      .post("/recurring-classes")
      .set("Cookie", authCookie)
      .send({
        instructorId: instructor.id,
        weekday: 1,
        startTime: "10:00",
        customerId: customer.id,
        childrenIds: children.map((c) => c.id),
        subscriptionId: subscription.id,
        startDate: "2025-01-15",
        timezone: "Asia/Tokyo",
      })
      .expect(201);

    const recurringClass = await prisma.recurringClass.findFirst({
      where: { subscriptionId: subscription.id },
      orderBy: { id: "desc" },
    });
    const adminCanceledClass = await prisma.class.findFirst({
      where: {
        recurringClassId: recurringClass!.id,
        dateTime: firstOccurrence,
      },
    });

    expect(adminCanceledClass?.status).toBe("canceledByAdmin");
    expect(adminCanceledClass?.canceledAt).toBeTruthy();
    expect(adminCanceledClass?.rebookableUntil?.toISOString()).toBe(
      new Date(
        firstOccurrence.getTime() + 180 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    );
  });
});

describe("GET /recurring-classes", () => {
  it("succeed listing classes for subscription (customer auth)", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");
    const plan = await createPlan();
    const subscription = await createSubscription(plan.id, customer.id);
    const instructor = await createInstructor();
    const child = await createChild(customer.id);

    const recurringClass = await prisma.recurringClass.create({
      data: {
        instructorId: instructor.id,
        subscriptionId: subscription.id,
        startAt: new Date("2025-01-20T01:00:00.000Z"),
        endAt: null,
      },
    });
    await prisma.recurringClassAttendance.create({
      data: { recurringClassId: recurringClass.id, childrenId: child.id },
    });

    const response = await request(server)
      .get(`/recurring-classes?subscriptionId=${subscription.id}`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.recurringClasses).toHaveLength(1);
    expect(response.body.recurringClasses[0].id).toBe(recurringClass.id);
    expect(response.body.recurringClasses[0].instructorId).toBe(instructor.id);
  });

  it("return 400 when subscriptionId is missing", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");

    await request(server)
      .get("/recurring-classes")
      .set("Cookie", authCookie)
      .expect(400);
  });

  it("filter by status=active/history", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");
    const plan = await createPlan();
    const subscription = await createSubscription(plan.id, customer.id);
    const instructor = await createInstructor();
    const child = await createChild(customer.id);

    const active = await prisma.recurringClass.create({
      data: {
        instructorId: instructor.id,
        subscriptionId: subscription.id,
        startAt: new Date("2025-01-20T01:00:00.000Z"),
        endAt: null,
      },
    });
    const history = await prisma.recurringClass.create({
      data: {
        instructorId: instructor.id,
        subscriptionId: subscription.id,
        startAt: new Date("2024-01-20T01:00:00.000Z"),
        endAt: new Date("2025-01-01T00:00:00.000Z"),
      },
    });
    await prisma.recurringClassAttendance.createMany({
      data: [
        { recurringClassId: active.id, childrenId: child.id },
        { recurringClassId: history.id, childrenId: child.id },
      ],
    });

    const activeRes = await request(server)
      .get(`/recurring-classes?subscriptionId=${subscription.id}&status=active`)
      .set("Cookie", authCookie)
      .expect(200);
    expect(activeRes.body.recurringClasses.map((c: any) => c.id)).toEqual([
      active.id,
    ]);

    const historyRes = await request(server)
      .get(
        `/recurring-classes?subscriptionId=${subscription.id}&status=history`,
      )
      .set("Cookie", authCookie)
      .expect(200);
    expect(historyRes.body.recurringClasses.map((c: any) => c.id)).toEqual([
      history.id,
    ]);
  });

  it("return 400 for invalid status parameter", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");

    await request(server)
      .get(`/recurring-classes?subscriptionId=1&status=invalid`)
      .set("Cookie", authCookie)
      .expect(400);
  });
});

describe("GET /recurring-classes/:id", () => {
  it("succeed returning recurring class by id", async () => {
    const customer = await createCustomer();
    const plan = await createPlan();
    const subscription = await createSubscription(plan.id, customer.id);
    const instructor = await createInstructor();

    const recurringClass = await prisma.recurringClass.create({
      data: {
        instructorId: instructor.id,
        subscriptionId: subscription.id,
        startAt: new Date("2025-01-20T01:00:00.000Z"),
        endAt: null,
      },
    });

    const response = await request(server)
      .get(`/recurring-classes/${recurringClass.id}`)
      .expect(200);

    expect(response.body.id).toBe(recurringClass.id);
    expect(response.body.subscriptionId).toBe(subscription.id);
    expect(response.body.instructorId).toBe(instructor.id);
  });

  it("return 400 for invalid id", async () => {
    await request(server).get(`/recurring-classes/invalid`).expect(400);
  });

  it("return 404 for missing recurring class", async () => {
    await request(server).get(`/recurring-classes/999999`).expect(404);
  });
});

describe("GET /recurring-classes/by-instructorId", () => {
  it("succeed returning valid recurring classes for instructor", async () => {
    const customer = await createCustomer();
    const plan = await createPlan();
    const subscription = await createSubscription(plan.id, customer.id);
    const instructor = await createInstructor();

    const recurringClass = await prisma.recurringClass.create({
      data: {
        instructorId: instructor.id,
        subscriptionId: subscription.id,
        startAt: new Date("2025-01-20T01:00:00.000Z"),
        endAt: null,
      },
    });

    const response = await request(server)
      .get(`/recurring-classes/by-instructorId?instructorId=${instructor.id}`)
      .expect(200);

    expect(response.body.recurringClasses.map((c: any) => c.id)).toContain(
      recurringClass.id,
    );
  });

  it("return 400 when instructorId is missing", async () => {
    await request(server).get(`/recurring-classes/by-instructorId`).expect(400);
  });

  it("return 400 for invalid instructorId", async () => {
    await request(server)
      .get(`/recurring-classes/by-instructorId?instructorId=invalid`)
      .expect(400);
  });
});

describe("PUT /recurring-classes/:id", () => {
  it("replaces the same slot without a gap or overlap and preserves past attendance", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));

    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");
    const plan = await createPlan();
    const subscription = await createSubscription(plan.id, customer.id, {
      startAt: new Date("2025-01-01T00:00:00.000Z"),
      endAt: new Date("2027-01-01T00:00:00.000Z"),
    });
    const child = await createChild(customer.id);
    const instructor = await createInstructor();
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-01-01T00:00:00.000Z"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(schedule.id, 4, time`10:00`);
    const oldRecurringClass = await prisma.recurringClass.create({
      data: {
        instructorId: instructor.id,
        subscriptionId: subscription.id,
        startAt: new Date("2026-01-01T01:00:00.000Z"),
        recurringClassAttendance: { create: { childrenId: child.id } },
      },
    });
    const pastClass = await createClass(
      customer.id,
      instructor.id,
      new Date("2026-01-01T01:00:00.000Z"),
      {
        recurringClassId: oldRecurringClass.id,
        subscriptionId: subscription.id,
      },
    );
    await prisma.classAttendance.create({
      data: { classId: pastClass.id, childrenId: child.id },
    });
    await createClass(
      customer.id,
      instructor.id,
      new Date("2026-01-08T01:00:00.000Z"),
      {
        recurringClassId: oldRecurringClass.id,
        subscriptionId: subscription.id,
      },
    );

    const response = await request(server)
      .put(`/recurring-classes/${oldRecurringClass.id}`)
      .set("Cookie", authCookie)
      .send({
        instructorId: instructor.id,
        weekday: 4,
        startTime: "10:00",
        customerId: customer.id,
        childrenIds: [child.id],
        startDate: "2026-01-08",
        timezone: "Asia/Tokyo",
      })
      .expect(200);

    expect(response.body.oldRecurringClass.endAt).toBe(
      "2026-01-08T01:00:00.000Z",
    );
    expect(response.body.newRecurringClass.startAt).toBe(
      "2026-01-08T01:00:00.000Z",
    );
    expect(
      await prisma.classAttendance.count({
        where: { classId: pastClass.id, childrenId: child.id },
      }),
    ).toBe(1);
    const boundaryClasses = await prisma.class.findMany({
      where: { dateTime: new Date("2026-01-08T01:00:00.000Z") },
    });
    expect(boundaryClasses).toHaveLength(1);
    expect(boundaryClasses[0].recurringClassId).toBe(
      response.body.newRecurringClass.id,
    );
  });

  it.each([
    ["2026-01-01T14:59:59.999Z", 200],
    ["2026-01-01T15:00:00.000Z", 400],
  ])(
    "enforces the exact seven-day update boundary in JST at %s",
    async (systemTime, expectedStatus) => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(new Date(systemTime));

      const customer = await createCustomer();
      const authCookie = await generateAuthCookie(customer.id, "customer");
      const plan = await createPlan();
      const subscription = await createSubscription(plan.id, customer.id, {
        startAt: new Date("2025-01-01T00:00:00.000Z"),
        endAt: new Date("2027-01-01T00:00:00.000Z"),
      });
      const child = await createChild(customer.id);
      const oldInstructor = await createInstructor();
      const oldRecurringClass = await prisma.recurringClass.create({
        data: {
          instructorId: oldInstructor.id,
          subscriptionId: subscription.id,
          startAt: new Date("2025-12-25T01:00:00.000Z"),
        },
      });
      const newInstructor = await createInstructor();
      const boundedSchedule = await createInstructorSchedule(newInstructor.id, {
        effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
        effectiveTo: new Date("2026-02-01T00:00:00.000Z"),
        timezone: "Asia/Tokyo",
      });
      await createInstructorSlot(boundedSchedule.id, 4, time`00:30`);

      const response = await request(server)
        .put(`/recurring-classes/${oldRecurringClass.id}`)
        .set("Cookie", authCookie)
        .send({
          instructorId: newInstructor.id,
          weekday: 4,
          startTime: "00:30",
          customerId: customer.id,
          childrenIds: [child.id],
          startDate: "2026-01-08",
          timezone: "Asia/Tokyo",
        });

      expect(response.status).toBe(expectedStatus);
      if (expectedStatus === 200) {
        expect(response.body.newRecurringClass.startAt).toBe(
          "2026-01-07T15:30:00.000Z",
        );
      } else {
        expect(response.body.message).toBe(
          "Start date must be at least one week from today",
        );
      }
    },
  );

  it("succeed updating recurring class (customer auth)", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");
    const plan = await createPlan();
    const subscription = await createSubscription(plan.id, customer.id);
    const child = await createChild(customer.id);

    const oldInstructor = await createInstructor();
    const oldRecurringClass = await prisma.recurringClass.create({
      data: {
        instructorId: oldInstructor.id,
        subscriptionId: subscription.id,
        startAt: new Date("2025-01-20T01:00:00.000Z"),
        endAt: null,
      },
    });

    const startDate = new Date(Date.now() + 8 * 24 * 60 * 60 * 1000);
    startDate.setUTCHours(0, 0, 0, 0);
    const startDateStr = startDate.toISOString().slice(0, 10);
    const weekday = startDate.getUTCDay();
    const startTime = "14:00";
    const firstOccurrence = nextWeekdayOccurrenceUTC(
      startDateStr,
      weekday,
      startTime,
    );

    const oldClassToBeDeleted = await prisma.class.create({
      data: {
        instructorId: oldInstructor.id,
        customerId: customer.id,
        recurringClassId: oldRecurringClass.id,
        subscriptionId: subscription.id,
        dateTime: new Date(firstOccurrence.getTime() + 7 * 24 * 60 * 60 * 1000),
        status: "booked",
        rebookableUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
        classCode: "old-1",
      },
    });

    const newInstructor = await createInstructor();
    const newSchedule = await createInstructorSchedule(newInstructor.id, {
      effectiveFrom: new Date(startDateStr + "T00:00:00.000Z"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(newSchedule.id, weekday, time`${startTime}`);

    const response = await request(server)
      .put(`/recurring-classes/${oldRecurringClass.id}`)
      .set("Cookie", authCookie)
      .send({
        instructorId: newInstructor.id,
        weekday,
        startTime,
        customerId: customer.id,
        childrenIds: [child.id],
        startDate: startDateStr,
        timezone: "Asia/Tokyo",
      })
      .expect(200);

    expect(response.body.oldRecurringClass.id).toBe(oldRecurringClass.id);
    expect(response.body.newRecurringClass.instructorId).toBe(newInstructor.id);

    const reloadedOld = await prisma.recurringClass.findUnique({
      where: { id: oldRecurringClass.id },
    });
    expect(reloadedOld?.endAt?.toISOString()).toBe(
      firstOccurrence.toISOString(),
    );

    const stillExists = await prisma.class.findUnique({
      where: { id: oldClassToBeDeleted.id },
    });
    expect(stillExists).toBeNull();
  });

  it("return 400 for invalid id", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");

    await request(server)
      .put(`/recurring-classes/invalid`)
      .set("Cookie", authCookie)
      .send({
        instructorId: 1,
        weekday: 1,
        startTime: "10:00",
        customerId: 1,
        childrenIds: [1],
        startDate: "2025-01-01",
      })
      .expect(400);
  });
});
