import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import { createAdmin, createPlan, generateAuthCookie } from "../../testUtils";
import { prisma } from "../../setup";
import { EnglishBackground } from "../../../types";

describe("GET /admins/plan-list", () => {
  it("succeed with multiple plans", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const plan1 = await createPlan();
    const plan2 = await createPlan();
    const [plan1NameJpn, plan1NameEng] = plan1.name.split(" / ");
    const [plan2NameJpn, plan2NameEng] = plan2.name.split(" / ");

    const response = await request(server)
      .get("/admins/plan-list")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.data).toEqual([
      {
        No: 1,
        ID: plan1.id,
        "Plan (Japanese)": plan1NameJpn,
        "Plan (English)": plan1NameEng,
        English:
          plan1.englishBackground === EnglishBackground.NonNative
            ? "Program Original"
            : plan1.englishBackground === EnglishBackground.NativeA
              ? "Native A"
              : "Native B",
        "Weekly Class Times": plan1.weeklyClassTimes,
        Description: plan1.description,
      },
      {
        No: 2,
        ID: plan2.id,
        "Plan (Japanese)": plan2NameJpn,
        "Plan (English)": plan2NameEng,
        English:
          plan2.englishBackground === EnglishBackground.NonNative
            ? "Program Original"
            : plan2.englishBackground === EnglishBackground.NativeA
              ? "Native A"
              : "Native B",
        "Weekly Class Times": plan2.weeklyClassTimes,
        Description: plan2.description,
      },
    ]);
  });
});

describe("POST /admins/plan-list/register", () => {
  it("succeed with authenticated admin", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const planData = {
      planNameEng: "Basic",
      planNameJpn: "ベーシック",
      weeklyClassTimes: 2,
      description: "Test plan description",
      englishBackground: EnglishBackground.NonNative,
    };

    await request(server)
      .post("/admins/plan-list/register")
      .set("Cookie", authCookie)
      .send(planData)
      .expect(201);

    const createdPlan = await prisma.plan.findFirst({
      where: { name: `${planData.planNameJpn} / ${planData.planNameEng}` },
    });
    expect(createdPlan).toBeTruthy();
  });

  it("fail for unauthenticated request", async () => {
    const planData = {
      planNameEng: "Basic",
      planNameJpn: "ベーシック",
      weeklyClassTimes: 2,
      description: "Test plan description",
      englishBackground: EnglishBackground.NonNative,
    };

    await request(server)
      .post("/admins/plan-list/register")
      .send(planData)
      .expect(401);
  });
});

describe("PATCH /admins/plan-list/update/:id", () => {
  it("succeed with authenticated admin", async () => {
    const admin = await createAdmin();
    const plan = await createPlan();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const updatedDescription = "Updated plan description";
    const [planNameJpn, planNameEng] = plan.name.split(" / ");

    await request(server)
      .patch(`/admins/plan-list/update/${plan.id}`)
      .set("Cookie", authCookie)
      .send({
        planNameEng,
        planNameJpn,
        description: updatedDescription,
        englishBackground: EnglishBackground.NonNative,
      })
      .expect(200);

    const updatedPlan = await prisma.plan.findUnique({
      where: { id: plan.id },
    });
    expect(updatedPlan?.description).toBe(updatedDescription);
  });

  it("fail for unauthenticated request", async () => {
    const plan = await createPlan();

    await request(server)
      .patch(`/admins/plan-list/update/${plan.id}`)
      .send({ isDelete: false, name: plan.name, description: "Updated" })
      .expect(401);
  });
});
