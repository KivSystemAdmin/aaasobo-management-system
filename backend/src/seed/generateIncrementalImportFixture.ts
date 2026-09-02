import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import { NORMALIZED_HEADERS } from "../services/adminImport/normalize";

type CustomerFileName =
  | "customers.csv"
  | "children.csv"
  | "subscriptions.csv"
  | "recurring_classes.csv"
  | "recurring_class_attendance.csv";
type RequiredCustomerFileName =
  | "customers.csv"
  | "children.csv"
  | "subscriptions.csv";
type OptionalCustomerFileName = Exclude<
  CustomerFileName,
  RequiredCustomerFileName
>;
type CustomerFiles = Record<RequiredCustomerFileName, string> &
  Partial<Record<OptionalCustomerFileName, string>>;
type InstructorFileName =
  | "instructors.csv"
  | "instructor_fees.csv"
  | "instructor_schedules.csv";

type CsvRow = Record<string, string>;
type FakerLike = {
  seed: (seed: number) => void;
  person: {
    firstName: () => string;
    lastName: () => string;
  };
};

const CUSTOMER_FILES: readonly CustomerFileName[] = [
  "customers.csv",
  "children.csv",
  "subscriptions.csv",
  "recurring_classes.csv",
  "recurring_class_attendance.csv",
];
const INSTRUCTOR_FILES: readonly InstructorFileName[] = [
  "instructors.csv",
  "instructor_fees.csv",
  "instructor_schedules.csv",
];
const INCREMENTAL_PLAN_NAME = "月3,180円プラン / 3,180 yen/month Plan";
const DEFAULT_START_DATE = "2026-01-01";
const DEFAULT_COUNT = 5;
const MAX_COUNT = 99_999;
const DEFAULT_START_ID = 1;
const MAX_ID = 99_999;
const FAKER_SEED = 20250301;
const DEFAULT_DUMMY_INSTRUCTOR_ICON = "/images/default-user-icon.jpg";
const PATTERN_A_SLOTS = buildPatternSlots(
  ["1", "2", "3"],
  ["16:00", "16:30", "17:00", "17:30", "18:00"],
);
const PATTERN_B_SLOTS = [
  ...buildPatternSlots(
    ["4", "5"],
    ["18:30", "19:00", "19:30", "20:00", "20:30"],
  ),
  ...buildPatternSlots(
    ["6"],
    ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
  ),
];

const HEADERS: Record<
  CustomerFileName | InstructorFileName,
  readonly string[]
> = {
  "customers.csv": NORMALIZED_HEADERS["customers.csv"],
  "children.csv": NORMALIZED_HEADERS["children.csv"],
  "subscriptions.csv": NORMALIZED_HEADERS["subscriptions.csv"].map((header) =>
    header === "plan_ref" ? "plan_name" : header,
  ),
  "recurring_classes.csv": [
    "recurring_class_ref",
    "subscription_ref",
    "instructor_id",
    "start_at",
    "end_at",
  ],
  "recurring_class_attendance.csv":
    NORMALIZED_HEADERS["recurring_class_attendance.csv"],
  "instructors.csv": NORMALIZED_HEADERS["instructors.csv"],
  "instructor_fees.csv": NORMALIZED_HEADERS["instructor_fees.csv"],
  "instructor_schedules.csv": NORMALIZED_HEADERS["instructor_schedules.csv"],
};

type IncrementalImportFixtureTarget = "customers" | "instructors";

type GenerateIncrementalImportFixtureBaseOptions = {
  number?: number;
  startId?: number;
  startDate?: string;
};

export type GenerateIncrementalCustomerFixtureOptions =
  GenerateIncrementalImportFixtureBaseOptions & {
    target: "customers";
    startInstructorId?: number;
    endInstructorId?: number;
  };

export type GenerateIncrementalInstructorFixtureOptions =
  GenerateIncrementalImportFixtureBaseOptions & {
    target: "instructors";
  };

