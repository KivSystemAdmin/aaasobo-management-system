import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../server";
import { prisma } from "../setup";
import {
  createAdmin,
  createChild,
  createClass,
  createClassAttendance,
  createCustomer,
  createInstructor,
  createInstructorAbsence,
  createInstructorSchedule,
  createInstructorSlot,
  createPlan,
  createSubscription,
  generateAuthCookie,
} from "../testUtils";

const daysFromNow = (days: number) =>
  new Date(Date.now() + days * 24 * 60 * 60 * 1000);

const utcDateAtMidnight = (date: Date) =>
  new Date(`${date.toISOString().slice(0, 10)}T00:00:00.000Z`);

const ensureInstructorSlotAt = async (instructorId: number, dateTime: Date) => {
  const schedule = await createInstructorSchedule(instructorId, {
    effectiveFrom: utcDateAtMidnight(dateTime),
    effectiveTo: null,
    timezone: "Asia/Tokyo",
  });
  const jstDateTime = new Date(dateTime.getTime() + 9 * 60 * 60 * 1000);
  const jstHour = String(jstDateTime.getUTCHours()).padStart(2, "0");
  const jstMinute = String(jstDateTime.getUTCMinutes()).padStart(2, "0");
  await createInstructorSlot(
    schedule.id,
    dateTime.getUTCDay(),
    new Date(`1970-01-01T${jstHour}:${jstMinute}:00.000Z`),
  );
};

describe("GET /classes", () => {
  it("succeed returning classes summary for authenticated user", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const scheduledAt = new Date("2024-05-01T10:00:00.000Z");
    const bookedClass = await createClass(
      customer.id,
      instructor.id,
      scheduledAt,
    );

    const response = await request(server)
      .get("/classes")
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body.classes).toEqual([
      expect.objectContaining({
        id: bookedClass.id,
        dateTime: scheduledAt.toISOString(),
        status: "booked",
        customer: expect.objectContaining({
          id: customer.id,
          name: customer.name,
          email: customer.email,
        }),
        instructor: expect.objectContaining({
          id: instructor.id,
          name: instructor.name,
        }),
      }),
    ]);
  });

  it("fail without authentication", async () => {
    const response = await request(server).get("/classes").expect(401);

    expect(response.body.message).toBe("No session token found");
  });
});

describe("GET /classes/:id", () => {
  it("succeed returning classes with attendance for customer", async () => {
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const sessionAt = new Date("2024-06-15T12:00:00.000Z");
    const existingClass = await createClass(
      customer.id,
      instructor.id,
      sessionAt,
    );
    const attendingChild = await createChild(customer.id);
    await createClassAttendance(existingClass.id, attendingChild.id);

    const response = await request(server)
      .get(`/classes/${customer.id}`)
      .set("Cookie", await generateAuthCookie(customer.id, "customer"))
      .expect(200);

    const [classForCustomer] = response.body.classes;

    expect(classForCustomer).toMatchObject({
      id: existingClass.id,
      dateTime: sessionAt.toISOString(),
      customer: expect.objectContaining({
        id: customer.id,
        name: customer.name,
      }),
      instructor: expect.objectContaining({
        id: instructor.id,
        name: instructor.name,
      }),
      classAttendance: {
        children: [
          expect.objectContaining({
            id: attendingChild.id,
            name: attendingChild.name,
          }),
        ],
      },
    });
  });

  it("fail without authentication", async () => {
    const response = await request(server).get("/classes/1").expect(401);

    expect(response.body.message).toBe("No session token found");
  });
});

