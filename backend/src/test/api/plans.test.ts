import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../server";
import { prisma } from "../setup";
import { createAdmin, createPlan, generateAuthCookie } from "../testUtils";
import { EnglishBackground } from "../../types";

async function createAdminAuthCookie() {
  const admin = await createAdmin();
  return await generateAuthCookie(admin.id, "admin");
}

describe("GET /plans", () => {
  it("succeed with authenticated admin and return active plans only", async () => {
    const authCookie = await createAdminAuthCookie();
    const activePlan1 = await createPlan();
    const activePlan2 = await createPlan();
    await prisma.plan.create({
      data: {
        name: "Terminated Plan",
        weeklyClassTimes: 1,
        description: "Should not appear in /plans",
        englishBackground: EnglishBackground.NonNative,
        terminationAt: new Date(),
      },
    });

    const response = await request(server)
      .get("/plans")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.map((p: any) => p.id).sort()).toEqual(
      [activePlan1.id, activePlan2.id].sort(),
    );
  });
});

describe("GET /plans/:id", () => {
  it("succeed with authenticated admin and valid ID", async () => {
    const authCookie = await createAdminAuthCookie();
    const plan = await createPlan({
      name: "Basic Plan",
      weeklyClassTimes: 2,
      description: "A basic plan with 2 weekly classes",
      englishBackground: EnglishBackground.NonNative,
    });

    const response = await request(server)
      .get(`/plans/${plan.id}`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.plan).toEqual({
      id: plan.id,
      name: "Basic Plan",
      weeklyClassTimes: 2,
      description: "A basic plan with 2 weekly classes",
      englishBackground: EnglishBackground.NonNative,
    });
  });
});
