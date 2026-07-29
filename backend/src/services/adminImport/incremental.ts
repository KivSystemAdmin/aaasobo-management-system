import JSZip from "jszip";
import { Prisma } from "@prisma/client";
import { prisma } from "../../../prisma/prismaClient";
import { hashPassword } from "../../utils/commonUtils";
import { normalizeCsvCell, parseCsv } from "./normalize";

export type IncrementalImportOperation =
  | "incremental-customers"
  | "incremental-instructors";

type CustomerFileName =
  | "customers.csv"
  | "children.csv"
  | "subscriptions.csv"
  | "recurring_classes.csv"
  | "recurring_class_attendance.csv";
type InstructorFileName =
  | "instructors.csv"
  | "instructor_fees.csv"
  | "instructor_schedules.csv";
type IncrementalFileName = CustomerFileName | InstructorFileName;

interface IncrementalImportIssue {
  file: IncrementalFileName;
  row: number | null;
  column: string | null;
  message: string;
}

interface IncrementalImportReport {
  rowsByFile: Record<string, number>;
  importedByFile: Record<string, number>;
}

interface ParsedRow {
  rowNumber: number;
  data: Record<string, string>;
}

interface ParsedPackage {
  rows: Partial<Record<IncrementalFileName, ParsedRow[]>>;
  report: IncrementalImportReport;
}

interface IncrementalImportExecutionOptions {
  onPrimaryRecordInserted?: (count: number) => void | Promise<void>;
}

const CUSTOMER_FILES: readonly CustomerFileName[] = [
  "customers.csv",
  "children.csv",
  "subscriptions.csv",
];
const OPTIONAL_CUSTOMER_FILES: readonly CustomerFileName[] = [
  "recurring_classes.csv",
  "recurring_class_attendance.csv",
];
const INSTRUCTOR_FILES: readonly InstructorFileName[] = [
  "instructors.csv",
  "instructor_fees.csv",
  "instructor_schedules.csv",
];

const HEADERS: Record<IncrementalFileName, readonly string[]> = {
  "customers.csv": [
    "customer_ref",
    "name",
    "email",
    "temp_password",
    "prefecture",
    "termination_at",
    "has_seen_welcome",
  ],
  "children.csv": [
    "child_ref",
    "customer_ref",
    "name",
    "birthdate",
    "personal_info",
  ],
  "subscriptions.csv": [
    "subscription_ref",
    "customer_ref",
    "plan_name",
    "select_type",
    "start_at",
    "end_at",
  ],
  "recurring_classes.csv": [
    "recurring_class_ref",
    "subscription_ref",
    "instructor_id",
    "start_at",
    "end_at",
  ],
  "recurring_class_attendance.csv": ["recurring_class_ref", "child_ref"],
  "instructors.csv": [
    "instructor_ref",
    "name",
    "email",
    "temp_password",
    "class_url",
    "icon",
    "nickname",
    "meeting_id",
    "passcode",
    "birthdate",
    "favorite_food",
    "hobby",
    "life_history",
    "message_for_children",
    "skill",
    "working_time",
    "english_background",
    "termination_at",
  ],
  "instructor_fees.csv": [
    "instructor_ref",
    "currency",
    "effective_from",
    "effective_to",
    "trial_fee",
    "regular_fee",
    "cancel_fee",
    "cancel_without_notice_fee",
    "monthly_cancel_fee",
  ],
  "instructor_schedules.csv": [
    "instructor_ref",
    "effective_from",
    "effective_to",
    "timezone",
    "weekday",
    "start_time",
  ],
};

const REF_PATTERN = /^[A-Z]{2}[0-9]{4,}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const IMPORT_TRANSACTION_TIMEOUT_MS = 180_000;

export class IncrementalImportValidationError extends Error {
  constructor(
    public readonly operation: IncrementalImportOperation,
    public readonly report: IncrementalImportReport,
    public readonly issues: IncrementalImportIssue[],
  ) {
    super("Incremental import validation failed");
    this.name = "IncrementalImportValidationError";
  }
}

function filesFor(operation: IncrementalImportOperation) {
  return operation === "incremental-customers"
    ? CUSTOMER_FILES
    : INSTRUCTOR_FILES;
}

function issue(
  issues: IncrementalImportIssue[],
  file: IncrementalFileName,
  row: number | null,
  column: string | null,
  message: string,
) {
  issues.push({ file, row, column, message });
}

function required(
  issues: IncrementalImportIssue[],
  file: IncrementalFileName,
  row: ParsedRow,
  columns: readonly string[],
) {
  for (const column of columns) {
    if (!row.data[column]) {
      issue(issues, file, row.rowNumber, column, "Value is required");
    }
  }
}

function validDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value)
  );
}

