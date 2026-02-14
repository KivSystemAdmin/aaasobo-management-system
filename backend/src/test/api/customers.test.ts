import { describe, it, expect, vi } from "vitest";
import request from "supertest";
const { faker } = require("@faker-js/faker");
import { server } from "../../server";
import { prisma } from "../setup";
import {
  createAdmin,
  createCustomer,
  createChild,
  createPlan,
  createSubscription,
  createInstructor,
  createClass,
  createVerificationToken,
  createClassAttendance,
  generateTestCustomer,
  generateAuthCookie,
} from "../testUtils";

async function createAdminAuthCookie() {
  const admin = await createAdmin();
  return await generateAuthCookie(admin.id, "admin");
}

// Mock the resend email service to avoid sending real emails
vi.mock("../../lib/email/resendClient", () => ({
  resend: {
    emails: {
      send: vi
        .fn()
        .mockResolvedValue({ data: { id: "mock-email-id" }, error: null }),
    },
  },
}));

// Mock the mail helper functions
vi.mock("../../lib/email/mail", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../lib/email/mail")>();
  return {
    ...actual,
    sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
    resendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
    sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
  };
});

describe("POST /customers/check-email-conflicts", () => {
  it("succeed for available email", async () => {
    const availableEmail = faker.internet.email().toLowerCase();

    await request(server)
      .post(`/customers/check-email-conflicts`)
      .send({ email: availableEmail })
      .expect(200);
  });

  it("return 409 when email is already in use", async () => {
    const existing = await createCustomer();

    await request(server)
      .post(`/customers/check-email-conflicts`)
      .send({ email: existing.email })
      .expect(409);
  });
});

describe("POST /customers/register", () => {
  it("succeed with valid data", async () => {
    const customerEmail = faker.internet.email().toLowerCase();
    const requestBody = {
      customerData: {
        name: faker.person.fullName(),
        email: customerEmail,
        password: faker.internet.password(),
        prefecture: faker.location.state(),
      },
      childData: {
        name: faker.person.fullName(),
        birthdate: faker.date.past({ years: 10 }).toISOString().split("T")[0],
        personalInfo: faker.lorem.sentence(),
      },
    };

    await request(server)
      .post(`/customers/register`)
      .send(requestBody)
      .expect(201);

    // Verify customer was created
    const customer = await prisma.customer.findUnique({
      where: { email: customerEmail },
    });
    expect(customer).toBeTruthy();
    expect(customer?.name).toBe(requestBody.customerData.name);
    expect(customer?.emailVerified).toBeNull();

    // Verify child was created
    const child = await prisma.child.findFirst({
      where: { customerId: customer!.id },
    });
    expect(child).toBeTruthy();
    expect(child?.name).toBe(requestBody.childData.name);

    // Verify free trial class was created
    const freeTrialClass = await prisma.class.findFirst({
      where: { customerId: customer!.id, isFreeTrial: true },
    });
    expect(freeTrialClass).toBeTruthy();

    // Verify verification token was created
    const verificationToken = await prisma.verificationToken.findFirst({
      where: { email: customerEmail },
    });
    expect(verificationToken).toBeTruthy();
  });

  it("fail for missing customerData fields", async () => {
    const requestBody = {
      customerData: {
        name: faker.person.fullName(),
        // Missing email, password, prefecture
      },
      childData: {
        name: faker.person.fullName(),
        birthdate: faker.date.past({ years: 10 }).toISOString().split("T")[0],
        personalInfo: faker.lorem.sentence(),
      },
    };

    await request(server)
      .post(`/customers/register`)
      .send(requestBody)
      .expect(400);
  });
});

describe("PATCH /customers/verify-email", () => {
  it("succeed with valid token", async () => {
    const customerData = generateTestCustomer();
    customerData.emailVerified = null;
    const customer = await createCustomer(customerData);

    const verificationToken = await createVerificationToken(
      customer.email,
      1, // expires in 1 hour
    );

    await request(server)
      .patch(`/customers/verify-email`)
      .send({ token: verificationToken.token })
      .expect(200);

    // Verify email was marked as verified
    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: customer.id },
    });
    expect(updatedCustomer?.emailVerified).toBeTruthy();
  });

  it("fail for missing token", async () => {
    await request(server).patch(`/customers/verify-email`).send({}).expect(400);
  });

  it("fail for invalid token", async () => {
    await request(server)
      .patch(`/customers/verify-email`)
      .send({ token: "invalid-token" })
      .expect(404);
  });
});

// Reordered to match routeConfigs order in customersRouter.ts
describe("PATCH /customers/:id", () => {
  it("succeed with valid update data", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();
    const updateData = {
      name: faker.person.fullName(),
      email: faker.internet.email().toLowerCase(),
      prefecture: faker.location.state(),
    };

    await request(server)
      .patch(`/customers/${customer.id}`)
      .set("Cookie", authCookie)
      .send(updateData)
      .expect(200);

    // Verify customer was updated
    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: customer.id },
    });
    expect(updatedCustomer?.name).toBe(updateData.name);
    expect(updatedCustomer?.email).toBe(updateData.email);
    expect(updatedCustomer?.prefecture).toBe(updateData.prefecture);
    // Email verification should be reset when email changes
    expect(updatedCustomer?.emailVerified).toBeNull();
  });

  it("fail for missing required fields", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();
    const updateData = {
      name: faker.person.fullName(),
      // Missing email and prefecture
    };

    await request(server)
      .patch(`/customers/${customer.id}`)
      .set("Cookie", authCookie)
      .send(updateData)
      .expect(400);
  });
});

