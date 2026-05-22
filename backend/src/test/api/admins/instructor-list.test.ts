import { describe, it, expect } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import {
  createAdmin,
  createInstructor,
  generateTestInstructor,
  generateAuthCookie,
} from "../../testUtils";
import { prisma } from "../../setup";
import { EnglishBackground } from "../../../types";

describe("GET /admins/instructor-list", () => {
  it("succeed with multiple instructors", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const instructor1 = await createInstructor();
    const instructor2 = await createInstructor();

    const response = await request(server)
      .get("/admins/instructor-list")
      .set("Cookie", authCookie)
      .expect(200);

    expect(response.body.data).toEqual([
      {
        No: 1,
        ID: instructor1.id,
        Instructor: instructor1.nickname,
        English:
          instructor1.englishBackground === EnglishBackground.NonNative
            ? "Non Native"
            : instructor1.englishBackground === EnglishBackground.NativeA
              ? "Native A"
              : "Native B",
        "Full Name": instructor1.name,
        Email: instructor1.email,
      },
      {
        No: 2,
        ID: instructor2.id,
        Instructor: instructor2.nickname,
        English:
          instructor2.englishBackground === EnglishBackground.NonNative
            ? "Non Native"
            : instructor2.englishBackground === EnglishBackground.NativeA
              ? "Native A"
              : "Native B",
        "Full Name": instructor2.name,
        Email: instructor2.email,
      },
    ]);
  });
});

describe("POST /admins/instructor-list/register", () => {
  it("succeed with authenticated admin", async () => {
    const admin = await createAdmin();
    const instructorData = generateTestInstructor();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    await request(server)
      .post("/admins/instructor-list/register")
      .set("Cookie", authCookie)
      .send({
        ...instructorData,
        englishBackground: String(EnglishBackground.NonNative),
      })
      .expect(201);

    const createdInstructor = await prisma.instructor.findUnique({
      where: { email: instructorData.email },
    });
    expect(createdInstructor).toBeTruthy();
  });

  it("fail for unauthenticated request", async () => {
    const instructorData = generateTestInstructor();

    await request(server)
      .post("/admins/instructor-list/register")
      .send({
        ...instructorData,
        englishBackground: String(EnglishBackground.NonNative),
      })
      .expect(401);
  });
});

describe("PATCH /admins/instructor-list/update/:id", () => {
  it("succeed with authenticated admin", async () => {
    const admin = await createAdmin();
    const instructor = await createInstructor();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const updatedName = "Updated Instructor Name";

    await request(server)
      .patch(`/admins/instructor-list/update/${instructor.id}`)
      .set("Cookie", authCookie)
      .send({
        name: updatedName,
        leavingDate: null,
        email: instructor.email,
        nickname: instructor.nickname,
        birthdate: instructor.birthdate.toISOString().split("T")[0],
        workingTime: instructor.workingTime,
        lifeHistory: instructor.lifeHistory,
        favoriteFood: instructor.favoriteFood,
        hobby: instructor.hobby,
        messageForChildren: instructor.messageForChildren,
        skill: instructor.skill,
        classURL: instructor.classURL,
        meetingId: instructor.meetingId,
        passcode: instructor.passcode,
        englishBackground: String(instructor.englishBackground),
      })
      .expect(200);

    const updatedInstructor = await prisma.instructor.findUnique({
      where: { id: instructor.id },
    });
    expect(updatedInstructor?.name).toBe(updatedName);
  });

  it("fail for unauthenticated request", async () => {
    const instructor = await createInstructor();

    await request(server)
      .patch(`/admins/instructor-list/update/${instructor.id}`)
      .send({ name: "Updated Name" })
      .expect(401);
  });
});
