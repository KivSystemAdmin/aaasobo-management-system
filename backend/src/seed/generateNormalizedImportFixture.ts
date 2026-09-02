import fs from "node:fs/promises";
import path from "node:path";
import JSZip from "jszip";
import {
  MANDATORY_NORMALIZED_FILES,
  NORMALIZED_HEADERS,
  type NormalizedFileName,
} from "../services/adminImport/normalize";

const TIMEZONE = "Asia/Tokyo";
const TZ_OFFSET = "+09:00";
const FAKER_SEED = 20250301;

const DEFAULT_INSTRUCTOR_COUNT = 10;
const CUSTOMERS_PER_INSTRUCTOR = 10;
const DEFAULT_DUMMY_INSTRUCTOR_ICON = "/images/default-user-icon.jpg";

const PATTERN_A_SLOTS: SlotDef[] = buildPatternSlots(
  [1, 2, 3, 4, 5],
  ["16:00", "16:30", "17:00", "17:30", "18:00", "18:30"],
);
const PATTERN_B_SLOTS: SlotDef[] = [
  ...buildPatternSlots(
    [2, 3, 4, 5],
    ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30"],
  ),
  ...buildPatternSlots(
    [6],
    ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"],
  ),
];

type SlotDef = {
  weekday: number;
  startTime: string;
};

type PlanDef = {
  plan_ref: string;
  name: string;
  description: string;
  weekly_class_times: string;
  english_background: string;
  termination_at: string;
};

type CustomerDef = {
  customer_ref: string;
  name: string;
  email: string;
  temp_password: string;
  prefecture: string;
  termination_at: string;
  has_seen_welcome: string;
};

type ChildDef = {
  child_ref: string;
  customer_ref: string;
  name: string;
  birthdate: string;
  personal_info: string;
};

type SubscriptionDef = {
  subscription_ref: string;
  customer_ref: string;
  plan_ref: string;
  select_type: string;
  start_at: string;
  end_at: string;
};

type InstructorDef = {
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
};

type InstructorFeeDef = {
  instructor_ref: string;
  currency: string;
  effective_from: string;
  effective_to: string;
  trial_fee: string;
  regular_fee: string;
  cancel_fee: string;
  cancel_without_notice_fee: string;
  monthly_cancel_fee: string;
};

type InstructorScheduleDef = {
  instructor_ref: string;
  effective_from: string;
  effective_to: string;
  timezone: string;
  weekday: string;
  start_time: string;
};

type EventDef = {
  event_ref: string;
  name: string;
  color: string;
};

type ScheduleDef = {
  schedule_ref: string;
  date: string;
  event_ref: string;
};

type RecurringClassDef = {
  recurring_class_ref: string;
  subscription_ref: string;
  instructor_ref: string;
  start_at: string;
  end_at: string;
};

type RecurringClassAttendanceDef = {
  recurring_class_ref: string;
  child_ref: string;
};

type ClassDef = {
  class_ref: string;
  customer_ref: string;
  instructor_ref: string;
  recurring_class_ref: string;
  subscription_ref: string;
  date_time: string;
  status: string;
  rebookable_until: string;
  class_code: string;
  is_free_trial: string;
};

type ClassAttendanceDef = {
  class_ref: string;
  child_ref: string;
};

type SystemStatusDef = {
  status: string;
};

type RowMap = {
  "plans.csv": PlanDef[];
  "customers.csv": CustomerDef[];
  "children.csv": ChildDef[];
  "subscriptions.csv": SubscriptionDef[];
  "instructors.csv": InstructorDef[];
  "instructor_fees.csv": InstructorFeeDef[];
  "instructor_schedules.csv": InstructorScheduleDef[];
  "instructor_absences.csv": { instructor_ref: string; absent_at: string }[];
  "events.csv": EventDef[];
  "schedules.csv": ScheduleDef[];
  "system_status.csv": SystemStatusDef[];
  "recurring_classes.csv": RecurringClassDef[];
  "recurring_class_attendance.csv": RecurringClassAttendanceDef[];
  "classes.csv": ClassDef[];
  "class_attendance.csv": ClassAttendanceDef[];
};

type RecurringCandidate = {
  subscriptionRef: string;
  customerRef: string;
  childRefs: string[];
  indexWithinSubscription: number;
  englishBackground: string;
};

type RecurringAssignment = {
  recurringClassRef: string;
  subscriptionRef: string;
  customerRef: string;
  childRefs: string[];
  instructorRef: string;
  weekday: number;
  startTime: string;
  startAt: string;
};

