import JSZip from "jszip";
import { Prisma, Status } from "../../../generated/prisma";
import { prisma } from "../../../prisma/prismaClient";
import { hashPassword } from "../../utils/commonUtils";
import {
  MANDATORY_NORMALIZED_FILES,
  NORMALIZED_HEADERS,
  normalizeCsvCell,
  parseCsv,
  type NormalizedFileName,
} from "./normalize";

type RowByFile = {
  "plans.csv": Record<
    | "plan_ref"
    | "name"
    | "description"
    | "weekly_class_times"
    | "is_native"
    | "termination_at",
    string
  >;
  "customers.csv": Record<
    | "customer_ref"
    | "name"
    | "email"
    | "temp_password"
    | "prefecture"
    | "termination_at"
    | "has_seen_welcome",
    string
  >;
  "children.csv": Record<
    "child_ref" | "customer_ref" | "name" | "birthdate" | "personal_info",
    string
  >;
  "subscriptions.csv": Record<
    | "subscription_ref"
    | "customer_ref"
    | "plan_ref"
    | "select_type"
    | "start_at"
    | "end_at",
    string
  >;
  "instructors.csv": Record<
    | "instructor_ref"
    | "name"
    | "email"
    | "temp_password"
    | "class_url"
    | "icon"
    | "nickname"
    | "meeting_id"
    | "passcode"
    | "birthdate"
    | "favorite_food"
    | "hobby"
    | "life_history"
    | "message_for_children"
    | "skill"
    | "working_time"
    | "is_native"
    | "termination_at",
    string
  >;
  "instructor_fees.csv": Record<
    | "instructor_ref"
    | "currency"
    | "effective_from"
    | "effective_to"
    | "trial_fee"
    | "regular_fee"
    | "cancel_fee"
    | "cancel_without_notice_fee",
    string
  >;
  "instructor_schedules.csv": Record<
    | "instructor_ref"
    | "effective_from"
    | "effective_to"
    | "timezone"
    | "weekday"
    | "start_time",
    string
  >;
  "instructor_absences.csv": Record<"instructor_ref" | "absent_at", string>;
  "events.csv": Record<"event_ref" | "name" | "color", string>;
  "schedules.csv": Record<"schedule_ref" | "date" | "event_ref", string>;
  "system_status.csv": Record<"status", string>;
  "recurring_classes.csv": Record<
    | "recurring_class_ref"
    | "subscription_ref"
    | "instructor_ref"
    | "start_at"
    | "end_at",
    string
  >;
  "recurring_class_attendance.csv": Record<
    "recurring_class_ref" | "child_ref",
    string
  >;
  "classes.csv": Record<
    | "class_ref"
    | "customer_ref"
    | "instructor_ref"
    | "recurring_class_ref"
    | "subscription_ref"
    | "date_time"
    | "status"
    | "rebookable_until"
    | "class_code"
    | "is_free_trial",
    string
  >;
  "class_attendance.csv": Record<"class_ref" | "child_ref", string>;
};

type HeaderKeysFor<K extends NormalizedFileName> = keyof RowByFile[K] & string;
type HeaderValuesByFile = typeof NORMALIZED_HEADERS;

type MissingRowKeysInHeaders = {
  [K in NormalizedFileName]: Exclude<
    HeaderKeysFor<K>,
    HeaderValuesByFile[K][number]
  >;
}[NormalizedFileName];

type ExtraHeaderKeysNotInRows = {
  [K in NormalizedFileName]: Exclude<
    HeaderValuesByFile[K][number],
    HeaderKeysFor<K>
  >;
}[NormalizedFileName];

type AssertNever<T extends never> = T;
type _CheckMissingRowKeysInHeaders = AssertNever<MissingRowKeysInHeaders>;
type _CheckExtraHeaderKeysNotInRows = AssertNever<ExtraHeaderKeysNotInRows>;

interface ImportValidationIssue {
  file: NormalizedFileName;
  row: number | null;
  column: string | null;
  message: string;
}

interface ImportValidationReport {
  rowsByFile: Record<NormalizedFileName, number>;
}

interface ImportValidationResult {
  isValid: boolean;
  issues: ImportValidationIssue[];
  report: ImportValidationReport;
}

const REF_PATTERN = /^[A-Z]{2}[0-9]{4}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;
const STATUS_VALUES = new Set([
  "booked",
  "completed",
  "canceledByCustomer",
  "canceledByInstructor",
  "pending",
  "rebooked",
  "declined",
]);
const IMPORT_TRANSACTION_TIMEOUT_MS = 180_000;
const IMPORT_RESET_TABLES = [
  "ClassAttendance",
  "Class",
  "RecurringClassAttendance",
  "RecurringClass",
  "Subscription",
  "Child",
  "Customer",
  "InstructorAbsence",
  "InstructorSlot",
  "InstructorSchedule",
  "InstructorFee",
  "Instructor",
  "Schedule",
  "Event",
  "Plan",
  "SystemStatus",
  "PasswordResetToken",
  "VerificationToken",
  "Admin",
] as const;
const IMPORT_RESET_TRUNCATE_SQL = `TRUNCATE TABLE ${IMPORT_RESET_TABLES.map((table) => `"${table}"`).join(", ")} RESTART IDENTITY CASCADE`;

interface RowEnvelope<T> {
  rowNumber: number;
  data: T;
}

type ParsedNormalizedRows = {
  "plans.csv": RowEnvelope<RowByFile["plans.csv"]>[];
  "customers.csv": RowEnvelope<RowByFile["customers.csv"]>[];
  "children.csv": RowEnvelope<RowByFile["children.csv"]>[];
  "subscriptions.csv": RowEnvelope<RowByFile["subscriptions.csv"]>[];
  "instructors.csv": RowEnvelope<RowByFile["instructors.csv"]>[];
  "instructor_fees.csv": RowEnvelope<RowByFile["instructor_fees.csv"]>[];
  "instructor_schedules.csv": RowEnvelope<
    RowByFile["instructor_schedules.csv"]
  >[];
  "instructor_absences.csv": RowEnvelope<
    RowByFile["instructor_absences.csv"]
  >[];
  "events.csv": RowEnvelope<RowByFile["events.csv"]>[];
  "schedules.csv": RowEnvelope<RowByFile["schedules.csv"]>[];
  "system_status.csv": RowEnvelope<RowByFile["system_status.csv"]>[];
  "recurring_classes.csv": RowEnvelope<RowByFile["recurring_classes.csv"]>[];
  "recurring_class_attendance.csv": RowEnvelope<
    RowByFile["recurring_class_attendance.csv"]
  >[];
  "classes.csv": RowEnvelope<RowByFile["classes.csv"]>[];
  "class_attendance.csv": RowEnvelope<RowByFile["class_attendance.csv"]>[];
};

