import { describe, expect, it } from "vitest";
import request from "supertest";
import { server } from "../../../server";
import { createAdmin, generateAuthCookie } from "../../testUtils";

const RAW_HEADER =
  ",英語村,,2020.10.,name,child name,plan,講師名,date,time,class,お子さま誕生日,兄弟お子さま誕生日,年齢,詳細,備考※月2回の場合は週を記入,favorite,,,";

function rawRow(columns: string[]) {
  return columns.join(",");
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
    expect(Object.keys(response.body.files).sort()).toEqual([
      "children.csv",
      "class_attendance.csv",
      "classes.csv",
      "customers.csv",
      "events.csv",
      "instructor_absences.csv",
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
  });

  it("returns 400 when upload is missing", async () => {
    const admin = await createAdmin();
    const authCookie = await generateAuthCookie(admin.id, "admin");

    await request(server)
      .post("/admins/import/normalize")
      .set("Cookie", authCookie)
      .expect(400);
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
