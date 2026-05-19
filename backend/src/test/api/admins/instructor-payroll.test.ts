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

const createInstructorCanceledClasses = async (
  customerId: number,
  instructorId: number,
  dates: string[],
) => {
  await Promise.all(
    dates.map((date, index) =>
      createClass(customerId, instructorId, jstDateTime(date), {
        status: "canceledByInstructor",
        canceledAt: jstDateTime(date).getTime()
          ? new Date(jstDateTime(date).getTime() - 24 * 60 * 60 * 1000)
          : undefined,
        updatedAt: jstDateTime(
          `2026-03-28T00:${String(index).padStart(2, "0")}:00.000Z`,
        ),
      }),
    ),
  );
};

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
              monthlyCancelFee: 0,
            },
          ],
          monthlyCancelFee: {
            cancelCount: 2,
            threshold: 10,
            unitFee: 0,
            timesApplied: 0,
            total: 0,
          },
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
              monthlyCancelFee: 0,
            },
          ],
          monthlyCancelFee: {
            cancelCount: 2,
            threshold: 10,
            unitFee: 0,
            timesApplied: 0,
            total: 0,
          },
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
          monthlyCancelFee: 0,
        },
        {
          currency: "JPY",
          effectiveFrom: "2026-03-08",
          effectiveTo: "2026-03-16",
          trialFee: 1200,
          regularFee: 2200,
          cancelFee: 600,
          cancelWithoutNoticeFee: 300,
          monthlyCancelFee: 0,
        },
      ],
      monthlyCancelFee: {
        cancelCount: 0,
        threshold: 10,
        unitFee: 0,
        timesApplied: 0,
        total: 0,
      },
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

  it("does not apply a monthly cancel fee for 9 instructor cancellations", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: null,
      cancelFee: 0,
      monthlyCancelFee: 700,
    });
    await createInstructorCanceledClasses(customer.id, instructor.id, [
      "2026-03-01T10:00:00+09:00",
      "2026-03-02T10:00:00+09:00",
      "2026-03-03T10:00:00+09:00",
      "2026-03-04T10:00:00+09:00",
      "2026-03-05T10:00:00+09:00",
      "2026-03-16T10:00:00+09:00",
      "2026-03-17T10:00:00+09:00",
      "2026-03-18T10:00:00+09:00",
      "2026-03-19T10:00:00+09:00",
    ]);
    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-20T10:00:00+09:00"),
      {
        status: "canceledByAdmin",
        canceledAt: jstDateTime("2026-03-10T10:00:00+09:00"),
      },
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body.periods[0].monthlyCancelFee).toEqual({
      cancelCount: 9,
      threshold: 10,
      unitFee: 0,
      timesApplied: 0,
      total: 0,
    });
    expect(response.body.periods[1].monthlyCancelFee).toEqual({
      cancelCount: 9,
      threshold: 10,
      unitFee: 0,
      timesApplied: 0,
      total: 0,
    });
    expect(response.body.periods[1].total).toBe(0);
    expect(response.body.periods[1].dailyBreakdown).toHaveLength(4);
  });

  it("counts cancellations across both halves and deducts one monthly cancel fee only from 16-last", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: null,
      cancelFee: 0,
      monthlyCancelFee: 700,
    });
    await createInstructorCanceledClasses(customer.id, instructor.id, [
      "2026-03-01T10:00:00+09:00",
      "2026-03-02T10:00:00+09:00",
      "2026-03-03T10:00:00+09:00",
      "2026-03-04T10:00:00+09:00",
      "2026-03-05T10:00:00+09:00",
      "2026-03-16T10:00:00+09:00",
      "2026-03-17T10:00:00+09:00",
      "2026-03-18T10:00:00+09:00",
      "2026-03-19T10:00:00+09:00",
      "2026-03-20T10:00:00+09:00",
    ]);
    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-21T10:00:00+09:00"),
      {
        status: "canceledByCustomer",
        canceledAt: jstDateTime("2026-03-20T10:00:00+09:00"),
      },
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body.periods[0].monthlyCancelFee.total).toBe(0);
    expect(response.body.periods[0].total).toBe(0);
    expect(response.body.periods[1].monthlyCancelFee).toEqual({
      cancelCount: 10,
      threshold: 10,
      unitFee: 700,
      timesApplied: 1,
      total: 700,
    });
    expect(response.body.periods[1].total).toBe(-700);
    expect(response.body.periods[1].dailyBreakdown).toHaveLength(5);
  });

  it("deducts two monthly cancel fees for 20 instructor cancellations", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: null,
      cancelFee: 0,
      monthlyCancelFee: 700,
    });
    await createInstructorCanceledClasses(
      customer.id,
      instructor.id,
      Array.from(
        { length: 20 },
        (_, index) =>
          `2026-03-${String(index < 15 ? index + 1 : 16).padStart(2, "0")}T10:${String(index).padStart(2, "0")}:00+09:00`,
      ),
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body.periods[1].monthlyCancelFee).toEqual({
      cancelCount: 20,
      threshold: 10,
      unitFee: 700,
      timesApplied: 2,
      total: 1400,
    });
    expect(response.body.periods[1].total).toBe(-1400);
  });

  it("uses the month-end fee rate for the monthly cancel fee", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: new Date("2026-03-16T00:00:00.000Z"),
      cancelFee: 0,
      monthlyCancelFee: 500,
    });
    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-16T00:00:00.000Z"),
      effectiveTo: null,
      cancelFee: 0,
      monthlyCancelFee: 900,
    });
    await createInstructorCanceledClasses(
      customer.id,
      instructor.id,
      Array.from(
        { length: 10 },
        (_, index) =>
          `2026-03-${String(index + 1).padStart(2, "0")}T10:00:00+09:00`,
      ),
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(200);

    expect(response.body.periods[1].monthlyCancelFee).toEqual({
      cancelCount: 10,
      threshold: 10,
      unitFee: 900,
      timesApplied: 1,
      total: 900,
    });
    expect(response.body.periods[1].currency).toBe("JPY");
    expect(response.body.periods[1].total).toBe(-900);
  });

  it("returns 422 when a monthly cancel fee is needed but no month-end fee exists", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: new Date("2026-03-30T00:00:00.000Z"),
      cancelFee: 0,
      monthlyCancelFee: 700,
    });
    await createInstructorCanceledClasses(
      customer.id,
      instructor.id,
      Array.from(
        { length: 10 },
        (_, index) =>
          `2026-03-${String(index + 1).padStart(2, "0")}T10:00:00+09:00`,
      ),
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(422);

    expect(response.body.code).toBe("MISSING_FEE_RATE");
  });

  it("returns 422 when monthly cancel fee currency conflicts with second-half class currency", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const customer = await createCustomer();

    await createInstructorFee(instructor.id, {
      currency: "JPY",
      effectiveFrom: new Date("2026-03-01T00:00:00.000Z"),
      effectiveTo: new Date("2026-03-30T00:00:00.000Z"),
      cancelFee: 0,
      monthlyCancelFee: 700,
    });
    await createInstructorFee(instructor.id, {
      currency: "USD",
      effectiveFrom: new Date("2026-03-30T00:00:00.000Z"),
      effectiveTo: null,
      regularFee: 100,
      cancelFee: 0,
      monthlyCancelFee: 10,
    });
    await createInstructorCanceledClasses(
      customer.id,
      instructor.id,
      Array.from(
        { length: 10 },
        (_, index) =>
          `2026-03-${String(index + 1).padStart(2, "0")}T10:00:00+09:00`,
      ),
    );
    await createClass(
      customer.id,
      instructor.id,
      jstDateTime("2026-03-20T10:00:00+09:00"),
      { status: "completed", isFreeTrial: false },
    );

    const response = await request(server)
      .get(`/admins/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(admin.id, "admin"))
      .expect(422);

    expect(response.body.code).toBe("MULTIPLE_CURRENCIES");
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
