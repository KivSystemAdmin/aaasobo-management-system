import { describe, expect, it } from "vitest";
import request from "supertest";
import JSZip from "jszip";
import { server } from "../../../server";
import { generateNormalizedImportFixture } from "../../../seed/generateNormalizedImportFixture";
import { validateNormalizedImportFiles } from "../../../services/adminImport";
import {
  createAdmin,
  createCustomer,
  generateAuthCookie,
} from "../../testUtils";
import { prisma } from "../../setup";

const RAW_HEADER =
  ",英語村,,2020.10.,name,child name,plan,講師名,date,time,class,お子さま誕生日,兄弟お子さま誕生日,年齢,詳細,備考※月2回の場合は週を記入,favorite,,,";
const IMPORT_FILE_SIZE_LIMIT_BYTES = 50 * 1024 * 1024;

function rawRow(columns: string[]) {
  return columns.join(",");
}

function buildMinimalNormalizedFiles() {
  return {
    "plans.csv":
      "plan_ref,name,description,weekly_class_times,english_background,termination_at\nPL0001,Starter,Starter plan,1,0,\n",
    "customers.csv":
      "customer_ref,name,email,temp_password,prefecture,termination_at,has_seen_welcome\nCU0001,Customer One,customer.one@example.com,TempPass123!,Tokyo,,false\n",
    "children.csv":
      "child_ref,customer_ref,name,birthdate,personal_info\nCH0001,CU0001,Child One,2016-01-02,\n",
    "subscriptions.csv":
      "subscription_ref,customer_ref,plan_ref,select_type,start_at,end_at\nSU0001,CU0001,PL0001,https://example.com/subscriptions/cu0001-pl0001,2025-01-01T00:00:00+09:00,2025-12-31T00:00:00+09:00\n",
    "instructors.csv":
      "instructor_ref,name,email,temp_password,class_url,icon,nickname,meeting_id,passcode,birthdate,favorite_food,hobby,life_history,message_for_children,skill,working_time,english_background,termination_at\nIN0001,Instructor One,instructor.one@example.com,TempPass456!,https://import.local/class/in0001,https://import.local/icon/in0001.png,instructor_in0001,11111111111,PASS0001,1990-01-01,Sushi,Reading,Life history,Message,Skill,Weekdays,0,\n",
    "instructor_fees.csv":
      "instructor_ref,currency,effective_from,effective_to,trial_fee,regular_fee,cancel_fee,cancel_without_notice_fee,monthly_cancel_fee\nIN0001,PHP,2025-01-01,,75,100,50,100,200\n",
    "instructor_schedules.csv":
      "instructor_ref,effective_from,effective_to,timezone,weekday,start_time\nIN0001,2025-01-01,2025-12-31,Asia/Tokyo,1,09:00\n",
    "instructor_absences.csv": "instructor_ref,absent_at\n",
    "events.csv": "event_ref,name,color\nEV0001,Regular,#00AAFF\n",
    "schedules.csv": "schedule_ref,date,event_ref\nSD0001,2025-01-06,EV0001\n",
    "system_status.csv": "status\nRunning\n",
    "recurring_classes.csv":
      "recurring_class_ref,subscription_ref,instructor_ref,start_at,end_at\nRC0001,SU0001,IN0001,2025-01-06T09:00:00+09:00,2025-12-31T09:00:00+09:00\n",
    "recurring_class_attendance.csv":
      "recurring_class_ref,child_ref\nRC0001,CH0001\n",
    "classes.csv":
      "class_ref,customer_ref,instructor_ref,recurring_class_ref,subscription_ref,date_time,status,rebookable_until,class_code,is_free_trial\nCL0001,CU0001,IN0001,RC0001,SU0001,2025-01-06T09:00:00+09:00,booked,2025-01-06T06:00:00+09:00,class-0001,false\n",
    "class_attendance.csv": "class_ref,child_ref\nCL0001,CH0001\n",
  };
}

