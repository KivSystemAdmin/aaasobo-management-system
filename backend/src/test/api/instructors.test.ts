import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../server";
import {
  createInstructor,
  createAdmin,
  createCustomer,
  createClass,
  createEvent,
  createInstructorAbsence,
  createInstructorSchedule,
  createInstructorSlot,
  createInstructorFee,
  createSchedule,
  generateAuthCookie,
} from "../testUtils";

describe("GET /instructors/all-profiles", () => {
  it("succeed returning detailed instructor profiles", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");
    const instructor = await createInstructor();
    await createInstructor();
    await createInstructorFee(instructor.id);

    const response = await request(server)
      .get("/instructors/all-profiles")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.instructorProfiles).toHaveLength(2);
    for (const profile of response.body.instructorProfiles) {
      expect(profile).not.toHaveProperty("fees");
      expect(profile).not.toHaveProperty("instructorFees");
    }
  });

  it("fail for unauthenticated request", async () => {
    await request(server).get("/instructors/all-profiles").expect(401);
  });
});

describe("GET /instructors/class/:id", () => {
  it("succeed returning instructor ID for valid class", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const classInstance = await createClass(
      customer.id,
      instructor.id,
      new Date(),
    );

    const response = await request(server)
      .get(`/instructors/class/${classInstance.id}`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.instructorId).toBe(instructor.id);
  });
});

describe("GET /instructors/profiles", () => {
  it("succeed returning public instructor profiles", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");
    const instructor = await createInstructor();
    await createInstructor();
    await createInstructorFee(instructor.id);

    const response = await request(server)
      .get("/instructors/profiles")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body).toHaveLength(2);
    for (const profile of response.body) {
      expect(profile).not.toHaveProperty("fees");
      expect(profile).not.toHaveProperty("instructorFees");
    }
  });
});

describe("GET /instructors/:id", () => {
  it("succeed with valid instructor ID", async () => {
    const instructor = await createInstructor();
    const authCookie = await generateAuthCookie(instructor.id, "instructor");

    const response = await request(server)
      .get(`/instructors/${instructor.id}`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.instructor.id).toBe(instructor.id);
    expect(response.body.instructor.name).toBe(instructor.name);
    expect(response.body.instructor.email).toBe(instructor.email);
  });
});

describe("GET /instructors/:id/calendar-classes", () => {
  it("succeed with valid instructor ID", async () => {
    const instructor = await createInstructor();
    const authCookie = await generateAuthCookie(instructor.id, "instructor");

    const response = await request(server)
      .get(`/instructors/${instructor.id}/calendar-classes`)
      .set("Cookie", authCookie)
      .expect(200);

    // Instructor has no classes, should return empty array
    expect(response.body).toEqual([]);
  });
});

describe("GET /instructors/:id/calendar-slots", () => {
  it("returns open slots, classes, and absences for the requested range", async () => {
    const instructor = await createInstructor();
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(instructor.id, "instructor");
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-07"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });

    await createInstructorSlot(
      schedule.id,
      1,
      new Date("1970-01-01T09:00:00.000Z"),
    );
    await createInstructorSlot(
      schedule.id,
      1,
      new Date("1970-01-01T10:00:00.000Z"),
    );
    await createInstructorSlot(
      schedule.id,
      1,
      new Date("1970-01-01T11:00:00.000Z"),
    );
    await createInstructorSlot(
      schedule.id,
      1,
      new Date("1970-01-01T12:00:00.000Z"),
    );

    const bookedClass = await createClass(
      customer.id,
      instructor.id,
      new Date("2025-07-07T01:00:00.000Z"),
      { status: "booked" },
    );

    await createClass(
      customer.id,
      instructor.id,
      new Date("2025-07-07T02:00:00.000Z"),
      { status: "completed" },
    );

    await createInstructorAbsence(
      instructor.id,
      new Date("2025-07-07T00:00:00.000Z"),
    );

    const response = await request(server)
      .get(`/instructors/${instructor.id}/calendar-slots`)
      .set("Cookie", authCookie)
      .query({
        start: "2025-07-07",
        end: "2025-07-08",
        timezone: "Asia/Tokyo",
      })
      .expect(200);

    expect(response.body.data).toEqual([
      expect.objectContaining({
        start: "2025-07-07T00:00:00.000Z",
        slotType: "absence",
        title: "Absent",
      }),
      expect.objectContaining({
        start: bookedClass.dateTime?.toISOString(),
        slotType: "booked",
        classId: bookedClass.id,
      }),
      expect.objectContaining({
        start: "2025-07-07T02:00:00.000Z",
        slotType: "completed",
      }),
      expect.objectContaining({
        start: "2025-07-07T03:00:00.000Z",
        slotType: "open",
        title: "Open",
      }),
    ]);
  });

  it("returns day-level business events and suppresses open slots on no-class days", async () => {
    const instructor = await createInstructor();
    const authCookie = await generateAuthCookie(instructor.id, "instructor");
    const schedule = await createInstructorSchedule(instructor.id, {
      effectiveFrom: new Date("2025-07-07"),
      effectiveTo: null,
      timezone: "Asia/Tokyo",
    });
    await createInstructorSlot(
      schedule.id,
      1,
      new Date("1970-01-01T09:00:00.000Z"),
    );
    await createInstructorSlot(
      schedule.id,
      1,
      new Date("1970-01-01T10:00:00.000Z"),
    );
    const noClassEvent = await createEvent({
      name: "お休み / No Class",
      color: "#FAD7CD",
    });
    await createSchedule(noClassEvent.id, new Date("2025-07-07T00:00:00.000Z"));

    const response = await request(server)
      .get(`/instructors/${instructor.id}/calendar-slots`)
      .set("Cookie", authCookie)
      .query({
        start: "2025-07-07",
        end: "2025-07-08",
        timezone: "Asia/Tokyo",
      })
      .expect(200);

    expect(response.body.data).toEqual([
      expect.objectContaining({
        start: "2025-07-07",
        end: "2025-07-08",
        slotType: "businessEvent",
        title: "お休み / No Class",
        allDay: true,
      }),
    ]);
  });
});

describe("GET /instructors/:id/classes/:classId/same-date", () => {
  it("succeed returning same-date classes", async () => {
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const authCookie = await generateAuthCookie(instructor.id, "instructor");
    const dateTime = new Date("2024-06-15T10:00:00Z");
    const classInstance = await createClass(
      customer.id,
      instructor.id,
      dateTime,
    );

    const response = await request(server)
      .get(
        `/instructors/${instructor.id}/classes/${classInstance.id}/same-date`,
      )
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.selectedClassDetails.id).toBe(classInstance.id);
  });
});

describe("GET /instructors/:id/profile", () => {
  it("succeed with valid instructor ID", async () => {
    const instructor = await createInstructor();
    const authCookie = await generateAuthCookie(instructor.id, "instructor");

    const response = await request(server)
      .get(`/instructors/${instructor.id}/profile`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.id).toBe(instructor.id);
    expect(response.body.name).toBe(instructor.name);
  });
});