function validDateTime(value: string) {
  return (
    DATETIME_PATTERN.test(value) && !Number.isNaN(new Date(value).getTime())
  );
}

function validTime(value: string) {
  if (!TIME_PATTERN.test(value)) return false;
  const [hour, minute] = value.split(":").map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function assertDate(
  issues: IncrementalImportIssue[],
  file: IncrementalFileName,
  row: ParsedRow,
  column: string,
) {
  const value = row.data[column];
  if (value && !validDate(value)) {
    issue(issues, file, row.rowNumber, column, "Date must be YYYY-MM-DD");
  }
}

function assertDateTime(
  issues: IncrementalImportIssue[],
  file: IncrementalFileName,
  row: ParsedRow,
  column: string,
) {
  const value = row.data[column];
  if (value && !validDateTime(value)) {
    issue(
      issues,
      file,
      row.rowNumber,
      column,
      "DateTime must be ISO 8601 with timezone",
    );
  }
}

function assertRange(
  issues: IncrementalImportIssue[],
  file: IncrementalFileName,
  row: ParsedRow,
  fromColumn: string,
  toColumn: string,
) {
  const from = row.data[fromColumn];
  const to = row.data[toColumn];
  if (
    from &&
    to &&
    !Number.isNaN(new Date(from).getTime()) &&
    !Number.isNaN(new Date(to).getTime()) &&
    new Date(to) < new Date(from)
  ) {
    issue(
      issues,
      file,
      row.rowNumber,
      toColumn,
      `${toColumn} must not be before ${fromColumn}`,
    );
  }
}

function assertRef(
  issues: IncrementalImportIssue[],
  file: IncrementalFileName,
  row: ParsedRow,
  column: string,
) {
  const value = row.data[column];
  if (value && !REF_PATTERN.test(value)) {
    issue(
      issues,
      file,
      row.rowNumber,
      column,
      `Reference key must match ${REF_PATTERN.source}`,
    );
  }
}

function assertUnique(
  issues: IncrementalImportIssue[],
  file: IncrementalFileName,
  rows: ParsedRow[],
  columns: readonly string[],
  label = columns.join(","),
) {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const values = columns.map((column) => row.data[column]);
    if (values.some((value) => !value)) continue;
    const key = values.join("\0");
    const firstRow = seen.get(key);
    if (firstRow !== undefined) {
      issue(
        issues,
        file,
        row.rowNumber,
        columns.join(","),
        `${label} must be unique (already used on row ${firstRow})`,
      );
    } else {
      seen.set(key, row.rowNumber);
    }
  }
}

function assertReferences(
  issues: IncrementalImportIssue[],
  file: IncrementalFileName,
  rows: ParsedRow[],
  column: string,
  refs: Set<string>,
  target: IncrementalFileName,
) {
  for (const row of rows) {
    const value = row.data[column];
    if (value && !refs.has(value)) {
      issue(
        issues,
        file,
        row.rowNumber,
        column,
        `Reference "${value}" does not exist in ${target}`,
      );
    }
  }
}

async function parsePackage(
  zipBuffer: Buffer,
  operation: IncrementalImportOperation,
) {
  const issues: IncrementalImportIssue[] = [];
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(zipBuffer);
  } catch {
    const firstFile = filesFor(operation)[0];
    const report = { rowsByFile: {}, importedByFile: {} };
    throw new IncrementalImportValidationError(operation, report, [
      {
        file: firstFile,
        row: null,
        column: null,
        message: "Uploaded file is not a valid ZIP archive",
      },
    ]);
  }

  const packageFiles = [...filesFor(operation)];
  if (
    operation === "incremental-customers" &&
    OPTIONAL_CUSTOMER_FILES.some((file) => zip.file(file))
  ) {
    packageFiles.push(...OPTIONAL_CUSTOMER_FILES);
  }

  const rows: Partial<Record<IncrementalFileName, ParsedRow[]>> = {};
  const rowsByFile: Record<string, number> = {};
  for (const file of packageFiles) {
    const entry = zip.file(file);
    if (!entry) {
      issue(issues, file, null, null, `Missing required file: ${file}`);
      rows[file] = [];
      rowsByFile[file] = 0;
      continue;
    }

    const parsedCsv = parseCsv(await entry.async("string"));
    const expected = HEADERS[file];
    const actual = (parsedCsv[0] ?? []).map(normalizeCsvCell);
    if (
      actual.length !== expected.length ||
      !expected.every((header, index) => header === actual[index])
    ) {
      issue(
        issues,
        file,
        1,
        null,
        `Header mismatch. Expected: ${expected.join(",")}`,
      );
      rows[file] = [];
      rowsByFile[file] = 0;
      continue;
    }

    const fileRows: ParsedRow[] = [];
    for (let index = 1; index < parsedCsv.length; index += 1) {
      const cells = parsedCsv[index];
      if (cells.length === 1 && !normalizeCsvCell(cells[0])) continue;
      if (cells.length > expected.length) {
        issue(
          issues,
          file,
          index + 1,
          null,
          `Row has too many columns. Expected ${expected.length}`,
        );
        continue;
      }
      fileRows.push({
        rowNumber: index + 1,
        data: Object.fromEntries(
          expected.map((header, column) => [
            header,
            normalizeCsvCell(cells[column]),
          ]),
        ),
      });
    }
    rows[file] = fileRows;
    rowsByFile[file] = fileRows.length;
  }

  const mainFile =
    operation === "incremental-customers" ? "customers.csv" : "instructors.csv";
  if ((rows[mainFile]?.length ?? 0) === 0) {
    issue(
      issues,
      mainFile,
      null,
      null,
      `${mainFile} must contain at least one data row`,
    );
  }

  const report = {
    rowsByFile,
    importedByFile: Object.fromEntries(packageFiles.map((file) => [file, 0])),
  };
  const parsed = { rows, report };
  validateFileData(operation, parsed, issues);
  if (issues.length > 0) {
    throw new IncrementalImportValidationError(operation, report, issues);
  }
  return parsed;
}