type Args = {
  from: string;
  completedUntil: string;
  to: string;
  instructorCount: number;
  outDir: string;
};

export type GenerateNormalizedImportFixtureOptions = {
  from: string;
  completedUntil: string;
  to: string;
  instructorCount?: number;
};

export type GeneratedNormalizedImportFixture = {
  files: Record<NormalizedFileName, string>;
  rows: RowMap;
  zipFileName: string;
};

function usageAndExit(message?: string): never {
  if (message) {
    console.error(`Error: ${message}`);
  }
  console.error(
    "Usage: ts-node ./src/seed/generateNormalizedImportFixture.ts --from YYYY-MM-DD --completed-until YYYY-MM-DD --to YYYY-MM-DD [--instructors COUNT] [--out-dir PATH]",
  );
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const map = new Map<string, string>();

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) {
      usageAndExit(`Unexpected argument: ${arg}`);
    }
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith("--")) {
      usageAndExit(`Missing value for --${key}`);
    }
    map.set(key, value);
    i += 1;
  }

  const from = map.get("from");
  const completedUntil = map.get("completed-until");
  const to = map.get("to");
  const instructorCount = parseInstructorCount(map.get("instructors"));
  const outDir =
    map.get("out-dir") ??
    path.resolve(process.cwd(), "../docs/testing/data-import/generated");

  if (!from || !completedUntil || !to) {
    usageAndExit("Required flags: --from --completed-until --to");
  }

  if (!isValidDateOnly(from)) {
    usageAndExit(`Invalid --from: ${from}`);
  }
  if (!isValidDateOnly(completedUntil)) {
    usageAndExit(`Invalid --completed-until: ${completedUntil}`);
  }
  if (!isValidDateOnly(to)) {
    usageAndExit(`Invalid --to: ${to}`);
  }

  const fromDate = parseDateOnly(from);
  const completedDate = parseDateOnly(completedUntil);
  const toDate = parseDateOnly(to);
  if (fromDate > completedDate) {
    usageAndExit("--from must be <= --completed-until");
  }
  if (completedDate > toDate) {
    usageAndExit("--completed-until must be <= --to");
  }

  return { from, completedUntil, to, instructorCount, outDir };
}

function parseInstructorCount(value: string | undefined): number {
  if (value === undefined) {
    return DEFAULT_INSTRUCTOR_COUNT;
  }
  if (!/^\d+$/.test(value)) {
    usageAndExit(`Invalid --instructors: ${value}`);
  }
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 2) {
    usageAndExit("--instructors must be an integer of at least 2");
  }
  return count;
}

function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const d = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(d.getTime()) && formatDateOnly(d) === value;
}

function parseDateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateTime(dateOnly: string, hhmm: string): string {
  return `${dateOnly}T${hhmm}:00${TZ_OFFSET}`;
}

