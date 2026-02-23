import { randomBytes } from "node:crypto";
import JSZip from "jszip";

type CsvRow = string[];

type NormalizedFileName =
  | "plans.csv"
  | "customers.csv"
  | "children.csv"
  | "subscriptions.csv"
  | "instructors.csv"
  | "instructor_schedules.csv"
  | "instructor_absences.csv"
  | "events.csv"
  | "schedules.csv"
  | "system_status.csv"
  | "recurring_classes.csv"
  | "recurring_class_attendance.csv"
  | "classes.csv"
  | "class_attendance.csv";

type NormalizedFileMap = Record<NormalizedFileName, string>;

interface GeneratedEmailReportItem {
  row: number;
  customerName: string;
  generatedEmail: string;
}

interface NormalizationReport {
  rawRows: number;
  normalizedRowsByFile: Record<NormalizedFileName, number>;
  generatedCustomerEmails: GeneratedEmailReportItem[];
  warnings: string[];
}

interface NormalizeRawScheduleResult {
  files: NormalizedFileMap;
  report: NormalizationReport;
}

interface RawClassRow {
  sourceRow: number;
  prefecture: string;
  customerName: string;
  childName: string;
  planName: string;
  instructorName: string;
  weekday: number | null;
  startTime: string | null;
  childBirthdate: string | null;
  personalInfo: string;
  email: string;
}

interface PlanRow {
  plan_ref: string;
  name: string;
  description: string;
  weekly_class_times: string;
  is_native: string;
  termination_at: string;
}

interface CustomerRow {
  customer_ref: string;
  name: string;
  email: string;
  temp_password: string;
  prefecture: string;
  termination_at: string;
  has_seen_welcome: string;
}

interface ChildRow {
  child_ref: string;
  customer_ref: string;
  name: string;
  birthdate: string;
  personal_info: string;
}

interface SubscriptionRow {
  subscription_ref: string;
  customer_ref: string;
  plan_ref: string;
  start_at: string;
  end_at: string;
}

interface InstructorRow {
  instructor_ref: string;
  name: string;
  email: string;
  temp_password: string;
  class_url: string;
  icon: string;
  nickname: string;
  meeting_id: string;
  passcode: string;
  birthdate: string;
  favorite_food: string;
  hobby: string;
  life_history: string;
  message_for_children: string;
  skill: string;
  working_time: string;
  is_native: string;
  termination_at: string;
}

interface InstructorScheduleRow {
  instructor_ref: string;
  effective_from: string;
  effective_to: string;
  timezone: string;
  weekday: string;
  start_time: string;
}

const RAW_COLUMN = {
  prefecture: 2,
  customerName: 4,
  childName: 5,
  planName: 6,
  instructorName: 7,
  weekday: 8,
  timeRange: 9,
  childBirthdate: 11,
  personalInfo: 16,
  email: 17,
} as const;

const NORMALIZED_HEADERS: Record<NormalizedFileName, string[]> = {
  "plans.csv": [
    "plan_ref",
    "name",
    "description",
    "weekly_class_times",
    "is_native",
    "termination_at",
  ],
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
    "plan_ref",
    "start_at",
    "end_at",
  ],
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
    "is_native",
    "termination_at",
  ],
  "instructor_schedules.csv": [
    "instructor_ref",
    "effective_from",
    "effective_to",
    "timezone",
    "weekday",
    "start_time",
  ],
  "instructor_absences.csv": ["instructor_ref", "absent_at"],
  "events.csv": ["event_ref", "name", "color"],
  "schedules.csv": ["schedule_ref", "date", "event_ref"],
  "system_status.csv": ["status"],
  "recurring_classes.csv": [
    "recurring_class_ref",
    "subscription_ref",
    "instructor_ref",
    "start_at",
    "end_at",
  ],
  "recurring_class_attendance.csv": ["recurring_class_ref", "child_ref"],
  "classes.csv": [
    "class_ref",
    "customer_ref",
    "instructor_ref",
    "recurring_class_ref",
    "subscription_ref",
    "date_time",
    "status",
    "rebookable_until",
    "class_code",
    "is_free_trial",
  ],
  "class_attendance.csv": ["class_ref", "child_ref"],
};

class RefSequence {
  private value = 1;

  constructor(private readonly prefix: string) {}

  next(): string {
    if (this.value > 9999) {
      throw new Error(`Reference overflow for prefix ${this.prefix}`);
    }
    const ref = `${this.prefix}${String(this.value).padStart(4, "0")}`;
    this.value += 1;
    return ref;
  }
}

