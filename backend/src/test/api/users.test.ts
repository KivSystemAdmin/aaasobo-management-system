import { describe, it, expect, vi } from "vitest";
import request from "supertest";
const { faker } = require("@faker-js/faker");
import { server } from "../../server";
import { prisma } from "../setup";
import {
  createAdmin,
  createCustomer,
  createInstructor,
  generateTestAdmin,
  generateTestCustomer,
  generateTestInstructor,
  createPasswordResetToken,
} from "../testUtils";

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

describe("POST /users/authenticate", () => {
  describe("Admin", () => {
    it("succeed with valid credentials", async () => {
      const adminData = generateTestAdmin();
      const admin = await createAdmin(adminData);

      const response = await request(server)
        .post("/users/authenticate")
        .send({
          email: adminData.email,
          password: adminData.password,
          userType: "admin",
        })
        .expect(200);

      expect(response.body).toEqual({ id: admin.id });
    });

    it("fail with non-existent email", async () => {
      await request(server)
        .post("/users/authenticate")
        .send({
          email: faker.internet.email(),
          password: faker.internet.password(),
          userType: "admin",
        })
        .expect(401);
    });

    it("fail with incorrect password", async () => {
      const adminData = generateTestAdmin();
      await createAdmin(adminData);

      await request(server)
        .post("/users/authenticate")
        .send({
          email: adminData.email,
          password: faker.internet.password(),
          userType: "admin",
        })
        .expect(401);
    });
  });

  describe("Customer", () => {
    it("succeed with valid credentials", async () => {
      const customerData = generateTestCustomer();
      const customer = await createCustomer(customerData);

      const response = await request(server)
        .post("/users/authenticate")
        .send({
          email: customerData.email,
          password: customerData.password,
          userType: "customer",
        })
        .expect(200);

      expect(response.body).toEqual({ id: customer.id });
    });

    it("fail with unverified email", async () => {
      const customerData = generateTestCustomer();
      customerData.emailVerified = null;
      await createCustomer(customerData);

      await request(server)
        .post("/users/authenticate")
        .send({
          email: customerData.email,
          password: customerData.password,
          userType: "customer",
        })
        .expect(403);
    });
  });

  describe("Instructor", () => {
    it("succeed with valid credentials", async () => {
      const instructorData = generateTestInstructor();
      const instructor = await createInstructor(instructorData);

      const response = await request(server)
        .post("/users/authenticate")
        .send({
          email: instructorData.email,
          password: instructorData.password,
          userType: "instructor",
        })
        .expect(200);

      expect(response.body).toEqual({ id: instructor.id });
    });
  });
});

describe("CORS error handling", () => {
  it("returns a generic forbidden response for disallowed origins", async () => {
    const response = await request(server)
      .post("/users/authenticate")
      .set("Origin", "https://evil.example")
      .send({
        email: faker.internet.email(),
        password: faker.internet.password(),
        userType: "admin",
      })
      .expect(403);

    expect(response.body).toEqual({ message: "Forbidden origin" });
    expect(response.text).not.toContain("src/server.ts");
    expect(response.text).not.toContain("node_modules");
  });
});

describe("POST /users/send-password-reset", () => {
  it("succeed for existing admin", async () => {
    const adminData = generateTestAdmin();
    await createAdmin(adminData);

    await request(server)
      .post("/users/send-password-reset")
      .send({
        email: adminData.email,
        userType: "admin",
      })
      .expect(202);

    // Verify token was created in database
    const token = await prisma.passwordResetToken.findFirst({
      where: { email: adminData.email },
    });
    expect(token).toBeTruthy();
    expect(token?.email).toBe(adminData.email);
  });

  it("succeed for existing customer", async () => {
    const customerData = generateTestCustomer();
    await createCustomer(customerData);

    await request(server)
      .post("/users/send-password-reset")
      .send({
        email: customerData.email,
        userType: "customer",
      })
      .expect(202);

    const token = await prisma.passwordResetToken.findFirst({
      where: { email: customerData.email },
    });
    expect(token).toBeTruthy();
  });

  it("succeed for existing instructor", async () => {
    const instructorData = generateTestInstructor();
    await createInstructor(instructorData);

    await request(server)
      .post("/users/send-password-reset")
      .send({
        email: instructorData.email,
        userType: "instructor",
      })
      .expect(202);

    const token = await prisma.passwordResetToken.findFirst({
      where: { email: instructorData.email },
    });
    expect(token).toBeTruthy();
  });

  it("returns the same accepted response for non-existent user", async () => {
    await request(server)
      .post("/users/send-password-reset")
      .send({
        email: faker.internet.email(),
        userType: "admin",
      })
      .expect(202);
  });
});