type TxClient = Prisma.TransactionClient;

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function isValidDateTime(value: string): boolean {
  if (!DATETIME_PATTERN.test(value)) {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
}

function isValidTime(value: string): boolean {
  if (!TIME_PATTERN.test(value)) {
    return false;
  }
  const [hours, minutes] = value.split(":").map(Number);
  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

function normalizeCell(value: string | undefined): string {
  return normalizeCsvCell(value);
}

function addIssue(
  issues: ImportValidationIssue[],
  file: NormalizedFileName,
  row: number | null,
  column: string | null,
  message: string,
) {
  issues.push({ file, row, column, message });
}

function assertRequired(
  issues: ImportValidationIssue[],
  file: NormalizedFileName,
  row: number,
  column: string,
  value: string,
) {
  if (!value) {
    addIssue(issues, file, row, column, "Value is required");
  }
}

function assertRefFormat(
  issues: ImportValidationIssue[],
  file: NormalizedFileName,
  row: number,
  column: string,
  value: string,
) {
  if (!value) {
    return;
  }
  if (!REF_PATTERN.test(value)) {
    addIssue(
      issues,
      file,
      row,
      column,
      `Reference key must match ${REF_PATTERN.source}`,
    );
  }
}

function assertBoolean(
  issues: ImportValidationIssue[],
  file: NormalizedFileName,
  row: number,
  column: string,
  value: string,
) {
  if (!value) {
    return;
  }
  if (value !== "true" && value !== "false") {
    addIssue(issues, file, row, column, 'Boolean must be "true" or "false"');
  }
}

function assertDate(
  issues: ImportValidationIssue[],
  file: NormalizedFileName,
  row: number,
  column: string,
  value: string,
) {
  if (!value) {
    return;
  }
  if (!isValidDate(value)) {
    addIssue(issues, file, row, column, "Date must be YYYY-MM-DD");
  }
}

function assertDateTime(
  issues: ImportValidationIssue[],
  file: NormalizedFileName,
  row: number,
  column: string,
  value: string,
) {
  if (!value) {
    return;
  }
  if (!isValidDateTime(value)) {
    addIssue(
      issues,
      file,
      row,
      column,
      "DateTime must be ISO 8601 with timezone",
    );
  }
}

function assertTime(
  issues: ImportValidationIssue[],
  file: NormalizedFileName,
  row: number,
  column: string,
  value: string,
) {
  if (!value) {
    return;
  }
  if (!isValidTime(value)) {
    addIssue(issues, file, row, column, "Time must be HH:mm");
  }
}

function assertUnique(
  issues: ImportValidationIssue[],
  file: NormalizedFileName,
  rows: RowEnvelope<Record<string, string>>[],
  columns: string[],
  label: string,
) {
  const seen = new Map<string, number>();
  for (const row of rows) {
    const values = columns.map((column) => row.data[column]);
    if (values.some((value) => !value)) {
      continue;
    }
    const key = values.join("\u0000");
    const firstRow = seen.get(key);
    if (firstRow) {
      addIssue(
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

function assertExists(
  issues: ImportValidationIssue[],
  file: NormalizedFileName,
  row: number,
  column: string,
  value: string,
  refSet: Set<string>,
  targetFile: NormalizedFileName,
) {
  if (!value) {
    return;
  }
  if (!refSet.has(value)) {
    addIssue(
      issues,
      file,
      row,
      column,
      `Reference \"${value}\" does not exist in ${targetFile}`,
    );
  }
}

function parseFileRows<K extends NormalizedFileName>(
  file: K,
  content: string,
  issues: ImportValidationIssue[],
): RowEnvelope<RowByFile[K]>[] {
  const parsedRows = parseCsv(content);
  if (parsedRows.length === 0) {
    addIssue(issues, file, null, null, "CSV must include a header row");
    return [];
  }

  const expectedHeaders = NORMALIZED_HEADERS[file] as readonly string[];
  const actualHeaders = (parsedRows[0] ?? []).map((cell) =>
    normalizeCell(cell),
  );

  const sameLength = actualHeaders.length === expectedHeaders.length;
  const sameOrder = expectedHeaders.every(
    (header, index) => actualHeaders[index] === header,
  );

  if (!sameLength || !sameOrder) {
    addIssue(
      issues,
      file,
      1,
      null,
      `Header mismatch. Expected: ${expectedHeaders.join(",")}`,
    );
    return [];
  }

  const rows: RowEnvelope<RowByFile[K]>[] = [];
  for (let i = 1; i < parsedRows.length; i += 1) {
    const row = parsedRows[i];
    if (row.length === 1 && normalizeCell(row[0]) === "") {
      continue;
    }

    if (row.length > expectedHeaders.length) {
      addIssue(
        issues,
        file,
        i + 1,
        null,
        `Row has too many columns. Expected ${expectedHeaders.length}`,
      );
      continue;
    }

    const normalized: Record<string, string> = {};
    for (let col = 0; col < expectedHeaders.length; col += 1) {
      const header = expectedHeaders[col];
      normalized[header] = normalizeCell(row[col]);
    }

    rows.push({
      rowNumber: i + 1,
      data: normalized as RowByFile[K],
    });
  }

  return rows;
}

function parseNormalizedRows(
  files: Partial<Record<NormalizedFileName, string>>,
  issues: ImportValidationIssue[],
): ParsedNormalizedRows {
  return {
    "plans.csv": parseFileRows("plans.csv", files["plans.csv"] ?? "", issues),
    "customers.csv": parseFileRows(
      "customers.csv",
      files["customers.csv"] ?? "",
      issues,
    ),
    "children.csv": parseFileRows(
      "children.csv",
      files["children.csv"] ?? "",
      issues,
    ),
    "subscriptions.csv": parseFileRows(
      "subscriptions.csv",
      files["subscriptions.csv"] ?? "",
      issues,
    ),
    "instructors.csv": parseFileRows(
      "instructors.csv",
      files["instructors.csv"] ?? "",
      issues,
    ),
    "instructor_fees.csv": parseFileRows(
      "instructor_fees.csv",
      files["instructor_fees.csv"] ?? "",
      issues,
    ),
    "instructor_schedules.csv": parseFileRows(
      "instructor_schedules.csv",
      files["instructor_schedules.csv"] ?? "",
      issues,
    ),
    "instructor_absences.csv": parseFileRows(
      "instructor_absences.csv",
      files["instructor_absences.csv"] ?? "",
      issues,
    ),
    "events.csv": parseFileRows(
      "events.csv",
      files["events.csv"] ?? "",
      issues,
    ),
    "schedules.csv": parseFileRows(
      "schedules.csv",
      files["schedules.csv"] ?? "",
      issues,
    ),
    "system_status.csv": parseFileRows(
      "system_status.csv",
      files["system_status.csv"] ?? "",
      issues,
    ),
    "recurring_classes.csv": parseFileRows(
      "recurring_classes.csv",
      files["recurring_classes.csv"] ?? "",
      issues,
    ),
    "recurring_class_attendance.csv": parseFileRows(
      "recurring_class_attendance.csv",
      files["recurring_class_attendance.csv"] ?? "",
      issues,
    ),
    "classes.csv": parseFileRows(
      "classes.csv",
      files["classes.csv"] ?? "",
      issues,
    ),
    "class_attendance.csv": parseFileRows(
      "class_attendance.csv",
      files["class_attendance.csv"] ?? "",
      issues,
    ),
  };
}

export async function extractNormalizedFilesFromZip(
  zipBuffer: Buffer,
): Promise<Partial<Record<NormalizedFileName, string>>> {
  const zip = await JSZip.loadAsync(zipBuffer);
  const files: Partial<Record<NormalizedFileName, string>> = {};

  for (const fileName of MANDATORY_NORMALIZED_FILES) {
    const entry = zip.file(fileName);
    if (!entry) {
      continue;
    }
    files[fileName] = await entry.async("string");
  }

  return files;
}

export function validateNormalizedImportFiles(
  files: Partial<Record<NormalizedFileName, string>>,
): ImportValidationResult {
  const issues: ImportValidationIssue[] = [];

  for (const fileName of MANDATORY_NORMALIZED_FILES) {
    if (typeof files[fileName] !== "string") {
      addIssue(
        issues,
        fileName,
        null,
        null,
        `Missing required file: ${fileName}`,
      );
    }
  }

  const parsed = parseNormalizedRows(files, issues);

  const rowsByFile: Record<NormalizedFileName, number> = {
    "plans.csv": parsed["plans.csv"].length,
    "customers.csv": parsed["customers.csv"].length,
    "children.csv": parsed["children.csv"].length,
    "subscriptions.csv": parsed["subscriptions.csv"].length,
    "instructors.csv": parsed["instructors.csv"].length,
    "instructor_fees.csv": parsed["instructor_fees.csv"].length,
    "instructor_schedules.csv": parsed["instructor_schedules.csv"].length,
    "instructor_absences.csv": parsed["instructor_absences.csv"].length,
    "events.csv": parsed["events.csv"].length,
    "schedules.csv": parsed["schedules.csv"].length,
    "system_status.csv": parsed["system_status.csv"].length,
    "recurring_classes.csv": parsed["recurring_classes.csv"].length,
    "recurring_class_attendance.csv":
      parsed["recurring_class_attendance.csv"].length,
    "classes.csv": parsed["classes.csv"].length,
    "class_attendance.csv": parsed["class_attendance.csv"].length,
  };

  for (const row of parsed["plans.csv"]) {
    assertRequired(
      issues,
      "plans.csv",
      row.rowNumber,
      "plan_ref",
      row.data.plan_ref,
    );
    assertRequired(issues, "plans.csv", row.rowNumber, "name", row.data.name);
    assertRefFormat(
      issues,
      "plans.csv",
      row.rowNumber,
      "plan_ref",
      row.data.plan_ref,
    );
    if (
      row.data.weekly_class_times &&
      !/^\d+$/.test(row.data.weekly_class_times)
    ) {
      addIssue(
        issues,
        "plans.csv",
        row.rowNumber,
        "weekly_class_times",
        "weekly_class_times must be an integer",
      );
    }
    assertBoolean(
      issues,
      "plans.csv",
      row.rowNumber,
      "is_native",
      row.data.is_native,
    );
    assertDateTime(
      issues,
      "plans.csv",
      row.rowNumber,
      "termination_at",
      row.data.termination_at,
    );
  }

  for (const row of parsed["customers.csv"]) {
    assertRequired(
      issues,
      "customers.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
    );
    assertRequired(
      issues,
      "customers.csv",
      row.rowNumber,
      "email",
      row.data.email,
    );
    assertRefFormat(
      issues,
      "customers.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
    );
    assertBoolean(
      issues,
      "customers.csv",
      row.rowNumber,
      "has_seen_welcome",
      row.data.has_seen_welcome,
    );
    assertDateTime(
      issues,
      "customers.csv",
      row.rowNumber,
      "termination_at",
      row.data.termination_at,
    );
  }

  for (const row of parsed["children.csv"]) {
    assertRequired(
      issues,
      "children.csv",
      row.rowNumber,
      "child_ref",
      row.data.child_ref,
    );
    assertRequired(
      issues,
      "children.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
    );
    assertRefFormat(
      issues,
      "children.csv",
      row.rowNumber,
      "child_ref",
      row.data.child_ref,
    );
    assertRefFormat(
      issues,
      "children.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
    );
    assertDate(
      issues,
      "children.csv",
      row.rowNumber,
      "birthdate",
      row.data.birthdate,
    );
  }

  for (const row of parsed["subscriptions.csv"]) {
    assertRequired(
      issues,
      "subscriptions.csv",
      row.rowNumber,
      "subscription_ref",
      row.data.subscription_ref,
    );
    assertRequired(
      issues,
      "subscriptions.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
    );
    assertRequired(
      issues,
      "subscriptions.csv",
      row.rowNumber,
      "plan_ref",
      row.data.plan_ref,
    );
    assertRefFormat(
      issues,
      "subscriptions.csv",
      row.rowNumber,
      "subscription_ref",
      row.data.subscription_ref,
    );
    assertRefFormat(
      issues,
      "subscriptions.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
    );
    assertRefFormat(
      issues,
      "subscriptions.csv",
      row.rowNumber,
      "plan_ref",
      row.data.plan_ref,
    );
    assertDateTime(
      issues,
      "subscriptions.csv",
      row.rowNumber,
      "start_at",
      row.data.start_at,
    );
    assertDateTime(
      issues,
      "subscriptions.csv",
      row.rowNumber,
      "end_at",
      row.data.end_at,
    );
  }

  for (const row of parsed["instructors.csv"]) {
    assertRequired(
      issues,
      "instructors.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
    );
    assertRefFormat(
      issues,
      "instructors.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
    );
    assertBoolean(
      issues,
      "instructors.csv",
      row.rowNumber,
      "is_native",
      row.data.is_native,
    );
    assertDate(
      issues,
      "instructors.csv",
      row.rowNumber,
      "birthdate",
      row.data.birthdate,
    );
    assertDateTime(
      issues,
      "instructors.csv",
      row.rowNumber,
      "termination_at",
      row.data.termination_at,
    );
  }

  for (const row of parsed["instructor_fees.csv"]) {
    assertRequired(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
    );
    assertRequired(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "currency",
      row.data.currency,
    );
    assertRequired(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "effective_from",
      row.data.effective_from,
    );
    assertRequired(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "trial_fee",
      row.data.trial_fee,
    );
    assertRequired(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "regular_fee",
      row.data.regular_fee,
    );
    assertRequired(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "cancel_fee",
      row.data.cancel_fee,
    );
    assertRequired(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "cancel_without_notice_fee",
      row.data.cancel_without_notice_fee,
    );
    assertRefFormat(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
    );
    assertDate(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "effective_from",
      row.data.effective_from,
    );
    assertDate(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "effective_to",
      row.data.effective_to,
    );
    if (row.data.currency && !/^[A-Z]{3}$/.test(row.data.currency)) {
      addIssue(
        issues,
        "instructor_fees.csv",
        row.rowNumber,
        "currency",
        "currency must be a 3-letter uppercase code",
      );
    }
    for (const [column, value] of [
      ["trial_fee", row.data.trial_fee],
      ["regular_fee", row.data.regular_fee],
      ["cancel_fee", row.data.cancel_fee],
      ["cancel_without_notice_fee", row.data.cancel_without_notice_fee],
    ] as const) {
      if (value && !/^\d+$/.test(value)) {
        addIssue(
          issues,
          "instructor_fees.csv",
          row.rowNumber,
          column,
          `${column} must be a non-negative integer`,
        );
      }
    }
  }

  for (const row of parsed["instructor_schedules.csv"]) {
    assertRequired(
      issues,
      "instructor_schedules.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
    );
    assertRefFormat(
      issues,
      "instructor_schedules.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
    );
    assertDate(
      issues,
      "instructor_schedules.csv",
      row.rowNumber,
      "effective_from",
      row.data.effective_from,
    );
    assertDate(
      issues,
      "instructor_schedules.csv",
      row.rowNumber,
      "effective_to",
      row.data.effective_to,
    );
    if (row.data.weekday && !/^\d$/.test(row.data.weekday)) {
      addIssue(
        issues,
        "instructor_schedules.csv",
        row.rowNumber,
        "weekday",
        "weekday must be 0-6",
      );
    }
    if (row.data.weekday) {
      const weekday = Number(row.data.weekday);
      if (weekday < 0 || weekday > 6) {
        addIssue(
          issues,
          "instructor_schedules.csv",
          row.rowNumber,
          "weekday",
          "weekday must be 0-6",
        );
      }
    }
    assertTime(
      issues,
      "instructor_schedules.csv",
      row.rowNumber,
      "start_time",
      row.data.start_time,
    );
  }

  for (const row of parsed["instructor_absences.csv"]) {
    assertRequired(
      issues,
      "instructor_absences.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
    );
    assertRequired(
      issues,
      "instructor_absences.csv",
      row.rowNumber,
      "absent_at",
      row.data.absent_at,
    );
    assertRefFormat(
      issues,
      "instructor_absences.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
    );
    assertDateTime(
      issues,
      "instructor_absences.csv",
      row.rowNumber,
      "absent_at",
      row.data.absent_at,
    );
  }

  for (const row of parsed["events.csv"]) {
    assertRequired(
      issues,
      "events.csv",
      row.rowNumber,
      "event_ref",
      row.data.event_ref,
    );
    assertRequired(issues, "events.csv", row.rowNumber, "name", row.data.name);
    assertRequired(
      issues,
      "events.csv",
      row.rowNumber,
      "color",
      row.data.color,
    );
    assertRefFormat(
      issues,
      "events.csv",
      row.rowNumber,
      "event_ref",
      row.data.event_ref,
    );
  }

  for (const row of parsed["schedules.csv"]) {
    assertRequired(
      issues,
      "schedules.csv",
      row.rowNumber,
      "schedule_ref",
      row.data.schedule_ref,
    );
    assertRequired(
      issues,
      "schedules.csv",
      row.rowNumber,
      "date",
      row.data.date,
    );
    assertRequired(
      issues,
      "schedules.csv",
      row.rowNumber,
      "event_ref",
      row.data.event_ref,
    );
    assertRefFormat(
      issues,
      "schedules.csv",
      row.rowNumber,
      "schedule_ref",
      row.data.schedule_ref,
    );
    assertRefFormat(
      issues,
      "schedules.csv",
      row.rowNumber,
      "event_ref",
      row.data.event_ref,
    );
    assertDate(issues, "schedules.csv", row.rowNumber, "date", row.data.date);
  }

  if (parsed["system_status.csv"].length !== 1) {
    addIssue(
      issues,
      "system_status.csv",
      null,
      "status",
      "system_status.csv must contain exactly one row",
    );
  }
  for (const row of parsed["system_status.csv"]) {
    assertRequired(
      issues,
      "system_status.csv",
      row.rowNumber,
      "status",
      row.data.status,
    );
  }

  for (const row of parsed["recurring_classes.csv"]) {
    assertRequired(
      issues,
      "recurring_classes.csv",
      row.rowNumber,
      "recurring_class_ref",
      row.data.recurring_class_ref,
    );
    assertRefFormat(
      issues,
      "recurring_classes.csv",
      row.rowNumber,
      "recurring_class_ref",
      row.data.recurring_class_ref,
    );
    assertRefFormat(
      issues,
      "recurring_classes.csv",
      row.rowNumber,
      "subscription_ref",
      row.data.subscription_ref,
    );
    assertRefFormat(
      issues,
      "recurring_classes.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
    );
    assertDateTime(
      issues,
      "recurring_classes.csv",
      row.rowNumber,
      "start_at",
      row.data.start_at,
    );
    assertDateTime(
      issues,
      "recurring_classes.csv",
      row.rowNumber,
      "end_at",
      row.data.end_at,
    );
  }

  for (const row of parsed["recurring_class_attendance.csv"]) {
    assertRequired(
      issues,
      "recurring_class_attendance.csv",
      row.rowNumber,
      "recurring_class_ref",
      row.data.recurring_class_ref,
    );
    assertRequired(
      issues,
      "recurring_class_attendance.csv",
      row.rowNumber,
      "child_ref",
      row.data.child_ref,
    );
    assertRefFormat(
      issues,
      "recurring_class_attendance.csv",
      row.rowNumber,
      "recurring_class_ref",
      row.data.recurring_class_ref,
    );
    assertRefFormat(
      issues,
      "recurring_class_attendance.csv",
      row.rowNumber,
      "child_ref",
      row.data.child_ref,
    );
  }

  for (const row of parsed["classes.csv"]) {
    assertRequired(
      issues,
      "classes.csv",
      row.rowNumber,
      "class_ref",
      row.data.class_ref,
    );
    assertRequired(
      issues,
      "classes.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
    );
    assertRequired(
      issues,
      "classes.csv",
      row.rowNumber,
      "status",
      row.data.status,
    );
    assertRefFormat(
      issues,
      "classes.csv",
      row.rowNumber,
      "class_ref",
      row.data.class_ref,
    );
    assertRefFormat(
      issues,
      "classes.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
    );
    assertRefFormat(
      issues,
      "classes.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
    );
    assertRefFormat(
      issues,
      "classes.csv",
      row.rowNumber,
      "recurring_class_ref",
      row.data.recurring_class_ref,
    );
    assertRefFormat(
      issues,
      "classes.csv",
      row.rowNumber,
      "subscription_ref",
      row.data.subscription_ref,
    );
    assertDateTime(
      issues,
      "classes.csv",
      row.rowNumber,
      "date_time",
      row.data.date_time,
    );
    assertDateTime(
      issues,
      "classes.csv",
      row.rowNumber,
      "rebookable_until",
      row.data.rebookable_until,
    );
    assertBoolean(
      issues,
      "classes.csv",
      row.rowNumber,
      "is_free_trial",
      row.data.is_free_trial,
    );
    if (row.data.status && !STATUS_VALUES.has(row.data.status)) {
      addIssue(
        issues,
        "classes.csv",
        row.rowNumber,
        "status",
        "status must match Prisma Status enum",
      );
    }
  }

  for (const row of parsed["class_attendance.csv"]) {
    assertRequired(
      issues,
      "class_attendance.csv",
      row.rowNumber,
      "class_ref",
      row.data.class_ref,
    );
    assertRequired(
      issues,
      "class_attendance.csv",
      row.rowNumber,
      "child_ref",
      row.data.child_ref,
    );
    assertRefFormat(
      issues,
      "class_attendance.csv",
      row.rowNumber,
      "class_ref",
      row.data.class_ref,
    );
    assertRefFormat(
      issues,
      "class_attendance.csv",
      row.rowNumber,
      "child_ref",
      row.data.child_ref,
    );
  }

  assertUnique(
    issues,
    "plans.csv",
    parsed["plans.csv"],
    ["plan_ref"],
    "plan_ref",
  );
  assertUnique(issues, "plans.csv", parsed["plans.csv"], ["name"], "name");
  assertUnique(
    issues,
    "customers.csv",
    parsed["customers.csv"],
    ["customer_ref"],
    "customer_ref",
  );
  assertUnique(
    issues,
    "customers.csv",
    parsed["customers.csv"],
    ["email"],
    "email",
  );
  assertUnique(
    issues,
    "children.csv",
    parsed["children.csv"],
    ["child_ref"],
    "child_ref",
  );
  assertUnique(
    issues,
    "subscriptions.csv",
    parsed["subscriptions.csv"],
    ["subscription_ref"],
    "subscription_ref",
  );
  assertUnique(
    issues,
    "instructors.csv",
    parsed["instructors.csv"],
    ["instructor_ref"],
    "instructor_ref",
  );
  assertUnique(
    issues,
    "instructors.csv",
    parsed["instructors.csv"],
    ["email"],
    "email",
  );
  assertUnique(
    issues,
    "instructors.csv",
    parsed["instructors.csv"],
    ["class_url"],
    "class_url",
  );
  assertUnique(
    issues,
    "instructors.csv",
    parsed["instructors.csv"],
    ["icon"],
    "icon",
  );
  assertUnique(
    issues,
    "instructors.csv",
    parsed["instructors.csv"],
    ["nickname"],
    "nickname",
  );
  assertUnique(
    issues,
    "instructors.csv",
    parsed["instructors.csv"],
    ["meeting_id"],
    "meeting_id",
  );
  assertUnique(
    issues,
    "instructors.csv",
    parsed["instructors.csv"],
    ["passcode"],
    "passcode",
  );
  assertUnique(
    issues,
    "instructor_fees.csv",
    parsed["instructor_fees.csv"],
    ["instructor_ref", "effective_from"],
    "(instructor_ref,effective_from)",
  );
  assertUnique(
    issues,
    "instructor_schedules.csv",
    parsed["instructor_schedules.csv"],
    [
      "instructor_ref",
      "effective_from",
      "effective_to",
      "timezone",
      "weekday",
      "start_time",
    ],
    "(instructor_ref,effective_from,effective_to,timezone,weekday,start_time)",
  );
  assertUnique(
    issues,
    "instructor_absences.csv",
    parsed["instructor_absences.csv"],
    ["instructor_ref", "absent_at"],
    "(instructor_ref,absent_at)",
  );
  assertUnique(
    issues,
    "events.csv",
    parsed["events.csv"],
    ["event_ref"],
    "event_ref",
  );
  assertUnique(issues, "events.csv", parsed["events.csv"], ["name"], "name");
  assertUnique(issues, "events.csv", parsed["events.csv"], ["color"], "color");
  assertUnique(
    issues,
    "schedules.csv",
    parsed["schedules.csv"],
    ["schedule_ref"],
    "schedule_ref",
  );
  assertUnique(
    issues,
    "schedules.csv",
    parsed["schedules.csv"],
    ["date"],
    "date",
  );
  assertUnique(
    issues,
    "recurring_classes.csv",
    parsed["recurring_classes.csv"],
    ["recurring_class_ref"],
    "recurring_class_ref",
  );
  assertUnique(
    issues,
    "recurring_class_attendance.csv",
    parsed["recurring_class_attendance.csv"],
    ["recurring_class_ref", "child_ref"],
    "(recurring_class_ref,child_ref)",
  );
  assertUnique(
    issues,
    "classes.csv",
    parsed["classes.csv"],
    ["class_ref"],
    "class_ref",
  );
  assertUnique(
    issues,
    "class_attendance.csv",
    parsed["class_attendance.csv"],
    ["class_ref", "child_ref"],
    "(class_ref,child_ref)",
  );

  const planRefs = new Set(parsed["plans.csv"].map((r) => r.data.plan_ref));
  const customerRefs = new Set(
    parsed["customers.csv"].map((r) => r.data.customer_ref),
  );
  const childRefs = new Set(
    parsed["children.csv"].map((r) => r.data.child_ref),
  );
  const subscriptionRefs = new Set(
    parsed["subscriptions.csv"].map((r) => r.data.subscription_ref),
  );
  const instructorRefs = new Set(
    parsed["instructors.csv"].map((r) => r.data.instructor_ref),
  );
  const eventRefs = new Set(parsed["events.csv"].map((r) => r.data.event_ref));
  const recurringClassRefs = new Set(
    parsed["recurring_classes.csv"].map((r) => r.data.recurring_class_ref),
  );
  const classRefs = new Set(parsed["classes.csv"].map((r) => r.data.class_ref));

  for (const row of parsed["children.csv"]) {
    assertExists(
      issues,
      "children.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
      customerRefs,
      "customers.csv",
    );
  }

  for (const row of parsed["subscriptions.csv"]) {
    assertExists(
      issues,
      "subscriptions.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
      customerRefs,
      "customers.csv",
    );
    assertExists(
      issues,
      "subscriptions.csv",
      row.rowNumber,
      "plan_ref",
      row.data.plan_ref,
      planRefs,
      "plans.csv",
    );
  }

  for (const row of parsed["instructor_fees.csv"]) {
    assertExists(
      issues,
      "instructor_fees.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
      instructorRefs,
      "instructors.csv",
    );
  }

  for (const row of parsed["instructor_schedules.csv"]) {
    assertExists(
      issues,
      "instructor_schedules.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
      instructorRefs,
      "instructors.csv",
    );
  }

  for (const row of parsed["instructor_absences.csv"]) {
    assertExists(
      issues,
      "instructor_absences.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
      instructorRefs,
      "instructors.csv",
    );
  }

  for (const row of parsed["schedules.csv"]) {
    assertExists(
      issues,
      "schedules.csv",
      row.rowNumber,
      "event_ref",
      row.data.event_ref,
      eventRefs,
      "events.csv",
    );
  }

  for (const row of parsed["recurring_classes.csv"]) {
    assertExists(
      issues,
      "recurring_classes.csv",
      row.rowNumber,
      "subscription_ref",
      row.data.subscription_ref,
      subscriptionRefs,
      "subscriptions.csv",
    );
    assertExists(
      issues,
      "recurring_classes.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
      instructorRefs,
      "instructors.csv",
    );
  }

  for (const row of parsed["recurring_class_attendance.csv"]) {
    assertExists(
      issues,
      "recurring_class_attendance.csv",
      row.rowNumber,
      "recurring_class_ref",
      row.data.recurring_class_ref,
      recurringClassRefs,
      "recurring_classes.csv",
    );
    assertExists(
      issues,
      "recurring_class_attendance.csv",
      row.rowNumber,
      "child_ref",
      row.data.child_ref,
      childRefs,
      "children.csv",
    );
  }

  for (const row of parsed["classes.csv"]) {
    assertExists(
      issues,
      "classes.csv",
      row.rowNumber,
      "customer_ref",
      row.data.customer_ref,
      customerRefs,
      "customers.csv",
    );
    assertExists(
      issues,
      "classes.csv",
      row.rowNumber,
      "instructor_ref",
      row.data.instructor_ref,
      instructorRefs,
      "instructors.csv",
    );
    assertExists(
      issues,
      "classes.csv",
      row.rowNumber,
      "recurring_class_ref",
      row.data.recurring_class_ref,
      recurringClassRefs,
      "recurring_classes.csv",
    );
    assertExists(
      issues,
      "classes.csv",
      row.rowNumber,
      "subscription_ref",
      row.data.subscription_ref,
      subscriptionRefs,
      "subscriptions.csv",
    );
  }

  for (const row of parsed["class_attendance.csv"]) {
    assertExists(
      issues,
      "class_attendance.csv",
      row.rowNumber,
      "class_ref",
      row.data.class_ref,
      classRefs,
      "classes.csv",
    );
    assertExists(
      issues,
      "class_attendance.csv",
      row.rowNumber,
      "child_ref",
      row.data.child_ref,
      childRefs,
      "children.csv",
    );
  }

  return {
    isValid: issues.length === 0,
    issues,
    report: { rowsByFile },
  };
}

const DEFAULT_SEED_ADMIN_EMAILS = ["admin@example.com", "admin2@example.com"];

function parseOptionalDate(value: string): Date | null {
  if (!value) {
    return null;
  }
  return new Date(`${value}T00:00:00.000Z`);
}

function parseOptionalDateTime(value: string): Date | null {
  if (!value) {
    return null;
  }
  return new Date(value);
}

function parseTimeAsDate(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function parseSeedAdminEmails(): string[] {
  const configured =
    process.env.IMPORT_SEED_ADMIN_EMAILS ?? process.env.SEED_ADMIN_EMAILS;
  const source = configured
    ? configured
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email.length > 0)
    : DEFAULT_SEED_ADMIN_EMAILS;
  return Array.from(new Set(source));
}

async function resetImportTargetData(tx: TxClient) {
  const seedAdminEmails = parseSeedAdminEmails();
  const seedAdmins = await tx.admin.findMany({
    where: {
      email: {
        in: seedAdminEmails,
      },
    },
    select: {
      name: true,
      email: true,
      password: true,
    },
  });

  await tx.$executeRawUnsafe(IMPORT_RESET_TRUNCATE_SQL);

  if (seedAdmins.length > 0) {
    await tx.admin.createMany({
      data: seedAdmins,
    });
  }
}

async function insertValidatedRows(tx: TxClient, parsed: ParsedNormalizedRows) {
  const planIdByRef = new Map<string, number>();
  const createdPlans = await tx.plan.createManyAndReturn({
    data: parsed["plans.csv"].map((row) => ({
      name: row.data.name,
      description: row.data.description,
      weeklyClassTimes: Number(row.data.weekly_class_times),
      isNative: row.data.is_native === "true",
      terminationAt: parseOptionalDateTime(row.data.termination_at),
    })),
    select: {
      id: true,
    },
  });
  parsed["plans.csv"].forEach((row, index) => {
    planIdByRef.set(row.data.plan_ref, createdPlans[index].id);
  });

  const customerIdByRef = new Map<string, number>();
  const customerPasswords = await Promise.all(
    parsed["customers.csv"].map((row) => hashPassword(row.data.temp_password)),
  );
  const createdCustomers = await tx.customer.createManyAndReturn({
    data: parsed["customers.csv"].map((row, index) => ({
      name: row.data.name,
      email: row.data.email,
      password: customerPasswords[index],
      prefecture: row.data.prefecture,
      hasSeenWelcome: row.data.has_seen_welcome === "true",
      terminationAt: parseOptionalDateTime(row.data.termination_at),
    })),
    select: {
      id: true,
    },
  });
  parsed["customers.csv"].forEach((row, index) => {
    customerIdByRef.set(row.data.customer_ref, createdCustomers[index].id);
  });

  const childIdByRef = new Map<string, number>();
  const createdChildren = await tx.child.createManyAndReturn({
    data: parsed["children.csv"].map((row) => ({
      customerId: customerIdByRef.get(row.data.customer_ref)!,
      name: row.data.name,
      birthdate: parseOptionalDate(row.data.birthdate),
      personalInfo: row.data.personal_info || null,
    })),
    select: {
      id: true,
    },
  });
  parsed["children.csv"].forEach((row, index) => {
    childIdByRef.set(row.data.child_ref, createdChildren[index].id);
  });

  const subscriptionIdByRef = new Map<string, number>();
  const createdSubscriptions = await tx.subscription.createManyAndReturn({
    data: parsed["subscriptions.csv"].map((row) => ({
      customerId: customerIdByRef.get(row.data.customer_ref)!,
      planId: planIdByRef.get(row.data.plan_ref)!,
      selectType: row.data.select_type,
      startAt: new Date(row.data.start_at),
      endAt: parseOptionalDateTime(row.data.end_at),
    })),
    select: {
      id: true,
    },
  });
  parsed["subscriptions.csv"].forEach((row, index) => {
    subscriptionIdByRef.set(
      row.data.subscription_ref,
      createdSubscriptions[index].id,
    );
  });

  const instructorIdByRef = new Map<string, number>();
  const instructorPasswords = await Promise.all(
    parsed["instructors.csv"].map((row) =>
      hashPassword(row.data.temp_password),
    ),
  );
  const createdInstructors = await tx.instructor.createManyAndReturn({
    data: parsed["instructors.csv"].map((row, index) => ({
      name: row.data.name,
      email: row.data.email,
      password: instructorPasswords[index],
      classURL: row.data.class_url,
      icon: row.data.icon,
      nickname: row.data.nickname,
      meetingId: row.data.meeting_id,
      passcode: row.data.passcode,
      birthdate: new Date(`${row.data.birthdate}T00:00:00.000Z`),
      favoriteFood: row.data.favorite_food,
      hobby: row.data.hobby,
      lifeHistory: row.data.life_history,
      messageForChildren: row.data.message_for_children,
      skill: row.data.skill,
      workingTime: row.data.working_time,
      isNative: row.data.is_native === "true",
      terminationAt: parseOptionalDateTime(row.data.termination_at),
    })),
    select: {
      id: true,
    },
  });
  parsed["instructors.csv"].forEach((row, index) => {
    instructorIdByRef.set(
      row.data.instructor_ref,
      createdInstructors[index].id,
    );
  });

  if (parsed["instructor_fees.csv"].length > 0) {
    await tx.instructorFee.createMany({
      data: parsed["instructor_fees.csv"].map((row) => ({
        instructorId: instructorIdByRef.get(row.data.instructor_ref)!,
        currency: row.data.currency,
        effectiveFrom: parseOptionalDate(row.data.effective_from)!,
        effectiveTo: parseOptionalDate(row.data.effective_to),
        trialFee: Number(row.data.trial_fee),
        regularFee: Number(row.data.regular_fee),
        cancelFee: Number(row.data.cancel_fee),
        cancelWithoutNoticeFee: Number(row.data.cancel_without_notice_fee),
      })),
    });
  }

  const scheduleGroups = new Map<
    string,
    {
      instructorId: number;
      effectiveFrom: Date;
      effectiveTo: Date | null;
      timezone: string;
      slots: Array<{ weekday: number; startTime: Date }>;
    }
  >();

  for (const row of parsed["instructor_schedules.csv"]) {
    const key = [
      row.data.instructor_ref,
      row.data.effective_from,
      row.data.effective_to,
      row.data.timezone,
    ].join("\u0000");
    if (!scheduleGroups.has(key)) {
      scheduleGroups.set(key, {
        instructorId: instructorIdByRef.get(row.data.instructor_ref)!,
        effectiveFrom: parseOptionalDate(row.data.effective_from)!,
        effectiveTo: parseOptionalDate(row.data.effective_to),
        timezone: row.data.timezone,
        slots: [],
      });
    }
    scheduleGroups.get(key)!.slots.push({
      weekday: Number(row.data.weekday),
      startTime: parseTimeAsDate(row.data.start_time),
    });
  }

  const scheduleRows = Array.from(scheduleGroups.values());
  const createdSchedules = await tx.instructorSchedule.createManyAndReturn({
    data: scheduleRows.map((group) => ({
      instructorId: group.instructorId,
      effectiveFrom: group.effectiveFrom,
      effectiveTo: group.effectiveTo,
      timezone: group.timezone,
    })),
    select: {
      id: true,
    },
  });

  const slotRows = scheduleRows.flatMap((group, index) =>
    group.slots.map((slot) => ({
      scheduleId: createdSchedules[index].id,
      weekday: slot.weekday,
      startTime: slot.startTime,
    })),
  );
  if (slotRows.length > 0) {
    await tx.instructorSlot.createMany({
      data: slotRows,
    });
  }

  if (parsed["instructor_absences.csv"].length > 0) {
    await tx.instructorAbsence.createMany({
      data: parsed["instructor_absences.csv"].map((row) => ({
        instructorId: instructorIdByRef.get(row.data.instructor_ref)!,
        absentAt: new Date(row.data.absent_at),
      })),
    });
  }

  const eventIdByRef = new Map<string, number>();
  const createdEvents = await tx.event.createManyAndReturn({
    data: parsed["events.csv"].map((row) => ({
      name: row.data.name,
      color: row.data.color,
    })),
    select: {
      id: true,
    },
  });
  parsed["events.csv"].forEach((row, index) => {
    eventIdByRef.set(row.data.event_ref, createdEvents[index].id);
  });

  if (parsed["schedules.csv"].length > 0) {
    await tx.schedule.createMany({
      data: parsed["schedules.csv"].map((row) => ({
        date: parseOptionalDate(row.data.date)!,
        eventId: eventIdByRef.get(row.data.event_ref)!,
      })),
    });
  }

  await tx.systemStatus.create({
    data: {
      status: parsed["system_status.csv"][0].data.status,
    },
  });

  const recurringClassIdByRef = new Map<string, number>();
  const createdRecurringClasses = await tx.recurringClass.createManyAndReturn({
    data: parsed["recurring_classes.csv"].map((row) => ({
      subscriptionId: row.data.subscription_ref
        ? subscriptionIdByRef.get(row.data.subscription_ref)!
        : null,
      instructorId: row.data.instructor_ref
        ? instructorIdByRef.get(row.data.instructor_ref)!
        : null,
      startAt: parseOptionalDateTime(row.data.start_at),
      endAt: parseOptionalDateTime(row.data.end_at),
    })),
    select: {
      id: true,
    },
  });
  parsed["recurring_classes.csv"].forEach((row, index) => {
    recurringClassIdByRef.set(
      row.data.recurring_class_ref,
      createdRecurringClasses[index].id,
    );
  });

  if (parsed["recurring_class_attendance.csv"].length > 0) {
    await tx.recurringClassAttendance.createMany({
      data: parsed["recurring_class_attendance.csv"].map((row) => ({
        recurringClassId: recurringClassIdByRef.get(
          row.data.recurring_class_ref,
        )!,
        childrenId: childIdByRef.get(row.data.child_ref)!,
      })),
    });
  }

  const classIdByRef = new Map<string, number>();
  const classUpdatedAt = new Date();
  const createdClasses = await tx.class.createManyAndReturn({
    data: parsed["classes.csv"].map((row) => ({
      customerId: customerIdByRef.get(row.data.customer_ref)!,
      instructorId: row.data.instructor_ref
        ? instructorIdByRef.get(row.data.instructor_ref)!
        : null,
      recurringClassId: row.data.recurring_class_ref
        ? recurringClassIdByRef.get(row.data.recurring_class_ref)!
        : null,
      subscriptionId: row.data.subscription_ref
        ? subscriptionIdByRef.get(row.data.subscription_ref)!
        : null,
      dateTime: parseOptionalDateTime(row.data.date_time),
      status: row.data.status as Status,
      rebookableUntil: parseOptionalDateTime(row.data.rebookable_until),
      classCode: row.data.class_code,
      isFreeTrial: row.data.is_free_trial === "true",
      updatedAt: classUpdatedAt,
    })),
    select: {
      id: true,
    },
  });
  parsed["classes.csv"].forEach((row, index) => {
    classIdByRef.set(row.data.class_ref, createdClasses[index].id);
  });

  if (parsed["class_attendance.csv"].length > 0) {
    await tx.classAttendance.createMany({
      data: parsed["class_attendance.csv"].map((row) => ({
        classId: classIdByRef.get(row.data.class_ref)!,
        childrenId: childIdByRef.get(row.data.child_ref)!,
      })),
    });
  }
}

export async function executeNormalizedImportFiles(
  files: Partial<Record<NormalizedFileName, string>>,
) {
  const validation = validateNormalizedImportFiles(files);
  if (!validation.isValid) {
    throw new Error("Normalized import validation failed");
  }

  const parseIssues: ImportValidationIssue[] = [];
  const parsed = parseNormalizedRows(files, parseIssues);
  if (parseIssues.length > 0) {
    throw new Error("Normalized import parsing failed");
  }

  await prisma.$transaction(
    async (tx) => {
      await resetImportTargetData(tx);
      await insertValidatedRows(tx, parsed);
    },
    { timeout: IMPORT_TRANSACTION_TIMEOUT_MS },
  );

  return {
    report: validation.report,
  };
}
