import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import { prisma } from "../../setup";
import {
  createAdmin,
  createClass,
  createCustomer,
  createInstructor,
  createInstructorAbsence,
  generateAuthCookie,
} from "../../testUtils";

describe("GET /instructors/:id/absences", () => {
  it("succeed returning instructor absences", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const instructor = await createInstructor();
    const absenceDate = new Date("2024-06-15");
    await createInstructorAbsence(instructor.id, absenceDate);

    const response = await request(server)
      .get(`/instructors/${instructor.id}/absences`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.data).toHaveLength(1);
  });
});

describe("POST /instructors/:id/absences", () => {
  it("succeed adding instructor absence", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const instructor = await createInstructor();
    const absenceDate = "2024-07-01T00:00:00.000Z";

    const response = await request(server)
      .post(`/instructors/${instructor.id}/absences`)
      .set("Cookie", authCookie)
      .send({ absentAt: absenceDate })
      .expect(201);

    expect(response.body.data.absence).toEqual({
      instructorId: instructor.id,
      absentAt: absenceDate,
    });
    expect(response.body.data.canceledClasses).toEqual([]);

    // Verify absence was created
    const absence = await prisma.instructorAbsence.findUnique({
      where: {
        instructorId_absentAt: {
          instructorId: instructor.id,
          absentAt: new Date(absenceDate),
        },
      },
    });
    expect(absence).toBeTruthy();
  });

  it("sets canceledAt on existing booked classes at the absent slot", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const instructor = await createInstructor();
    const customer = await createCustomer();
    const absentAt = new Date("2024-07-01T00:00:00.000Z");
    const scheduledClass = await createClass(
      customer.id,
      instructor.id,
      absentAt,
    );

    const response = await request(server)
      .post(`/instructors/${instructor.id}/absences`)
      .set("Cookie", authCookie)
      .send({ absentAt: absentAt.toISOString() })
      .expect(201);

    const updatedClass = await prisma.class.findUnique({
      where: { id: scheduledClass.id },
    });
    expect(updatedClass?.status).toBe("canceledByInstructor");
    expect(updatedClass?.canceledAt).toBeTruthy();
    expect(updatedClass?.rebookableUntil?.toISOString()).toBe(
      response.body.data.canceledClasses[0].rebookableUntil,
    );
    expect(response.body.data.canceledClasses).toEqual([
      {
        id: scheduledClass.id,
        classCode: scheduledClass.classCode,
        dateTime: absentAt.toISOString(),
        rebookableUntil: updatedClass?.rebookableUntil?.toISOString(),
        customer: {
          id: customer.id,
          name: customer.name,
        },
      },
    ]);
  });

  it("rejects adding an absence on a completed class slot", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const instructor = await createInstructor();
    const customer = await createCustomer();
    const absentAt = new Date("2024-07-01T00:00:00.000Z");

    await createClass(customer.id, instructor.id, absentAt, {
      status: "completed",
    });

    const response = await request(server)
      .post(`/instructors/${instructor.id}/absences`)
      .set("Cookie", authCookie)
      .send({ absentAt: absentAt.toISOString() })
      .expect(409);

    expect(response.body).toEqual({
      message: "Cannot add absence on a completed class slot.",
    });

    const absence = await prisma.instructorAbsence.findUnique({
      where: {
        instructorId_absentAt: {
          instructorId: instructor.id,
          absentAt,
        },
      },
    });
    expect(absence).toBeNull();
  });

  it("fail for unauthenticated request", async () => {
    const instructor = await createInstructor();

    await request(server)
      .post(`/instructors/${instructor.id}/absences`)
      .send({ absentAt: "2024-07-01T00:00:00.000Z" })
      .expect(401);
  });
});

describe("DELETE /instructors/:id/absences/:absentAt", () => {
  it("succeed removing instructor absence", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const instructor = await createInstructor();
    const absenceDate = new Date("2024-07-01T00:00:00.000Z");
    await createInstructorAbsence(instructor.id, absenceDate);

    await request(server)
      .delete(`/instructors/${instructor.id}/absences/2024-07-01T00:00:00.000Z`)
      .set("Cookie", authCookie)
      .expect(200);

    // Verify absence was deleted
    const absence = await prisma.instructorAbsence.findUnique({
      where: {
        instructorId_absentAt: {
          instructorId: instructor.id,
          absentAt: absenceDate,
        },
      },
    });
    expect(absence).toBeNull();
  });

  it("fail for unauthenticated request", async () => {
    const instructor = await createInstructor();

    await request(server)
      .delete(`/instructors/${instructor.id}/absences/2024-07-01T00:00:00.000Z`)
      .expect(401);
  });
});
