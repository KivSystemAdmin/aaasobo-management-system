import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { NORMALIZED_HEADERS } from "../services/adminImport/normalize";

type CustomerFileName = "customers.csv" | "children.csv" | "subscriptions.csv";
type InstructorFileName =
  | "instructors.csv"
  | "instructor_fees.csv"
  | "instructor_schedules.csv";

type CsvRow = Record<string, string>;

const CUSTOMER_FILES: readonly CustomerFileName[] = [
  "customers.csv",
  "children.csv",
  "subscriptions.csv",
];
const INSTRUCTOR_FILES: readonly InstructorFileName[] = [
  "instructors.csv",
  "instructor_fees.csv",
  "instructor_schedules.csv",
];
const DEFAULT_PLAN_NAME = "月5,980円プラン / 5,980 yen/month Plan";
const DEFAULT_START_DATE = "2026-01-01";
const DEFAULT_COUNT = 5;
const MAX_COUNT = 99_999;

const HEADERS: Record<
  CustomerFileName | InstructorFileName,
  readonly string[]
> = {
  "customers.csv": NORMALIZED_HEADERS["customers.csv"],
  "children.csv": NORMALIZED_HEADERS["children.csv"],
  "subscriptions.csv": NORMALIZED_HEADERS["subscriptions.csv"].map((header) =>
    header === "plan_ref" ? "plan_name" : header,
  ),
  "instructors.csv": NORMALIZED_HEADERS["instructors.csv"],
  "instructor_fees.csv": NORMALIZED_HEADERS["instructor_fees.csv"],
  "instructor_schedules.csv": NORMALIZED_HEADERS["instructor_schedules.csv"],
};

export type GenerateIncrementalImportFixtureOptions = {
  customerCount?: number;
  instructorCount?: number;
  namespace?: string;
  planName?: string;
  startDate?: string;
};

export type GeneratedIncrementalImportFixture = {
  customerFiles: Record<CustomerFileName, string>;
  instructorFiles: Record<InstructorFileName, string>;
  customerZip: Buffer;
  instructorZip: Buffer;
  customerZipFileName: string;
  instructorZipFileName: string;
};

type CliArgs = Required<GenerateIncrementalImportFixtureOptions> & {
  outDir: string;
};

function validateCount(label: string, count: number) {
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX_COUNT) {
    throw new Error(`${label} must be an integer between 1 and ${MAX_COUNT}`);
  }
}

function validateStartDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("startDate must be YYYY-MM-DD");
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    !parsed.toISOString().startsWith(value)
  ) {
    throw new Error("startDate must be a valid calendar date");
  }
}

function validateNamespace(value: string) {
  if (!/^[a-z0-9-]+$/.test(value)) {
    throw new Error(
      "namespace must contain only lowercase letters, numbers, and hyphens",
    );
  }
}

function csvEscape(value: string) {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

function toCsv(
  fileName: CustomerFileName | InstructorFileName,
  rows: CsvRow[],
) {
  const headers = HEADERS[fileName];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header] ?? "")).join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

function ref(prefix: "CU" | "CH" | "SU" | "IN", index: number) {
  return `${prefix}${String(index).padStart(4, "0")}`;
}

function padded(index: number) {
  return String(index).padStart(5, "0");
}

function namespaceCode(namespace: string) {
  let hash = 0;
  for (const character of namespace) {
    hash = (hash * 31 + character.charCodeAt(0)) % 100_000;
  }
  return String(hash).padStart(5, "0");
}