async function buildZipBuffer(files: Record<string, string>) {
  const zip = new JSZip();
  for (const [name, content] of Object.entries(files)) {
    zip.file(name, content);
  }
  return zip.generateAsync({ type: "nodebuffer" });
}

describe("POST /admins/import/normalize", () => {
  it("normalizes raw schedule CSV into mandatory normalized files", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const csv = [
      ",,,,,,,,,,,,,,,,,,,",
      RAW_HEADER,
      rawRow([
        "",
        "",
        "東京",
        "10/2",
        "田中花子",
        "Mitsuki",
        "1980円（週1回25分）",
        "Grace",
        "Mon",
        "19:00-19:25",
        "R",
        "6/2",
        "",
        "4",
        "https://example.com/u/1",
        "",
        "Beginner",
        "tanaka@example.com",
        "",
        "",
      ]),
      rawRow([
        "",
        "",
        "",
        "",
        "",
        "Fuka",
        "",
        "Caren",
        "Thu",
        "18:00-18:25",
        "R",
        "3/3",
        "",
        "4",
        "",
        "",
        "",
        "",
        "",
        "",
      ]),
      rawRow([
        "",
        "",
        "大阪",
        "10/3",
        "鈴木一郎",
        "Aoi",
        "1480円（月2回25分）",
        "Elian",
        "Wed",
        "17:30-17:55",
        "R",
        "記載なし",
        "",
        "4",
        "",
        "",
        "Likes songs",
        "",
        "",
        "",
      ]),
    ].join("\n");

    const response = await request(server)
      .post("/admins/import/normalize")
      .set("Cookie", authCookie)
      .attach("file", Buffer.from(csv, "utf-8"), {
        filename: "raw-schedule.csv",
        contentType: "text/csv",
      })
      .expect(200);

    expect(response.body.files).toBeTruthy();
    expect(response.body.jobId).toEqual(expect.any(String));
    expect(Object.keys(response.body.files).sort()).toEqual([
      "children.csv",
      "class_attendance.csv",
      "classes.csv",
      "customers.csv",
      "events.csv",
      "instructor_absences.csv",
      "instructor_fees.csv",
      "instructor_schedules.csv",
      "instructors.csv",
      "plans.csv",
      "recurring_class_attendance.csv",
      "recurring_classes.csv",
      "schedules.csv",
      "subscriptions.csv",
      "system_status.csv",
    ]);

    expect(response.body.report.rawRows).toBe(3);
    expect(response.body.report.normalizedRowsByFile["plans.csv"]).toBe(2);
    expect(response.body.report.normalizedRowsByFile["customers.csv"]).toBe(2);
    expect(response.body.report.normalizedRowsByFile["children.csv"]).toBe(3);
    expect(response.body.report.normalizedRowsByFile["subscriptions.csv"]).toBe(
      2,
    );
    expect(response.body.report.normalizedRowsByFile["instructors.csv"]).toBe(
      3,
    );
    expect(
      response.body.report.normalizedRowsByFile["instructor_fees.csv"],
    ).toBe(3);
    expect(
      response.body.report.normalizedRowsByFile["instructor_schedules.csv"],
    ).toBe(3);
    expect(response.body.report.generatedCustomerEmails).toHaveLength(1);
    expect(response.body.report.generatedCustomerEmails[0].customerName).toBe(
      "鈴木一郎",
    );
    expect(
      response.body.report.generatedCustomerEmails[0].generatedEmail,
    ).toContain("@aaasobo-import.local");

    const customersCsv = response.body.files["customers.csv"] as string;
    expect(customersCsv).toContain("customer_ref,name,email,temp_password");
    expect(customersCsv).toContain("tanaka@example.com");
    expect(customersCsv).toContain("@aaasobo-import.local");

    const plansCsv = response.body.files["plans.csv"] as string;
    expect(plansCsv).toContain("plan_ref,name,description,weekly_class_times");
    expect(plansCsv).toContain("1980円（週1回25分）");
    expect(plansCsv).toContain("1480円（月2回25分）");

    const subscriptionsCsv = response.body.files["subscriptions.csv"] as string;
    expect(subscriptionsCsv).toContain(
      "subscription_ref,customer_ref,plan_ref,select_type,start_at,end_at",
    );

    const instructorFeesCsv = response.body.files[
      "instructor_fees.csv"
    ] as string;
    expect(instructorFeesCsv).toContain(
      "instructor_ref,currency,effective_from,effective_to,trial_fee,regular_fee,cancel_fee,cancel_without_notice_fee,monthly_cancel_fee",
    );
    expect(instructorFeesCsv).toContain("PHP,2020-01-01,,75,100,50,100,200");
  });

  it("downloads normalized files as a zip bundle by jobId", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const normalizeResponse = await request(server)
      .post("/admins/import/normalize")
      .set("Cookie", authCookie)
      .attach("file", Buffer.from(`${RAW_HEADER}\n`, "utf-8"), {
        filename: "raw-schedule.csv",
        contentType: "text/csv",
      })
      .expect(200);

    const jobId = normalizeResponse.body.jobId as string;

    const downloadResponse = await request(server)
      .get(`/admins/import/normalized/${jobId}/download`)
      .set("Cookie", authCookie)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        res.on("end", () => callback(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(downloadResponse.headers["content-type"]).toContain(
      "application/zip",
    );
    expect(downloadResponse.headers["content-disposition"]).toContain(
      `normalized-import-${jobId}.zip`,
    );

    const zip = await JSZip.loadAsync(downloadResponse.body as Buffer);
    const entryNames = Object.keys(zip.files).sort();
    expect(entryNames).toEqual([
      "children.csv",
      "class_attendance.csv",
      "classes.csv",
      "customers.csv",
      "events.csv",
      "instructor_absences.csv",
      "instructor_fees.csv",
      "instructor_schedules.csv",
      "instructors.csv",
      "plans.csv",
      "recurring_class_attendance.csv",
      "recurring_classes.csv",
      "schedules.csv",
      "subscriptions.csv",
      "system_status.csv",
    ]);

    const plansCsv = await zip.file("plans.csv")!.async("string");
    expect(plansCsv).toBe(
      "plan_ref,name,description,weekly_class_times,english_background,termination_at",
    );
  });

  it("returns 404 when normalized package jobId does not exist", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    await request(server)
      .get("/admins/import/normalized/not-a-real-job/download")
      .set("Cookie", authCookie)
      .expect(404);
  });

  it("returns 400 when upload is missing", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    await request(server)
      .post("/admins/import/normalize")
      .set("Cookie", authCookie)
      .expect(400);
  });

  it("returns 413 when uploaded source CSV exceeds max size", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    await request(server)
      .post("/admins/import/normalize")
      .set("Cookie", authCookie)
      .attach("file", Buffer.alloc(IMPORT_FILE_SIZE_LIMIT_BYTES + 1, "a"), {
        filename: "raw-schedule.csv",
        contentType: "text/csv",
      })
      .expect(413);
  });

  it("returns 401 when unauthenticated", async () => {
    await request(server)
      .post("/admins/import/normalize")
      .attach("file", Buffer.from("name,child name,plan\n"), {
        filename: "raw.csv",
        contentType: "text/csv",
      })
      .expect(401);
  });
});

