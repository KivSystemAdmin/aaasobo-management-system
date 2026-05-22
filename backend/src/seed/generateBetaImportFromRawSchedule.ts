import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import {
  buildNormalizedPackageZip,
  normalizeRawScheduleCsvToPackage,
  parseCsv,
  validateNormalizedImportFiles,
  type NormalizedFileName,
} from "../services/adminImport";

const SOURCE_FILE = "20250818_(Main) AaasoBo!schedule.xlsx - Data base.csv";
const FEE_SOURCE_WORKBOOK = "20240817_(Main) AaasoBo!schedule.xlsx";
const OUTPUT_DIR = "beta-release-import";
const NORMALIZED_DIR = path.join(OUTPUT_DIR, "normalized");
const RAW_OUTPUT_FILE = "raw-beta-customers-20250818.csv";
const ZIP_OUTPUT_FILE = "normalized-beta-import-20250818.zip";

const SELECTED_CUSTOMERS = ["河野麻未", "高坂博章"];
const SELECTED_INSTRUCTORS = ["Keziah", "Elian", "Zee", "Kang", "Rhoselle"];
const DEFAULT_RECURRING_TIMEZONE_OFFSET = "+09:00";

type CsvObjectRow = Record<string, string>;
type InstructorFeeTemplate = {
  trial_fee: string;
  regular_fee: string;
  cancel_fee: string;
  cancel_without_notice_fee: string;
  monthly_cancel_fee: string;
};