function customerRows(
  count: number,
  namespace: string,
  planName: string,
  startDate: string,
) {
  const customers: CsvRow[] = [];
  const children: CsvRow[] = [];
  const subscriptions: CsvRow[] = [];

  for (let index = 1; index <= count; index += 1) {
    const suffix = padded(index);
    const customerRef = ref("CU", index);
    const lowerRef = customerRef.toLowerCase();
    customers.push({
      customer_ref: customerRef,
      name: `Incremental Customer ${suffix}`,
      email: `${lowerRef}@example.com`,
      temp_password: `Temp-${lowerRef}`,
      prefecture: index % 2 === 0 ? "Osaka" : "Tokyo",
      termination_at: "",
      has_seen_welcome: index % 2 === 0 ? "true" : "false",
    });
    children.push({
      child_ref: ref("CH", index),
      customer_ref: customerRef,
      name: `Child ${suffix}`,
      birthdate: `2015-01-${String(((index - 1) % 28) + 1).padStart(2, "0")}`,
      personal_info: `Dummy child for ${namespace}`,
    });
    subscriptions.push({
      subscription_ref: ref("SU", index),
      customer_ref: customerRef,
      plan_name: planName,
      select_type: `https://example.com/incremental/${namespace}/subscriptions/${suffix}`,
      start_at: `${startDate}T00:00:00+09:00`,
      end_at: "",
    });
  }

  return {
    "customers.csv": toCsv("customers.csv", customers),
    "children.csv": toCsv("children.csv", children),
    "subscriptions.csv": toCsv("subscriptions.csv", subscriptions),
  } satisfies Record<CustomerFileName, string>;
}

function instructorRows(count: number, namespace: string, startDate: string) {
  const instructors: CsvRow[] = [];
  const fees: CsvRow[] = [];
  const schedules: CsvRow[] = [];
  const code = namespaceCode(namespace);

  for (let index = 1; index <= count; index += 1) {
    const suffix = padded(index);
    const instructorRef = ref("IN", index);
    const lowerRef = instructorRef.toLowerCase();
    instructors.push({
      instructor_ref: instructorRef,
      name: `Incremental Instructor ${suffix}`,
      email: `${lowerRef}@example.com`,
      temp_password: `Temp-${lowerRef}`,
      class_url: `https://example.com/incremental/${namespace}/classes/${suffix}`,
      icon: `https://example.com/incremental/${namespace}/icons/${suffix}.png`,
      nickname: `dummy_${namespace}_${suffix}`,
      meeting_id: `8${code}${suffix}`,
      passcode: `P${code}${suffix}`,
      birthdate: `1990-01-${String(((index - 1) % 28) + 1).padStart(2, "0")}`,
      favorite_food: "Sushi",
      hobby: "Reading",
      life_history: "Deterministic dummy instructor",
      message_for_children: "Let us enjoy learning English!",
      skill: "Conversation",
      working_time: "Weekdays",
      english_background: String((index - 1) % 3),
      termination_at: "",
    });
    fees.push({
      instructor_ref: instructorRef,
      currency: "PHP",
      effective_from: startDate,
      effective_to: "",
      trial_fee: "75",
      regular_fee: "100",
      cancel_fee: "50",
      cancel_without_notice_fee: "100",
      monthly_cancel_fee: "200",
    });
    for (const [weekday, startTime] of [
      ["1", "09:00"],
      ["3", "10:00"],
    ]) {
      schedules.push({
        instructor_ref: instructorRef,
        effective_from: startDate,
        effective_to: "",
        timezone: "Asia/Tokyo",
        weekday,
        start_time: startTime,
      });
    }
  }

  return {
    "instructors.csv": toCsv("instructors.csv", instructors),
    "instructor_fees.csv": toCsv("instructor_fees.csv", fees),
    "instructor_schedules.csv": toCsv("instructor_schedules.csv", schedules),
  } satisfies Record<InstructorFileName, string>;
}

async function createDeterministicZip(
  files: Record<string, string>,
): Promise<Buffer> {
  const zip = new JSZip();
  const fixedDate = new Date("1970-01-01T00:00:00.000Z");
  for (const fileName of Object.keys(files).sort()) {
    zip.file(fileName, files[fileName], { date: fixedDate });
  }
  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    platform: "UNIX",
  });
}