export type GenerateIncrementalImportFixtureOptions =
  | GenerateIncrementalCustomerFixtureOptions
  | GenerateIncrementalInstructorFixtureOptions;

export type GeneratedIncrementalCustomerFixture = {
  target: "customers";
  customerFiles: CustomerFiles;
  customerZip: Buffer;
  customerZipFileName: string;
};

export type GeneratedIncrementalInstructorFixture = {
  target: "instructors";
  instructorFiles: Record<InstructorFileName, string>;
  instructorZip: Buffer;
  instructorZipFileName: string;
};

export type GeneratedIncrementalImportFixture =
  | GeneratedIncrementalCustomerFixture
  | GeneratedIncrementalInstructorFixture;

type CliArgs = Required<GenerateIncrementalImportFixtureBaseOptions> & {
  target: IncrementalImportFixtureTarget;
  outDir: string;
  startInstructorId?: number;
  endInstructorId?: number;
};

function validateCount(label: string, count: number) {
  if (!Number.isSafeInteger(count) || count < 1 || count > MAX_COUNT) {
    throw new Error(`${label} must be an integer between 1 and ${MAX_COUNT}`);
  }
}

function validateIdRange(label: string, startId: number, count: number) {
  if (!Number.isSafeInteger(startId) || startId < 1) {
    throw new Error(`${label} must be a positive integer`);
  }
  if (startId + count - 1 > MAX_ID) {
    throw new Error(
      `${label} and count must not generate an ID greater than ${MAX_ID}`,
    );
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

function sanitizeChildFirstName(raw: string, fallbackIndex: number) {
  const compact = raw
    .replace(/[.&]/g, "")
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^A-Za-z]/g, "");
  return compact || `Child${fallbackIndex}`;
}

function sanitizeEnglishNamePart(raw: string, fallback: string) {
  const compact = raw.replace(/[^A-Za-z]/g, "");
  return compact || fallback;
}

function prepareCustomerFakers(
  fakerJa: FakerLike,
  fakerEn: FakerLike,
  startId: number,
) {
  fakerJa.seed(FAKER_SEED);
  fakerEn.seed(FAKER_SEED);
  for (let index = 1; index < startId; index += 1) {
    fakerJa.person.lastName();
    fakerJa.person.firstName();
    fakerEn.person.firstName();
  }
}

function prepareInstructorFaker(fakerEn: FakerLike, startId: number) {
  fakerEn.seed(FAKER_SEED);
  const nicknameCounts = new Map<string, number>();
  for (let index = 1; index < startId; index += 1) {
    const first = sanitizeEnglishNamePart(
      fakerEn.person.firstName(),
      `Alex${index}`,
    );
    fakerEn.person.lastName();
    nicknameCounts.set(first, (nicknameCounts.get(first) ?? 0) + 1);
  }
  return nicknameCounts;
}

function buildPatternSlots(weekdays: string[], startTimes: string[]) {
  return weekdays.flatMap((weekday) =>
    startTimes.map((startTime) => [weekday, startTime] as const),
  );
}

function slotsForInstructor(index: number) {
  return index % 2 === 1 ? PATTERN_A_SLOTS : PATTERN_B_SLOTS;
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function nextDateOnOrAfter(value: string, weekday: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + ((weekday - date.getUTCDay() + 7) % 7));
  return formatDateOnly(date);
}

