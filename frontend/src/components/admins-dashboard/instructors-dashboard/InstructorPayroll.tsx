"use client";

import { useEffect, useState, useTransition } from "react";

import Loading from "@/components/elements/loading/Loading";
import {
  getInstructorPayroll,
  type InstructorPayrollApiError,
} from "@/lib/api/adminsApi";
import styles from "./InstructorPayroll.module.scss";
import type {
  InstructorPayrollDailyBreakdown,
  InstructorPayrollPeriod,
  InstructorPayrollResponse,
} from "@shared/schemas/admins";

type PayrollLocale = "en" | "ja";

const labels = {
  en: {
    unknown: "Unknown",
    from: "to",
    current: "Present",
    noPayableClasses: "There are no payable classes in this period.",
    date: "Date",
    trial: "Trial",
    regular: "Regular",
    cancel: "Cancellation",
    cancellationCount: "cancellations",
    cancelWithoutNotice: "Cancellation without notice",
    dailyTotal: "Daily total",
    monthlyCancellationCount: "Monthly cancellation count",
    dailyBreakdown: "Daily breakdown",
    lastUpdated: "Last updated",
    applicablePeriods: "Applicable periods",
    noApplicablePeriods: "There are no applicable periods.",
    trialClass: "Trial class",
    regularClass: "Regular class",
    monthlyCancellationFormula: "Monthly cancellation count / 10",
    monthInput: "Select payroll month",
    loading: "Loading payroll information…",
  },
  ja: {
    unknown: "不明",
    from: "から",
    current: "現在",
    noPayableClasses: "この期間には給与支払い対象のクラスがありません。",
    date: "日付",
    trial: "体験",
    regular: "通常",
    cancel: "キャンセル",
    cancellationCount: "キャンセル",
    cancelWithoutNotice: "通知なしキャンセル",
    dailyTotal: "日計",
    monthlyCancellationCount: "月次の合計キャンセル数",
    dailyBreakdown: "日次内訳",
    lastUpdated: "最終更新日時",
    applicablePeriods: "適用期間",
    noApplicablePeriods: "対象期間がありません。",
    trialClass: "トライアルクラス",
    regularClass: "レギュラークラス",
    monthlyCancellationFormula: "月次の合計キャンセル数 / 10",
    monthInput: "給与計算対象月を選択",
    loading: "給与情報を取得中…",
  },
} as const;

const getCurrentJstMonth = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  if (!year || !month) {
    throw new Error("Failed to determine current JST month");
  }

  return `${year}-${month}`;
};

