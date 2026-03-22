import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../server";
import {
  createCustomer,
  createPlan,
  createSubscription,
  generateAuthCookie,
} from "../testUtils";

describe("GET /subscriptions/:id", () => {
  it("succeed returning subscription by id (customer auth)", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");
    const plan = await createPlan();
    const subscription = await createSubscription(plan.id, customer.id, {
      startAt: new Date("2024-01-01T00:00:00.000Z"),
      endAt: null,
    });

    const response = await request(server)
      .get(`/subscriptions/${subscription.id}`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body).toMatchObject({
      id: subscription.id,
      planId: plan.id,
      customerId: customer.id,
      selectType: subscription.selectType,
      startAt: "2024-01-01T00:00:00.000Z",
      endAt: null,
      plan: {
        id: plan.id,
        weeklyClassTimes: plan.weeklyClassTimes,
      },
      customer: {
        id: customer.id,
        email: customer.email,
        hasSeenWelcome: customer.hasSeenWelcome,
      },
    });

    expect(response.body.plan.englishBackground).toBe(plan.englishBackground);
  });

  it("return 400 for invalid subscription id (with auth)", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");

    const response = await request(server)
      .get("/subscriptions/invalid")
      .set("Cookie", authCookie)
      .expect(400);

    expect(response.body.message).toBe("Invalid parameters");
  });

  it("return 404 for non-existent subscription", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");

    const response = await request(server)
      .get("/subscriptions/999999")
      .set("Cookie", authCookie)
      .expect(404);

    expect(response.body.error).toBe("Subscription not found.");
  });
});
