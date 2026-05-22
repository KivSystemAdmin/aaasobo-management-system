import { describe, expect, it } from "vitest";
import {
  buildNormalizedPackageZip,
  normalizeRawScheduleCsvToPackage,
  parseCsv,
  validateNormalizedImportFiles,
} from "../../services/adminImport";
import JSZip from "jszip";

const RAW_HEADER =
  ",英語村,,2020.10.,name,child name,plan,講師名,date,time,class,お子さま誕生日,兄弟お子さま誕生日,年齢,詳細,備考※月2回の場合は週を記入,favorite,,,";

function csvEscape(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function rawRow(columns: string[]): string {
  return columns.map(csvEscape).join(",");
}

function csvRows(csv: string): string[][] {
  return parseCsv(csv).filter((row) =>
    row.some((cell) => cell.trim().length > 0),
  );
}

describe("adminImport normalize service", () => {
  it("throws when raw header row is missing", () => {
    expect(() => normalizeRawScheduleCsvToPackage("a,b,c\n1,2,3")).toThrow(
      "Header row for raw schedule CSV not found",
    );
  });

  it("reports warnings for un-normalizable weekday and start time", () => {
    const csv = [
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
        "Funday",
        "invalid-time",
        "R",
        "6/2",
        "",
        "4",
        "",
        "",
        "",
        "tanaka@example.com",
        "",
        "",
      ]),
    ].join("\n");

    const normalized = normalizeRawScheduleCsvToPackage(csv);
    expect(normalized.report.warnings).toHaveLength(2);
    expect(normalized.report.warnings[0]).toContain("Row 2");
    expect(normalized.report.warnings[1]).toContain("Row 2");
  });

  it("generates deterministic unique fallback emails for missing/invalid emails", () => {
    const csv = [
      RAW_HEADER,
      rawRow([
        "",
        "",
        "東京",
        "10/2",
        "田中花子",
        "Mitsuki",
        "1980円（週1回25分）",
        "",
        "Mon",
        "19:00-19:25",
        "R",
        "6/2",
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
        "",
        "Tue",
        "17:00-17:25",
        "R",
        "7/7",
        "",
        "4",
        "",
        "",
        "",
        "not-an-email",
        "",
        "",
      ]),
    ].join("\n");

    const normalized = normalizeRawScheduleCsvToPackage(csv);
    expect(normalized.report.generatedCustomerEmails).toHaveLength(2);
    expect(normalized.report.generatedCustomerEmails[0].generatedEmail).toBe(
      "customer+0001@aaasobo-import.local",
    );
    expect(normalized.report.generatedCustomerEmails[1].generatedEmail).toBe(
      "customer+0002@aaasobo-import.local",
    );

    const customersCsv = normalized.files["customers.csv"];
    expect(customersCsv).toContain("customer+0001@aaasobo-import.local");
    expect(customersCsv).toContain("customer+0002@aaasobo-import.local");
  });

  it("throws on customer reference overflow after 9999 unique customers", () => {
    const rows = [RAW_HEADER];
    for (let i = 1; i <= 10000; i += 1) {
      rows.push(
        rawRow([
          "",
          "",
          "東京",
          "10/2",
          `Customer ${i}`,
          `Child ${i}`,
          "1980円（週1回25分）",
          "",
          "Mon",
          "19:00-19:25",
          "R",
          "6/2",
          "",
          "4",
          "",
          "",
          "",
          `customer${i}@example.com`,
          "",
          "",
        ]),
      );
    }

    expect(() => normalizeRawScheduleCsvToPackage(rows.join("\n"))).toThrow(
      "Reference overflow for prefix CU",
    );
  });

  it("escapes commas, quotes, and newlines in normalized CSV output", () => {
    const csv = [
      RAW_HEADER,
      rawRow([
        "",
        "",
        "東京",
        "10/2",
        "田中花子",
        "Mitsuki",
        "1980円（週1回25分）",
        "",
        "Mon",
        "19:00-19:25",
        "R",
        "6/2",
        "",
        "4",
        "",
        "",
        'Line1, "quoted"\nLine2',
        "tanaka@example.com",
        "",
        "",
      ]),
    ].join("\n");

    const normalized = normalizeRawScheduleCsvToPackage(csv);
    const childrenCsv = normalized.files["children.csv"];
    expect(childrenCsv).toContain('"Line1, ""quoted""');
    expect(childrenCsv).toContain('Line2"');
  });

  it("uses raw detail URLs for subscriptions and instructor names for nicknames", () => {
    const csv = [
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
        "https://select-type.com/my/mmag/ad/u/?id=123",
        "",
        "",
        "tanaka@example.com",
        "",
        "",
      ]),
    ].join("\n");

    const normalized = normalizeRawScheduleCsvToPackage(csv);
    expect(normalized.files["subscriptions.csv"]).toContain(
      "https://select-type.com/my/mmag/ad/u/?id=123",
    );
    expect(normalized.files["instructors.csv"]).toContain("Grace,90000001");
  });

  it("keeps recurring class files header-only by default", () => {
    const csv = [
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
        "",
        "",
        "",
        "tanaka@example.com",
        "",
        "",
      ]),
    ].join("\n");

    const normalized = normalizeRawScheduleCsvToPackage(csv);
    expect(csvRows(normalized.files["recurring_classes.csv"])).toHaveLength(1);
    expect(
      csvRows(normalized.files["recurring_class_attendance.csv"]),
    ).toHaveLength(1);
  });

  it("includes default business calendar event definitions", () => {
    const csv = [
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
        "",
        "",
        "",
        "tanaka@example.com",
        "",
        "",
      ]),
    ].join("\n");

    const normalized = normalizeRawScheduleCsvToPackage(csv);
    expect(csvRows(normalized.files["events.csv"])).toEqual([
      ["event_ref", "name", "color"],
      ["EV0001", "通常授業日 / Regular Class Day", "#FFFFFF"],
      ["EV0002", "お休み / No Class", "#FAD7CD"],
      ["EV0003", "お休み振替対象日 / No Class (Rebookable)", "#FF0000"],
      ["EV0004", "テーマクラスウィーク / Theme Class Week", "#FFFF00"],
    ]);
    expect(normalized.report.normalizedRowsByFile["events.csv"]).toBe(4);
  });

  it("splits parenthesized child names and keeps sibling attendance together", () => {
    const csv = [
      RAW_HEADER,
      rawRow([
        "",
        "",
        "埼玉",
        "10/16",
        "河野麻未",
        "Miyu (Yuna,Haruto)",
        "2180円（週1回25分）",
        "Keziah",
        "Fri",
        "16:00-16:25",
        "R",
        "5/19",
        "12/26",
        "4",
        "https://select-type.com/my/mmag/ad/u/?id=9308472",
        "",
        "Birthday Miyu 5/19 Yuna12/26 Haruto5/9",
        "kono@example.com",
        "",
        "",
      ]),
    ].join("\n");

    const normalized = normalizeRawScheduleCsvToPackage(csv, {
      recurringClasses: {
        startAt: "2026-06-01T00:00:00+09:00",
        customerNames: ["河野麻未"],
        instructorNames: ["Keziah"],
      },
    });

    expect(csvRows(normalized.files["children.csv"])).toEqual([
      ["child_ref", "customer_ref", "name", "birthdate", "personal_info"],
      [
        "CH0001",
        "CU0001",
        "Miyu",
        "2000-05-19",
        "Birthday Miyu 5/19 Yuna12/26 Haruto5/9",
      ],
      [
        "CH0002",
        "CU0001",
        "Yuna",
        "2000-12-26",
        "Birthday Miyu 5/19 Yuna12/26 Haruto5/9",
      ],
      [
        "CH0003",
        "CU0001",
        "Haruto",
        "2000-05-09",
        "Birthday Miyu 5/19 Yuna12/26 Haruto5/9",
      ],
    ]);
    expect(csvRows(normalized.files["recurring_class_attendance.csv"])).toEqual(
      [
        ["recurring_class_ref", "child_ref"],
        ["RC0001", "CH0001"],
        ["RC0001", "CH0002"],
        ["RC0001", "CH0003"],
      ],
    );
  });

  it("uses the recurring start date as the open-ended instructor schedule effective date", () => {
    const csv = [
      RAW_HEADER,
      rawRow([
        "",
        "",
        "東京",
        "10/2",
        "田中花子",
        "Mitsuki",
        "3180円（週2回25分）",
        "Grace",
        "Mon",
        "19:00-19:25",
        "R",
        "6/2",
        "",
        "4",
        "",
        "",
        "",
        "tanaka@example.com",
        "",
        "",
      ]),
    ].join("\n");

    const normalized = normalizeRawScheduleCsvToPackage(csv, {
      recurringClasses: {
        startAt: "2026-06-01T00:00:00+09:00",
      },
    });

    expect(csvRows(normalized.files["instructor_schedules.csv"])).toEqual([
      [
        "instructor_ref",
        "effective_from",
        "effective_to",
        "timezone",
        "weekday",
        "start_time",
      ],
      ["IN0001", "2026-06-01", "", "Asia/Tokyo", "1", "19:00"],
    ]);
    expect(csvRows(normalized.files["plans.csv"])[1]).toEqual([
      "PL0001",
      "月3,180円プラン / 3,180 yen/month Plan",
      "2 classes per week",
      "2",
      "0",
      "",
    ]);
  });

  it("generates filtered recurring classes with the first matching weekly datetime", () => {
    const csv = [
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
        "",
        "",
        "",
        "tanaka@example.com",
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
        "1980円（週1回25分）",
        "Grace",
        "Tue",
        "17:00-17:25",
        "C",
        "7/7",
        "",
        "4",
        "",
        "",
        "",
        "suzuki@example.com",
        "",
        "",
      ]),
    ].join("\n");

    const normalized = normalizeRawScheduleCsvToPackage(csv, {
      recurringClasses: {
        startAt: "2026-06-01T00:00:00+09:00",
        customerNames: ["田中花子"],
        instructorNames: ["Grace"],
        classTypes: ["R"],
      },
    });

    const recurringRows = csvRows(normalized.files["recurring_classes.csv"]);
    expect(recurringRows).toEqual([
      [
        "recurring_class_ref",
        "subscription_ref",
        "instructor_ref",
        "start_at",
        "end_at",
      ],
      ["RC0001", "SU0001", "IN0001", "2026-06-01T19:00:00+09:00", ""],
    ]);

    const attendanceRows = csvRows(
      normalized.files["recurring_class_attendance.csv"],
    );
    expect(attendanceRows).toEqual([
      ["recurring_class_ref", "child_ref"],
      ["RC0001", "CH0001"],
    ]);
    expect(validateNormalizedImportFiles(normalized.files).isValid).toBe(true);
  });

  it("builds a zip that contains all normalized files", async () => {
    const normalized = normalizeRawScheduleCsvToPackage(`${RAW_HEADER}\n`);
    const zipBuffer = await buildNormalizedPackageZip(normalized.files);
    const zip = await JSZip.loadAsync(zipBuffer);
    expect(Object.keys(zip.files).sort()).toEqual(
      Object.keys(normalized.files).sort(),
    );
  });
});
