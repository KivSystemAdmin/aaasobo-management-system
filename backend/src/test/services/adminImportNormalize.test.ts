import { describe, expect, it } from "vitest";
import {
  buildNormalizedPackageZip,
  normalizeRawScheduleCsvToPackage,
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

  it("builds a zip that contains all normalized files", async () => {
    const normalized = normalizeRawScheduleCsvToPackage(`${RAW_HEADER}\n`);
    const zipBuffer = await buildNormalizedPackageZip(normalized.files);
    const zip = await JSZip.loadAsync(zipBuffer);
    expect(Object.keys(zip.files).sort()).toEqual(
      Object.keys(normalized.files).sort(),
    );
  });
});
