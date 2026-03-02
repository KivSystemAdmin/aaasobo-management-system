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

const INSTRUCTOR_COUNT = 10;
const CUSTOMER_COUNT = 100;
const DOUBLE_CHILD_CUSTOMER_COUNT = 10;
const SINGLE_CHILD_CUSTOMER_COUNT = CUSTOMER_COUNT - DOUBLE_CHILD_CUSTOMER_COUNT;

const PATTERN_A_SLOTS: SlotDef[] = buildPatternSlots([1, 2, 3], [
  "16:00",
  "16:30",
  "17:00",
  "17:30",
  "18:00",
]);
const PATTERN_B_SLOTS: SlotDef[] = [
  ...buildPatternSlots([4, 5], ["18:30", "19:00", "19:30", "20:00", "20:30"]),
  ...buildPatternSlots([6], ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30"]),
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
  is_native: string;
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
  is_native: string;
  termination_at: string;
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
  outDir: string;
};

function usageAndExit(message?: string): never {
  if (message) {
    console.error(`Error: ${message}`);
  }
  console.error(
    "Usage: ts-node ./src/seed/generateNormalizedImportFixture.ts --from YYYY-MM-DD --completed-until YYYY-MM-DD --to YYYY-MM-DD [--out-dir PATH]",
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

  return { from, completedUntil, to, outDir };
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

function toCsv(fileName: NormalizedFileName, rows: Record<string, string>[]): string {
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
      name: "月3,180円プラン / 3,180 yen/month Plan",
      description: "1 classes per week",
      weekly_class_times: "1",
      is_native: "false",
      termination_at: "",
    },
    {
      plan_ref: ref("PL", 2),
      name: "月5,980円プラン / 5,980 yen/month Plan",
      description: "2 classes per week",
      weekly_class_times: "2",
      is_native: "true",
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

function instructorRows(fakerEn: FakerLike): InstructorDef[] {
  const rows: InstructorDef[] = [];
  const nicknameCounts = new Map<string, number>();
  for (let i = 1; i <= INSTRUCTOR_COUNT; i += 1) {
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
      icon: `https://img.example.com/${lowerRef}.png`,
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
      is_native: i % 2 === 0 ? "true" : "false",
      termination_at: "",
    });
  }
  return rows;
}

function slotsForInstructor(instructorIndexOneBased: number): SlotDef[] {
  return instructorIndexOneBased % 2 === 1 ? PATTERN_A_SLOTS : PATTERN_B_SLOTS;
}

function instructorScheduleRows(from: string): InstructorScheduleDef[] {
  const rows: InstructorScheduleDef[] = [];
  for (let i = 1; i <= INSTRUCTOR_COUNT; i += 1) {
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

function customerRows(fakerJa: FakerLike): CustomerDef[] {
  const rows: CustomerDef[] = [];
  for (let i = 1; i <= CUSTOMER_COUNT; i += 1) {
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

function childRows(fakerEn: FakerLike): ChildDef[] {
  const rows: ChildDef[] = [];
  let childSeq = 1;
  for (let customerIndex = 1; customerIndex <= CUSTOMER_COUNT; customerIndex += 1) {
    const customerRef = ref("CU", customerIndex);
    const childCount = customerIndex <= SINGLE_CHILD_CUSTOMER_COUNT ? 1 : 2;
    for (let j = 1; j <= childCount; j += 1) {
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

function subscriptionRows(from: string): SubscriptionDef[] {
  const rows: SubscriptionDef[] = [];
  for (let i = 1; i <= CUSTOMER_COUNT; i += 1) {
    const customerRef = ref("CU", i);
    const hasTwoChildren = i > SINGLE_CHILD_CUSTOMER_COUNT;
    rows.push({
      subscription_ref: ref("SU", i),
      customer_ref: customerRef,
      // Keep 1-child customers on weekly-1, 2-child customers on weekly-2.
      plan_ref: hasTwoChildren ? ref("PL", 2) : ref("PL", 1),
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
): RecurringCandidate[] {
  const rows: RecurringCandidate[] = [];
  for (const sub of subscriptions) {
    const weekly = sub.plan_ref === ref("PL", 1) ? 1 : 2;
    const childRefs = childRefsByCustomer.get(sub.customer_ref) ?? [];
    for (let i = 0; i < weekly; i += 1) {
      rows.push({
        subscriptionRef: sub.subscription_ref,
        customerRef: sub.customer_ref,
        childRefs,
        indexWithinSubscription: i,
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
): RecurringAssignment[] {
  if (candidates.length % INSTRUCTOR_COUNT !== 0) {
    throw new Error(
      `Recurring classes (${candidates.length}) must be divisible by instructor count (${INSTRUCTOR_COUNT})`,
    );
  }

  const perInstructor = candidates.length / INSTRUCTOR_COUNT;
  const assignmentCountByInstructor = new Map<string, number>();
  const rows: RecurringAssignment[] = [];

  for (let i = 0; i < candidates.length; i += 1) {
    const instructorIndex = Math.floor(i / perInstructor) + 1;
    const instructorRef = ref("IN", instructorIndex);
    const assignedCount = assignmentCountByInstructor.get(instructorRef) ?? 0;
    const slots = slotsForInstructor(instructorIndex);
    const slot = slots[assignedCount % slots.length];

    const firstDate = nextDateOnOrAfter(parseDateOnly(from), slot.weekday);
    const firstDateOnly = formatDateOnly(firstDate);
    const recurringRef = ref("RC", i + 1);
    const candidate = candidates[i];

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

  for (let i = 1; i <= INSTRUCTOR_COUNT; i += 1) {
    const instructorRef = ref("IN", i);
    const count = assignmentCountByInstructor.get(instructorRef) ?? 0;
    if (count !== perInstructor) {
      throw new Error(
        `Instructor ${instructorRef} assignment mismatch: expected ${perInstructor}, got ${count}`,
      );
    }
  }

  return rows;
}

function recurringRows(assignments: RecurringAssignment[]): RecurringClassDef[] {
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
      classes.push({
        class_ref: classRef,
        customer_ref: item.customerRef,
        instructor_ref: item.instructorRef,
        recurring_class_ref: item.recurringClassRef,
        subscription_ref: item.subscriptionRef,
        date_time: formatDateTime(dateOnly, item.startTime),
        status,
        rebookable_until: "",
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

async function main(): Promise<void> {
  const { fakerEN_US, fakerJA } = (await import("@faker-js/faker")) as {
    fakerEN_US: FakerLike;
    fakerJA: FakerLike;
  };
  fakerEN_US.seed(FAKER_SEED);
  fakerJA.seed(FAKER_SEED);

  const args = parseArgs(process.argv.slice(2));
  const plans = planRows();
  const instructors = instructorRows(fakerEN_US);
  const customers = customerRows(fakerJA);
  const children = childRows(fakerEN_US);
  const subscriptions = subscriptionRows(args.from);
  const childRefsByCustomer = buildCustomerChildMap(children);
  const recurring = assignRecurringClasses(
    recurringCandidates(subscriptions, childRefsByCustomer),
    args.from,
  );
  const { classes, classAttendance } = classRowsAndAttendance(
    recurring,
    args.completedUntil,
    args.to,
  );

  const rows: RowMap = {
    "plans.csv": plans,
    "customers.csv": customers,
    "children.csv": children,
    "subscriptions.csv": subscriptions,
    "instructors.csv": instructors,
    "instructor_schedules.csv": instructorScheduleRows(args.from),
    "instructor_absences.csv": [],
    "events.csv": eventRows(),
    "schedules.csv": scheduleRows(args.from, args.to),
    "system_status.csv": [{ status: "Running" }],
    "recurring_classes.csv": recurringRows(recurring),
    "recurring_class_attendance.csv": recurringAttendanceRows(recurring),
    "classes.csv": classes,
    "class_attendance.csv": classAttendance,
  };

  const files = rowsToFileMap(rows);
  await writeCsvFiles(args.outDir, files);

  const zipFileName = `normalized-import-${args.from}_to_${args.to}.zip`;
  await writeDeterministicZip(path.join(args.outDir, zipFileName), files);

  console.log("Generated deterministic normalized import fixture");
  console.log(`Output directory: ${args.outDir}`);
  for (const fileName of MANDATORY_NORMALIZED_FILES) {
    const rowCount = rows[fileName].length;
    console.log(`${fileName}: ${rowCount}`);
  }
  console.log(`zip: ${zipFileName}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