function validateFileData(
  operation: IncrementalImportOperation,
  parsed: ParsedPackage,
  issues: IncrementalImportIssue[],
) {
  if (operation === "incremental-customers") {
    const customers = parsed.rows["customers.csv"] ?? [];
    const children = parsed.rows["children.csv"] ?? [];
    const subscriptions = parsed.rows["subscriptions.csv"] ?? [];
    const recurringClasses = parsed.rows["recurring_classes.csv"] ?? [];
    const recurringAttendance =
      parsed.rows["recurring_class_attendance.csv"] ?? [];

    for (const row of customers) {
      required(issues, "customers.csv", row, [
        "customer_ref",
        "name",
        "email",
        "temp_password",
        "prefecture",
        "has_seen_welcome",
      ]);
      assertRef(issues, "customers.csv", row, "customer_ref");
      if (row.data.email && !EMAIL_PATTERN.test(row.data.email)) {
        issue(
          issues,
          "customers.csv",
          row.rowNumber,
          "email",
          "Email format is invalid",
        );
      }
      if (
        row.data.has_seen_welcome &&
        !["true", "false"].includes(row.data.has_seen_welcome)
      ) {
        issue(
          issues,
          "customers.csv",
          row.rowNumber,
          "has_seen_welcome",
          'Boolean must be "true" or "false"',
        );
      }
      assertDateTime(issues, "customers.csv", row, "termination_at");
    }
    for (const row of children) {
      required(issues, "children.csv", row, [
        "child_ref",
        "customer_ref",
        "name",
      ]);
      assertRef(issues, "children.csv", row, "child_ref");
      assertRef(issues, "children.csv", row, "customer_ref");
      assertDate(issues, "children.csv", row, "birthdate");
    }
    for (const row of subscriptions) {
      required(issues, "subscriptions.csv", row, [
        "subscription_ref",
        "customer_ref",
        "plan_name",
        "select_type",
        "start_at",
      ]);
      assertRef(issues, "subscriptions.csv", row, "subscription_ref");
      assertRef(issues, "subscriptions.csv", row, "customer_ref");
      assertDateTime(issues, "subscriptions.csv", row, "start_at");
      assertDateTime(issues, "subscriptions.csv", row, "end_at");
      assertRange(issues, "subscriptions.csv", row, "start_at", "end_at");
    }
    for (const row of recurringClasses) {
      required(issues, "recurring_classes.csv", row, [
        "recurring_class_ref",
        "subscription_ref",
        "instructor_id",
        "start_at",
      ]);
      assertRef(issues, "recurring_classes.csv", row, "recurring_class_ref");
      assertRef(issues, "recurring_classes.csv", row, "subscription_ref");
      if (
        row.data.instructor_id &&
        (!/^\d+$/.test(row.data.instructor_id) ||
          Number(row.data.instructor_id) < 1)
      ) {
        issue(
          issues,
          "recurring_classes.csv",
          row.rowNumber,
          "instructor_id",
          "instructor_id must be a positive integer",
        );
      }
      assertDateTime(issues, "recurring_classes.csv", row, "start_at");
      assertDateTime(issues, "recurring_classes.csv", row, "end_at");
      assertRange(issues, "recurring_classes.csv", row, "start_at", "end_at");
    }
    for (const row of recurringAttendance) {
      required(issues, "recurring_class_attendance.csv", row, [
        "recurring_class_ref",
        "child_ref",
      ]);
      assertRef(
        issues,
        "recurring_class_attendance.csv",
        row,
        "recurring_class_ref",
      );
      assertRef(issues, "recurring_class_attendance.csv", row, "child_ref");
    }

    assertUnique(issues, "customers.csv", customers, ["customer_ref"]);
    assertUnique(issues, "customers.csv", customers, ["email"]);
    assertUnique(issues, "children.csv", children, ["child_ref"]);
    assertUnique(issues, "subscriptions.csv", subscriptions, [
      "subscription_ref",
    ]);
    assertUnique(issues, "subscriptions.csv", subscriptions, ["select_type"]);
    assertUnique(issues, "recurring_classes.csv", recurringClasses, [
      "recurring_class_ref",
    ]);
    assertUnique(issues, "recurring_classes.csv", recurringClasses, [
      "instructor_id",
      "start_at",
    ]);
    assertUnique(
      issues,
      "recurring_class_attendance.csv",
      recurringAttendance,
      ["recurring_class_ref", "child_ref"],
    );
    const customerRefs = new Set(customers.map((row) => row.data.customer_ref));
    assertReferences(
      issues,
      "children.csv",
      children,
      "customer_ref",
      customerRefs,
      "customers.csv",
    );
    assertReferences(
      issues,
      "subscriptions.csv",
      subscriptions,
      "customer_ref",
      customerRefs,
      "customers.csv",
    );
    const subscriptionRefs = new Set(
      subscriptions.map((row) => row.data.subscription_ref),
    );
    const recurringClassRefs = new Set(
      recurringClasses.map((row) => row.data.recurring_class_ref),
    );
    const childRefs = new Set(children.map((row) => row.data.child_ref));
    assertReferences(
      issues,
      "recurring_classes.csv",
      recurringClasses,
      "subscription_ref",
      subscriptionRefs,
      "subscriptions.csv",
    );
    assertReferences(
      issues,
      "recurring_class_attendance.csv",
      recurringAttendance,
      "recurring_class_ref",
      recurringClassRefs,
      "recurring_classes.csv",
    );
    assertReferences(
      issues,
      "recurring_class_attendance.csv",
      recurringAttendance,
      "child_ref",
      childRefs,
      "children.csv",
    );
    return;
  }

  const instructors = parsed.rows["instructors.csv"] ?? [];
  const fees = parsed.rows["instructor_fees.csv"] ?? [];
  const schedules = parsed.rows["instructor_schedules.csv"] ?? [];
  const instructorRequired = [
    "instructor_ref",
    "name",
    "email",
    "temp_password",
    "class_url",
    "icon",
    "nickname",
    "meeting_id",
    "passcode",
    "birthdate",
    "english_background",
  ];
  for (const row of instructors) {
    required(issues, "instructors.csv", row, instructorRequired);
    assertRef(issues, "instructors.csv", row, "instructor_ref");
    if (row.data.email && !EMAIL_PATTERN.test(row.data.email)) {
      issue(
        issues,
        "instructors.csv",
        row.rowNumber,
        "email",
        "Email format is invalid",
      );
    }
    for (const column of ["class_url", "icon"]) {
      if (row.data[column]) {
        try {
          const url = new URL(row.data[column]);
          if (!["http:", "https:"].includes(url.protocol)) throw new Error();
        } catch {
          if (
            column === "icon" &&
            row.data[column].startsWith("/images/") &&
            !row.data[column].startsWith("//")
          ) {
            continue;
          }
          issue(
            issues,
            "instructors.csv",
            row.rowNumber,
            column,
            column === "icon"
              ? "URL must use http or https or a local /images/ path"
              : "URL must use http or https",
          );
        }
      }
    }
    assertDate(issues, "instructors.csv", row, "birthdate");
    assertDateTime(issues, "instructors.csv", row, "termination_at");
    if (
      row.data.english_background &&
      !["0", "1", "2"].includes(row.data.english_background)
    ) {
      issue(
        issues,
        "instructors.csv",
        row.rowNumber,
        "english_background",
        'english_background must be one of "0", "1", or "2"',
      );
    }
  }

  for (const row of fees) {
    required(issues, "instructor_fees.csv", row, [
      "instructor_ref",
      "currency",
      "effective_from",
      "trial_fee",
      "regular_fee",
      "cancel_fee",
      "cancel_without_notice_fee",
    ]);
    assertRef(issues, "instructor_fees.csv", row, "instructor_ref");
    assertDate(issues, "instructor_fees.csv", row, "effective_from");
    assertDate(issues, "instructor_fees.csv", row, "effective_to");
    assertRange(
      issues,
      "instructor_fees.csv",
      row,
      "effective_from",
      "effective_to",
    );
    if (row.data.currency && !/^[A-Z]{3}$/.test(row.data.currency)) {
      issue(
        issues,
        "instructor_fees.csv",
        row.rowNumber,
        "currency",
        "currency must be a 3-letter uppercase code",
      );
    }
    for (const column of [
      "trial_fee",
      "regular_fee",
      "cancel_fee",
      "cancel_without_notice_fee",
      "monthly_cancel_fee",
    ]) {
      if (row.data[column] && !/^\d+$/.test(row.data[column])) {
        issue(
          issues,
          "instructor_fees.csv",
          row.rowNumber,
          column,
          `${column} must be a non-negative integer`,
        );
      }
    }
  }

  for (const row of schedules) {
    required(issues, "instructor_schedules.csv", row, [
      "instructor_ref",
      "effective_from",
      "timezone",
      "weekday",
      "start_time",
    ]);
    assertRef(issues, "instructor_schedules.csv", row, "instructor_ref");
    assertDate(issues, "instructor_schedules.csv", row, "effective_from");
    assertDate(issues, "instructor_schedules.csv", row, "effective_to");
    assertRange(
      issues,
      "instructor_schedules.csv",
      row,
      "effective_from",
      "effective_to",
    );
    if (
      row.data.weekday &&
      (!/^\d$/.test(row.data.weekday) ||
        Number(row.data.weekday) < 0 ||
        Number(row.data.weekday) > 6)
    ) {
      issue(
        issues,
        "instructor_schedules.csv",
        row.rowNumber,
        "weekday",
        "weekday must be 0-6",
      );
    }
    if (row.data.start_time && !validTime(row.data.start_time)) {
      issue(
        issues,
        "instructor_schedules.csv",
        row.rowNumber,
        "start_time",
        "Time must be HH:mm",
      );
    }
  }

  for (const column of [
    "instructor_ref",
    "email",
    "class_url",
    "icon",
    "nickname",
    "meeting_id",
    "passcode",
  ]) {
    assertUnique(issues, "instructors.csv", instructors, [column]);
  }
  assertUnique(issues, "instructor_fees.csv", fees, [
    "instructor_ref",
    "effective_from",
  ]);
  assertUnique(issues, "instructor_schedules.csv", schedules, [
    "instructor_ref",
    "effective_from",
    "effective_to",
    "timezone",
    "weekday",
    "start_time",
  ]);
  const scheduleGroups = new Map<string, ParsedRow>();
  for (const row of schedules) {
    const groupKey = [
      row.data.instructor_ref,
      row.data.effective_from,
      row.data.effective_to,
      row.data.timezone,
    ].join("\0");
    if (!scheduleGroups.has(groupKey)) scheduleGroups.set(groupKey, row);
  }
  const groupRows = [...scheduleGroups.values()].filter(
    (row) => row.data.effective_to,
  );
  assertUnique(
    issues,
    "instructor_schedules.csv",
    groupRows,
    ["instructor_ref", "effective_to"],
    "(instructor_ref,effective_to) schedule group",
  );
  const instructorRefs = new Set(
    instructors.map((row) => row.data.instructor_ref),
  );
  assertReferences(
    issues,
    "instructor_fees.csv",
    fees,
    "instructor_ref",
    instructorRefs,
    "instructors.csv",
  );
  assertReferences(
    issues,
    "instructor_schedules.csv",
    schedules,
    "instructor_ref",
    instructorRefs,
    "instructors.csv",
  );
}

