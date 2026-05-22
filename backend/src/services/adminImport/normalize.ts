import { randomBytes } from "node:crypto";
import JSZip from "jszip";
import { EnglishBackground } from "../../types";

type CsvRow = string[];

export type NormalizedFileName =
  | "plans.csv"
  | "customers.csv"
  | "children.csv"
  | "subscriptions.csv"
  | "instructors.csv"
  | "instructor_fees.csv"
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

interface RecurringClassNormalizationOptions {
  startAt: string;
  endAt?: string;
  customerNames?: string[];
  instructorNames?: string[];
  classTypes?: string[];
}

interface NormalizeRawScheduleOptions {
  recurringClasses?: RecurringClassNormalizationOptions;
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
  classType: string;
  childBirthdate: string | null;
  siblingBirthdate: string | null;
  detailUrl: string;
  personalInfo: string;
  email: string;
}

interface PlanRow {
  plan_ref: string;
  name: string;
  description: string;
  weekly_class_times: string;
  english_background: string;
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
  select_type: string;
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
  english_background: string;
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

interface InstructorFeeRow {
  instructor_ref: string;
  currency: string;
  effective_from: string;
  effective_to: string;
  trial_fee: string;
  regular_fee: string;
  cancel_fee: string;
  cancel_without_notice_fee: string;
  monthly_cancel_fee: string;
}

interface RecurringClassRow {
  recurring_class_ref: string;
  subscription_ref: string;
  instructor_ref: string;
  start_at: string;
  end_at: string;
}

interface RecurringClassAttendanceRow {
  recurring_class_ref: string;
  child_ref: string;
}

const RAW_COLUMN = {
  prefecture: 2,
  customerName: 4,
  childName: 5,
  planName: 6,
  instructorName: 7,
  weekday: 8,
  timeRange: 9,
  classType: 10,
  childBirthdate: 11,
  siblingBirthdate: 12,
  detailUrl: 14,
  personalInfo: 16,
  email: 17,
} as const;

export const NORMALIZED_HEADERS = {
  "plans.csv": [
    "plan_ref",
    "name",
    "description",
    "weekly_class_times",
    "english_background",
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
    "select_type",
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
} as const satisfies Record<NormalizedFileName, readonly string[]>;

export const MANDATORY_NORMALIZED_FILES = Object.keys(
  NORMALIZED_HEADERS,
) as NormalizedFileName[];

const DEFAULT_BUSINESS_EVENTS = [
  {
    event_ref: "EV0001",
    name: "通常授業日 / Regular Class Day",
    color: "#FFFFFF",
  },
  {
    event_ref: "EV0002",
    name: "お休み / No Class",
    color: "#FAD7CD",
  },
  {
    event_ref: "EV0003",
    name: "お休み振替対象日 / No Class (Rebookable)",
    color: "#FF0000",
  },
  {
    event_ref: "EV0004",
    name: "テーマクラスウィーク / Theme Class Week",
    color: "#FFFF00",
  },
];

const DEFAULT_PLAN_DEFINITIONS = [
  {
    price: "3180",
    name: "月3,180円プラン / 3,180 yen/month Plan",
    description: "2 classes per week",
    weekly_class_times: "2",
    english_background: "0",
  },
  {
    price: "7980",
    name: "月7,980円プラン / 7,980 yen/month Plan",
    description: "5 classes per week",
    weekly_class_times: "5",
    english_background: "0",
  },
  {
    price: "5980",
    name: "月5,980円プラン / 5,980 yen/month Plan",
    description: "1 classes per week",
    weekly_class_times: "1",
    english_background: "1",
  },
  {
    price: "10800",
    name: "月10,800円プラン / 10,800 yen/month Plan",
    description: "2 classes per week",
    weekly_class_times: "2",
    english_background: "2",
  },
] as const;

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

export function parseCsv(content: string): CsvRow[] {
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

export function normalizeCsvCell(value: string | undefined): string {
  return trimOrEmpty(value);
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

function normalizePlanPrice(planName: string): string {
  return planName.replace(/[^\d]/g, "");
}

function buildPlanFromRaw(planRef: string, planName: string): PlanRow {
  const defaultPlan = DEFAULT_PLAN_DEFINITIONS.find((plan) =>
    normalizePlanPrice(planName).includes(plan.price),
  );
  if (defaultPlan) {
    return {
      plan_ref: planRef,
      name: defaultPlan.name,
      description: defaultPlan.description,
      weekly_class_times: defaultPlan.weekly_class_times,
      english_background: defaultPlan.english_background,
      termination_at: "",
    };
  }

  const weeklyClassTimes = parseWeeklyClassTimes(planName);
  return {
    plan_ref: planRef,
    name: planName,
    description: `${weeklyClassTimes} classes per week`,
    weekly_class_times: String(weeklyClassTimes),
    english_background: "0",
    termination_at: "",
  };
}

function splitChildNames(childName: string): string[] {
  const parenthetical = childName.match(/^(.+?)\s*[（(]([^）)]+)[）)]$/);
  if (parenthetical) {
    return [parenthetical[1], ...parenthetical[2].split(/[,&、，]/)]
      .map((name) => name.trim())
      .filter(Boolean);
  }

  return childName
    .split(/[&、，]/)
    .map((name) => name.trim())
    .filter(Boolean);
}

function findBirthdateInText(name: string, text: string): string | null {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = text.match(new RegExp(`${escapedName}\\s*(\\d{1,2}/\\d{1,2})`));
  return parseBirthdate(match?.[1] ?? "");
}

function childNamesAndBirthdates(row: RawClassRow): {
  name: string;
  birthdate: string;
}[] {
  const names = splitChildNames(
    row.childName || `Imported Child ${row.sourceRow}`,
  );
  const birthdates = [row.childBirthdate, row.siblingBirthdate].filter(
    (birthdate): birthdate is string => !!birthdate,
  );

  return names.map((name, index) => ({
    name,
    birthdate:
      findBirthdateInText(name, row.personalInfo) ?? birthdates[index] ?? "",
  }));
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

function buildFallbackSelectType(customerRef: string, planRef: string): string {
  return `https://example.com/subscriptions/${customerRef.toLowerCase()}-${planRef.toLowerCase()}`;
}

function buildOptionSet(values: string[] | undefined): Set<string> | null {
  if (!values || values.length === 0) {
    return null;
  }
  return new Set(values.map((value) => value.trim()).filter(Boolean));
}

function dateOnlyFromDateTime(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    throw new Error(
      "recurringClasses.startAt must start with an ISO date, for example 2026-06-01T00:00:00+09:00",
    );
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function timezoneSuffixFromDateTime(value: string): string {
  const match = value.match(/(Z|[+-]\d{2}:\d{2})$/);
  return match?.[1] ?? "+09:00";
}

function nextDateOnOrAfter(dateOnly: string, weekday: number): string {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  const dayOffset = (weekday - date.getUTCDay() + 7) % 7;
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}

function buildRecurringStartAt(
  startAt: string,
  weekday: number,
  startTime: string,
): string {
  const firstDate = nextDateOnOrAfter(dateOnlyFromDateTime(startAt), weekday);
  const timezoneSuffix = timezoneSuffixFromDateTime(startAt);
  return `${firstDate}T${startTime}:00${timezoneSuffix}`;
}

function shouldGenerateRecurringClass(
  row: RawClassRow,
  options: RecurringClassNormalizationOptions,
): boolean {
  const customerNames = buildOptionSet(options.customerNames);
  const instructorNames = buildOptionSet(options.instructorNames);
  const classTypes = buildOptionSet(options.classTypes ?? ["R"]);

  if (customerNames && !customerNames.has(row.customerName)) {
    return false;
  }
  if (instructorNames && !instructorNames.has(row.instructorName)) {
    return false;
  }
  if (classTypes && !classTypes.has(row.classType)) {
    return false;
  }
  return true;
}

function toRecordSet(
  rows: RawClassRow[],
  options: NormalizeRawScheduleOptions = {},
): {
  plans: PlanRow[];
  customers: CustomerRow[];
  children: ChildRow[];
  subscriptions: SubscriptionRow[];
  instructors: InstructorRow[];
  instructorFees: InstructorFeeRow[];
  instructorSchedules: InstructorScheduleRow[];
  recurringClasses: RecurringClassRow[];
  recurringClassAttendance: RecurringClassAttendanceRow[];
  generatedCustomerEmails: GeneratedEmailReportItem[];
  warnings: string[];
} {
  const planSeq = new RefSequence("PL");
  const customerSeq = new RefSequence("CU");
  const childSeq = new RefSequence("CH");
  const subscriptionSeq = new RefSequence("SU");
  const instructorSeq = new RefSequence("IN");
  const recurringClassSeq = new RefSequence("RC");

  const plans: PlanRow[] = [];
  const customers: CustomerRow[] = [];
  const children: ChildRow[] = [];
  const subscriptions: SubscriptionRow[] = [];
  const instructors: InstructorRow[] = [];
  const instructorFees: InstructorFeeRow[] = [];
  const instructorSchedules: InstructorScheduleRow[] = [];
  const recurringClasses: RecurringClassRow[] = [];
  const recurringClassAttendance: RecurringClassAttendanceRow[] = [];
  const generatedCustomerEmails: GeneratedEmailReportItem[] = [];
  const warnings: string[] = [];

  const plansByName = new Map<string, PlanRow>();
  const customersByIdentity = new Map<string, CustomerRow>();
  const childrenByIdentity = new Map<string, ChildRow>();
  const subscriptionsByIdentity = new Map<string, SubscriptionRow>();
  const instructorsByName = new Map<string, InstructorRow>();
  const instructorSchedulesByIdentity = new Set<string>();
  const recurringClassesByIdentity = new Set<string>();

  for (const row of rows) {
    const rawPlanName = row.planName || "Imported Plan";
    const planDraft = buildPlanFromRaw("PL0000", rawPlanName);
    const planName = planDraft.name;
    let plan = plansByName.get(planName);
    if (!plan) {
      plan = { ...planDraft, plan_ref: planSeq.next() };
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

    const rowChildren = childNamesAndBirthdates(row).map((child) => {
      const childIdentity = `${customer.customer_ref}:${child.name}`;
      let childRow = childrenByIdentity.get(childIdentity);
      if (!childRow) {
        childRow = {
          child_ref: childSeq.next(),
          customer_ref: customer.customer_ref,
          name: child.name,
          birthdate: child.birthdate,
          personal_info: row.personalInfo,
        };
        childrenByIdentity.set(childIdentity, childRow);
        children.push(childRow);
      }
      return childRow;
    });

    const subscriptionIdentity = `${customer.customer_ref}:${plan.plan_ref}`;
    let subscription = subscriptionsByIdentity.get(subscriptionIdentity);
    const fallbackSelectType = buildFallbackSelectType(
      customer.customer_ref,
      plan.plan_ref,
    );
    if (!subscription) {
      subscription = {
        subscription_ref: subscriptionSeq.next(),
        customer_ref: customer.customer_ref,
        plan_ref: plan.plan_ref,
        select_type: row.detailUrl || fallbackSelectType,
        start_at: "2020-01-01T00:00:00+09:00",
        end_at: "",
      };
      subscriptionsByIdentity.set(subscriptionIdentity, subscription);
      subscriptions.push(subscription);
    } else if (
      row.detailUrl &&
      subscription.select_type === fallbackSelectType
    ) {
      subscription.select_type = row.detailUrl;
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
          nickname: row.instructorName,
          meeting_id: `9000${serial}`,
          passcode: generateTempPassword().slice(0, 8),
          birthdate: "1990-01-01",
          favorite_food: "",
          hobby: "",
          life_history: "",
          message_for_children: "",
          skill: "",
          working_time: "",
          english_background: "0",
          termination_at: "",
        };
        instructorsByName.set(row.instructorName, instructor);
        instructors.push(instructor);
        instructorFees.push({
          instructor_ref: instructorRef,
          currency: "PHP",
          effective_from: "2020-01-01",
          effective_to: "",
          trial_fee: "75",
          regular_fee: "100",
          cancel_fee: "50",
          cancel_without_notice_fee: "100",
          monthly_cancel_fee: "200",
        });
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
        const effectiveFrom = options.recurringClasses
          ? dateOnlyFromDateTime(options.recurringClasses.startAt)
          : "2020-01-01";
        const key = `${instructor.instructor_ref}:${effectiveFrom}:Asia/Tokyo:${row.weekday}:${row.startTime}`;
        if (!instructorSchedulesByIdentity.has(key)) {
          instructorSchedulesByIdentity.add(key);
          instructorSchedules.push({
            instructor_ref: instructor.instructor_ref,
            effective_from: effectiveFrom,
            effective_to: "",
            timezone: "Asia/Tokyo",
            weekday: String(row.weekday),
            start_time: row.startTime,
          });
        }
      }

      if (
        options.recurringClasses &&
        shouldGenerateRecurringClass(row, options.recurringClasses)
      ) {
        const subscription = subscriptionsByIdentity.get(subscriptionIdentity);
        if (rowChildren.length === 0 || !subscription) {
          warnings.push(
            `Row ${row.sourceRow}: recurring class could not be linked to child or subscription`,
          );
        } else if (row.weekday === null || !row.startTime) {
          warnings.push(
            `Row ${row.sourceRow}: recurring class skipped because weekday or time could not be normalized`,
          );
        } else {
          const key = [
            subscription.subscription_ref,
            instructor.instructor_ref,
            rowChildren.map((child) => child.child_ref).join(","),
            row.weekday,
            row.startTime,
            options.recurringClasses.startAt,
            options.recurringClasses.endAt ?? "",
          ].join("\u0000");
          if (!recurringClassesByIdentity.has(key)) {
            recurringClassesByIdentity.add(key);
            const recurringClassRef = recurringClassSeq.next();
            recurringClasses.push({
              recurring_class_ref: recurringClassRef,
              subscription_ref: subscription.subscription_ref,
              instructor_ref: instructor.instructor_ref,
              start_at: buildRecurringStartAt(
                options.recurringClasses.startAt,
                row.weekday,
                row.startTime,
              ),
              end_at: options.recurringClasses.endAt ?? "",
            });
            recurringClassAttendance.push(
              ...rowChildren.map((child) => ({
                recurring_class_ref: recurringClassRef,
                child_ref: child.child_ref,
              })),
            );
          }
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
    instructorFees,
    instructorSchedules,
    recurringClasses,
    recurringClassAttendance,
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
  let currentSiblingBirthdate: string | null = null;

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
    const classType = trimOrEmpty(row[RAW_COLUMN.classType]);
    const childBirthRaw = trimOrEmpty(row[RAW_COLUMN.childBirthdate]);
    const siblingBirthRaw = trimOrEmpty(row[RAW_COLUMN.siblingBirthdate]);
    const detailUrl = trimOrEmpty(row[RAW_COLUMN.detailUrl]);
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
    const parsedSiblingBirthdate = parseBirthdate(siblingBirthRaw);
    if (parsedBirthdate) {
      currentBirthdate = parsedBirthdate;
    }
    if (parsedSiblingBirthdate) {
      currentSiblingBirthdate = parsedSiblingBirthdate;
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
      classType,
      childBirthdate: parsedBirthdate ?? currentBirthdate,
      siblingBirthdate: parsedSiblingBirthdate ?? currentSiblingBirthdate,
      detailUrl,
      personalInfo: personalInfo || currentPersonalInfo,
      email: currentEmail,
    });
  }

  return out;
}

function rowsToCsvWithHeaders<K extends NormalizedFileName, R extends object>(
  fileName: K,
  rows: R[],
): string {
  const headers = NORMALIZED_HEADERS[fileName] as readonly string[];
  const csvRows: string[][] = [
    [...headers],
    ...rows.map((row) =>
      headers.map((h) => (row as Record<string, string | undefined>)[h] ?? ""),
    ),
  ];
  return toCsv(csvRows);
}

export function normalizeRawScheduleCsvToPackage(
  rawCsvContent: string,
  options: NormalizeRawScheduleOptions = {},
): NormalizeRawScheduleResult {
  const parsed = parseCsv(rawCsvContent);
  const rawRows = buildRawRows(parsed);
  const mapped = toRecordSet(rawRows, options);

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
    "instructor_fees.csv": rowsToCsvWithHeaders(
      "instructor_fees.csv",
      mapped.instructorFees,
    ),
    "instructor_schedules.csv": rowsToCsvWithHeaders(
      "instructor_schedules.csv",
      mapped.instructorSchedules,
    ),
    "instructor_absences.csv": rowsToCsvWithHeaders(
      "instructor_absences.csv",
      [],
    ),
    "events.csv": rowsToCsvWithHeaders("events.csv", DEFAULT_BUSINESS_EVENTS),
    "schedules.csv": rowsToCsvWithHeaders("schedules.csv", []),
    "system_status.csv": rowsToCsvWithHeaders("system_status.csv", [
      { status: "Running" },
    ]),
    "recurring_classes.csv": rowsToCsvWithHeaders(
      "recurring_classes.csv",
      mapped.recurringClasses,
    ),
    "recurring_class_attendance.csv": rowsToCsvWithHeaders(
      "recurring_class_attendance.csv",
      mapped.recurringClassAttendance,
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
    "instructor_fees.csv": mapped.instructorFees.length,
    "instructor_schedules.csv": mapped.instructorSchedules.length,
    "instructor_absences.csv": 0,
    "events.csv": DEFAULT_BUSINESS_EVENTS.length,
    "schedules.csv": 0,
    "system_status.csv": 1,
    "recurring_classes.csv": mapped.recurringClasses.length,
    "recurring_class_attendance.csv": mapped.recurringClassAttendance.length,
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