function parseCsv(content: string): CsvRow[] {
  const rows: CsvRow[] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = i + 1 < content.length ? content[i + 1] : "";

    if (char === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        i += 1;
      }
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function toCsv(rows: string[][]): string {
  return rows
    .map((line) =>
      line
        .map((value) => {
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
        })
        .join(","),
    )
    .join("\n");
}

function trimOrEmpty(value: string | undefined): string {
  return (value ?? "").trim();
}

function isHeaderRow(row: CsvRow): boolean {
  const rowText = row.map((field) => trimOrEmpty(field).toLowerCase());
  return (
    rowText.includes("name") &&
    rowText.includes("child name") &&
    rowText.includes("plan")
  );
}

function isNonDataRow(row: CsvRow): boolean {
  const customerName = trimOrEmpty(row[RAW_COLUMN.customerName]);
  const childName = trimOrEmpty(row[RAW_COLUMN.childName]);
  const instructorName = trimOrEmpty(row[RAW_COLUMN.instructorName]);
  const planName = trimOrEmpty(row[RAW_COLUMN.planName]);
  return !customerName && !childName && !instructorName && !planName;
}

function parseWeekday(value: string): number | null {
  const normalized = value.trim().toLowerCase();
  const map: Record<string, number> = {
    sun: 0,
    mon: 1,
    tue: 2,
    wed: 3,
    thu: 4,
    fri: 5,
    sat: 6,
  };
  return map[normalized] ?? null;
}

function normalizeTime(value: string): string | null {
  if (!value) {
    return null;
  }
  const start = value.split("-")[0]?.split("〜")[0]?.trim();
  const match = start?.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    return null;
  }
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

function parseBirthdate(value: string): string | null {
  const raw = value.trim();
  if (!raw || raw === "記載なし" || raw.includes("#VALUE")) {
    return null;
  }

  const isoMatch = raw.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const monthDayMatch = raw.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (monthDayMatch) {
    const month = Number(monthDayMatch[1]);
    const day = Number(monthDayMatch[2]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `2000-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  return null;
}

function parseWeeklyClassTimes(planName: string): number {
  const weeklyMatch = planName.match(/週\s*(\d+)\s*回/);
  if (weeklyMatch) {
    return Number(weeklyMatch[1]);
  }
  const monthlyMatch = planName.match(/月\s*(\d+)\s*回/);
  if (monthlyMatch) {
    return Number(monthlyMatch[1]);
  }
  return 1;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isLikelyEmail(value: string): boolean {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
}

function generateTempPassword(): string {
  return randomBytes(6).toString("base64url");
}

function toRecordSet(rows: RawClassRow[]): {
  plans: PlanRow[];
  customers: CustomerRow[];
  children: ChildRow[];
  subscriptions: SubscriptionRow[];
  instructors: InstructorRow[];
  instructorSchedules: InstructorScheduleRow[];
  generatedCustomerEmails: GeneratedEmailReportItem[];
  warnings: string[];
} {
  const planSeq = new RefSequence("PL");
  const customerSeq = new RefSequence("CU");
  const childSeq = new RefSequence("CH");
  const subscriptionSeq = new RefSequence("SU");
  const instructorSeq = new RefSequence("IN");

  const plans: PlanRow[] = [];
  const customers: CustomerRow[] = [];
  const children: ChildRow[] = [];
  const subscriptions: SubscriptionRow[] = [];
  const instructors: InstructorRow[] = [];
  const instructorSchedules: InstructorScheduleRow[] = [];
  const generatedCustomerEmails: GeneratedEmailReportItem[] = [];
  const warnings: string[] = [];

  const plansByName = new Map<string, PlanRow>();
  const customersByIdentity = new Map<string, CustomerRow>();
  const childrenByIdentity = new Map<string, ChildRow>();
  const subscriptionsByIdentity = new Map<string, SubscriptionRow>();
  const instructorsByName = new Map<string, InstructorRow>();
  const instructorSchedulesByIdentity = new Set<string>();

  for (const row of rows) {
    const planName = row.planName || "Imported Plan";
    let plan = plansByName.get(planName);
    if (!plan) {
      plan = {
        plan_ref: planSeq.next(),
        name: planName,
        description: `Imported from raw plan label: ${planName}`,
        weekly_class_times: String(parseWeeklyClassTimes(planName)),
        is_native: "false",
        termination_at: "",
      };
      plansByName.set(planName, plan);
      plans.push(plan);
    }

    const normalizedSourceEmail = normalizeEmail(row.email);
    const customerName =
      row.customerName || `Imported Customer ${row.sourceRow}`;
    const customerIdentity = isLikelyEmail(normalizedSourceEmail)
      ? `email:${normalizedSourceEmail}`
      : `name:${customerName}`;
    let customer = customersByIdentity.get(customerIdentity);
    if (!customer) {
      let email = normalizedSourceEmail;
      if (!isLikelyEmail(email)) {
        email = `customer+${String(customers.length + 1).padStart(4, "0")}@aaasobo-import.local`;
        generatedCustomerEmails.push({
          row: row.sourceRow,
          customerName,
          generatedEmail: email,
        });
      }
      customer = {
        customer_ref: customerSeq.next(),
        name: customerName,
        email,
        temp_password: generateTempPassword(),
        prefecture: row.prefecture || "Unknown",
        termination_at: "",
        has_seen_welcome: "false",
      };
      customersByIdentity.set(customerIdentity, customer);
      customers.push(customer);
    }

    const childName = row.childName || `Imported Child ${row.sourceRow}`;
    const childIdentity = `${customer.customer_ref}:${childName}`;
    if (!childrenByIdentity.has(childIdentity)) {
      const child: ChildRow = {
        child_ref: childSeq.next(),
        customer_ref: customer.customer_ref,
        name: childName,
        birthdate: row.childBirthdate ?? "",
        personal_info: row.personalInfo,
      };
      childrenByIdentity.set(childIdentity, child);
      children.push(child);
    }

    const subscriptionIdentity = `${customer.customer_ref}:${plan.plan_ref}`;
    if (!subscriptionsByIdentity.has(subscriptionIdentity)) {
      const subscription: SubscriptionRow = {
        subscription_ref: subscriptionSeq.next(),
        customer_ref: customer.customer_ref,
        plan_ref: plan.plan_ref,
        start_at: "2020-01-01T00:00:00+09:00",
        end_at: "",
      };
      subscriptionsByIdentity.set(subscriptionIdentity, subscription);
      subscriptions.push(subscription);
    }

    if (row.instructorName) {
      let instructor = instructorsByName.get(row.instructorName);
      if (!instructor) {
        const instructorRef = instructorSeq.next();
        const serial = String(instructors.length + 1).padStart(4, "0");
        instructor = {
          instructor_ref: instructorRef,
          name: row.instructorName,
          email: `instructor+${serial}@aaasobo-import.local`,
          temp_password: generateTempPassword(),
          class_url: `https://import.local/class/${instructorRef.toLowerCase()}`,
          icon: `https://import.local/icon/${instructorRef.toLowerCase()}.png`,
          nickname: `import_${instructorRef.toLowerCase()}`,
          meeting_id: `9000${serial}`,
          passcode: generateTempPassword().slice(0, 8),
          birthdate: "1990-01-01",
          favorite_food: "",
          hobby: "",
          life_history: "",
          message_for_children: "",
          skill: "",
          working_time: "",
          is_native: "false",
          termination_at: "",
        };
        instructorsByName.set(row.instructorName, instructor);
        instructors.push(instructor);
      }

      if (row.weekday === null) {
        warnings.push(
          `Row ${row.sourceRow}: weekday "${row.weekday}" could not be normalized`,
        );
      }
      if (!row.startTime) {
        warnings.push(
          `Row ${row.sourceRow}: time range could not be normalized for instructor schedule`,
        );
      }
      if (row.weekday !== null && row.startTime) {
        const key = `${instructor.instructor_ref}:2020-01-01:2099-12-31:Asia/Tokyo:${row.weekday}:${row.startTime}`;
        if (!instructorSchedulesByIdentity.has(key)) {
          instructorSchedulesByIdentity.add(key);
          instructorSchedules.push({
            instructor_ref: instructor.instructor_ref,
            effective_from: "2020-01-01",
            effective_to: "2099-12-31",
            timezone: "Asia/Tokyo",
            weekday: String(row.weekday),
            start_time: row.startTime,
          });
        }
      }
    }
  }

  return {
    plans,
    customers,
    children,
    subscriptions,
    instructors,
    instructorSchedules,
    generatedCustomerEmails,
    warnings,
  };
}