describe("DELETE /classes/:id", () => {
  it("succeed removing a class", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const classToDelete = await createClass(
      customer.id,
      instructor.id,
      new Date("2024-07-01T09:00:00.000Z"),
    );
    const child = await createChild(customer.id);
    await createClassAttendance(classToDelete.id, child.id);

    const response = await request(server)
      .delete(`/classes/${classToDelete.id}`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body.id).toBe(classToDelete.id);
    expect(
      await prisma.class.findUnique({ where: { id: classToDelete.id } }),
    ).toBeNull();
    expect(
      await prisma.classAttendance.findMany({
        where: { classId: classToDelete.id },
      }),
    ).toHaveLength(0);
  });

  it("fail without authentication", async () => {
    await request(server).delete("/classes/1").expect(401);
  });
});

describe("POST /classes/:id/rebook", () => {
  it("succeed rebooking a free trial class", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const originalClass = await createClass(
      customer.id,
      instructor.id,
      daysFromNow(2),
    );
    const child = await createChild(customer.id);

    const rebookableUntil = daysFromNow(30);
    await prisma.class.update({
      where: { id: originalClass.id },
      data: {
        isFreeTrial: true,
        rebookableUntil,
      },
    });

    const newClassDate = utcDateAtMidnight(daysFromNow(7));
    await ensureInstructorSlotAt(instructor.id, newClassDate);
    await request(server)
      .post(`/classes/${originalClass.id}/rebook`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .send({
        dateTime: newClassDate.toISOString(),
        instructorId: instructor.id,
        customerId: customer.id,
        childrenIds: [child.id],
      })
      .expect(201);

    const rebookedClass = await prisma.class.findFirst({
      where: { status: "rebooked", customerId: customer.id },
      orderBy: { id: "desc" },
    });
    expect(rebookedClass).toBeTruthy();
    expect(rebookedClass?.dateTime?.toISOString()).toBe(
      newClassDate.toISOString(),
    );
    expect(
      await prisma.classAttendance.findMany({
        where: { classId: rebookedClass!.id },
      }),
    ).toEqual([expect.objectContaining({ childrenId: child.id })]);
  });

  it("failed when slot is already booked by instructor", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const otherCustomer = await createCustomer();
    const instructor = await createInstructor();
    const child = await createChild(customer.id);

    const targetDate = utcDateAtMidnight(daysFromNow(10));
    await ensureInstructorSlotAt(instructor.id, targetDate);
    await createClass(otherCustomer.id, instructor.id, targetDate);

    const classToRebook = await createClass(customer.id);
    await prisma.class.update({
      where: { id: classToRebook.id },
      data: {
        isFreeTrial: true,
        rebookableUntil: daysFromNow(30),
      },
    });

    const response = await request(server)
      .post(`/classes/${classToRebook.id}/rebook`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .send({
        dateTime: targetDate.toISOString(),
        instructorId: instructor.id,
        customerId: customer.id,
        childrenIds: [child.id],
      })
      .expect(400);

    expect(response.body.errorType).toBe("instructor conflict");
  });

  it("failed when instructor is absent", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const child = await createChild(customer.id);

    const targetDate = utcDateAtMidnight(daysFromNow(10));
    await ensureInstructorSlotAt(instructor.id, targetDate);
    await createInstructorAbsence(instructor.id, targetDate);

    const classToRebook = await createClass(customer.id);
    await prisma.class.update({
      where: { id: classToRebook.id },
      data: {
        isFreeTrial: true,
        rebookableUntil: daysFromNow(30),
      },
    });

    const response = await request(server)
      .post(`/classes/${classToRebook.id}/rebook`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .send({
        dateTime: targetDate.toISOString(),
        instructorId: instructor.id,
        customerId: customer.id,
        childrenIds: [child.id],
      })
      .expect(400);

    expect(response.body.errorType).toBe("instructor unavailable");
  });

  it("fail without authentication", async () => {
    await request(server)
      .post("/classes/1/rebook")
      .send({
        dateTime: daysFromNow(1).toISOString(),
        instructorId: 1,
        customerId: 1,
        childrenIds: [1],
      })
      .expect(401);
  });
});

