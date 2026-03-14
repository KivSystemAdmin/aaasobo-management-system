import { prisma } from "../../prisma/prismaClient";
import type {
  InstructorPayrollPeriod,
  InstructorPayrollResponse,
} from "../../../shared/schemas/admins";
import type { Status } from "../../generated/prisma";

const PAYROLL_TIMEZONE = "Asia/Tokyo";
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-CA", {
  timeZone: PAYROLL_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

type PayrollCategory = "trial" | "regular" | "cancel" | "cancelWithoutNotice";

type PayrollClass = {
  id: number;
  dateTime: Date | null;
  updatedAt: Date;
  canceledAt: Date | null;
  status: Status;
  isFreeTrial: boolean;
};

type PayrollPeriodSummary = InstructorPayrollPeriod;
type PayrollClassWithDateTime = PayrollClass & { dateTime: Date };
type PayrollTotals = {
  trial: number;
  regular: number;
  cancel: number;
  cancelWithoutNotice: number;
};

type PayrollFeeRecord = {
  currency: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  trialFee: number;
  regularFee: number;
  cancelFee: number;
  cancelWithoutNoticeFee: number;
};

export class InstructorPayrollError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

const formatDateInJst = (date: Date) => {
  const parts = MONTH_FORMATTER.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Failed to format JST date");
  }

  return `${year}-${month}-${day}`;
};

const toJstStartOfDayUtc = (date: string) => new Date(`${date}T00:00:00+09:00`);

const toJstEndOfDayUtc = (date: string) =>
  new Date(`${date}T23:59:59.999+09:00`);

const getLastDayOfMonth = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

const getMonthBounds = (month: string) => {
  const match = /^(?<year>\d{4})-(?<month>0[1-9]|1[0-2])$/.exec(month);
  if (!match?.groups) {
    throw new InstructorPayrollError(
      400,
      "INVALID_MONTH",
      "month must be in YYYY-MM format",
    );
  }

  const year = Number(match.groups.year);
  const monthNumber = Number(match.groups.month);
  const monthIndex = monthNumber - 1;
  const lastDay = getLastDayOfMonth(year, monthIndex);
  const paddedMonth = String(monthNumber).padStart(2, "0");

  return {
    firstDay: `${year}-${paddedMonth}-01`,
    firstHalfEnd: `${year}-${paddedMonth}-15`,
    secondHalfStart: `${year}-${paddedMonth}-16`,
    lastDay: `${year}-${paddedMonth}-${String(lastDay).padStart(2, "0")}`,
  };
};

const classifyPayrollCategory = (
  payrollClass: PayrollClassWithDateTime,
): PayrollCategory | null => {
  if (payrollClass.status === "completed") {
    return payrollClass.isFreeTrial ? "trial" : "regular";
  }

  if (payrollClass.status !== "canceledByInstructor") {
    return null;
  }

  if (!payrollClass.canceledAt) {
    throw new Error(
      `Class ${payrollClass.id} is canceled by instructor but missing canceledAt`,
    );
  }

  const classDateInJst = formatDateInJst(payrollClass.dateTime);
  const cancellationDateInJst = formatDateInJst(payrollClass.canceledAt);
  return cancellationDateInJst < classDateInJst
    ? "cancel"
    : "cancelWithoutNotice";
};

const formatFeeRecord = (fee: {
  currency: string;
  effectiveFrom: Date;
  effectiveTo: Date | null;
  trialFee: number;
  regularFee: number;
  cancelFee: number;
  cancelWithoutNoticeFee: number;
}): PayrollFeeRecord => ({
  currency: fee.currency,
  effectiveFrom: fee.effectiveFrom.toISOString().slice(0, 10),
  effectiveTo: fee.effectiveTo
    ? fee.effectiveTo.toISOString().slice(0, 10)
    : null,
  trialFee: fee.trialFee,
  regularFee: fee.regularFee,
  cancelFee: fee.cancelFee,
  cancelWithoutNoticeFee: fee.cancelWithoutNoticeFee,
});

const resolveApplicableFee = (
  classDateInJst: string,
  feeRecords: PayrollFeeRecord[],
) => {
  const matches = feeRecords.filter(
    (fee) =>
      fee.effectiveFrom <= classDateInJst &&
      (fee.effectiveTo === null || fee.effectiveTo > classDateInJst),
  );

  if (matches.length !== 1) {
    throw new InstructorPayrollError(
      422,
      "MISSING_FEE_RATE",
      `No unique fee rate found for class date ${classDateInJst}`,
    );
  }

  return matches[0];
};

const emptyPeriodTotals = () => ({
  trial: 0,
  regular: 0,
  cancel: 0,
  cancelWithoutNotice: 0,
});

const cloneTotals = (totals: PayrollTotals): PayrollTotals => ({ ...totals });

const getCategoryFee = (fee: PayrollFeeRecord, category: PayrollCategory) => {
  switch (category) {
    case "trial":
      return fee.trialFee;
    case "regular":
      return fee.regularFee;
    case "cancel":
      return fee.cancelFee;
    case "cancelWithoutNotice":
      return fee.cancelWithoutNoticeFee;
  }
};

const getCategoryTotalImpact = (
  fee: PayrollFeeRecord,
  category: PayrollCategory,
) => {
  const amount = getCategoryFee(fee, category);
  return category === "trial" || category === "regular" ? amount : -amount;
};

