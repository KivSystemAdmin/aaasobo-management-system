import { describe, expect, it } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import {
  createAdmin,
  createInstructor,
  createInstructorFee,
  generateAuthCookie,
} from "../../testUtils";
import { prisma } from "../../setup";

describe("GET /admins/instructors/:id/fees", () => {
  it("returns instructor fee history in descending effective order", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();

    const olderFee = await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: new Date("2026-02-01T00:00:00.000Z"),
      regularFee: 1800,
    });
    const latestFee = await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
      effectiveTo: null,
      regularFee: 2000,
    });

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/fees`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body).toEqual({
      instructorId: instructor.id,
      fees: [
        expect.objectContaining({
          id: latestFee.id,
          effectiveFrom: "2026-02-01",
          effectiveTo: null,
          regularFee: 2000,
        }),
        expect.objectContaining({
          id: olderFee.id,
          effectiveFrom: "2026-01-01",
          effectiveTo: "2026-02-01",
          regularFee: 1800,
        }),
      ],
    });
  });
});

describe("POST /admins/instructors/:id/fees", () => {
  it("creates a new latest fee rate and ends the previous rate", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();

    const previousFee = await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
      regularFee: 1900,
    });

    const response = await request(server)
      .post(`/admins/instructors/${instructor.id}/fees`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .send({
        currency: "JPY",
        effectiveFrom: "2026-03-01",
        trialFee: 1200,
        regularFee: 2200,
        cancelFee: 600,
        cancelWithoutNoticeFee: 300,
        monthlyCancelFee: 900,
      })
      .expect(201);

    expect(response.body).toEqual({
      message: "Instructor fee rate created successfully",
      fee: {
        id: expect.any(Number),
        currency: "JPY",
        effectiveFrom: "2026-03-01",
        effectiveTo: null,
        trialFee: 1200,
        regularFee: 2200,
        cancelFee: 600,
        cancelWithoutNoticeFee: 300,
        monthlyCancelFee: 900,
      },
    });

    const updatedPreviousFee = await prisma.instructorFee.findUniqueOrThrow({
      where: { id: previousFee.id },
    });

    expect(updatedPreviousFee.effectiveTo?.toISOString()).toBe(
      "2026-03-01T00:00:00.000Z",
    );
  });

  it("returns 409 when effectiveFrom is not later than the latest fee rate", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();

    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: null,
    });

    const response = await request(server)
      .post(`/admins/instructors/${instructor.id}/fees`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .send({
        currency: "JPY",
        effectiveFrom: "2026-02-28",
        trialFee: 1000,
        regularFee: 1000,
        cancelFee: 500,
        cancelWithoutNoticeFee: 0,
        monthlyCancelFee: 0,
      })
      .expect(409);

    expect(response.body).toEqual({
      code: "INVALID_EFFECTIVE_FROM",
      message: "effectiveFrom must be later than the latest fee rate",
    });
  });
});

describe("DELETE /admins/instructors/:id/fees/latest", () => {
  it("deletes the latest fee rate and reopens the previous one", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();

    const previousFee = await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: new Date("2026-02-01T00:00:00.000Z"),
    });
    const latestFee = await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
      effectiveTo: null,
    });

    const response = await request(server)
      .delete(`/admins/instructors/${instructor.id}/fees/latest`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body).toEqual({
      message: "Latest instructor fee rate deleted successfully",
      deletedFeeId: latestFee.id,
      reactivatedFeeId: previousFee.id,
    });

    const reloadedPreviousFee = await prisma.instructorFee.findUniqueOrThrow({
      where: { id: previousFee.id },
    });
    const deletedFee = await prisma.instructorFee.findUnique({
      where: { id: latestFee.id },
    });

    expect(reloadedPreviousFee.effectiveTo).toBeNull();
    expect(deletedFee).toBeNull();
  });

  it("returns 409 when there is no previous fee rate to reopen", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();

    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
      effectiveTo: null,
    });

    const response = await request(server)
      .delete(`/admins/instructors/${instructor.id}/fees/latest`)
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(409);

    expect(response.body).toEqual({
      code: "LATEST_FEE_DELETE_NOT_ALLOWED",
      message: "At least two fee rates are required to delete the latest rate",
    });
  });
});