describe("POST /classes/:id/attendance", () => {
  it("succeed replacing attendance list", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const classRecord = await createClass(
      customer.id,
      instructor.id,
      new Date("2024-07-10T09:00:00.000Z"),
    );
    const firstChild = await createChild(customer.id);
    const secondChild = await createChild(customer.id);
    await createClassAttendance(classRecord.id, firstChild.id);

    await request(server)
      .post(`/classes/${classRecord.id}/attendance`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .send({
        childrenIds: [secondChild.id],
      })
      .expect(200);

    const attendance = await prisma.classAttendance.findMany({
      where: { classId: classRecord.id },
    });
    expect(attendance.map((entry) => entry.childrenId)).toEqual([
      secondChild.id,
    ]);
  });

  it("succeed clearing attendance with empty list", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const classRecord = await createClass(
      customer.id,
      instructor.id,
      new Date("2024-07-12T09:00:00.000Z"),
    );
    const child = await createChild(customer.id);
    await createClassAttendance(classRecord.id, child.id);

    await request(server)
      .post(`/classes/${classRecord.id}/attendance`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .send({ childrenIds: [] })
      .expect(200);

    const remaining = await prisma.classAttendance.findMany({
      where: { classId: classRecord.id },
    });
    expect(remaining).toEqual([]);
  });

  it("fail without authentication", async () => {
    await request(server)
      .post("/classes/1/attendance")
      .send({ childrenIds: [] })
      .expect(401);
  });
});

describe("PATCH /classes/:id/cancel", () => {
  it("succeed canceling class and clearing attendance", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const sessionAt = new Date("2024-07-20T09:00:00.000Z");
    const classToCancel = await createClass(
      customer.id,
      instructor.id,
      sessionAt,
    );
    const child = await createChild(customer.id);
    await createClassAttendance(classToCancel.id, child.id);

    await request(server)
      .patch(`/classes/${classToCancel.id}/cancel`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    const updatedClass = await prisma.class.findUnique({
      where: { id: classToCancel.id },
    });
    expect(updatedClass?.status).toBe("canceledByCustomer");
    expect(
      await prisma.classAttendance.count({
        where: { classId: classToCancel.id },
      }),
    ).toBe(0);
  });

  it("fail without authentication", async () => {
    await request(server).patch("/classes/1/cancel").expect(401);
  });
});

describe("PATCH /classes/:id/status", () => {
  it("succeed updating class status", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const classRecord = await createClass(
      customer.id,
      instructor.id,
      daysFromNow(3),
    );

    await request(server)
      .patch(`/classes/${classRecord.id}/status`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .send({ status: "completed" })
      .expect(200);

    const updatedClass = await prisma.class.findUnique({
      where: { id: classRecord.id },
    });
    expect(updatedClass?.status).toBe("completed");
  });

  it("fail without authentication", async () => {
    await request(server)
      .patch("/classes/1/status")
      .send({ status: "booked" })
      .expect(401);
  });
});

describe("POST /classes/create-classes", () => {
  it("succeed generating classes for month", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const child = await createChild(customer.id);
    const plan = await createPlan();
    const subscription = await createSubscription(plan.id, customer.id, {
      startAt: new Date("2023-01-01T00:00:00.000Z"),
      endAt: new Date("2025-12-31T00:00:00.000Z"),
    });
    const recurringClass = await prisma.recurringClass.create({
      data: {
        instructorId: instructor.id,
        subscriptionId: subscription.id,
        startAt: new Date("2023-01-01T00:00:00.000Z"),
        recurringClassAttendance: {
          create: {
            childrenId: child.id,
          },
        },
      },
    });

    const response = await request(server)
      .post("/classes/create-classes")
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .send({
        year: 2024,
        month: "January",
      })
      .expect(201);

    expect(Array.isArray(response.body.result)).toBe(true);
    const created = await prisma.class.findMany({
      where: { recurringClassId: recurringClass.id },
    });
    expect(created.length).toBeGreaterThan(0);
  });

  it("fail without authentication", async () => {
    await request(server)
      .post("/classes/create-classes")
      .send({ year: 2024, month: "January" })
      .expect(401);
  });
});

