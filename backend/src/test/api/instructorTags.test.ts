import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../server";
import {
  createAdmin,
  createCustomer,
  createInstructor,
  generateAuthCookie,
} from "../testUtils";
import { prisma } from "../setup";

describe("GET /instructors/tags", () => {
  it("returns active tags with usage counts", async () => {
    const admin = await createAdmin();
    const customer = await createCustomer();
    const instructor = await createInstructor();
    const authCookie = await generateAuthCookie(customer.id, "customer");

    const activeTag = await prisma.instructorTagCatalog.create({
      data: {
        label: "Energetic",
        sortOrder: 1,
        createdBy: admin.id,
      },
    });

    await prisma.instructorTagCatalog.create({
      data: {
        label: "Hidden",
        sortOrder: 2,
        createdBy: admin.id,
        deletedAt: new Date(),
        deletedBy: admin.id,
      },
    });

    await prisma.instructorTagAssignment.create({
      data: {
        instructorId: instructor.id,
        tagId: activeTag.id,
        updatedBy: admin.id,
      },
    });

    const response = await request(server)
      .get("/instructors/tags")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.tags).toEqual([
      {
        id: activeTag.id,
        label: "Energetic",
        sortOrder: 1,
        assignedCount: 1,
      },
    ]);
  });
});

describe("POST /instructors/tags", () => {
  it("creates a catalog tag with trimmed label", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const response = await request(server)
      .post("/instructors/tags")
      .set("Cookie", authCookie)
      .send({ label: "  Friendly  " })
      .expect(201);

    expect(response.body.tag.label).toBe("Friendly");

    const created = await prisma.instructorTagCatalog.findUnique({
      where: { id: response.body.tag.id },
    });

    expect(created?.label).toBe("Friendly");
    expect(created?.sortOrder).toBe(1);
  });

  it("restores a previously soft-deleted tag when same label is requested", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    await prisma.instructorTagCatalog.create({
      data: {
        label: "Experienced",
        sortOrder: 1,
        createdBy: admin.id,
      },
    });

    const softDeleted = await prisma.instructorTagCatalog.create({
      data: {
        label: "Supportive",
        sortOrder: 2,
        createdBy: admin.id,
        deletedAt: new Date(),
        deletedBy: admin.id,
      },
    });

    const response = await request(server)
      .post("/instructors/tags")
      .set("Cookie", authCookie)
      .send({ label: "supportive" })
      .expect(201);

    expect(response.body.tag.id).toBe(softDeleted.id);

    const restored = await prisma.instructorTagCatalog.findUnique({
      where: { id: softDeleted.id },
    });

    expect(restored?.deletedAt).toBeNull();
    expect(restored?.deletedBy).toBeNull();
    expect(restored?.sortOrder).toBe(3);
  });
});

describe("PUT /instructors/:id/tags", () => {
  it("replaces assignments and ignores deleted tag IDs", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const activeTag = await prisma.instructorTagCatalog.create({
      data: {
        label: "Punctual",
        sortOrder: 1,
        createdBy: admin.id,
      },
    });

    const deletedTag = await prisma.instructorTagCatalog.create({
      data: {
        label: "Archived",
        sortOrder: 2,
        createdBy: admin.id,
        deletedAt: new Date(),
        deletedBy: admin.id,
      },
    });

    await request(server)
      .put(`/instructors/${instructor.id}/tags`)
      .set("Cookie", authCookie)
      .send({ tagIds: [activeTag.id, deletedTag.id] })
      .expect(200);

    const assignments = await prisma.instructorTagAssignment.findMany({
      where: { instructorId: instructor.id },
      orderBy: { tagId: "asc" },
    });

    expect(assignments).toHaveLength(1);
    expect(assignments[0].tagId).toBe(activeTag.id);
  });
});

describe("GET /instructors/:id and GET /instructors/profiles", () => {
  it("includes assigned tags in instructor responses", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const tag = await prisma.instructorTagCatalog.create({
      data: {
        label: "Creative",
        sortOrder: 1,
        createdBy: admin.id,
      },
    });

    await prisma.instructorTagAssignment.create({
      data: {
        instructorId: instructor.id,
        tagId: tag.id,
        updatedBy: admin.id,
      },
    });

    const byIdResponse = await request(server)
      .get(`/instructors/${instructor.id}`)
      .set("Cookie", authCookie)
      .expect(200);

    expect(byIdResponse.body.instructor.tags).toEqual([
      {
        id: tag.id,
        label: "Creative",
        sortOrder: 1,
      },
    ]);

    const profilesResponse = await request(server)
      .get("/instructors/profiles")
      .set("Cookie", authCookie)
      .expect(200);

    const profile = profilesResponse.body.find(
      (item: { id: number }) => item.id === instructor.id,
    );

    expect(profile.tags).toEqual([
      {
        id: tag.id,
        label: "Creative",
        sortOrder: 1,
      },
    ]);
  });
});