describe("GET /customers/:id/child-profiles", () => {
  it("succeed for valid customer ID", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();
    await createChild(customer.id);
    await createChild(customer.id);

    const response = await request(server)
      .get(`/customers/${customer.id}/child-profiles`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body).toHaveLength(2);
  });
});

describe("GET /customers/:id/classes", () => {
  it("succeed for valid customer ID", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();
    const child = await createChild(customer.id);
    const instructor = await createInstructor();

    const classInstance = await createClass(
      customer.id,
      instructor.id,
      new Date(),
    );

    // Create class attendance
    await createClassAttendance(classInstance.id, child.id);

    const response = await request(server)
      .get(`/customers/${customer.id}/classes`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body).toHaveLength(1);
  });
});

describe("GET /customers/:id/customer", () => {
  it("succeed for valid customer ID", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();

    const response = await request(server)
      .get(`/customers/${customer.id}/customer`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.id).toBe(customer.id);
    expect(response.body.email).toBe(customer.email);
    expect(response.body.name).toBe(customer.name);
  });

  it("fail for invalid customer ID parameter", async () => {
    const authCookie = await createAdminAuthCookie();
    await request(server)
      .get(`/customers/abc/customer`)
      .set("Cookie", authCookie)
      .expect(400);
  });
});

describe("PATCH /customers/:id/free-trial/decline", () => {
  it("succeed with valid classCode", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();
    const classCode = faker.string.alphanumeric(8).toUpperCase();

    await prisma.class.create({
      data: {
        customerId: customer.id,
        status: "pending",
        isFreeTrial: true,
        classCode,
        updatedAt: new Date(),
      },
    });

    await request(server)
      .patch(`/customers/${customer.id}/free-trial/decline`)
      .set("Cookie", authCookie)
      .send({ classCode })
      .expect(200);

    // Verify class status was updated
    const updatedClass = await prisma.class.findFirst({
      where: { classCode, customerId: customer.id },
    });
    expect(updatedClass?.status).toBe("declined");
  });

  it("fail for missing classCode", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();

    await request(server)
      .patch(`/customers/${customer.id}/free-trial/decline`)
      .set("Cookie", authCookie)
      .send({})
      .expect(404);
  });
});

describe("GET /customers/:id/rebookable-classes", () => {
  it("succeed for valid customer ID with rebookable classes", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();

    // Create a regular rebookable class
    await createClass(customer.id, undefined, undefined);

    // Create a free trial class
    await prisma.class.create({
      data: {
        customerId: customer.id,
        status: "pending",
        isFreeTrial: true,
        classCode: faker.string.alphanumeric(8).toUpperCase(),
        rebookableUntil: new Date(Date.now() + 86400000), // 1 day from now
        updatedAt: new Date(),
      },
    });

    const response = await request(server)
      .get(`/customers/${customer.id}/rebookable-classes`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe("PATCH /customers/:id/seen-welcome", () => {
  it("succeed to mark welcome as seen", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();

    await request(server)
      .patch(`/customers/${customer.id}/seen-welcome`)
      .set("Cookie", authCookie)
      .expect(200);

    // Verify hasSeenWelcome was set to true
    const updatedCustomer = await prisma.customer.findUnique({
      where: { id: customer.id },
    });
    expect(updatedCustomer?.hasSeenWelcome).toBe(true);
  });
});

describe("POST /customers/:id/subscription", () => {
  it("succeed with valid data", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();
    const plan = await createPlan();
    const subscriptionData = {
      planId: plan.id,
      startAt: faker.date.future().toISOString(),
    };

    await request(server)
      .post(`/customers/${customer.id}/subscription`)
      .set("Cookie", authCookie)
      .send(subscriptionData)
      .expect(200);

    // Verify subscription was created
    const subscription = await prisma.subscription.findFirst({
      where: { customerId: customer.id, planId: plan.id },
    });
    expect(subscription).toBeTruthy();
  });

  it("fail for invalid planId type", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();
    const subscriptionData = {
      planId: "invalid",
      startAt: faker.date.future().toISOString(),
    };

    await request(server)
      .post(`/customers/${customer.id}/subscription`)
      .set("Cookie", authCookie)
      .send(subscriptionData)
      .expect(400);
  });

  it("fail for missing required fields", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();

    await request(server)
      .post(`/customers/${customer.id}/subscription`)
      .set("Cookie", authCookie)
      .send({})
      .expect(400);
  });
});

describe("GET /customers/:id/subscriptions", () => {
  it("succeed for valid customer ID", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();
    const plan = await createPlan();
    await createSubscription(plan.id, customer.id);

    const response = await request(server)
      .get(`/customers/${customer.id}/subscriptions`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.subscriptions).toHaveLength(1);
    expect(response.body.subscriptions[0].planId).toBe(plan.id);
  });

  it("fail for invalid customer ID", async () => {
    const authCookie = await createAdminAuthCookie();
    await request(server)
      .get(`/customers/invalid/subscriptions`)
      .set("Cookie", authCookie)
      .expect(400);
  });
});

describe("GET /customers/:id/upcoming-classes", () => {
  it("succeed for valid customer ID with upcoming classes", async () => {
    const authCookie = await createAdminAuthCookie();
    const customer = await createCustomer();
    const child = await createChild(customer.id);
    const instructor = await createInstructor();

    const futureDate = new Date(Date.now() + 86400000); // 1 day from now
    const upcomingClass = await createClass(
      customer.id,
      instructor.id,
      futureDate,
    );

    // Create class attendance
    await createClassAttendance(upcomingClass.id, child.id);

    const response = await request(server)
      .get(`/customers/${customer.id}/upcoming-classes`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body).toHaveLength(1);
  });
});