function addDays(date: Date, days: number): Date {
  const out = new Date(date.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function nextDateOnOrAfter(from: Date, weekday: number): Date {
  const current = from.getUTCDay();
  const diff = (weekday - current + 7) % 7;
  return addDays(from, diff);
}

function buildPatternSlots(weekdays: number[], times: string[]): SlotDef[] {
  const slots: SlotDef[] = [];
  for (const weekday of weekdays) {
    for (const startTime of times) {
      slots.push({ weekday, startTime });
    }
  }
  return slots;
}

function ref(prefix: string, index: number): string {
  return `${prefix}${String(index).padStart(4, "0")}`;
}

type FakerLike = {
  seed: (seed: number) => void;
  person: {
    firstName: () => string;
    fullName: () => string;
    lastName: () => string;
  };
};

function sanitizeChildFirstName(raw: string, fallbackIndex: number): string {
  const compact = raw
    .replace(/[.&]/g, "")
    .trim()
    .split(/\s+/)[0]
    ?.replace(/[^A-Za-z]/g, "");
  if (!compact) {
    return `Child${fallbackIndex}`;
  }
  return compact;
}

function sanitizeEnglishNamePart(raw: string, fallback: string): string {
  const compact = raw.replace(/[^A-Za-z]/g, "");
  return compact.length > 0 ? compact : fallback;
}

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

function toCsv(
  fileName: NormalizedFileName,
  rows: Record<string, string>[],
): string {
  const headers = NORMALIZED_HEADERS[fileName];
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => csvEscape(row[header] ?? "")).join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

function planRows(): PlanDef[] {
  return [
    {
      plan_ref: ref("PL", 1),
      name: "月2,180円プラン / 2,180 yen/month Plan",
      description: "1 class per week",
      weekly_class_times: "1",
      english_background: "0",
      termination_at: "",
    },
    {
      plan_ref: ref("PL", 2),
      name: "月3,180円プラン / 3,180 yen/month Plan",
      description: "2 classes per week",
      weekly_class_times: "2",
      english_background: "0",
      termination_at: "",
    },
    {
      plan_ref: ref("PL", 3),
      name: "月13,980円プラン / 13,980 yen/month Plan Native A",
      description: "2 classes per week",
      weekly_class_times: "2",
      english_background: "1",
      termination_at: "",
    },
    {
      plan_ref: ref("PL", 4),
      name: "月13,980円プラン / 13,980 yen/month Plan Native B",
      description: "2 classes per week",
      weekly_class_times: "2",
      english_background: "2",
      termination_at: "",
    },
  ];
}

function eventRows(): EventDef[] {
  return [
    {
      event_ref: ref("EV", 1),
      name: "通常授業日 / Regular Class Day",
      color: "#FFFFFF",
    },
    {
      event_ref: ref("EV", 2),
      name: "お休み / No Class",
      color: "#FAD7CD",
    },
    {
      event_ref: ref("EV", 3),
      name: "お休み振替対象日 / No Class (Rebookable)",
      color: "#FF0000",
    },
    {
      event_ref: ref("EV", 4),
      name: "テーマクラスウィーク / Theme Class Week",
      color: "#FFFF00",
    },
  ];
}

function scheduleRows(from: string, to: string): ScheduleDef[] {
  void to;
  return [
    {
      schedule_ref: ref("SD", 1),
      date: from,
      event_ref: ref("EV", 1),
    },
  ];
}

function instructorRows(
  fakerEn: FakerLike,
  instructorCount: number,
): InstructorDef[] {
  const rows: InstructorDef[] = [];
  const nicknameCounts = new Map<string, number>();
  for (let i = 1; i <= instructorCount; i += 1) {
    const instructorRef = ref("IN", i);
    const lowerRef = instructorRef.toLowerCase();
    const first = sanitizeEnglishNamePart(fakerEn.person.firstName(), "Alex");
    const last = sanitizeEnglishNamePart(fakerEn.person.lastName(), "Taylor");
    const nicknameBase = first;
    const seen = nicknameCounts.get(nicknameBase) ?? 0;
    const nickname = seen === 0 ? nicknameBase : `${nicknameBase}${seen + 1}`;
    nicknameCounts.set(nicknameBase, seen + 1);
    rows.push({
      instructor_ref: instructorRef,
      name: `${first} ${last}`,
      email: `${lowerRef}@example.com`,
      temp_password: `Temp-${lowerRef}`,
      class_url: `https://class.example.com/${lowerRef}`,
      icon: `${DEFAULT_DUMMY_INSTRUCTOR_ICON}?id=${lowerRef}`,
      nickname,
      meeting_id: `MID${String(i).padStart(4, "0")}`,
      passcode: `PIN${String(i).padStart(4, "0")}`,
      birthdate: `199${i % 10}-01-01`,
      favorite_food: "Curry",
      hobby: "Reading",
      life_history: `Career summary for ${lowerRef}`,
      message_for_children: "Let's enjoy learning English!",
      skill: "Conversation",
      working_time: "Weekday evenings and Saturday mornings",
      english_background: i % 2 === 0 ? "1" : "0",
      termination_at: "",
    });
  }
  return rows;
}

function slotsForInstructor(instructorIndexOneBased: number): SlotDef[] {
  return instructorIndexOneBased % 2 === 1 ? PATTERN_A_SLOTS : PATTERN_B_SLOTS;
}

function instructorFeeRows(
  from: string,
  instructorCount: number,
): InstructorFeeDef[] {
  const rows: InstructorFeeDef[] = [];
  for (let i = 1; i <= instructorCount; i += 1) {
    rows.push({
      instructor_ref: ref("IN", i),
      currency: "PHP",
      effective_from: from,
      effective_to: "",
      trial_fee: "75",
      regular_fee: "100",
      cancel_fee: "50",
      cancel_without_notice_fee: "100",
      monthly_cancel_fee: "200",
    });
  }
  return rows;
}

function instructorScheduleRows(
  from: string,
  instructorCount: number,
): InstructorScheduleDef[] {
  const rows: InstructorScheduleDef[] = [];
  for (let i = 1; i <= instructorCount; i += 1) {
    const instructorRef = ref("IN", i);
    const slots = slotsForInstructor(i);
    for (const slot of slots) {
      rows.push({
        instructor_ref: instructorRef,
        effective_from: from,
        effective_to: "",
        timezone: TIMEZONE,
        weekday: String(slot.weekday),
        start_time: slot.startTime,
      });
    }
  }
  return rows;
}

function customerRows(
  fakerJa: FakerLike,
  customerCount: number,
): CustomerDef[] {
  const rows: CustomerDef[] = [];
  for (let i = 1; i <= customerCount; i += 1) {
    const customerRef = ref("CU", i);
    const lowerRef = customerRef.toLowerCase();
    const family = fakerJa.person.lastName();
    const given = fakerJa.person.firstName();
    rows.push({
      customer_ref: customerRef,
      name: `${family} ${given}`,
      email: `${lowerRef}@example.com`,
      temp_password: `Temp-${lowerRef}`,
      prefecture: "東京都 / Tokyo",
      termination_at: "",
      has_seen_welcome: "false",
    });
  }
  return rows;
}

function childRows(fakerEn: FakerLike, customerCount: number): ChildDef[] {
  const rows: ChildDef[] = [];
  let childSeq = 1;
  for (
    let customerIndex = 1;
    customerIndex <= customerCount;
    customerIndex += 1
  ) {
    const customerRef = ref("CU", customerIndex);
    for (let j = 1; j <= 2; j += 1) {
      rows.push({
        child_ref: ref("CH", childSeq),
        customer_ref: customerRef,
        // Keep child names as a single first-name token (no "." or "&").
        name: sanitizeChildFirstName(fakerEn.person.firstName(), childSeq),
        birthdate: `201${(customerIndex + j) % 10}-04-01`,
        personal_info: "",
      });
      childSeq += 1;
    }
  }
  return rows;
}

function subscriptionRows(
  from: string,
  customerCount: number,
): SubscriptionDef[] {
  const rows: SubscriptionDef[] = [];
  for (let i = 1; i <= customerCount; i += 1) {
    const customerRef = ref("CU", i);
    rows.push({
      subscription_ref: ref("SU", i),
      customer_ref: customerRef,
      plan_ref: i % 2 === 1 ? ref("PL", 2) : ref("PL", 3),
      select_type: `https://example.com/subscriptions/${customerRef.toLowerCase()}`,
      start_at: formatDateTime(from, "00:00"),
      end_at: "",
    });
  }
  return rows;
}

function buildCustomerChildMap(children: ChildDef[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const child of children) {
    const list = map.get(child.customer_ref) ?? [];
    list.push(child.child_ref);
    map.set(child.customer_ref, list);
  }
  return map;
}

function recurringCandidates(
  subscriptions: SubscriptionDef[],
  childRefsByCustomer: Map<string, string[]>,
  plans: PlanDef[],
): RecurringCandidate[] {
  const rows: RecurringCandidate[] = [];
  const plansByRef = new Map(plans.map((plan) => [plan.plan_ref, plan]));
  for (const sub of subscriptions) {
    const plan = plansByRef.get(sub.plan_ref);
    if (!plan) {
      throw new Error(`Subscription ${sub.subscription_ref} has no plan`);
    }
    const weekly = Number(plan.weekly_class_times);
    const childRefs = childRefsByCustomer.get(sub.customer_ref) ?? [];
    for (let i = 0; i < weekly; i += 1) {
      rows.push({
        subscriptionRef: sub.subscription_ref,
        customerRef: sub.customer_ref,
        childRefs,
        indexWithinSubscription: i,
        englishBackground: plan.english_background,
      });
    }
  }
  rows.sort((a, b) => {
    if (a.subscriptionRef !== b.subscriptionRef) {
      return a.subscriptionRef.localeCompare(b.subscriptionRef);
    }
    return a.indexWithinSubscription - b.indexWithinSubscription;
  });
  return rows;
}

function assignRecurringClasses(
  candidates: RecurringCandidate[],
  from: string,
  instructorCount: number,
): RecurringAssignment[] {
  const instructorIndexesByBackground = new Map<string, number[]>();
  for (let i = 1; i <= instructorCount; i += 1) {
    const englishBackground = i % 2 === 0 ? "1" : "0";
    const indexes = instructorIndexesByBackground.get(englishBackground) ?? [];
    indexes.push(i);
    instructorIndexesByBackground.set(englishBackground, indexes);
  }

  const subscriptionCountByBackground = new Map<string, number>();
  const instructorIndexBySubscription = new Map<string, number>();
  const assignmentCountByInstructor = new Map<string, number>();
  const rows: RecurringAssignment[] = [];

  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const instructorIndexes =
      instructorIndexesByBackground.get(candidate.englishBackground) ?? [];
    if (instructorIndexes.length === 0) {
      throw new Error(
        `No instructor for English background ${candidate.englishBackground}`,
      );
    }
    let instructorIndex = instructorIndexBySubscription.get(
      candidate.subscriptionRef,
    );
    if (instructorIndex === undefined) {
      const assignedSubscriptionCount =
        subscriptionCountByBackground.get(candidate.englishBackground) ?? 0;
      instructorIndex =
        instructorIndexes[assignedSubscriptionCount % instructorIndexes.length];
      instructorIndexBySubscription.set(
        candidate.subscriptionRef,
        instructorIndex,
      );
      subscriptionCountByBackground.set(
        candidate.englishBackground,
        assignedSubscriptionCount + 1,
      );
    }
    const instructorRef = ref("IN", instructorIndex);
    const assignedCount = assignmentCountByInstructor.get(instructorRef) ?? 0;
    const slots = slotsForInstructor(instructorIndex);
    const slot = slots[assignedCount];
    if (!slot) {
      throw new Error(
        `Instructor ${instructorRef} has insufficient schedule slots for recurring classes`,
      );
    }

    const firstDate = nextDateOnOrAfter(parseDateOnly(from), slot.weekday);
    const firstDateOnly = formatDateOnly(firstDate);
    const recurringRef = ref("RC", i + 1);
    rows.push({
      recurringClassRef: recurringRef,
      subscriptionRef: candidate.subscriptionRef,
      customerRef: candidate.customerRef,
      childRefs: candidate.childRefs,
      instructorRef,
      weekday: slot.weekday,
      startTime: slot.startTime,
      startAt: formatDateTime(firstDateOnly, slot.startTime),
    });

    assignmentCountByInstructor.set(instructorRef, assignedCount + 1);
  }

  return rows;
}

function recurringRows(
  assignments: RecurringAssignment[],
): RecurringClassDef[] {
  return assignments.map((item) => ({
    recurring_class_ref: item.recurringClassRef,
    subscription_ref: item.subscriptionRef,
    instructor_ref: item.instructorRef,
    start_at: item.startAt,
    end_at: "",
  }));
}

function recurringAttendanceRows(
  assignments: RecurringAssignment[],
): RecurringClassAttendanceDef[] {
  const rows: RecurringClassAttendanceDef[] = [];
  for (const item of assignments) {
    for (const childRef of item.childRefs) {
      rows.push({
        recurring_class_ref: item.recurringClassRef,
        child_ref: childRef,
      });
    }
  }
  return rows;
}

function classRowsAndAttendance(
  assignments: RecurringAssignment[],
  completedUntil: string,
  to: string,
): {
  classes: ClassDef[];
  classAttendance: ClassAttendanceDef[];
} {
  const classes: ClassDef[] = [];
  const classAttendance: ClassAttendanceDef[] = [];
  const toDate = parseDateOnly(to);
  const completedDate = parseDateOnly(completedUntil);
  let classSeq = 1;

  for (const item of assignments) {
    let cursor = parseDateOnly(item.startAt.slice(0, 10));
    while (cursor <= toDate) {
      const classRef = ref("CL", classSeq);
      const dateOnly = formatDateOnly(cursor);
      const status = cursor <= completedDate ? "completed" : "booked";
      const rebookableUntil =
        status === "booked"
          ? formatDateTime(formatDateOnly(addDays(cursor, 180)), item.startTime)
          : "";
      classes.push({
        class_ref: classRef,
        customer_ref: item.customerRef,
        instructor_ref: item.instructorRef,
        recurring_class_ref: item.recurringClassRef,
        subscription_ref: item.subscriptionRef,
        date_time: formatDateTime(dateOnly, item.startTime),
        status,
        rebookable_until: rebookableUntil,
        class_code: `c${classSeq}`,
        is_free_trial: "false",
      });

      for (const childRef of item.childRefs) {
        classAttendance.push({
          class_ref: classRef,
          child_ref: childRef,
        });
      }

      classSeq += 1;
      cursor = addDays(cursor, 7);
    }
  }

  return { classes, classAttendance };
}

function rowsToFileMap(rows: RowMap): Record<NormalizedFileName, string> {
  const out = {} as Record<NormalizedFileName, string>;
  for (const fileName of MANDATORY_NORMALIZED_FILES) {
    const fileRows = rows[fileName] as Record<string, string>[];
    out[fileName] = toCsv(fileName, fileRows);
  }
  return out;
}

async function writeCsvFiles(
  outDir: string,
  files: Record<NormalizedFileName, string>,
): Promise<void> {
  await fs.mkdir(outDir, { recursive: true });
  for (const fileName of MANDATORY_NORMALIZED_FILES) {
    await fs.writeFile(path.join(outDir, fileName), files[fileName], "utf8");
  }
}

async function writeDeterministicZip(
  zipPath: string,
  files: Record<NormalizedFileName, string>,
): Promise<void> {
  const zip = new JSZip();
  const fixedDate = new Date("1970-01-01T00:00:00.000Z");

  for (const fileName of [...MANDATORY_NORMALIZED_FILES].sort()) {
    zip.file(fileName, files[fileName], { date: fixedDate });
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
    platform: "UNIX",
  });
  await fs.writeFile(zipPath, buffer);
}