describe("POST /users/verify-reset-token", () => {
  it("succeed with valid token for admin", async () => {
    const adminData = generateTestAdmin();
    await createAdmin(adminData);
    const resetToken = await createPasswordResetToken(adminData.email);

    await request(server)
      .post("/users/verify-reset-token")
      .send({
        token: resetToken.token,
        userType: "admin",
      })
      .expect(200);
  });

  it("succeed with valid token for customer", async () => {
    const customerData = generateTestCustomer();
    await createCustomer(customerData);
    const resetToken = await createPasswordResetToken(customerData.email);

    await request(server)
      .post("/users/verify-reset-token")
      .send({
        token: resetToken.token,
        userType: "customer",
      })
      .expect(200);
  });

  it("succeed with valid token for instructor", async () => {
    const instructorData = generateTestInstructor();
    await createInstructor(instructorData);
    const resetToken = await createPasswordResetToken(instructorData.email);

    await request(server)
      .post("/users/verify-reset-token")
      .send({
        token: resetToken.token,
        userType: "instructor",
      })
      .expect(200);
  });

  it("fail with non-existent token", async () => {
    await request(server)
      .post("/users/verify-reset-token")
      .send({
        token: faker.string.alphanumeric(32),
        userType: "admin",
      })
      .expect(404);
  });

  it("fail with expired token", async () => {
    const adminData = generateTestAdmin();
    await createAdmin(adminData);
    const resetToken = await createPasswordResetToken(adminData.email, -1);

    await request(server)
      .post("/users/verify-reset-token")
      .send({
        token: resetToken.token,
        userType: "admin",
      })
      .expect(410);
  });

  it("fail when user doesn't exist for valid token", async () => {
    const resetToken = await createPasswordResetToken(faker.internet.email());

    await request(server)
      .post("/users/verify-reset-token")
      .send({
        token: resetToken.token,
        userType: "admin",
      })
      .expect(404);
  });
});

describe("PATCH /users/update-password", () => {
  it("succeed with valid token for admin", async () => {
    const adminData = generateTestAdmin();
    await createAdmin(adminData);
    const resetToken = await createPasswordResetToken(adminData.email);

    await request(server)
      .patch("/users/update-password")
      .send({
        token: resetToken.token,
        userType: "admin",
        password: faker.internet.password(),
      })
      .expect(201);
  });

  it("succeed with valid token for customer", async () => {
    const customerData = generateTestCustomer();
    await createCustomer(customerData);
    const resetToken = await createPasswordResetToken(customerData.email);

    await request(server)
      .patch("/users/update-password")
      .send({
        token: resetToken.token,
        userType: "customer",
        password: faker.internet.password(),
      })
      .expect(201);
  });

  it("succeed with valid token for instructor", async () => {
    const instructorData = generateTestInstructor();
    await createInstructor(instructorData);
    const resetToken = await createPasswordResetToken(instructorData.email);

    await request(server)
      .patch("/users/update-password")
      .send({
        token: resetToken.token,
        userType: "instructor",
        password: faker.internet.password(),
      })
      .expect(201);
  });

  it("fail with non-existent token", async () => {
    await request(server)
      .patch("/users/update-password")
      .send({
        token: faker.string.alphanumeric(32),
        userType: "admin",
        password: faker.internet.password(),
      })
      .expect(404);
  });

  it("fail with expired token", async () => {
    const adminData = generateTestAdmin();
    await createAdmin(adminData);
    const resetToken = await createPasswordResetToken(adminData.email, -1);

    await request(server)
      .patch("/users/update-password")
      .send({
        token: resetToken.token,
        userType: "admin",
        password: faker.internet.password(),
      })
      .expect(410);
  });

  it("fail when user doesn't exist for valid token", async () => {
    const resetToken = await createPasswordResetToken(faker.internet.email());

    await request(server)
      .patch("/users/update-password")
      .send({
        token: resetToken.token,
        userType: "admin",
        password: faker.internet.password(),
      })
      .expect(404);
  });
});