function buildRawRows(allRows: CsvRow[]): RawClassRow[] {
  let headerIndex = -1;
  for (let i = 0; i < allRows.length; i += 1) {
    if (isHeaderRow(allRows[i])) {
      headerIndex = i;
      break;
    }
  }
  if (headerIndex < 0) {
    throw new Error("Header row for raw schedule CSV not found");
  }

  const out: RawClassRow[] = [];

  let currentPrefecture = "";
  let currentCustomerName = "";
  let currentPlanName = "";
  let currentEmail = "";
  let currentPersonalInfo = "";
  let currentBirthdate: string | null = null;

  for (let i = headerIndex + 1; i < allRows.length; i += 1) {
    const row = allRows[i];
    if (isNonDataRow(row)) {
      continue;
    }

    const prefecture = trimOrEmpty(row[RAW_COLUMN.prefecture]);
    const customerName = trimOrEmpty(row[RAW_COLUMN.customerName]);
    const childName = trimOrEmpty(row[RAW_COLUMN.childName]);
    const planName = trimOrEmpty(row[RAW_COLUMN.planName]);
    const instructorName = trimOrEmpty(row[RAW_COLUMN.instructorName]);
    const weekdayText = trimOrEmpty(row[RAW_COLUMN.weekday]);
    const timeRange = trimOrEmpty(row[RAW_COLUMN.timeRange]);
    const childBirthRaw = trimOrEmpty(row[RAW_COLUMN.childBirthdate]);
    const personalInfo = trimOrEmpty(row[RAW_COLUMN.personalInfo]);
    const email = trimOrEmpty(row[RAW_COLUMN.email]);

    if (prefecture) {
      currentPrefecture = prefecture;
    }
    if (customerName) {
      currentCustomerName = customerName;
      if (!email) {
        currentEmail = "";
      }
    }
    if (planName) {
      currentPlanName = planName;
    }
    if (email) {
      currentEmail = email;
    }
    if (personalInfo) {
      currentPersonalInfo = personalInfo;
    }
    const parsedBirthdate = parseBirthdate(childBirthRaw);
    if (parsedBirthdate) {
      currentBirthdate = parsedBirthdate;
    }

    if (!currentCustomerName || !childName) {
      continue;
    }

    out.push({
      sourceRow: i + 1,
      prefecture: currentPrefecture,
      customerName: currentCustomerName,
      childName,
      planName: currentPlanName,
      instructorName,
      weekday: parseWeekday(weekdayText),
      startTime: normalizeTime(timeRange),
      childBirthdate: parsedBirthdate ?? currentBirthdate,
      personalInfo: personalInfo || currentPersonalInfo,
      email: currentEmail,
    });
  }

  return out;
}

