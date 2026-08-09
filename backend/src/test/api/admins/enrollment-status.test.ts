import { describe, expect, it } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import { prisma } from "../../setup";
import {
  createAdmin,
  createChild,
  createCustomer,
  createInstructor,
  createPlan,
  createSubscription,
  generateAuthCookie,
} from "../../testUtils";

const DAY_MS = 86_400_000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

describe("GET /admins/enrollment-status", () => {
  it("requires administrator authentication", async () => {
    await request(server).get("/admins/enrollment-status").expect(401);
  });

  it("returns active enrollment groups with JST formatting and stable ordering", async () => {
    const admin = await createAdmin();
    const cookie = await generateAuthCookie(admin.id, "admin");
    const customer = await createCustomer({
      email: "active@example.com",
      password: "password",
      name: "Active Customer",
      prefecture: "Tokyo",
      emailVerified: new Date(),
    });
    const emptyCustomer = await createCustomer({
      email: "empty@example.com",
      password: "password",
      name: "Empty Customer",
      prefecture: "Tokyo",
      emailVerified: new Date(),
    });
    const child2 = await createChild(customer.id, { name: "Second Child" });
    const child1 = await createChild(customer.id, { name: "First Child" });
    const instructor = await createInstructor();
    const plan = await createPlan({
      name: "Weekly Plan",
      description: "",
      weeklyClassTimes: 2,
      englishBackground: 0,
    });
    const now = new Date();
    const activeSubscription = await createSubscription(plan.id, customer.id, {
      selectType: "active-enrollment-test",
      startAt: new Date(now.getTime() - 20 * DAY_MS),
      endAt: null,
    });
    await createSubscription(plan.id, customer.id, {
      selectType: "future-enrollment-test",
      startAt: new Date(now.getTime() + 20 * DAY_MS),
      endAt: null,
    });

    const startAt = new Date("2026-07-27T23:30:00.000Z");
    const recurringEndAt = new Date(now.getTime() + 10 * DAY_MS);
    const displayedRecurringEndDate = new Date(
      recurringEndAt.getTime() - DAY_MS + JST_OFFSET_MS,
    )
      .toISOString()
      .slice(0, 10);
    const recurringClass = await prisma.recurringClass.create({
      data: {
        subscriptionId: activeSubscription.id,
        instructorId: instructor.id,
        startAt,
        endAt: recurringEndAt,
      },
    });
    await prisma.recurringClassAttendance.createMany({
      data: [
        { recurringClassId: recurringClass.id, childrenId: child2.id },
        { recurringClassId: recurringClass.id, childrenId: child1.id },
      ],
    });
    await prisma.recurringClass.create({
      data: {
        subscriptionId: activeSubscription.id,
        startAt: new Date("2026-07-26T22:00:00.000Z"),
        endAt: null,
      },
    });
    await prisma.recurringClass.create({
      data: {
        subscriptionId: activeSubscription.id,
        startAt: new Date(now.getTime() + 10 * DAY_MS),
        endAt: null,
      },
    });

    const response = await request(server)
      .get("/admins/enrollment-status")
      .set("Cookie", cookie)
      .expect(200);

    expect(response.body.data.map(({ id }: { id: number }) => id)).toEqual([
      customer.id,
      emptyCustomer.id,
    ]);
    expect(response.body.data[1].subscriptions).toEqual([]);
    expect(response.body.data[0].subscriptions).toHaveLength(1);
    expect(response.body.data[0].subscriptions[0]).toMatchObject({
      id: activeSubscription.id,
      planName: "Weekly Plan",
      recurringClasses: [
        {
          children: [],
          instructor: "未割当",
          weekday: "月",
          time: "07:00–07:25",
          startDate: "2026-07-27",
          endDate: "継続中",
        },
        {
          children: ["Second Child", "First Child"],
          instructor: instructor.nickname,
          weekday: "火",
          time: "08:30–08:55",
          startDate: "2026-07-28",
          endDate: displayedRecurringEndDate,
        },
      ],
    });
  });
});
