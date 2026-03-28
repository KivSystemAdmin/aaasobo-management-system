import DashboardClient from "@/components/admins-dashboard/dashboard/DashboardClient";
import {
  getAllChildren,
  getAllClasses,
  getAllCustomers,
  getAllPastCustomers,
  getAllInstructors,
} from "@/lib/api/adminsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "../../../../proxy";

type MonthlyData = {
  month: string;
  value: number;
};

const MONTH_WINDOW = 12;

type InstructorEnglishBackgroundCounts = {
  nonNative: number;
  nativeA: number;
  nativeB: number;
};

function getLastMonthKeys(months: number, anchorMonthKey?: string): string[] {
  const now = new Date();
  const [anchorYear, anchorMonth] = anchorMonthKey
    ? anchorMonthKey.split("-").map(Number)
    : [now.getFullYear(), now.getMonth() + 1];
  const anchorDate = new Date(anchorYear, (anchorMonth || 1) - 1, 1);
  const keys: string[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const date = new Date(
      anchorDate.getFullYear(),
      anchorDate.getMonth() - i,
      1,
    );
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    keys.push(key);
  }

  return keys;
}

function parseMonthKey(value: string): string | null {
  const normalized = value.trim();
  const direct = normalized.match(/(\d{4})[-/](\d{1,2})/);
  if (direct) {
    return `${direct[1]}-${direct[2].padStart(2, "0")}`;
  }

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthYearLabelFromKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function buildMonthRangeLabel(monthKeys: string[]): string {
  const start = monthKeys[0];
  const end = monthKeys[monthKeys.length - 1];

  if (!start || !end) {
    return "";
  }

  return `${monthYearLabelFromKey(start)} - ${monthYearLabelFromKey(end)}`;
}

function calcInstructorEnglishBackgroundCounts(
  instructors: Awaited<ReturnType<typeof getAllInstructors>>,
): InstructorEnglishBackgroundCounts {
  return instructors.reduce<InstructorEnglishBackgroundCounts>(
    (counts, instructor) => {
      const normalized = instructor.English.trim().toLowerCase();

      if (normalized === "non-native") {
        counts.nonNative += 1;
      } else if (normalized === "native a") {
        counts.nativeA += 1;
      } else if (normalized === "native b") {
        counts.nativeB += 1;
      }

      return counts;
    },
    { nonNative: 0, nativeA: 0, nativeB: 0 },
  );
}

function monthLabelFromKey(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, 1);
  return new Intl.DateTimeFormat("en-US", { month: "short" }).format(date);
}

function toMonthlyData(
  monthKeys: string[],
  monthMap: Map<string, number>,
): MonthlyData[] {
  return monthKeys.map((monthKey) => ({
    month: monthLabelFromKey(monthKey),
    value: monthMap.get(monthKey) ?? 0,
  }));
}

function calcAttendanceRateByMonth(
  classes: Awaited<ReturnType<typeof getAllClasses>>,
  monthKeys: string[],
): MonthlyData[] {
  const completedCountByMonth = new Map<string, number>();
  const finishedCountByMonth = new Map<string, number>();

  classes.forEach((item) => {
    const monthKey = parseMonthKey(item["Date/Time (JST)"]);
    if (!monthKey || !monthKeys.includes(monthKey)) {
      return;
    }

    const status = item.Status.toLowerCase();
    const isFinishedClass =
      status.includes("completed") || status.includes("canceled");

    if (!isFinishedClass) {
      return;
    }

    finishedCountByMonth.set(
      monthKey,
      (finishedCountByMonth.get(monthKey) ?? 0) + 1,
    );

    if (status.includes("completed")) {
      completedCountByMonth.set(
        monthKey,
        (completedCountByMonth.get(monthKey) ?? 0) + 1,
      );
    }
  });

  return monthKeys.map((monthKey) => {
    const completed = completedCountByMonth.get(monthKey) ?? 0;
    const finished = finishedCountByMonth.get(monthKey) ?? 0;
    const rate = finished === 0 ? 0 : Math.round((completed / finished) * 100);

    return {
      month: monthLabelFromKey(monthKey),
      value: rate,
    };
  });
}

function calcNewCustomersByMonth(
  customers: Awaited<ReturnType<typeof getAllCustomers>>,
  pastCustomers: Awaited<ReturnType<typeof getAllPastCustomers>>,
  monthKeys: string[],
): MonthlyData[] {
  const monthlyCount = new Map<string, number>();
  const pushRegistration = (registrationDate: string) => {
    const monthKey = parseMonthKey(registrationDate);
    if (!monthKey || !monthKeys.includes(monthKey)) {
      return;
    }

    monthlyCount.set(monthKey, (monthlyCount.get(monthKey) ?? 0) + 1);
  };

  customers.forEach((item) => {
    pushRegistration(item["Start Date (JST)"]);
  });

  pastCustomers.forEach((item) => {
    pushRegistration(item["Start Date (JST)"]);
  });

  return toMonthlyData(monthKeys, monthlyCount);
}

function calcChurnByMonth(
  pastCustomers: Awaited<ReturnType<typeof getAllPastCustomers>>,
  monthKeys: string[],
): MonthlyData[] {
  const churnMap = new Map<string, number>();

  pastCustomers.forEach((item) => {
    const monthKey = parseMonthKey(item["End Date (JST)"]);
    if (!monthKey || !monthKeys.includes(monthKey)) {
      return;
    }

    churnMap.set(monthKey, (churnMap.get(monthKey) ?? 0) + 1);
  });

  return toMonthlyData(monthKeys, churnMap);
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  await authenticateUserSession("admin", params.id);

  const cookie = await getCookie();
  const [customers, children, classes, pastCustomers, instructors] =
    await Promise.all([
      getAllCustomers(cookie),
      getAllChildren(cookie),
      getAllClasses(false, cookie),
      getAllPastCustomers(cookie),
      getAllInstructors(cookie),
    ]);

  const monthKeys = getLastMonthKeys(MONTH_WINDOW);
  const monthRangeLabel = buildMonthRangeLabel(monthKeys);
  const newCustomersByMonth = calcNewCustomersByMonth(
    customers,
    pastCustomers,
    monthKeys,
  );
  const churnCustomersByMonth = calcChurnByMonth(pastCustomers, monthKeys);
  const attendanceByMonth = calcAttendanceRateByMonth(classes, monthKeys);
  const instructorCounts = calcInstructorEnglishBackgroundCounts(instructors);

  return (
    <DashboardClient
      metrics={{
        totalCustomers: customers.length,
        totalChildren: children.length,
        instructorsByEnglishBackground: instructorCounts,
      }}
      monthRangeLabel={monthRangeLabel}
      newCustomersByMonth={newCustomersByMonth}
      churnCustomersByMonth={churnCustomersByMonth}
      attendanceByMonth={attendanceByMonth}
    />
  );
}