const formatMoney = (amount: number, currency: string | null) => {
  if (!currency) {
    return amount.toLocaleString("en-US");
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString("en-US")}`;
  }
};

const formatMoneyWithCurrencyCode = (
  amount: number,
  currency: string | null,
) => {
  const formattedAmount = formatMoney(amount, currency);

  if (!currency) {
    return formattedAmount;
  }

  return `${formattedAmount} (${currency})`;
};

const formatLastUpdatedLabel = (
  value: string | null,
  locale: PayrollLocale,
) => {
  if (!value) {
    return labels[locale].unknown;
  }

  return new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
};

const formatDayLabel = (date: string, locale: PayrollLocale) =>
  new Intl.DateTimeFormat(locale === "ja" ? "ja-JP" : "en-US", {
    timeZone: "Asia/Tokyo",
    day: "2-digit",
    weekday: "short",
  })
    .formatToParts(new Date(`${date}T00:00:00+09:00`))
    .reduce(
      (formatted, part) => {
        if (part.type === "day") {
          formatted.day = part.value;
        }
        if (part.type === "weekday") {
          formatted.weekday = part.value;
        }
        return formatted;
      },
      { day: "", weekday: "" },
    );

const formatPeriodLabel = (from: string, to: string, locale: PayrollLocale) => {
  return `${from} ${labels[locale].from} ${to}`;
};

const formatFeeCoverageEnd = (value: string | null, locale: PayrollLocale) => {
  if (!value) {
    return labels[locale].current;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
};

const isSecondHalfPeriod = (period: InstructorPayrollPeriod) =>
  Number(period.from.slice(8, 10)) >= 16;

function DailyBreakdownTable({
  rows,
  currency,
  locale,
}: {
  rows: InstructorPayrollDailyBreakdown[];
  currency: string | null;
  locale: PayrollLocale;
}) {
  if (rows.length === 0) {
    return (
      <p className={styles.emptyMessage}>{labels[locale].noPayableClasses}</p>
    );
  }

  const totals = rows.reduce(
    (summary, row) => ({
      trial: summary.trial + row.counts.trial,
      regular: summary.regular + row.counts.regular,
      cancel: summary.cancel + row.counts.cancel,
      cancelWithoutNotice:
        summary.cancelWithoutNotice + row.counts.cancelWithoutNotice,
      total: summary.total + row.total,
    }),
    {
      trial: 0,
      regular: 0,
      cancel: 0,
      cancelWithoutNotice: 0,
      total: 0,
    },
  );

  return (
    <div className={styles.tableWrap}>
      <table className={styles.dailyBreakdownTable}>
        <colgroup>
          <col className={styles.dateColumn} />
          <col className={styles.trialColumn} />
          <col className={styles.regularColumn} />
          <col className={styles.cancelColumn} />
          <col className={styles.cancelWithoutNoticeColumn} />
          <col className={styles.dayTotalColumn} />
        </colgroup>
        <thead>
          <tr>
            <th>{labels[locale].date}</th>
            <th>{labels[locale].trial}</th>
            <th>{labels[locale].regular}</th>
            <th>{labels[locale].cancel}</th>
            <th>{labels[locale].cancelWithoutNotice}</th>
            <th>{labels[locale].dailyTotal}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const dayLabel = formatDayLabel(row.date, locale);

            return (
              <tr key={row.date}>
                <th scope="row">
                  {dayLabel.day} ({dayLabel.weekday})
                </th>
                <td>{row.counts.trial}</td>
                <td>{row.counts.regular}</td>
                <td>{row.counts.cancel}</td>
                <td>{row.counts.cancelWithoutNotice}</td>
                <td>{formatMoney(row.total, currency)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{totals.trial}</td>
            <td>{totals.regular}</td>
            <td>{totals.cancel}</td>
            <td>{totals.cancelWithoutNotice}</td>
            <td>{formatMoney(totals.total, currency)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function MonthlyCancelAdjustment({
  currency,
  monthlyCancelFee,
  locale,
}: {
  currency: string | null;
  monthlyCancelFee: InstructorPayrollPeriod["monthlyCancelFee"];
  locale: PayrollLocale;
}) {
  return (
    <div className={styles.monthlyCancelAdjustment}>
      <div className={styles.monthlyCancelLabel}>
        <h5>{labels[locale].monthlyCancellationCount}</h5>
      </div>
      <p className={styles.monthlyCancelFormula}>
        {monthlyCancelFee.cancelCount} {labels[locale].cancellationCount} /{" "}
        {monthlyCancelFee.threshold} = {monthlyCancelFee.timesApplied} x{" "}
        {formatMoney(monthlyCancelFee.unitFee, currency)}
      </p>
      <strong>
        {monthlyCancelFee.total > 0 ? "-" : ""}
        {formatMoney(monthlyCancelFee.total, currency)}
      </strong>
    </div>
  );
}

function PeriodCard({
  period,
  locale,
}: {
  period: InstructorPayrollPeriod;
  locale: PayrollLocale;
}) {
  const showMonthlyCancelAdjustment = isSecondHalfPeriod(period);

  return (
    <section className={styles.periodCard}>
      <div className={styles.periodSummary}>
        <div>
          <h3>{formatPeriodLabel(period.from, period.to, locale)}</h3>
        </div>
        <div className={styles.summaryStats}>
          <strong>
            {formatMoneyWithCurrencyCode(period.total, period.currency)}
          </strong>
        </div>
      </div>

      <div className={styles.breakdownSection}>
        <h4>
          {labels[locale].dailyBreakdown} ({labels[locale].lastUpdated}{" "}
          {formatLastUpdatedLabel(period.sourceLastUpdatedAt, locale)})
        </h4>
        <DailyBreakdownTable
          rows={period.dailyBreakdown}
          currency={period.currency}
          locale={locale}
        />
        {showMonthlyCancelAdjustment && (
          <MonthlyCancelAdjustment
            currency={period.currency}
            monthlyCancelFee={period.monthlyCancelFee}
            locale={locale}
          />
        )}
      </div>

      <div className={styles.feePeriodsSection}>
        <h4>{labels[locale].applicablePeriods}</h4>
        {period.appliedFeePeriods.length === 0 ? (
          <p className={styles.emptyMessage}>
            {labels[locale].noApplicablePeriods}
          </p>
        ) : (
          <div className={styles.feePeriodsList}>
            {period.appliedFeePeriods.map((fee) => (
              <article
                key={`${fee.currency}-${fee.effectiveFrom}-${fee.effectiveTo ?? "open"}`}
                className={styles.feeCard}
              >
                <div className={styles.feeCardHeader}>
                  <strong>
                    {fee.effectiveFrom} {labels[locale].from}{" "}
                    {formatFeeCoverageEnd(fee.effectiveTo, locale)}
                  </strong>
                </div>
                <dl className={styles.feeGrid}>
                  <div>
                    <dt>{labels[locale].trialClass}</dt>
                    <dd>{formatMoney(fee.trialFee, fee.currency)}</dd>
                  </div>
                  <div>
                    <dt>{labels[locale].regularClass}</dt>
                    <dd>{formatMoney(fee.regularFee, fee.currency)}</dd>
                  </div>
                  <div>
                    <dt>{labels[locale].cancel}</dt>
                    <dd>{formatMoney(fee.cancelFee, fee.currency)}</dd>
                  </div>
                  <div>
                    <dt>{labels[locale].cancelWithoutNotice}</dt>
                    <dd>
                      {formatMoney(fee.cancelWithoutNoticeFee, fee.currency)}
                    </dd>
                  </div>
                  <div>
                    <dt>{labels[locale].monthlyCancellationFormula}</dt>
                    <dd>{formatMoney(fee.monthlyCancelFee, fee.currency)}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function InstructorPayroll({
  instructorId,
  locale,
}: {
  instructorId: number;
  locale: PayrollLocale;
}) {
  const [selectedMonth, setSelectedMonth] = useState(() =>
    getCurrentJstMonth(),
  );
  const [requestedMonth, setRequestedMonth] = useState(() =>
    getCurrentJstMonth(),
  );
  const [payroll, setPayroll] = useState<InstructorPayrollResponse | null>(
    null,
  );
  const [error, setError] = useState<InstructorPayrollApiError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    const loadPayroll = async () => {
      setIsLoading(true);
      const response = await getInstructorPayroll(instructorId, requestedMonth);

      if (!isMounted) {
        return;
      }

      if ("status" in response) {
        setPayroll(null);
        setError(response);
      } else {
        setPayroll(response);
        setError(null);
      }

      setIsLoading(false);
    };

    loadPayroll();

    return () => {
      isMounted = false;
    };
  }, [instructorId, requestedMonth]);

  const handleMonthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedMonth(event.target.value);
    startTransition(() => {
      setRequestedMonth(event.target.value);
    });
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <section className={styles.container}>
      <header className={styles.pageHeader}>
        <input
          type="month"
          value={selectedMonth}
          onChange={handleMonthChange}
          className={styles.monthInput}
          aria-label={labels[locale].monthInput}
        />
      </header>

      {isPending && (
        <p className={styles.pendingMessage}>{labels[locale].loading}</p>
      )}

      {error ? (
        <div className={styles.errorBox}>
          <strong>{error.code}</strong>
          <p>{error.message}</p>
        </div>
      ) : payroll ? (
        <div className={styles.periodGrid}>
          {payroll.periods.map((period) => (
            <PeriodCard
              key={`${period.from}-${period.to}`}
              period={period}
              locale={locale}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