export async function generateIncrementalImportFixture(
  options: GenerateIncrementalImportFixtureOptions = {},
): Promise<GeneratedIncrementalImportFixture> {
  const customerCount = options.customerCount ?? DEFAULT_COUNT;
  const instructorCount = options.instructorCount ?? DEFAULT_COUNT;
  const namespace = options.namespace ?? "sample";
  const planName = options.planName ?? DEFAULT_PLAN_NAME;
  const startDate = options.startDate ?? DEFAULT_START_DATE;

  validateCount("customerCount", customerCount);
  validateCount("instructorCount", instructorCount);
  validateNamespace(namespace);
  validateStartDate(startDate);
  if (!planName.trim()) throw new Error("planName must not be empty");

  const customerFiles = customerRows(
    customerCount,
    namespace,
    planName,
    startDate,
  );
  const instructorFiles = instructorRows(instructorCount, namespace, startDate);
  const [customerZip, instructorZip] = await Promise.all([
    createDeterministicZip(customerFiles),
    createDeterministicZip(instructorFiles),
  ]);

  return {
    customerFiles,
    instructorFiles,
    customerZip,
    instructorZip,
    customerZipFileName: `incremental-customers-${namespace}.zip`,
    instructorZipFileName: `incremental-instructors-${namespace}.zip`,
  };
}

function usageAndExit(message?: string): never {
  if (message) console.error(`Error: ${message}`);
  console.error(
    "Usage: ts-node ./src/seed/generateIncrementalImportFixture.ts [--customers COUNT] [--instructors COUNT] [--namespace VALUE] [--plan-name VALUE] [--start-date YYYY-MM-DD] [--out-dir PATH]",
  );
  process.exit(1);
}

function parseCount(value: string | undefined, label: string) {
  if (value === undefined) return DEFAULT_COUNT;
  const parsed = Number(value);
  try {
    validateCount(label, parsed);
  } catch (error) {
    usageAndExit(error instanceof Error ? error.message : String(error));
  }
  return parsed;
}

function parseArgs(argv: string[]): CliArgs {
  const values = new Map<string, string>();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) usageAndExit(`Unexpected argument: ${arg}`);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      usageAndExit(`Missing value for ${arg}`);
    }
    values.set(arg.slice(2), value);
    index += 1;
  }

  const allowed = new Set([
    "customers",
    "instructors",
    "namespace",
    "plan-name",
    "start-date",
    "out-dir",
  ]);
  for (const key of values.keys()) {
    if (!allowed.has(key)) usageAndExit(`Unknown flag: --${key}`);
  }

  return {
    customerCount: parseCount(values.get("customers"), "customerCount"),
    instructorCount: parseCount(values.get("instructors"), "instructorCount"),
    namespace: values.get("namespace") ?? "sample",
    planName: values.get("plan-name") ?? DEFAULT_PLAN_NAME,
    startDate: values.get("start-date") ?? DEFAULT_START_DATE,
    outDir:
      values.get("out-dir") ??
      path.resolve(
        process.cwd(),
        "../docs/testing/data-import/generated/incremental",
      ),
  };
}

async function writeFiles(directory: string, files: Record<string, string>) {
  await fs.mkdir(directory, { recursive: true });
  await Promise.all(
    Object.entries(files).map(([fileName, content]) =>
      fs.writeFile(path.join(directory, fileName), content, "utf8"),
    ),
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const generated = await generateIncrementalImportFixture(args);
  await fs.mkdir(args.outDir, { recursive: true });
  await Promise.all([
    writeFiles(path.join(args.outDir, "customers"), generated.customerFiles),
    writeFiles(
      path.join(args.outDir, "instructors"),
      generated.instructorFiles,
    ),
    fs.writeFile(
      path.join(args.outDir, generated.customerZipFileName),
      generated.customerZip,
    ),
    fs.writeFile(
      path.join(args.outDir, generated.instructorZipFileName),
      generated.instructorZip,
    ),
  ]);

  console.log("Generated deterministic incremental import fixtures");
  console.log(`Output directory: ${args.outDir}`);
  for (const fileName of CUSTOMER_FILES) {
    console.log(`${fileName}: ${args.customerCount}`);
  }
  console.log(`customer zip: ${generated.customerZipFileName}`);
  console.log(`instructors.csv: ${args.instructorCount}`);
  console.log(`instructor_fees.csv: ${args.instructorCount}`);
  console.log(`instructor_schedules.csv: ${args.instructorCount * 2}`);
  console.log(`instructor zip: ${generated.instructorZipFileName}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
