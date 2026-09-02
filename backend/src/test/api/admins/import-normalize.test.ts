import { describe, expect, it } from "vitest";
import request from "supertest";
import JSZip from "jszip";
import { Prisma } from "@prisma/client";
import { server } from "../../../server";
import { generateNormalizedImportFixture } from "../../../seed/generateNormalizedImportFixture";
import { validateNormalizedImportFiles } from "../../../services/adminImport";
import {
  getCreatedIdsInInputOrder,
  IMPORT_PRESERVED_TABLES,
  IMPORT_RESET_TABLES,
} from "../../../services/adminImport/execute";
import {
  createAdmin,
  createCustomer,
  createInstructor,
  generateAuthCookie,
} from "../../testUtils";
import { prisma } from "../../setup";
import {
  cancelClassById,
  getRebookableClasses,
} from "../../../services/classesService";

const RAW_HEADER =
  ",英語村,,2020.10.,name,child name,plan,講師名,date,time,class,お子さま誕生日,兄弟お子さま誕生日,年齢,詳細,備考※月2回の場合は週を記入,favorite,,,";
const IMPORT_FILE_SIZE_LIMIT_BYTES = 50 * 1024 * 1024;

describe("normalized import bulk insert ID mapping", () => {
  it("restores input order when createManyAndReturn returns rows out of order", () => {
    expect(
      getCreatedIdsInInputOrder([{ id: 103 }, { id: 101 }, { id: 102 }], 3),
    ).toEqual([101, 102, 103]);
  });

  it("rejects an incomplete bulk insert result", () => {
    expect(() => getCreatedIdsInInputOrder([{ id: 101 }], 2)).toThrow(
      "Bulk insert returned 1 rows; expected 2",
    );
  });
});

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
  it("defines a clean-import policy for every application table", () => {
    const categorizedTables = [
      ...IMPORT_RESET_TABLES,
      ...IMPORT_PRESERVED_TABLES,
    ].sort();
    const applicationTables = Object.values(Prisma.ModelName).sort();

    expect(categorizedTables).toEqual(applicationTables);
  });

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
    const existingInstructor = await createInstructor();
    const authCookie = await generateAuthCookie(admin.id, "admin");
    const existingTag = await prisma.instructorTagCatalog.create({
      data: {
        label: "Existing tag",
        sortOrder: 1,
        createdBy: admin.id,
      },
    });

    await Promise.all([
      prisma.instructorTagAssignment.create({
        data: {
          instructorId: existingInstructor.id,
          tagId: existingTag.id,
          updatedBy: admin.id,
        },
      }),
      prisma.instructorAbsence.create({
        data: {
          instructorId: existingInstructor.id,
          absentAt: new Date("2025-01-01T00:00:00.000Z"),
        },
      }),
      prisma.verificationToken.create({
        data: {
          email: "existing-verification@example.com",
          token: "existing-verification-token",
          expires: new Date("2030-01-01T00:00:00.000Z"),
        },
      }),
      prisma.passwordResetToken.create({
        data: {
          email: "existing-reset@example.com",
          token: "existing-reset-token",
          expires: new Date("2030-01-01T00:00:00.000Z"),
        },
      }),
      prisma.messageBoardPost.create({
        data: {
          target: 0,
          body: "Existing message",
        },
      }),
    ]);

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
      instructorSchedules,
      instructorSlots,
      instructorAbsences,
      instructorTagCatalog,
      instructorTagAssignments,
      events,
      schedules,
      recurringClasses,
      classes,
      recurringClassAttendance,
      classAttendance,
      systemStatuses,
      verificationTokens,
      passwordResetTokens,
      admins,
      messageBoardPosts,
    ] = await Promise.all([
      prisma.plan.count(),
      prisma.customer.count(),
      prisma.child.count(),
      prisma.subscription.count(),
      prisma.instructor.count(),
      prisma.instructorFee.count(),
      prisma.instructorSchedule.count(),
      prisma.instructorSlot.count(),
      prisma.instructorAbsence.count(),
      prisma.instructorTagCatalog.count(),
      prisma.instructorTagAssignment.count(),
      prisma.event.count(),
      prisma.schedule.count(),
      prisma.recurringClass.count(),
      prisma.class.count(),
      prisma.recurringClassAttendance.count(),
      prisma.classAttendance.count(),
      prisma.systemStatus.count(),
      prisma.verificationToken.count(),
      prisma.passwordResetToken.count(),
      prisma.admin.count(),
      prisma.messageBoardPost.count(),
    ]);

    expect(plans).toBe(1);
    expect(customers).toBe(1);
    expect(children).toBe(1);
    expect(subscriptions).toBe(1);
    expect(instructors).toBe(1);
    expect(instructorFees).toBe(1);
    expect(instructorSchedules).toBe(1);
    expect(instructorSlots).toBe(1);
    expect(instructorAbsences).toBe(0);
    expect(instructorTagCatalog).toBe(0);
    expect(instructorTagAssignments).toBe(0);
    expect(events).toBe(1);
    expect(schedules).toBe(1);
    expect(recurringClasses).toBe(1);
    expect(classes).toBe(1);
    expect(recurringClassAttendance).toBe(1);
    expect(classAttendance).toBe(1);
    expect(systemStatuses).toBe(1);
    expect(verificationTokens).toBe(0);
    expect(passwordResetTokens).toBe(0);
    expect(admins).toBe(1);
    expect(messageBoardPosts).toBe(0);

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
      from: "2099-01-01",
      completedUntil: "2099-01-03",
      to: "2099-01-07",
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

    const [completedClasses, bookedClasses] = await Promise.all([
      prisma.class.findMany({ where: { status: "completed" } }),
      prisma.class.findMany({ where: { status: "booked" } }),
    ]);
    expect(
      completedClasses.every(({ rebookableUntil }) => !rebookableUntil),
    ).toBe(true);
    expect(bookedClasses.length).toBeGreaterThan(0);
    expect(
      bookedClasses.every(
        ({ dateTime, rebookableUntil }) =>
          dateTime &&
          rebookableUntil &&
          rebookableUntil.getTime() - dateTime.getTime() ===
            180 * 24 * 60 * 60 * 1000,
      ),
    ).toBe(true);

    const classToCancel = bookedClasses[0];
    await cancelClassById(classToCancel.id);
    const rebookableClasses = await getRebookableClasses(
      classToCancel.customerId,
    );
    expect(rebookableClasses).toContainEqual(
      expect.objectContaining({ id: classToCancel.id }),
    );

    const [classRelationshipMismatches, attendanceRelationshipMismatches] =
      await Promise.all([
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) AS count
          FROM "Class" c
          JOIN "Subscription" s ON s.id = c."subscriptionId"
          JOIN "RecurringClass" rc ON rc.id = c."recurringClassId"
          WHERE c."customerId" <> s."customerId"
             OR rc."subscriptionId" <> c."subscriptionId"
             OR rc."instructorId" <> c."instructorId"
        `,
        prisma.$queryRaw<Array<{ count: bigint }>>`
          SELECT COUNT(*) AS count
          FROM "ClassAttendance" ca
          JOIN "Class" c ON c.id = ca."classId"
          JOIN "Child" child ON child.id = ca."childrenId"
          WHERE c."customerId" <> child."customerId"
        `,
      ]);

    expect(classRelationshipMismatches[0].count).toBe(0n);
    expect(attendanceRelationshipMismatches[0].count).toBe(0n);
  }, 120_000);

  it("scales the deterministic fixture from the instructor count option", async () => {
    const generated = await generateNormalizedImportFixture({
      from: "2026-01-01",
      completedUntil: "2026-01-03",
      to: "2026-01-07",
      instructorCount: 5,
    });

    const validation = validateNormalizedImportFiles(generated.files);
    expect(validation.issues).toEqual([]);
    expect(validation.isValid).toBe(true);
    expect(generated.rows["instructors.csv"]).toHaveLength(5);
    expect(generated.files["instructors.csv"]).toContain(
      ",/images/default-user-icon.jpg?id=in0001,",
    );
    expect(generated.rows["customers.csv"]).toHaveLength(50);
    expect(generated.rows["children.csv"]).toHaveLength(100);
    expect(generated.rows["subscriptions.csv"]).toHaveLength(50);
    expect(generated.rows["recurring_classes.csv"]).toHaveLength(100);
    expect(generated.rows["recurring_class_attendance.csv"]).toHaveLength(200);
    expect(generated.rows["classes.csv"]).toHaveLength(100);
    expect(generated.rows["class_attendance.csv"]).toHaveLength(200);
    expect(generated.rows["instructor_schedules.csv"]).toHaveLength(150);
  });

  it("generates dense UI-review data with compatible plans and instructors", async () => {
    const generated = await generateNormalizedImportFixture({
      from: "2026-01-01",
      completedUntil: "2026-01-03",
      to: "2026-01-07",
    });
    const plans = generated.rows["plans.csv"];
    const subscriptions = generated.rows["subscriptions.csv"];
    const recurringClasses = generated.rows["recurring_classes.csv"];
    const instructors = generated.rows["instructors.csv"];
    const schedules = generated.rows["instructor_schedules.csv"];

    expect(plans).toEqual([
      expect.objectContaining({
        plan_ref: "PL0001",
        name: "月2,180円プラン / 2,180 yen/month Plan",
        weekly_class_times: "1",
        english_background: "0",
      }),
      expect.objectContaining({
        plan_ref: "PL0002",
        name: "月3,180円プラン / 3,180 yen/month Plan",
        weekly_class_times: "2",
        english_background: "0",
      }),
      expect.objectContaining({
        plan_ref: "PL0003",
        name: "月13,980円プラン / 13,980 yen/month Plan Native A",
        weekly_class_times: "2",
        english_background: "1",
      }),
      expect.objectContaining({
        plan_ref: "PL0004",
        name: "月13,980円プラン / 13,980 yen/month Plan Native B",
        weekly_class_times: "2",
        english_background: "2",
      }),
    ]);

    const childCountByCustomer = new Map<string, number>();
    for (const child of generated.rows["children.csv"]) {
      childCountByCustomer.set(
        child.customer_ref,
        (childCountByCustomer.get(child.customer_ref) ?? 0) + 1,
      );
    }
    expect(
      [...childCountByCustomer.values()].every((count) => count === 2),
    ).toBe(true);

    const planByRef = new Map(plans.map((plan) => [plan.plan_ref, plan]));
    const subscriptionByRef = new Map(
      subscriptions.map((subscription) => [
        subscription.subscription_ref,
        subscription,
      ]),
    );
    for (const subscription of subscriptions) {
      const customerIndex = Number(subscription.customer_ref.slice(2));
      expect(subscription.plan_ref).toBe(
        customerIndex % 2 === 1 ? "PL0002" : "PL0003",
      );
    }

    const instructorBackgroundByRef = new Map(
      instructors.map((instructor) => [
        instructor.instructor_ref,
        instructor.english_background,
      ]),
    );
    const recurringCountBySubscription = new Map<string, number>();
    const recurringCountByInstructor = new Map<string, number>();
    const instructorBySubscription = new Map<string, string>();
    const dateTimesBySubscription = new Map<string, Set<string>>();
    const assignedSlotKeys = new Set<string>();
    for (const recurringClass of recurringClasses) {
      const subscription = subscriptionByRef.get(
        recurringClass.subscription_ref,
      );
      const plan = subscription && planByRef.get(subscription.plan_ref);
      expect(plan?.english_background).toBe(
        instructorBackgroundByRef.get(recurringClass.instructor_ref),
      );
      recurringCountBySubscription.set(
        recurringClass.subscription_ref,
        (recurringCountBySubscription.get(recurringClass.subscription_ref) ??
          0) + 1,
      );
      recurringCountByInstructor.set(
        recurringClass.instructor_ref,
        (recurringCountByInstructor.get(recurringClass.instructor_ref) ?? 0) +
          1,
      );
      const assignedInstructor = instructorBySubscription.get(
        recurringClass.subscription_ref,
      );
      expect(
        assignedInstructor === undefined ||
          assignedInstructor === recurringClass.instructor_ref,
      ).toBe(true);
      instructorBySubscription.set(
        recurringClass.subscription_ref,
        recurringClass.instructor_ref,
      );
      const subscriptionDateTimes =
        dateTimesBySubscription.get(recurringClass.subscription_ref) ??
        new Set<string>();
      expect(subscriptionDateTimes.has(recurringClass.start_at)).toBe(false);
      subscriptionDateTimes.add(recurringClass.start_at);
      dateTimesBySubscription.set(
        recurringClass.subscription_ref,
        subscriptionDateTimes,
      );

      const localDate = recurringClass.start_at.slice(0, 10);
      const weekday = new Date(`${localDate}T00:00:00.000Z`).getUTCDay();
      const startTime = recurringClass.start_at.slice(11, 16);
      const slotKey = `${recurringClass.instructor_ref}:${weekday}:${startTime}`;
      expect(assignedSlotKeys.has(slotKey)).toBe(false);
      assignedSlotKeys.add(slotKey);
    }
    expect(
      [...recurringCountBySubscription.values()].every((count) => count === 2),
    ).toBe(true);
    expect(
      [...recurringCountByInstructor.values()].every((count) => count === 20),
    ).toBe(true);

    const scheduleSlotKeys = new Set(
      schedules.map(
        (slot) => `${slot.instructor_ref}:${slot.weekday}:${slot.start_time}`,
      ),
    );
    expect(schedules).toHaveLength(instructors.length * 30);
    expect(
      [...assignedSlotKeys].every((slotKey) => scheduleSlotKeys.has(slotKey)),
    ).toBe(true);
  });

  it("requires at least two instructors for alternating backgrounds", async () => {
    await expect(
      generateNormalizedImportFixture({
        from: "2026-01-01",
        completedUntil: "2026-01-03",
        to: "2026-01-07",
        instructorCount: 1,
      }),
    ).rejects.toThrow("instructorCount must be an integer of at least 2");
  });

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