function csvEscape(value: string | undefined): string {
  const normalized = value ?? "";
  if (
    normalized.includes(",") ||
    normalized.includes('"') ||
    normalized.includes("\n") ||
    normalized.includes("\r")
  ) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

function toCsv(rows: string[][]): string {
  return `${rows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`;
}

function parseCliOption(name: string): string | undefined {
  const prefix = `--${name}=`;
  const inlineValue = process.argv.find((arg) => arg.startsWith(prefix));
  if (inlineValue) {
    return inlineValue.slice(prefix.length).trim();
  }

  const optionIndex = process.argv.indexOf(`--${name}`);
  if (optionIndex >= 0) {
    return process.argv[optionIndex + 1]?.trim();
  }

  return undefined;
}

function requireIsoDate(value: string, optionName: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${optionName} must use YYYY-MM-DD format.`);
  }
}

function normalizeRecurringStartAt(): string {
  const startAt =
    parseCliOption("start-at") ?? process.env.BETA_IMPORT_START_AT?.trim();
  if (startAt) {
    if (
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(
        startAt,
      )
    ) {
      throw new Error(
        "--start-at must use ISO datetime format with timezone, for example 2026-06-01T00:00:00+09:00.",
      );
    }
    return startAt;
  }

  const startDate =
    parseCliOption("start-date") ?? process.env.BETA_IMPORT_START_DATE?.trim();
  if (!startDate) {
    throw new Error(
      "Missing beta import start date. Provide --start-date=YYYY-MM-DD, --start-at=YYYY-MM-DDTHH:mm:ss+09:00, BETA_IMPORT_START_DATE, or BETA_IMPORT_START_AT.",
    );
  }

  requireIsoDate(startDate, "--start-date");
  return `${startDate}T00:00:00${DEFAULT_RECURRING_TIMEZONE_OFFSET}`;
}

function rowsFromCsv(csv: string): {
  header: string[];
  rows: CsvObjectRow[];
} {
  const parsed = parseCsv(csv);
  const header = parsed[0] ?? [];
  const rows = parsed
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) =>
      Object.fromEntries(
        header.map((column, index) => [column, row[index] ?? ""]),
      ),
    );
  return { header, rows };
}

function csvFromRows(header: string[], rows: CsvObjectRow[]): string {
  return toCsv([
    header,
    ...rows.map((row) => header.map((column) => row[column] ?? "")),
  ]);
}

function decodeXml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function readXlsxEntry(workbookPath: string, entryPath: string): string {
  return execFileSync("unzip", ["-p", workbookPath, entryPath], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
}

function sharedStringsFromWorkbook(workbookPath: string): string[] {
  const xml = readXlsxEntry(workbookPath, "xl/sharedStrings.xml");
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((textMatch) => decodeXml(textMatch[1]))
      .join(""),
  );
}

function columnIndex(column: string): number {
  return column
    .split("")
    .reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0);
}

function parseWorksheetRows(
  workbookPath: string,
  worksheetPath: string,
): Record<string, string>[] {
  const sharedStrings = sharedStringsFromWorkbook(workbookPath);
  const xml = readXlsxEntry(workbookPath, worksheetPath);
  const rows: Record<string, string>[] = [];

  for (const rowMatch of xml.matchAll(
    /<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g,
  )) {
    const row: Record<string, string> = {};
    for (const cellMatch of rowMatch[2].matchAll(
      /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,
    )) {
      const ref = cellMatch[1].match(/\br="([A-Z]+)\d+"/)?.[1];
      if (!ref) {
        continue;
      }
      const rawValue = cellMatch[2]?.match(/<v>([\s\S]*?)<\/v>/)?.[1] ?? "";
      const type = cellMatch[1].match(/\bt="([^"]+)"/)?.[1];
      const value =
        type === "s" && rawValue
          ? sharedStrings[Number(rawValue)] ?? ""
          : decodeXml(rawValue);
      row[ref] = value;
    }
    rows[Number(rowMatch[1]) - 1] = row;
  }

  return rows;
}

function normalizeMoney(value: string | undefined): string {
  const amount = Math.abs(Number(value ?? "0"));
  return Number.isFinite(amount) ? String(Math.trunc(amount)) : "0";
}

function dateOnlyFromDateTime(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    throw new Error(`Invalid ISO datetime: ${value}`);
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

export function extractInstructorFeesFromWorkbook(
  workbookPath: string,
): Map<string, InstructorFeeTemplate> {
  const rows = parseWorksheetRows(workbookPath, "xl/worksheets/sheet3.xml");
  const headerRow = rows.find((row) => row.U === "Instrucotr");
  if (!headerRow) {
    throw new Error("Instructor fee header row was not found in スケ作成");
  }

  const fees = new Map<string, InstructorFeeTemplate>();
  for (const row of rows) {
    const instructorName = row.U?.trim();
    if (!instructorName || instructorName === "Instrucotr") {
      continue;
    }
    fees.set(instructorName, {
      trial_fee: normalizeMoney(row.V),
      regular_fee: normalizeMoney(row.W),
      cancel_fee: normalizeMoney(row.X),
      cancel_without_notice_fee: normalizeMoney(row.Y),
      monthly_cancel_fee: "200",
    });
  }
  return fees;
}

function filterNormalizedFiles(
  files: Record<string, string>,
  instructorFeesByName: Map<string, InstructorFeeTemplate>,
  recurringStartAt: string,
): Record<NormalizedFileName, string> {
  const selectedCustomers = new Set(SELECTED_CUSTOMERS);
  const selectedInstructors = new Set(SELECTED_INSTRUCTORS);
  const parsed = Object.fromEntries(
    Object.entries(files).map(([fileName, csv]) => [
      fileName,
      rowsFromCsv(csv),
    ]),
  );

  const customers = parsed["customers.csv"].rows.filter((row) =>
    selectedCustomers.has(row.name),
  );
  const customerRefs = new Set(customers.map((row) => row.customer_ref));
  const children = parsed["children.csv"].rows.filter((row) =>
    customerRefs.has(row.customer_ref),
  );
  const childRefs = new Set(children.map((row) => row.child_ref));
  const subscriptions = parsed["subscriptions.csv"].rows.filter((row) =>
    customerRefs.has(row.customer_ref),
  );
  const subscriptionRefs = new Set(
    subscriptions.map((row) => row.subscription_ref),
  );
  const planRefs = new Set(subscriptions.map((row) => row.plan_ref));
  const instructors = parsed["instructors.csv"].rows.filter((row) =>
    selectedInstructors.has(row.name),
  );
  const instructorRefs = new Set(instructors.map((row) => row.instructor_ref));
  const instructorNameByRef = new Map(
    instructors.map((row) => [row.instructor_ref, row.name]),
  );
  const instructorFees = parsed["instructor_fees.csv"].rows
    .filter((row) => instructorRefs.has(row.instructor_ref))
    .map((row) => {
      const instructorName = instructorNameByRef.get(row.instructor_ref);
      const fee = instructorName
        ? instructorFeesByName.get(instructorName)
        : undefined;
      return fee
        ? {
            ...row,
            effective_from: dateOnlyFromDateTime(recurringStartAt),
            effective_to: "",
            trial_fee: fee.trial_fee,
            regular_fee: fee.regular_fee,
            cancel_fee: fee.cancel_fee,
            cancel_without_notice_fee: fee.cancel_without_notice_fee,
            monthly_cancel_fee: fee.monthly_cancel_fee,
          }
        : row;
    });
  const recurringClasses = parsed["recurring_classes.csv"].rows.filter(
    (row) =>
      subscriptionRefs.has(row.subscription_ref) &&
      instructorRefs.has(row.instructor_ref),
  );
  const recurringClassRefs = new Set(
    recurringClasses.map((row) => row.recurring_class_ref),
  );

  return {
    "plans.csv": csvFromRows(
      parsed["plans.csv"].header,
      parsed["plans.csv"].rows.filter((row) => planRefs.has(row.plan_ref)),
    ),
    "customers.csv": csvFromRows(parsed["customers.csv"].header, customers),
    "children.csv": csvFromRows(parsed["children.csv"].header, children),
    "subscriptions.csv": csvFromRows(
      parsed["subscriptions.csv"].header,
      subscriptions,
    ),
    "instructors.csv": csvFromRows(
      parsed["instructors.csv"].header,
      instructors,
    ),
    "instructor_fees.csv": csvFromRows(
      parsed["instructor_fees.csv"].header,
      instructorFees,
    ),
    "instructor_schedules.csv": csvFromRows(
      parsed["instructor_schedules.csv"].header,
      parsed["instructor_schedules.csv"].rows.filter((row) =>
        instructorRefs.has(row.instructor_ref),
      ),
    ),
    "instructor_absences.csv": csvFromRows(
      parsed["instructor_absences.csv"].header,
      [],
    ),
    "events.csv": csvFromRows(
      parsed["events.csv"].header,
      parsed["events.csv"].rows,
    ),
    "schedules.csv": csvFromRows(parsed["schedules.csv"].header, []),
    "system_status.csv": csvFromRows(
      parsed["system_status.csv"].header,
      parsed["system_status.csv"].rows,
    ),
    "recurring_classes.csv": csvFromRows(
      parsed["recurring_classes.csv"].header,
      recurringClasses,
    ),
    "recurring_class_attendance.csv": csvFromRows(
      parsed["recurring_class_attendance.csv"].header,
      parsed["recurring_class_attendance.csv"].rows.filter(
        (row) =>
          recurringClassRefs.has(row.recurring_class_ref) &&
          childRefs.has(row.child_ref),
      ),
    ),
    "classes.csv": csvFromRows(parsed["classes.csv"].header, []),
    "class_attendance.csv": csvFromRows(
      parsed["class_attendance.csv"].header,
      [],
    ),
  };
}

function isRawHeaderRow(row: string[]): boolean {
  const normalized = row.map((cell) => cell.trim().toLowerCase());
  return (
    normalized.includes("name") &&
    normalized.includes("child name") &&
    normalized.includes("plan")
  );
}

function buildFilteredRawCsv(rawCsv: string): string {
  const selectedCustomers = new Set(SELECTED_CUSTOMERS);
  const rows = parseCsv(rawCsv);
  const headerIndex = rows.findIndex(isRawHeaderRow);
  if (headerIndex < 0) {
    throw new Error("Header row for raw schedule CSV not found");
  }

  const filteredRows = rows.slice(0, headerIndex + 1);
  let currentCustomerName = "";
  for (const row of rows.slice(headerIndex + 1)) {
    const customerName = (row[4] ?? "").trim();
    if (customerName) {
      currentCustomerName = customerName;
    }
    if (
      selectedCustomers.has(currentCustomerName) &&
      row.some((cell) => cell.trim().length > 0)
    ) {
      filteredRows.push(row);
    }
  }

  return toCsv(filteredRows);
}

async function main() {
  const repoRoot = path.resolve(__dirname, "../../..");
  const sourcePath = path.join(repoRoot, SOURCE_FILE);
  const outputDir = path.join(repoRoot, OUTPUT_DIR);
  const normalizedDir = path.join(repoRoot, NORMALIZED_DIR);
  const recurringStartAt = normalizeRecurringStartAt();

  const rawCsv = fs.readFileSync(sourcePath, "utf8");
  const instructorFeesByName = extractInstructorFeesFromWorkbook(
    path.join(repoRoot, FEE_SOURCE_WORKBOOK),
  );
  const normalized = normalizeRawScheduleCsvToPackage(rawCsv, {
    recurringClasses: {
      startAt: recurringStartAt,
      customerNames: SELECTED_CUSTOMERS,
      instructorNames: SELECTED_INSTRUCTORS,
      classTypes: ["R"],
    },
  });

  const files = filterNormalizedFiles(
    normalized.files,
    instructorFeesByName,
    recurringStartAt,
  );
  const validation = validateNormalizedImportFiles(files);
  if (!validation.isValid) {
    throw new Error(
      `Generated normalized files are invalid: ${JSON.stringify(
        validation.issues,
        null,
        2,
      )}`,
    );
  }

  fs.mkdirSync(normalizedDir, { recursive: true });
  fs.writeFileSync(
    path.join(outputDir, RAW_OUTPUT_FILE),
    buildFilteredRawCsv(rawCsv),
    "utf8",
  );

  for (const [fileName, csv] of Object.entries(files)) {
    fs.writeFileSync(path.join(normalizedDir, fileName), csv, "utf8");
  }

  const zipBuffer = await buildNormalizedPackageZip(files);
  fs.writeFileSync(path.join(outputDir, ZIP_OUTPUT_FILE), zipBuffer);

  const summary = {
    source: SOURCE_FILE,
    feeSource: FEE_SOURCE_WORKBOOK,
    selectedCustomers: SELECTED_CUSTOMERS,
    selectedInstructors: SELECTED_INSTRUCTORS,
    recurringStartAt,
    outputs: {
      rawCsv: path.join(OUTPUT_DIR, RAW_OUTPUT_FILE),
      normalizedDirectory: NORMALIZED_DIR,
      normalizedZip: path.join(OUTPUT_DIR, ZIP_OUTPUT_FILE),
    },
    rowsByFile: validation.report.rowsByFile,
  };

  fs.writeFileSync(
    path.join(outputDir, "summary.json"),
    `${JSON.stringify(summary, null, 2)}\n`,
    "utf8",
  );
  console.log(JSON.stringify(summary, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