describe("POST /classes/check-double-booking", () => {
  it("succeed returning true when class already booked at given time", async () => {
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const bookingAt = new Date("2024-08-10T14:30:00.000Z");
    await createClass(customer.id, instructor.id, bookingAt);

    const response = await request(server)
      .post("/classes/check-double-booking")
      .set("Cookie", await generateAuthCookie(customer.id, "customer"))
      .send({
        customerId: customer.id,
        dateTime: bookingAt.toISOString(),
      })
      .expect(200);

    expect(response.body).toBe(true);
  });

  it("succeed returning false when no conflicting classes exist", async () => {
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const existingBookingAt = new Date("2024-08-11T14:30:00.000Z");
    await createClass(customer.id, instructor.id, existingBookingAt);

    const response = await request(server)
      .post("/classes/check-double-booking")
      .set("Cookie", await generateAuthCookie(customer.id, "customer"))
      .send({
        customerId: customer.id,
        dateTime: new Date("2024-08-12T14:30:00.000Z").toISOString(),
      })
      .expect(200);

    expect(response.body).toBe(false);
  });
});

describe("POST /classes/check-child-conflicts", () => {
  it("succeed returning conflicting child names", async () => {
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const sessionAt = new Date("2024-09-05T10:00:00.000Z");
    const overlappingClass = await createClass(
      customer.id,
      instructor.id,
      sessionAt,
    );
    const conflictingChild = await createChild(customer.id);
    const otherChild = await createChild(customer.id);
    await createClassAttendance(overlappingClass.id, conflictingChild.id);

    const response = await request(server)
      .post("/classes/check-child-conflicts")
      .set("Cookie", await generateAuthCookie(customer.id, "customer"))
      .send({
        dateTime: sessionAt.toISOString(),
        selectedChildrenIds: [conflictingChild.id, otherChild.id],
      })
      .expect(200);

    expect(response.body).toEqual([conflictingChild.name]);
  });

  it("succeed returning empty array when no conflicts found", async () => {
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const scheduledAt = new Date("2024-09-10T10:00:00.000Z");
    await createClass(customer.id, instructor.id, scheduledAt);
    const child = await createChild(customer.id);

    const response = await request(server)
      .post("/classes/check-child-conflicts")
      .set("Cookie", await generateAuthCookie(customer.id, "customer"))
      .send({
        dateTime: new Date("2024-09-11T10:00:00.000Z").toISOString(),
        selectedChildrenIds: [child.id],
      })
      .expect(200);

    expect(response.body).toEqual([]);
  });
});

describe("POST /classes/cancel-classes", () => {
  it("succeed canceling multiple classes", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const firstClass = await createClass(
      customer.id,
      instructor.id,
      new Date("2024-10-01T09:00:00.000Z"),
    );
    const secondClass = await createClass(
      customer.id,
      instructor.id,
      new Date("2024-10-08T09:00:00.000Z"),
    );
    const child = await createChild(customer.id);
    await createClassAttendance(firstClass.id, child.id);
    await createClassAttendance(secondClass.id, child.id);

    await request(server)
      .post("/classes/cancel-classes")
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .send({
        classIds: [firstClass.id, secondClass.id],
      })
      .expect(200);

    const updatedStatuses = await prisma.class.findMany({
      where: { id: { in: [firstClass.id, secondClass.id] } },
      select: { status: true },
    });
    expect(updatedStatuses.map((entry) => entry.status)).toEqual([
      "canceledByCustomer",
      "canceledByCustomer",
    ]);
    expect(
      await prisma.classAttendance.count({
        where: { classId: { in: [firstClass.id, secondClass.id] } },
      }),
    ).toBe(0);
  });

  it("fail without authentication", async () => {
    await request(server)
      .post("/classes/cancel-classes")
      .send({ classIds: [1] })
      .expect(401);
  });
});
