import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import {
  createAdmin,
  createClass,
  createCustomer,
  createInstructor,
  createInstructorFee,
  generateAuthCookie,
} from "../../testUtils";

const jstDateTime = (value: string) => new Date(value);

describe("GET /admins/instructors/:id/payroll", () => {
  it("returns both payroll periods for the requested month", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: new Date("2026-03-16T00:00:00.000Z"),
      trialFee: 1000,
      regularFee: 2000,
      cancelFee: 500,
      cancelWithoutNoticeFee: 250,
    });
    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-16T00:00:00.000Z"),
      effectiveTo: null,
      trialFee: 1500,
      regularFee: 2500,
      cancelFee: 600,
      cancelWithoutNoticeFee: 300,
    });

    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-02T10:00:00+09:00"),
      {
        status: "completed",
        isFreeTrial: true,
        updatedAt: jstDateTime("2026-03-05T10:00:00.000Z"),
      },
    );
    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-10T12:00:00+09:00"),
      {
        status: "completed",
        isFreeTrial: false,
        updatedAt: jstDateTime("2026-03-12T10:00:00.000Z"),
      },
    );
    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-14T09:00:00+09:00"),
      {
        status: "canceledByInstructor",
        canceledAt: jstDateTime("2026-03-13T23:00:00+09:00"),
        updatedAt: jstDateTime("2026-03-15T09:12:00.000Z"),
      },
    );
    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-15T09:00:00+09:00"),
      {
        status: "canceledByCustomer",
        canceledAt: jstDateTime("2026-03-14T20:00:00+09:00"),
      },
    );
    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-16T09:00:00+09:00"),
      {
        status: "completed",
        isFreeTrial: false,
        updatedAt: jstDateTime("2026-03-20T03:00:00.000Z"),
      },
    );
    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-20T08:00:00+09:00"),
      {
        status: "canceledByInstructor",
        canceledAt: jstDateTime("2026-03-20T00:30:00+09:00"),
        updatedAt: jstDateTime("2026-03-28T03:00:00.000Z"),
      },
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body).toEqual({
      instructorId: instructor.id,
      month: "2026-03",
      timezone: "Asia/Tokyo",
      periods: [
        {
          from: "2026-03-01",
          to: "2026-03-15",
          sourceLastUpdatedAt: "2026-03-15T09:12:00.000Z",
          currency: "JPY",
          counts: {
            trial: 1,
            regular: 1,
            cancel: 1,
            cancelWithoutNotice: 0,
          },
          subtotals: {
            trial: 1000,
            regular: 2000,
            cancel: 500,
            cancelWithoutNotice: 0,
          },
          total: 2500,
          dailyBreakdown: [
            {
              date: "2026-03-02",
              counts: {
                trial: 1,
                regular: 0,
                cancel: 0,
                cancelWithoutNotice: 0,
              },
              total: 1000,
            },
            {
              date: "2026-03-10",
              counts: {
                trial: 0,
                regular: 1,
                cancel: 0,
                cancelWithoutNotice: 0,
              },
              total: 2000,
            },
            {
              date: "2026-03-14",
              counts: {
                trial: 0,
                regular: 0,
                cancel: 1,
                cancelWithoutNotice: 0,
              },
              total: -500,
            },
          ],
          appliedFeePeriods: [
            {
              currency: "JPY",
              effectiveFrom: "2026-03-01",
              effectiveTo: "2026-03-16",
              trialFee: 1000,
              regularFee: 2000,
              cancelFee: 500,
              cancelWithoutNoticeFee: 250,
            },
          ],
        },
        {
          from: "2026-03-16",
          to: "2026-03-31",
          sourceLastUpdatedAt: "2026-03-28T03:00:00.000Z",
          currency: "JPY",
          counts: {
            trial: 0,
            regular: 1,
            cancel: 0,
            cancelWithoutNotice: 1,
          },
          subtotals: {
            trial: 0,
            regular: 2500,
            cancel: 0,
            cancelWithoutNotice: 300,
          },
          total: 2200,
          dailyBreakdown: [
            {
              date: "2026-03-16",
              counts: {
                trial: 0,
                regular: 1,
                cancel: 0,
                cancelWithoutNotice: 0,
              },
              total: 2500,
            },
            {
              date: "2026-03-20",
              counts: {
                trial: 0,
                regular: 0,
                cancel: 0,
                cancelWithoutNotice: 1,
              },
              total: -300,
            },
          ],
          appliedFeePeriods: [
            {
              currency: "JPY",
              effectiveFrom: "2026-03-16",
              effectiveTo: null,
              trialFee: 1500,
              regularFee: 2500,
              cancelFee: 600,
              cancelWithoutNoticeFee: 300,
            },
          ],
        },
      ],
    });
  });

  it("returns 400 when month format is invalid", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-13" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(400);

    expect(response.body.message).toBe("Invalid query parameters");
  });

  it("applies multiple fee periods within 1-15 when the rate changes mid-period", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: new Date("2026-03-08T00:00:00.000Z"),
      trialFee: 1000,
      regularFee: 2000,
      cancelFee: 500,
      cancelWithoutNoticeFee: 250,
    });
    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-08T00:00:00.000Z"),
      effectiveTo: new Date("2026-03-16T00:00:00.000Z"),
      trialFee: 1200,
      regularFee: 2200,
      cancelFee: 600,
      cancelWithoutNoticeFee: 300,
    });
    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-16T00:00:00.000Z"),
      effectiveTo: null,
      trialFee: 1500,
      regularFee: 2500,
      cancelFee: 700,
      cancelWithoutNoticeFee: 350,
    });

    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-05T10:00:00+09:00"),
      {
        status: "completed",
        isFreeTrial: false,
        updatedAt: jstDateTime("2026-03-05T03:00:00.000Z"),
      },
    );
    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-12T10:00:00+09:00"),
      {
        status: "completed",
        isFreeTrial: false,
        updatedAt: jstDateTime("2026-03-12T03:00:00.000Z"),
      },
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body.periods[0]).toEqual({
      from: "2026-03-01",
      to: "2026-03-15",
      sourceLastUpdatedAt: "2026-03-12T03:00:00.000Z",
      currency: "JPY",
      counts: {
        trial: 0,
        regular: 2,
        cancel: 0,
        cancelWithoutNotice: 0,
      },
      subtotals: {
        trial: 0,
        regular: 4200,
        cancel: 0,
        cancelWithoutNotice: 0,
      },
      total: 4200,
      dailyBreakdown: [
        {
          date: "2026-03-05",
          counts: {
            trial: 0,
            regular: 1,
            cancel: 0,
            cancelWithoutNotice: 0,
          },
          total: 2000,
        },
        {
          date: "2026-03-12",
          counts: {
            trial: 0,
            regular: 1,
            cancel: 0,
            cancelWithoutNotice: 0,
          },
          total: 2200,
        },
      ],
      appliedFeePeriods: [
        {
          currency: "JPY",
          effectiveFrom: "2026-03-01",
          effectiveTo: "2026-03-08",
          trialFee: 1000,
          regularFee: 2000,
          cancelFee: 500,
          cancelWithoutNoticeFee: 250,
        },
        {
          currency: "JPY",
          effectiveFrom: "2026-03-08",
          effectiveTo: "2026-03-16",
          trialFee: 1200,
          regularFee: 2200,
          cancelFee: 600,
          cancelWithoutNoticeFee: 300,
        },
      ],
    });
    expect(response.body.periods[1].dailyBreakdown).toEqual([]);
    expect(response.body.periods[1].appliedFeePeriods).toEqual([]);
  });

  it("uses the new fee rate on the effectiveTo boundary date", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: new Date("2026-03-16T00:00:00.000Z"),
      regularFee: 2000,
    });
    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-16T00:00:00.000Z"),
      effectiveTo: null,
      regularFee: 2500,
    });

    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-16T10:00:00+09:00"),
      {
        status: "completed",
        isFreeTrial: false,
      },
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body.periods[1]).toEqual(
      expect.objectContaining({
        currency: "JPY",
        subtotals: expect.objectContaining({
          regular: 2500,
        }),
        total: 2500,
        appliedFeePeriods: [
          expect.objectContaining({
            effectiveFrom: "2026-03-16",
            effectiveTo: null,
            regularFee: 2500,
          }),
        ],
      }),
    );
  });

  it("returns 404 when instructor does not exist", async () => {
    const admin = await createAdmin();

    const response = await request(server)
      .get("/admins/instructors/999999/payroll")
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(404);

    expect(response.body).toEqual({ message: "Instructor not found" });
  });

  it("returns 422 when a payable class has no matching fee", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-05T10:00:00+09:00"),
      {
        status: "completed",
        isFreeTrial: false,
      },
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(422);

    expect(response.body.code).toBe("MISSING_FEE_RATE");
  });

  it("returns 422 when a payroll period mixes currencies", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createInstructorFee(instructor.id, {
      currency: "JPY",
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: new Date("2026-03-11T00:00:00.000Z"),
    });
    await createInstructorFee(instructor.id, {
      currency: "USD",
      effectiveFrom: new Date("2026-03-11T00:00:00.000Z"),
      effectiveTo: null,
    });

    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-05T10:00:00+09:00"),
      { status: "completed" },
    );
    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-12T10:00:00+09:00"),
      { status: "completed" },
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(422);

    expect(response.body.code).toBe("MULTIPLE_CURRENCIES");
  });
});
