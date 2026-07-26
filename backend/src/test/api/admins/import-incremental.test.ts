import { describe, expect, it } from "vitest";
import request from "supertest";
import JSZip from "jszip";
import { server } from "../../../server";
import { generateIncrementalImportFixture } from "../../../seed/generateIncrementalImportFixture";
import { executeIncrementalImport } from "../../../services/adminImport";
import {
  createAdmin,
  createCustomer,
  createInstructor,
  createPlan,
  createSubscription,
  generateAuthCookie,
} from "../../testUtils";
import { prisma } from "../../setup";

const customerHeaders = {
  customers:
    "customer_ref,name,email,temp_password,prefecture,termination_at,has_seen_welcome",
  children: "child_ref,customer_ref,name,birthdate,personal_info",
  subscriptions:
    "subscription_ref,customer_ref,plan_name,select_type,start_at,end_at",
};

const instructorHeaders = {
  instructors:
    "instructor_ref,name,email,temp_password,class_url,icon,nickname,meeting_id,passcode,birthdate,favorite_food,hobby,life_history,message_for_children,skill,working_time,english_background,termination_at",
  fees: "instructor_ref,currency,effective_from,effective_to,trial_fee,regular_fee,cancel_fee,cancel_without_notice_fee,monthly_cancel_fee",
  schedules:
    "instructor_ref,effective_from,effective_to,timezone,weekday,start_time",
};

async function zipFiles(files: Record<string, string>) {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) zip.file(name, content);
  return zip.generateAsync({ type: "nodebuffer" });
}

function customerPackage(planName = "Existing Plan") {
  return {
    "customers.csv": [
      customerHeaders.customers,
      "CU0001,Customer One,customer.one@example.com,TempPass1!,Tokyo,,false",
      "CU0002,Customer Two,customer.two@example.com,TempPass2!,Osaka,,true",
    ].join("\n"),
    "children.csv": [
      customerHeaders.children,
      "CH0001,CU0001,Child One,2016-01-02,Notes",
      "CH0002,CU0002,Child Two,,",
    ].join("\n"),
    "subscriptions.csv": [
      customerHeaders.subscriptions,
      `SU0001,CU0001,${planName},https://example.com/select/1,2026-01-01T00:00:00+09:00,`,
      `SU0002,CU0002,${planName},https://example.com/select/2,2026-02-01T00:00:00+09:00,2027-01-31T00:00:00+09:00`,
    ].join("\n"),
  };
}

function instructorPackage() {
  return {
    "instructors.csv": [
      instructorHeaders.instructors,
      "IN0001,Instructor One,instructor.one@example.com,TempPass1!,https://example.com/class/1,https://example.com/icon/1.png,nick_one,11111111111,PASS0001,1990-01-01,,,,,,,0,",
      "IN0002,Instructor Two,instructor.two@example.com,TempPass2!,https://example.com/class/2,https://example.com/icon/2.png,nick_two,22222222222,PASS0002,1991-02-02,Pasta,Music,History two,Hello two,Singing,Weekends,1,",
    ].join("\n"),
    "instructor_fees.csv": [
      instructorHeaders.fees,
      "IN0001,PHP,2026-01-01,,75,100,50,100,",
      "IN0002,JPY,2026-02-01,2026-12-31,1000,1500,500,1500,2000",
    ].join("\n"),
    "instructor_schedules.csv": [
      instructorHeaders.schedules,
      "IN0001,2026-01-01,,Asia/Manila,1,09:00",
      "IN0001,2026-01-01,,Asia/Manila,3,10:00",
      "IN0002,2026-02-01,2026-12-31,Asia/Tokyo,2,11:30",
    ].join("\n"),
  };
}

async function postIncremental(
  target: "customers" | "instructors",
  files: Record<string, string>,
  cookie: string,
  expectedStatus: number,
) {
  const zip = await zipFiles(files);
  return request(server)
    .post(`/admins/import/incremental/${target}`)
    .set("Cookie", cookie)
    .attach("file", zip, {
      filename: `${target}.zip`,
      contentType: "application/zip",
    })
    .expect(expectedStatus);
}

