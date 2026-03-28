"use client";

import { useMemo, useState } from "react";
import {
  UsersIcon,
  UserGroupIcon,
  CheckCircleIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import styles from "./DashboardClient.module.scss";

type DashboardMetric = {
  totalCustomers: number;
  totalChildren: number;
  attendanceRateThisMonth: number;
};

type MonthlyData = {
  month: string;
  value: number;
};

type MessageTarget = "customers" | "instructors" | "both";

type MessageItem = {
  id: string;
  target: MessageTarget;
  body: string;
  createdAt: string;
};

function SimpleBarChart({
  title,
  data,
  color,
}: {
  title: string;
  data: MonthlyData[];
  color: "blue" | "pink";
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);

  return (
    <div className={styles.chartCard}>
      <h3>{title}</h3>
      <div className={styles.barChart}>
        {data.map((item) => {
          const normalizedHeight =
            item.value === 0 ? 0 : Math.max((item.value / maxValue) * 100, 4);
          const height = `${normalizedHeight}%`;
          return (
            <div key={item.month} className={styles.barItem}>
              <div
                className={`${styles.bar} ${
                  color === "blue" ? styles.barBlue : styles.barPink
                }`}
                style={{ height }}
                title={`${item.month}: ${item.value}`}
                aria-label={`${item.month}: ${item.value}`}
              />
              <span>{item.month}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SimpleLineChart({
  title,
  data,
}: {
  title: string;
  data: MonthlyData[];
}) {
  const width = 720;
  const height = 220;
  const padding = 20;

  const points = data.map((item, index) => {
    const x =
      padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y =
      height -
      padding -
      (Math.min(item.value, 100) * (height - padding * 2)) / 100;
    return { ...item, x, y };
  });

  const polyline = points.map((point) => `${point.x},${point.y}`).join(" ");

  return (
    <div className={`${styles.chartCard} ${styles.attendanceChart}`}>
      <h3>{title}</h3>
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          className={styles.axisLine}
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          className={styles.axisLine}
        />
        <polyline points={polyline} className={styles.linePath} />
        {points.map((point) => (
          <circle
            key={point.month}
            cx={point.x}
            cy={point.y}
            r="4"
            className={styles.linePoint}
          />
        ))}
        {[0, 25, 50, 75, 100].map((tick) => {
          const y = height - padding - (tick * (height - padding * 2)) / 100;
          return (
            <text key={tick} x={4} y={y + 4} className={styles.tickLabel}>
              {tick}%
            </text>
          );
        })}
      </svg>
      <div className={styles.monthLabels}>
        {data.map((item) => (
          <span key={item.month}>{item.month}</span>
        ))}
      </div>
    </div>
  );
}

export default function DashboardClient({
  metrics,
  newCustomersByMonth,
  churnCustomersByMonth,
  attendanceByMonth,
}: {
  metrics: DashboardMetric;
  newCustomersByMonth: MonthlyData[];
  churnCustomersByMonth: MonthlyData[];
  attendanceByMonth: MonthlyData[];
}) {
  const [rangeMonths, setRangeMonths] = useState<6 | 12>(12);
  const [target, setTarget] = useState<MessageTarget>("customers");
  const [message, setMessage] = useState("");
  const [recentMessages, setRecentMessages] = useState<MessageItem[]>([]);
  const [feedback, setFeedback] = useState("");

  const visibleData = useMemo(() => {
    const pick = <T extends MonthlyData>(data: T[]) => data.slice(-rangeMonths);
    return {
      newCustomers: pick(newCustomersByMonth),
      churn: pick(churnCustomersByMonth),
      attendance: pick(attendanceByMonth),
    };
  }, [
    rangeMonths,
    newCustomersByMonth,
    churnCustomersByMonth,
    attendanceByMonth,
  ]);

  const submitMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!message.trim()) {
      setFeedback("Please enter a message before sending.");
      return;
    }

    const item: MessageItem = {
      id: crypto.randomUUID(),
      target,
      body: message.trim(),
      createdAt: new Date().toISOString(),
    };

    setRecentMessages((prev) => [item, ...prev].slice(0, 8));
    setMessage("");
    setFeedback("✅ Message sent successfully.");
  };

  return (
    <section className={styles.dashboardContainer}>
      <header className={styles.headerArea}>
        <h1>Dashboard</h1>
        <div className={styles.rangeToggle}>
          <button
            type="button"
            onClick={() => setRangeMonths(6)}
            className={rangeMonths === 6 ? styles.activeRange : ""}
          >
            Last 6 months
          </button>
          <button
            type="button"
            onClick={() => setRangeMonths(12)}
            className={rangeMonths === 12 ? styles.activeRange : ""}
          >
            Last 12 months
          </button>
        </div>
      </header>

      <div className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <UsersIcon className={styles.kpiIcon} />
          <div>
            <p>Total Customers</p>
            <strong>{metrics.totalCustomers}</strong>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <UserGroupIcon className={styles.kpiIcon} />
          <div>
            <p>Total Children</p>
            <strong>{metrics.totalChildren}</strong>
          </div>
        </article>

        <article className={styles.kpiCard}>
          <CheckCircleIcon className={styles.kpiIcon} />
          <div>
            <p>Instructor Attendance</p>
            <strong>{metrics.attendanceRateThisMonth}%</strong>
            <small>(this month)</small>
          </div>
        </article>
      </div>

      <div className={styles.twoColumnCharts}>
        <SimpleBarChart
          title="New Customers (Monthly)"
          data={visibleData.newCustomers}
          color="blue"
        />
        <SimpleBarChart
          title="Customer Churn (Monthly)"
          data={visibleData.churn}
          color="pink"
        />
      </div>

      <SimpleLineChart
        title="Instructor Attendance Rate (Monthly %)"
        data={visibleData.attendance}
      />

      <div className={styles.messageBoardCard}>
        <div className={styles.messageHeader}>
          <h2>
            <MegaphoneIcon className={styles.messageIcon} /> Message Board
          </h2>
        </div>

        <div className={styles.messageBoardContent}>
          <form onSubmit={submitMessage} className={styles.messageForm}>
            <div className={styles.segmentedControl}>
              {(["customers", "instructors", "both"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  className={target === option ? styles.activeTarget : ""}
                  onClick={() => setTarget(option)}
                >
                  {option[0].toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={4}
              placeholder="Write a message for your selected audience..."
            />
            <div className={styles.messageActions}>
              {feedback ? <p>{feedback}</p> : null}
              <button type="submit">Send</button>
            </div>
          </form>

          <aside className={styles.messageHistory}>
            <h3>Recent Messages</h3>
            {recentMessages.length === 0 ? (
              <p className={styles.emptyText}>
                No messages sent in this session yet.
              </p>
            ) : (
              <ul>
                {recentMessages.map((item) => (
                  <li key={item.id}>
                    <strong>{item.target}</strong>
                    <p>{item.body}</p>
                    <time>{new Date(item.createdAt).toLocaleString()}</time>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
