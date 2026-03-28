"use client";

import { useState } from "react";
import Image from "next/image";
import {
  UserIcon,
  UsersIcon,
  UserGroupIcon,
  MegaphoneIcon,
} from "@heroicons/react/24/outline";
import styles from "./DashboardClient.module.scss";
import { defaultUserImageUrl } from "@/lib/data/data";

type DashboardMetric = {
  totalCustomers: number;
  totalChildren: number;
  instructorsByEnglishBackground: {
    nonNative: number;
    nativeA: number;
    nativeB: number;
  };
};

type MonthlyData = {
  month: string;
  value: number;
};

type InstructorAttendanceMonthly = {
  month: string;
  bookedLessons: number;
  completedLessons: number;
  canceledByCustomerLessons: number;
  canceledByInstructorLessons: number;
  attendanceRate: number;
};

type InstructorAttendanceItem = {
  id: number;
  nickname: string;
  imageUrl: string;
  monthly: InstructorAttendanceMonthly[];
};

type MessageTarget = "customers" | "instructors" | "both";

type MessageItem = {
  id: string;
  target: MessageTarget;
  body: string;
  createdAt: string;
};

function InstructorAvatar({
  imageUrl,
  nickname,
}: {
  imageUrl: string;
  nickname: string;
}) {
  const [imageError, setImageError] = useState(false);
  const safeSrc =
    imageError || !imageUrl.trim() ? defaultUserImageUrl : imageUrl;

  return (
    <Image
      src={safeSrc}
      alt={nickname}
      width={48}
      height={48}
      unoptimized
      className={styles.instructorAvatar}
      onError={() => setImageError(true)}
    />
  );
}

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
              <span className={styles.barValue}>{item.value}</span>
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

export default function DashboardClient({
  metrics,
  monthRangeLabel,
  newCustomersByMonth,
  churnCustomersByMonth,
  instructorAttendance,
}: {
  metrics: DashboardMetric;
  monthRangeLabel: string;
  newCustomersByMonth: MonthlyData[];
  churnCustomersByMonth: MonthlyData[];
  attendanceByMonth: MonthlyData[];
  instructorAttendance: InstructorAttendanceItem[];
}) {
  const [target, setTarget] = useState<MessageTarget>("customers");
  const [message, setMessage] = useState("");
  const [recentMessages, setRecentMessages] = useState<MessageItem[]>([]);
  const [feedback, setFeedback] = useState("");
  const chartWidth = 720;
  const chartHeight = 220;
  const chartPadding = 20;

  const attendancePoints = attendanceByMonth.map((item, index) => {
    const x =
      chartPadding +
      (index * (chartWidth - chartPadding * 2)) /
        Math.max(attendanceByMonth.length - 1, 1);
    const y =
      chartHeight -
      chartPadding -
      (Math.min(item.value, 100) * (chartHeight - chartPadding * 2)) / 100;
    return { ...item, x, y };
  });

  const attendancePolyline = attendancePoints
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

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
          <UserGroupIcon className={styles.kpiIcon} />
          <div className={styles.instructorKpiContent}>
            <p>Total Instructors</p>
            <strong>
              {metrics.instructorsByEnglishBackground.nonNative +
                metrics.instructorsByEnglishBackground.nativeA +
                metrics.instructorsByEnglishBackground.nativeB}
            </strong>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <UserGroupIcon className={styles.kpiIcon} />
          <div className={styles.instructorKpiContent}>
            <p>Non-Native</p>
            <strong>{metrics.instructorsByEnglishBackground.nonNative}</strong>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <UsersIcon className={styles.kpiIcon} />
          <div className={styles.instructorKpiContent}>
            <p>Native A</p>
            <strong>{metrics.instructorsByEnglishBackground.nativeA}</strong>
          </div>
        </article>
        <article className={styles.kpiCard}>
          <UserIcon className={styles.kpiIcon} />
          <div className={styles.instructorKpiContent}>
            <p>Native B</p>
            <article>
              <strong>{metrics.instructorsByEnglishBackground.nativeB}</strong>
            </article>
          </div>
        </article>
      </div>

      <div className={styles.twoColumnCharts}>
        <SimpleBarChart
          title={`New Customers (${monthRangeLabel})`}
          data={newCustomersByMonth}
          color="blue"
        />
        <SimpleBarChart
          title={`Customer Churn (${monthRangeLabel})`}
          data={churnCustomersByMonth}
          color="pink"
        />
      </div>

      <div className={`${styles.chartCard} ${styles.attendanceChart}`}>
        <h3>Instructor Lesson Report</h3>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          role="img"
          aria-label="Instructor Lesson Report"
        >
          <line
            x1={chartPadding}
            y1={chartHeight - chartPadding}
            x2={chartWidth - chartPadding}
            y2={chartHeight - chartPadding}
            className={styles.axisLine}
          />
          <line
            x1={chartPadding}
            y1={chartPadding}
            x2={chartPadding}
            y2={chartHeight - chartPadding}
            className={styles.axisLine}
          />
          <polyline points={attendancePolyline} className={styles.linePath} />
          {attendancePoints.map((point) => (
            <circle
              key={point.month}
              cx={point.x}
              cy={point.y}
              r="4"
              className={styles.linePoint}
            />
          ))}
          {[0, 25, 50, 75, 100].map((tick) => {
            const y =
              chartHeight -
              chartPadding -
              (tick * (chartHeight - chartPadding * 2)) / 100;
            return (
              <text key={tick} x={4} y={y + 4} className={styles.tickLabel}>
                {tick}%
              </text>
            );
          })}
        </svg>
        <div className={styles.monthLabels}>
          {attendanceByMonth.map((item) => (
            <span key={item.month}>{item.month}</span>
          ))}
        </div>
      </div>

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