describe("incremental admin imports", () => {
  it("accepts both deterministic dummy packages from the fixture generator", async () => {
    const admin = await createAdmin();
    const cookie = await generateAuthCookie(admin.id, "admin");
    await createPlan({
      name: "Dummy Exact Plan",
      description: "Fixture plan",
      weeklyClassTimes: 1,
      englishBackground: 0,
    });
    const fixture = await generateIncrementalImportFixture({
      customerCount: 2,
      instructorCount: 2,
      namespace: "api-test",
      planName: "Dummy Exact Plan",
      startDate: "2026-03-01",
    });
    expect(fixture.customerFiles["customers.csv"]).toContain(
      ",cu0001@example.com,Temp-cu0001,",
    );
    expect(fixture.instructorFiles["instructors.csv"]).toContain(
      ",in0001@example.com,Temp-in0001,",
    );

    const customerResponse = await request(server)
      .post("/admins/import/incremental/customers")
      .set("Cookie", cookie)
      .attach("file", fixture.customerZip, {
        filename: fixture.customerZipFileName,
        contentType: "application/zip",
      })
      .expect(200);
    const instructorResponse = await request(server)
      .post("/admins/import/incremental/instructors")
      .set("Cookie", cookie)
      .attach("file", fixture.instructorZip, {
        filename: fixture.instructorZipFileName,
        contentType: "application/zip",
      })
      .expect(200);

    expect(customerResponse.body.report.importedByFile).toEqual({
      "customers.csv": 2,
      "children.csv": 2,
      "subscriptions.csv": 2,
    });
    expect(instructorResponse.body.report.importedByFile).toEqual({
      "instructors.csv": 2,
      "instructor_fees.csv": 2,
      "instructor_schedules.csv": 4,
    });
  });

  it("atomically adds customers, children, and exact-name subscriptions while preserving existing data", async () => {
    const admin = await createAdmin();
    const cookie = await generateAuthCookie(admin.id, "admin");
    const sentinel = await createCustomer();
    const plan = await createPlan({
      name: "Existing Plan",
      description: "Sentinel plan",
      weeklyClassTimes: 1,
      englishBackground: 0,
    });

    const response = await postIncremental(
      "customers",
      customerPackage(),
      cookie,
      200,
    );

    expect(response.body.operation).toBe("incremental-customers");
    expect(response.body.report.importedByFile).toEqual({
      "customers.csv": 2,
      "children.csv": 2,
      "subscriptions.csv": 2,
    });
    expect(await prisma.customer.findUnique({ where: { id: sentinel.id } })).not
      .toBeNull;
    const imported = await prisma.customer.findUnique({
      where: { email: "customer.one@example.com" },
      include: { children: true, subscription: true },
    });
    expect(imported).toMatchObject({
      name: "Customer One",
      prefecture: "Tokyo",
      hasSeenWelcome: false,
    });
    expect(imported?.password).not.toBe("TempPass1!");
    expect(imported?.emailVerified).toBeInstanceOf(Date);
    expect(imported?.children).toHaveLength(1);
    expect(imported?.subscription[0]).toMatchObject({
      planId: plan.id,
      selectType: "https://example.com/select/1",
    });
  });

  it("atomically adds instructors with fees and grouped slots without absences", async () => {
    const admin = await createAdmin();
    const cookie = await generateAuthCookie(admin.id, "admin");
    const sentinel = await createInstructor();

    const response = await postIncremental(
      "instructors",
      instructorPackage(),
      cookie,
      200,
    );

    expect(response.body.operation).toBe("incremental-instructors");
    expect(response.body.report.importedByFile).toEqual({
      "instructors.csv": 2,
      "instructor_fees.csv": 2,
      "instructor_schedules.csv": 3,
    });
    expect(
      await prisma.instructor.findUnique({ where: { id: sentinel.id } }),
    ).not.toBeNull();
    const imported = await prisma.instructor.findUnique({
      where: { email: "instructor.one@example.com" },
      include: {
        instructorFees: true,
        instructorSchedules: { include: { slots: true } },
        instructorAbsences: true,
      },
    });
    expect(imported?.password).not.toBe("TempPass1!");
    expect(imported?.instructorFees).toHaveLength(1);
    expect(imported?.instructorSchedules).toHaveLength(1);
    expect(imported?.instructorSchedules[0].slots).toHaveLength(2);
    expect(imported?.instructorAbsences).toHaveLength(0);
  });

  it("reports missing files and malformed fields without writing", async () => {
    const admin = await createAdmin();
    const cookie = await generateAuthCookie(admin.id, "admin");
    const response = await postIncremental(
      "customers",
      {
        "customers.csv": [
          customerHeaders.customers,
          "BAD,Customer,not-an-email,password,Tokyo,,maybe",
        ].join("\n"),
      },
      cookie,
      400,
    );

    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "children.csv",
          row: null,
          message: "Missing required file: children.csv",
        }),
        expect.objectContaining({
          file: "customers.csv",
          row: 2,
          column: "email",
        }),
        expect.objectContaining({
          file: "customers.csv",
          row: 2,
          column: "has_seen_welcome",
        }),
      ]),
    );
    expect(await prisma.customer.count()).toBe(0);
  });

  it("reports duplicate upload values and existing database conflicts without writing", async () => {
    const admin = await createAdmin();
    const cookie = await generateAuthCookie(admin.id, "admin");
    await createCustomer({
      email: "conflict@example.com",
      password: "password",
      name: "Existing",
      prefecture: "Tokyo",
      emailVerified: new Date(),
    });
    const files = customerPackage();
    files["customers.csv"] = [
      customerHeaders.customers,
      "CU0001,One,conflict@example.com,password,Tokyo,,false",
      "CU0002,Two,conflict@example.com,password,Osaka,,false",
    ].join("\n");

    const response = await postIncremental("customers", files, cookie, 400);
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "customers.csv",
          row: 3,
          column: "email",
          message: expect.stringContaining("unique"),
        }),
      ]),
    );
    expect(await prisma.customer.count()).toBe(1);
  });

  it("reports absent and ambiguous exact plan names without writing", async () => {
    const admin = await createAdmin();
    const cookie = await generateAuthCookie(admin.id, "admin");
    await createPlan({
      name: "Ambiguous Plan",
      description: "One",
      weeklyClassTimes: 1,
      englishBackground: 0,
    });
    await createPlan({
      name: "Ambiguous Plan",
      description: "Two",
      weeklyClassTimes: 2,
      englishBackground: 1,
    });
    const files = customerPackage();
    files["subscriptions.csv"] = [
      customerHeaders.subscriptions,
      "SU0001,CU0001,Ambiguous Plan,https://example.com/select/1,2026-01-01T00:00:00+09:00,",
      "SU0002,CU0002,Missing Plan,https://example.com/select/2,2026-02-01T00:00:00+09:00,",
    ].join("\n");

    const response = await postIncremental("customers", files, cookie, 400);
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row: 2,
          column: "plan_name",
          message: expect.stringContaining("Multiple"),
        }),
        expect.objectContaining({
          row: 3,
          column: "plan_name",
          message: expect.stringContaining("No existing plan"),
        }),
      ]),
    );
    expect(await prisma.customer.count()).toBe(0);
  });

  it("rolls back primary records when execution fails after insertion starts", async () => {
    await createPlan({
      name: "Existing Plan",
      description: "Plan",
      weeklyClassTimes: 1,
      englishBackground: 0,
    });
    const zip = await zipFiles(customerPackage());

    await expect(
      executeIncrementalImport(zip, "incremental-customers", {
        onPrimaryRecordInserted: (count) => {
          if (count === 1) throw new Error("forced insertion failure");
        },
      }),
    ).rejects.toThrow("forced insertion failure");
    expect(await prisma.customer.count()).toBe(0);
    expect(await prisma.child.count()).toBe(0);
    expect(await prisma.subscription.count()).toBe(0);
  });

  it("rejects non-admin users", async () => {
    const customer = await createCustomer();
    const cookie = await generateAuthCookie(customer.id, "customer");
    await postIncremental("customers", customerPackage(), cookie, 403);
  });

  it("reports existing subscription select_type conflicts", async () => {
    const admin = await createAdmin();
    const cookie = await generateAuthCookie(admin.id, "admin");
    const existingCustomer = await createCustomer();
    const plan = await createPlan({
      name: "Existing Plan",
      description: "Plan",
      weeklyClassTimes: 1,
      englishBackground: 0,
    });
    await createSubscription(plan.id, existingCustomer.id, {
      selectType: "https://example.com/select/1",
    });

    const response = await postIncremental(
      "customers",
      customerPackage(),
      cookie,
      400,
    );
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "subscriptions.csv",
          row: 2,
          column: "select_type",
          message: expect.stringContaining("already exists"),
        }),
      ]),
    );
    expect(await prisma.customer.count()).toBe(1);
  });
});
