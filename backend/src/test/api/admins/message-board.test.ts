import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import {
  createAdmin,
  createCustomer,
  createInstructor,
  generateAuthCookie,
} from "../../testUtils";
import { prisma } from "../../setup";

describe("GET /admins/message-board", () => {
  it("returns posts in descending createdAt order", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const first = await prisma.messageBoardPost.create({
      data: {
        target: "customers",
        body: "First message",
      },
    });

    const second = await prisma.messageBoardPost.create({
      data: {
        target: "both",
        body: "Second message",
      },
    });

    const response = await request(server)
      .get("/admins/message-board")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body).toEqual({
      data: [
        {
          id: second.id,
          target: "both",
          body: "Second message",
          createdAt: second.createdAt.toISOString(),
        },
        {
          id: first.id,
          target: "customers",
          body: "First message",
          createdAt: first.createdAt.toISOString(),
        },
      ],
    });
  });

  it("allows customer and instructor users", async () => {
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const customerCookie = await generateAuthCookie(customer.id, "customer");
    const instructorCookie = await generateAuthCookie(
      instructor.id,
      "instructor",
    );

    await prisma.messageBoardPost.create({
      data: {
        target: "instructors",
        body: "Instructor message",
      },
    });

    await request(server)
      .get("/admins/message-board")
      .set("Cookie", customerCookie)
      .expect(200);

    await request(server)
      .get("/admins/message-board")
      .set("Cookie", instructorCookie)
      .expect(200);
  });

  it("fails for unauthenticated request", async () => {
    await request(server).get("/admins/message-board").expect(401);
  });
});

describe("POST /admins/message-board", () => {
  it("creates a message post for authenticated admin", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const response = await request(server)
      .post("/admins/message-board")
      .set("Cookie", authCookie)
      .send({
        target: "customers",
        body: "  Important message for customers  ",
      })
      .expect(201);

    expect(response.body.message).toBe("Message posted successfully");
    expect(response.body.data.target).toBe("customers");
    expect(response.body.data.body).toBe("Important message for customers");

    const createdPost = await prisma.messageBoardPost.findUnique({
      where: { id: response.body.data.id },
    });

    expect(createdPost).toBeTruthy();
    expect(createdPost?.body).toBe("Important message for customers");
    expect(createdPost?.target).toBe("customers");
  });

  it("fails for non-admin users", async () => {
    const customer = await createCustomer();
    const authCookie = await generateAuthCookie(customer.id, "customer");

    await request(server)
      .post("/admins/message-board")
      .set("Cookie", authCookie)
      .send({
        target: "both",
        body: "Cannot post",
      })
      .expect(403);
  });

  it("fails with invalid request body", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    await request(server)
      .post("/admins/message-board")
      .set("Cookie", authCookie)
      .send({
        target: "invalid-target",
        body: "Message",
      })
      .expect(400);

    await request(server)
      .post("/admins/message-board")
      .set("Cookie", authCookie)
      .send({
        target: "both",
        body: "   ",
      })
      .expect(400);
  });
});