const summarizePeriod = (
  periodName: "1-15" | "16-last",
  from: string,
  to: string,
  classes: PayrollClassWithDateTime[],
  feeRecords: PayrollFeeRecord[],
): PayrollPeriodSummary => {
  const counts = emptyPeriodTotals();
  const subtotals = emptyPeriodTotals();
  const appliedFeePeriods = new Map<string, PayrollFeeRecord>();
  const dailyBreakdown = new Map<
    string,
    { counts: PayrollTotals; total: number }
  >();
  const currencies = new Set<string>();
  let total = 0;
  let sourceLastUpdatedAt: Date | null = null;

  for (const payrollClass of classes) {
    const category = classifyPayrollCategory(payrollClass);
    if (!category) continue;

    const classDateInJst = formatDateInJst(payrollClass.dateTime);
    const fee = resolveApplicableFee(classDateInJst, feeRecords);
    const feeAmount = getCategoryFee(fee, category);
    const totalImpact = getCategoryTotalImpact(fee, category);

    counts[category] += 1;
    subtotals[category] += feeAmount;
    total += totalImpact;
    currencies.add(fee.currency);
    appliedFeePeriods.set(
      `${fee.currency}:${fee.effectiveFrom}:${fee.effectiveTo ?? "open"}`,
      fee,
    );

    if (!sourceLastUpdatedAt || payrollClass.updatedAt > sourceLastUpdatedAt) {
      sourceLastUpdatedAt = payrollClass.updatedAt;
    }

    const daySummary = dailyBreakdown.get(classDateInJst) ?? {
      counts: emptyPeriodTotals(),
      total: 0,
    };
    daySummary.counts[category] += 1;
    daySummary.total += totalImpact;
    dailyBreakdown.set(classDateInJst, daySummary);
  }

  if (currencies.size > 1) {
    throw new InstructorPayrollError(
      422,
      "MULTIPLE_CURRENCIES",
      `Payroll period ${periodName} mixes multiple currencies`,
    );
  }

  return {
    from,
    to,
    sourceLastUpdatedAt: sourceLastUpdatedAt?.toISOString() ?? null,
    currency: currencies.values().next().value ?? null,
    counts,
    subtotals,
    total,
    dailyBreakdown: Array.from(dailyBreakdown.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([date, day]) => ({
        date,
        counts: cloneTotals(day.counts),
        total: day.total,
      })),
    appliedFeePeriods: Array.from(appliedFeePeriods.values()).sort((a, b) =>
      a.effectiveFrom.localeCompare(b.effectiveFrom),
    ),
  };
};

export const getInstructorPayroll = async (
  instructorId: number,
  month: string,
): Promise<InstructorPayrollResponse> => {
  const bounds = getMonthBounds(month);
  const [instructor, classes, fees] = await Promise.all([
    prisma.instructor.findUnique({
      where: { id: instructorId },
      select: { id: true },
    }),
    prisma.class.findMany({
      where: {
        instructorId,
        dateTime: {
          gte: toJstStartOfDayUtc(bounds.firstDay),
          lte: toJstEndOfDayUtc(bounds.lastDay),
        },
      },
      select: {
        id: true,
        dateTime: true,
        updatedAt: true,
        canceledAt: true,
        status: true,
        isFreeTrial: true,
      },
      orderBy: { dateTime: "asc" },
    }),
    prisma.instructorFee.findMany({
      where: {
        instructorId,
        effectiveFrom: { lte: new Date(`${bounds.lastDay}T00:00:00.000Z`) },
        OR: [
          { effectiveTo: null },
          {
            effectiveTo: { gt: new Date(`${bounds.firstDay}T00:00:00.000Z`) },
          },
        ],
      },
      select: {
        currency: true,
        effectiveFrom: true,
        effectiveTo: true,
        trialFee: true,
        regularFee: true,
        cancelFee: true,
        cancelWithoutNoticeFee: true,
      },
      orderBy: { effectiveFrom: "asc" },
    }),
  ]);

  if (!instructor) {
    throw new InstructorPayrollError(
      404,
      "INSTRUCTOR_NOT_FOUND",
      "Instructor not found",
    );
  }

  const feeRecords = fees.map(formatFeeRecord);
  const payableClasses: PayrollClassWithDateTime[] = classes
    .filter((payrollClass) => payrollClass.dateTime instanceof Date)
    .map((payrollClass) => ({
      ...payrollClass,
      dateTime: payrollClass.dateTime as Date,
    }));

  const firstHalfClasses = payableClasses.filter(
    (payrollClass) =>
      formatDateInJst(payrollClass.dateTime) <= bounds.firstHalfEnd,
  );
  const secondHalfClasses = payableClasses.filter(
    (payrollClass) =>
      formatDateInJst(payrollClass.dateTime) >= bounds.secondHalfStart,
  );

  return {
    instructorId,
    month,
    timezone: PAYROLL_TIMEZONE,
    periods: [
      summarizePeriod(
        "1-15",
        bounds.firstDay,
        bounds.firstHalfEnd,
        firstHalfClasses,
        feeRecords,
      ),
      summarizePeriod(
        "16-last",
        bounds.secondHalfStart,
        bounds.lastDay,
        secondHalfClasses,
        feeRecords,
      ),
    ],
  };
};