function findRow(
  parsed: ParsedPackage,
  file: IncrementalFileName,
  column: string,
  value: string,
) {
  return (parsed.rows[file] ?? []).find((row) => row.data[column] === value)
    ?.rowNumber;
}

async function validateCustomerDatabase(
  tx: Prisma.TransactionClient,
  parsed: ParsedPackage,
  issues: IncrementalImportIssue[],
) {
  const customers = parsed.rows["customers.csv"] ?? [];
  const subscriptions = parsed.rows["subscriptions.csv"] ?? [];
  const emails = customers.map((row) => row.data.email);
  const selectTypes = subscriptions.map((row) => row.data.select_type);
  const planNames = [
    ...new Set(subscriptions.map((row) => row.data.plan_name)),
  ];
  const recurringClasses = parsed.rows["recurring_classes.csv"] ?? [];
  const instructorIds = [
    ...new Set(
      recurringClasses
        .map((row) => Number(row.data.instructor_id))
        .filter(Number.isSafeInteger),
    ),
  ];
  const [existingCustomers, existingSubscriptions, plans, instructors] =
    await Promise.all([
      tx.customer.findMany({
        where: { email: { in: emails } },
        select: { email: true },
      }),
      tx.subscription.findMany({
        where: { selectType: { in: selectTypes } },
        select: { selectType: true },
      }),
      tx.plan.findMany({
        where: { name: { in: planNames } },
        select: { id: true, name: true },
      }),
      tx.instructor.findMany({
        where: { id: { in: instructorIds } },
        select: {
          id: true,
          instructorSchedules: {
            include: { slots: true },
            orderBy: { effectiveFrom: "desc" },
          },
        },
      }),
    ]);

  for (const existing of existingCustomers) {
    issue(
      issues,
      "customers.csv",
      findRow(parsed, "customers.csv", "email", existing.email) ?? null,
      "email",
      `Value "${existing.email}" already exists`,
    );
  }
  for (const existing of existingSubscriptions) {
    issue(
      issues,
      "subscriptions.csv",
      findRow(
        parsed,
        "subscriptions.csv",
        "select_type",
        existing.selectType,
      ) ?? null,
      "select_type",
      `Value "${existing.selectType}" already exists`,
    );
  }

  const planIds = new Map<string, number>();
  for (const planName of planNames) {
    const matches = plans.filter((plan) => plan.name === planName);
    for (const row of subscriptions.filter(
      (item) => item.data.plan_name === planName,
    )) {
      if (matches.length === 0) {
        issue(
          issues,
          "subscriptions.csv",
          row.rowNumber,
          "plan_name",
          `No existing plan exactly matches "${planName}"`,
        );
      } else if (matches.length > 1) {
        issue(
          issues,
          "subscriptions.csv",
          row.rowNumber,
          "plan_name",
          `Multiple existing plans exactly match "${planName}"`,
        );
      }
    }
    if (matches.length === 1) planIds.set(planName, matches[0].id);
  }

  const instructorById = new Map(
    instructors.map((instructor) => [instructor.id, instructor]),
  );
  for (const row of recurringClasses) {
    const instructorId = Number(row.data.instructor_id);
    if (!Number.isSafeInteger(instructorId)) continue;
    const instructor = instructorById.get(instructorId);
    if (!instructor) {
      issue(
        issues,
        "recurring_classes.csv",
        row.rowNumber,
        "instructor_id",
        `Instructor ID ${instructorId} does not exist`,
      );
      continue;
    }
    if (!validDateTime(row.data.start_at)) continue;
    const localDate = row.data.start_at.slice(0, 10);
    const localTime = row.data.start_at.slice(11, 16);
    const weekday = new Date(`${localDate}T00:00:00.000Z`).getUTCDay();
    const activeSchedule = instructor.instructorSchedules.find((schedule) => {
      const effectiveFrom = schedule.effectiveFrom.toISOString().slice(0, 10);
      const effectiveTo = schedule.effectiveTo?.toISOString().slice(0, 10);
      return (
        effectiveFrom <= localDate &&
        (effectiveTo === undefined || localDate < effectiveTo)
      );
    });
    const matchesSlot = activeSchedule?.slots.some(
      (slot) =>
        slot.weekday === weekday &&
        slot.startTime.toISOString().slice(11, 16) === localTime,
    );
    if (!matchesSlot) {
      issue(
        issues,
        "recurring_classes.csv",
        row.rowNumber,
        "start_at",
        `Instructor ID ${instructorId} has no matching active schedule slot at ${row.data.start_at}`,
      );
    }
  }
  return planIds;
}

