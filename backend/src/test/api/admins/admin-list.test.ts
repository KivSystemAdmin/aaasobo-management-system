import { describe, it, expect } from "vitest";
import { maskedHeadLetters } from "../../../utils/commonUtils";
import request from "supertest";
import { server } from "../../../server";
import {
  createAdmin,
  generateTestAdmin,
  generateAuthCookie,
} from "../../testUtils";
import { prisma } from "../../setup";

describe("GET /admins/admin-list", () => {
  it("succeed with multiple admins", async () => {
    const admin1 = await createAdmin();
    const admin2 = await createAdmin();
    const authCookie = await generateAuthCookie(admin1.id, "admin");

    const response = await request(server)
      .get("/admins/admin-list")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.data).toEqual([
      { No: 1, ID: admin1.id, Admin: admin1.name, Email: admin1.email },
      { No: 2, ID: admin2.id, Admin: admin2.name, Email: admin2.email },
    ]);
  });
});

describe("GET /admins/admin-list/:id", () => {
  it("succeed with valid ID", async () => {
    const authAdmin = await createAdmin();
    const authCookie = await generateAuthCookie(authAdmin.id, "admin");
    const admin = await createAdmin();

    const response = await request(server)
      .get(`/admins/admin-list/${admin.id}`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body).toEqual({
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
      },
    });
  });

  it("fail with invalid ID parameter", async () => {
    const authAdmin = await createAdmin();
    const authCookie = await generateAuthCookie(authAdmin.id, "admin");
    await request(server)
      .get("/admins/admin-list/invalid")
      .set("Cookie", authCookie)
      .expect(400);
  });

  it("fail for non-existent admin", async () => {
    const authAdmin = await createAdmin();
    const authCookie = await generateAuthCookie(authAdmin.id, "admin");
    await request(server)
      .get("/admins/admin-list/999")
      .set("Cookie", authCookie)
      .expect(404);
  });
});

describe("DELETE /admins/admin-list/:id", () => {
  it("succeed with authenticated admin", async () => {
    const authAdmin = await createAdmin();
    const targetAdmin = await createAdmin();
    const authCookie = await generateAuthCookie(authAdmin.id, "admin");

    const response = await request(server)
      .delete(`/admins/admin-list/${targetAdmin.id}`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body).toEqual({
      message: "The admin profile was deleted successfully",
      id: targetAdmin.id,
    });

    const deletedAdmin = await prisma.admin.findUnique({
      where: { id: targetAdmin.id },
    });

    expect(deletedAdmin).not.toBeNull();
    expect(deletedAdmin?.terminationAt).not.toBeNull();
    expect(deletedAdmin?.email).toContain(maskedHeadLetters);

    const listResponse = await request(server)
      .get("/admins/admin-list")
      .set("Cookie", authCookie)
      .expect(200);

    expect(listResponse.body.data).toEqual([
      {
        No: 1,
        ID: authAdmin.id,
        Admin: authAdmin.name,
        Email: authAdmin.email,
      },
    ]);
  });

  it("fail for unauthenticated request", async () => {
    const admin = await createAdmin();

    await request(server).delete(`/admins/admin-list/${admin.id}`).expect(401);
  });
});

describe("POST /admins/admin-list/register", () => {
  it("succeed with authenticated admin", async () => {
    const existingAdmin = await createAdmin();
    const newAdminData = generateTestAdmin();
    const authCookie = await generateAuthCookie(existingAdmin.id, "admin");

    await request(server)
      .post("/admins/admin-list/register")
      .set("Cookie", authCookie)
      .send({
        name: newAdminData.name,
        email: newAdminData.email,
        password: newAdminData.password,
      })
      .expect(201);

    // Verify admin was created in database
    const createdAdmin = await prisma.admin.findUnique({
      where: { email: newAdminData.email },
    });
    expect(createdAdmin).toBeTruthy();
  });

  it("fail for unauthenticated request", async () => {
    const adminData = generateTestAdmin();

    await request(server)
      .post("/admins/admin-list/register")
      .send({
        name: adminData.name,
        email: adminData.email,
        password: adminData.password,
      })
      .expect(401);
  });
});