function rowsToCsvWithHeaders(
  fileName: NormalizedFileName,
  rows: Array<Record<string, string>>,
): string {
  const headers = NORMALIZED_HEADERS[fileName];
  const csvRows = [
    headers,
    ...rows.map((row) => headers.map((h) => row[h] ?? "")),
  ];
  return toCsv(csvRows);
}

export function normalizeRawScheduleCsvToPackage(
  rawCsvContent: string,
): NormalizeRawScheduleResult {
  const parsed = parseCsv(rawCsvContent);
  const rawRows = buildRawRows(parsed);
  const mapped = toRecordSet(rawRows);

  const files: NormalizedFileMap = {
    "plans.csv": rowsToCsvWithHeaders("plans.csv", mapped.plans),
    "customers.csv": rowsToCsvWithHeaders("customers.csv", mapped.customers),
    "children.csv": rowsToCsvWithHeaders("children.csv", mapped.children),
    "subscriptions.csv": rowsToCsvWithHeaders(
      "subscriptions.csv",
      mapped.subscriptions,
    ),
    "instructors.csv": rowsToCsvWithHeaders(
      "instructors.csv",
      mapped.instructors,
    ),
    "instructor_schedules.csv": rowsToCsvWithHeaders(
      "instructor_schedules.csv",
      mapped.instructorSchedules,
    ),
    "instructor_absences.csv": rowsToCsvWithHeaders(
      "instructor_absences.csv",
      [],
    ),
    "events.csv": rowsToCsvWithHeaders("events.csv", []),
    "schedules.csv": rowsToCsvWithHeaders("schedules.csv", []),
    "system_status.csv": rowsToCsvWithHeaders("system_status.csv", [
      { status: "Running" },
    ]),
    "recurring_classes.csv": rowsToCsvWithHeaders("recurring_classes.csv", []),
    "recurring_class_attendance.csv": rowsToCsvWithHeaders(
      "recurring_class_attendance.csv",
      [],
    ),
    "classes.csv": rowsToCsvWithHeaders("classes.csv", []),
    "class_attendance.csv": rowsToCsvWithHeaders("class_attendance.csv", []),
  };

  const normalizedRowsByFile: Record<NormalizedFileName, number> = {
    "plans.csv": mapped.plans.length,
    "customers.csv": mapped.customers.length,
    "children.csv": mapped.children.length,
    "subscriptions.csv": mapped.subscriptions.length,
    "instructors.csv": mapped.instructors.length,
    "instructor_schedules.csv": mapped.instructorSchedules.length,
    "instructor_absences.csv": 0,
    "events.csv": 0,
    "schedules.csv": 0,
    "system_status.csv": 1,
    "recurring_classes.csv": 0,
    "recurring_class_attendance.csv": 0,
    "classes.csv": 0,
    "class_attendance.csv": 0,
  };

  return {
    files,
    report: {
      rawRows: rawRows.length,
      normalizedRowsByFile,
      generatedCustomerEmails: mapped.generatedCustomerEmails,
      warnings: mapped.warnings,
    },
  };
}

export async function buildNormalizedPackageZip(
  files: NormalizedFileMap,
): Promise<Buffer> {
  const zip = new JSZip();

  for (const fileName of Object.keys(files) as NormalizedFileName[]) {
    zip.file(fileName, files[fileName], { binary: false });
  }

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: {
      level: 9,
    },
  });
}
