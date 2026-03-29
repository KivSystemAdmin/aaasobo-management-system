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
import Modal from "@/components/elements/modal/Modal";
import InputField from "@/components/elements/inputField/InputField";

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
  year: number;
  month: string;
  trialLessons: number;
  regularLessons: number;
  cancelLessons: number;
  cancelWithoutNoticeLessons: number;
  attendanceRate: number;
};

type InstructorAttendanceItem = {
  id: number;
  nickname: string;
  imageUrl: string;
  englishBackgroundClass: "non-native" | "native-a" | "native-b";
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
  englishBackgroundClass,
}: {
  imageUrl: string;
  nickname: string;
  englishBackgroundClass: "non-native" | "native-a" | "native-b";
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
      className={`${styles.instructorAvatar} ${styles[englishBackgroundClass]}`}
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
  const [selectedInstructor, setSelectedInstructor] =
    useState<InstructorAttendanceItem | null>(null);
  const [instructorSearch, setInstructorSearch] = useState("");

  const normalizedSearch = instructorSearch.trim().toLowerCase();
  const filteredInstructors = instructorAttendance.filter((instructor) =>
    instructor.nickname.toLowerCase().includes(normalizedSearch),
  );

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

      <div className={styles.chartCard}>
        <h3>Instructor Class Attendance</h3>
        <InputField
          type="search"
          value={instructorSearch}
          onChange={(event) => setInstructorSearch(event.target.value)}
          className={styles.instructorSearchInput}
          placeholder="Search instructor name"
          required={false}
        />
        <div className={styles.instructorPickerScrollableArea}>
          <div className={styles.instructorPickerGrid}>
            {filteredInstructors.map((item) => (
              <button
                type="button"
                key={item.id}
                className={styles.instructorPickerItem}
                onClick={() => setSelectedInstructor(item)}
              >
                <InstructorAvatar
                  imageUrl={item.imageUrl}
                  nickname={item.nickname}
                  englishBackgroundClass={item.englishBackgroundClass}
                />
                <span>{item.nickname}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={Boolean(selectedInstructor)}
        onClose={() => setSelectedInstructor(null)}
        overlayClosable
      >
        {selectedInstructor ? (
          <div
            className={styles.modalCard}
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedInstructor.nickname} attendance details`}
          >
            <div className={styles.modalHeader}>
              <h3>
                Monthly Class Attendance Results ({selectedInstructor.nickname})
              </h3>
            </div>

            <div className={styles.attendanceTableWrapper}>
              <table className={styles.attendanceTable}>
                <thead>
                  <tr>
                    <th>Year</th>
                    <th>Month</th>
                    <th>Trial</th>
                    <th>Regular</th>
                    <th>Cancel</th>
                    <th>Cancel Without Notice</th>
                    <th>Attendance Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInstructor.monthly.map((monthItem) => (
                    <tr key={`${monthItem.year}-${monthItem.month}`}>
                      <td>{monthItem.year}</td>
                      <td>{monthItem.month}</td>
                      <td>{monthItem.trialLessons}</td>
                      <td>{monthItem.regularLessons}</td>
                      <td>{monthItem.cancelLessons}</td>
                      <td>{monthItem.cancelWithoutNoticeLessons}</td>
                      <td>{monthItem.attendanceRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>

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