async function validateInstructorDatabase(
  tx: Prisma.TransactionClient,
  parsed: ParsedPackage,
  issues: IncrementalImportIssue[],
) {
  const rows = parsed.rows["instructors.csv"] ?? [];
  const fields = [
    ["email", "email"],
    ["class_url", "classURL"],
    ["icon", "icon"],
    ["nickname", "nickname"],
    ["meeting_id", "meetingId"],
    ["passcode", "passcode"],
  ] as const;

  for (const [column, prismaField] of fields) {
    const values = rows.map((row) => row.data[column]);
    const conflicts = await tx.instructor.findMany({
      where: { [prismaField]: { in: values } },
      select: { [prismaField]: true },
    });
    for (const conflict of conflicts) {
      const value = String(conflict[prismaField]);
      issue(
        issues,
        "instructors.csv",
        findRow(parsed, "instructors.csv", column, value) ?? null,
        column,
        `Value "${value}" already exists`,
      );
    }
  }
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function optionalDateOnly(value: string) {
  return value ? dateOnly(value) : null;
}

function optionalDateTime(value: string) {
  return value ? new Date(value) : null;
}

function timeOnly(value: string) {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

async function insertCustomers(
  tx: Prisma.TransactionClient,
  parsed: ParsedPackage,
  planIds: Map<string, number>,
  options: IncrementalImportExecutionOptions,
) {
  const customerIds = new Map<string, number>();
  const childIds = new Map<string, number>();
  const subscriptionIds = new Map<string, number>();
  let insertedCount = 0;
  for (const row of parsed.rows["customers.csv"] ?? []) {
    const customer = await tx.customer.create({
      data: {
        name: row.data.name,
        email: row.data.email,
        password: await hashPassword(row.data.temp_password),
        prefecture: row.data.prefecture,
        emailVerified: new Date(),
        hasSeenWelcome: row.data.has_seen_welcome === "true",
        terminationAt: optionalDateTime(row.data.termination_at),
      },
      select: { id: true },
    });
    customerIds.set(row.data.customer_ref, customer.id);
    insertedCount += 1;
    await options.onPrimaryRecordInserted?.(insertedCount);
  }
  if ((parsed.rows["children.csv"] ?? []).length > 0) {
    const childRows = parsed.rows["children.csv"] ?? [];
    const createdChildren = await tx.child.createManyAndReturn({
      data: (parsed.rows["children.csv"] ?? []).map((row) => ({
        customerId: customerIds.get(row.data.customer_ref)!,
        name: row.data.name,
        birthdate: optionalDateOnly(row.data.birthdate),
        personalInfo: row.data.personal_info || null,
      })),
      select: { id: true },
    });
    childRows.forEach((row, index) => {
      childIds.set(row.data.child_ref, createdChildren[index].id);
    });
  }
  if ((parsed.rows["subscriptions.csv"] ?? []).length > 0) {
    const subscriptionRows = parsed.rows["subscriptions.csv"] ?? [];
    const createdSubscriptions = await tx.subscription.createManyAndReturn({
      data: subscriptionRows.map((row) => ({
        customerId: customerIds.get(row.data.customer_ref)!,
        planId: planIds.get(row.data.plan_name)!,
        selectType: row.data.select_type,
        startAt: new Date(row.data.start_at),
        endAt: optionalDateTime(row.data.end_at),
      })),
      select: { id: true },
    });
    subscriptionRows.forEach((row, index) => {
      subscriptionIds.set(
        row.data.subscription_ref,
        createdSubscriptions[index].id,
      );
    });
  }

  const recurringRows = parsed.rows["recurring_classes.csv"] ?? [];
  if (recurringRows.length > 0) {
    const createdRecurringClasses = await tx.recurringClass.createManyAndReturn(
      {
        data: recurringRows.map((row) => ({
          subscriptionId: subscriptionIds.get(row.data.subscription_ref)!,
          instructorId: Number(row.data.instructor_id),
          startAt: new Date(row.data.start_at),
          endAt: optionalDateTime(row.data.end_at),
        })),
        select: { id: true },
      },
    );
    const recurringClassIds = new Map<string, number>();
    recurringRows.forEach((row, index) => {
      recurringClassIds.set(
        row.data.recurring_class_ref,
        createdRecurringClasses[index].id,
      );
    });
    const attendanceRows = parsed.rows["recurring_class_attendance.csv"] ?? [];
    if (attendanceRows.length > 0) {
      await tx.recurringClassAttendance.createMany({
        data: attendanceRows.map((row) => ({
          recurringClassId: recurringClassIds.get(
            row.data.recurring_class_ref,
          )!,
          childrenId: childIds.get(row.data.child_ref)!,
        })),
      });
    }
  }
}

async function insertInstructors(
  tx: Prisma.TransactionClient,
  parsed: ParsedPackage,
  options: IncrementalImportExecutionOptions,
) {
  const instructorIds = new Map<string, number>();
  let insertedCount = 0;
  for (const row of parsed.rows["instructors.csv"] ?? []) {
    const instructor = await tx.instructor.create({
      data: {
        name: row.data.name,
        email: row.data.email,
        password: await hashPassword(row.data.temp_password),
        classURL: row.data.class_url,
        icon: row.data.icon,
        nickname: row.data.nickname,
        meetingId: row.data.meeting_id,
        passcode: row.data.passcode,
        birthdate: dateOnly(row.data.birthdate),
        favoriteFood: row.data.favorite_food,
        hobby: row.data.hobby,
        lifeHistory: row.data.life_history,
        messageForChildren: row.data.message_for_children,
        skill: row.data.skill,
        workingTime: row.data.working_time,
        englishBackground: Number(row.data.english_background),
        terminationAt: optionalDateTime(row.data.termination_at),
      },
      select: { id: true },
    });
    instructorIds.set(row.data.instructor_ref, instructor.id);
    insertedCount += 1;
    await options.onPrimaryRecordInserted?.(insertedCount);
  }

  if ((parsed.rows["instructor_fees.csv"] ?? []).length > 0) {
    await tx.instructorFee.createMany({
      data: (parsed.rows["instructor_fees.csv"] ?? []).map((row) => ({
        instructorId: instructorIds.get(row.data.instructor_ref)!,
        currency: row.data.currency,
        effectiveFrom: dateOnly(row.data.effective_from),
        effectiveTo: optionalDateOnly(row.data.effective_to),
        trialFee: Number(row.data.trial_fee),
        regularFee: Number(row.data.regular_fee),
        cancelFee: Number(row.data.cancel_fee),
        cancelWithoutNoticeFee: Number(row.data.cancel_without_notice_fee),
        monthlyCancelFee: Number(row.data.monthly_cancel_fee || "0"),
      })),
    });
  }

  const groups = new Map<
    string,
    {
      instructorId: number;
      effectiveFrom: Date;
      effectiveTo: Date | null;
      timezone: string;
      slots: Array<{ weekday: number; startTime: Date }>;
    }
  >();
  for (const row of parsed.rows["instructor_schedules.csv"] ?? []) {
    const key = [
      row.data.instructor_ref,
      row.data.effective_from,
      row.data.effective_to,
      row.data.timezone,
    ].join("\0");
    const group = groups.get(key) ?? {
      instructorId: instructorIds.get(row.data.instructor_ref)!,
      effectiveFrom: dateOnly(row.data.effective_from),
      effectiveTo: optionalDateOnly(row.data.effective_to),
      timezone: row.data.timezone,
      slots: [],
    };
    group.slots.push({
      weekday: Number(row.data.weekday),
      startTime: timeOnly(row.data.start_time),
    });
    groups.set(key, group);
  }
  for (const group of groups.values()) {
    await tx.instructorSchedule.create({
      data: {
        instructorId: group.instructorId,
        effectiveFrom: group.effectiveFrom,
        effectiveTo: group.effectiveTo,
        timezone: group.timezone,
        slots: { create: group.slots },
      },
    });
  }
}

function prismaUniqueIssue(
  operation: IncrementalImportOperation,
  parsed: ParsedPackage,
  error: Prisma.PrismaClientKnownRequestError,
) {
  const target = Array.isArray(error.meta?.target)
    ? error.meta.target.map(String)
    : [];
  const mapping =
    operation === "incremental-customers"
      ? ({
          email: ["customers.csv", "email"],
          selectType: ["subscriptions.csv", "select_type"],
        } as const)
      : ({
          email: ["instructors.csv", "email"],
          classURL: ["instructors.csv", "class_url"],
          icon: ["instructors.csv", "icon"],
          nickname: ["instructors.csv", "nickname"],
          meetingId: ["instructors.csv", "meeting_id"],
          passcode: ["instructors.csv", "passcode"],
        } as const);
  const mapped = target
    .map((column) => mapping[column as keyof typeof mapping])
    .find(Boolean);
  const fallbackFile = filesFor(operation)[0];
  const file = mapped?.[0] ?? fallbackFile;
  const column = mapped?.[1] ?? (target.join(",") || null);
  const candidateRows =
    column && !column.includes(",")
      ? (parsed.rows[file] ?? [])
          .filter((row) => row.data[column])
          .map((row) => row.rowNumber)
      : [];
  return (candidateRows.length > 0 ? candidateRows : [null]).map(
    (row) =>
      ({
        file,
        row,
        column,
        message: "A value became non-unique while the import was executing",
      }) satisfies IncrementalImportIssue,
  );
}

export async function executeIncrementalImport(
  zipBuffer: Buffer,
  operation: IncrementalImportOperation,
  options: IncrementalImportExecutionOptions = {},
) {
  const parsed = await parsePackage(zipBuffer, operation);
  try {
    await prisma.$transaction(
      async (tx) => {
        const issues: IncrementalImportIssue[] = [];
        if (operation === "incremental-customers") {
          const planIds = await validateCustomerDatabase(tx, parsed, issues);
          if (issues.length > 0) {
            throw new IncrementalImportValidationError(
              operation,
              parsed.report,
              issues,
            );
          }
          await insertCustomers(tx, parsed, planIds, options);
        } else {
          await validateInstructorDatabase(tx, parsed, issues);
          if (issues.length > 0) {
            throw new IncrementalImportValidationError(
              operation,
              parsed.report,
              issues,
            );
          }
          await insertInstructors(tx, parsed, options);
        }
      },
      { timeout: IMPORT_TRANSACTION_TIMEOUT_MS },
    );
  } catch (error) {
    if (error instanceof IncrementalImportValidationError) throw error;
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new IncrementalImportValidationError(operation, parsed.report, [
        ...prismaUniqueIssue(operation, parsed, error),
      ]);
    }
    throw error;
  }

  return {
    operation,
    imported: true,
    report: {
      ...parsed.report,
      importedByFile: { ...parsed.report.rowsByFile },
    },
  };
}