function recurringClassRows(
  count: number,
  startId: number,
  startDate: string,
  startInstructorId: number,
  endInstructorId: number,
) {
  const recurringClasses: CsvRow[] = [];
  const attendance: CsvRow[] = [];
  const instructorCount = endInstructorId - startInstructorId + 1;
  const recurringClassCount = count * 2;

  for (let index = 0; index < recurringClassCount; index += 1) {
    const instructorId = startInstructorId + (index % instructorCount);
    const slotIndex = Math.floor(index / instructorCount);
    const slot = slotsForInstructor(instructorId)[slotIndex];
    if (!slot) {
      throw new Error(
        `Instructor range ${startInstructorId}-${endInstructorId} has insufficient unique slots for ${recurringClassCount} regular classes`,
      );
    }
    const customerOffset = Math.floor(index / 2);
    const customerId = startId + customerOffset;
    const recurringClassId = (customerId - 1) * 2 + (index % 2) + 1;
    const recurringClassRef = `RC${String(recurringClassId).padStart(4, "0")}`;
    const [weekday, startTime] = slot;
    const firstDate = nextDateOnOrAfter(startDate, Number(weekday));

    recurringClasses.push({
      recurring_class_ref: recurringClassRef,
      subscription_ref: ref("SU", customerId),
      instructor_id: String(instructorId),
      start_at: `${firstDate}T${startTime}:00+09:00`,
      end_at: "",
    });
    attendance.push({
      recurring_class_ref: recurringClassRef,
      child_ref: ref("CH", customerId),
    });
  }

  return { recurringClasses, attendance };
}

function customerRows(
  fakerJa: FakerLike,
  fakerEn: FakerLike,
  count: number,
  startId: number,
  startDate: string,
  instructorRange?: { start: number; end: number },
) {
  const customers: CsvRow[] = [];
  const children: CsvRow[] = [];
  const subscriptions: CsvRow[] = [];

  for (let offset = 0; offset < count; offset += 1) {
    const index = startId + offset;
    const customerRef = ref("CU", index);
    const lowerRef = customerRef.toLowerCase();
    customers.push({
      customer_ref: customerRef,
      name: `${fakerJa.person.lastName()} ${fakerJa.person.firstName()}`,
      email: `${lowerRef}@example.com`,
      temp_password: `Temp-${lowerRef}`,
      prefecture: "東京都 / Tokyo",
      termination_at: "",
      has_seen_welcome: index % 2 === 0 ? "true" : "false",
    });
    children.push({
      child_ref: ref("CH", index),
      customer_ref: customerRef,
      name: sanitizeChildFirstName(fakerEn.person.firstName(), index),
      birthdate: `2015-01-${String(((index - 1) % 28) + 1).padStart(2, "0")}`,
      personal_info: "Deterministic dummy child",
    });
    subscriptions.push({
      subscription_ref: ref("SU", index),
      customer_ref: customerRef,
      plan_name: INCREMENTAL_PLAN_NAME,
      select_type: `https://example.com/subscriptions/${lowerRef}`,
      start_at: `${startDate}T00:00:00+09:00`,
      end_at: "",
    });
  }

  const files: CustomerFiles = {
    "customers.csv": toCsv("customers.csv", customers),
    "children.csv": toCsv("children.csv", children),
    "subscriptions.csv": toCsv("subscriptions.csv", subscriptions),
  };
  if (instructorRange) {
    const recurring = recurringClassRows(
      count,
      startId,
      startDate,
      instructorRange.start,
      instructorRange.end,
    );
    files["recurring_classes.csv"] = toCsv(
      "recurring_classes.csv",
      recurring.recurringClasses,
    );
    files["recurring_class_attendance.csv"] = toCsv(
      "recurring_class_attendance.csv",
      recurring.attendance,
    );
  }
  return files;
}