export async function generateNormalizedImportFixture(
  options: GenerateNormalizedImportFixtureOptions,
): Promise<GeneratedNormalizedImportFixture> {
  const instructorCount = options.instructorCount ?? DEFAULT_INSTRUCTOR_COUNT;
  if (!Number.isSafeInteger(instructorCount) || instructorCount < 2) {
    throw new Error("instructorCount must be an integer of at least 2");
  }
  const customerCount = instructorCount * CUSTOMERS_PER_INSTRUCTOR;

  const { fakerEN_US, fakerJA } = (await import("@faker-js/faker")) as {
    fakerEN_US: FakerLike;
    fakerJA: FakerLike;
  };
  fakerEN_US.seed(FAKER_SEED);
  fakerJA.seed(FAKER_SEED);

  const plans = planRows();
  const instructors = instructorRows(fakerEN_US, instructorCount);
  const customers = customerRows(fakerJA, customerCount);
  const children = childRows(fakerEN_US, customerCount);
  const subscriptions = subscriptionRows(options.from, customerCount);
  const childRefsByCustomer = buildCustomerChildMap(children);
  const recurring = assignRecurringClasses(
    recurringCandidates(subscriptions, childRefsByCustomer, plans),
    options.from,
    instructorCount,
  );
  const { classes, classAttendance } = classRowsAndAttendance(
    recurring,
    options.completedUntil,
    options.to,
  );

  const rows: RowMap = {
    "plans.csv": plans,
    "customers.csv": customers,
    "children.csv": children,
    "subscriptions.csv": subscriptions,
    "instructors.csv": instructors,
    "instructor_fees.csv": instructorFeeRows(options.from, instructorCount),
    "instructor_schedules.csv": instructorScheduleRows(
      options.from,
      instructorCount,
    ),
    "instructor_absences.csv": [],
    "events.csv": eventRows(),
    "schedules.csv": scheduleRows(options.from, options.to),
    "system_status.csv": [{ status: "Running" }],
    "recurring_classes.csv": recurringRows(recurring),
    "recurring_class_attendance.csv": recurringAttendanceRows(recurring),
    "classes.csv": classes,
    "class_attendance.csv": classAttendance,
  };

  const files = rowsToFileMap(rows);
  const zipFileName = `normalized-import-${options.from}_to_${options.to}.zip`;

  return { files, rows, zipFileName };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const generated = await generateNormalizedImportFixture({
    from: args.from,
    completedUntil: args.completedUntil,
    to: args.to,
    instructorCount: args.instructorCount,
  });
  const { files, rows, zipFileName } = generated;

  await writeCsvFiles(args.outDir, files);

  await writeDeterministicZip(path.join(args.outDir, zipFileName), files);

  console.log("Generated deterministic normalized import fixture");
  console.log(`Output directory: ${args.outDir}`);
  for (const fileName of MANDATORY_NORMALIZED_FILES) {
    const rowCount = rows[fileName].length;
    console.log(`${fileName}: ${rowCount}`);
  }
  console.log(`zip: ${zipFileName}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