describe("POST /admins/import/execute", () => {
  it("executes normalized package by jobId", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const normalizeResponse = await request(server)
      .post("/admins/import/normalize")
      .set("Cookie", authCookie)
      .attach("file", Buffer.from(`${RAW_HEADER}\n`, "utf-8"), {
        filename: "raw-schedule.csv",
        contentType: "text/csv",
      })
      .expect(200);

    const response = await request(server)
      .post("/admins/import/execute")
      .set("Cookie", authCookie)
      .send({ jobId: normalizeResponse.body.jobId })
      .expect(200);

    expect(response.body.imported).toBe(true);
    expect(response.body.report.rowsByFile["system_status.csv"]).toBe(1);

    const [customers, children, instructors, instructorFees, statuses] =
      await Promise.all([
        prisma.customer.count(),
        prisma.child.count(),
        prisma.instructor.count(),
        prisma.instructorFee.count(),
        prisma.systemStatus.count(),
      ]);
    expect(customers).toBe(0);
    expect(children).toBe(0);
    expect(instructors).toBe(0);
    expect(instructorFees).toBe(0);
    expect(statuses).toBe(1);
  });

  it("returns validation issues when required files are missing in zip", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const zip = new JSZip();
    zip.file(
      "plans.csv",
      "plan_ref,name,description,weekly_class_times,english_background,termination_at\n",
    );
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const response = await request(server)
      .post("/admins/import/execute")
      .set("Cookie", authCookie)
      .attach("file", zipBuffer, {
        filename: "normalized.zip",
        contentType: "application/zip",
      })
      .expect(400);

    expect(response.body.message).toBe("Normalized import validation failed");
    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "customers.csv",
          message: expect.stringContaining("Missing required file"),
        }),
      ]),
    );
  });

  it("returns 413 when uploaded normalized zip exceeds max size", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    await request(server)
      .post("/admins/import/execute")
      .set("Cookie", authCookie)
      .attach("file", Buffer.alloc(IMPORT_FILE_SIZE_LIMIT_BYTES + 1, "a"), {
        filename: "normalized.zip",
        contentType: "application/zip",
      })
      .expect(413);
  });

  it("returns validation issues when cross-file references are broken", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const normalizeResponse = await request(server)
      .post("/admins/import/normalize")
      .set("Cookie", authCookie)
      .attach("file", Buffer.from(`${RAW_HEADER}\n`, "utf-8"), {
        filename: "raw-schedule.csv",
        contentType: "text/csv",
      })
      .expect(200);

    const zip = new JSZip();
    for (const [name, csv] of Object.entries(normalizeResponse.body.files)) {
      zip.file(name, csv as string);
    }
    zip.file(
      "children.csv",
      "child_ref,customer_ref,name,birthdate,personal_info\nCH0001,CU9999,Child,2015-01-01,\n",
    );
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const response = await request(server)
      .post("/admins/import/execute")
      .set("Cookie", authCookie)
      .attach("file", zipBuffer, {
        filename: "normalized.zip",
        contentType: "application/zip",
      })
      .expect(400);

    expect(response.body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          file: "children.csv",
          column: "customer_ref",
          message: expect.stringContaining("does not exist in customers.csv"),
        }),
      ]),
    );
  });

  it("imports a normalized zip and persists cross-entity relationships", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const zipBuffer = await buildZipBuffer(buildMinimalNormalizedFiles());

    const response = await request(server)
      .post("/admins/import/execute")
      .set("Cookie", authCookie)
      .attach("file", zipBuffer, {
        filename: "normalized.zip",
        contentType: "application/zip",
      })
      .expect(200);

    expect(response.body.imported).toBe(true);

    const [
      plans,
      customers,
      children,
      subscriptions,
      instructors,
      instructorFees,
      schedules,
      recurringClasses,
      classes,
      recurringClassAttendance,
      classAttendance,
      status,
    ] = await Promise.all([
      prisma.plan.count(),
      prisma.customer.count(),
      prisma.child.count(),
      prisma.subscription.count(),
      prisma.instructor.count(),
      prisma.instructorFee.count(),
      prisma.schedule.count(),
      prisma.recurringClass.count(),
      prisma.class.count(),
      prisma.recurringClassAttendance.count(),
      prisma.classAttendance.count(),
      prisma.systemStatus.findFirst(),
    ]);

    expect(plans).toBe(1);
    expect(customers).toBe(1);
    expect(children).toBe(1);
    expect(subscriptions).toBe(1);
    expect(instructors).toBe(1);
    expect(instructorFees).toBe(1);
    expect(schedules).toBe(1);
    expect(recurringClasses).toBe(1);
    expect(classes).toBe(1);
    expect(recurringClassAttendance).toBe(1);
    expect(classAttendance).toBe(1);
    expect(status?.status).toBe("Running");

    const importedClass = await prisma.class.findFirst({
      include: {
        customer: true,
        instructor: true,
        subscription: true,
        recurringClass: true,
      },
    });
    expect(importedClass?.customer.email).toBe("customer.one@example.com");
    expect(importedClass?.instructor?.email).toBe("instructor.one@example.com");
    expect(importedClass?.subscriptionId).toBeTruthy();
    expect(importedClass?.recurringClassId).toBeTruthy();

    const importedCustomer = await prisma.customer.findFirstOrThrow({
      where: { email: "customer.one@example.com" },
    });
    expect(importedCustomer.password).not.toBe("TempPass123!");
    expect(importedCustomer.password.startsWith("$2")).toBe(true);

    const importedInstructorFee = await prisma.instructorFee.findFirstOrThrow({
      include: { instructor: true },
    });
    expect(importedInstructorFee.instructor.email).toBe(
      "instructor.one@example.com",
    );
    expect(importedInstructorFee.currency).toBe("PHP");
    expect(importedInstructorFee.effectiveTo).toBeNull();
    expect(importedInstructorFee.trialFee).toBe(75);
    expect(importedInstructorFee.regularFee).toBe(100);
    expect(importedInstructorFee.cancelFee).toBe(50);
    expect(importedInstructorFee.cancelWithoutNoticeFee).toBe(100);
  });

  it("imports the deterministic normalized fixture generated by the seed script", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const generated = await generateNormalizedImportFixture({
      from: "2026-01-01",
      completedUntil: "2026-01-03",
      to: "2026-01-07",
    });

    const validation = validateNormalizedImportFiles(generated.files);
    expect(validation.issues).toEqual([]);
    expect(validation.isValid).toBe(true);

    const zipBuffer = await buildZipBuffer(generated.files);
    const response = await request(server)
      .post("/admins/import/execute")
      .set("Cookie", authCookie)
      .attach("file", zipBuffer, {
        filename: generated.zipFileName,
        contentType: "application/zip",
      })
      .expect(200);

    expect(response.body.imported).toBe(true);

    const [
      plans,
      customers,
      children,
      subscriptions,
      instructors,
      instructorFees,
      instructorSchedules,
      instructorSlots,
      recurringClasses,
      classes,
      recurringClassAttendance,
      classAttendance,
    ] = await Promise.all([
      prisma.plan.count(),
      prisma.customer.count(),
      prisma.child.count(),
      prisma.subscription.count(),
      prisma.instructor.count(),
      prisma.instructorFee.count(),
      prisma.instructorSchedule.count(),
      prisma.instructorSlot.count(),
      prisma.recurringClass.count(),
      prisma.class.count(),
      prisma.recurringClassAttendance.count(),
      prisma.classAttendance.count(),
    ]);

    expect(plans).toBe(generated.rows["plans.csv"].length);
    expect(customers).toBe(generated.rows["customers.csv"].length);
    expect(children).toBe(generated.rows["children.csv"].length);
    expect(subscriptions).toBe(generated.rows["subscriptions.csv"].length);
    expect(instructors).toBe(generated.rows["instructors.csv"].length);
    expect(instructorFees).toBe(generated.rows["instructor_fees.csv"].length);
    expect(instructorSchedules).toBe(generated.rows["instructors.csv"].length);
    expect(instructorSlots).toBe(
      generated.rows["instructor_schedules.csv"].length,
    );
    expect(recurringClasses).toBe(
      generated.rows["recurring_classes.csv"].length,
    );
    expect(classes).toBe(generated.rows["classes.csv"].length);
    expect(recurringClassAttendance).toBe(
      generated.rows["recurring_class_attendance.csv"].length,
    );
    expect(classAttendance).toBe(generated.rows["class_attendance.csv"].length);
  }, 120_000);

  it("accepts multiple slot rows that share the same instructor schedule key", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    const files = buildMinimalNormalizedFiles();
    files["instructor_schedules.csv"] = [
      "instructor_ref,effective_from,effective_to,timezone,weekday,start_time",
      "IN0001,2025-01-01,2025-12-31,Asia/Tokyo,1,09:00",
      "IN0001,2025-01-01,2025-12-31,Asia/Tokyo,3,09:30",
      "",
    ].join("\n");
    const zipBuffer = await buildZipBuffer(files);

    const response = await request(server)
      .post("/admins/import/execute")
      .set("Cookie", authCookie)
      .attach("file", zipBuffer, {
        filename: "normalized.zip",
        contentType: "application/zip",
      })
      .expect(200);

    expect(response.body.imported).toBe(true);

    const [scheduleCount, slotCount] = await Promise.all([
      prisma.instructorSchedule.count(),
      prisma.instructorSlot.count(),
    ]);

    expect(scheduleCount).toBe(1);
    expect(slotCount).toBe(2);
  });

  it("preserves all admins during full reset import", async () => {
    const admin1 = await createAdmin({
      name: "Seed Admin 1",
      email: "admin@example.com",
      password: "SeedAdminPass1!",
    });
    const admin2 = await createAdmin({
      name: "Seed Admin 2",
      email: "admin2@example.com",
      password: "SeedAdminPass2!",
    });
    const admin3 = await createAdmin({
      name: "Temporary Admin",
      email: "temporary-admin@example.com",
      password: "TemporaryPass1!",
    });
    const authCookie = await generateAuthCookie(admin3.id, "admin");

    const adminsBefore = await prisma.admin.findMany({
      orderBy: { email: "asc" },
    });
    const passwordsBeforeByEmail = new Map(
      adminsBefore.map((item) => [item.email, item.password]),
    );

    const zipBuffer = await buildZipBuffer(buildMinimalNormalizedFiles());

    await request(server)
      .post("/admins/import/execute")
      .set("Cookie", authCookie)
      .attach("file", zipBuffer, {
        filename: "normalized.zip",
        contentType: "application/zip",
      })
      .expect(200);

    const adminsAfter = await prisma.admin.findMany({
      orderBy: { email: "asc" },
    });
    const emailsAfter = adminsAfter.map((item) => item.email);

    expect(emailsAfter).toEqual([
      "admin2@example.com",
      "admin@example.com",
      "temporary-admin@example.com",
    ]);

    const passwordsAfterByEmail = new Map(
      adminsAfter.map((item) => [item.email, item.password]),
    );
    for (const [email, password] of passwordsBeforeByEmail) {
      expect(passwordsAfterByEmail.get(email)).toBe(password);
    }
    expect(admin1.email).toBe("admin@example.com");
    expect(admin2.email).toBe("admin2@example.com");
    expect(admin3.email).toBe("temporary-admin@example.com");
  });

  it("rolls back reset and inserts when import fails mid-transaction", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const existingCustomer = await createCustomer({
      name: "Existing Customer",
      email: "existing.customer@example.com",
      password: "ExistingPass1!",
      prefecture: "Tokyo",
      emailVerified: null,
    });

    const files = buildMinimalNormalizedFiles();
    files["instructor_schedules.csv"] = [
      "instructor_ref,effective_from,effective_to,timezone,weekday,start_time",
      "IN0001,2025-01-01,2025-12-31,Asia/Tokyo,1,09:00",
      "IN0001,2025-02-01,2025-12-31,UTC,2,10:00",
      "",
    ].join("\n");
    const zipBuffer = await buildZipBuffer(files);

    await request(server)
      .post("/admins/import/execute")
      .set("Cookie", authCookie)
      .attach("file", zipBuffer, {
        filename: "normalized.zip",
        contentType: "application/zip",
      })
      .expect(500);

    const [customerAfter, plansCount, systemStatusCount, instructorCount] =
      await Promise.all([
        prisma.customer.findUnique({
          where: { id: existingCustomer.id },
        }),
        prisma.plan.count(),
        prisma.systemStatus.count(),
        prisma.instructor.count(),
      ]);

    expect(customerAfter?.email).toBe("existing.customer@example.com");
    expect(plansCount).toBe(0);
    expect(systemStatusCount).toBe(0);
    expect(instructorCount).toBe(0);
  });
});
