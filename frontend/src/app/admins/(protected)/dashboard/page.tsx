import DashboardClient from "@/components/admins-dashboard/dashboard/DashboardClient";
import {
  getAllChildren,
  getAllClasses,
  getAllCustomers,
  getAllPastCustomers,
  getAllInstructors,
  getMessageBoardPosts,
} from "@/lib/api/adminsApi";
import { getInstructorProfiles } from "@/lib/api/instructorsApi";
import { authenticateUserSession } from "@/lib/auth/sessionUtils";
import { getCookie } from "@/proxy";
import { defaultUserImageUrl } from "@/lib/data/data";
import {
  ENGLISH_BACKGROUND_LABELS,
  EnglishBackground,
} from "@/lib/data/englishBackground";

const MONTH_WINDOW = 12;

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

      if (
        normalized ===
        ENGLISH_BACKGROUND_LABELS[EnglishBackground.NonNative].toLowerCase()
      ) {
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

function normalizeStatus(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .replace(/cancelled/g, "canceled");
}

function formatDateInJst(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function classifyInstructorCancel(
  canceledAt: string | null,
  classDateTimeJst: string,
): "cancel" | "cancelWithoutNotice" {
  if (!canceledAt) {
    return "cancelWithoutNotice";
  }

  const classDate = classDateTimeJst.slice(0, 10);
  const canceledDate = formatDateInJst(new Date(canceledAt));

  if (canceledDate < classDate) {
    return "cancel";
  }

  return "cancelWithoutNotice";
}

function calcAttendanceByInstructor(
  classes: Awaited<ReturnType<typeof getAllClasses>>,
  monthKeys: string[],
  instructors: Awaited<ReturnType<typeof getAllInstructors>>,
  instructorProfiles: Awaited<ReturnType<typeof getInstructorProfiles>>,
): InstructorAttendanceItem[] {
  const monthLookup = new Set(monthKeys);
  const profileMap = new Map(
    instructorProfiles.map((profile) => [profile.id, profile]),
  );

  return instructors.map((instructor) => {
    const monthlyBuckets = new Map<
      string,
      {
        bookedLessons: number;
        trialLessons: number;
        regularLessons: number;
        completedLessons: number;
        canceledByCustomerLessons: number;
        cancelLessons: number;
        cancelWithoutNoticeLessons: number;
      }
    >();

    monthKeys.forEach((monthKey) => {
      monthlyBuckets.set(monthKey, {
        bookedLessons: 0,
        trialLessons: 0,
        regularLessons: 0,
        completedLessons: 0,
        canceledByCustomerLessons: 0,
        cancelLessons: 0,
        cancelWithoutNoticeLessons: 0,
      });
    });

    classes.forEach((item) => {
      if (item.InstructorID !== instructor.ID) {
        return;
      }

      const monthKey = parseMonthKey(item["Date/Time (JST)"]);
      if (!monthKey || !monthLookup.has(monthKey)) {
        return;
      }

      const bucket = monthlyBuckets.get(monthKey);
      if (!bucket) {
        return;
      }

      bucket.bookedLessons += 1;

      const status = normalizeStatus(item.Status);
      if (status === "completed") {
        bucket.completedLessons += 1;
        if (item["Is Free Trial"]) {
          bucket.trialLessons += 1;
        } else {
          bucket.regularLessons += 1;
        }
      }
      if (status === "canceledcustomer") {
        bucket.canceledByCustomerLessons += 1;
      }
      if (status === "canceledinstructor") {
        const cancelType = classifyInstructorCancel(
          item["Canceled At"],
          item["Date/Time (JST)"],
        );
        if (cancelType === "cancelWithoutNotice") {
          bucket.cancelWithoutNoticeLessons += 1;
        } else {
          bucket.cancelLessons += 1;
        }
      }
    });

    const monthly = monthKeys.map((monthKey) => {
      const bucket = monthlyBuckets.get(monthKey);
      if (!bucket) {
        const [year] = monthKey.split("-").map(Number);
        return {
          year: year || 0,
          month: monthLabelFromKey(monthKey),
          trialLessons: 0,
          regularLessons: 0,
          completedLessons: 0,
          cancelLessons: 0,
          cancelWithoutNoticeLessons: 0,
          attendanceRate: 0,
        };
      }

      const attendanceDenominator =
        bucket.bookedLessons - bucket.canceledByCustomerLessons;
      const attendanceRate =
        attendanceDenominator <= 0
          ? 0
          : Math.round((bucket.completedLessons / attendanceDenominator) * 100);
      const [year] = monthKey.split("-").map(Number);

      return {
        year: year || 0,
        month: monthLabelFromKey(monthKey),
        ...bucket,
        attendanceRate,
      };
    });

    const profile = profileMap.get(instructor.ID);
    const normalizedEnglish = instructor.English.trim().toLowerCase();
    const englishBackgroundClass =
      normalizedEnglish === "native a"
        ? "native-a"
        : normalizedEnglish === "native b"
          ? "native-b"
          : "non-native";

    return {
      id: instructor.ID,
      nickname: profile?.nickname ?? instructor.Instructor,
      imageUrl: profile?.icon || defaultUserImageUrl,
      englishBackgroundClass,
      monthly,
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
  await authenticateUserSession("admin");

  const cookie = await getCookie();
  const [
    customers,
    children,
    classes,
    pastCustomers,
    instructors,
    instructorProfiles,
    messageBoardPosts,
  ] = await Promise.all([
    getAllCustomers(cookie),
    getAllChildren(cookie),
    getAllClasses(false, cookie),
    getAllPastCustomers(cookie),
    getAllInstructors(cookie),
    getInstructorProfiles(cookie),
    getMessageBoardPosts(cookie),
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
  const instructorAttendance = calcAttendanceByInstructor(
    classes,
    monthKeys,
    instructors,
    instructorProfiles,
  );
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
      instructorAttendance={instructorAttendance}
      recentMessages={messageBoardPosts.slice(0, 20) as MessageItem[]}
    />
  );
}