function instructorRows(
  fakerEn: FakerLike,
  nicknameCounts: Map<string, number>,
  count: number,
  startId: number,
  startDate: string,
) {
  const instructors: CsvRow[] = [];
  const fees: CsvRow[] = [];
  const schedules: CsvRow[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const index = startId + offset;
    const instructorRef = ref("IN", index);
    const lowerRef = instructorRef.toLowerCase();
    const first = sanitizeEnglishNamePart(
      fakerEn.person.firstName(),
      `Alex${index}`,
    );
    const last = sanitizeEnglishNamePart(
      fakerEn.person.lastName(),
      `Taylor${index}`,
    );
    const seen = nicknameCounts.get(first) ?? 0;
    const nickname = seen === 0 ? first : `${first}${seen + 1}`;
    nicknameCounts.set(first, seen + 1);
    instructors.push({
      instructor_ref: instructorRef,
      name: `${first} ${last}`,
      email: `${lowerRef}@example.com`,
      temp_password: `Temp-${lowerRef}`,
      class_url: `https://class.example.com/${lowerRef}`,
      icon: `${DEFAULT_DUMMY_INSTRUCTOR_ICON}?id=${lowerRef}`,
      nickname,
      meeting_id: `MID${String(index).padStart(4, "0")}`,
      passcode: `PIN${String(index).padStart(4, "0")}`,
      birthdate: `1990-01-${String(((index - 1) % 28) + 1).padStart(2, "0")}`,
      favorite_food: "Sushi",
      hobby: "Reading",
      life_history: "Deterministic dummy instructor",
      message_for_children: "Let us enjoy learning English!",
      skill: "Conversation",
      working_time: "Weekdays",
      english_background: index % 2 === 0 ? "1" : "0",
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
    for (const [weekday, startTime] of slotsForInstructor(index)) {
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

export function generateIncrementalImportFixture(
  options: GenerateIncrementalCustomerFixtureOptions,
): Promise<GeneratedIncrementalCustomerFixture>;
export function generateIncrementalImportFixture(
  options: GenerateIncrementalInstructorFixtureOptions,
): Promise<GeneratedIncrementalInstructorFixture>;
export async function generateIncrementalImportFixture(
  options: GenerateIncrementalImportFixtureOptions,
): Promise<GeneratedIncrementalImportFixture> {
  const number = options.number ?? DEFAULT_COUNT;
  const startId = options.startId ?? DEFAULT_START_ID;
  const startDate = options.startDate ?? DEFAULT_START_DATE;

  validateStartDate(startDate);
  validateCount("number", number);
  validateIdRange("startId", startId, number);
  const endId = startId + number - 1;

  if (options.target === "customers") {
    const hasStartInstructorId = options.startInstructorId !== undefined;
    const hasEndInstructorId = options.endInstructorId !== undefined;
    if (hasStartInstructorId !== hasEndInstructorId) {
      throw new Error(
        "startInstructorId and endInstructorId must be specified together",
      );
    }
    if (
      hasStartInstructorId &&
      (!Number.isSafeInteger(options.startInstructorId) ||
        !Number.isSafeInteger(options.endInstructorId) ||
        options.startInstructorId! < 1 ||
        options.endInstructorId! < options.startInstructorId!)
    ) {
      throw new Error(
        "instructor ID range must contain positive integers with endInstructorId greater than or equal to startInstructorId",
      );
    }
    const { fakerEN_US, fakerJA } = (await import("@faker-js/faker")) as {
      fakerEN_US: FakerLike;
      fakerJA: FakerLike;
    };
    prepareCustomerFakers(fakerJA, fakerEN_US, startId);
    const customerFiles = customerRows(
      fakerJA,
      fakerEN_US,
      number,
      startId,
      startDate,
      hasStartInstructorId
        ? {
            start: options.startInstructorId!,
            end: options.endInstructorId!,
          }
        : undefined,
    );
    return {
      target: "customers",
      customerFiles,
      customerZip: await createDeterministicZip(customerFiles),
      customerZipFileName: `incremental-customers-${String(startId).padStart(4, "0")}-${String(endId).padStart(4, "0")}.zip`,
    };
  }

  const { fakerEN_US } = (await import("@faker-js/faker")) as {
    fakerEN_US: FakerLike;
  };
  const nicknameCounts = prepareInstructorFaker(fakerEN_US, startId);
  const instructorFiles = instructorRows(
    fakerEN_US,
    nicknameCounts,
    number,
    startId,
    startDate,
  );
  return {
    target: "instructors",
    instructorFiles,
    instructorZip: await createDeterministicZip(instructorFiles),
    instructorZipFileName: `incremental-instructors-${String(startId).padStart(4, "0")}-${String(endId).padStart(4, "0")}.zip`,
  };
}

function usageAndExit(message?: string): never {
  if (message) console.error(`Error: ${message}`);
  console.error(
    "Usage: ts-node ./src/seed/generateIncrementalImportFixture.ts --target customers|instructors [--number COUNT] [--start-id ID] [--start-instructor-id ID --end-instructor-id ID] [--start-date YYYY-MM-DD] [--out-dir PATH]",
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

function parseStartId(value: string | undefined, label: string, count: number) {
  if (value === undefined) return DEFAULT_START_ID;
  const parsed = Number(value);
  try {
    validateIdRange(label, parsed, count);
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
    "number",
    "start-id",
    "target",
    "start-date",
    "start-instructor-id",
    "end-instructor-id",
    "out-dir",
  ]);
  for (const key of values.keys()) {
    if (!allowed.has(key)) usageAndExit(`Unknown flag: --${key}`);
  }

  const number = parseCount(values.get("number"), "number");
  const target = values.get("target");
  if (target !== "customers" && target !== "instructors") {
    usageAndExit("--target must be customers or instructors");
  }
  const startInstructorId = values.has("start-instructor-id")
    ? parseStartId(values.get("start-instructor-id"), "startInstructorId", 1)
    : undefined;
  const endInstructorId = values.has("end-instructor-id")
    ? parseStartId(values.get("end-instructor-id"), "endInstructorId", 1)
    : undefined;
  if (target === "instructors" && (startInstructorId || endInstructorId)) {
    usageAndExit(
      "--start-instructor-id and --end-instructor-id are only valid for --target customers",
    );
  }
  if ((startInstructorId === undefined) !== (endInstructorId === undefined)) {
    usageAndExit(
      "--start-instructor-id and --end-instructor-id must be specified together",
    );
  }
  if (startInstructorId !== undefined && endInstructorId! < startInstructorId) {
    usageAndExit("--end-instructor-id must be at least --start-instructor-id");
  }
  return {
    target,
    number,
    startId: parseStartId(values.get("start-id"), "startId", number),
    startDate: values.get("start-date") ?? DEFAULT_START_DATE,
    startInstructorId,
    endInstructorId,
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
  await fs.mkdir(args.outDir, { recursive: true });

  console.log("Generated deterministic incremental import fixtures");
  console.log(`Output directory: ${args.outDir}`);
  if (args.target === "customers") {
    const generated = await generateIncrementalImportFixture({
      ...args,
      target: "customers",
    });
    await Promise.all([
      writeFiles(path.join(args.outDir, "customers"), generated.customerFiles),
      fs.writeFile(
        path.join(args.outDir, generated.customerZipFileName),
        generated.customerZip,
      ),
    ]);
    for (const fileName of CUSTOMER_FILES) {
      const content = generated.customerFiles[fileName];
      if (!content) continue;
      console.log(`${fileName}: ${content.trim().split("\n").length - 1}`);
    }
    console.log(`customer zip: ${generated.customerZipFileName}`);
    return;
  }

  const generated = await generateIncrementalImportFixture({
    ...args,
    target: "instructors",
  });
  await Promise.all([
    writeFiles(
      path.join(args.outDir, "instructors"),
      generated.instructorFiles,
    ),
    fs.writeFile(
      path.join(args.outDir, generated.instructorZipFileName),
      generated.instructorZip,
    ),
  ]);
  console.log(`instructors.csv: ${args.number}`);
  console.log(`instructor_fees.csv: ${args.number}`);
  console.log(
    `instructor_schedules.csv: ${
      generated.instructorFiles["instructor_schedules.csv"].trim().split("\n")
        .length - 1
    }`,
  );
  console.log(`instructor zip: ${generated.instructorZipFileName}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
