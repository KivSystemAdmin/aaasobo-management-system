import { describe, expect, it } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import {
  createCustomer,
  createInstructor,
  createInstructorFee,
  generateAuthCookie,
} from "../../testUtils";

describe("GET /instructors/fees", () => {
  it("returns only the authenticated instructor's fee history", async () => {
    const instructor = await createInstructor();
    const otherInstructor = await createInstructor();
    const ownFee = await createInstructorFee(instructor.id, {
      effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
      effectiveTo: null,
      regularFee: 2000,
    });
    await createInstructorFee(otherInstructor.id, {
      effectiveFrom: new Date("2026-02-01T00:00:00.000Z"),
      effectiveTo: null,
      regularFee: 9000,
    });

    const response = await request(server)
      .get("/instructors/fees")
      .query({ instructorId: otherInstructor.id })
      .set("Cookie", await generateAuthCookie(instructor.id, "instructor"))
      .expect(200);

    expect(response.body).toEqual({
      instructorId: instructor.id,
      fees: [
        expect.objectContaining({
          id: ownFee.id,
          regularFee: 2000,
        }),
      ],
    });
  });

  it("rejects customer access", async () => {
    const customer = await createCustomer();

    const response = await request(server)
      .get("/instructors/fees")
      .set("Cookie", await generateAuthCookie(customer.id, "customer"))
      .expect(403);

    expect(response.body).toEqual({
      message: "Forbidden: insufficient permissions",
    });
  });

  it("rejects unauthenticated access", async () => {
    const response = await request(server).get("/instructors/fees").expect(401);

    expect(response.body).toEqual({ message: "No session token found" });
  });
});
