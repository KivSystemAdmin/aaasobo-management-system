import { describe, expect, it } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import { createInstructor, generateAuthCookie } from "../../testUtils";

describe("GET /instructors/:id/payroll", () => {
  it("returns the authenticated instructor's own payroll", async () => {
    const instructor = await createInstructor();

    const response = await request(server)
      .get(`/instructors/${instructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(instructor.id, "instructor"))
      .expect(200);

    expect(response.body).toMatchObject({
      instructorId: instructor.id,
      month: "2026-03",
      timezone: "Asia/Tokyo",
    });
    expect(response.body.periods).toHaveLength(2);
  });

  it("rejects access to another instructor's payroll", async () => {
    const instructor = await createInstructor();
    const otherInstructor = await createInstructor();

    const response = await request(server)
      .get(`/instructors/${otherInstructor.id}/payroll`)
      .query({ month: "2026-03" })
      .set("Cookie", await generateAuthCookie(instructor.id, "instructor"))
      .expect(403);

    expect(response.body).toEqual({ message: "Forbidden: user ID mismatch" });
  });
});
